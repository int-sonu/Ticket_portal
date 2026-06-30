import { Button, Card, Empty, Spin } from "antd";
import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { callReportApis } from "../../../Axios/CallReportApis";
import { ticketApis } from "../../../Axios/TicketsApi";
import { useTicketHistory } from "../../../Hooks/Ticket/useTicketQueries";
import { getConfig } from "../../../Axios/config";
import { getRequestPayload } from "../../../Utils/requestPayload";
import { extractList } from "../../Master/Common/SimpleMasterUtils";
import CallReportHistoryModal from "../../CallReport/CallReportHistoryModal";
import clockgrey from "../../../Assets/icons/clock-grey.svg";
import pdfIcon from "../../../assets/icons/pdfIcon.png";
interface Props {
  ticketId?: number;
  customerId?: number;
  customerName?: string;
  onOpenCallReport?: (state: Record<string, any>) => void;
}

const formatText = (value: any) => {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  return text === "0" || text === "undefined" || text === "null" ? "" : text;
};

const getFieldValue = (item: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
};

const resolvePdfUrl = (value: string) => {
  if (!value) return "";

  const text = String(value).trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;

  const apiBaseUrl = getConfig().API_BASE_URL.replace(/\/$/, "");
  const apiOrigin = (() => {
    try {
      const parsed = new URL(apiBaseUrl);
      return parsed.origin;
    } catch {
      return apiBaseUrl.replace(/\/Api\/V1\/?$/i, "").replace(/\/$/, "");
    }
  })();

  return `${apiOrigin}/${text.replace(/^\//, "")}`;
};

const isPdfPathLike = (value: any) => {
  const text = String(value ?? "").trim();
  if (!text) return false;

  return (
    /\.pdf(\?.*)?$/i.test(text) ||
    text.includes("/Uploads/") ||
    text.includes("\\Uploads\\") ||
    text.toLowerCase().includes("pdf")
  );
};

const getPdfExtension = (value: string) => {
  const text = String(value ?? "").trim();
  if (!text) return ".pdf";

  const withoutQuery = text.split("?")[0];
  const fileName = withoutQuery.split("/").pop() || "";
  const match = fileName.match(/\.[a-z0-9]+$/i);
  return match?.[0] || ".pdf";
};

