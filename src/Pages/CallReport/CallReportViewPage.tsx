import { useEffect, useMemo, useState } from "react";
import { Button, Modal, Spin, message } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

import { billingApis } from "../../Axios/BillingApis";
import { customerApis } from "../../Axios/MasterApis";
import { ticketApis } from "../../Axios/TicketsApi";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import { useGetCustomerDropDown } from "../Master/CustomerMaster/Hooks";
import { useTicketView } from "../../Hooks/Ticket/useTicketQueries";
import BillReadonlyView from "../Bills/BillReadonlyViewExact";
import TicketOverviewSection from "../Ticket/TicketView/TicketOverviewSection";
import CallReportHistoryModal from "./CallReportHistoryModal";
import QuickCallReportModal from "../Ticket/Common/QuickCallReportModal";
import shareIcon from "../../assets/icons/shareIcon.svg";
import closeblack from "../../assets/icons/close-black.svg";
import EngagementMode from "../../assets/icons/EngagementMode.svg";
import calender from "../../assets/icons/calender.svg";
import mail from "../../assets/icons/mail.svg";
import phone from "../../assets/icons/phone.svg";
import contact from "../../assets/icons/contact.svg";

const normalizeSingleRecord = (value: any) => {
  if (Array.isArray(value)) return value[0] ?? {};
  if (value && typeof value === "object") return value;
  return {};
};

const formatDisplayValue = (value: any): string => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
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

const parseDateText = (value: any) => {
  const text = formatDisplayValue(value);
  if (!text) return "";
  const exact = text.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*([AP]M))?$/);
  if (!exact) return text;
  const [, dd, mm, yyyy, hh = "0", min = "0", meridiem] = exact;
  let hour = Number(hh);
  const minute = Number(min);
  if (meridiem?.toUpperCase() === "PM" && hour < 12) hour += 12;
  if (meridiem?.toUpperCase() === "AM" && hour === 12) hour = 0;
  const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd), hour, minute, 0, 0);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toLocaleString("en-GB");
};

const parseTicketDate = (value: any): number | null => {
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }

  if (typeof value !== "string") return null;

  const text = value.trim();
  if (!text) return null;

  const fallback = Date.parse(text);
  return Number.isNaN(fallback) ? null : fallback;
};

const formatTicketAge = (createdDate: any, nowMs = Date.now()): string => {
  const createdMs = parseTicketDate(createdDate);

  if (createdMs === null) return "";

  const diffMs = Math.max(nowMs - createdMs, 0);
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return `${days} day${days === 1 ? "" : "s"} ${hours} hr ${minutes} min`;
};

const getFieldValue = (record: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null && record?.[key] !== "") {
      return record[key];
    }
  }
  const recordKey = Object.keys(record || {}).find((item) =>
    keys.some((key) => key.toLowerCase() === item.toLowerCase()),
  );
  return recordKey ? record?.[recordKey] : "";
};

const findDeepFieldValue = (
  value: any,
  keys: string[],
  seen = new Set<any>(),
): any => {
  if (!value || typeof value !== "object" || seen.has(value)) return undefined;
  seen.add(value);

  for (const key of keys) {
    if (value?.[key] !== undefined && value?.[key] !== null) {
      return value[key];
    }
  }

  for (const entry of Object.values(value)) {
    if (entry && typeof entry === "object") {
      const nested = findDeepFieldValue(entry, keys, seen);
      if (nested !== undefined && nested !== null && nested !== "") {
        return nested;
      }
    }
  }

  return undefined;
};

const pickDisplayValue = (record: any, keys: string[]) =>
  getFieldValue(record ?? {}, keys) || findDeepFieldValue(record ?? {}, keys) || "";

const pickAssignedAgentNames = (record: any) => {
  const raw = [
    record?.cAssignedId,
    record?.assignedAgentDetails,
    record?.AssignedAgentDetails,
    record?.assignedAgents,
    record?.AssignedAgents,
    record?.AssignToAgent,
    record?.assignToAgent,
    record?.AgentId,
    record?.agentId,
    record?.nAgentId,
  ].find((value) => value !== undefined && value !== null && value !== "");

  const resolveAgentName = (agent: any) =>
    formatDisplayValue(
      getFieldValue(agent, ["cAgentName", "agentName", "name", "cName"]),
    ) ||
    formatDisplayValue(
      findDeepFieldValue(agent, ["cAgentName", "agentName", "name", "cName"]),
    ) ||
    formatDisplayValue(agent);

  if (Array.isArray(raw)) {
    return raw
      .map((agent: any) => resolveAgentName(agent))
      .filter((name: string) => String(name ?? "").trim());
  }

  if (raw && typeof raw === "object") {
    const name = resolveAgentName(raw);
    return name ? [name] : [];
  }

  const text = formatDisplayValue(raw).trim();
  return text ? [text] : [];
};

const normalizeList = (response: any) => extractList(response);

const getCustomerViewRecord = (response: any) => {
  const candidates = [
    response?.data?.data,
    response?.data?.message,
    response?.data,
    response?.message,
    response?.result,
    response?.customer,
    response?.Customer,
    response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate[0] ?? {};
    if (Array.isArray(candidate?.data)) return candidate.data[0] ?? {};
    if (Array.isArray(candidate?.result)) return candidate.result[0] ?? {};
    if (candidate && typeof candidate === "object") return candidate;
  }

  return {};
};

const pickTicketViewRecord = (response: any) => {
  const dataObj = response?.Data ?? response?.data ?? response;

  if (dataObj && typeof dataObj === "object" && !Array.isArray(dataObj)) {
    const summaryObj =
      dataObj.TicketSummary ??
      (Array.isArray(dataObj.ticketSummary)
        ? dataObj.ticketSummary[0]
        : dataObj.ticketSummary) ??
      null;

    if (summaryObj) {
      return {
        ...summaryObj,
        ...dataObj,
      };
    }

    return dataObj;
  }

  const rows = extractList(response);
  if (rows.length > 0) return rows[0];

  return response ?? {};
};

