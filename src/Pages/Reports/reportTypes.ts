import type { Dayjs } from "dayjs";

export type RecordLike = Record<string, unknown>;
export type CompanyOption = { label: string; value: string; raw: RecordLike };
export type ReportKey = "customer" | "ticket" | "call" | "travel" | "expense" | "bill" | "itemSales" | "outstanding" | "repairParts" | "replaceParts" | "receipt" | "attendance" | "leaveApplication" | "leaveApproval" | "agentList" | "incomeExpense" | "ticketHistory" | "dailyService";
export type ExtraReportKey = "outstanding" | "repairParts" | "replaceParts" | "receipt" | "attendance" | "leaveApplication" | "leaveApproval" | "agentList" | "incomeExpense" | "ticketHistory" | "dailyService";

export type ReportFilter = {
  company: CompanyOption;
  from: Dayjs;
  to: Dayjs;
};

export type SelectOption = { label: string; value: string };
export type TicketFilterDraft = {
  companyId: string;
  ticketType: string;
  dateType: string;
  from: Dayjs;
  to: Dayjs;
  customerId: string;
  assignedTo: string;
  createdBy: string;
  priority: string;
  ticketStage: string;
};

export type CallFilterDraft = {
  companyId: string;
  from: Dayjs;
  to: Dayjs;
  agentId: string;
  customerId: string;
  status: string;
  billStatus: string;
};

export type TravelFilterDraft = {
  companyId: string;
  from: Dayjs;
  to: Dayjs;
  agentId: string;
};

export type ExpenseFilterDraft = TravelFilterDraft;

export type BillFilterDraft = {
  companyId: string;
  from: Dayjs;
  to: Dayjs;
  reportType: string;
  summaryLevel: string;
};

export type ItemSalesFilterDraft = {
  companyId: string;
  from: Dayjs;
  to: Dayjs;
  customerId: string;
  itemId: string;
};

export type ExtraFilterDraft = {
  companyId: string;
  from: Dayjs;
  to: Dayjs;
  customerId: string;
  agentId: string;
  status: string;
  returnStatus: string;
  reportType: string;
  summaryLevel: string;
  dateType: string;
  ticketId: string;
  agentIds: string[];
  detailedTravelExpense: boolean;
};

export type ReportDefinition = {
  key: ReportKey;
  title: string;
  chipLabel: string;
  icon: string;
  headers: string[];
  gridColumns: string;
  fileNamePrefix: string;
  getRows: (rows: RecordLike[]) => string[][];
  getFilterText: (filter: ReportFilter) => string;
};

