import { useEffect, useMemo, useRef, useState } from "react";
import { Empty, Input, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";

import {
  useBilledCallReportList,
  useCallReportList,
  useUnbilledCallReportList,
} from "../../Hooks/Ticket/useTicketQueries";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import TicketModulePagination from "../Ticket/Common/TicketModulePagination";
import year from "../../assets/icons/year.svg";
import tabIcon from "../../assets/icons/tabIcon.svg";
import tabIconActive from "../../assets/icons/tabIconActive.svg";
import CalendarPopup from "../../ui/CalendarPopup/CalendarPopup";

type CallReportRow = Record<string, any>;
type CallReportTab = "ALL" | "BILLED" | "UNBILLED";
type DateRange = [Dayjs, Dayjs];

type CallReportProps = {
  initialTab?: CallReportTab;
};

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

const extractCallReportRows = (response: any) => {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
    response?.data?.result,
    response?.data?.items,
    response?.data?.list,
    response?.data?.message,
    response?.result,
    response?.items,
    response?.list,
    response?.message,
    response?.callReportList,
    response?.CallReportList,
    response?.callreportList,
    response?.billedCallReportList,
    response?.BilledCallReportList,
    response?.unbilledCallReportList,
    response?.UnbilledCallReportList,
    response?.data?.callReportList,
    response?.data?.CallReportList,
    response?.data?.callreportList,
    response?.data?.billedCallReportList,
    response?.data?.BilledCallReportList,
    response?.data?.unbilledCallReportList,
    response?.data?.UnbilledCallReportList,
  ];

  for (const candidate of candidates) {
    const rows = extractList(candidate);
    if (rows.length > 0) return rows as CallReportRow[];
  }

  return [] as CallReportRow[];
};

const isFalsyLike = (value: any) =>
  value === false ||
  value === 0 ||
  ["false", "0", "no", "n", "unbilled", "pending", "open", "unpaid"].includes(
    normalizeText(value),
  );

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

const parseDateValue = (value: any) => {
  const text = formatDisplayValue(value);
  if (!text) return null;

  const match = text.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*([AP]M))?$/,
  );

  if (match) {
    const [, dd, mm, yyyy, hh = "0", min = "0", meridiem] = match;
    let hour = Number(hh);
    const minute = Number(min);
    const upperMeridiem = meridiem?.toUpperCase();

    if (upperMeridiem === "PM" && hour < 12) hour += 12;
    if (upperMeridiem === "AM" && hour === 12) hour = 0;

    const parsed = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      hour,
      minute,
      0,
      0,
    );

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateValue = (value: any) => {
  const parsed = parseDateValue(value);
  if (!parsed) return "-";

  return parsed.toLocaleDateString("en-GB");
};

const getCallReportId = (row: CallReportRow) =>
  formatDisplayValue(
    getFieldValue(row, [
      "nFollowupId",
      "nFollowUpId",
      "nCallReportId",
      "CallReportId",
      "cCallReportId",
      "nTicketId",
    ]),
  );

const getAgentName = (row: CallReportRow) => {
  const directAgent = formatDisplayValue(
    getFieldValue(row, ["cAgentName", "AgentName", "Agent"]),
  );

  if (directAgent) return directAgent;

  const summary = formatDisplayValue(
    getFieldValue(row, ["cViewSummary", "ViewSummary"]),
  );
  const match =
    summary.match(/callreport by (.+?) on/i) ?? summary.match(/\bby (.+?) on/i);

  return match?.[1]?.trim() ?? "";
};

const getCallSummary = (row: CallReportRow) =>
  formatDisplayValue(
    getFieldValue(row, [
      "cCallreportSummary",
      "cCallReportSummary",
      "cTicketSummary",
      "CallSummary",
      "cCallSummary",
      "Summary",
      "cViewSummary",
    ]),
  );

const getStatus = (row: CallReportRow) =>
  formatDisplayValue(
    getFieldValue(row, [
      "cTicketStatus",
      "cStatus",
      "Status",
      "StatusName",
      "cClosedStatus",
    ]),
  );

