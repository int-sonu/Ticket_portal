import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { agentApis } from "../../Axios/MasterApis";
import { reportApis } from "../../Axios/ReportsApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import { REPORT_DEFINITIONS } from "./reportDefinitions";
import {
  extractRowsFromResponse,
  getValue,
  isExtraReportKey,
  toOptionalInt,
} from "./reportUtils";
import type {
  BillFilterDraft,
  CallFilterDraft,
  ExpenseFilterDraft,
  ExtraFilterDraft,
  ExtraReportKey,
  ItemSalesFilterDraft,
  RecordLike,
  ReportFilter,
  ReportKey,
  SelectOption,
  TicketFilterDraft,
  TravelFilterDraft,
} from "./reportTypes";

type UseReportQueriesParams = {
  activeReportKey: ReportKey | null;
  reportFilters: Partial<Record<ReportKey, ReportFilter>>;
  basePayload: ReturnType<typeof getRequestPayload>;
  dropdownCompanyPayload: ReturnType<typeof getRequestPayload>;
  appliedTicketDraft: TicketFilterDraft | null;
  appliedCallDraft: CallFilterDraft | null;
  appliedTravelDraft: TravelFilterDraft | null;
  appliedExpenseDraft: ExpenseFilterDraft | null;
  appliedBillDraft: BillFilterDraft | null;
  appliedItemSalesDraft: ItemSalesFilterDraft | null;
  appliedExtraDrafts: Partial<Record<ExtraReportKey, ExtraFilterDraft>>;
  agentSelectOptions: SelectOption[];
  customerSelectOptions: SelectOption[];
  partSelectOptions: SelectOption[];
  replaceCustomerOptions: SelectOption[];
  replaceAgentOptions: SelectOption[];
  leaveApprovalAgentOptions: SelectOption[];
  ticketNumberOptions: SelectOption[];
};