type CallReportViewPageProps = {
  embedded?: boolean;
  overrideState?: Record<string, any>;
  onClose?: () => void;
};

const CallReportViewPage = ({
  embedded = false,
  overrideState,
  onClose,
}: CallReportViewPageProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const state = (overrideState ?? location.state ?? {}) as Record<string, any>;
  const isUnbilledContext = String(state.isFrom ?? "")
    .trim()
    .toLowerCase()
    .includes("unbilled");
  const historySelectedRow = normalizeSingleRecord(state.selectedRow);
  const [worksheetEditOpen, setWorksheetEditOpen] = useState(false);
  const [isNoNeedBillMode, setIsNoNeedBillMode] = useState(false);
  const [nestedCallReportState, setNestedCallReportState] = useState<Record<string, any> | null>(
    null,
  );
  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    navigate(-1);
  };
  const [activeTab, setActiveTab] = useState<"callreport" | "details" | "history" | "bill">(
    "callreport",
  );
  const tabs = isUnbilledContext
    ? ([
        ["callreport", "Call Report"],
        ["details", "Ticket Details"],
        ["history", "History"],
      ] as const)
    : ([
        ["callreport", "Call Report"],
        ["details", "Ticket Details"],
        ["history", "History"],
        ["bill", "Bill"],
      ] as const);

  const sessionPayload = useMemo(() => getRequestPayload(), []);

  const callReportId = Number(
    state.selectedRow?.nCallReportId ??
      state.selectedRow?.CallReportId ??
      state.selectedRow?.nFollowupId ??
      state.selectedRow?.nFollowUpId ??
      state.selectedRow?.nWorksheetId ??
      state.selectedRow?.WorksheetId ??
      state.nCallReportId ??
      state.nFollowupId ??
      0,
  );

  const requestPayload = useMemo(
    () => ({
      ...sessionPayload,
      nCompanyId: Number(sessionPayload.nCompanyId ?? state.nCompanyId ?? 0),
      cSchemaName: sessionPayload.cSchemaName ?? state.cSchemaName ?? "",
      cDbName: sessionPayload.cDbName ?? state.cDbName ?? "",
      nTicketId: Number(state.selectedRow?.nTicketId ?? state.ticketNo ?? 0),
      nFollowupId: callReportId,
      nFollowUpId: callReportId,
      nCallReportId: callReportId,
      CallReportId: callReportId,
    }),
    [callReportId, sessionPayload, state],
  );

  const customerDropdownPayload = useMemo(
    () => ({
      ...sessionPayload,
      pageNumber: 1,
      pageSize: 1000,
      nCompanyId: Number(requestPayload.nCompanyId ?? 0),
      cSchemaName: requestPayload.cSchemaName ?? "",
      cDbName: requestPayload.cDbName ?? "",
    }),
    [requestPayload.cDbName, requestPayload.cSchemaName, requestPayload.nCompanyId, sessionPayload],
  );

  const customerViewPayload = useMemo(
    () => ({
      ...sessionPayload,
      nCustomerId: Number(state.nCustomerId ?? state.customerId ?? state.selectedRow?.nCustomerId ?? 0),
      CustomerId: Number(state.nCustomerId ?? state.customerId ?? state.selectedRow?.nCustomerId ?? 0),
      customerId: Number(state.nCustomerId ?? state.customerId ?? state.selectedRow?.nCustomerId ?? 0),
      pageNumber: 1,
      pageSize: 1000,
      nCompanyId: Number(requestPayload.nCompanyId ?? 0),
      cSchemaName: requestPayload.cSchemaName ?? "",
      cDbName: requestPayload.cDbName ?? "",
    }),
    [
      requestPayload.cDbName,
      requestPayload.cSchemaName,
      requestPayload.nCompanyId,
      sessionPayload,
      state.nCustomerId,
      state.customerId,
      state.selectedRow,
    ],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["callreport-view", requestPayload],
    queryFn: () => ticketApis.callreportView(requestPayload),
    enabled:
      !!callReportId &&
      !!requestPayload.nCompanyId &&
      !!String(requestPayload.cSchemaName ?? "").trim() &&
      !!String(requestPayload.cDbName ?? "").trim(),
  });

  const { data: customerDropdownData } = useGetCustomerDropDown(customerDropdownPayload);

  const { data: customerViewData } = useQuery({
    queryKey: ["callreport-customer-view", customerViewPayload],
    queryFn: () => customerApis.customerView(customerViewPayload),
    enabled:
      !!Number(customerViewPayload.nCustomerId ?? 0) &&
      !!requestPayload.nCompanyId &&
      !!String(requestPayload.cSchemaName ?? "").trim() &&
      !!String(requestPayload.cDbName ?? "").trim(),
  });

  const viewData = data?.data?.data ?? data?.data ?? data ?? {};
  const customerOptions = useMemo(
    () =>
      normalizeList(customerDropdownData).map((item: any) => ({
        value: Number(
          getFieldValue(item, ["nCustomerId", "CustomerId", "customerId", "id", "value"]) || 0,
        ),
        label:
          formatDisplayValue(
            getFieldValue(item, ["cCustomerName", "CustomerName", "name", "label"]),
          ) || "Customer",
      })),
    [customerDropdownData],
  );
  const customerViewRecord = useMemo(
    () => getCustomerViewRecord(customerViewData),
    [customerViewData],
  );

  const callreportSummary = normalizeSingleRecord(
    viewData.callreportSummary ??
      viewData.callReportSummary ??
      viewData.callreportsummary ??
      viewData.data?.callreportSummary ??
      viewData.data?.callReportSummary ??
      historySelectedRow,
  );
  const ticketSummary = normalizeSingleRecord(
    viewData.ticketSummary ??
      viewData.TicketSummary ??
      viewData.data?.ticketSummary ??
      viewData.data?.TicketSummary ??
      historySelectedRow,
  );
  const ticketViewId = Number(
    state.selectedRow?.nTicketId ??
      state.selectedRow?.TicketId ??
      ticketSummary.nTicketId ??
      ticketSummary.TicketId ??
      state.ticketNo ??
      0,
  );
  const ticketViewPayload = useMemo(
    () => ({
      ...sessionPayload,
      nCompanyId: Number(sessionPayload.nCompanyId ?? state.nCompanyId ?? 0),
      cSchemaName: sessionPayload.cSchemaName ?? state.cSchemaName ?? "",
      cDbName: sessionPayload.cDbName ?? state.cDbName ?? "",
      nTicketId: ticketViewId,
    }),
    [sessionPayload, state.cDbName, state.cSchemaName, state.nCompanyId, ticketViewId],
  );
  const canLoadTicketView =
    !!ticketViewId &&
    !!ticketViewPayload.nCompanyId &&
    !!String(ticketViewPayload.cSchemaName ?? "").trim() &&
    !!String(ticketViewPayload.cDbName ?? "").trim();
  const { data: ticketViewData, isLoading: isTicketViewLoading } = useTicketView(
    ticketViewPayload,
    canLoadTicketView,
  );
  const billSummary = normalizeSingleRecord(
    viewData.billSummary ??
      viewData.BillSummary ??
      viewData.data?.billSummary ??
      viewData.data?.BillSummary,
  );
  const worksheetDetails = normalizeSingleRecord(
    viewData.worsheetDetails ??
      viewData.worksheetDetails ??
      viewData.workSheetDetails ??
      viewData.WorsheetDetails ??
      viewData.data?.worsheetDetails ??
      viewData.data?.worksheetDetails ??
      viewData.data?.workSheetDetails ??
      historySelectedRow,
  );

  const customerName =
    ticketSummary.cCustomerName ||
    ticketSummary.CustomerName ||
    historySelectedRow.cCustomerName ||
    historySelectedRow.CustomerName ||
    customerViewRecord.cCustomerName ||
    customerViewRecord.CustomerName ||
    customerViewRecord.name ||
    state.customerName ||
    "-";
  const selectedCustomerId = Number(ticketSummary.nCustomerId ?? state.customerId ?? 0);
  const selectedCustomerOption =
    customerOptions.find((item) => item.value === selectedCustomerId) ?? customerOptions[0] ?? null;
  const customerLabel = selectedCustomerOption?.label || customerName || "-";
  const customerContactPerson =
    customerViewRecord.cContactPerson ||
    customerViewRecord.ContactPerson ||
    customerViewRecord.cName ||
    "";
  const customerMobile =
    customerViewRecord.cContactNumber ||
    customerViewRecord.ContactNumber ||
    customerViewRecord.cPhoneNo ||
    customerViewRecord.cMobile ||
    "";
  const customerEmail =
    customerViewRecord.cEmail ||
    customerViewRecord.Email ||
    "";
  const contactNumber =
    worksheetDetails.cContactNumber ||
    worksheetDetails.ContactNumber ||
    historySelectedRow.cContactNumber ||
    historySelectedRow.ContactNumber ||
    customerMobile ||
    state.contactNumber ||
    "-";
  const email =
    worksheetDetails.cEmail ||
    worksheetDetails.Email ||
    historySelectedRow.cEmail ||
    historySelectedRow.Email ||
    customerEmail ||
    state.email ||
    "-";
  const ticketNo =
    ticketSummary.nTicketNo ||
    ticketSummary.nTicketId ||
    historySelectedRow.nTicketNo ||
    historySelectedRow.TicketNo ||
    historySelectedRow.nTicketId ||
    state.ticketNo ||
    "-";
  const billNo = billSummary.nBillNo || state.billNo || "-";
  const summary =
    callreportSummary.cCallSummary ||
    callreportSummary.cSummary ||
    worksheetDetails.cCallSummary ||
    worksheetDetails.CallSummary ||
    historySelectedRow.cCallSummary ||
    historySelectedRow.CallSummary ||
    historySelectedRow.cSummary ||
    historySelectedRow.cViewSummary ||
    state.summary ||
    "-";
  const description =
    worksheetDetails.cComment ||
    worksheetDetails.Comment ||
    callreportSummary.cComments ||
    callreportSummary.cDescription ||
    historySelectedRow.cComment ||
    historySelectedRow.Comment ||
    historySelectedRow.cComments ||
    historySelectedRow.cDescription ||
    historySelectedRow.Description ||
    state.description ||
    "-";
  const amount = billSummary.nTotalAmount ?? state.amount ?? 0;
  const billDate = parseDateText(billSummary.dBillDate || state.billDate || "");
  const billId = Number(
    billSummary.nBillId ??
      billSummary.BillId ??
      billSummary.billId ??
      viewData.nBillId ??
      viewData.BillId ??
      state.nBillId ??
      state.billId ??
      0,
  );
  const dCreatedDate = parseDateText(
    callreportSummary.dCreatedDate ||
      historySelectedRow.historyCreatedDate ||
      historySelectedRow.dCreatedDate ||
      historySelectedRow.dSortDate ||
      historySelectedRow.CreatedDate ||
      viewData.dCreatedDate ||
      state.dCreatedDate ||
      "",
  );
  const callReportDateText = formatDisplayValue(
    callreportSummary.dCreatedDate ||
      callreportSummary.CreatedDate ||
      historySelectedRow.dCreatedDate ||
      historySelectedRow.dSortDate ||
      historySelectedRow.CreatedDate ||
      viewData.dCreatedDate ||
      state.dCreatedDate ||
      "",
  );
  const contactPerson =
    worksheetDetails.cContactPerson ||
    worksheetDetails.ContactPerson ||
    historySelectedRow.cContactPerson ||
    historySelectedRow.ContactPerson ||
    customerContactPerson ||
    state.contactPerson ||
    "-";
  const ticketViewRecord = useMemo(
    () => pickTicketViewRecord(ticketViewData),
    [ticketViewData],
  );

  const backendNoNeedBillFlag = Boolean(
    viewData?.bNoNeedBill ??
      viewData?.NoNeedBill ??
      viewData?.IsNoNeedBill ??
      viewData?.bDoNotBill ??
      viewData?.DoNotBill ??
      callreportSummary?.bNoNeedBill ??
      callreportSummary?.NoNeedBill ??
      callreportSummary?.IsNoNeedBill ??
      callreportSummary?.bDoNotBill ??
      callreportSummary?.DoNotBill,
  );

  useEffect(() => {
    setIsNoNeedBillMode(backendNoNeedBillFlag);
  }, [backendNoNeedBillFlag]);
  const ticketViewCustomerId = Number(
    pickDisplayValue(ticketViewRecord, ["nCustomerId", "CustomerId", "customerId"]) ||
      ticketSummary.nCustomerId ||
      state.customerId ||
      0,
  );
  const ticketViewTicketNo =
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, ["nTicketNo", "TicketNo", "cTicketNo"]),
    ) || String(ticketViewId || ticketNo || "-");
  const ticketViewCustomerName =
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, [
        "cCustomerName",
        "CustomerName",
        "cName",
        "Customer",
      ]),
    ) || customerLabel;
  const ticketViewSummary =
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, [
        "cTicketSummary",
        "TicketSummary",
        "cViewSummary",
        "ViewSummary",
        "Summary",
      ]),
    ) || summary;
  const ticketViewDescription =
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, [
        "cDescription",
        "Description",
        "cComment",
        "Comment",
      ]),
    ) || description;
  const ticketViewCreatedDate = parseDateText(
    pickDisplayValue(ticketViewRecord, ["dCreatedDate", "CreatedDate", "CreatedOn"]) ||
      ticketSummary.dCreatedDate ||
      dCreatedDate ||
      "",
  );
  const ticketViewCreatedDateValue =
    pickDisplayValue(ticketViewRecord, ["dCreatedDate", "CreatedDate", "CreatedOn"]) ||
    ticketSummary.dCreatedDate ||
    dCreatedDate ||
    "";

  const ticketViewPriority =
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, ["cPriority", "Priority", "priority"]),
    ) || "";
  
    
  const ticketViewPeriod =
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, ["cPeriod", "Period"]),
    ) || "";
 
  const ticketViewStatus =
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, [
        "cTicketStatus",
        "TicketStatus",
        "Status",
        "cStatus",
      ]),
    ) || ticketSummary.cTicketStatus || "";

  const ticketViewTicketAge = formatTicketAge(ticketViewCreatedDateValue);
  const ticketViewFollowupDate =
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, [
        "dFollowupDate",
        "FollowupDate",
        "dNextFollowupDate",
        "NextFollowupDate",
      ]),
    ) || "";
  const ticketViewAddress =
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, [
        "cCustomerAddress",
      ]),
    ) || "";
  const ticketViewAssetName =
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, [
        "cAssetName",
        "AssetName",
        "cProductName",
        "ProductName",
      ]),
    ) || "";
  const ticketViewAssetId = Number(
    pickDisplayValue(ticketViewRecord, [
      "nAssetId",
      "AssetId",
      "assetId",
    ]) || state.nAssetId || 0,
  );
  const ticketViewSource =
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, ["cSourceName"]),
    ) || "";
  const ticketViewServiceType =
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, [
        "cServiceType",
        "ServiceType",
        "cServiceTypeName",
        "ServiceTypeName",
      ]),
    ) || "";
  const ticketViewGroup =
    formatDisplayValue(pickDisplayValue(ticketViewRecord, ["cGroupName"])) ||
    "";
  const ticketViewContactNumber =
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, [
        "cContactNumber",
        "ContactNumber",
        "cPhoneNo",
        "PhoneNo",
      ]),
    ) || contactNumber;
  const ticketViewEmail =
    formatDisplayValue(pickDisplayValue(ticketViewRecord, ["cEmail", "Email", "email"])) ||
    email;
  const ticketViewAttachments = extractList(
    getFieldValue(ticketViewRecord, ["attachments", "Attachments", "TicketAttachments"]) ||
      ticketViewRecord?.attachments ||
      ticketViewRecord?.Attachments ||
      ticketViewRecord?.TicketAttachments ||
      [],
  );
  const ticketViewAlternativeContacts = extractList(
    getFieldValue(ticketViewRecord, [
      "alternativeContacts",
      "AlternativeContacts",
      "customerContacts",
    ]) || [],
  );
  const billRequestPayload = useMemo(
    () => ({
      ...requestPayload,
      nBillId: billId,
      BillId: billId,
      billId,
      nTicketId: ticketViewId,
      nCustomerId: ticketViewCustomerId,
      nAssetId: ticketViewAssetId,
    }),
    [billId, requestPayload, ticketViewAssetId, ticketViewCustomerId, ticketViewId],
  );
  const canLoadBillTabData =
    activeTab === "bill" &&
    !!billRequestPayload.nCompanyId &&
    !!String(billRequestPayload.cSchemaName ?? "").trim() &&
    !!String(billRequestPayload.cDbName ?? "").trim();
  const { data: billViewResponse, isLoading: isBillViewLoading } = useQuery({
    queryKey: ["bill-view", billRequestPayload],
    queryFn: () => billingApis.billView(billRequestPayload),
    enabled: canLoadBillTabData && !!billId,
  });
  const { data: billPartListResponse, isLoading: isBillPartListLoading } = useQuery({
    queryKey: ["bill-part-list", billRequestPayload],
    queryFn: () => billingApis.partListForBilling(billRequestPayload),
    enabled: canLoadBillTabData && !!ticketViewId && !!ticketViewCustomerId,
  });
  const billPartList = useMemo(
    () => extractList(billPartListResponse?.data ?? billPartListResponse ?? []),
    [billPartListResponse],
  );
  const ticketViewAssignedTo =
    pickAssignedAgentNames(ticketViewRecord).join(", ") ||
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, [
        "assignedTo",
        "AssignedTo",
        "cAssignedTo",
        "AssignedUser",
        "agentName",
        "cAgentName",
      ]),
    ) ||
    "";
  const ticketViewAssignAgentNames = pickAssignedAgentNames(ticketViewRecord);
  const ticketViewCreatedByTeam =
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, [
        "TeamName",
        "cTeamName",
        "CreatedByTeam",
        "cCreatedByTeam",
        "GroupName",
        "cGroupName",
        "cCreatedBy",
        "CreatedBy",
      ]),
    ) || "";
  const ticketViewScheduledOn =
    formatDisplayValue(
      pickDisplayValue(ticketViewRecord, [
        "cScheduleDate",
        "ScheduleDate",
        "dScheduleDate",
      ]),
    ) || "";
  const callReportInfoRows = [
    {
      label: "Mode of Engagement",
      icon: EngagementMode,
      value:
        worksheetDetails.cCallMode ||
        worksheetDetails.cCallModeName ||
        worksheetDetails.cCallreportMode ||
        worksheetDetails.cCallreportModeName ||
        historySelectedRow.cCallMode ||
        historySelectedRow.cCallModeName ||
        "-",
    },
    { label: "Contact Person", icon: contact, value: contactPerson },
    { label: "Mobile No", icon: phone, value: contactNumber },
    { label: "Email", icon: mail, value: email },
    {
      label: "Follow Up",
      icon: calender,
      value:
        parseDateText(
          worksheetDetails.dNextFollowupDate ||
            historySelectedRow.dNextFollowupDate ||
            callreportSummary.dFollowupDate ||
            "",
        ) || "-",
    },
    {
      label: "To Do",
      value:
        worksheetDetails.cToDo ||
        historySelectedRow.cToDo ||
        callreportSummary.cToDo ||
        "-",
    },
  ];

  const currentCallModeValue =
    worksheetDetails.cCallMode ||
    worksheetDetails.cCallModeName ||
    worksheetDetails.cCallreportMode ||
    worksheetDetails.cCallreportModeName ||
    historySelectedRow.cCallMode ||
    historySelectedRow.cCallModeName ||
    historySelectedRow.cCallreportMode ||
    historySelectedRow.cCallreportModeName ||
    "";

  const worksheetEditTicketValues = useMemo(
    () => ({
      ...ticketViewRecord,
      nTicketId: ticketViewId,
      TicketId: ticketViewId,
      ticketId: ticketViewId,
      nCustomerId: ticketViewCustomerId,
      CustomerId: ticketViewCustomerId,
      customerId: ticketViewCustomerId,
      CustomerName: ticketViewCustomerName,
      cCustomerName: ticketViewCustomerName,
      ContactPerson: contactPerson,
      cContactPerson: contactPerson,
      ContactNo: ticketViewContactNumber,
      ContactNumber: ticketViewContactNumber,
      cContactNumber: ticketViewContactNumber,
      Email: ticketViewEmail,
      cEmail: ticketViewEmail,
      IssueSummary: ticketViewSummary,
      TicketSummary: ticketViewSummary,
      cTicketSummary: ticketViewSummary,
      Description: ticketViewDescription,
      cDescription: ticketViewDescription,
      Comment: description,
      Comments: description,
      cComment: description,
      cComments: description,
      cCallMode: currentCallModeValue,
      CallMode: currentCallModeValue,
      cCallModeName: currentCallModeValue,
      CallModeName: currentCallModeValue,
      cCallreportMode: currentCallModeValue,
      CallreportMode: currentCallModeValue,
      cTicketStatus: ticketViewStatus,
      TicketStatus: ticketViewStatus,
      Status: ticketViewStatus,
      cStatus: ticketViewStatus,
      nStatusId: ticketSummary.nTicketStatus ?? ticketSummary.TicketStatus ?? state.nTicketStatus ?? 0,
      StatusId: ticketSummary.nTicketStatus ?? ticketSummary.TicketStatus ?? state.nTicketStatus ?? 0,
      nTicketStatus:
        Number(
          ticketSummary.nTicketStatus ??
            ticketSummary.TicketStatus ??
            state.nTicketStatus ??
            0,
        ) || 0,
      ToDo: worksheetDetails.cToDo || callreportSummary.cToDo || "",
      cToDo: worksheetDetails.cToDo || callreportSummary.cToDo || "",
      NextFollowupDate:
        worksheetDetails.dNextFollowupDate ||
        callreportSummary.dFollowupDate ||
        ticketViewFollowupDate ||
        "",
      dNextFollowupDate:
        worksheetDetails.dNextFollowupDate ||
        callreportSummary.dFollowupDate ||
        ticketViewFollowupDate ||
        "",
      OnsiteRequired:
        worksheetDetails.OnsiteRequired ??
        worksheetDetails.bOnsiteRequired ??
        worksheetDetails.bNeedOnsite ??
        callreportSummary.OnsiteRequired ??
        callreportSummary.bOnsiteRequired ??
        callreportSummary.bNeedOnsite ??
        false,
      bOnsiteRequired:
        worksheetDetails.bOnsiteRequired ??
        worksheetDetails.OnsiteRequired ??
        false,
      bNeedOnsite:
        worksheetDetails.bNeedOnsite ??
        callreportSummary.bNeedOnsite ??
        false,
      attachments: ticketViewAttachments,
      files: ticketViewAttachments,
      FollowupDate: ticketViewFollowupDate,
      nCallReportId: callReportId,
      CallReportId: callReportId,
    }),
    [
      callReportId,
      callreportSummary.cToDo,
      callreportSummary.dFollowupDate,
      contactPerson,
      description,
      historySelectedRow.cCallMode,
      historySelectedRow.cCallModeName,
      historySelectedRow.cCallreportMode,
      historySelectedRow.cCallreportModeName,
      state.nTicketStatus,
      ticketSummary.nTicketStatus,
      ticketSummary.TicketStatus,
      ticketViewAttachments,
      ticketViewContactNumber,
      ticketViewCustomerId,
      ticketViewEmail,
      ticketViewId,
      ticketViewRecord,
      ticketViewStatus,
      ticketViewSummary,
      ticketViewDescription,
      ticketViewFollowupDate,
      ticketViewTicketNo,
      ticketViewCustomerName,
      currentCallModeValue,
      worksheetDetails.cCallMode,
      worksheetDetails.cCallModeName,
      worksheetDetails.cCallreportMode,
      worksheetDetails.cCallreportModeName,
      worksheetDetails.cToDo,
      worksheetDetails.dNextFollowupDate,
      worksheetDetails.OnsiteRequired,
      worksheetDetails.bOnsiteRequired,
      worksheetDetails.bNeedOnsite,
      callreportSummary.OnsiteRequired,
      callreportSummary.bOnsiteRequired,
      callreportSummary.bNeedOnsite,
    ],
  );

  const handleWorksheetEditSaved = () => {
    void queryClient.invalidateQueries({ queryKey: ["callreport-view"] });
    void queryClient.invalidateQueries({ queryKey: ["callreport-customer-view"] });
    setWorksheetEditOpen(false);
  };

  const buildNoNeedBillPayload = () => ({
    ...requestPayload,
    nCallReportId: callReportId,
    nFollowupId: callReportId,
    nFollowUpId: callReportId,
    nWorksheetId: callReportId,
    WorksheetId: callReportId,
    bNoNeedBill: true,
    NoNeedBill: true,
    IsNoNeedBill: true,
    bDoNotBill: true,
    DoNotBill: true,
  });

  const buildRevertBillPayload = () => ({
    ...requestPayload,
    nCallReportId: callReportId,
    nFollowupId: callReportId,
    nFollowUpId: callReportId,
    nWorksheetId: callReportId,
    WorksheetId: callReportId,
    bNoNeedBill: false,
    NoNeedBill: false,
    IsNoNeedBill: false,
    bDoNotBill: false,
    DoNotBill: false,
  });

  const buildCallReportViewState = () => ({
    ...viewData,
    selectedRow:
      viewData.selectedRow ??
      historySelectedRow ??
      callreportSummary ??
      ticketSummary ??
      {},
    nCallReportId: callReportId,
    nFollowupId: callReportId,
    nFollowUpId: callReportId,
    nWorksheetId: callReportId,
    WorksheetId: callReportId,
    isFrom: "callreports",
  });

  const handleDoNotBillClick = () => {
    Modal.confirm({
      title: "Do Not Bill",
      centered: true,
      content:
        "This transaction will be marked as 'Do Not Bill.' No charges will be applied. Please verify and proceed accordingly.",
      okText: "Confirm",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await ticketApis.callReportUpdateNoNeedBill(buildNoNeedBillPayload());
          setIsNoNeedBillMode(true);
          message.success("Marked as Do Not Bill");
        } catch (error: any) {
          message.error(
            error?.response?.data?.message ||
              error?.response?.data?.title ||
              error?.message ||
              "Unable to update call report billing state",
          );
          throw error;
        }
      },
    });
  };

  const handleRevertBillClick = () => {
    Modal.confirm({
      title: "Apply Bill",
      centered: true,
      content:
        "This transaction was previously marked as 'Do Not Bill.' Applying the bill will now charge the customer accordingly. Please verify and proceed accordingly.",
      okText: "Confirm",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await ticketApis.callReportUpdateNoNeedBill(buildRevertBillPayload());
          setIsNoNeedBillMode(false);
          void queryClient.invalidateQueries({ queryKey: ["callreport-view"] });
          message.success("Bill state reverted");
          const nextViewState = buildCallReportViewState();
          try {
            sessionStorage.setItem(
              "ticket_portal_callreport_view_state",
              JSON.stringify(nextViewState),
            );
          } catch {
            // best effort only
          }

          navigate("/callreports/view", {
            state: nextViewState,
            replace: true,
          });
        } catch (error: any) {
          message.error(
            error?.response?.data?.message ||
              error?.response?.data?.title ||
              error?.message ||
              "Unable to revert billing state",
          );
          throw error;
        }
      },
    });
  };

  const handleBillNowClick = () => {
    const billPreviewState = {
      customerName: ticketViewCustomerName,
      customerId: ticketViewCustomerId,
      ticketNo: ticketViewId || ticketNo,
      nFollowupId: callReportId,
      nFollowUpId: callReportId,
      nWorksheetId: callReportId,
      WorksheetId: callReportId,
      nCompanyId: requestPayload.nCompanyId,
      contactPerson,
      contactNumber: ticketViewContactNumber,
      email: ticketViewEmail,
      summary,
      partList: extractList(
        billPartListResponse?.data ?? billPartListResponse ?? billPartList ?? [],
      ),
      sessionPayload: {
        ...requestPayload,
        nTicketId: ticketViewId,
        nCustomerId: ticketViewCustomerId,
        nFollowupId: callReportId,
        nFollowUpId: callReportId,
        nWorksheetId: callReportId,
        WorksheetId: callReportId,
      },
      callreportData: viewData,
    };

    try {
      sessionStorage.setItem("ticket_portal_bill_preview_state", JSON.stringify(billPreviewState));
      sessionStorage.setItem("ticket_portal_callreport_view_state", JSON.stringify(viewData));
    } catch {
      // best effort only
    }

    navigate("/billsandreceipts/bills/add", { state: billPreviewState });
  };

  return (
    <div
      className={`flex w-full flex-col ${
        embedded ? "h-[calc(100vh_-_20px)] min-h-0 overflow-hidden" : "bg-white px-4 py-2"
      }`}
    >
      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white">
        <Spin spinning={isLoading} wrapperClassName="flex flex-col">
          <div className="flex flex-col">
            <div className="sticky top-0 z-30 flex items-center border-b border-slate-200 bg-white">
              <div className="flex min-w-0 flex-1 items-center ">
                {tabs.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`whitespace-nowrap border-r border-slate-200 px-4 py-2 text-center text-[14px] font-medium transition-colors ${
                      activeTab === key
                        ? "bg-sky-500 text-white"
                        : "bg-white text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 px-3">
                <button
                  type="button"
                  aria-label="Share call report"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
                >
                  <img src={shareIcon} alt="" className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={handleClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-900 hover:bg-slate-100"
                >
                  <img src={closeblack} alt="" className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {activeTab === "callreport" ? (
              <div className="sticky top-[41px] z-20 border-b border-slate-200 bg-white px-3 pb-3 pt-2">
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-slate-900">
                        <span>Call Report Id : {callReportId || "-"}</span>
                        <span className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-normal text-sky-600">
                          {ticketViewStatus || ticketSummary.cTicketStatus || "Pending"}
                        </span>
                      </div>
                      <div className="mt-1 text-[14px] font-medium text-slate-900">
                        {customerLabel || "-"}
                      </div>
                    </div>
                    <div className="whitespace-nowrap pt-1 text-[13px] text-slate-900">
                      Call Report on {callReportDateText || dCreatedDate || "-"}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="relative min-h-0 w-full px-3 pb-3 pt-2">
              {activeTab === "callreport" ? (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div className="text-[16px] font-semibold text-slate-900">Work Sheet</div>
                    <div className="mt-3 space-y-1.5 text-[14px] text-slate-700">
                      <div>
                        <span className="text-sky-700">Summary : </span>
                        <span className="text-slate-900">{summary || "-"}</span>
                      </div>
                      <div>
                        <span className="text-sky-700">Comment : </span>
                        <span className="text-slate-900">{description || "-"}</span>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <div className="grid gap-x-8 gap-y-2 md:grid-cols-3">
                        {callReportInfoRows.map((item) => (
                          <div key={item.label} className="min-w-0">
                            <div className="flex items-start gap-2 text-[13px] text-slate-700">
                              <div className="min-w-0">
                                <span className="inline-flex items-start gap-1 font-semibold text-slate-900">
                                  {item.icon ? (
                                    <img
                                      src={item.icon}
                                      alt=""
                                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                                      aria-hidden="true"
                                    />
                                  ) : null}
                                  <span>{item.label} : </span>
                                </span>
                                <span className="text-slate-500">{item.value || "-"}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {activeTab === "details" ? (
                <TicketOverviewSection
                    ticketId={ticketViewId}
                    customerId={ticketViewCustomerId}
                    isLoading={isTicketViewLoading}
                    activeTab="details"
                    onTabChange={() => undefined}
                    showTabs={false}
                    showFilesTab={false}
                    showFilesInDetails={true}
                    showFollowUpAction={false}
                    showAssetEditIcon={false}
                    ticketNo={ticketViewTicketNo}
                    customerName={ticketViewCustomerName}
                    summary={ticketViewSummary}
                  description={ticketViewDescription}
                  createdDate={ticketViewCreatedDate}
                  priority={ticketViewPriority}
                  ticketAge={ticketViewTicketAge}
                  status={ticketViewStatus}
                  period={ticketViewPeriod}
                  followupDate={ticketViewFollowupDate}
                    address={ticketViewAddress}
                    assetName={ticketViewAssetName}
                    source={ticketViewSource}
                    serviceType={ticketViewServiceType}
                    group={ticketViewGroup}
                    contactNumber={ticketViewContactNumber}
                    email={ticketViewEmail}
                    attachments={ticketViewAttachments}
                    attachmentsLoading={isTicketViewLoading}
                    createdByTeam={ticketViewCreatedByTeam}
                    alternativeContacts={ticketViewAlternativeContacts}
                    assignedTo={ticketViewAssignedTo}
                    assignAgentNames={ticketViewAssignAgentNames}
                    previousCallReport={null}
                    onOpenCallReport={setNestedCallReportState}
                    extraRows={
                      ticketViewScheduledOn
                        ? [{ label: "Scheduled on", value: ticketViewScheduledOn, icon: calender }]
                        : []
                    }
                    onFollowUpClick={() => {
                      navigate("/tickets/create", {
                        state: {
                          selectedRow: ticketViewRecord,
                          followupSourceTicket: {
                            nTicketId: ticketViewId,
                            cViewSummary:
                              ticketViewSummary || ticketViewDescription || "Follow up ticket",
                            summary: ticketViewSummary,
                            description: ticketViewDescription,
                          },
                          draftValues: {
                            CustomerId: ticketViewCustomerId,
                            ContactNo: ticketViewContactNumber,
                            Email: ticketViewEmail,
                            IssueSummary:
                              ticketViewSummary || ticketViewDescription || "Follow up ticket",
                            Description: ticketViewDescription || ticketViewSummary || "",
                            Priority: ticketViewPriority || "Low",
                            Group:
                              getFieldValue(ticketViewRecord, ["nGroupId", "GroupId"]) === 0
                                ? undefined
                                : getFieldValue(ticketViewRecord, ["nGroupId", "GroupId"]),
                            ServiceType:
                              getFieldValue(ticketViewRecord, ["nServiceTypeId", "ServiceTypeId"]) ===
                              0
                                ? undefined
                                : getFieldValue(ticketViewRecord, [
                                    "nServiceTypeId",
                                    "ServiceTypeId",
                                  ]),
                            Source: getFieldValue(ticketViewRecord, [
                              "nTicketSourceId",
                              "TicketSourceId",
                            ]),
                            AssetId: getFieldValue(ticketViewRecord, ["nAssetId", "AssetId"]),
                            AssetName: ticketViewAssetName,
                            files: ticketViewAttachments,
                          },
                        },
                      });
                    }}
                  />
              ) : null}

              {activeTab === "history" ? (
                <TicketOverviewSection
                  ticketId={ticketViewId}
                  customerId={ticketViewCustomerId}
                  isLoading={isTicketViewLoading}
                  activeTab="history"
                  onTabChange={() => undefined}
                  showTabs={false}
                  showFilesTab={false}
                  showFilesInDetails={true}
                  showFollowUpAction={false}
                  showAssetEditIcon={false}
                  ticketNo={ticketViewTicketNo}
                  customerName={ticketViewCustomerName}
                  summary={ticketViewSummary}
                  description={ticketViewDescription}
                  createdDate={ticketViewCreatedDate}
                  priority={ticketViewPriority}
                  ticketAge={ticketViewTicketAge}
                  period={ticketViewPeriod}
                  status={ticketViewStatus}
                  followupDate={ticketViewFollowupDate}
                  address={ticketViewAddress}
                  assetName={ticketViewAssetName}
                  source={ticketViewSource}
                  serviceType={ticketViewServiceType}
                  group={ticketViewGroup}
                  contactNumber={ticketViewContactNumber}
                  email={ticketViewEmail}
                  attachments={ticketViewAttachments}
                  attachmentsLoading={isTicketViewLoading}
                  createdByTeam={ticketViewCreatedByTeam}
                  alternativeContacts={ticketViewAlternativeContacts}
                  assignedTo={ticketViewAssignedTo}
                  assignAgentNames={ticketViewAssignAgentNames}
                  previousCallReport={null}
                  onOpenCallReport={setNestedCallReportState}
                  extraRows={
                    ticketViewScheduledOn
                      ? [{ label: "Scheduled on", value: ticketViewScheduledOn, icon: calender }]
                      : []
                  }
                />
              ) : null}

              {activeTab === "bill" ? (
                <BillReadonlyView
                  viewData={viewData}
                  billViewData={billViewResponse}
                  loading={isBillViewLoading || isBillPartListLoading}
                  fallbackState={{
                    customerName,
                    address: ticketSummary.cCustomerAddress || state.address,
                    billNo,
                    billId,
                    billDate,
                    amount,
                    payMode: billSummary.cPaymodeName || state.payMode,
                    summary,
                  }}
                />
              ) : null}
            </div>
          </div>
        </Spin>
      </div>
      {nestedCallReportState ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/30 p-4">
          <div className="callreport-overview-scrollbar h-[75vh] w-full max-w-[920px] overflow-y-auto rounded-2xl shadow-2xl">
            <CallReportHistoryModal
              record={nestedCallReportState.selectedRow ?? nestedCallReportState}
              onClose={() => setNestedCallReportState(null)}
            />
          </div>
        </div>
      ) : null}

      {activeTab === "callreport" ? (
        <div className="mt-auto flex justify-end gap-3 px-6 -mb-165 pt-3">
          {isUnbilledContext ? (
            <>
              {isNoNeedBillMode ? (
                <Button danger ghost className="px-4" onClick={handleRevertBillClick}>
                  Revert To Bill
                </Button>
              ) : (
                <Button danger ghost className="px-4" onClick={handleDoNotBillClick}>
                  Do Not Bill
                </Button>
              )}
              <Button
                type="primary"
                className="!border-emerald-500 !bg-emerald-500 px-6"
                onClick={() => setWorksheetEditOpen(true)}
              >
                Edit
              </Button>
              {!isNoNeedBillMode ? (
                <Button
                  type="primary"
                  className="!border-emerald-500 !bg-emerald-500 px-6"
                  onClick={handleBillNowClick}
                >
                  Bill Now
                </Button>
              ) : null}
            </>
          ) : (
            <Button
              type="primary"
              className="!border-emerald-500 !bg-emerald-500 px-6"
              onClick={() => setWorksheetEditOpen(true)}
            >
              Edit
            </Button>
          )}
        </div>
      ) : null}

      <QuickCallReportModal
        open={worksheetEditOpen}
        onClose={() => setWorksheetEditOpen(false)}
        ticketId={ticketViewId}
        ticketValues={worksheetEditTicketValues}
      selectedCustomerName={ticketViewCustomerName}
      sessionPayload={requestPayload}
      skipAmcWarningOnSave
      drawerWidth={560}
      onSaved={handleWorksheetEditSaved}
    />
  </div>
  );
};

export default CallReportViewPage;
