import { useMemo, useState } from "react";
import { Empty, Input, Modal, Popover, Select, Spin, message } from "antd";
import {
  CalendarOutlined,
  CloseOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FilterOutlined,
  PlusOutlined,
  PrinterOutlined,
  RightOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";

import { agentApis, customerApis } from "../../Axios/MasterApis";
import { billingApis } from "../../Axios/BillingApis";
import { reportApis } from "../../Axios/ReportsApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import CalendarSelectionModal from "../../ui/CalendarPopup/CalendarSelectionModal";
import {
  downloadReportExcel,
  downloadReportPdf,
  printReport,
  type GenericReportExportData,
} from "./ReportExport";

import customerIcon from "../../assets/Reports/CustomerDetails.svg";
import ticketIcon from "../../assets/Reports/TicketList.svg";
import callReportIcon from "../../assets/Reports/CallReport.svg";
import travelIcon from "../../assets/Reports/TravelLog.svg";
import expenseIcon from "../../assets/Reports/Expense.svg";
import billIcon from "../../assets/Reports/Bill.svg";
import incomeIcon from "../../assets/Reports/Income.svg";
import reportIcon from "../../assets/Reports/ItemWiseSale.svg";
import outstandingIcon from "../../assets/Reports/OutStanding.svg";
import repairIcon from "../../assets/Reports/RepairPart.svg";
import replaceIcon from "../../assets/Reports/ReplacePart.svg";
import attendanceIcon from "../../assets/Reports/AttendanceSummary.svg";
import receiptIcon from "../../assets/Reports/Receipt.svg";
import leaveApplicationIcon from "../../assets/Reports/LeaveApplication.svg";
import leaveApprovalIcon from "../../assets/Reports/LeaveApproval.svg";
import agentIcon from "../../assets/Reports/Agent.svg";
import historyIcon from "../../assets/Reports/TicketHistory.svg";

type RecordLike = Record<string, any>;
type CompanyOption = { label: string; value: string; raw: RecordLike };
type ReportKey = "customer" | "ticket" | "call" | "travel";

type ReportFilter = {
  company: CompanyOption;
  from: Dayjs;
  to: Dayjs;
};

type SelectOption = { label: string; value: string };
type TicketFilterDraft = {
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

type CallFilterDraft = {
  companyId: string;
  from: Dayjs;
  to: Dayjs;
  agentId: string;
  customerId: string;
  status: string;
  billStatus: string;
};

type ReportDefinition = {
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

const REPORTS = [
  { name: "Customer Details", icon: customerIcon, key: "customer" as const },
  { name: "Ticket List", icon: ticketIcon, key: "ticket" as const },
  { name: "Call Report", icon: callReportIcon, key: "call" as const },
  { name: "Travel Log", icon: travelIcon, key: "travel" as const },
  { name: "Expense", icon: expenseIcon },
  { name: "Bill", icon: billIcon },
  { name: "Item wise Sales", icon: reportIcon },
  { name: "Outstanding", icon: outstandingIcon },
  { name: "Part Taken for Repair", icon: repairIcon },
  { name: "Replace Part", icon: replaceIcon },
  { name: "Receipt", icon: receiptIcon },
  { name: "Attendance Summary", icon: attendanceIcon },
  { name: "Leave Application", icon: leaveApplicationIcon },
  { name: "Leave Approval Report", icon: leaveApprovalIcon },
  { name: "Agent List Report", icon: agentIcon },
  { name: "Income vs Expense on Ticket", icon: incomeIcon },
  { name: "Ticket History Report", icon: historyIcon },
  { name: "Daily Service Report", icon: reportIcon },
];

const text = (value: unknown, fallback = "-") =>
  String(value ?? "").trim() || fallback;

const toOptionalInt = (value: unknown) => {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized.toLowerCase() === "all") return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getValue = (record: RecordLike, keys: string[], fallback: any = "") => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }

  const match = Object.keys(record ?? {}).find((item) =>
    keys.some((key) => key.toLowerCase() === item.toLowerCase()),
  );

  return match ? record?.[match] : fallback;
};

const parseDateValue = (value: any) => {
  const current = text(value, "");
  if (!current) return null;

  const match = current.match(
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

  const parsed = new Date(current);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateValue = (value: any) => {
  const parsed = parseDateValue(value);
  return parsed ? parsed.toLocaleDateString("en-GB") : "-";
};

const formatDateTimeValue = (value: any) => {
  const parsed = parseDateValue(value);
  if (!parsed) return "-";

  const date = parsed.toLocaleDateString("en-GB");
  const hour = parsed.getHours();
  const displayHour = hour % 12 || 12;
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  const suffix = hour >= 12 ? "PM" : "AM";

  return `${date} ${String(displayHour).padStart(2, "0")}:${minutes} ${suffix}`;
};

const extractRowsFromResponse = (
  response: unknown,
  nestedKeys: string[] = [],
) => {
  const source = (response ?? {}) as RecordLike;
  const candidates: unknown[] = [
    response,
    source?.data,
    source?.result,
    source?.items,
    source?.list,
  ];

  for (const key of nestedKeys) {
    candidates.push(source?.[key]);
    candidates.push(source?.data?.[key]);
  }

  for (const candidate of candidates) {
    const rows = extractList(candidate);
    if (rows.length) return rows as RecordLike[];
  }

  return [];
};

const extractSelectOptions = (
  response: unknown,
  labelKeys: string[],
  valueKeys: string[],
) =>
  extractRowsFromResponse(response).map((row, index) => ({
    label: text(getValue(row, labelKeys), "All"),
    value: String(getValue(row, valueKeys, index)),
  }));

const getGeneratedBy = () => {
  for (const storage of [sessionStorage, localStorage]) {
    for (const key of ["userSession", "userCredentials"]) {
      try {
        const parsed = JSON.parse(storage.getItem(key) ?? "{}");
        const source = parsed?.data ?? parsed;
        const name = text(getValue(source, ["cName", "cAgentName", "cUserName", "Name"]), "");
        if (name) return name;
      } catch {
        // Ignore malformed legacy session values.
      }
    }
  }

  return "Testing Team";
};

const REPORT_DEFINITIONS: Record<ReportKey, ReportDefinition> = {
  customer: {
    key: "customer",
    title: "Customer Details Report",
    chipLabel: "Customer Details",
    icon: customerIcon,
    fileNamePrefix: "Customer_Details_Report",
    headers: ["Srl", "Customer Name", "Contact Person", "Mobile", "Email", "Address"],
    gridColumns: "60px 1.2fr 1fr 0.8fr 1fr 1.8fr",
    getRows: (rows) =>
      rows.map((row, index) => [
        String(index + 1),
        text(getValue(row, ["cCustomerName", "CustomerName", "cName"])),
        text(getValue(row, ["cContactPerson", "ContactPerson"])),
        text(getValue(row, ["cMobile", "cMobileNo", "Mobile", "cPhoneNo"])),
        text(getValue(row, ["cEmail", "Email"])),
        text(getValue(row, ["cAddress", "Address"])),
      ]),
    getFilterText: (filter) =>
      `Company Name : ${filter.company.label}, Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  ticket: {
    key: "ticket",
    title: "Ticket List Report",
    chipLabel: "Ticket List",
    icon: ticketIcon,
    fileNamePrefix: "Ticket_List_Report",
    headers: [
      "Srl",
      "Ticket No.",
      "Date",
      "Customer Name",
      "Ticket Summary",
      "Assigned to",
      "Status",
    ],
    gridColumns: "50px 96px 120px 1.1fr 1.8fr 1fr 110px",
    getRows: (rows) =>
      rows.map((row, index) => [
        String(index + 1),
        text(getValue(row, ["nTicketNo"])),
        formatDateValue(
          getValue(row, ["dDate"]),
        ),
        text(getValue(row, ["cCustomerName", "CustomerName", "Customer"])),
        text(
          getValue(row, [
            "cTicketSummary",
            "TicketSummary",
            "cDescription",
            "Description",
            "Summary",
          ]),
        ),
        text(getValue(row, ["cAssignedTo", "AssignedTo", "cAgentName", "AgentName"])),
        text(getValue(row, ["cTicketStatus", "cStatus", "Status", "StatusName"])),
      ]),
    getFilterText: (filter) =>
      `Company Name : ${filter.company.label}, Ticket Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  call: {
    key: "call",
    title: "Call Report",
    chipLabel: "Call Report",
    icon: callReportIcon,
    fileNamePrefix: "Call_Report",
    headers: [
      "Srl",
      "Call Report Date",
      "Call Report Id",
      "Ticket No.",
      "Customer Name",
      "Agent Name",
      "Call Summary",
      "Status",
    ],
    gridColumns: "48px 120px 110px 92px 1fr 1fr 1.5fr 100px",
    getRows: (rows) =>
      rows.map((row, index) => [
        String(index + 1),
        formatDateTimeValue(getValue(row, ["dCallReportDate", "dCreatedDate", "CreatedDate"])),
        text(
          getValue(row, [
            "nFollowupId",
            "nFollowUpId",
            "nCallReportId",
            "CallReportId",
            "cCallReportId",
            "nTicketId",
          ]),
        ),
        text(getValue(row, ["nTicketNo"])),
        text(getValue(row, ["cCustomerName", "CustomerName", "Customer"])),
        text(getValue(row, ["cAgentName", "AgentName", "Agent"])),
        text(
          getValue(row, [
            "cCallreportSummary",
            "cCallReportSummary",
            "cTicketSummary",
            "CallSummary",
            "cCallSummary",
            "Summary",
            "cViewSummary",
          ]),
        ),
        text(getValue(row, ["cTicketStatus", "cStatus", "Status", "StatusName", "cClosedStatus"])),
      ]),
    getFilterText: (filter) =>
      `Company Name : ${filter.company.label}, Call Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  travel: {
    key: "travel",
    title: "Travel Log Report",
    chipLabel: "Travel Log",
    icon: travelIcon,
    fileNamePrefix: "Travel_Log_Report",
    headers: ["Srl", "Date", "Start Location", "End Location", "Travelled Km", "Expense"],
    gridColumns: "60px 120px 1.2fr 1.2fr 120px 120px",
    getRows: (rows) =>
      rows.map((row, index) => [
        String(index + 1),
        formatDateValue(getValue(row, ["dDate", "cDate", "Date", "dCreatedDate"])),
        text(getValue(row, ["cStartingLocation", "StartLocation", "cStartLocation"])),
        text(getValue(row, ["cCheckinLocation", "EndLocation", "cEndLocation"])),
        text(getValue(row, ["nTravelledKm", "nCalculatedDistance", "nDistance"]), "0"),
        `Rs. ${Number(getValue(row, ["nAmount", "nExpenseAmount", "Expense"]) || 0).toFixed(2)}`,
      ]),
    getFilterText: (filter) =>
      `Company Name : ${filter.company.label}, Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
};

const ReportsPage = () => {
  const basePayload = useMemo(() => getRequestPayload(), []);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<ReportKey>("customer");
  const [companyId, setCompanyId] = useState("");
  const [fromDate, setFromDate] = useState<Dayjs>(dayjs());
  const [toDate, setToDate] = useState<Dayjs>(dayjs());
  const [pendingReportKey, setPendingReportKey] = useState<ReportKey>("customer");
  const [dateFieldOpen, setDateFieldOpen] = useState<"from" | "to" | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => dayjs().startOf("month"));
  const [appliedFilter, setAppliedFilter] = useState<ReportFilter | null>(null);
  const [openReports, setOpenReports] = useState<ReportKey[]>([]);
  const [activeReportKey, setActiveReportKey] = useState<ReportKey | null>(null);
  const [ticketDraft, setTicketDraft] = useState<TicketFilterDraft>({
    companyId: "",
    ticketType: "All",
    dateType: "Created Date",
    from: dayjs(),
    to: dayjs(),
    customerId: "",
    assignedTo: "",
    createdBy: "",
    priority: "All",
    ticketStage: "All",
  });
  const [callDraft, setCallDraft] = useState<CallFilterDraft>({
    companyId: "",
    from: dayjs(),
    to: dayjs(),
    agentId: "",
    customerId: "",
    status: "All",
    billStatus: "All",
  });

  const companyPayload = useMemo(
    () => ({
      ...basePayload,
      nPageNo: 1,
      nPageSize: 1000,
    }),
    [basePayload],
  );

  const companyQuery = useQuery({
    queryKey: ["report-company-list", companyPayload],
    queryFn: () => reportApis.companyList(companyPayload),
    enabled: Boolean(basePayload.nCompanyId && basePayload.cDbName && basePayload.cSchemaName),
  });

  const companies = useMemo<CompanyOption[]>(
    () =>
      extractRowsFromResponse(companyQuery.data).map((row, index) => ({
        label: text(getValue(row, ["cCompanyName", "CompanyName", "cName", "Name"]), "Company"),
        value: String(getValue(row, ["nCompanyId", "CompanyId", "id"], index)),
        raw: row,
      })),
    [companyQuery.data],
  );

  const companySelectOptions = useMemo(
    () => companies.map(({ label, value }) => ({ label, value })),
    [companies],
  );

  const selectedCompany =
    companies.find((company) => company.value === companyId) ?? companies[0];

  const dropdownCompanyPayload = useMemo(
    () => ({
      ...basePayload,
      nCompanyId: Number(companyId || selectedCompany?.value || basePayload.nCompanyId || 0),
      cDbName:
        selectedCompany?.raw?.cDbName ??
        selectedCompany?.raw?.DbName ??
        basePayload.cDbName,
      cSchemaName:
        selectedCompany?.raw?.cSchemaName ??
        selectedCompany?.raw?.SchemaName ??
        basePayload.cSchemaName,
    }),
    [basePayload, companyId, selectedCompany],
  );

  const agentListQuery = useQuery({
    queryKey: ["report-agent-list", dropdownCompanyPayload],
    queryFn: () => agentApis.agentListAll(dropdownCompanyPayload),
    enabled: Boolean(dropdownCompanyPayload.nCompanyId),
  });

  const customerListQuery = useQuery({
    queryKey: ["report-customer-list", dropdownCompanyPayload],
    queryFn: () => customerApis.customerList(dropdownCompanyPayload),
    enabled: Boolean(dropdownCompanyPayload.nCompanyId),
  });

  const agentSelectOptions = useMemo<SelectOption[]>(
    () =>
      [
        { label: "All", value: "" },
        ...extractSelectOptions(
          agentListQuery.data,
          ["cAgentName", "AgentName", "cUserName", "Name"],
          ["nAgentId", "AgentId", "id"],
        ),
      ],
    [agentListQuery.data],
  );

  const customerSelectOptions = useMemo<SelectOption[]>(
    () =>
      [
        { label: "All", value: "" },
        ...extractSelectOptions(
          customerListQuery.data,
          ["cCustomerName", "CustomerName", "cName", "Name"],
          ["nCustomerId", "CustomerId", "id"],
        ),
      ],
    [customerListQuery.data],
  );

  const commonReportPayload = useMemo(() => {
    if (!appliedFilter) return null;

    const company = appliedFilter.company.raw;

    return {
      ...basePayload,
      nCompanyId: Number(appliedFilter.company.value) || basePayload.nCompanyId,
      cDbName: getValue(company, ["cDbName", "DbName"], basePayload.cDbName),
      cSchemaName: getValue(company, ["cSchemaName", "SchemaName"], basePayload.cSchemaName),
      dFromDate: appliedFilter.from.format("YYYY-MM-DD"),
      dToDate: appliedFilter.to.format("YYYY-MM-DD"),
      cFromDate: appliedFilter.from.format("YYYY-MM-DD"),
      cToDate: appliedFilter.to.format("YYYY-MM-DD"),
      nPageNo: 1,
      nPageSize: 1000,
    };
  }, [appliedFilter, basePayload]);

  const ticketReportPayload = useMemo(() => {
    if (activeReportKey !== "ticket") return null;
    const ticketTypeId = toOptionalInt(ticketDraft.ticketType);
    const dateTypeId = toOptionalInt(ticketDraft.dateType);
    const priorityId = toOptionalInt(ticketDraft.priority);
    const ticketStageId = toOptionalInt(ticketDraft.ticketStage);

    return {
      ...dropdownCompanyPayload,
      cTicketType: ticketTypeId,
      nTicketType: ticketTypeId,
      cDateType: dateTypeId,
      nDateType: dateTypeId,
      dFromDate: ticketDraft.from.format("YYYY-MM-DD"),
      dToDate: ticketDraft.to.format("YYYY-MM-DD"),
      cFromDate: ticketDraft.from.format("YYYY-MM-DD"),
      cToDate: ticketDraft.to.format("YYYY-MM-DD"),
      cCustomerId: String(ticketDraft.customerId || "0"),
      cAssignAgentId: String(ticketDraft.assignedTo || "0"),
      cCreatedBy: String(ticketDraft.createdBy || "0"),
      nCustomerId: Number(ticketDraft.customerId || 0),
      nAssignedTo: Number(ticketDraft.assignedTo || 0),
      nCreatedBy: Number(ticketDraft.createdBy || 0),
      cPriority: priorityId,
      nPriority: priorityId,
      cTicketStage: ticketStageId,
      nTicketStage: ticketStageId,
      cStatus: ticketStageId,
      nStatus: ticketStageId,
      nPageNo: 1,
      nPageSize: 1000,
    };
  }, [activeReportKey, dropdownCompanyPayload, ticketDraft]);

  const callReportPayload = useMemo(() => {
    if (activeReportKey !== "call") return null;
    const sessionIdentity = basePayload as Record<string, any>;
    const createdById = Number(
      sessionIdentity.nCreatedBy ??
        sessionIdentity.nAgentId ??
        sessionIdentity.id ??
        0,
    );

    return {
      ...dropdownCompanyPayload,
      dFromDate: callDraft.from.format("YYYY-MM-DD"),
      dToDate: callDraft.to.format("YYYY-MM-DD"),
      cFromDate: callDraft.from.format("YYYY-MM-DD"),
      cToDate: callDraft.to.format("YYYY-MM-DD"),
      cCustomerId: String(callDraft.customerId || "0"),
      cAssignAgentId: String(callDraft.agentId || "0"),
      cCreatedBy: String(createdById || "0"),
      nAgentId: Number(callDraft.agentId || 0),
      nCustomerId: Number(callDraft.customerId || 0),
      nAssignAgentId: Number(callDraft.agentId || 0),
      nCreatedBy: createdById,
      cStatus: toOptionalInt(callDraft.status),
      nStatus: toOptionalInt(callDraft.status),
      cBillStatus: toOptionalInt(callDraft.billStatus),
      nBillStatus: toOptionalInt(callDraft.billStatus),
      nPageNo: 1,
      nPageSize: 1000,
    };
  }, [activeReportKey, callDraft, dropdownCompanyPayload]);

  const customerQuery = useQuery({
    queryKey: ["reports", "customer", commonReportPayload],
    queryFn: () => reportApis.customerDetailsReport(commonReportPayload!),
    enabled: activeReportKey === "customer" && Boolean(commonReportPayload),
  });

  const ticketAgentQuery = useQuery({
    queryKey: ["reports", "ticket-agent-list", dropdownCompanyPayload],
    queryFn: () => agentApis.agentListAll(dropdownCompanyPayload),
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
    if (!commonReportPayload || activeReportKey !== "travel") return null;

    return {
      ...commonReportPayload,
      cAgentId: String(basePayload.nAgentId ?? basePayload.id ?? ""),
      dDate: appliedFilter?.from.format("YYYY-MM-DD"),
    };
  }, [activeReportKey, appliedFilter?.from, basePayload, commonReportPayload]);

  const travelQuery = useQuery({
    queryKey: ["reports", "travel", travelPayload],
    queryFn: () => billingApis.travelLogList(travelPayload!),
    enabled: Boolean(travelPayload),
  });

  const activeDefinition = activeReportKey ? REPORT_DEFINITIONS[activeReportKey] : null;

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

    return extractRowsFromResponse(travelQuery.data, ["travelLogList", "TravelLogList", "travelLog"]);
  }, [activeDefinition, callQuery.data, customerQuery.data, ticketQuery.data, travelQuery.data]);

  const activeTableRows = useMemo(
    () => (activeDefinition ? activeDefinition.getRows(activeRows) : []),
    [activeDefinition, activeRows],
  );

  const filteredReports = REPORTS.filter((report) =>
    report.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const openReportFilter = (key: ReportKey) => {
    setPendingReportKey(key);
    setFilterMode(key);
    setCompanyId(appliedFilter?.company.value ?? selectedCompany?.value ?? "");
    setFromDate(appliedFilter?.from ?? dayjs());
    setToDate(appliedFilter?.to ?? dayjs());
    setDateFieldOpen(null);
    setCalendarMonth((appliedFilter?.from ?? dayjs()).startOf("month"));
    setTicketDraft((current) => ({
      ...current,
      companyId: appliedFilter?.company.value ?? selectedCompany?.value ?? "",
      from: appliedFilter?.from ?? dayjs(),
      to: appliedFilter?.to ?? dayjs(),
    }));
    setCallDraft((current) => ({
      ...current,
      companyId: appliedFilter?.company.value ?? selectedCompany?.value ?? "",
      from: appliedFilter?.from ?? dayjs(),
      to: appliedFilter?.to ?? dayjs(),
    }));
    setFilterOpen(true);
    void companyQuery.refetch();
  };

  const applyFilter = () => {
    const companyValue =
      filterMode === "ticket"
        ? ticketDraft.companyId
        : filterMode === "call"
          ? callDraft.companyId
          : companyId;
    const company =
      companies.find((item) => item.value === companyValue) ?? selectedCompany;

    if (!company) {
      message.warning("Select a company.");
      return;
    }

    const from = filterMode === "ticket" ? ticketDraft.from : filterMode === "call" ? callDraft.from : fromDate;
    const to = filterMode === "ticket" ? ticketDraft.to : filterMode === "call" ? callDraft.to : toDate;

    if (from.isAfter(to, "day")) {
      message.warning("From date cannot be after To date.");
      return;
    }

    const nextFilter = { company, from, to };
    setAppliedFilter(nextFilter);
    setFilterOpen(false);
    setOpenReports((current) =>
      current.includes(pendingReportKey) ? current : [...current, pendingReportKey],
    );
    setActiveReportKey(pendingReportKey);
  };

  const handleCancelFilter = () => {
    if (appliedFilter) {
      setCompanyId(appliedFilter.company.value);
      setFromDate(appliedFilter.from);
      setToDate(appliedFilter.to);
      setTicketDraft((current) => ({
        ...current,
        companyId: appliedFilter.company.value,
        from: appliedFilter.from,
        to: appliedFilter.to,
      }));
      setCallDraft((current) => ({
        ...current,
        companyId: appliedFilter.company.value,
        from: appliedFilter.from,
        to: appliedFilter.to,
      }));
    } else {
      const today = dayjs();
      setFromDate(today);
      setToDate(today);
      setCalendarMonth(today.startOf("month"));
      setTicketDraft((current) => ({
        ...current,
        companyId: selectedCompany?.value ?? "",
        from: today,
        to: today,
      }));
      setCallDraft((current) => ({
        ...current,
        companyId: selectedCompany?.value ?? "",
        from: today,
        to: today,
      }));
    }

    setFilterOpen(false);
  };

  const handleCloseDatePicker = () => {
    setDateFieldOpen(null);
  };

  const handleSelectReportDate = (date: Date) => {
    const picked = dayjs(date).startOf("day");

    if (filterMode === "ticket") {
      setTicketDraft((current) => {
        const next = { ...current };
        if (dateFieldOpen === "from") {
          next.from = picked;
          if (picked.isAfter(current.to, "day")) {
            next.to = picked;
          }
        } else if (dateFieldOpen === "to") {
          next.to = picked;
          if (picked.isBefore(current.from, "day")) {
            next.from = picked;
          }
        }
        return next;
      });
    } else if (filterMode === "call") {
      setCallDraft((current) => {
        const next = { ...current };
        if (dateFieldOpen === "from") {
          next.from = picked;
          if (picked.isAfter(current.to, "day")) {
            next.to = picked;
          }
        } else if (dateFieldOpen === "to") {
          next.to = picked;
          if (picked.isBefore(current.from, "day")) {
            next.from = picked;
          }
        }
        return next;
      });
    } else {
      if (dateFieldOpen === "from") {
        setFromDate(picked);
        if (picked.isAfter(toDate, "day")) {
          setToDate(picked);
        }
      } else if (dateFieldOpen === "to") {
        setToDate(picked);
        if (picked.isBefore(fromDate, "day")) {
          setFromDate(picked);
        }
      }
    }

    setCalendarMonth(picked.startOf("month"));
  };

  const activeExportData = useMemo<GenericReportExportData | null>(() => {
    if (!activeDefinition || !appliedFilter) return null;

    return {
      title: activeDefinition.title,
      generatedAt: dayjs().format("DD/MM/YYYY [at] hh:mm A"),
      generatedBy: getGeneratedBy(),
      appliedFilters: activeDefinition.getFilterText(appliedFilter),
      fileNamePrefix: activeDefinition.fileNamePrefix,
      headers: activeDefinition.headers,
      rows: activeTableRows,
    };
  }, [activeDefinition, activeTableRows, appliedFilter]);

  const runExport = (action: (data: GenericReportExportData) => void) => {
    if (!activeExportData) return;

    try {
      action({ ...activeExportData, generatedAt: dayjs().format("DD/MM/YYYY [at] hh:mm A") });
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Unable to prepare the report.",
      );
    }
  };

  const closeReportView = () => {
    setOpenReports([]);
    setActiveReportKey(null);
  };

  const removeReportTab = (key: ReportKey) => {
    setOpenReports((current) => {
      const next = current.filter((item) => item !== key);
      if (activeReportKey === key) {
        setActiveReportKey(next[0] ?? null);
      }
      return next;
    });
    if (openReports.length === 1 && openReports[0] === key) {
      setActiveReportKey(null);
    }
  };

  const activeModalFromDate =
    filterMode === "ticket"
      ? ticketDraft.from
      : filterMode === "call"
        ? callDraft.from
        : fromDate;
  const activeModalToDate =
    filterMode === "ticket"
      ? ticketDraft.to
      : filterMode === "call"
        ? callDraft.to
        : toDate;

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white p-5">
      {!activeDefinition ? (
        <>
          <header className="mb-4 flex items-center justify-between gap-4">
            <h1 className="m-0 text-lg font-semibold text-slate-950">Reports</h1>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="Search"
              className="!h-10 max-w-[300px]"
            />
          </header>
          <div className="grid grid-cols-1 gap-3 overflow-auto pb-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <button
                key={report.name}
                type="button"
                onClick={() => {
                  if (report.key) {
                    openReportFilter(report.key);
                    return;
                  }

                  message.info(`${report.name} will be available soon.`);
                }}
                className="flex h-[62px] cursor-pointer items-center gap-4 rounded-md border border-sky-200 bg-white px-6 text-left text-sm text-slate-700 transition-colors hover:bg-sky-50"
              >
                <img src={report.icon} alt="" className="h-6 w-6 flex-none object-contain" />
                <span>{report.name}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <ReportShell
          activeDefinition={activeDefinition}
          activeRows={activeTableRows}
          loading={
            customerQuery.isLoading ||
            customerQuery.isFetching ||
            ticketAgentQuery.isLoading ||
            ticketAgentQuery.isFetching ||
            ticketQuery.isLoading ||
            ticketQuery.isFetching ||
            callQuery.isLoading ||
            callQuery.isFetching ||
            travelQuery.isLoading ||
            travelQuery.isFetching
          }
          filter={appliedFilter}
          openReports={openReports}
          activeReportKey={activeReportKey}
          onClose={closeReportView}
          onAdd={() => openReportFilter(activeReportKey ?? pendingReportKey)}
          onFilter={() => openReportFilter(activeReportKey ?? pendingReportKey)}
          onDownloadPdf={() => runExport(downloadReportPdf)}
          onDownloadExcel={() => runExport(downloadReportExcel)}
          onPrint={() => runExport(printReport)}
          onSelectTab={(key) => setActiveReportKey(key)}
          onCloseTab={removeReportTab}
        />
      )}

      <Modal
        open={filterOpen}
        onCancel={() => {
          setFilterOpen(false);
          handleCancelFilter();
        }}
        footer={null}
        title={REPORT_DEFINITIONS[pendingReportKey].title}
        width={400}
        centered
        closeIcon={<CloseOutlined />}
      >
        <Spin spinning={companyQuery.isLoading || companyQuery.isFetching}>
          <div className="pt-2">
            <label className="mb-1 block text-xs text-slate-500">Company Name</label>
            <Select
              value={
                filterMode === "ticket"
                  ? ticketDraft.companyId || selectedCompany?.value
                  : filterMode === "call"
                    ? callDraft.companyId || selectedCompany?.value
                    : companyId || selectedCompany?.value
              }
              onChange={(value) => {
                setCompanyId(value);
                setTicketDraft((current) => ({ ...current, companyId: value }));
                setCallDraft((current) => ({ ...current, companyId: value }));
              }}
              options={companySelectOptions}
              suffixIcon={<RightOutlined />}
              className="w-full"
              placeholder="Select company"
            />

            {filterMode === "customer" || filterMode === "travel" ? (
              <>
                <h3 className="mb-3 mt-2 text-sm font-medium text-slate-800">Created Date</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDateFieldOpen("from");
                      setCalendarMonth(fromDate.startOf("month"));
                    }}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm"
                  >
                    {fromDate.format("DD/MM/YYYY")}
                    <CalendarOutlined className="text-slate-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDateFieldOpen("to");
                      setCalendarMonth(toDate.startOf("month"));
                    }}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm"
                  >
                    {toDate.format("DD/MM/YYYY")}
                    <CalendarOutlined className="text-slate-500" />
                  </button>
                </div>
              </>
            ) : null}

            {filterMode === "ticket" ? (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Ticket Type</label>
                    <Select
                      value={ticketDraft.ticketType}
                      onChange={(value) => setTicketDraft((current) => ({ ...current, ticketType: value }))}
                      options={[
                        { label: "All", value: "All" },
                        { label: "Open", value: "Open" },
                        { label: "Closed", value: "Closed" },
                      ]}
                      suffixIcon={<RightOutlined />}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Date Type</label>
                    <Select
                      value={ticketDraft.dateType}
                      onChange={(value) => setTicketDraft((current) => ({ ...current, dateType: value }))}
                      options={[
                        { label: "Created Date", value: "Created Date" },
                        { label: "Closed Date", value: "Closed Date" },
                        { label: "Scheduled Date", value: "Scheduled Date" },
                      ]}
                      suffixIcon={<RightOutlined />}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDateFieldOpen("from");
                      setCalendarMonth(ticketDraft.from.startOf("month"));
                    }}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm"
                  >
                    <span>From {ticketDraft.from.format("DD/MM/YYYY")}</span>
                    <CalendarOutlined className="text-slate-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDateFieldOpen("to");
                      setCalendarMonth(ticketDraft.to.startOf("month"));
                    }}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm"
                  >
                    <span>To {ticketDraft.to.format("DD/MM/YYYY")}</span>
                    <CalendarOutlined className="text-slate-500" />
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-500">Customer</label>
                  <Select
                    value={ticketDraft.customerId}
                    onChange={(value) => setTicketDraft((current) => ({ ...current, customerId: value }))}
                    options={customerSelectOptions}
                    suffixIcon={<RightOutlined />}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Assigned To</label>
                  <Select
                    value={ticketDraft.assignedTo}
                    onChange={(value) => setTicketDraft((current) => ({ ...current, assignedTo: value }))}
                    options={agentSelectOptions}
                    suffixIcon={<RightOutlined />}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Created By</label>
                  <Select
                    value={ticketDraft.createdBy}
                    onChange={(value) => setTicketDraft((current) => ({ ...current, createdBy: value }))}
                    options={agentSelectOptions}
                    suffixIcon={<RightOutlined />}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-500">Priority</label>
                  <div className="inline-flex overflow-hidden rounded-md border border-slate-200">
                    {["All", "Low", "Medium", "High"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setTicketDraft((current) => ({ ...current, priority: item }))}
                        className={`min-w-[62px] border-r border-slate-200 px-3 py-1.5 text-sm last:border-r-0 ${
                          ticketDraft.priority === item
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-700"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-500">Ticket Stage</label>
                  <Select
                    value={ticketDraft.ticketStage}
                    onChange={(value) => setTicketDraft((current) => ({ ...current, ticketStage: value }))}
                    options={[
                      { label: "All", value: "All" },
                      { label: "Open", value: "Open" },
                      { label: "In Progress", value: "In Progress" },
                      { label: "Closed", value: "Closed" },
                    ]}
                    suffixIcon={<RightOutlined />}
                    className="w-full"
                  />
                </div>
              </div>
            ) : null}

            {filterMode === "call" ? (
              <div className="mt-3 space-y-3">
                <h3 className="mb-3 text-sm font-medium text-slate-800">Date</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDateFieldOpen("from");
                      setCalendarMonth(callDraft.from.startOf("month"));
                    }}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm"
                  >
                    <span>From {callDraft.from.format("DD/MM/YYYY")}</span>
                    <CalendarOutlined className="text-slate-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDateFieldOpen("to");
                      setCalendarMonth(callDraft.to.startOf("month"));
                    }}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm"
                  >
                    <span>To {callDraft.to.format("DD/MM/YYYY")}</span>
                    <CalendarOutlined className="text-slate-500" />
                  </button>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Agent</label>
                  <Select
                    value={callDraft.agentId}
                    onChange={(value) => setCallDraft((current) => ({ ...current, agentId: value }))}
                    options={agentSelectOptions}
                    suffixIcon={<RightOutlined />}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Customer</label>
                  <Select
                    value={callDraft.customerId}
                    onChange={(value) => setCallDraft((current) => ({ ...current, customerId: value }))}
                    options={customerSelectOptions}
                    suffixIcon={<RightOutlined />}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Status</label>
                  <Select
                    value={callDraft.status}
                    onChange={(value) => setCallDraft((current) => ({ ...current, status: value }))}
                    options={[
                      { label: "All", value: "All" },
                      { label: "Open", value: "Open" },
                      { label: "Closed", value: "Closed" },
                    ]}
                    suffixIcon={<RightOutlined />}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Bill Status</label>
                  <Select
                    value={callDraft.billStatus}
                    onChange={(value) => setCallDraft((current) => ({ ...current, billStatus: value }))}
                    options={[
                      { label: "All", value: "All" },
                      { label: "Billed", value: "Billed" },
                      { label: "Unbilled", value: "Unbilled" },
                    ]}
                    suffixIcon={<RightOutlined />}
                    className="w-full"
                  />
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={applyFilter}
                className="h-8 rounded-lg bg-emerald-500 px-6 text-sm font-medium text-white hover:bg-emerald-600"
              >
                Apply
              </button>
            </div>
          </div>
        </Spin>
      </Modal>

      <CalendarSelectionModal
        open={Boolean(dateFieldOpen)}
        title={dateFieldOpen === "from" ? "Select From Date" : "Select To Date"}
        month={calendarMonth.toDate()}
        selectedDate={(dateFieldOpen === "from" ? activeModalFromDate : activeModalToDate).toDate()}
        selectedFromDate={activeModalFromDate.toDate()}
        selectedToDate={activeModalToDate.toDate()}
        minDate={dateFieldOpen === "to" ? activeModalFromDate.toDate() : undefined}
        maxDate={dateFieldOpen === "from" ? activeModalToDate.toDate() : undefined}
        onMonthChange={(nextMonth) => setCalendarMonth(dayjs(nextMonth))}
        onYearChange={(nextYear) => setCalendarMonth(dayjs(nextYear))}
        onSelectDate={handleSelectReportDate}
        onApply={handleCloseDatePicker}
        onCancel={handleCloseDatePicker}
      />
    </section>
  );
};

const ReportShell = ({
  activeDefinition,
  activeRows,
  loading,
  filter,
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
  loading: boolean;
  filter: ReportFilter | null;
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
          {filter ? activeDefinition.getFilterText(filter) : "-"}
        </div>

        <div
          className="grid min-w-[840px] border-b border-slate-100 px-2 py-4 text-xs font-medium text-slate-900"
          style={{ gridTemplateColumns: activeDefinition.gridColumns }}
        >
          {activeDefinition.headers.map((header) => (
            <span key={header}>{header}</span>
          ))}
        </div>

        <Spin spinning={loading} className="!flex min-h-0 flex-1 flex-col">
          <div className="max-h-[calc(100vh-270px)] min-h-[170px] overflow-auto">
            {activeRows.length ? (
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

export default ReportsPage;
