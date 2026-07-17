import { Empty, Input, Spin } from "antd";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import { getRequestPayload } from "../../Utils/requestPayload";
import TicketModulePagination from "../Ticket/Common/TicketModulePagination";
import {
  extractRows,
  formatCurrency,
  formatDateTime,
  getValue,
  text,
} from "./ExpenseApprovalUtils";
import { useApprovalPendingList, useExpenseApprovalList } from "./ExpenseApprovalHooks";

const gridTemplate = "grid-cols-[42px_180px_150px_180px_1fr_1fr_1fr_1fr]";
const pageColumns = [
  { key: "srl", label: "Srl" },
  { key: "date", label: "Date" },
  { key: "agent", label: "Agent Name" },
  { key: "period", label: "Period" },
  { key: "travel", label: "Travel Expense" },
  { key: "other", label: "Other Expense" },
  { key: "claimed", label: "Claimed Expense" },
  { key: "approved", label: "Approved Expense" },
];

const parseDateValue = (value: unknown) => {
  const source = String(value ?? "").trim();
  if (!source) return null;

  const match = source.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (!match) return null;

  const [, day, month, year] = match;
  return `${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}`;
};

const getRowPeriod = (row: Record<string, unknown>) => {
  const fromDate =
    parseDateValue(getValue(row, ["dFromDate", "FromDate", "cFromDate"])) ||
    parseDateValue(getValue(row, ["cPeriod", "Period"]))?.split(" - ")?.[0] ||
    "";
  const toDate =
    parseDateValue(getValue(row, ["dToDate", "dTodate", "ToDate", "cToDate"])) ||
    parseDateValue(getValue(row, ["cPeriod", "Period"]))?.split(" - ")?.[1] ||
    "";

  return { fromDate, toDate };
};

const ExpenseApprovalPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const approvalQuery = useExpenseApprovalList(payload);
  const pendingQuery = useApprovalPendingList(payload);

  const rows = useMemo(() => extractRows(approvalQuery.data), [approvalQuery.data]);
  const pendingRows = useMemo(() => extractRows(pendingQuery.data), [pendingQuery.data]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) =>
      [
        getValue(row, ["cAgentName", "AgentName", "cName", "Name"]),
        getValue(row, ["dApprovalDate"]),
        getValue(row, ["dFromDate", "FromDate", "cFromDate"]),
        getValue(row, ["dToDate", "ToDate", "cToDate"]),
        getValue(row, ["cPeriod", "Period"]),
        getValue(row, ["nTravelExpense", "TravelExpense"]),
        getValue(row, ["nOtherExpense", "OtherExpense"]),
        getValue(row, ["nClaimedExpense", "ClaimedExpense"]),
        getValue(row, ["nApprovedExpense", "ApprovedExpense"]),
      ]
        .map((value) => text(value, ""))
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [rows, search]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(filteredRows.length / pageSize)));
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const pendingCount = useMemo(() => {
    const listCount = pendingRows.length;
    const directCount = Number(getValue(pendingQuery.data, ["nCount", "count", "totalCount"])) || 0;
    return Math.max(listCount, directCount);
  }, [pendingQuery.data, pendingRows.length]);

  const openDetails = (row: Record<string, unknown>) => {
    const approvalId = Number(
      getValue(row, [
        "nApprovalId",
        "ApprovalId",
        "nApprovalID",
        "ApprovalID",
      ]),
    ) || 0;
    const expenseApprovalId = Number(
      getValue(row, [
        "nExpenseApprovalId",
        "ExpenseApprovalId",
        "nExpenseId",
        "ExpenseId",
        "id",
      ]),
    ) || 0;
    const agentId = Number(getValue(row, ["nAgentId", "AgentId", "AgentID"])) || 0;
    const { fromDate, toDate } = getRowPeriod(row);

    navigate("/more/expense-approval/view", {
      state: {
        approvalId,
        expenseApprovalId,
        nAgentId: agentId,
        fromDate,
        toDate,
        approval: row,
      },
    });
  };

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white px-5 py-4">
      <header className="mb-4 flex flex-none items-center justify-between gap-3">
        <h1 className="m-0 text-[22px] font-medium text-slate-950">Expense Approval</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white shadow-sm transition-colors hover:bg-slate-50"
            aria-label="Open filters"
          >
            <FilterOutlined className="text-[15px] text-slate-700" />
          </button>
          <Input
            className="w-[280px]"
            prefix={<SearchOutlined className="text-slate-500" />}
            placeholder="Search"
            allowClear
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden rounded-none border-0 bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className={`sticky top-0 z-10 grid ${gridTemplate} border-b border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-700`}>
            {pageColumns.map((column) => (
              <span key={column.key}>{column.label}</span>
            ))}
          </div>

          {approvalQuery.isFetching ? (
            <div className="flex h-52 items-center justify-center">
              <Spin />
            </div>
          ) : approvalQuery.isError ? (
            <div className="flex h-52 items-center justify-center text-sm text-red-500">
              Unable to load expense approvals
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

              const rowDate = formatDateTime(getValue(row, ["dApprovalDate"]));
              const period =
                text(getValue(row, ["cPeriod", "Period"]), "") ||
                `${text(getValue(row, ["dFromDate"]), "")} - ${text(getValue(row, ["dToDate", "ToDate", "cToDate"]), "")}`;

              return (
                <button
                  key={approvalId}
                  type="button"
                  className={`grid min-h-[62px] w-full ${gridTemplate} items-center border-b border-slate-100 bg-white px-2 text-left text-xs transition-colors hover:bg-slate-50`}
                  onClick={() => openDetails(row)}
                >
                  <span>{(safePage - 1) * pageSize + index + 1}</span>
                  <span>{rowDate}</span>
                  <span>{text(getValue(row, ["cAgentName", "AgentName", "cName", "Name"]))}</span>
                  <span>{period || "N/A"}</span>
                  <span>{formatCurrency(getValue(row, ["nTotalTravelExpense"]))}</span>
                  <span>{formatCurrency(getValue(row, ["nTotalOtherExpense"]))}</span>
                  <span>{formatCurrency(getValue(row, ["nClaimedAmount"]))}</span>
                  <span>{formatCurrency(getValue(row, ["nApprovedAmount"]))}</span>
                </button>
              );
            })
          ) : (
            <div className="flex h-48 items-center justify-center">
              <Empty description="No data" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-none items-center justify-between gap-3 rounded-lg bg-[#DFF2FF] px-4 py-3 text-sm text-slate-700">
        <div>
          {pendingCount > 0
            ? `${pendingCount} expense approvals are pending`
            : "No pending approvals"}
        </div>
        <button
          type="button"
          className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-600"
          onClick={() => navigate("/more/expenseapproval/pendingapproval")}
        >
          Pending Approvals
        </button>
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
    </section>
  );
};

export default ExpenseApprovalPage;
