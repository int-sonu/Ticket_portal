import { useMemo, useState } from "react";
import { Input, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";

import { agentApis, customerApis, partsApis } from "../../Axios/MasterApis";
import { reportApis } from "../../Axios/ReportsApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import CalendarSelectionModal from "../../ui/CalendarPopup/CalendarSelectionModal";
import {
  downloadReportExcel,
  downloadReportPdf,
  printReport,
  type GenericReportExportData,
} from "./ReportExport";

import {
  REPORTS,
} from "./reportDefinitions";
import {
  createExtraDraft,
  extractRowsFromResponse,
  extractSelectOptions,
  getGeneratedBy,
  getValue,
  isExtraReportKey,
  text,
  updateDateRange,
} from "./reportUtils";
import type {
  BillFilterDraft,
  CallFilterDraft,
  CompanyOption,
  ExpenseFilterDraft,
  ExtraFilterDraft,
  ExtraReportKey,
  ItemSalesFilterDraft,
  ReportFilter,
  ReportKey,
  SelectOption,
  TicketFilterDraft,
  TravelFilterDraft,
} from "./reportTypes";
import ReportShell from "./ReportShell";
import ReportFilterModal from "./ReportFilterModal";
import { useReportQueries } from "./useReportQueries";

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
  const [reportFilters, setReportFilters] = useState<Partial<Record<ReportKey, ReportFilter>>>({});
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
  const [travelDraft, setTravelDraft] = useState<TravelFilterDraft>({
    companyId: "",
    from: dayjs(),
    to: dayjs(),
    agentId: "",
  });
  const [expenseDraft, setExpenseDraft] = useState<ExpenseFilterDraft>({
    companyId: "",
    from: dayjs(),
    to: dayjs(),
    agentId: String(basePayload.nAgentId ?? basePayload.id ?? ""),
  });
  const [billDraft, setBillDraft] = useState<BillFilterDraft>({
    companyId: "",
    from: dayjs(),
    to: dayjs(),
    reportType: "Summary",
    summaryLevel: "Month wise",
  });
  const [itemSalesDraft, setItemSalesDraft] = useState<ItemSalesFilterDraft>({
    companyId: "",
    from: dayjs(),
    to: dayjs(),
    customerId: "",
    itemId: "",
  });
  const [appliedTicketDraft, setAppliedTicketDraft] = useState<TicketFilterDraft | null>(null);
  const [appliedCallDraft, setAppliedCallDraft] = useState<CallFilterDraft | null>(null);
  const [appliedTravelDraft, setAppliedTravelDraft] = useState<TravelFilterDraft | null>(null);
  const [appliedExpenseDraft, setAppliedExpenseDraft] = useState<ExpenseFilterDraft | null>(null);
  const [appliedBillDraft, setAppliedBillDraft] = useState<BillFilterDraft | null>(null);
  const [appliedItemSalesDraft, setAppliedItemSalesDraft] = useState<ItemSalesFilterDraft | null>(null);
  const [extraDrafts, setExtraDrafts] = useState<Record<ExtraReportKey, ExtraFilterDraft>>(() => ({
    outstanding: createExtraDraft(), repairParts: createExtraDraft(), replaceParts: createExtraDraft(),
    receipt: createExtraDraft(), attendance: createExtraDraft(), leaveApplication: createExtraDraft(), leaveApproval: createExtraDraft(),
    agentList: createExtraDraft(), incomeExpense: { ...createExtraDraft(), status: "All" }, ticketHistory: createExtraDraft(), dailyService: createExtraDraft(),
  }));
  const [appliedExtraDrafts, setAppliedExtraDrafts] = useState<Partial<Record<ExtraReportKey, ExtraFilterDraft>>>({});

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
    queryFn: () => agentApis.agentDropDown(dropdownCompanyPayload),
    enabled: !["replaceParts", "leaveApproval"].includes(filterMode) && Boolean(dropdownCompanyPayload.nCompanyId),
  });

  const customerListQuery = useQuery({
    queryKey: ["report-customer-list", dropdownCompanyPayload],
    queryFn: () => customerApis.customerDropDown(dropdownCompanyPayload),
    enabled: filterMode !== "replaceParts" && Boolean(dropdownCompanyPayload.nCompanyId),
  });

  const partsListQuery = useQuery({
    queryKey: ["report-parts-list", dropdownCompanyPayload],
    queryFn: () => partsApis.partsDropDown(dropdownCompanyPayload),
    enabled: filterMode === "itemSales" && Boolean(dropdownCompanyPayload.nCompanyId),
  });

  const replaceCustomerQuery = useQuery({
    queryKey: ["report-replace-customer-list", dropdownCompanyPayload],
    queryFn: () => customerApis.customerList(dropdownCompanyPayload),
    enabled: filterMode === "replaceParts" && Boolean(dropdownCompanyPayload.nCompanyId),
  });

  const replaceAgentQuery = useQuery({
    queryKey: ["report-replace-agent-list", dropdownCompanyPayload],
    queryFn: () => agentApis.agentListAll(dropdownCompanyPayload),
    enabled: filterMode === "replaceParts" && Boolean(dropdownCompanyPayload.nCompanyId),
  });

  const leaveApprovalAgentQuery = useQuery({
    queryKey: ["report-leave-approval-agent-list", dropdownCompanyPayload],
    queryFn: () => agentApis.agentListAll(dropdownCompanyPayload),
    enabled: filterMode === "leaveApproval" && Boolean(dropdownCompanyPayload.nCompanyId),
  });

  const ticketHistoryDraft = extraDrafts.ticketHistory;
  const ticketNumberQuery = useQuery({
    queryKey: ["report-ticket-number-list", dropdownCompanyPayload, ticketHistoryDraft.from.format("YYYY-MM-DD"), ticketHistoryDraft.to.format("YYYY-MM-DD"), ticketHistoryDraft.agentId, ticketHistoryDraft.customerId],
    queryFn: () => reportApis.ticketNumberList({
      ...dropdownCompanyPayload,
      cFromDate: ticketHistoryDraft.from.format("YYYY-MM-DD"), cToDate: ticketHistoryDraft.to.format("YYYY-MM-DD"),
      cFromdate: ticketHistoryDraft.from.format("YYYY-MM-DD"),
      dFromDate: ticketHistoryDraft.from.format("YYYY-MM-DD"), dToDate: ticketHistoryDraft.to.format("YYYY-MM-DD"),
      cAgentId: String(ticketHistoryDraft.agentId || "0"), nAgentId: Number(ticketHistoryDraft.agentId || 0),
      cCustomerid: String(ticketHistoryDraft.customerId || "0"), nCustomerId: Number(ticketHistoryDraft.customerId || 0),
    }),
    enabled: filterMode === "ticketHistory" && Boolean(dropdownCompanyPayload.nCompanyId),
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

  const partSelectOptions = useMemo<SelectOption[]>(
    () => [
      { label: "All", value: "" },
      ...extractSelectOptions(
        partsListQuery.data,
        ["cPartName", "PartName", "cItemName", "ItemName", "cName", "Name"],
        ["nPartId", "PartId", "nItemId", "ItemId", "id"],
      ),
    ],
    [partsListQuery.data],
  );

  const replaceCustomerOptions = useMemo<SelectOption[]>(() => [
    { label: "All", value: "" },
    ...extractSelectOptions(replaceCustomerQuery.data, ["cCustomerName", "CustomerName", "cName", "Name"], ["nCustomerId", "CustomerId", "id"]),
  ], [replaceCustomerQuery.data]);

  const replaceAgentOptions = useMemo<SelectOption[]>(() => [
    { label: "All", value: "" },
    ...extractSelectOptions(replaceAgentQuery.data, ["cAgentName", "AgentName", "cUserName", "Name"], ["nAgentId", "AgentId", "id"]),
  ], [replaceAgentQuery.data]);

  const leaveApprovalAgentOptions = useMemo<SelectOption[]>(() => [
    { label: "All", value: "" },
    ...extractSelectOptions(leaveApprovalAgentQuery.data, ["cAgentName", "AgentName", "cUserName", "Name"], ["nAgentId", "AgentId", "id"]),
  ], [leaveApprovalAgentQuery.data]);

  const ticketNumberOptions = useMemo<SelectOption[]>(() => [
    { label: "Select ticket", value: "" },
    ...extractSelectOptions(ticketNumberQuery.data, ["nTicketNo", "TicketNo", "cTicketNo", "Name"], ["nTicketId", "TicketId", "id"]),
  ], [ticketNumberQuery.data]);

  const {
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
  } = useReportQueries({
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
  });

  const filteredReports = REPORTS.filter((report) =>
    report.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const openReportFilter = (key: ReportKey) => {
    const savedFilter = reportFilters[key];
    setPendingReportKey(key);
    setFilterMode(key);
    setCompanyId(savedFilter?.company.value ?? selectedCompany?.value ?? "");
    setFromDate(savedFilter?.from ?? dayjs());
    setToDate(savedFilter?.to ?? dayjs());
    setDateFieldOpen(null);
    setCalendarMonth((savedFilter?.from ?? dayjs()).startOf("month"));
    setTicketDraft((current) => ({
      ...(key === "ticket" && appliedTicketDraft ? appliedTicketDraft : current),
      companyId: savedFilter?.company.value ?? selectedCompany?.value ?? "",
      from: savedFilter?.from ?? dayjs(),
      to: savedFilter?.to ?? dayjs(),
    }));
    setCallDraft((current) => ({
      ...(key === "call" && appliedCallDraft ? appliedCallDraft : current),
      companyId: savedFilter?.company.value ?? selectedCompany?.value ?? "",
      from: savedFilter?.from ?? dayjs(),
      to: savedFilter?.to ?? dayjs(),
    }));
    setTravelDraft((current) => ({
      ...(key === "travel" && appliedTravelDraft ? appliedTravelDraft : current),
      companyId: savedFilter?.company.value ?? selectedCompany?.value ?? "",
      from: savedFilter?.from ?? dayjs(),
      to: savedFilter?.to ?? dayjs(),
    }));
    setExpenseDraft((current) => ({
      ...(key === "expense" && appliedExpenseDraft ? appliedExpenseDraft : current),
      companyId: savedFilter?.company.value ?? selectedCompany?.value ?? "",
      from: savedFilter?.from ?? dayjs(),
      to: savedFilter?.to ?? dayjs(),
    }));
    setBillDraft((current) => ({
      ...(key === "bill" && appliedBillDraft ? appliedBillDraft : current),
      companyId: savedFilter?.company.value ?? selectedCompany?.value ?? "",
      from: savedFilter?.from ?? dayjs(),
      to: savedFilter?.to ?? dayjs(),
    }));
    setItemSalesDraft((current) => ({
      ...(key === "itemSales" && appliedItemSalesDraft ? appliedItemSalesDraft : current),
      companyId: savedFilter?.company.value ?? selectedCompany?.value ?? "",
      from: savedFilter?.from ?? dayjs(),
      to: savedFilter?.to ?? dayjs(),
    }));
    if (isExtraReportKey(key)) {
      setExtraDrafts((current) => ({
        ...current,
        [key]: {
          ...(appliedExtraDrafts[key] ?? current[key]),
          companyId: savedFilter?.company.value ?? selectedCompany?.value ?? "",
          from: savedFilter?.from ?? dayjs(),
          to: savedFilter?.to ?? dayjs(),
        },
      }));
    }
    setFilterOpen(true);
    void companyQuery.refetch();
  };

  const applyFilter = () => {
    const extraDraft = isExtraReportKey(filterMode) ? extraDrafts[filterMode] : null;
    const companyValue =
      filterMode === "ticket"
        ? ticketDraft.companyId
        : filterMode === "call"
          ? callDraft.companyId
          : filterMode === "travel"
            ? travelDraft.companyId
            : filterMode === "expense"
              ? expenseDraft.companyId
              : filterMode === "bill"
                ? billDraft.companyId
                : filterMode === "itemSales"
                  ? itemSalesDraft.companyId
                  : extraDraft
                    ? extraDraft.companyId
          : companyId;
    const company =
      companies.find((item) => item.value === companyValue) ?? selectedCompany;

    if (!company) {
      message.warning("Select a company.");
      return;
    }

    const from = filterMode === "ticket" ? ticketDraft.from : filterMode === "call" ? callDraft.from : filterMode === "travel" ? travelDraft.from : filterMode === "expense" ? expenseDraft.from : filterMode === "bill" ? billDraft.from : filterMode === "itemSales" ? itemSalesDraft.from : extraDraft?.from ?? fromDate;
    const to = filterMode === "ticket" ? ticketDraft.to : filterMode === "call" ? callDraft.to : filterMode === "travel" ? travelDraft.to : filterMode === "expense" ? expenseDraft.to : filterMode === "bill" ? billDraft.to : filterMode === "itemSales" ? itemSalesDraft.to : extraDraft?.to ?? toDate;

    if (from.isAfter(to, "day")) {
      message.warning("From date cannot be after To date.");
      return;
    }

    const nextFilter = { company, from, to };
    setReportFilters((current) => ({ ...current, [pendingReportKey]: nextFilter }));
    if (pendingReportKey === "ticket") setAppliedTicketDraft({ ...ticketDraft, companyId: company.value });
    if (pendingReportKey === "call") setAppliedCallDraft({ ...callDraft, companyId: company.value });
    if (pendingReportKey === "travel") setAppliedTravelDraft({ ...travelDraft, companyId: company.value });
    if (pendingReportKey === "expense") setAppliedExpenseDraft({ ...expenseDraft, companyId: company.value });
    if (pendingReportKey === "bill") setAppliedBillDraft({ ...billDraft, companyId: company.value });
    if (pendingReportKey === "itemSales") setAppliedItemSalesDraft({ ...itemSalesDraft, companyId: company.value });
    if (isExtraReportKey(pendingReportKey)) {
      setAppliedExtraDrafts((current) => ({ ...current, [pendingReportKey]: { ...extraDrafts[pendingReportKey], companyId: company.value } }));
    }
    setFilterOpen(false);
    setOpenReports((current) =>
      current.includes(pendingReportKey) ? current : [...current, pendingReportKey],
    );
    setActiveReportKey(pendingReportKey);
  };

  const handleCancelFilter = () => {
    const savedFilter = reportFilters[pendingReportKey];
    if (savedFilter) {
      setCompanyId(savedFilter.company.value);
      setFromDate(savedFilter.from);
      setToDate(savedFilter.to);
      setTicketDraft((current) => ({
        ...(pendingReportKey === "ticket" && appliedTicketDraft ? appliedTicketDraft : current),
        companyId: savedFilter.company.value,
        from: savedFilter.from,
        to: savedFilter.to,
      }));
      setCallDraft((current) => ({
        ...(pendingReportKey === "call" && appliedCallDraft ? appliedCallDraft : current),
        companyId: savedFilter.company.value,
        from: savedFilter.from,
        to: savedFilter.to,
      }));
      setTravelDraft((current) => ({
        ...(pendingReportKey === "travel" && appliedTravelDraft ? appliedTravelDraft : current),
        companyId: savedFilter.company.value,
        from: savedFilter.from,
        to: savedFilter.to,
      }));
      setExpenseDraft((current) => ({
        ...(pendingReportKey === "expense" && appliedExpenseDraft ? appliedExpenseDraft : current),
        companyId: savedFilter.company.value,
        from: savedFilter.from,
        to: savedFilter.to,
      }));
      setBillDraft((current) => ({
        ...(pendingReportKey === "bill" && appliedBillDraft ? appliedBillDraft : current),
        companyId: savedFilter.company.value,
        from: savedFilter.from,
        to: savedFilter.to,
      }));
      setItemSalesDraft((current) => ({
        ...(pendingReportKey === "itemSales" && appliedItemSalesDraft ? appliedItemSalesDraft : current),
        companyId: savedFilter.company.value,
        from: savedFilter.from,
        to: savedFilter.to,
      }));
      if (isExtraReportKey(pendingReportKey)) {
        setExtraDrafts((current) => ({
          ...current,
          [pendingReportKey]: {
            ...(appliedExtraDrafts[pendingReportKey] ?? current[pendingReportKey]),
            companyId: savedFilter.company.value,
            from: savedFilter.from,
            to: savedFilter.to,
          },
        }));
      }
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
      setTravelDraft((current) => ({
        ...current,
        companyId: selectedCompany?.value ?? "",
        from: today,
        to: today,
      }));
      setExpenseDraft((current) => ({ ...current, companyId: selectedCompany?.value ?? "", from: today, to: today }));
      setBillDraft((current) => ({ ...current, companyId: selectedCompany?.value ?? "", from: today, to: today }));
      setItemSalesDraft((current) => ({ ...current, companyId: selectedCompany?.value ?? "", from: today, to: today }));
      if (isExtraReportKey(pendingReportKey)) {
        setExtraDrafts((current) => ({
          ...current,
          [pendingReportKey]: { ...current[pendingReportKey], companyId: selectedCompany?.value ?? "", from: today, to: today },
        }));
      }
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
    } else if (filterMode === "travel") {
      setTravelDraft((current) => {
        const next = { ...current };
        if (dateFieldOpen === "from") {
          next.from = picked;
          if (picked.isAfter(current.to, "day")) next.to = picked;
        } else if (dateFieldOpen === "to") {
          next.to = picked;
          if (picked.isBefore(current.from, "day")) next.from = picked;
        }
        return next;
      });
    } else if (filterMode === "expense") {
      setExpenseDraft((current) => updateDateRange(current, picked, dateFieldOpen));
    } else if (filterMode === "bill") {
      setBillDraft((current) => updateDateRange(current, picked, dateFieldOpen));
    } else if (filterMode === "itemSales") {
      setItemSalesDraft((current) => updateDateRange(current, picked, dateFieldOpen));
    } else if (isExtraReportKey(filterMode)) {
      setExtraDrafts((current) => ({
        ...current,
        [filterMode]: updateDateRange(current[filterMode], picked, dateFieldOpen),
      }));
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

  const activeAppliedFilter = activeReportKey
    ? reportFilters[activeReportKey] ?? null
    : null;

  const activeExportData = useMemo<GenericReportExportData | null>(() => {
    if (!activeDefinition || !activeAppliedFilter) return null;

    return {
      title: activeDefinition.title,
      generatedAt: dayjs().format("DD/MM/YYYY [at] hh:mm A"),
      generatedBy: getGeneratedBy(),
      appliedFilters: activeFilterText,
      fileNamePrefix: activeDefinition.fileNamePrefix,
      headers: activeDefinition.headers,
      rows: activeTableRows,
    };
  }, [activeAppliedFilter, activeDefinition, activeFilterText, activeTableRows]);

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

  const activeExtraModalDraft = isExtraReportKey(filterMode) ? extraDrafts[filterMode] : null;
  const updateActiveExtraDraft = (changes: Partial<ExtraFilterDraft>) => {
    if (!isExtraReportKey(filterMode)) return;
    setExtraDrafts((current) => ({ ...current, [filterMode]: { ...current[filterMode], ...changes } }));
  };
  const activeModalFromDate =
    filterMode === "ticket"
      ? ticketDraft.from
      : filterMode === "call"
        ? callDraft.from
        : filterMode === "travel"
          ? travelDraft.from
          : filterMode === "expense"
            ? expenseDraft.from
            : filterMode === "bill"
              ? billDraft.from
              : filterMode === "itemSales"
                ? itemSalesDraft.from
                : activeExtraModalDraft?.from ?? fromDate;
  const activeModalToDate =
    filterMode === "ticket"
      ? ticketDraft.to
      : filterMode === "call"
        ? callDraft.to
        : filterMode === "travel"
          ? travelDraft.to
          : filterMode === "expense"
            ? expenseDraft.to
            : filterMode === "bill"
              ? billDraft.to
              : filterMode === "itemSales"
                ? itemSalesDraft.to
                : activeExtraModalDraft?.to ?? toDate;

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
                onClick={() => openReportFilter(report.key)}
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
          rawRows={activeRows}
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
            travelQuery.isFetching ||
            expenseQuery.isLoading ||
            expenseQuery.isFetching ||
            billQuery.isLoading ||
            billQuery.isFetching ||
            itemSalesQuery.isLoading ||
            itemSalesQuery.isFetching ||
            outstandingQuery.isFetching || repairPartsQuery.isFetching || replacePartsQuery.isFetching ||
            receiptQuery.isFetching || attendanceQuery.isFetching || leaveApplicationQuery.isFetching || leaveApprovalQuery.isFetching
            || agentReportQuery.isFetching || incomeExpenseQuery.isFetching || ticketHistoryQuery.isFetching || dailyServiceQuery.isFetching
          }
          filterText={activeFilterText}
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

      <ReportFilterModal
        filterOpen={filterOpen}
        setFilterOpen={setFilterOpen}
        handleCancelFilter={handleCancelFilter}
        pendingReportKey={pendingReportKey}
        filterMode={filterMode}
        filterOptionsLoading={
          companyQuery.isLoading ||
          companyQuery.isFetching ||
          partsListQuery.isLoading ||
          replaceCustomerQuery.isLoading ||
          replaceAgentQuery.isLoading ||
          leaveApprovalAgentQuery.isLoading ||
          ticketNumberQuery.isLoading
        }
        companyId={companyId}
        setCompanyId={setCompanyId}
        selectedCompany={selectedCompany}
        companySelectOptions={companySelectOptions}
        fromDate={fromDate}
        toDate={toDate}
        setDateFieldOpen={setDateFieldOpen}
        setCalendarMonth={setCalendarMonth}
        ticketDraft={ticketDraft}
        setTicketDraft={setTicketDraft}
        callDraft={callDraft}
        setCallDraft={setCallDraft}
        travelDraft={travelDraft}
        setTravelDraft={setTravelDraft}
        expenseDraft={expenseDraft}
        setExpenseDraft={setExpenseDraft}
        billDraft={billDraft}
        setBillDraft={setBillDraft}
        itemSalesDraft={itemSalesDraft}
        setItemSalesDraft={setItemSalesDraft}
        setExtraDrafts={setExtraDrafts}
        activeExtraModalDraft={activeExtraModalDraft}
        updateActiveExtraDraft={updateActiveExtraDraft}
        agentSelectOptions={agentSelectOptions}
        customerSelectOptions={customerSelectOptions}
        partSelectOptions={partSelectOptions}
        replaceCustomerOptions={replaceCustomerOptions}
        replaceAgentOptions={replaceAgentOptions}
        leaveApprovalAgentOptions={leaveApprovalAgentOptions}
        ticketNumberOptions={ticketNumberOptions}
        applyFilter={applyFilter}
      />

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

export default ReportsPage;
