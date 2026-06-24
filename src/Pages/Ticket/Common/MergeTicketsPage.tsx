import { Button, Empty, Modal, message, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import TicketPageShell from "./TicketPageShell";
import { getRequestPayload } from "../../../Utils/requestPayload";
import { useTicketActions } from "../../../Hooks/Ticket/useTicketActions";
import {
  useCustomerWiseActiveTicketList,
  useTicketView,
} from "../../../Hooks/Ticket/useTicketQueries";
import { extractList } from "../../Master/Common/SimpleMasterUtils";
import closeblack from "../../../assets/icons/close-black.svg";

const getFieldValue = (record: any, keys: string[]) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null) {
      return record[key];
    }
  }

  const recordKey = Object.keys(record || {}).find((item) =>
    keys.some((key) => key.toLowerCase() === item.toLowerCase()),
  );

  if (!recordKey) return "";

  return record?.[recordKey] ?? "";
};

const formatDisplayValue = (value: any): string => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    return value
      .map((item) => formatDisplayValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return (
      value?.name ??
      value?.label ??
      value?.title ??
      value?.text ??
      value?.value ??
      value?.cName ??
      value?.cTitle ??
      value?.cDescription ??
      value?.cViewSummary?? ""
    );
  }

  return String(value);
};

const parseTicketDate = (value: any): number | null => {
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }

  if (typeof value !== "string") return null;

  const text = value.trim();
  if (!text) return null;

  const dmYTimeMatch = text.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*([AP]M))?)?$/i,
  );

  if (dmYTimeMatch) {
    const [, dd, mm, yyyy, hh = "0", min = "0", meridiem] = dmYTimeMatch;
    let hour = Number(hh);
    const minute = Number(min);

    if (meridiem) {
      const upper = meridiem.toUpperCase();
      if (upper === "PM" && hour < 12) hour += 12;
      if (upper === "AM" && hour === 12) hour = 0;
    }

    const parsed = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      hour,
      minute,
      0,
      0,
    );
    const ms = parsed.getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  const fallback = Date.parse(text);
  return Number.isNaN(fallback) ? null : fallback;
};

const formatTicketAge = (createdDate: any, nowMs = Date.now()): string => {
  const createdMs = parseTicketDate(createdDate);

  if (createdMs === null) return "";

  const diffMs = Math.max(nowMs - createdMs, 0);
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return `${days} days ${hours} hr ${minutes} min`;
};

