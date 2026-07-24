import { CalendarOutlined, CloseOutlined } from "@ant-design/icons";
import { Empty, Input, Modal, Spin } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";

import { getRequestPayload } from "../../Utils/requestPayload";
import TicketModulePagination from "../Ticket/Common/TicketModulePagination";
import {
  extractRows,
  formatCurrency,
  getValue,
  text,
} from "./ExpenseApprovalUtils";
import { useApprovalPendingList } from "./ExpenseApprovalHooks";
import CalendarPopup from "../../ui/CalendarPopup/CalendarPopup";

const gridTemplate = "grid-cols-[42px_160px_160px_180px_1fr_1fr_1fr]";
const pageColumns = [
  { key: "srl", label: "Srl" },
  { key: "agent", label: "Agent Name" },
  { key: "group", label: "Group Name" },
  { key: "period", label: "Period" },
  { key: "travel", label: "Travel Expense" },
  { key: "other", label: "Other Expense" },
  { key: "total", label: "Total Expense" },
];

type PeriodModalState = {
  periodStart: Dayjs;
  periodEnd: Dayjs;
  from: Dayjs;
  to: Dayjs;
  row: Record<string, unknown>;
};

const parseDateValue = (value: unknown) => {
  const source = String(value ?? "").trim();
  if (!source) return null;

  const match = source.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    const parsed = dayjs(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    return parsed.isValid() ? parsed.startOf("day") : null;
  }

  const parsed = dayjs(source);
  return parsed.isValid() ? parsed.startOf("day") : null;
};

const getPeriodBounds = (row: Record<string, unknown>) => {
  const periodText = text(getValue(row, ["cPeriod", "Period"]), "");
  const periodMatch = periodText.match(
    /(\d{1,2}[/-]\d{1,2}[/-]\d{4}).*?(\d{1,2}[/-]\d{1,2}[/-]\d{4})/,
  );

  const fromCandidate =
    parseDateValue(getValue(row, ["dFromDate", "FromDate", "cFromDate"])) ??
    parseDateValue(periodMatch?.[1] ?? "");
  const toCandidate =
    parseDateValue(getValue(row, ["dTodate", "dToDate", "ToDate", "cToDate"])) ??
    parseDateValue(periodMatch?.[2] ?? "");

  const fallback = dayjs().startOf("day");
  let periodStart = fromCandidate ?? toCandidate ?? fallback;
  let periodEnd = toCandidate ?? fromCandidate ?? fallback;

  if (periodEnd.isBefore(periodStart, "day")) {
    [periodStart, periodEnd] = [periodEnd, periodStart];
  }

  return { periodStart, periodEnd };
};

const ExpenseApprovalPendingPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [periodModal, setPeriodModal] = useState<PeriodModalState | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(dayjs().startOf("month"));
  const [activeDateField, setActiveDateField] = useState<"to" | null>(null);

  const payload = useMemo(() => {
    const { nCompanyId, cSchemaName, cDbName } = getRequestPayload();
    const dToDate = dayjs().format("YYYY/MM/DD");
    const dFromDate = dayjs().startOf("month").format("YYYY/MM/DD");

    return {
      nCompanyId,
      cSchemaName,
      cDbName,
      bDateFilter: true,
      dFromDate,
      dToDate,
    };
  }, []);

  const pendingQuery = useApprovalPendingList(payload);
  const rows = useMemo(() => extractRows(pendingQuery.data), [pendingQuery.data]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) =>
      [
        getValue(row, ["cAgentName", "AgentName", "cName", "Name"]),
        getValue(row, ["cGroupName", "GroupName"]),
        getValue(row, ["dApprovalDate", "dDate", "Date", "cDate"]),
        getValue(row, ["dFromDate", "FromDate", "cFromDate"]),
        getValue(row, ["dTodate", "dToDate", "ToDate", "cToDate"]),
        getValue(row, ["cPeriod", "Period"]),
        getValue(row, ["nTravelExpenseAmount", "nTravelExpense", "TravelExpense"]),
        getValue(row, ["nOtherExpenseAmount", "nOtherExpense", "OtherExpense"]),
        getValue(row, ["nTotalExpenseAmount", "nTotalExpense", "TotalExpense", "nClaimedAmount", "ClaimedAmount"]),
      ]
        .map((value) => text(value, ""))
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [rows, search]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(filteredRows.length / pageSize)));
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openDetails = (row: Record<string, unknown>) => {
    const bounds = getPeriodBounds(row);
    navigate("/more/expenseapproval/periodwiseview", {
      state: {
        approvalId:
          Number(
            getValue(row, [
              "nApprovalId",
              "ApprovalId",
              "nApprovalID",
              "ApprovalID",
            ]),
          ) || 0,
        expenseApprovalId:
          Number(
            getValue(row, [
              "nExpenseApprovalId",
              "ExpenseApprovalId",
              "nExpenseId",
              "ExpenseId",
              "id",
            ]),
          ) || 0,
        nAgentId:
          Number(getValue(row, ["nAgentId", "AgentId", "AgentID"])) || 0,
        cAgentId: text(getValue(row, ["cAgentId", "AgentCode"]), ""),
        approval: row,
        fromDate: bounds.periodStart.format("YYYY/MM/DD"),
        toDate: bounds.periodEnd.format("YYYY/MM/DD"),
        fromPending: true,
      },
    });
  };

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white px-5 py-4">
      <header className="mb-4 flex flex-none items-center justify-between gap-3">
        <h1 className="m-0 text-[22px] font-medium text-slate-950">Pending Approval</h1>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white shadow-sm transition-colors hover:bg-slate-50"
          aria-label="Back to expense approval"
          onClick={() => navigate("/more/expenseapproval")}
        >
          <CloseOutlined className="text-[15px] text-slate-700" />
        </button>
      </header>

      <div className="mb-3 flex w-full items-center">
        <Input
          className="h-9 w-full"
          placeholder="Search"
          allowClear
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-none border-0 bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className={`sticky top-0 z-10 grid ${gridTemplate} border-b border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-700`}>
            {pageColumns.map((column) => (
              <span key={column.key}>{column.label}</span>
            ))}
          </div>

          {pendingQuery.isFetching ? (
            <div className="flex h-52 items-center justify-center">
              <Spin />
            </div>
          ) : pendingQuery.isError ? (
            <div className="flex h-52 items-center justify-center text-sm text-red-500">
              Unable to load pending approvals
            </div>
          ) : visibleRows.length ? (
            visibleRows.map((row, index) => {
              const approvalId = Number(
                getValue(row, [
                  "nExpenseApprovalId",
                  "ExpenseApprovalId",
                  "nExpenseId",
                  "ExpenseId",
                  "id",
                ]),
              ) || index;

              const period =
                text(getValue(row, ["cPeriod", "Period"]), "") ||
                `${text(getValue(row, ["dFromDate"]), "")} - ${text(getValue(row, ["dTodate", "dToDate", "ToDate", "cToDate"]), "")}`;

              const travelExpense = getValue(row, ["nTravelExpenseAmount", "nTravelExpense", "TravelExpense"]);
              const otherExpense = getValue(row, ["nOtherExpenseAmount", "nOtherExpense", "OtherExpense"]);
              const totalExpense = getValue(row, ["nTotalExpenseAmount", "nTotalExpense", "TotalExpense", "nClaimedAmount", "ClaimedAmount"]);

              return (
                <button
                  key={approvalId}
                  type="button"
                  className={`grid min-h-[62px] w-full ${gridTemplate} items-center border-b border-slate-100 bg-white px-2 text-left text-xs transition-colors hover:bg-slate-50`}
        onClick={() => openDetails(row)}
                >
                  <span>{(safePage - 1) * pageSize + index + 1}</span>
                  <span>{text(getValue(row, ["cAgentName", "AgentName", "cName", "Name"]), "-")}</span>
                  <span>{text(getValue(row, ["cGroupName", "GroupName"]), "-")}</span>
                  <span>{period || "N/A"}</span>
                  <span>{formatCurrency(travelExpense)}</span>
                  <span>{formatCurrency(otherExpense)}</span>
                  <span>{formatCurrency(totalExpense)}</span>
                </button>
              );
            })
          ) : (
            <div className="flex h-48 items-center justify-center">
              <Empty description="No pending approvals" />
            </div>
          )}
        </div>
      </div>

      {filteredRows.length ? (
        <TicketModulePagination
          className="mt-3 w-full flex-none"
          elevated={false}
          current={safePage}
          pageSize={pageSize}
          total={filteredRows.length}
          onChange={(nextPage, size) => {
            setPage(nextPage);
            setPageSize(size);
          }}
          onShowSizeChange={(_, size) => {
            setPage(1);
            setPageSize(size);
          }}
        />
      ) : null}

      <Modal
        open={Boolean(periodModal)}
        title="Expense Approval"
        onCancel={() => {
          setActiveDateField(null);
          setPeriodModal(null);
        }}
        footer={null}
        width={560}
        centered
        destroyOnClose
        styles={{
          body: { padding: "12px 15px 16px" },
        }}
      >
        
        <div className="mb-4 text-sm text-slate-600">expense approval pending period</div>

        <div className="relative mt-2">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <div className="mb-2 text-sm text-slate-600">From</div>
              <div className="flex h-10 items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm">
                {periodModal?.from.format("DD/MM/YYYY")}
                <CalendarOutlined className="text-slate-500" />
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm text-slate-600">To</div>
              <button
                type="button"
                onClick={() => setActiveDateField("to")}
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-left text-sm text-slate-700 shadow-sm"
              >
                {periodModal?.to.format("DD/MM/YYYY")}
                <CalendarOutlined className="text-slate-500" />
              </button>
            </div>
          </div>

          {activeDateField === "to" ? (
            <CalendarPopup
              open={Boolean(periodModal)}
              title=""
              month={calendarMonth.toDate()}
              selectedDate={periodModal?.to.toDate() ?? calendarMonth.toDate()}
              selectedFromDate={periodModal?.from.toDate()}
              selectedToDate={periodModal?.to.toDate()}
              minDate={periodModal?.from.toDate()}
              maxDate={periodModal?.periodEnd.toDate()}
              onMonthChange={(nextMonth) => setCalendarMonth(dayjs(nextMonth))}
              onYearChange={(nextYear) => setCalendarMonth(dayjs(nextYear))}
              onSelectDate={(date) => {
                if (!periodModal) return;
                const picked = dayjs(date).startOf("day");
                setPeriodModal((current) => {
                  if (!current) return current;
                  const clamped = picked.isBefore(current.from, "day")
                    ? current.from
                    : picked.isAfter(current.periodEnd, "day")
                      ? current.periodEnd
                      : picked;
                  return { ...current, to: clamped };
                });
                setActiveDateField(null);
              }}
              onSelectRangeDate={(date) => {
                if (!periodModal) return;
                const picked = dayjs(date).startOf("day");
                setPeriodModal((current) => {
                  if (!current) return current;
                  const clamped = picked.isBefore(current.from, "day")
                    ? current.from
                    : picked.isAfter(current.periodEnd, "day")
                      ? current.periodEnd
                      : picked;
                  return { ...current, to: clamped };
                });
                setActiveDateField(null);
              }}
              onApply={() => setActiveDateField(null)}
              onCancel={() => setActiveDateField(null)}
              className="!right-0 !top-[80px] !mt-0 border border-slate-200 p-3 shadow-[0_12px_36px_rgba(0,0,0,0.12)]"
            />
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end ">
          <button
            type="button"
            className="rounded-md bg-emerald-500 px-5 py-2 font-medium text-white transition-colors hover:bg-emerald-600"
            onClick={() => {
              if (!periodModal) return;
              navigate("/more/expenseapproval/periodwiseview", {
                state: {
                  approvalId: Number(getValue(periodModal.row, ["nApprovalId", "ApprovalId", "nApprovalID", "ApprovalID"])) || 0,
                  expenseApprovalId: Number(getValue(periodModal.row, ["nExpenseApprovalId", "ExpenseApprovalId", "nExpenseId", "ExpenseId", "id"])) || 0,
                  agentId: Number(getValue(periodModal.row, ["nAgentId", "AgentId", "AgentID"])) || 0,
                  approval: periodModal.row,
                  fromDate: periodModal.from.format("YYYY/MM/DD"),
                  toDate: periodModal.to.format("YYYY/MM/DD"),
                  fromPending: true,
                },
              });
              setActiveDateField(null);
              setPeriodModal(null);
            }}
          >
            Ok
          </button>
        </div>
      </Modal>
    </section>
  );
};

export default ExpenseApprovalPendingPage;
