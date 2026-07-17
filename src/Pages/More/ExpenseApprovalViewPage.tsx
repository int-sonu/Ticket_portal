import { CloseOutlined } from "@ant-design/icons";
import { Button, Empty, Spin } from "antd";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import { getRequestPayload } from "../../Utils/requestPayload";
import { useExpenseApprovalPeriodList } from "./ExpenseApprovalHooks";
import {
  extractDetails,
  extractRows,
  formatCurrency,
  formatDateTime,
  getValue,
  text,
} from "./ExpenseApprovalUtils";
import type { ExpenseApprovalRecord } from "./ExpenseApprovalUtils";

type LocationState = { expenseApprovalId?: number; approval?: ExpenseApprovalRecord } | null;

const ExpenseApprovalViewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const fallback = state?.approval ?? {};
  const expenseApprovalId =
    Number(
      state?.expenseApprovalId ??
        getValue(fallback, [
          "nExpenseApprovalId",
          "ExpenseApprovalId",
          "nExpenseId",
          "ExpenseId",
          "id",
        ]),
    ) || 0;

  const payload = useMemo(() => {
    const { nCompanyId, cSchemaName, cDbName } = getRequestPayload();
    const fallbackFromDate =
      text(getValue(fallback, ["dFromDate", "FromDate", "cFromDate"]), "") ||
      dayjs().startOf("month").format("YYYY/MM/DD");
    const fallbackToDate =
      text(getValue(fallback, ["dToDate", "ToDate", "cToDate"]), "") ||
      dayjs().format("YYYY/MM/DD");

    return {
      nExpenseApprovalId: expenseApprovalId,
      nExpenseId: expenseApprovalId,
      nCompanyId,
      cSchemaName,
      cDbName,
      bDateFilter: true,
      dFromDate: fallbackFromDate,
      dToDate: fallbackToDate,
    };
  }, [expenseApprovalId]);

  const detailsQuery = useExpenseApprovalPeriodList(payload, expenseApprovalId > 0);
  const details = extractDetails(detailsQuery.data, fallback);
  const periodRows = useMemo(
    () => extractRows(detailsQuery.data),
    [detailsQuery.data],
  );

  const value = (keys: string[]) => getValue(details, keys) || getValue(fallback, keys);
  const agentName = text(value(["cAgentName", "AgentName", "cName", "Name"]), "Expense Approval");
  const initials = agentName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const summaryPeriod =
    text(value(["cPeriod", "Period"]), "") ||
    `${text(value(["dFromDate", "FromDate", "cFromDate"]), "")} - ${text(value(["dToDate", "ToDate", "cToDate"]), "")}`;

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white px-4 py-2">
      <header className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="m-0 text-xl font-medium text-slate-950">Expense Approval</h1>
        <Button
          type="text"
          icon={<CloseOutlined className="text-xl" />}
          onClick={() => navigate("/more/expense-approval")}
        />
      </header>

      {detailsQuery.isFetching && !detailsQuery.data ? (
        <div className="flex flex-1 items-center justify-center">
          <Spin />
        </div>
      ) : (
        <div className="min-h-0 flex-1 px-1 pt-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-medium text-slate-600">
              {initials || "EP"}
            </div>
            <div>
              <div className="text-base font-medium text-slate-950">{agentName}</div>
              <div className="text-sm text-slate-500">{summaryPeriod || "N/A"}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 border-y border-slate-200 py-3 text-sm">
            <div>
              Travel Expense:{" "}
              <strong className="ml-2 text-base">
                {formatCurrency(value(["nTravelExpense", "TravelExpense", "nTravelAmount"]))}
              </strong>
            </div>
            <div>
              Other Expense:{" "}
              <strong className="ml-2 text-base">
                {formatCurrency(value(["nOtherExpense", "OtherExpense", "nOtherAmount"]))}
              </strong>
            </div>
            <div>
              Claimed Expense:{" "}
              <strong className="ml-2 text-base">
                {formatCurrency(value(["nClaimedExpense", "ClaimedExpense", "nClaimAmount"]))}
              </strong>
            </div>
            <div>
              Approved Expense:{" "}
              <strong className="ml-2 text-base">
                {formatCurrency(value(["nApprovedExpense", "ApprovedExpense", "nApprovedAmount"]))}
              </strong>
            </div>
          </div>

          <div className="mt-4 text-lg font-medium text-sky-800">Approval Periodic List</div>

          <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="grid grid-cols-[42px_150px_1fr_1fr_1fr] border-b border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-700">
              <span>Srl</span>
              <span>Date</span>
              <span>Particular</span>
              <span>Remarks</span>
              <span className="text-right">Amount</span>
            </div>

            <div className="max-h-[calc(100vh-320px)] overflow-y-auto overflow-x-hidden">
              {detailsQuery.isFetching ? (
                <div className="flex h-52 items-center justify-center">
                  <Spin />
                </div>
              ) : periodRows.length ? (
                periodRows.map((row, index) => {
                  const amount = getValue(row, [
                    "nAmount",
                    "Amount",
                    "nExpenseAmount",
                    "ExpenseAmount",
                    "nClaimedAmount",
                  ]);

                  return (
                    <div
                      key={String(
                        getValue(row, [
                          "nExpensePeriodId",
                          "ExpensePeriodId",
                          "id",
                          "nExpenseApprovalPeriodId",
                        ]) || index,
                      )}
                      className="grid min-h-[62px] grid-cols-[42px_150px_1fr_1fr_1fr] items-center border-b border-slate-100 bg-white px-2 text-xs"
                    >
                      <span>{index + 1}</span>
                      <span>{formatDateTime(getValue(row, ["dDate", "Date", "cDate"]))}</span>
                      <span>{text(getValue(row, ["cItem", "cItemName", "ItemName", "cParticular", "Particular"]))}</span>
                      <span>{text(getValue(row, ["cRemarks", "Remarks", "Comment", "Description"]))}</span>
                      <span className="text-right">{formatCurrency(amount)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-48 items-center justify-center">
                  <Empty description="No periodic records" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 text-right text-sm text-slate-500">
            {!expenseApprovalId ? "Open from the list to load periodic records." : `Approval ID: ${expenseApprovalId}`}
          </div>
        </div>
      )}
    </section>
  );
};

export default ExpenseApprovalViewPage;
