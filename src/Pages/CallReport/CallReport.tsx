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

type CallReportRow = Record<string, any>;
type CallReportTab = "ALL" | "BILLED" | "UNBILLED";
type DateRange = [Dayjs, Dayjs];
type CalendarCell = {
  day: number;
  currentMonth: boolean;
};

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

const buildCalendarGrid = (monthValue: Dayjs) => {
  const startOfMonth = monthValue.startOf("month");
  const startDayOfWeek = startOfMonth.day();
  const totalDays = monthValue.daysInMonth();
  const prevMonthDays = monthValue.subtract(1, "month").daysInMonth();

  const daysGrid: CalendarCell[] = [];

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    daysGrid.push({
      day: prevMonthDays - i,
      currentMonth: false,
    });
  }

  for (let i = 1; i <= totalDays; i++) {
    daysGrid.push({
      day: i,
      currentMonth: true,
    });
  }

  const totalCells = daysGrid.length > 35 ? 42 : 35;
  const nextDaysCount = totalCells - daysGrid.length;

  for (let i = 1; i <= nextDaysCount; i++) {
    daysGrid.push({
      day: i,
      currentMonth: false,
    });
  }

  return daysGrid;
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
  const [draftSelectedDate, setDraftSelectedDate] = useState(
    getPreviousMonthRange()[0],
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
    setDraftSelectedDate(appliedDateRange[0]);
    setIsDateFilterOpen((current) => !current);
  };

  const handleApplyDateFilter = () => {
    if (activeTab === "ALL") {
      setActiveTab("BILLED");
    }
    setAppliedDateRange([
      draftCalendarMonth.startOf("month"),
      draftCalendarMonth.endOf("month"),
    ]);
    setIsDateFilterOpen(false);
  };

  const handleCancelDateFilter = () => {
    setDraftCalendarMonth(appliedDateRange[0].startOf("month"));
    setDraftSelectedDate(appliedDateRange[0]);
    setIsDateFilterOpen(false);
  };

  const handlePrevYear = () => {
    setDraftCalendarMonth((current) => current.subtract(1, "year"));
  };

  const handleNextYear = () => {
    setDraftCalendarMonth((current) => current.add(1, "year"));
  };

  const handlePrevMonth = () => {
    setDraftCalendarMonth((current) => current.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setDraftCalendarMonth((current) => current.add(1, "month"));
  };

  const handleDateSelect = (day: number, currentMonth: boolean) => {
    if (!currentMonth) {
      return;
    }

    setDraftSelectedDate(draftCalendarMonth.date(day));
  };

  const calendarDays = useMemo(
    () => buildCalendarGrid(draftCalendarMonth),
    [draftCalendarMonth],
  );
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const isSelectedDay = (day: number, currentMonth: boolean) =>
    currentMonth &&
    draftSelectedDate.date() === day &&
    draftSelectedDate.month() === draftCalendarMonth.month() &&
    draftSelectedDate.year() === draftCalendarMonth.year();

  const isToday = (day: number, currentMonth: boolean) => {
    const today = dayjs();
    return (
      currentMonth &&
      today.date() === day &&
      today.month() === draftCalendarMonth.month() &&
      today.year() === draftCalendarMonth.year()
    );
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
              style={{ height: 34 }}
            />
            <button
              type="button"
              onClick={handleToggleDateFilter}
              className="flex items-center justify-center h-[34px] w-[34px] border border-black rounded-lg bg-white shrink-0"
              aria-label="Open call report date filter"
            >
              <img src={year} alt="year" className="h-5 w-5" />
            </button>
            {isDateFilterOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-[340px] rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_12px_36px_rgba(0,0,0,0.12)]">
                <div className="mb-3 text-sm font-semibold text-slate-800">
                  Filter
                </div>
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevYear}
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 text-xs font-bold text-slate-800 hover:bg-slate-100"
                    >
                      &lt;
                    </button>
                    <span className="w-10 text-center text-[13px] font-bold text-slate-700">
                      {draftCalendarMonth.format("YYYY")}
                    </span>
                    <button
                      onClick={handleNextYear}
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 text-xs font-bold text-slate-800 hover:bg-slate-100"
                    >
                      &gt;
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevMonth}
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 text-xs font-bold text-slate-800 hover:bg-slate-100"
                    >
                      &lt;
                    </button>
                    <span className="w-16 text-center text-[13px] font-bold text-slate-700">
                      {draftCalendarMonth.format("MMMM")}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 text-xs font-bold text-slate-800 hover:bg-slate-100"
                    >
                      &gt;
                    </button>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-slate-600">
                    {weekDays.map((weekDay) => (
                      <div
                        key={weekDay}
                        className="flex h-6 items-center justify-center"
                      >
                        {weekDay}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-y-1">
                    {calendarDays.map(({ day, currentMonth }, index) => {
                      const selected = isSelectedDay(day, currentMonth);
                      const activeToday = isToday(day, currentMonth);

                      return (
                        <button
                          key={`${day}-${currentMonth}-${index}`}
                          onClick={() => handleDateSelect(day, currentMonth)}
                          type="button"
                          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors
                            ${
                              selected
                                ? "bg-[#2cd5a9] font-bold text-white"
                                : currentMonth
                                  ? activeToday
                                    ? "border border-[#2cd5a9] text-[#2cd5a9]"
                                    : "text-slate-800 hover:bg-slate-100"
                                  : "cursor-not-allowed text-slate-300"
                            }`}
                          disabled={!currentMonth}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={handleCancelDateFilter}
                    className="rounded-lg border border-[#2cd5a9] px-4 py-1.5 text-[13px] font-semibold text-[#2cd5a9] transition-colors hover:bg-teal-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyDateFilter}
                    className="rounded-lg bg-[#2cd5a9] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#25bfa4]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ) : null}
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
                    ? "border-[#2bbbe7] bg-[#2f80ed] text-white"
                    : "border-[#2f80ed] bg-[#f0f7ff] text-[#475569] hover:bg-[#e0effe]"
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
                      className="grid grid-cols-[48px_108px_72px_88px_1fr_0.9fr_1.1fr_78px] gap-1 border-b border-slate-100 px-2 py-2 text-[12px] text-slate-700 cursor-pointer hover:bg-sky-50"
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
