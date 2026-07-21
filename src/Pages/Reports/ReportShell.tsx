import { useState, type ReactNode } from "react";
import { Empty, Popover, Spin } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FilterOutlined,
  LikeOutlined,
  PlusOutlined,
  PrinterOutlined,
  RightOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";

import {
  REPORT_DEFINITIONS,
} from "./reportDefinitions";
import {
  formatDateValue,
  getValue,
  text,
} from "./reportUtils";
import type {
  RecordLike,
  ReportDefinition,
  ReportKey,
} from "./reportTypes";

const asRecordList = (value: unknown): RecordLike[] => {
  if (typeof value === "string" && /^(?:\[|\{)/.test(value.trim())) {
    try { return asRecordList(JSON.parse(value)); } catch { return []; }
  }
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === "object") as RecordLike[];
  if (!value || typeof value !== "object") return [];
  const record = value as RecordLike;
  for (const key of ["data", "items", "list", "rows", "result"]) {
    const rows = asRecordList(record[key]);
    if (rows.length) return rows;
  }
  return [];
};

const dailyCollection = (record: RecordLike, aliases: string[]) => {
  const normalizedAliases = aliases.map((alias) => alias.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const [key, value] of Object.entries(record ?? {})) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!normalizedAliases.some((alias) => normalizedKey === alias || normalizedKey.includes(alias))) continue;
    const rows = asRecordList(value);
    if (rows.length || Array.isArray(value)) return rows;
  }
  return [] as RecordLike[];
};

const money = (value: unknown) => `\u20B9${Number(value || 0).toFixed(2)}`;

