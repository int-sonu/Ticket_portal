import { CloseOutlined, EditOutlined } from "@ant-design/icons";
import { Drawer, Empty } from "antd";
import { useMemo } from "react";
import dayjs from "dayjs";
import { formatCurrency, formatDateTime, getValue, text, number } from "./ExpenseApprovalUtils";
import nodata from "../../assets/images/noDataGif.gif";

type ExpenseApprovalDrawerProps = {
  open: boolean;
  onClose: () => void;
  approvalRow: Record<string, unknown> | null;
  approvalViewData: unknown;
  tripModes: unknown;
  onEdit: (row: Record<string, unknown>, tripModes: unknown, viewData: unknown) => void;
};

export const ExpenseApprovalDrawer = ({
  open,
  onClose,
  approvalRow,
  approvalViewData,
  tripModes,
  onEdit,
}: ExpenseApprovalDrawerProps) => {
  const details = useMemo(() => {
    if (!approvalViewData) return {};
    const src = approvalViewData as any;
    return src?.data?.data ?? src?.data ?? src ?? {};
  }, [approvalViewData]);

  const agentName = text(getValue(approvalRow, ["cAgentName", "AgentName", "cName", "Name"]), "Expense Approval");
  const initials = agentName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const department = text(getValue(approvalRow, ["cGroupName", "GroupName", "cService", "Service"]), "Development");
  const rowDate = formatDateTime(getValue(approvalRow, ["dApprovalDate", "dCreatedDate", "Date"]));

  const travelAmount = number(getValue(approvalRow, ["nTravelExpense", "TravelExpense", "nTotalTravelAmount"]));
  const otherAmount = number(getValue(approvalRow, ["nOtherExpense", "OtherExpense", "nTotalOtherAmount"]));
  const claimedAmount = number(getValue(approvalRow, ["nClaimedExpense", "ClaimedExpense", "nTotalExpenseAmount"])) || travelAmount + otherAmount;
  const approvedTravelAmount = number(getValue(details, ["nApprovedTravelExpense", "ApprovedTravelExpense"]) || travelAmount);
  const approvedOtherAmount = number(getValue(details, ["nApprovedOtherExpense", "ApprovedOtherExpense"]) || otherAmount);
  const approvedTotal = number(getValue(approvalRow, ["nApprovedExpense", "ApprovedExpense", "nApprovedAmount"])) || approvedTravelAmount + approvedOtherAmount;

  const otherExpenseItems: Record<string, unknown>[] = useMemo(() => {
    const src = approvalViewData as any;
    const candidates = [
      src?.data?.data?.otherExpenseList,
      src?.data?.data?.OtherExpenseList,
      src?.data?.otherExpenseList,
      src?.data?.OtherExpenseList,
      src?.otherExpenseList,
      src?.OtherExpenseList,
    ];
    for (const c of candidates) {
      if (Array.isArray(c)) return c;
    }
    return [];
  }, [approvalViewData]);

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold">Expense Approval</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <CloseOutlined />
          </button>
        </div>
      }
      placement="right"
      width={720}
      onClose={onClose}
      open={open}
      closable={false}
      bodyStyle={{ padding: 0 }}
      footer={
        <div className="flex justify-end p-4 border-t border-slate-100">
          <button
            onClick={() => {
              if (approvalRow) {
                onEdit(approvalRow, tripModes, approvalViewData);
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <EditOutlined className="text-lg" />
          </button>
        </div>
      }
    >
      <div className="flex h-full flex-col bg-white">
        {/* Header Box */}
        <div className="m-4 relative flex items-center gap-4 rounded-lg bg-slate-100 px-5 py-4">
          <div className="absolute top-4 right-5 text-xs text-slate-500">
            {rowDate}
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#8FC6F2] text-base font-semibold text-slate-800">
            {initials || "EP"}
          </div>
          <div>
            <div className="text-base font-medium text-slate-900">{agentName}</div>
            <div className="text-sm text-slate-500">{department}</div>
          </div>
          <div className="ml-auto flex gap-6 mt-6">
            <div>
              <span className="text-sm text-slate-700 mr-2">Claimed Expense</span>
              <span className="text-base font-medium text-yellow-500">{formatCurrency(claimedAmount)}</span>
            </div>
            <div>
              <span className="text-sm text-slate-700 mr-2">Approved Expense</span>
              <span className="text-base font-medium text-yellow-500">{formatCurrency(approvedTotal)}</span>
            </div>
          </div>
        </div>

        {/* Content Split */}
        <div className="grid min-h-0 flex-1 grid-cols-2 border-t border-slate-200">
          {/* Left Column: Travel */}
          <div className="border-r border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="text-[14px] font-medium text-slate-800">Claimed Travel expense</span>
              <div className="flex items-center gap-1 text-[14px]">
                <span className="text-blue-600">{formatCurrency(travelAmount)}</span>
                <span className="font-medium text-slate-800 ml-2">Approved</span>
                <span className="text-blue-600 ml-1">{formatCurrency(approvedTravelAmount)}</span>
              </div>
            </div>
            
            <div className="px-4 py-3 min-h-[300px]">
              <div className="flex flex-col items-center justify-center py-10">
                <img src={nodata} alt="No Data" className="h-40 w-40 object-contain" />
                <div className="mt-4 text-slate-600">No Data!</div>
              </div>
            </div>
          </div>

          {/* Right Column: Other */}
          <div className="bg-[#eaf4fc]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="text-[14px] font-medium text-slate-800">Claimed Other expense</span>
              <div className="flex items-center gap-1 text-[14px]">
                <span className="text-blue-600">{formatCurrency(otherAmount)}</span>
                <span className="font-medium text-slate-800 ml-2">Approved</span>
                <span className="text-blue-600 ml-1">{formatCurrency(approvedOtherAmount)}</span>
              </div>
            </div>

            <div className="px-4 py-3 min-h-[300px]">
              {otherExpenseItems.length > 0 ? (
                <div className="space-y-3">
                  {otherExpenseItems.map((item, idx) => {
                    const itemName = text(
                      getValue(item, ["cExpenseName", "ExpenseName", "cName", "Name", "cDescription", "Description"]),
                      `Item ${idx + 1}`,
                    );
                    const itemCode = text(getValue(item, ["cExpenseCode", "ExpenseCode", "cCode", "Code", "cShortName"]), "");
                    const itemAmount = number(getValue(item, ["nAmount", "Amount", "nExpenseAmount", "ExpenseAmount", "nClaimedAmount"]));
                    return (
                      <div
                        key={String(getValue(item, ["id", "nId", "nExpenseId"]) || idx)}
                        className="flex items-start justify-between rounded border border-sky-300 bg-white px-4 py-3"
                      >
                        <div>
                          <div className="text-[14px] font-medium text-slate-800">{itemName}</div>
                          {itemCode && <div className="text-[12px] text-slate-600">({itemCode})</div>}
                        </div>
                        <div className="text-[14px] text-slate-900">{formatCurrency(itemAmount)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <img src={nodata} alt="No Data" className="h-40 w-40 object-contain" />
                  <div className="mt-4 text-slate-600">No Data!</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