export const useReportQueries = ({
  activeReportKey,
  reportFilters,
  basePayload,
  dropdownCompanyPayload,
  appliedTicketDraft,
  appliedCallDraft,
  appliedTravelDraft,
  appliedExpenseDraft,
  appliedBillDraft,
  appliedItemSalesDraft,
  appliedExtraDrafts,
  agentSelectOptions,
  customerSelectOptions,
  partSelectOptions,
  replaceCustomerOptions,
  replaceAgentOptions,
  leaveApprovalAgentOptions,
  ticketNumberOptions,
}: UseReportQueriesParams) => {
const activeAppliedFilter = activeReportKey ? reportFilters[activeReportKey] ?? null : null;

const commonReportPayload = useMemo(() => {
  if (!activeAppliedFilter) return null;

  const company = activeAppliedFilter.company.raw;

  return {
    ...basePayload,
    nCompanyId: Number(activeAppliedFilter.company.value) || basePayload.nCompanyId,
    cDbName: getValue(company, ["cDbName", "DbName"], basePayload.cDbName),
    cSchemaName: getValue(company, ["cSchemaName", "SchemaName"], basePayload.cSchemaName),
    dFromDate: activeAppliedFilter.from.format("YYYY-MM-DD"),
    dToDate: activeAppliedFilter.to.format("YYYY-MM-DD"),
    cFromDate: activeAppliedFilter.from.format("YYYY-MM-DD"),
    cFromdate: activeAppliedFilter.from.format("YYYY-MM-DD"),
    cToDate: activeAppliedFilter.to.format("YYYY-MM-DD"),
    cDate: activeAppliedFilter.from.format("YYYY-MM-DD"),
    dDate: activeAppliedFilter.from.format("YYYY-MM-DD"),
    nPageNo: 1,
    nPageSize: 1000,
  };
}, [activeAppliedFilter, basePayload]);

const ticketReportPayload = useMemo(() => {
  if (activeReportKey !== "ticket" || !appliedTicketDraft) return null;
  const ticketTypeId = toOptionalInt(appliedTicketDraft.ticketType);
  const dateTypeId = toOptionalInt(appliedTicketDraft.dateType);
  const priorityId = toOptionalInt(appliedTicketDraft.priority);
  const ticketStageId = toOptionalInt(appliedTicketDraft.ticketStage);

  return {
    ...commonReportPayload,
    cTicketType: appliedTicketDraft.ticketType === "All" ? "" : appliedTicketDraft.ticketType,
    nTicketType: ticketTypeId,
    cDateType: appliedTicketDraft.dateType,
    nDateType: dateTypeId,
    dFromDate: appliedTicketDraft.from.format("YYYY-MM-DD"),
    dToDate: appliedTicketDraft.to.format("YYYY-MM-DD"),
    cFromDate: appliedTicketDraft.from.format("YYYY-MM-DD"),
    cToDate: appliedTicketDraft.to.format("YYYY-MM-DD"),
    cCustomerId: String(appliedTicketDraft.customerId || "0"),
    cAssignAgentId: String(appliedTicketDraft.assignedTo || "0"),
    cCreatedBy: String(appliedTicketDraft.createdBy || "0"),
    nCustomerId: Number(appliedTicketDraft.customerId || 0),
    nAssignedTo: Number(appliedTicketDraft.assignedTo || 0),
    nCreatedBy: Number(appliedTicketDraft.createdBy || 0),
    cPriority: appliedTicketDraft.priority === "All" ? "" : appliedTicketDraft.priority,
    nPriority: priorityId,
    cTicketStage: appliedTicketDraft.ticketStage === "All" ? "" : appliedTicketDraft.ticketStage,
    nTicketStage: ticketStageId,
    cStatus: appliedTicketDraft.ticketStage === "All" ? "" : appliedTicketDraft.ticketStage,
    nStatus: ticketStageId,
    nPageNo: 1,
    nPageSize: 1000,
  };
}, [activeReportKey, appliedTicketDraft, commonReportPayload]);

const callReportPayload = useMemo(() => {
  if (activeReportKey !== "call" || !appliedCallDraft) return null;

  return {
    ...commonReportPayload,
    dFromDate: appliedCallDraft.from.format("YYYY-MM-DD"),
    dToDate: appliedCallDraft.to.format("YYYY-MM-DD"),
    cFromDate: appliedCallDraft.from.format("YYYY-MM-DD"),
    cToDate: appliedCallDraft.to.format("YYYY-MM-DD"),
    cCustomerId: String(appliedCallDraft.customerId || "0"),
    cCustomerid: String(appliedCallDraft.customerId || "0"),
    cAgentId: String(appliedCallDraft.agentId || "0"),
    cAssignAgentId: String(appliedCallDraft.agentId || "0"),
    cCreatedBy: "0",
    nAgentId: Number(appliedCallDraft.agentId || 0),
    nCustomerId: Number(appliedCallDraft.customerId || 0),
    nAssignAgentId: Number(appliedCallDraft.agentId || 0),
    nCreatedBy: 0,
    cStatus: appliedCallDraft.status === "All" ? "" : appliedCallDraft.status,
    nStatus: toOptionalInt(appliedCallDraft.status),
    cBillStatus: appliedCallDraft.billStatus === "All" ? "" : appliedCallDraft.billStatus,
    nBillStatus: toOptionalInt(appliedCallDraft.billStatus),
    nPageNo: 1,
    nPageSize: 1000,
  };
}, [activeReportKey, appliedCallDraft, commonReportPayload]);

const customerQuery = useQuery({
  queryKey: ["reports", "customer", commonReportPayload],
  queryFn: () => reportApis.customerDetailsReport(commonReportPayload!),
  enabled: activeReportKey === "customer" && Boolean(commonReportPayload),
});

const ticketAgentQuery = useQuery({
  queryKey: ["reports", "ticket-agent-list", dropdownCompanyPayload],
  queryFn: () => agentApis.agentDropDown(dropdownCompanyPayload),
  enabled: activeReportKey === "ticket" && Boolean(dropdownCompanyPayload.nCompanyId),
});

const ticketQuery = useQuery({
  queryKey: ["reports", "ticket", ticketReportPayload],
  queryFn: () => reportApis.ticketListReport(ticketReportPayload!),
  enabled: activeReportKey === "ticket" && Boolean(ticketReportPayload),
});

const callQuery = useQuery({
  queryKey: ["reports", "call", callReportPayload],
  queryFn: () => reportApis.callReportListReport(callReportPayload!),
  enabled: activeReportKey === "call" && Boolean(callReportPayload),
});

const travelPayload = useMemo(() => {
  if (!commonReportPayload || activeReportKey !== "travel" || !appliedTravelDraft) return null;

  return {
    ...commonReportPayload,
    cAgentId: String(appliedTravelDraft.agentId || "0"),
    nAgentId: Number(appliedTravelDraft.agentId || 0),
  };
}, [activeReportKey, appliedTravelDraft, commonReportPayload]);

const travelQuery = useQuery({
  queryKey: ["reports", "travel", travelPayload],
  queryFn: () => reportApis.travelLogReport(travelPayload!),
  enabled: Boolean(travelPayload),
});

const expensePayload = useMemo(() => {
  if (!commonReportPayload || activeReportKey !== "expense" || !appliedExpenseDraft) return null;
  return {
    ...commonReportPayload,
    cAgentId: String(appliedExpenseDraft.agentId || "0"),
    nAgentId: Number(appliedExpenseDraft.agentId || 0),
  };
}, [activeReportKey, appliedExpenseDraft, commonReportPayload]);

const expenseQuery = useQuery({
  queryKey: ["reports", "expense", expensePayload],
  queryFn: () => reportApis.expenseReport(expensePayload!),
  enabled: Boolean(expensePayload),
});

const billPayload = useMemo(() => {
  if (!commonReportPayload || activeReportKey !== "bill" || !appliedBillDraft) return null;
  return {
    ...commonReportPayload,
    cReportType: appliedBillDraft.reportType,
    cSummaryLevel: appliedBillDraft.summaryLevel,
    nLevel: appliedBillDraft.reportType === "Summary" ? 1 : 2,
    nPeriodType: appliedBillDraft.summaryLevel === "Day wise" ? 2 : 1,
    nSummaryLevel: appliedBillDraft.summaryLevel === "Day wise" ? 2 : 1,
    cGroupBy: appliedBillDraft.summaryLevel === "Day wise" ? "Day" : "Month",
    cCustomerid: "0",
    cCustomerId: "0",
    nAgentId: Number(basePayload.nAgentId ?? basePayload.id ?? 0),
    cAgentId: String(basePayload.nAgentId ?? basePayload.id ?? "0"),
  };
}, [activeReportKey, appliedBillDraft, basePayload.id, basePayload.nAgentId, commonReportPayload]);

const billQuery = useQuery({
  queryKey: ["reports", "bill", billPayload],
  queryFn: () => reportApis.billReport(billPayload!),
  enabled: Boolean(billPayload),
});

const itemSalesPayload = useMemo(() => {
  if (!commonReportPayload || activeReportKey !== "itemSales" || !appliedItemSalesDraft) return null;
  return {
    ...commonReportPayload,
    cCustomerId: String(appliedItemSalesDraft.customerId || "0"),
    nCustomerId: Number(appliedItemSalesDraft.customerId || 0),
    cPartId: String(appliedItemSalesDraft.itemId || "0"),
    nPartId: Number(appliedItemSalesDraft.itemId || 0),
    cItemId: String(appliedItemSalesDraft.itemId || "0"),
    nItemId: Number(appliedItemSalesDraft.itemId || 0),
  };
}, [activeReportKey, appliedItemSalesDraft, commonReportPayload]);

const itemSalesQuery = useQuery({
  queryKey: ["reports", "item-sales", itemSalesPayload],
  queryFn: () => reportApis.itemWiseSalesReport(itemSalesPayload!),
  enabled: Boolean(itemSalesPayload),
});

const activeExtraDraft = activeReportKey && isExtraReportKey(activeReportKey)
  ? appliedExtraDrafts[activeReportKey] ?? null
  : null;
const extraReportPayload = useMemo(() => {
  if (!commonReportPayload || !activeExtraDraft) return null;
  const statusId = activeReportKey === "incomeExpense"
    ? activeExtraDraft.status === "Closed" ? 1 : 0
    : activeExtraDraft.status === "Approved" ? 1 : activeExtraDraft.status === "Rejected" ? 2 : 0;
  const selectedAgentIds = activeExtraDraft.agentIds.length ? activeExtraDraft.agentIds : activeExtraDraft.agentId ? [activeExtraDraft.agentId] : [];
  return {
    ...commonReportPayload,
    cCustomerid: String(activeExtraDraft.customerId || "0"),
    cCustomerId: String(activeExtraDraft.customerId || "0"),
    nCustomerId: Number(activeExtraDraft.customerId || 0),
    cAgentId: activeReportKey === "dailyService" ? selectedAgentIds.join(",") || "0" : String(activeExtraDraft.agentId || "0"),
    cAssignAgentId: String(activeExtraDraft.agentId || "0"),
    nAgentId: Number(activeExtraDraft.agentId || selectedAgentIds[0] || 0),
    cStatus: activeExtraDraft.status === "All" ? "" : activeExtraDraft.status,
    cLeaveStatus: activeExtraDraft.status === "All" ? "" : activeExtraDraft.status,
    nStatus: activeExtraDraft.status === "All" ? -1 : statusId,
    nLeaveStatus: activeExtraDraft.status === "All" ? -1 : statusId,
    cReturnStatus: activeExtraDraft.returnStatus === "All" ? "" : activeExtraDraft.returnStatus,
    cReportType: activeExtraDraft.reportType,
    cSummaryLevel: activeExtraDraft.summaryLevel,
    nLevel: activeExtraDraft.reportType === "Summary" ? 1 : 2,
    nPeriodType: activeExtraDraft.summaryLevel === "Day wise" ? 2 : 1,
    nSummaryLevel: activeExtraDraft.summaryLevel === "Day wise" ? 2 : 1,
    cGroupBy: activeExtraDraft.summaryLevel === "Day wise" ? "Day" : "Month",
    cDateType: activeExtraDraft.dateType,
    nDateType: activeExtraDraft.dateType === "Closed Date" ? 2 : 1,
    nTicketId: Number(activeExtraDraft.ticketId || 0),
    cTicketId: String(activeExtraDraft.ticketId || "0"),
    cAgentIds: selectedAgentIds.join(","),
    nAgentIds: selectedAgentIds.map(Number),
    bDetailedTravelExpense: activeExtraDraft.detailedTravelExpense,
    bDetailedTravelExpenses: activeExtraDraft.detailedTravelExpense,
    bDetailedTravellingExpense: activeExtraDraft.detailedTravelExpense,
    nApprovedBy: Number(activeExtraDraft.agentId || 0),
  };
}, [activeExtraDraft, activeReportKey, commonReportPayload]);

const outstandingQuery = useQuery({ queryKey: ["reports", "outstanding", extraReportPayload], queryFn: () => reportApis.customerOutstandingReport(extraReportPayload!), enabled: activeReportKey === "outstanding" && Boolean(extraReportPayload) });
const repairPartsQuery = useQuery({ queryKey: ["reports", "repair-parts", extraReportPayload], queryFn: () => reportApis.repairPartsReport(extraReportPayload!), enabled: activeReportKey === "repairParts" && Boolean(extraReportPayload) });
const replacePartsQuery = useQuery({ queryKey: ["reports", "replace-parts", extraReportPayload], queryFn: () => reportApis.replacePartsReport(extraReportPayload!), enabled: activeReportKey === "replaceParts" && Boolean(extraReportPayload) });
const receiptQuery = useQuery({ queryKey: ["reports", "receipt", extraReportPayload], queryFn: () => reportApis.receiptReport(extraReportPayload!), enabled: activeReportKey === "receipt" && Boolean(extraReportPayload) });
const attendanceQuery = useQuery({ queryKey: ["reports", "attendance", extraReportPayload], queryFn: () => reportApis.attendanceSummaryReport(extraReportPayload!), enabled: activeReportKey === "attendance" && Boolean(extraReportPayload) });
const leaveApplicationQuery = useQuery({ queryKey: ["reports", "leave-application", extraReportPayload], queryFn: () => reportApis.leaveApplicationReport(extraReportPayload!), enabled: activeReportKey === "leaveApplication" && Boolean(extraReportPayload) });
const leaveApprovalQuery = useQuery({ queryKey: ["reports", "leave-approval", extraReportPayload], queryFn: () => reportApis.leaveApprovalReport(extraReportPayload!), enabled: activeReportKey === "leaveApproval" && Boolean(extraReportPayload) });
const agentReportQuery = useQuery({ queryKey: ["reports", "agent-list", extraReportPayload], queryFn: () => reportApis.agentListReport(extraReportPayload!), enabled: activeReportKey === "agentList" && Boolean(extraReportPayload) });
const incomeExpenseQuery = useQuery({ queryKey: ["reports", "income-expense", extraReportPayload], queryFn: () => reportApis.incomeExpenseReport(extraReportPayload!), enabled: activeReportKey === "incomeExpense" && Boolean(extraReportPayload) });
const ticketHistoryQuery = useQuery({ queryKey: ["reports", "ticket-history", extraReportPayload], queryFn: () => reportApis.ticketHistoryReport(extraReportPayload!), enabled: activeReportKey === "ticketHistory" && Boolean(extraReportPayload) });
const dailyServiceQuery = useQuery({ queryKey: ["reports", "daily-service", extraReportPayload], queryFn: () => reportApis.dailyServiceReport(extraReportPayload!), enabled: activeReportKey === "dailyService" && Boolean(extraReportPayload) });

const activeDefinition = useMemo(() => {
  if (!activeReportKey) return null;
  const definition = REPORT_DEFINITIONS[activeReportKey];
  if (activeReportKey === "bill" && appliedBillDraft?.summaryLevel === "Day wise") {
    return { ...definition, headers: definition.headers.map((header) => header === "Month" ? "Date" : header) };
  }
  if (activeReportKey === "receipt" && activeExtraDraft?.summaryLevel === "Day wise") {
    return { ...definition, headers: definition.headers.map((header) => header === "Month" ? "Date" : header) };
  }
  return definition;
}, [activeExtraDraft?.summaryLevel, activeReportKey, appliedBillDraft?.summaryLevel]);

const activeRows = useMemo(() => {
  if (!activeDefinition) return [] as RecordLike[];

  if (activeDefinition.key === "customer") {
    return extractRowsFromResponse(customerQuery.data, ["customerDetailsReport", "CustomerDetailsReport"]);
  }

  if (activeDefinition.key === "ticket") {
    return extractRowsFromResponse(ticketQuery.data, ["ticketListReport", "TicketListReport"]);
  }

  if (activeDefinition.key === "call") {
    return extractRowsFromResponse(callQuery.data, ["callReportList", "CallReportList", "callreportList", "callReportListReport", "CallReportListReport"]);
  }

  if (activeDefinition.key === "travel") {
    return extractRowsFromResponse(travelQuery.data, ["travelLogReport", "TravelLogReport"]);
  }

  if (activeDefinition.key === "expense") {
    return extractRowsFromResponse(expenseQuery.data, ["expenseReport", "ExpenseReport"]);
  }

  if (activeDefinition.key === "bill") {
    return extractRowsFromResponse(billQuery.data, ["billReport", "BillReport"]);
  }

  if (activeDefinition.key === "itemSales") {
    return extractRowsFromResponse(itemSalesQuery.data, ["itemWiseSalesReport", "ItemWiseSalesReport"]);
  }

  if (activeDefinition.key === "outstanding") return extractRowsFromResponse(outstandingQuery.data, ["customerOutstandingReport", "CustomerOutstandingReport"]);
  if (activeDefinition.key === "repairParts") return extractRowsFromResponse(repairPartsQuery.data, ["repairPartsReport", "RepairPartsReport"]);
  if (activeDefinition.key === "replaceParts") return extractRowsFromResponse(replacePartsQuery.data, ["replacePartsReport", "ReplacePartsReport"]);
  if (activeDefinition.key === "receipt") return extractRowsFromResponse(receiptQuery.data, ["receiptReport", "ReceiptReport"]);
  if (activeDefinition.key === "attendance") return extractRowsFromResponse(attendanceQuery.data, ["attendanceSummaryReport", "AttendanceSummaryReport"]);
  if (activeDefinition.key === "leaveApplication") return extractRowsFromResponse(leaveApplicationQuery.data, ["leaveApplicationReport", "LeaveApplicationReport", "leaveApplicationList", "LeaveApplicationList"]);
  if (activeDefinition.key === "leaveApproval") return extractRowsFromResponse(leaveApprovalQuery.data, ["leaveApprovalReport", "LeaveApprovalReport", "leaveApprovalList", "LeaveApprovalList"]);
  if (activeDefinition.key === "agentList") return extractRowsFromResponse(agentReportQuery.data, ["agentListReport", "AgentListReport", "agentList", "AgentList"]);
  if (activeDefinition.key === "incomeExpense") return extractRowsFromResponse(incomeExpenseQuery.data, ["incomeExpenseReport", "IncomeExpenseReport"]);
  if (activeDefinition.key === "ticketHistory") return extractRowsFromResponse(ticketHistoryQuery.data, ["ticketHistoryReport", "TicketHistoryReport", "ticketHistory", "TicketHistory"]);
  if (activeDefinition.key === "dailyService") return extractRowsFromResponse(dailyServiceQuery.data, ["dailyServiceReport", "DailyServiceReport", "agentDailyService", "AgentDailyService"]);

  return [];
}, [activeDefinition, agentReportQuery.data, attendanceQuery.data, billQuery.data, callQuery.data, customerQuery.data, dailyServiceQuery.data, expenseQuery.data, incomeExpenseQuery.data, itemSalesQuery.data, leaveApplicationQuery.data, leaveApprovalQuery.data, outstandingQuery.data, receiptQuery.data, repairPartsQuery.data, replacePartsQuery.data, ticketHistoryQuery.data, ticketQuery.data, travelQuery.data]);

const activeTableRows = useMemo(
  () => (activeDefinition ? activeDefinition.getRows(activeRows) : []),
  [activeDefinition, activeRows],
);

const activeFilterText = useMemo(() => {
  if (!activeDefinition || !activeAppliedFilter) return "-";

  const optionLabel = (options: SelectOption[], value: string) =>
    options.find((option) => option.value === value)?.label ?? "All";
  const base = `Company Name : ${activeAppliedFilter.company.label}, Date : ${activeAppliedFilter.from.format("YYYY-MM-DD")} to ${activeAppliedFilter.to.format("YYYY-MM-DD")}`;

  if (activeReportKey === "ticket" && appliedTicketDraft) {
    return `${base}, Ticket Type : ${appliedTicketDraft.ticketType}, Date Type : ${appliedTicketDraft.dateType}, Customer : ${optionLabel(customerSelectOptions, appliedTicketDraft.customerId)}, Assigned To : ${optionLabel(agentSelectOptions, appliedTicketDraft.assignedTo)}, Created By : ${optionLabel(agentSelectOptions, appliedTicketDraft.createdBy)}, Priority : ${appliedTicketDraft.priority}, Ticket Stage : ${appliedTicketDraft.ticketStage}`;
  }

  if (activeReportKey === "call" && appliedCallDraft) {
    return `${base}, Agent : ${optionLabel(agentSelectOptions, appliedCallDraft.agentId)}, Customer : ${optionLabel(customerSelectOptions, appliedCallDraft.customerId)}, Status : ${appliedCallDraft.status}, Bill Status : ${appliedCallDraft.billStatus}`;
  }

  if (activeReportKey === "travel" && appliedTravelDraft) {
    return `Company Name : ${activeAppliedFilter.company.label}, Agent : ${optionLabel(agentSelectOptions, appliedTravelDraft.agentId)}, Date : ${activeAppliedFilter.from.format("DD/MM/YYYY")} to ${activeAppliedFilter.to.format("DD/MM/YYYY")}`;
  }

  if (activeReportKey === "expense" && appliedExpenseDraft) {
    return `Company Name : ${activeAppliedFilter.company.label}, Agent : ${optionLabel(agentSelectOptions, appliedExpenseDraft.agentId)}, Date : ${activeAppliedFilter.from.format("YYYY-MM-DD")} to ${activeAppliedFilter.to.format("YYYY-MM-DD")}`;
  }

  if (activeReportKey === "bill" && appliedBillDraft) {
    return `Company Name : ${activeAppliedFilter.company.label}, Report Type : ${appliedBillDraft.reportType}, Summary Level : ${appliedBillDraft.summaryLevel}, Agent : ${optionLabel(agentSelectOptions, String(basePayload.nAgentId ?? basePayload.id ?? ""))}, Date : ${activeAppliedFilter.from.format("YYYY-MM-DD")} to ${activeAppliedFilter.to.format("YYYY-MM-DD")}`;
  }

  if (activeReportKey === "itemSales" && appliedItemSalesDraft) {
    return `Company Name : ${activeAppliedFilter.company.label}, From Date : ${activeAppliedFilter.from.format("DD/MM/YYYY")}, To Date : ${activeAppliedFilter.to.format("DD/MM/YYYY")}, Item : ${optionLabel(partSelectOptions, appliedItemSalesDraft.itemId)}, Customer : ${optionLabel(customerSelectOptions, appliedItemSalesDraft.customerId)}`;
  }

  if (activeReportKey && isExtraReportKey(activeReportKey) && activeExtraDraft) {
    const customerOptions = activeReportKey === "replaceParts" ? replaceCustomerOptions : customerSelectOptions;
    const agentOptions = activeReportKey === "replaceParts" ? replaceAgentOptions : activeReportKey === "leaveApproval" ? leaveApprovalAgentOptions : agentSelectOptions;
    const date = `Date : ${activeAppliedFilter.from.format("DD/MM/YYYY")} to ${activeAppliedFilter.to.format("DD/MM/YYYY")}`;
    if (activeReportKey === "outstanding") return `Company Name : ${activeAppliedFilter.company.label}, ${date}, Customer Name : ${optionLabel(customerOptions, activeExtraDraft.customerId)}`;
    if (activeReportKey === "repairParts") return `${date}, Returned Status : ${activeExtraDraft.returnStatus}, Customer : ${optionLabel(customerOptions, activeExtraDraft.customerId)}`;
    if (activeReportKey === "replaceParts") return `${date}, Customer Name : ${optionLabel(customerOptions, activeExtraDraft.customerId)}, Agent : ${optionLabel(agentOptions, activeExtraDraft.agentId)}`;
    if (activeReportKey === "receipt") return `Company : ${activeAppliedFilter.company.label}, Report Type : ${activeExtraDraft.reportType}, Summary : ${activeExtraDraft.summaryLevel}, ${date}, Customer : ${optionLabel(customerOptions, activeExtraDraft.customerId)}, Agent : ${optionLabel(agentOptions, activeExtraDraft.agentId)}`;
    if (activeReportKey === "attendance") return `Company Name : ${activeAppliedFilter.company.label}, Agent : ${optionLabel(agentOptions, activeExtraDraft.agentId)}, ${date}`;
    if (activeReportKey === "leaveApplication") return `Company Name : ${activeAppliedFilter.company.label}, Agent : ${optionLabel(agentOptions, activeExtraDraft.agentId)}, ${date}, Status : ${activeExtraDraft.status}`;
    if (activeReportKey === "agentList") return `Company : ${activeAppliedFilter.company.label}, Agent : ${optionLabel(agentSelectOptions, activeExtraDraft.agentId)}`;
    if (activeReportKey === "incomeExpense") return `Date Type : ${activeExtraDraft.dateType}, ${date}, Agent : ${optionLabel(agentSelectOptions, activeExtraDraft.agentId)}, Status : ${activeExtraDraft.status}, Customer : ${optionLabel(customerSelectOptions, activeExtraDraft.customerId)}`;
    if (activeReportKey === "ticketHistory") return `Agent : ${optionLabel(agentSelectOptions, activeExtraDraft.agentId)}, ${date}, Customer : ${optionLabel(customerSelectOptions, activeExtraDraft.customerId)}, Ticket Number : ${optionLabel(ticketNumberOptions, activeExtraDraft.ticketId)}`;
    if (activeReportKey === "dailyService") {
      const agents = activeExtraDraft.agentIds.map((id) => optionLabel(agentSelectOptions, id)).join(", ") || "All";
      return `Agent : ${agents}, Date : ${activeAppliedFilter.from.format("DD/MM/YYYY")}, Detailed Traveling Expense : ${activeExtraDraft.detailedTravelExpense ? "Yes" : "No"}`;
    }
    return `Company Name : ${activeAppliedFilter.company.label}, Agent : ${optionLabel(agentOptions, activeExtraDraft.agentId)}, ${date}`;
  }

  return base;
}, [
  activeAppliedFilter,
  activeDefinition,
  activeReportKey,
  activeExtraDraft,
  agentSelectOptions,
  appliedCallDraft,
  appliedBillDraft,
  appliedExpenseDraft,
  appliedItemSalesDraft,
  appliedTicketDraft,
  appliedTravelDraft,
  basePayload.id,
  basePayload.nAgentId,
  customerSelectOptions,
  leaveApprovalAgentOptions,
  partSelectOptions,
  replaceAgentOptions,
  replaceCustomerOptions,
  ticketNumberOptions,
]);


  return {
    customerQuery,
    ticketAgentQuery,
    ticketQuery,
    callQuery,
    travelQuery,
    expenseQuery,
    billQuery,
    itemSalesQuery,
    outstandingQuery,
    repairPartsQuery,
    replacePartsQuery,
    receiptQuery,
    attendanceQuery,
    leaveApplicationQuery,
    leaveApprovalQuery,
    agentReportQuery,
    incomeExpenseQuery,
    ticketHistoryQuery,
    dailyServiceQuery,
    activeDefinition,
    activeRows,
    activeTableRows,
    activeFilterText,
  };
};