const DailyTable = ({
  title,
  icon,
  headers,
  rows,
  cells,
  total,
}: {
  title: string;
  icon: ReactNode;
  headers: string[];
  rows: RecordLike[];
  cells: (row: RecordLike, index: number) => string[];
  total?: string;
}) => (
  <section className="mt-3">
    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-sky-700">
      <span className="text-sm">{icon}</span>
      <span>{title} ({rows.length}){total ? ` (Total Amount: ${total})` : ""}</span>
    </div>
    <div className="overflow-x-auto rounded-sm border border-sky-100">
      <table className="w-full min-w-[720px] border-collapse text-left text-[11px] text-slate-700">
        <thead className="bg-sky-100 text-slate-900">
          <tr>{headers.map((header) => <th key={header} className="border-r border-sky-200 px-2 py-2 font-medium last:border-r-0">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={`${title}-${index}`} className="border-t border-sky-100">
              {cells(row, index).map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="px-2 py-2">{cell}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={headers.length} className="py-3 text-center text-slate-400">No data available</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const DailyExpenseBlock = ({ agent }: { agent: RecordLike }) => {
  const expenses = dailyCollection(agent, ["expenseDetails", "expenseList", "travelDetails", "travelExpense", "travellingExpense", "travelList"]);
  const other = dailyCollection(agent, ["otherExpenseList", "otherExpenses", "otherExpense"]);
  const expenseTotal = Number(getValue(agent, ["nExpense", "nExpenseTotal", "nTravelExpense", "nTravelTotal", "nTotalTravelExpense", "TravelExpense"]) || expenses.reduce((sum, row) => sum + Number(getValue(row, ["nAmount", "Amount", "nExpenseAmount"]) || 0), 0));
  const otherTotal = Number(getValue(agent, ["nOtherExpense", "nOtherExpenseTotal", "nTotalOtherExpense", "OtherExpense"]) || other.reduce((sum, row) => sum + Number(getValue(row, ["nAmount", "Amount", "nExpenseAmount"]) || 0), 0));
  const renderExpenseRows = (rows: RecordLike[]) => rows.length ? (
    <div className="divide-y divide-sky-100 bg-white">
      {rows.map((row, index) => (
        <div key={`daily-expense-${index}`} className="grid grid-cols-[90px_1fr_auto] gap-2 px-3 py-2 text-[11px] text-slate-600">
          <span>{formatDateValue(getValue(row, ["dDate", "Date", "dExpenseDate"]))}</span>
          <span>{text(getValue(row, ["cDescription", "Description", "cExpenseName", "ExpenseName", "cComment", "Comment"]))}</span>
          <span className="font-medium text-slate-800">{money(getValue(row, ["nAmount", "Amount", "nExpenseAmount"]))}</span>
        </div>
      ))}
    </div>
  ) : (
    <div className="flex min-h-[145px] items-center justify-center bg-white"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data available" /></div>
  );
  return (
    <div className="mt-3 grid grid-cols-1 overflow-hidden rounded-sm border border-sky-100 md:grid-cols-2">
      <section className="border-b border-sky-100 md:border-b-0 md:border-r">
        <div className="flex justify-between bg-sky-50 px-3 py-2 text-[11px] font-medium text-sky-700"><span>Expense</span><span>{expenses.length ? money(expenseTotal) : "--"}</span></div>
        {renderExpenseRows(expenses)}
      </section>
      <section>
        <div className="flex justify-between bg-sky-50 px-3 py-2 text-[11px] font-medium text-sky-700"><span>Other Expense</span><span>{other.length ? money(otherTotal) : "--"}</span></div>
        {renderExpenseRows(other)}
      </section>
    </div>
  );
};

const DailyServiceReportView = ({ agents }: { agents: RecordLike[] }) => (
  <div className="space-y-4 p-2">
    {agents.map((agent, agentIndex) => {
      const calls = dailyCollection(agent, ["callReportList", "callReports", "callReport"]);
      const tickets = dailyCollection(agent, ["createdTicketList", "createdTickets", "ticketList"]);
      const bills = dailyCollection(agent, ["billList", "bills", "billDetails"]);
      const receipts = dailyCollection(agent, ["receiptList", "receipts", "receiptDetails"]);
      const checkIns = dailyCollection(agent, ["generalCheckInList", "generalCheckIn", "checkInList"]);
      const replacements = dailyCollection(agent, ["itemReplaceList", "replacePartList", "itemReplace"]);
      const repairs = dailyCollection(agent, ["itemTakenForRepairList", "repairPartList", "itemTakenForRepair"]);
      const billTotal = bills.reduce((sum, row) => sum + Number(getValue(row, ["nAmount", "Amount", "nBillAmount", "BillAmount"]) || 0), 0);
      const receiptTotal = receipts.reduce((sum, row) => sum + Number(getValue(row, ["nAmount", "Amount", "nReceiptAmount", "ReceiptAmount"]) || 0), 0);
      return (
        <article key={`daily-agent-${agentIndex}`} className="border border-sky-200 bg-white">
          <div className="flex items-center justify-between border-b border-sky-100 px-3 py-3 text-xs text-slate-800">
            <span className="flex items-center gap-2 font-medium"><UserOutlined />{text(getValue(agent, ["cAgentName", "AgentName", "Agent", "cName"]), `Agent ${agentIndex + 1}`)}</span>
            <span className="flex items-center gap-2"><CalendarOutlined />{formatDateValue(getValue(agent, ["dDate", "Date", "cDate"]))}</span>
          </div>
          <div className="grid grid-cols-1 border-b border-sky-100 text-[11px] md:grid-cols-3">
            <div className="space-y-2 border-r border-sky-100 px-3 py-2"><div><LikeOutlined className="mr-2" />Punch In Time : {text(getValue(agent, ["cPunchInTime", "cPunchIn", "PunchInTime", "PunchIn"]))}</div><div><EnvironmentOutlined className="mr-2" />Location : {text(getValue(agent, ["cPunchInLocation", "PunchInLocation", "cInLocation"]))}</div></div>
            <div className="space-y-2 border-r border-sky-100 px-3 py-2"><div><LikeOutlined className="mr-2" />Punch Out Time : {text(getValue(agent, ["cPunchOutTime", "cPunchOut", "PunchOutTime", "PunchOut"]))}</div><div><EnvironmentOutlined className="mr-2" />Location : {text(getValue(agent, ["cPunchOutLocation", "PunchOutLocation", "cOutLocation"]))}</div></div>
            <div className="px-3 py-2"><ClockCircleOutlined className="mr-2" />Total Working Hrs : {text(getValue(agent, ["cTotalWorkingHours", "cWorkingHours", "TotalWorkingHours", "WorkingHours"]))}</div>
          </div>
          <div className="px-2 pb-3">
            <DailyTable title="Call Report" icon={<FileTextOutlined />} rows={calls} headers={["Sl No", "Call Rpt No", "Ticket No", "Customer Name", "Call Summary", "Time Taken", "Bill No", "Bill Amount", "Status"]} cells={(row, index) => [String(index + 1), text(getValue(row, ["nCallReportNo", "cCallReportNo", "CallReportNo"])), text(getValue(row, ["nTicketNo", "cTicketNo", "TicketNo"])), text(getValue(row, ["cCustomerName", "CustomerName"])), text(getValue(row, ["cCallSummary", "CallSummary", "cSummary"])), text(getValue(row, ["cTimeTaken", "TimeTaken"])), text(getValue(row, ["nBillNo", "cBillNo", "BillNo"])), money(getValue(row, ["nBillAmount", "BillAmount"])), text(getValue(row, ["cStatus", "Status"]))]} />
            <DailyTable title="Created Tickets" icon={<FileTextOutlined />} rows={tickets} headers={["Sl No", "Ticket No", "Customer Name", "Ticket Summary", "Priority"]} cells={(row, index) => [String(index + 1), text(getValue(row, ["nTicketNo", "cTicketNo", "TicketNo"])), text(getValue(row, ["cCustomerName", "CustomerName"])), text(getValue(row, ["cTicketSummary", "TicketSummary", "cSummary"])), text(getValue(row, ["cPriority", "Priority"]))]} />
            <DailyTable title="Bills" icon={<FileTextOutlined />} rows={bills} total={money(billTotal)} headers={["Sl No", "Bill No", "Customer Name", "Amount", "Paymode"]} cells={(row, index) => [String(index + 1), text(getValue(row, ["nBillNo", "cBillNo", "BillNo"])), text(getValue(row, ["cCustomerName", "CustomerName"])), money(getValue(row, ["nAmount", "Amount", "nBillAmount"])), text(getValue(row, ["cPaymode", "Paymode", "cPaymentMode"]))]} />
            <DailyTable title="Receipt" icon={<FileTextOutlined />} rows={receipts} total={money(receiptTotal)} headers={["Sl No", "Rec No", "Customer Name", "Amount", "Paymode"]} cells={(row, index) => [String(index + 1), text(getValue(row, ["nReceiptNo", "cReceiptNo", "RecNo", "ReceiptNo"])), text(getValue(row, ["cCustomerName", "CustomerName"])), money(getValue(row, ["nAmount", "Amount", "nReceiptAmount"])), text(getValue(row, ["cPaymode", "Paymode", "cPaymentMode"]))]} />
            <DailyTable title="General Check in" icon={<RightOutlined />} rows={checkIns} headers={["Sl No", "Contact Person Name", "Call Summary"]} cells={(row, index) => [String(index + 1), text(getValue(row, ["cContactPersonName", "ContactPersonName", "cContactPerson"])), text(getValue(row, ["cCallSummary", "CallSummary", "cSummary"]))]} />
            <DailyTable title="Item Replace" icon={<ToolOutlined />} rows={replacements} headers={["Sl No", "Item Name", "Qty", "Comment"]} cells={(row, index) => [String(index + 1), text(getValue(row, ["cItemName", "ItemName", "cPartName", "PartName"])), text(getValue(row, ["nQty", "Qty", "Quantity"]), "0"), text(getValue(row, ["cComment", "Comment", "cRemarks"]))]} />
            <DailyTable title="Item Taken for Repair" icon={<ToolOutlined />} rows={repairs} headers={["Sl No", "Item Name", "Qty", "Comment"]} cells={(row, index) => [String(index + 1), text(getValue(row, ["cItemName", "ItemName", "cPartName", "PartName"])), text(getValue(row, ["nQty", "Qty", "Quantity"]), "0"), text(getValue(row, ["cComment", "Comment", "cRemarks"]))]} />
            <DailyExpenseBlock agent={agent} />
          </div>
        </article>
      );
    })}
  </div>
);

const ReportShell = ({
  activeDefinition,
  activeRows,
  rawRows,
  loading,
  filterText,
  openReports,
  activeReportKey,
  onClose,
  onAdd,
  onFilter,
  onDownloadPdf,
  onDownloadExcel,
  onPrint,
  onSelectTab,
  onCloseTab,
}: {
  activeDefinition: ReportDefinition;
  activeRows: string[][];
  rawRows: RecordLike[];
  loading: boolean;
  filterText: string;
  openReports: ReportKey[];
  activeReportKey: ReportKey | null;
  onClose: () => void;
  onAdd: () => void;
  onFilter: () => void;
  onDownloadPdf: () => void;
  onDownloadExcel: () => void;
  onPrint: () => void;
  onSelectTab: (key: ReportKey) => void;
  onCloseTab: (key: ReportKey) => void;
}) => {
  const [downloadOpen, setDownloadOpen] = useState(false);

  const downloadMenu = (
    <div className="flex w-40 flex-col py-1">
      <button
        type="button"
        onClick={() => {
          setDownloadOpen(false);
          onDownloadPdf();
        }}
        className="flex items-center gap-2 rounded px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
      >
        <FilePdfOutlined className="text-rose-500" /> Download PDF
      </button>
      <button
        type="button"
        onClick={() => {
          setDownloadOpen(false);
          onDownloadExcel();
        }}
        className="flex items-center gap-2 rounded px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
      >
        <FileExcelOutlined className="text-emerald-500" /> Download Excel
      </button>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between">
        <h1 className="m-0 text-xl font-medium text-slate-950">Reports</h1>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close report"
          className="cursor-pointer text-xl"
        >
          <CloseOutlined />
        </button>
      </header>

      <div className="mt-1 flex h-[50px] items-center border border-slate-200 px-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {openReports.map((key) => {
            const report = REPORT_DEFINITIONS[key];
            const active = key === activeReportKey;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectTab(key)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white transition-colors ${
                  active ? "bg-sky-500" : "bg-sky-800/90"
                }`}
              >
                <span>{report.chipLabel}</span>
                <span
                  role="button"
                  tabIndex={0}
                  className="inline-flex items-center"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCloseTab(key);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      onCloseTab(key);
                    }
                  }}
                >
                  <CloseOutlined className="text-xs" />
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onAdd}
          aria-label="Add report"
          className="ml-4 cursor-pointer text-lg text-slate-600"
        >
          <PlusOutlined />
        </button>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onFilter}
            aria-label="Filter"
            className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-900 text-white"
          >
            <FilterOutlined />
          </button>
          <Popover
            content={downloadMenu}
            trigger="click"
            placement="bottomRight"
            open={downloadOpen}
            onOpenChange={setDownloadOpen}
            arrow={false}
          >
            <button
              type="button"
              aria-label="Download report"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-900 text-white"
            >
              <DownloadOutlined />
            </button>
          </Popover>
          <button
            type="button"
            onClick={onPrint}
            aria-label="Print"
            className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-900 text-white"
          >
            <PrinterOutlined />
          </button>
        </div>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col border border-slate-100 shadow-sm">
        <div className="border border-sky-200 bg-sky-50 px-2 py-3 text-xs text-slate-800">
          <span className="mr-6 text-sky-600">Applied Filters</span>
          {filterText}
        </div>

        {activeDefinition.key !== "ticketHistory" && activeDefinition.key !== "dailyService" ? (
          <div className="grid min-w-[840px] border-b border-slate-100 px-2 py-4 text-xs font-medium text-slate-900" style={{ gridTemplateColumns: activeDefinition.gridColumns }}>
            {activeDefinition.headers.map((header) => <span key={header}>{header}</span>)}
          </div>
        ) : null}

        <Spin spinning={loading} className="!flex min-h-0 flex-1 flex-col">
          <div className="max-h-[calc(100vh-270px)] min-h-[170px] overflow-auto">
            {rawRows.length && activeDefinition.key === "dailyService" ? (
              <DailyServiceReportView agents={rawRows} />
            ) : activeRows.length && activeDefinition.key === "ticketHistory" ? (
              <div className="space-y-4 p-6">
                {activeRows.map((row, index) => (
                  <div key={`ticket-history-${index}`} className="grid grid-cols-[24px_1fr] gap-3 text-sm text-slate-700">
                    <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-sky-700 text-[10px] text-sky-700">◷</span>
                    <div>
                      <div className="text-xs text-slate-700">{row[0]}</div>
                      <div className="mt-1 font-medium text-sky-800">{row[1]}</div>
                      <div className="mt-2 rounded border border-sky-200 bg-sky-50 px-3 py-2">{row[2]}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activeRows.length ? (
              activeRows.map((row, index) => (
                <div
                  key={`${activeDefinition.key}-${index}`}
                  className="grid min-w-[840px] border-b border-slate-100 px-2 py-3 text-xs text-slate-700"
                  style={{ gridTemplateColumns: activeDefinition.gridColumns }}
                >
                  {row.map((cell, cellIndex) => (
                    <span key={`${index}-${cellIndex}`}>{cell}</span>
                  ))}
                </div>
              ))
            ) : (
              <div className="flex min-h-[170px] items-center justify-center">
                <Empty description="No data" />
              </div>
            )}
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default ReportShell;