const formatSearchText = (row: CallReportRow) =>
  [
    getFieldValue(row, ["dCallReportDate", "cToDate", "dCreatedDate"]),
    getCallReportId(row),
    getFieldValue(row, ["nTicketNo", "TicketNo", "TicketNo.", "cTicketNo"]),
    getFieldValue(row, ["CustomerName", "cCustomerName", "Customer"]),
    getAgentName(row),
    getCallSummary(row),
    getStatus(row),
  ]
    .map((item) => normalizeText(item))
    .join(" ");

const getPreviousMonthRange = (): DateRange => {
  const previousMonth = dayjs().subtract(1, "month");

  return [previousMonth.startOf("month"), previousMonth.endOf("month")];
};

const DashboardCallReport = ({ initialTab = "ALL" }: CallReportProps) => {
  const navigate = useNavigate();
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(
    getPreviousMonthRange(),
  );
  const [draftCalendarMonth, setDraftCalendarMonth] = useState(
    getPreviousMonthRange()[0],
  );
  const [draftDateRange, setDraftDateRange] = useState<
    [Dayjs | null, Dayjs | null]
  >(
    getPreviousMonthRange(),
  );

  const [activeTab, setActiveTab] = useState<CallReportTab>(initialTab);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const payload = useMemo(
    () => ({
      ...getRequestPayload(),
      cFromDate: appliedDateRange[0].format("YYYY-MM-DD"),
      cToDate: appliedDateRange[1].format("YYYY-MM-DD"),
    }),
    [appliedDateRange],
  );
  const {
    data: allData,
    isLoading: isAllLoading,
    isError: isAllError,
  } = useCallReportList(payload, activeTab === "ALL");
  const {
    data: billedData,
    isLoading: isBilledLoading,
    isError: isBilledError,
  } = useBilledCallReportList(payload, activeTab === "BILLED");
  const {
    data: unbilledData,
    isLoading: isUnbilledLoading,
    isError: isUnbilledError,
  } = useUnbilledCallReportList(payload, activeTab === "UNBILLED");

  const sourceRows = useMemo(() => {
    if (activeTab === "BILLED") {
      return extractCallReportRows(billedData);
    }

    if (activeTab === "UNBILLED") {
      return extractCallReportRows(unbilledData);
    }

    return extractCallReportRows(allData);
  }, [activeTab, allData, billedData, unbilledData]);

  const isLoading =
    activeTab === "BILLED"
      ? isBilledLoading
      : activeTab === "UNBILLED"
        ? isUnbilledLoading
        : isAllLoading;
  const isError =
    activeTab === "BILLED"
      ? isBilledError
      : activeTab === "UNBILLED"
        ? isUnbilledError
        : isAllError;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target as Node)
      ) {
        setIsDateFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleDateFilter = () => {
    setDraftCalendarMonth(appliedDateRange[0].startOf("month"));
    setDraftDateRange(appliedDateRange);
    setIsDateFilterOpen((current) => !current);
  };

  const handleApplyDateFilter = () => {
    if (!draftDateRange[0] || !draftDateRange[1]) {
      return;
    }

    setAppliedDateRange([draftDateRange[0], draftDateRange[1]]);
    setIsDateFilterOpen(false);
  };

  const handleCancelDateFilter = () => {
    setDraftCalendarMonth(appliedDateRange[0].startOf("month"));
    setDraftDateRange(appliedDateRange);
    setIsDateFilterOpen(false);
  };

  const handleDateSelect = (selectedDate: Dayjs) => {
    const normalizedDate = selectedDate.startOf("day");
    const [rangeStart, rangeEnd] = draftDateRange;

    if (!rangeStart || rangeEnd) {
      setDraftDateRange([normalizedDate, null]);
      return;
    }

    if (normalizedDate.isBefore(rangeStart, "day")) {
      setDraftDateRange([normalizedDate, rangeStart]);
      return;
    }

    setDraftDateRange([rangeStart, normalizedDate]);
  };

  const displayedRows = useMemo(() => {
    const searchTerm = normalizeText(search);

    return sourceRows.filter((row) => {
      const billedStatus = getFieldValue(row, [
        "BilledStatus",
        "cBilledStatus",
        "IsBilled",
        "bBilled",
        "Status",
        "cStatus",
      ]);
      const reportStatus = normalizeText(billedStatus);

      const matchesTab =
        activeTab === "ALL"
          ? true
          : activeTab === "BILLED"
            ? true
            : isFalsyLike(billedStatus) ||
              reportStatus.includes("unbill") ||
              reportStatus.includes("pending") ||
              reportStatus.includes("open") ||
              reportStatus.includes("unpaid") ||
              reportStatus.includes("not billed") ||
              reportStatus.includes("notbilled") ||
              reportStatus === "";

      const matchesSearch =
        !searchTerm || formatSearchText(row).includes(searchTerm);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, search, sourceRows]);

  const totalRows = displayedRows.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalRows / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [currentPage, pageSize, totalRows]);
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return displayedRows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, displayedRows]);

  const tableRows = useMemo(
    () =>
      paginatedRows.map((row, index) => ({
        raw: row,
        srl: (currentPage - 1) * pageSize + index + 1,
        callReportDate: formatDateValue(
          getFieldValue(row, ["dCallReportDate", "dCreatedDate"]),
        ),
        callReportId: getCallReportId(row) || "-",
        ticketNo:
          formatDisplayValue(
            getFieldValue(row, [
              "nTicketNo",
              "TicketNo",
              "TicketNo.",
              "cTicketNo",
            ]),
          ) || "-",
        customerName:
          formatDisplayValue(
            getFieldValue(row, ["cCustomerName", "CustomerName", "Customer"]),
          ) || "-",
        agentName: getAgentName(row) || "-",
        callSummary: getCallSummary(row) || "-",
        status: getStatus(row) || "-",
      })),
    [currentPage, pageSize, paginatedRows],
  );

  const handleRowClick = (row: CallReportRow) => {
    const sourceRow = row.raw ?? row;
    const billedStatus = getFieldValue(sourceRow, [
      "BilledStatus",
      "cBilledStatus",
      "IsBilled",
      "bBilled",
      "Status",
      "cStatus",
    ]);
    const isUnbilledRow =
      activeTab === "UNBILLED" ||
      isFalsyLike(billedStatus) ||
      ["unbill", "pending", "open", "unpaid", "not billed", "notbilled"].some(
        (item) => normalizeText(billedStatus).includes(item),
      );

    navigate("/callreports/view", {
      state: {
        selectedRow: sourceRow,
        nCallReportId: Number(
          getFieldValue(row.raw ?? row, [
            "nCallReportId",
            "CallReportId",
            "nFollowupId",
            "nFollowUpId",
            "nWorksheetId",
            "WorksheetId",
          ]) || 0,
        ),
        nFollowupId: Number(
          getFieldValue(row.raw ?? row, [
            "nFollowupId",
            "nFollowUpId",
            "nCallReportId",
            "CallReportId",
            "nWorksheetId",
            "WorksheetId",
          ]) || 0,
        ),
        nWorksheetId: Number(
          getFieldValue(row.raw ?? row, [
            "nWorksheetId",
            "WorksheetId",
            "nCallReportId",
            "CallReportId",
            "nFollowupId",
            "nFollowUpId",
          ]) || 0,
        ),
        nTicketId: Number(
          getFieldValue(row.raw ?? row, [
            "nTicketId",
            "TicketId",
            "ticketId",
          ]) || 0,
        ),
        nCustomerId: Number(
          getFieldValue(row.raw ?? row, [
            "nCustomerId",
            "CustomerId",
            "customerId",
          ]) || 0,
        ),
        isFrom: isUnbilledRow ? "unbilled" : "callreports",
      },
    });
  };

  const filterButtons = [
    { key: "ALL", label: "All" },
    { key: "BILLED", label: "Billed Call Reports" },
    { key: "UNBILLED", label: "Un Billed Call Reports" },
  ] as const;

  return (
    <div className="-mt-6  flex h-full min-h-0 flex-1 flex-col bg-white px-4 py-7">
      <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
        <div className="flex items-center justify-between gap-4 pb-2">
          <h1 className="text-[18px] font-medium text-slate-900">
            Call Reports
          </h1>
          <div
            className="relative flex items-center gap-2 w-100"
            ref={filterPanelRef}
          >
            <Input
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-[400px]"
              style={{ height: 34 ,borderColor:"#56A7C4"}}
            />
            <button
              type="button"
              onClick={handleToggleDateFilter}
              className="flex items-center justify-center h-[34px] w-[34px] border border-black rounded-lg bg-white shrink-0"
              aria-label="Open call report date filter"
            >
              <img src={year} alt="year" className="h-5 w-5" />
            </button>
            <CalendarPopup
              open={isDateFilterOpen}
              title="Filter"
              month={draftCalendarMonth.toDate()}
              selectedDate={(draftDateRange[0] ?? draftCalendarMonth).toDate()}
              selectedFromDate={draftDateRange[0]?.toDate()}
              selectedToDate={draftDateRange[1]?.toDate()}
              onMonthChange={(nextMonth) =>
                setDraftCalendarMonth(dayjs(nextMonth))
              }
              onYearChange={(nextYear) =>
                setDraftCalendarMonth(dayjs(nextYear))
              }
              onSelectDate={(date) => handleDateSelect(dayjs(date))}
              onSelectRangeDate={(date) => handleDateSelect(dayjs(date))}
              onApply={handleApplyDateFilter}
              onCancel={handleCancelDateFilter}
            />
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
                className={`flex items-center gap-2 rounded-[6px] border px-3 py-1.5 h-7 text-[11px] font-medium transition-colors ${
                  active
                    ? "border-[#279FF5] bg-[#279FF5] text-white"
                    : "border-[#279FF5] bg-[] text-[#475569] hover:bg-[#e0effe]"
                }`}
              >
                <img
                  src={active ? tabIconActive : tabIcon}
                  alt=""
                  aria-hidden="true"
                  className="block h-[14px] w-[14px] shrink-0"
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="grid grid-cols-[48px_108px_78px_90px_1fr_0.9fr_1.1fr_78px] gap-1 border-b border-slate-200 bg-white px-2 py-3 text-[12px] font-medium text-slate-900 ">
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
                <div className="flex min-h-[20px] items-center justify-center rounded-xl ">
                  <div className="text-sm ">No data.</div>
                </div>
              ) : tableRows.length > 0 ? (
                <div className="call-report-scrollbar max-h-[calc(100vh-220px)] overflow-y-auto overflow-x-hidden pr-2">
                  {tableRows.map((row) => (
                    <div
                      key={`${row.callReportId}-${row.srl}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleRowClick(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleRowClick(row);
                        }
                      }}
                      className="grid grid-cols-[48px_108px_72px_88px_1fr_0.9fr_1.1fr_78px] gap-2 border-b border-slate-100 px-2 py-2.5 text-[12px] text-slate-700 cursor-pointer hover:bg-sky-50 --font-display:Oswald, sans-serif"
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
                <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-slate-200 bg-white">
                  <Empty description="No data" />
                </div>
              )}
            </Spin>
          </div>
        </div>
        {totalRows > 0 ? (
          <div className=" bg-white -mb-11.5 px-2 py-0">
            <TicketModulePagination
              elevated={false}
              current={currentPage}
              pageSize={pageSize}
              total={totalRows}
              onChange={(page, nextPageSize) => {
                setCurrentPage(page);
                setPageSize(nextPageSize);
              }}
              onShowSizeChange={(page, nextPageSize) => {
                setCurrentPage(page);
                setPageSize(nextPageSize);
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
export default DashboardCallReport;
