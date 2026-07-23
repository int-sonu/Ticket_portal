import { useMemo, useState, type ChangeEvent } from "react";
import { Button, Empty, Modal, Spin, message } from "antd";
import {
  DeleteOutlined,
  DownOutlined,
  PaperClipOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";

import { billingApis } from "../../Axios/BillingApis";
import { agentApis } from "../../Axios/MasterApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import DateFilterIconPopover from "../../ui/CalendarPopup/DateFilterIconPopover";
import year from "../../assets/icons/year.svg";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import AgentSelectorModal from "./AgentSelectorModal";
import { getApiImageBaseUrl } from "../../Axios/config";

type RecordLike = Record<string, any>;
type AgentOption = { label: string; value: string; role: string };
type AttachmentRecord = {
  id: number;
  name: string;
  url: string;
  raw: RecordLike;
};

const text = (value: unknown, fallback = "") => String(value ?? "").trim() || fallback;

const getValue = (record: RecordLike, keys: string[]) => {
  if (!record || typeof record !== "object") return "";
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  const matched = Object.keys(record).find((key) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
  );
  return matched ? record[matched] : "";
};

const extractRows = (response: unknown): RecordLike[] => {
  const direct = extractList(response);
  if (direct.length) return direct as RecordLike[];
  if (!response || typeof response !== "object") return [];
  const source = response as RecordLike;
  for (const nested of [
    source.data,
    source.result,
    source.items,
    source.list,
    source.TravelLogList,
    source.travelLogList,
  ]) {
    const rows = extractList(nested);
    if (rows.length) return rows as RecordLike[];
  }
  return [];
};

const ensureAbsoluteUrl = (value: unknown) => {
  const path = text(value).replace(/\\/g, "/");
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${getApiImageBaseUrl().replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
};

const extractAttachments = (value: unknown): AttachmentRecord[] => {
  const matches: AttachmentRecord[] = [];
  const visited = new Set<unknown>();

  const visit = (item: unknown, depth = 0) => {
    if (!item || typeof item !== "object" || depth > 7 || visited.has(item)) return;
    visited.add(item);

    if (Array.isArray(item)) {
      item.forEach((entry) => visit(entry, depth + 1));
      return;
    }

    const record = item as RecordLike;
    const id = Number(
      getValue(record, [
        "nAttachmentId",
        "AttachmentId",
        "attachmentId",
        "nTravelAttachmentId",
        "nTravelLogAttachmentId",
      ]),
    ) || 0;
    const rawUrl = getValue(record, [
      "cAttachmentPath",
      "AttachmentPath",
      "cFilePath",
      "FilePath",
      "filePath",
      "cFileUrl",
      "FileUrl",
      "url",
    ]);
    const url = ensureAbsoluteUrl(rawUrl);

    if (id || url) {
      matches.push({
        id,
        name: text(
          getValue(record, [
            "cFileName",
            "FileName",
            "fileName",
            "cAttachmentName",
            "AttachmentName",
          ]),
          url.split("/").pop() || `Attachment ${id}`,
        ),
        url,
        raw: record,
      });
    }

    Object.values(record).forEach((child) => visit(child, depth + 1));
  };

  visit(value);
  const seen = new Set<string>();
  return matches.filter((attachment) => {
    const key = `${attachment.id}:${attachment.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getCurrentUserName = () => {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of ["userCredentials", "userSession"]) {
      try {
        const parsed = JSON.parse(storage.getItem(key) ?? "{}");
        const source = parsed?.data ?? parsed;
        const name = text(source?.cAgentName ?? source?.cName ?? source?.cUserName);
        if (name) return name;
      } catch {
        // Ignore malformed legacy session values.
      }
    }
  }
  return "Self";
};

const getAgentRole = (row: RecordLike) => {
  const explicitRole = text(getValue(row, ["cTypeName", "cUserType", "Role"]));
  if (explicitRole) return explicitRole;
  return Number(getValue(row, ["nType", "nUserType"])) === 2 ? "Supervisor" : "Agent";
};

const TravelLogPage = () => {
  const queryClient = useQueryClient();
  const basePayload = useMemo(() => getRequestPayload(), []);
  const currentUserName = useMemo(() => getCurrentUserName(), []);
  const currentAgentId = String(basePayload.nAgentId ?? basePayload.id ?? "");
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [draftDate, setDraftDate] = useState(selectedDate.toDate());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentOption>({
    label: currentUserName,
    value: currentAgentId,
    role: "Self",
  });
  const [selectedLog, setSelectedLog] = useState<RecordLike | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<number | null>(
    null,
  );

  const agentDropdownPayload = useMemo(() => ({
    nCompanyId: basePayload.nCompanyId,
    cSchemaName: basePayload.cSchemaName,
    cDbName: basePayload.cDbName,
  }), [basePayload]);

  const {
    data: agentResponse,
    isLoading: isAgentLoading,
    isFetching: isAgentFetching,
    refetch: refetchAgentDropdown,
  } = useQuery({
    queryKey: ["travel-log-agent-dropdown", agentDropdownPayload],
    queryFn: () => agentApis.agentDropDown(agentDropdownPayload),
    enabled: !!basePayload.nCompanyId,
    refetchOnMount: "always",
  });

  const agentOptions = useMemo<AgentOption[]>(() => {
    const rows = extractRows(agentResponse?.data ?? agentResponse ?? {});
    const options = rows.map((row) => ({
      label: text(getValue(row, ["cAgentName", "AgentName", "cUserName", "Name"]), "Agent"),
      value: text(getValue(row, ["nAgentId", "AgentId", "id"])),
      role: getAgentRole(row),
    })).filter((option) => option.value);

    const self = { label: currentUserName, value: currentAgentId, role: "Self" };
    const seen = new Set<string>();
    return [self, ...options].filter((option) => {
      if (!option.value || seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    });
  }, [agentResponse, currentAgentId, currentUserName]);

  const visibleAgents = useMemo(() => {
    const search = agentSearch.trim().toLowerCase();
    if (!search) return agentOptions;
    return agentOptions.filter((agent) =>
      `${agent.label} ${agent.role}`.toLowerCase().includes(search),
    );
  }, [agentOptions, agentSearch]);

  const listPayload = useMemo(() => ({
    cAgentId: selectedAgent.value,
    nCompanyId: basePayload.nCompanyId,
    dDate: selectedDate.format("YYYY-MM-DD"),
    nPageNo: 1,
    nPageSize: 1000,
    cSchemaName: basePayload.cSchemaName,
    cDbName: basePayload.cDbName,
    dFromDate: selectedDate.format("YYYY-MM-DD"),
    dToDate: selectedDate.format("YYYY-MM-DD"),
  }), [basePayload, selectedAgent.value, selectedDate]);

  const travelLogPayload = useMemo(
    () => ({
      cAgentId: selectedAgent.value,
      dDate: selectedDate.format("YYYY-MM-DD"),
      nCompanyId: basePayload.nCompanyId,
      cSchemaName: basePayload.cSchemaName,
      cDbName: basePayload.cDbName,
    }),
    [basePayload, selectedAgent.value, selectedDate],
  );

  const { data: travelLogResponse } = useQuery({
    queryKey: ["travel-log", travelLogPayload],
    queryFn: () => billingApis.travelLog(travelLogPayload),
    enabled: !!travelLogPayload.nCompanyId && !!travelLogPayload.cAgentId,
  });

  const { data: logResponse, isLoading, isFetching } = useQuery({
    queryKey: ["travel-log-list", listPayload],
    queryFn: () => billingApis.travelLogList(listPayload),
    enabled: !!listPayload.nCompanyId && !!listPayload.cAgentId,
  });

  const rows = useMemo(
    () => extractRows(logResponse?.data ?? logResponse ?? {}),
    [logResponse],
  );

  const selectedTicketId =
    Number(
      getValue(selectedLog ?? {}, [
        "nTicketId",
        "TicketId",
        "ticketId",
      ]),
    ) || 0;
  const selectedTravelExpenseId =
    Number(
      getValue(selectedLog ?? {}, [
        "nTravelExpenseId",
        "TravelExpenseId",
        "travelExpenseId",
        "nTravelLogId",
      ]),
    ) || 0;

  const ticketTravelPayload = useMemo(
    () => ({
      nAgentId: Number(selectedAgent.value) || 0,
      dDate: selectedDate.format("YYYY-MM-DD"),
      nTicketId: selectedTicketId,
      nCompanyId: basePayload.nCompanyId,
      cSchemaName: basePayload.cSchemaName,
      cDbName: basePayload.cDbName,
    }),
    [basePayload, selectedAgent.value, selectedDate, selectedTicketId],
  );

  const {
    data: ticketTravelResponse,
    isLoading: isTicketTravelLoading,
    refetch: refetchTicketTravel,
  } = useQuery({
    queryKey: ["ticket-travel-log-list", ticketTravelPayload],
    queryFn: () => billingApis.ticketTravelLogList(ticketTravelPayload),
    enabled: !!selectedLog && !!selectedTicketId && !!ticketTravelPayload.nCompanyId,
  });

  const ticketTravelRows = useMemo(
    () => extractRows(ticketTravelResponse?.data ?? ticketTravelResponse ?? {}),
    [ticketTravelResponse],
  );
  const attachmentSource =
    ticketTravelRows.length > 0
      ? ticketTravelRows
      : ticketTravelResponse ?? selectedLog;
  const attachments = useMemo(
    () => extractAttachments(attachmentSource),
    [attachmentSource],
  );

  const summaryRecord = useMemo(() => {
    const summaryRows = extractRows(
      travelLogResponse?.data ?? travelLogResponse ?? {},
    );
    return summaryRows[0] ?? (travelLogResponse?.data ?? travelLogResponse ?? {});
  }, [travelLogResponse]);

  const handleAttachmentUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    if (!selectedTravelExpenseId) {
      message.error("Travel expense id is missing.");
      return;
    }

    const formData = new FormData();
    formData.append("nCompanyId", String(basePayload.nCompanyId ?? 0));
    formData.append("cSchemaName", String(basePayload.cSchemaName ?? ""));
    formData.append("cDbName", String(basePayload.cDbName ?? ""));
    files.forEach((file) => formData.append("files", file, file.name));

    setIsUploading(true);
    try {
      await billingApis.travelLogModeAttachmentUpload(
        formData,
        selectedTravelExpenseId,
      );
      message.success("Attachment uploaded successfully.");
      await Promise.all([
        refetchTicketTravel(),
        queryClient.invalidateQueries({ queryKey: ["travel-log-list"] }),
        queryClient.invalidateQueries({ queryKey: ["travel-log"] }),
      ]);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to upload attachment.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDeleteAttachment = (attachment: AttachmentRecord) => {
    if (!attachment.id || !selectedTravelExpenseId) {
      message.error("Attachment details are missing.");
      return;
    }

    Modal.confirm({
      title: "Are you sure?",
      content: "Do you want to delete these records? This process cannot be undone.",
      okText: "Delete",
      cancelText: "Cancel",
      centered: true,
      width: 400,
      okButtonProps: {
        style: { backgroundColor: "#10b981", borderColor: "#10b981" },
      },
      cancelButtonProps: {
        style: { borderColor: "#10b981", color: "#10b981" },
      },
      onOk: async () => {
        setDeletingAttachmentId(attachment.id);
        try {
          const response = await billingApis.travelLogModeAttachmentDelete({
            nAttachmentIds: [attachment.id],
            nTravelExpenseId: selectedTravelExpenseId,
            cSchemaName: basePayload.cSchemaName,
            cDbName: basePayload.cDbName,
          });
          message.success(response?.message || "Attachment deleted successfully.");
          await refetchTicketTravel();
        } catch (error: any) {
          message.error(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to delete attachment.",
          );
          throw error;
        } finally {
          setDeletingAttachmentId(null);
        }
      },
    });
  };

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden p-5">
      <div className="flex flex-none items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-medium">Travel Log</h2>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setAgentSearch("");
              setExpandedAgentId(null);
              setAgentModalOpen(true);
              void refetchAgentDropdown();
            }}
            className="!flex !h-12 !min-w-[240px] !items-center !justify-between !rounded-lg !border-sky-200 !bg-sky-50 !px-3 !py-2 !shadow-sm"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-300 text-sm font-semibold">
                {(selectedAgent.label[0] || "S").toUpperCase()}
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="font-medium text-slate-700">{selectedAgent.label}</span>
                <span className="text-xs text-slate-500">{selectedAgent.role}</span>
              </span>
            </span>
            <DownOutlined className="text-[10px] text-slate-500" />
          </Button>

          <DateFilterIconPopover
            open={calendarOpen}
            iconSrc={year}
            alt="Open calendar"
            ariaLabel="Open travel log calendar"
            onOpenToggle={() => {
              setDraftDate(selectedDate.toDate());
              setCalendarOpen((current) => !current);
            }}
            month={draftDate}
            selectedDate={draftDate}
            onMonthChange={setDraftDate}
            onYearChange={setDraftDate}
            onSelectDate={(date) => {
              setDraftDate(date);
              setSelectedDate(dayjs(date));
              setCalendarOpen(false);
            }}
            onApply={() => {
              setSelectedDate(dayjs(draftDate));
              setCalendarOpen(false);
            }}
            onCancel={() => setCalendarOpen(false)}
          />
        </div>
      </div>

      <div className="grid flex-none grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-3">
          <div className="text-xs text-slate-500">Date</div>
          <div className="mt-1 font-medium text-slate-800">{selectedDate.format("DD/MM/YYYY")}</div>
        </div>
        <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-3">
          <div className="text-xs text-slate-500">Distance Travelled</div>
          <div className="mt-1 font-medium text-slate-800">
            {text(getValue(summaryRecord as RecordLike, ["nTravelledKm", "nCalculatedDistance", "nDistance", "TotalDistance"]), "0")} km
          </div>
        </div>
        <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-3">
          <div className="text-xs text-slate-500">Travel Expense</div>
          <div className="mt-1 font-medium text-slate-800">
            ₹{Number(getValue(summaryRecord as RecordLike, ["nAmount", "nExpenseAmount", "TotalExpense"]) || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
        <div className="grid min-w-[900px] grid-cols-[60px_120px_1.2fr_1.2fr_110px_110px_90px] border-b border-slate-100 px-4 py-4 text-[13px] font-medium text-slate-700">
          <div>Srl</div><div>Date</div><div>Start Location</div><div>End Location</div><div>Travelled Km</div><div>Action</div><div>Expense</div>
        </div>
        <Spin spinning={isLoading || isFetching}>
          {rows.length ? (
            <div className="max-h-[calc(100vh-220px)] overflow-auto">
              {rows.map((row, index) => (
                <div key={String(getValue(row, ["nTravelLogId", "id"]) || index)} className="grid min-w-[900px] grid-cols-[60px_120px_1.2fr_1.2fr_110px_110px_90px] items-center border-b border-slate-50 px-4 py-4 text-[13px] text-slate-700">
                  <div>{index + 1}</div>
                  <div>{text(getValue(row, ["dDate", "cDate", "Date", "dCreatedDate"]), "-")}</div>
                  <div>{text(getValue(row, ["cStartingLocation", "StartLocation", "cStartLocation"]), "-")}</div>
                  <div>{text(getValue(row, ["cCheckinLocation", "EndLocation", "cEndLocation"]), "-")}</div>
                  <div>{text(getValue(row, ["nTravelledKm", "nCalculatedDistance", "nDistance"]), "0")}</div>
                  <div>
                    <Button size="small" type="link" onClick={() => setSelectedLog(row)}>
                      Details
                    </Button>
                  </div>
                  <div>₹{Number(getValue(row, ["nAmount", "nExpenseAmount", "Expense"]) || 0).toFixed(2)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[330px] items-center justify-center"><Empty description="No data" /></div>
          )}
        </Spin>
      </div>

      <AgentSelectorModal
        open={agentModalOpen}
        loading={isAgentLoading || isAgentFetching}
        options={visibleAgents}
        selectedValue={selectedAgent.value}
        search={agentSearch}
        expandedAgentId={expandedAgentId}
        selfOption={{
          label: currentUserName,
          value: currentAgentId,
          role: "Self",
          isSelf: true,
        }}
        onSearch={setAgentSearch}
        onSelect={(agent) => {
          setSelectedAgent({ label: agent.label, value: agent.value, role: agent.role || "Agent" });
          setAgentModalOpen(false);
        }}
        onExpandedChange={setExpandedAgentId}
        onClose={() => {
          setAgentModalOpen(false);
          setExpandedAgentId(null);
        }}
      />

      <Modal
        open={!!selectedLog}
        title="Travel Log Details"
        onCancel={() => setSelectedLog(null)}
        footer={null}
        width={760}
        destroyOnHidden
      >
        <Spin spinning={isTicketTravelLoading}>
          <div className="space-y-4">
            <div className="grid gap-3 rounded-lg bg-sky-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <span className="font-medium text-slate-800">Ticket No: </span>
                {text(getValue(selectedLog ?? {}, ["nTicketNo", "TicketNo", "nTicketId", "TicketId"]), "-")}
              </div>
              <div>
                <span className="font-medium text-slate-800">Date: </span>
                {text(getValue(selectedLog ?? {}, ["dDate", "cDate", "Date", "dCreatedDate"]), selectedDate.format("DD/MM/YYYY"))}
              </div>
              <div>
                <span className="font-medium text-slate-800">Start Location: </span>
                {text(getValue(selectedLog ?? {}, ["cStartingLocation", "StartLocation", "cStartLocation"]), "-")}
              </div>
              <div>
                <span className="font-medium text-slate-800">End Location: </span>
                {text(getValue(selectedLog ?? {}, ["cCheckinLocation", "EndLocation", "cEndLocation"]), "-")}
              </div>
            </div>

            {ticketTravelRows.length > 0 ? (
              <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200">
                {ticketTravelRows.map((row, index) => (
                  <div
                    key={String(getValue(row, ["nTravelLogId", "nTravelExpenseId", "id"]) || index)}
                    className="grid grid-cols-[44px_1fr_1fr] gap-3 border-b border-slate-100 px-3 py-3 text-sm last:border-b-0"
                  >
                    <span>{index + 1}</span>
                    <span>{text(getValue(row, ["cStartingLocation", "StartLocation", "cStartLocation"]), "-")}</span>
                    <span>{text(getValue(row, ["cCheckinLocation", "EndLocation", "cEndLocation"]), "-")}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <div className="text-base font-medium text-slate-900">Attachments</div>
              <label
                className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-emerald-500 px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 ${
                  isUploading || !selectedTravelExpenseId ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <UploadOutlined />
                {isUploading ? "Uploading..." : "Upload Files"}
                <input type="file" multiple className="hidden" onChange={handleAttachmentUpload} />
              </label>
            </div>

            {attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={`${attachment.id}-${attachment.url}`}
                    className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
                  >
                    <a
                      href={attachment.url || undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-w-0 items-center gap-2 text-sky-600"
                    >
                      <PaperClipOutlined />
                      <span className="truncate">{attachment.name}</span>
                    </a>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      loading={deletingAttachmentId === attachment.id}
                      onClick={() => confirmDeleteAttachment(attachment)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No attachments" />
            )}
          </div>
        </Spin>
      </Modal>
    </section>
  );
};

export default TravelLogPage;
