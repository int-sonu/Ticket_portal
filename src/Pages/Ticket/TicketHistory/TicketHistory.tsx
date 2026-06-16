import { Button, Card, Empty, Spin } from "antd";
import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { useTicketHistory } from "../../../Hooks/Ticket/useTicketQueries";
import { getRequestPayload } from "../../../Utils/requestPayload";
import { extractList } from "../../Master/Common/SimpleMasterUtils";
import clockgrey from "../../../Assets/icons/clock-grey.svg";
interface Props {
  ticketId?: number;
}

const formatText = (value: any) => {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  return text === "0" || text === "undefined" || text === "null" ? "" : text;
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

const TicketHistory = ({ ticketId }: Props) => {
  const params = useParams();
  const resolvedTicketId = Number(ticketId ?? params.id ?? 0);
  const sessionPayload = getRequestPayload();

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

  const historyItems = useMemo(() => pickHistoryList(data), [data]);

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

          <Button type="text"
            className="h-9 rounded-md border-0 bg-green-600 text-black px-4 text-sm font-semibold "
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
                const key = item.Id ?? item.id ?? `${title}-${index}`;

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

                    <div className="space-y-1.5">
                      {dateText ? (
                        <div className="text-sm font-medium text-slate-700">
                          {dateText}
                        </div>
                      ) : null}

                      <div className="text-base font-semibold text-teal-700">
                        {title}
                      </div>

                      {actor ? (
                        <div className="text-sm text-slate-500">{actor}</div>
                      ) : null}

                      {remarks ? (
                        <div className="rounded-md bg-sky-50 px-3 py-2 text-sm leading-6 text-slate-700">
                          {remarks}
                        </div>
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
    </Spin>
  );
};

export default TicketHistory;
