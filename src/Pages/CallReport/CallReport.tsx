import { useMemo, useState } from "react";
import { Empty, Input, Spin } from "antd";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";

import { useCallReportList } from "../../Hooks/Ticket/useTicketQueries";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";

type CallReportRow = Record<string, any>;

const getFieldValue = (record: CallReportRow, keys: string[]) => {
  for (const key of keys) {
    if (
      record?.[key] !== undefined &&
      record?.[key] !== null &&
      record?.[key] !== ""
    ) {
      return record[key];
    }
  }

  const recordKey = Object.keys(record || {}).find((item) =>
    keys.some((key) => key.toLowerCase() === item.toLowerCase()),
  );

  return recordKey ? record?.[recordKey] : "";
};

const normalizeText = (value: any) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const formatDisplayValue = (value: any) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";

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
      ""
    );
  }

  return String(value);
};

const formatDateValue = (value: any) => {
  const text = formatDisplayValue(value);
  if (!text) return "-";

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;

  return parsed.toLocaleDateString("en-GB");
};

const formatSearchText = (row: CallReportRow) =>
  [
    getFieldValue(row, [
      "CallReportDate",
      "cCallReportDate",
      "dCallReportDate",
    ]),
    getFieldValue(row, ["CallReportId", "nCallReportId", "cCallReportId"]),
    getFieldValue(row, ["TicketNo", "TicketNo.", "nTicketNo", "cTicketNo"]),
    getFieldValue(row, ["CustomerName", "cCustomerName", "Customer"]),
    getFieldValue(row, ["AgentName", "cAgentName", "Agent"]),
    getFieldValue(row, ["CallSummary", "cCallSummary", "Summary"]),
    getFieldValue(row, ["Status", "StatusName", "cStatus", "cStatusName"]),
  ]
    .map((item) => normalizeText(item))
    .join(" ");

const DashboardCallReport = () => {
  const payload = useMemo(
    () => ({
      ...getRequestPayload(),
    }),
    [],
  );

  const { data, isLoading, isError } = useCallReportList(payload, true);
  const rows = useMemo(() => extractList(data) as CallReportRow[], [data]);
  const [activeTab, setActiveTab] = useState<"ALL" | "BILLED" | "UNBILLED">(
    "ALL",
  );
  const [search, setSearch] = useState("");

  const displayedRows = useMemo(() => {
    const searchTerm = normalizeText(search);

    return rows.filter((row) => {
      const reportStatus = normalizeText(
        getFieldValue(row, [
          "BilledStatus",
          "cBilledStatus",
          "IsBilled",
          "bBilled",
          "Status",
          "cStatus",
        ]),
      );

      const matchesTab =
        activeTab === "ALL"
          ? true
          : activeTab === "BILLED"
            ? reportStatus.includes("bill") || reportStatus.includes("paid")
            : reportStatus.includes("unbill") ||
              reportStatus.includes("pending") ||
              reportStatus === "";

      const matchesSearch =
        !searchTerm || formatSearchText(row).includes(searchTerm);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, rows, search]);

  const tableRows = useMemo(
    () =>
      displayedRows.map((row, index) => ({
        srl: index + 1,
        callReportDate: formatDateValue(
          getFieldValue(row, [
            "CallReportDate",
            "cCallReportDate",
            "dCallReportDate",
          ]),
        ),
        callReportId:
          formatDisplayValue(
            getFieldValue(row, [
              "CallReportId",
              "nCallReportId",
              "cCallReportId",
            ]),
          ) || "-",
        ticketNo:
          formatDisplayValue(
            getFieldValue(row, ["TicketNo", "nTicketNo", "cTicketNo"]),
          ) || "-",
        customerName:
          formatDisplayValue(
            getFieldValue(row, ["CustomerName", "cCustomerName", "Customer"]),
          ) || "-",
        agentName:
          formatDisplayValue(
            getFieldValue(row, ["AgentName", "cAgentName", "Agent"]),
          ) || "-",
        callSummary:
          formatDisplayValue(
            getFieldValue(row, ["CallSummary", "cCallSummary", "Summary"]),
          ) || "-",
        status:
          formatDisplayValue(
            getFieldValue(row, [
              "Status",
              "StatusName",
              "cStatus",
              "cStatusName",
            ]),
          ) || "-",
      })),
    [displayedRows],
  );

  const filterButtons = [
    { key: "ALL", label: "All" },
    { key: "BILLED", label: "Billed Call Reports" },
    { key: "UNBILLED", label: "Un Billed Call Reports" },
  ] as const;

  return (
    <div className="-m-6 h-full min-h-0 overflow-hidden bg-white">
      <div className="flex h-full min-h-0 flex-col px-4 py-3">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
          <h1 className="text-[18px] font-medium text-slate-900">
            Call Reports
          </h1>

          <div className="flex items-center gap-2">
            <Input
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-[300px]"
              style={{ height: 34 }}
            />
            <button
              type="button"
              aria-label="Filter"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <FilterOutlined />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-3">
          {filterButtons.map((item) => {
            const active = activeTab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-sky-500 bg-sky-500 text-white"
                    : "border-sky-500 bg-white text-slate-700 hover:bg-sky-50"
                }`}
              >
                <span className="text-sm leading-none">▤</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="grid grid-cols-[70px_140px_120px_120px_1.2fr_1fr_1.4fr_120px] gap-2 border-b border-slate-200 bg-white px-4 py-4 text-[13px] font-medium text-slate-900">
            <div>Srl</div>
            <div>Call Report Date</div>
            <div>Call Report Id</div>
            <div>Ticket No.</div>
            <div>Customer Name</div>
            <div>Agent Name</div>
            <div>Call Summary</div>
            <div>Status</div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden p-3">
            <Spin spinning={isLoading}>
              {isError ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-xl ">
                  <div className="text-sm ">No data.</div>
                </div>
              ) : tableRows.length > 0 ? (
                <div className="call-report-scrollbar max-h-[calc(100vh-220px)] overflow-y-auto overflow-x-hidden">
                  {tableRows.map((row) => (
                    <div
                      key={`${row.callReportId}-${row.srl}`}
                      className="grid grid-cols-[70px_140px_120px_120px_1.2fr_1fr_1.4fr_120px] gap-2 border-b border-slate-100 px-4 py-3 text-[13px] text-slate-700"
                    >
                      <div>{row.srl}</div>
                      <div>{row.callReportDate}</div>
                      <div>{row.callReportId}</div>
                      <div>{row.ticketNo}</div>
                      <div>{row.customerName}</div>
                      <div>{row.agentName}</div>
                      <div className="truncate">{row.callSummary}</div>
                      <div>{row.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-slate-200 bg-white">
                  <Empty description="No data" />
                </div>
              )}
            </Spin>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCallReport;