const formatTicketDateTime = (value: any) => {
  const parsed = parseTicketDate(value);

  if (parsed === null) {
    return String(value ?? "");
  }

  const date = new Date(parsed);
  const dateLabel = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeLabel = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${dateLabel} ${timeLabel}`;
};

const getTicketIdValue = (record: any) =>
  Number(
    getFieldValue(record, [
     
      "nTicketId",
      
    ]) || 0,
  );

const getTicketNoValue = (record: any, fallback = 0) =>
  Number(
    getFieldValue(record, [
      "nTicketNo",
      "TicketNo",
      "ticketNo",
      "cTicketNo",
      "cTicketNumber",
    ]) || fallback,
  );

const getTicketSummary = (record: any) =>
  formatDisplayValue(
    getFieldValue(record, [
      "cTicketSummary",
      "TicketSummary",
    ]),
  );

const getViewSummary = (record: any) =>
  formatDisplayValue(
    getFieldValue(record, [
      "cViewSummary",
      "ViewSummary",
    ]),
  );

const getCustomerName = (record: any) =>
  formatDisplayValue(
    getFieldValue(record, [
      "cCustomerName",
      "CustomerName",
      "customerName",
    ]),
  );

const getTicketStatusValue = (record: any) =>
  formatDisplayValue(
    getFieldValue(record, [
      "cTicketStatus",
      "cStatus",
    ]),
  );

const buildMergePayload = (
  sessionPayload: Record<string, any>,
  primaryTicketId: number,
  mergedTicketId: number,
  primaryTicketNo: number,
  mergedTicketNo: number,
) => {
  const nMergedBy = Number(sessionPayload?.nAgentId ?? sessionPayload?.id ?? 0);

  return {
    cDbName: sessionPayload?.cDbName,
    cSchemaName: sessionPayload?.cSchemaName,
    nCompanyId: sessionPayload?.nCompanyId,
    nMergedBy,
    nPrimaryTicketId: primaryTicketId,
    nMergedTicketId: mergedTicketId,
    nPrimaryTicketNo: primaryTicketNo,
    nMergedTicketNo: mergedTicketNo,
  };
};

const getErrorMessage = (error: any) => {
  const responseData = error?.response?.data;
  const validationErrors = responseData?.errors;

  if (validationErrors && typeof validationErrors === "object") {
    const messages = Object.values(validationErrors).reduce<string[]>(
      (allMessages, value) => {
        const nextValues = Array.isArray(value) ? value : [value];

        return allMessages.concat(
          nextValues.filter(Boolean).map((item) => String(item)),
        );
      },
      [],
    );

    if (messages.length > 0) {
      return messages.join(" | ");
    }
  }

  return (
    responseData?.message ||
    responseData?.title ||
    error?.message ||
    "Unable to process merge request"
  );
};

const MERGE_BANNER_STORAGE_KEY = "ticket_portal_merge_banner";

const getSelectedTicket = (state: any) => {
  const selectedRow = state?.selectedRow ?? state?.savedTicketRecord ?? {};

  const ticketId = Number(
    state?.ticketId ??
      selectedRow?.nTicketId ??
      selectedRow?.TicketId ??
      selectedRow?.ticketId ??
      0,
  );

  const ticketNo =
    formatDisplayValue(
      getFieldValue(selectedRow, [
        "TicketNo",
        "cTicketNo",
        "cTicketNumber",
        "nTicketNo",
      ]),
    ) || (ticketId ? String(ticketId) : "");

  return {
    ticketId,
    ticketNo,
    selectedRow,
  };
};

const MergeTicketsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as any) ?? {};

  const sessionPayload = useMemo(() => getRequestPayload(), []);
  const { ticketId: selectedTicketId, ticketNo, selectedRow } = useMemo(
    () => getSelectedTicket(state),
    [state],
  );

  const selectedCustomerId = Number(
    getFieldValue(selectedRow, [
      "nCustomerId",
      "CustomerId",
      "customerId",
    ]) || 0,
  );

  const currentTicketPayload = useMemo(
    () => ({
      ...sessionPayload,
      nCustomerId: selectedCustomerId,
      CustomerId: selectedCustomerId,
      customerId: selectedCustomerId,
    }),
    [selectedCustomerId, sessionPayload],
  );

  const { data: currentTicketData } = useTicketView(
    currentTicketPayload,
    selectedTicketId > 0,
  );

  const { mergeTicket, unMergeTicket } = useTicketActions();
  const [busyTicketId, setBusyTicketId] = useState<number | null>(null);
  const [mergedTicketIds, setMergedTicketIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [tick, setTick] = useState(() => Date.now());
  const [confirmMergeTarget, setConfirmMergeTarget] = useState<{
    ticketId: number;
    ticketNo: number;
  } | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const currentTicket = useMemo(() => {
    const candidate = currentTicketData?.data ?? currentTicketData ?? {};
    return {
      ...selectedRow,
      ...candidate,
    };
  }, [currentTicketData, selectedRow]);

  const customerId = Number(
    getFieldValue(currentTicket, [
      "nCustomerId",
      "CustomerId",
      "customerId",
    ]) || 0,
  );

  const customerWisePayload = useMemo(
    () => ({
      ...sessionPayload,
      pageNumber: 1,
      pageSize: 1000,
      nCustomerId: customerId,
      CustomerId: customerId,
      customerId,
    }),
    [customerId, sessionPayload],
  );

  const { data: activeTicketData, isLoading: isActiveTicketsLoading } =
    useCustomerWiseActiveTicketList(customerWisePayload, Boolean(customerId));

  const ticketRows = useMemo(() => extractList(activeTicketData), [activeTicketData]);

  const currentTicketHeader =
    ticketNo ||
    formatDisplayValue(
      getFieldValue(currentTicket, [
        "TicketNo",
        "cTicketNo",
        "cTicketNumber",
        "nTicketNo",
      ]),
    ) ||
    (selectedTicketId ? `#${selectedTicketId}` : "");

  const primaryTicketNo = useMemo(
    () => getTicketNoValue(currentTicket, selectedTicketId),
    [currentTicket, selectedTicketId],
  );

  const visibleTickets = useMemo(
    () =>
      ticketRows
        .map((row: any) => ({
          row,
          ticketId: getTicketIdValue(row),
          ticketNo: getTicketNoValue(row, getTicketIdValue(row)),
        }))
        .filter(({ ticketId }) => ticketId > 0 && ticketId !== selectedTicketId)
        .sort(
          (a: { ticketNo: number; ticketId: number }, b: { ticketNo: number; ticketId: number }) =>
            a.ticketNo - b.ticketNo || a.ticketId - b.ticketId,
        ),
    [selectedTicketId, ticketRows],
  );

  const handleMerge = (targetTicketId: number, targetTicketNo: number) => {
    if (!selectedTicketId || !targetTicketId) {
      message.error("Missing ticket details for merge");
      return;
    }

    setBusyTicketId(targetTicketId);
    mergeTicket.mutate(
      buildMergePayload(
        sessionPayload,
        selectedTicketId,
        targetTicketId,
        primaryTicketNo,
        targetTicketNo,
      ) as any,
      {
        onSuccess: () => {
          setMergedTicketIds((prev: Set<number>) => {
            const next = new Set(prev);
            next.add(targetTicketId);
            return next;
          });
          sessionStorage.setItem(
            MERGE_BANNER_STORAGE_KEY,
            JSON.stringify({
              text: `Merged : Ticket No. ${targetTicketNo} Into Ticket No. ${primaryTicketNo}`,
              primaryTicketId: selectedTicketId,
              mergedTicketId: targetTicketId,
              primaryTicketNo,
              mergedTicketNo: targetTicketNo,
            }),
          );
          message.success("Ticket merged successfully");
          setBusyTicketId(null);
          setConfirmMergeTarget(null);
          navigate(-1);
        },
        onError: (error: any) => {
          message.error(getErrorMessage(error));
          setBusyTicketId(null);
        },
      },
    );
  };

  const handleUnmerge = (targetTicketId: number, targetTicketNo: number) => {
    if (!selectedTicketId || !targetTicketId) {
      message.error("Missing ticket details for unmerge");
      return;
    }

    setBusyTicketId(targetTicketId);
    unMergeTicket.mutate(
      buildMergePayload(
        sessionPayload,
        selectedTicketId,
        targetTicketId,
        primaryTicketNo,
        targetTicketNo,
      ) as any,
      {
        onSuccess: () => {
          setMergedTicketIds((prev: Set<number>) => {
            const next = new Set(prev);
            next.delete(targetTicketId);
            return next;
          });
          message.success("Ticket unmerged successfully");
          setBusyTicketId(null);
        },
        onError: (error: any) => {
          message.error(getErrorMessage(error));
          setBusyTicketId(null);
        },
      },
    );
  };

  const isLoading = isActiveTicketsLoading && !ticketRows.length;

  return (
    <TicketPageShell contentClassName="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-full min-h-0 flex-col rounded-none bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h1 className="text-2xl font-medium leading-none text-slate-900">
              Merge Tickets
            </h1>
          </div>
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-900 hover:bg-slate-100"
          >
            <img src={closeblack} alt="" className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="bg-sky-50 px-4 py-3 text-slate-700">
          <div className="text-sm font-medium text-slate-900">
            Select a Ticket to Merge with Ticket Id {currentTicketHeader}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Selected Ticket Will Non Longer be Active for Further Follow up
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
          {isLoading ? (
            <div className="flex h-full min-h-[280px] items-center justify-center">
              <Spin size="large" />
            </div>
          ) : visibleTickets.length ? (
            <div className="space-y-3">
              {visibleTickets.map(
                ({ row, ticketId }: { row: any; ticketId: number }) => {
                const ticketNoValue =
                  formatDisplayValue(
                    getFieldValue(row, [
                     
                      "cTicketNo",
                     
                    ]),
                  ) || String(ticketId);
                const customerName = getCustomerName(row) || "-";
                const mergedTicketNo = getTicketNoValue(row, ticketId);
                const summary = getTicketSummary(row) || "-";
                const createdDate = formatTicketDateTime(
                  getFieldValue(row, [
                   
                    "dCreatedDate",
                  
                  ]),
                );
                const createdBy = formatDisplayValue(
                  getFieldValue(row, [
                    "CreatedByName",
                    "cCreatedByName",
                    "AgentName",
                    "cAgentName",
                    "CreatedBy",
                    "cCreatedBy",
                  ]),
                );
                const viewSummary =
                  getViewSummary(row) ||
                  `Created by ${createdBy || "Testing Team"} on ${createdDate}`;
                const priority = formatDisplayValue(
                  getFieldValue(row, [
                    "Priority",
                    "PriorityName",
                    "cPriority",
                    "cPriorityName",
                    "nPriority",
                  ]),
                ) || "Medium";
                const status = getTicketStatusValue(row) || "Pending";
                const age = formatTicketAge(
                  getFieldValue(row, [
                 
                    "dCreatedDate",
                   
                  ]),
                  tick,
                );
                const isMerged = mergedTicketIds.has(ticketId);
                const actionLoading = busyTicketId === ticketId;

                  return (
                    <div
                      key={ticketId}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                    <div className="flex items-start justify-between gap-4 px-4 py-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-base font-medium text-slate-900">
                          {ticketNoValue}
                        </div>
                        <div className="text-sm text-slate-900 font-medium">
                          {customerName}
                        </div>
                          <div className="text-lg text-gray-600">
                          {summary}
                        </div>
                        <div className="text-sm text-slate-600">
                         <b> Description: </b>{summary}
                        </div>
                      </div>

                      <div className="shrink-0 text-right text-xs font-medium text-black">
                        Ticket Created on {createdDate}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-sky-50 px-4 py-3 h-20">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-xs text-orange-700">
                          <span className="h-2 w-2 rounded-full bg-orange-400" />
                          {priority}
                        </span>
                        <span className="inline-flex items-center rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs text-cyan-700">
                          {status}
                        </span>
                        <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700">
                          {age || "-"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 ">
                        <div className="text-xs text-slate-500 -mt-13  justify-end ">
                          {viewSummary}
                        </div>

                        <Button
                          type="primary"
                          loading={actionLoading}
                          onClick={() =>
                            isMerged
                              ? handleUnmerge(ticketId, mergedTicketNo)
                              : setConfirmMergeTarget({ ticketId, ticketNo: mergedTicketNo })
                          }
                          className={
                            isMerged
                              ? "!border-rose-500 !bg-white !text-rose-600 hover:!border-rose-600 hover:!text-rose-700"
                              : "!border-emerald-500 !bg-emerald-500 hover:!border-emerald-600 hover:!bg-emerald-600"
                          }
                        >
                          {isMerged ? "UnMerge" : "Merge"}
                        </Button>
                      </div>
                    </div>
                  </div>
                  );
                },
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
              <Empty description="No tickets available to merge" />
            </div>
          )}
        </div>
      </div>
      <Modal
        open={confirmMergeTarget !== null}
        centered
        footer={null}
        destroyOnClose
        closable={false}
        maskClosable={false}
        width={380}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-medium text-slate-900">Merge Tickets</div>
            <button
              type="button"
              aria-label="Close merge confirmation"
              onClick={() => setConfirmMergeTarget(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-900 hover:bg-slate-100"
            >
              <img src={closeblack} alt="" className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="border-t border-slate-200 pt-3 text-sm text-slate-600">
            Do You Wish to Merge Ticket No {confirmMergeTarget?.ticketNo || ""} into Ticket No. {primaryTicketNo}?
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button onClick={() => setConfirmMergeTarget(null)}>No</Button>
            <Button
              type="primary"
              loading={busyTicketId === confirmMergeTarget?.ticketId}
              className="!border-emerald-500 !bg-emerald-500 hover:!border-emerald-600 hover:!bg-emerald-600"
              onClick={() => {
                if (!confirmMergeTarget) return;
                handleMerge(confirmMergeTarget.ticketId, confirmMergeTarget.ticketNo);
              }}
            >
              Yes
            </Button>
          </div>
        </div>
      </Modal>
    </TicketPageShell>
  );
};

export default MergeTicketsPage;
