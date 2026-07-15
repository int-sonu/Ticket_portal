import { useMemo, useState } from "react";
import { Button, Empty, Spin } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

import { billingApis } from "../../Axios/BillingApis";
import { agentApis } from "../../Axios/MasterApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import DateFilterIconPopover from "../../ui/CalendarPopup/DateFilterIconPopover";
import year from "../../assets/icons/year.svg";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import AgentSelectorModal from "./AgentSelectorModal";

type RecordLike = Record<string, any>;
type AgentOption = { label: string; value: string; role: string };

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

  const { data: logResponse, isLoading, isFetching } = useQuery({
    queryKey: ["travel-log-list", listPayload],
    queryFn: () => billingApis.travelLogList(listPayload),
    enabled: !!listPayload.nCompanyId && !!listPayload.cAgentId,
  });

  const rows = useMemo(
    () => extractRows(logResponse?.data ?? logResponse ?? {}),
    [logResponse],
  );

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

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
        <div className="grid min-w-[820px] grid-cols-[70px_140px_1.2fr_1.2fr_130px_120px] border-b border-slate-100 px-4 py-4 text-[13px] font-medium text-slate-700">
          <div>Srl</div><div>Date</div><div>Start Location</div><div>End Location</div><div>Travelled Km</div><div>Expense</div>
        </div>
        <Spin spinning={isLoading || isFetching}>
          {rows.length ? (
            <div className="max-h-[calc(100vh-220px)] overflow-auto">
              {rows.map((row, index) => (
                <div key={String(getValue(row, ["nTravelLogId", "id"]) || index)} className="grid min-w-[820px] grid-cols-[70px_140px_1.2fr_1.2fr_130px_120px] border-b border-slate-50 px-4 py-4 text-[13px] text-slate-700">
                  <div>{index + 1}</div>
                  <div>{text(getValue(row, ["dDate", "cDate", "Date", "dCreatedDate"]), "-")}</div>
                  <div>{text(getValue(row, ["cStartingLocation", "StartLocation", "cStartLocation"]), "-")}</div>
                  <div>{text(getValue(row, ["cCheckinLocation", "EndLocation", "cEndLocation"]), "-")}</div>
                  <div>{text(getValue(row, ["nTravelledKm", "nCalculatedDistance", "nDistance"]), "0")}</div>
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
    </section>
  );
};

export default TravelLogPage;