const pickHistoryList = (response: any) => {
  const rows = extractList(response);
  if (rows.length > 0) return rows;

  const candidates = [
    response?.Data,
    response?.data,
    response?.Result,
    response?.result,
    response?.History,
    response?.history,
    response?.TicketHistory,
    response?.ticketHistory,
    response?.data?.Data,
    response?.data?.data,
    response?.data?.Result,
    response?.data?.result,
    response?.data?.History,
    response?.data?.history,
    response?.data?.TicketHistory,
    response?.data?.ticketHistory,
    response?.data?.HistoryList,
    response?.data?.CallHistory,
    response?.data?.CallHistoryList,
    response?.HistoryList,
    response?.CallHistory,
    response?.CallHistoryList,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  const deepSearch = (value: any, seen = new Set<any>()): any[] => {
    if (!value || typeof value !== "object" || seen.has(value)) return [];
    seen.add(value);

    for (const entry of Object.values(value)) {
      if (Array.isArray(entry)) return entry;
      if (entry && typeof entry === "object") {
        const nested = deepSearch(entry, seen);
        if (nested.length > 0) return nested;
      }
    }

    return [];
  };

  return deepSearch(response);
};

const getHistorySortValue = (item: Record<string, any>) => {
  const rawValue =
    item.dSortDate ??
    item.SortDate ??
    item.dCreatedDate ??
    item.CreatedDate ??
    item.CreatedOn ??
    item.CreatedDateTime ??
    item.dCreatedOn ??
    item.Date ??
    item.cDate ??
    item.Time ??
    "";

  const parsed = new Date(String(rawValue));
  const ms = parsed.getTime();

  return Number.isNaN(ms) ? 0 : ms;
};

const formatDateLabel = (value: any) => {
  const text = formatText(value);
  if (!text) return "";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getHistoryTitle = (item: Record<string, any>) =>
  formatText(
    item.cViewSummary ??
      item.ViewSummary ??
      item.ViewSummaryName ??
      item.Action ??
      item.action ??
      item.Event ??
      item.event ??
      item.Activity ??
      item.activity ??
      item.Title ??
      item.title ??
      item.Status ??
      item.cAction ??
      item.cActivity ??
      "History",
  );

const getHistoryActor = (item: Record<string, any>) =>
  formatText(
    item.CreatedByName ??
      item.cCreatedByName ??
      item.UserName ??
      item.cUserName ??
      item.AgentName ??
      item.cAgentName ??
      item.CreatedBy ??
      item.cCreatedBy ??
      item.nCreatedBy,
  );

const getHistoryRemarks = (item: Record<string, any>) =>
  formatText(
    item.Remarks ??
      item.Remark ??
      item.Comment ??
      item.Comments ??
      item.Description ??
      item.cDescription ??
      item.Note ??
      item.cNote ??
      item.Details ??
      item.details ??
      item.Message ??
      item.message ??
      item.ActivityDetails ??
      item.CallSummary ??
      item.cCallSummary ??
      item.cViewSummary ??
      "",
  );

const getHistoryDescription = (item: Record<string, any>) =>
  formatText(
    getFieldValue(item, [
      "cDescription",
      "Description",
      "cComments",
      "Comments",
      "Comment",
      "Remarks",
      "Remark",
      "cNote",
      "Note",
      "CallSummary",
      "cCallSummary",
    ]),
  );

const isCallReportHistoryItem = (item: Record<string, any>) => {
  const title = getHistoryTitle(item).toLowerCase();
  const historySummary = formatText(
    getFieldValue(item, ["cHistorySummary", "HistorySummary", "cViewSummary", "ViewSummary"]),
  ).toLowerCase();
  const typeValue = Number(getFieldValue(item, ["nType", "Type", "type"]) || 0);

  return typeValue === 2 || title.includes("callreport") || historySummary.includes("callreport");
};

const getCallReportId = (item: Record<string, any>) =>
  Number(
    getFieldValue(item, [
      "nCallReportId",
      "CallReportId",
      "nFollowupId",
      "nFollowUpId",
      "nWorksheetId",
      "WorksheetId",
      "nId",
      "Id",
      "id",
    ]) || 0,
  );

const TicketHistory = ({ ticketId, customerId, customerName, onOpenCallReport }: Props) => {
  const params = useParams();
  const navigate = useNavigate();
  const resolvedTicketId = Number(ticketId ?? params.id ?? 0);
  const sessionPayload = getRequestPayload();
  const [openingCallReportId, setOpeningCallReportId] = useState<number | null>(null);
  const [localCallReportState, setLocalCallReportState] = useState<Record<string, any> | null>(null);

  const requestPayload = useMemo(
    () => ({
      nTicketId: resolvedTicketId,
      nCompanyId: sessionPayload.nCompanyId,
      cSchemaName: sessionPayload.cSchemaName,
      cDbName: sessionPayload.cDbName,
    }),
    [
      resolvedTicketId,
      sessionPayload.cDbName,
      sessionPayload.cSchemaName,
      sessionPayload.nCompanyId,
    ],
  );

  const enabled =
    !!requestPayload.nTicketId &&
    !!requestPayload.nCompanyId &&
    !!requestPayload.cSchemaName &&
    !!requestPayload.cDbName;

  const { data, isLoading } = useTicketHistory(requestPayload, enabled);

  const historyItems = useMemo(() => {
    const rows = pickHistoryList(data);

    return [...rows].sort(
      (a: Record<string, any>, b: Record<string, any>) =>
        getHistorySortValue(b) - getHistorySortValue(a),
    );
  }, [data]);

  return (
    <Spin spinning={isLoading}>
      <Card
        bordered
        className="border-slate-200 shadow-sm"
        styles={{ body: { padding: 0 } }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="text-lg font-semibold text-slate-900">
            Call History
          </div>

          <Button 
            type="primary"
            style={{
              background: "#22c55e",
              borderColor: "#22c55e",
            }}
            className="h-9 rounded-md px-4 text-sm font-semibold shadow-sm"
            onClick={() => {
              navigate("/tickets/previoustickets", {
                state: {
                  customerId,
                  customerName,
                  returnTo: `/tickets/view/${ticketId}`,
                  isFrom: "history",
                  hideSkipButton: true,
                }
              });
            }}
          >
            Previous Tickets &gt;&gt;
          </Button>
        </div>

        <div className="px-4 py-4 sm:px-5">
          {historyItems.length > 0 ? (
            <div className="space-y-4">
              {historyItems.map((item: Record<string, any>, index: number) => {
                const dateText = formatDateLabel(
                  item.dSortDate ??
                    item.SortDate ??
                    item.dCreatedDate ??
                    item.CreatedDate ??
                    item.CreatedOn ??
                    item.CreatedDateTime ??
                    item.dCreatedOn ??
                    item.Date ??
                    item.cDate ??
                    item.Time,
                );
                const title = getHistoryTitle(item);
                const actor = getHistoryActor(item);
                const remarks = getHistoryRemarks(item);
                const description = getHistoryDescription(item);
                const key = item.Id ?? item.id ?? `${title}-${index}`;
                const pdfSource = [remarks, title].find(isPdfPathLike) || "";
                const pdfUrl = pdfSource ? resolvePdfUrl(pdfSource) : "";
                const pdfExtension = getPdfExtension(pdfSource || remarks || title);
                const visibleTitle = pdfUrl ? "" : title;
                const visibleRemarks = pdfUrl
                  ? title
                  : description || (remarks && !isPdfPathLike(remarks) ? remarks : "");
                const callReportId = getCallReportId(item);
                const canOpenCallReport = isCallReportHistoryItem(item) && !!callReportId;

                return (
                  <div
                    key={key}
                    className="grid grid-cols-[18px_minmax(0,1fr)] gap-3"
                  >
                    <div className="relative flex justify-center">
                      <img src={clockgrey} alt="Time" className="h-6 w-6" />
                      {/* <span className="mt-1.5 h-3
                       w-3 rounded-full border-2 border-teal-500 bg-white" /> */}
                      {index !== historyItems.length - 1 ? (
                        <span className="absolute top-6 h-full border-l-2 border-dotted border-gray-400" />
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      {dateText ? (
                        <div className="text-sm font-medium text-slate-700">
                          {dateText}
                        </div>
                      ) : null}

                      {pdfUrl ? (
                        <button
                          type="button"
                          className="mt-2 flex w-full items-start gap-3  bg-sky-50 px-4 py-3 text-left text-sm text-slate-700 "
                          onClick={() => {
                            navigate(`/tickets/estimate`, {
                              state: {
                                ticketId: resolvedTicketId,
                                customerId,
                                customerName,
                                estimateId: Number(item.nId ?? item.Id ?? item.id ?? item.nEstimateId ?? 0),
                              },
                            });
                          }}
                        >
                          <img src={pdfIcon} alt="PDF" className="mt-0.5 h-7 w-7 shrink-0 object-contain" />
                          <div className="min-w-0 flex-1">
                            <div className="break-words font-medium text-slate-700">
                              {pdfExtension}
                            </div>
                            <div className="mt-1 break-words text-sm font-semibold text-gray-700 ">
                              {title}
                            </div>
                          </div>
                        </button>
                      ) : visibleTitle ? (
                        <div className="text-sm font-semibold text-teal-700">
                          {visibleTitle}
                        </div>
                      ) : null}

                      {actor ? (
                        <div className="text-sm text-slate-500">{actor}</div>
                      ) : null}

                      {visibleRemarks ? (
                        canOpenCallReport ? (
                          <button
                            type="button"
                            className="mt-2 w-full bg-sky-50 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-sky-100"
                            onClick={async () => {
                              const callReportState = {
                                selectedRow: item,
                                nCallReportId: callReportId,
                                nFollowupId: callReportId,
                                nFollowUpId: callReportId,
                                nWorksheetId: callReportId,
                                WorksheetId: callReportId,
                                nTicketId: Number(
                                  getFieldValue(item, ["nTicketId", "TicketId", "ticketId"]) ||
                                    resolvedTicketId ||
                                    0,
                                ),
                                nCustomerId: Number(
                                  getFieldValue(item, ["nCustomerId", "CustomerId", "customerId"]) ||
                                    customerId ||
                                    0,
                                ),
                                customerId,
                                customerName,
                                isFrom: "history",
                              };

                              const progressNotePayload = {
                                ...sessionPayload,
                                nTicketId: Number(
                                  getFieldValue(item, ["nTicketId", "TicketId", "ticketId"]) ||
                                    resolvedTicketId ||
                                    0,
                                ),
                                nFollowupId: callReportId,
                                nFollowUpId: callReportId,
                                nCallReportId: callReportId,
                                CallReportId: callReportId,
                                nId: callReportId,
                                Id: callReportId,
                                pageNumber: 1,
                                pageSize: 1000,
                              };
                              const callReportViewPayload = {
                                ...sessionPayload,
                                nTicketId: Number(
                                  getFieldValue(item, ["nTicketId", "TicketId", "ticketId"]) ||
                                    resolvedTicketId ||
                                    0,
                                ),
                                nFollowupId: callReportId,
                                nFollowUpId: callReportId,
                                nCallReportId: callReportId,
                                CallReportId: callReportId,
                              };

                              try {
                                setOpeningCallReportId(callReportId);
                                const response =
                                  await callReportApis.callReportProgressNoteList(
                                    progressNotePayload,
                                  );
                                const rows = extractList(response);
                                const matchedCallReport =
                                  rows.find((row: Record<string, any>) => {
                                    const rowId = Number(
                                      getFieldValue(row, [
                                        "nId",
                                        "Id",
                                        "id",
                                        "nCallReportId",
                                        "CallReportId",
                                        "nFollowupId",
                                        "nFollowUpId",
                                      ]) || 0,
                                    );
                                    return rowId === callReportId;
                                  }) ?? rows[0];

                                if (matchedCallReport && typeof matchedCallReport === "object") {
                                  callReportState.selectedRow = {
                                    ...callReportState.selectedRow,
                                    ...matchedCallReport,
                                  };
                                }

                                const callReportViewResponse =
                                  await ticketApis.callreportView(callReportViewPayload);
                                const resolvedViewData =
                                  callReportViewResponse?.data?.data ??
                                  callReportViewResponse?.data ??
                                  callReportViewResponse ??
                                  null;

                                if (resolvedViewData && typeof resolvedViewData === "object") {
                                  callReportState.selectedRow = {
                                    ...callReportState.selectedRow,
                                    ...resolvedViewData,
                                    cHistorySummary:
                                      getFieldValue(callReportState.selectedRow, [
                                        "cHistorySummary",
                                        "HistorySummary",
                                      ]) ||
                                      getFieldValue(callReportState.selectedRow, [
                                        "cViewSummary",
                                        "ViewSummary",
                                      ]) ||
                                      "",
                                    historyCreatedDate:
                                      getFieldValue(callReportState.selectedRow, [
                                        "historyCreatedDate",
                                        "dSortDate",
                                        "SortDate",
                                        "dCreatedDate",
                                        "CreatedDate",
                                      ]) || "",
                                  };
                                }
                              } catch {
                                // Fall back to the history item when the call-report-wise lookup is unavailable.
                              } finally {
                                setOpeningCallReportId(null);
                              }

                              if (onOpenCallReport) {
                                onOpenCallReport(callReportState);
                                return;
                              }

                              setLocalCallReportState(callReportState);
                            }}
                          >
                            {openingCallReportId === callReportId ? "Loading..." : visibleRemarks}
                          </button>
                        ) : (
                          <div className="mt-2 bg-sky-50 px-3 py-2 text-sm text-slate-700">
                            {visibleRemarks}
                          </div>
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty description="No history found" />
          )}
        </div>
      </Card>
      {localCallReportState ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/30 p-4">
          <div className="h-[72vh] w-full max-w-[920px] overflow-hidden rounded-2xl shadow-2xl">
            <CallReportHistoryModal
              record={localCallReportState.selectedRow ?? localCallReportState}
              onClose={() => setLocalCallReportState(null)}
            />
          </div>
        </div>
      ) : null}
    </Spin>
  );
};

export default TicketHistory;
