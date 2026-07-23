import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Dropdown, Input, InputNumber, Modal, Select, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  useRepairItemActivityList,
  useTicketHistory,
  useTicketHistoryAttachment,
  useTicketView,
} from "../../../Hooks/Ticket/useTicketQueries";
import { useCheckAmcExpiry } from "../../Master/CustomerMaster/Hooks";
import { getApiImageBaseUrl } from "../../../Axios/config";
import { billingApis } from "../../../Axios/BillingApis";
import { getRequestPayload } from "../../../Utils/requestPayload";
import { extractList } from "../../Master/Common/SimpleMasterUtils";
import QuickCallReportModal from "../Common/QuickCallReportModal";
import EstimateModal from "../Common/EstimateModal";
import TicketPageShell from "../Common/TicketPageShell";
import TicketOverviewSection from "./TicketOverviewSection";
import CallReportViewPage from "../../CallReport/CallReportViewPage";
import shareIcon from "../../../assets/icons/shareIcon.svg";
import closeblack from "../../../assets/icons/close-black.svg";
import EstimateIcon from "../../../assets/icons/EstimateIcon.svg";
import transferIcon from "../../../assets/icons/transferIcon.svg";
import postponeIcon from "../../../assets/icons/postponeIcon.svg";
import sendIcon from "../../../assets/icons/sendIcon.svg";
import mergeIcon from "../../../assets/icons/mergeIcon.svg";
import calendarIcon from "../../../assets/icons/calenderiCon.svg";
import editBlackIcon from "../../../assets/icons/edit-black.svg";
import deleteRedIcon from "../../../assets/icons/delete-red.svg";
import { useGetAssignAgentList } from "../../Master/Agent/Hooks";
import { useGetAgentDropdown } from "../../Master/Agent/Hooks";
import {
  useGetCustomerAlternativeContacts,
  useGetCustomerAssetDepartments,
  useGetCustomerBrandOptions,
  useGetCustomerWiseAssets,
} from "../../Master/CustomerMaster/Hooks";
import { useGetParts } from "../../Master/Parts/Hooks";
import { useGetVendorDropdown } from "../../Master/VendorMaster/Hooks";
import { useGetStatuses } from "../../Master/StatusMaster/Hooks";
import TransferTicketModal from "../Common/TransferTicketModal";
import RepairStatusModal from "../Common/RepairStatusModal";
import ShareInfoModal from "../Common/ShareInfoModal";
import ShareTicketModal from "../Common/ShareTicketModal";
import FollowupModal from "../Common/FollowupPostponeModal";
import AssignTicketModal from "../Common/AssignTicketModal";
import { useTicketActions } from "../../../Hooks/Ticket/useTicketActions";
import { itemRepairApis } from "../../../Axios/ItemRepairApis";
const MERGE_BANNER_STORAGE_KEY = "ticket_portal_merge_banner";
const WORKFLOW_STORAGE_PREFIX = "ticket_portal_workflow_state";
const BILL_PREVIEW_STORAGE_KEY = "ticket_portal_bill_preview_state";
type TicketViewState = {
  selectedRow?: Record<string, any> | null;
  savedTicketRecord?: Record<string, any> | null;
  quickCallTicketValues?: Record<string, any> | null;
  assignedAgentDetails?: any[];
  openQuickCall?: boolean;
  isFrom?: string;
  activeTab?: "details" | "history" | "files";
  mergeBanner?: {
    text?: string;
    primaryTicketId?: number;
    mergedTicketId?: number;
    primaryTicketNo?: number;
    mergedTicketNo?: number;
  } | null;
};

const getFieldValue = (record: any, keys: string[]) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null) {
      return record[key];
    }
  }

  const recordKey = Object.keys(record || {}).find((item) =>
    keys.some((key) => key.toLowerCase() === item.toLowerCase()),
  );

  if (!recordKey) return "";

  return record?.[recordKey] ?? "";
};

const formatDisplayValue = (value: any): string => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    return value
      .map((item) => formatDisplayValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return (
      value?.name ??
      value?.label ??
      value?.Label ??
      value?.title ??
      value?.Title ??
      value?.text ??
      value?.Text ??
      value?.value ??
      value?.Value ??
      value?.cName ??
      value?.cTitle ??
      value?.cDescription ??
      ""
    );
  }

  return String(value);
};

const normalizeText = (value: any) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getFirstTicketValue = (record: Record<string, any>, keys: string[]) =>
  keys.reduce<any>(
    (found, key) =>
      found !== undefined && found !== null && found !== "" ? found : record?.[key],
    undefined,
  );

const normalizeBillParts = (response: any) =>
  extractList(response?.data ?? response).map((item: any, index: number) => ({
    key: item?.nPartId ?? item?.partId ?? item?.id ?? index,
    name:
      item?.cPartName ??
      item?.PartName ??
      item?.cItemName ??
      item?.ItemName ??
      item?.name ??
      item?.label ??
      `Part ${index + 1}`,
    qty: item?.nQty ?? item?.qty ?? item?.quantity ?? "",
    rate: item?.nRate ?? item?.rate ?? item?.price ?? "",
    total: item?.nTotalAmount ?? item?.total ?? item?.amount ?? "",
  }));

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

  const dmYTimeMatch = text.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*([AP]M))?)?$/i,
  );

  if (dmYTimeMatch) {
    const [, dd, mm, yyyy, hh = "0", min = "0", meridiem] = dmYTimeMatch;
    let hour = Number(hh);
    const minute = Number(min);

    if (meridiem) {
      const upper = meridiem.toUpperCase();
      if (upper === "PM" && hour < 12) hour += 12;
      if (upper === "AM" && hour === 12) hour = 0;
    }

    const parsed = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      hour,
      minute,
      0,
      0,
    );
    const ms = parsed.getTime();
    return Number.isNaN(ms) ? null : ms;
  }

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

const formatRepairDateLabel = (value: any) => {
  const text = formatDisplayValue(value);
  if (!text) return "";

  const parsedMs = parseTicketDate(text);
  if (parsedMs === null) return text;

  const parsedDate = new Date(parsedMs);
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const month = parsedDate.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = parsedDate.getFullYear();

  const hours24 = parsedDate.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = String(parsedDate.getMinutes()).padStart(2, "0");
  const meridiem = hours24 >= 12 ? "PM" : "AM";

  return `${day} ${month} ${year} ${hours12}:${minutes} ${meridiem}`;
};

const formatFollowupDateTime = (value: any) => {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const slashDate = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)?)?$/i,
  );
  if (slashDate) {
    const [, day, month, year, hour, minute, meridiem] = slashDate;
    const datePart = `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    if (!hour || !minute) return datePart;
    return `${datePart} ${hour.padStart(2, "0")}:${minute} ${
      meridiem?.toUpperCase() || ""
    }`.trim();
  }

  const parsed = dayjs(text);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY hh:mm A") : text;
};

const isCallReportHistoryItem = (item: Record<string, any>) => {
  const title = normalizeText(
    formatDisplayValue(
      getFieldValue(item, [
        "cViewSummary",
        "ViewSummary",
        "Summary",
        "Title",
        "Action",
        "Activity",
      ]),
    ),
  );
  const historySummary = normalizeText(
    formatDisplayValue(
      getFieldValue(item, ["cHistorySummary", "HistorySummary", "cViewSummary", "ViewSummary"]),
    ),
  );
  const typeValue = Number(getFieldValue(item, ["nType", "Type", "type"]) || 0);

  return typeValue === 2 || title.includes("callreport") || historySummary.includes("callreport");
};

const getTicketStatusValue = (record: any) =>
  getFieldValue(record, [
    "Status",
    "StatusName",
    "cStatus",
    "cStatusName",
    "TicketStatus",
    "TicketStatusName",
    "cTicketStatus",
    "cTicketStatusName",
    "cTicketStatusDesc",
    "cDescription",
    "TicketStatusDesc",
    "cStatusDesc",
    "StatusDesc",
    "cViewSummary",
    "cStatusDescription",
    "StatusDescription",
    "TicketStatusDescription",
    "StatusValue",
    "nStatus",
    "nTicketStatus",
    "nStatusId",
    "cStatusId",
    "cTicketStatusId",
    "cCurrentStatus",
    "cCurrentStatusName",
    "cCallStatus",
    "cCallStatusName",
    "status",
  ]) ||
  getFieldValue(record?.status, [
    "name",
    "Name",
    "statusName",
    "StatusName",
    "cStatusName",
    "cDescription",
    "cTicketStatusName",
    "cTicketStatus",
    "cTicketStatusDesc",
    "StatusDesc",
    "cViewSummary",
    "StatusDescription",
    "TicketStatusDescription",
    "value",
    "label",
  ]) ||
  getFieldValue(record?.ticketStatus, [
    "name",
    "Name",
    "statusName",
    "StatusName",
    "cStatusName",
    "cTicketStatusName",
    "cTicketStatus",
    "cTicketStatusDesc",
    "cDescription",
    "StatusDesc",
    "StatusDescription",
    "TicketStatusDescription",
    "value",
    "label",
  ]) ||
  getFieldValue(record?.Status, [
    "name",
    "Name",
    "statusName",
    "StatusName",
    "cStatusName",
    "cTicketStatusName",
    "cTicketStatus",
    "cTicketStatusDesc",
    "StatusDesc",
    "cDescription",
    "StatusDescription",
    "TicketStatusDescription",
    "value",
    "label",
  ]);

const normalizeTicketStatus = (record: any): string => {
  const statusValue = getTicketStatusValue(record);
  const statusText = formatDisplayValue(statusValue).trim();

  if (!statusText) return "";

  const lowered = statusText.toLowerCase();
  const fieldNameMarkers = [
    "cticketstatus",
    "ticketstatus",
    "statusname",
    "cstatus",
    "status",
  ];

  if (fieldNameMarkers.includes(lowered)) {
    return "";
  }

  return statusText;
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

const pickRecord = (response: any) => {
  const dataObj = response?.Data ?? response?.data ?? response;

  if (dataObj && typeof dataObj === "object" && !Array.isArray(dataObj)) {
    const recordCandidates = [
      dataObj.TicketDetails,
      dataObj.ticketDetails,
      dataObj.TicketDetail,
      dataObj.ticketDetail,
      dataObj.TicketView,
      dataObj.ticketView,
      dataObj.Result,
      dataObj.result,
      dataObj.Data,
      dataObj.data,
    ];

    for (const candidate of recordCandidates) {
      if (Array.isArray(candidate) && candidate.length) return candidate[0];
      if (candidate && typeof candidate === "object") {
        const nestedRows = extractList(candidate);
        if (nestedRows.length) return nestedRows[0];
        return candidate;
      }
    }

    const wrappedRows = extractList(dataObj);
    if (wrappedRows.length) return wrappedRows[0];

    // Handle both TicketSummary (object) and ticketSummary (array)
    const summaryObj =
      dataObj.TicketSummary ??
      (Array.isArray(dataObj.ticketSummary)
        ? dataObj.ticketSummary[0]
        : dataObj.ticketSummary) ??
      null;

    if (summaryObj) {
      return {
        ...summaryObj, // cDescription, cTicketSummary, etc. from summary
        ...dataObj, // root fields overwrite (nCustomerId, attachments, etc.)
      };
    }
    return dataObj;
  }

  const rows = extractList(response);

  if (rows.length > 0) return rows[0];

  return response ?? {};
};

/** Resolve a potentially-relative image path to a full URL */
const resolveImageUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  try {
    const base = getApiImageBaseUrl().replace(/\/$/, "");
    return `${base}/${path.replace(/^\//, "")}`;
  } catch {
    return path;
  }
};

const parseMaybeJsonList = (value: any) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  const text = value.trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const pickAttachments = (record: any) => {
  // API returns lowercase 'attachments' — add both cases
  if (Array.isArray(record)) {
    return record;
  }

  if (Array.isArray(record?.data)) {
    return record.data;
  }

  if (Array.isArray(record?.data?.data)) {
    return record.data.data;
  }

  const candidates = [
    record?.attachments,
    record?.Attachments,
    record?.TicketAttachments,
    record?.ticketAttachments,
    record?.AttachmentList,
    record?.attachmentList,
    record?.data?.attachments,
    record?.data?.Attachments,
    record?.data?.TicketAttachments,
    record?.data?.ticketAttachments,
    record?.data?.AttachmentList,
    record?.data?.attachmentList,
  ];

  for (const candidate of candidates) {
    const files = parseMaybeJsonList(candidate);

    if (files.length > 0) {
      // Resolve relative URLs for each attachment
      return files.map((file: any) => ({
        ...file,
        cUrl: resolveImageUrl(
          file?.cUrl ?? file?.cFilePath ?? file?.url ?? file?.path ?? "",
        ),
      }));
    }
  }

  const deepFindAttachmentList = (
    value: any,
    seen = new Set<any>()
  ): any[] => {
    if (!value || typeof value !== "object" || seen.has(value)) {
      return [];
    }

    seen.add(value);

    const attachmentKeys = [
      "attachments",
      "Attachments",
      "TicketAttachments",
      "ticketAttachments",
      "AttachmentList",
      "attachmentList",
    ];

    for (const key of attachmentKeys) {
      const nextValue = value?.[key];
      if (Array.isArray(nextValue) && nextValue.length > 0) {
        return nextValue;
      }

      const parsedList = parseMaybeJsonList(nextValue);
      if (parsedList.length > 0) {
        return parsedList;
      }
    }

    for (const entry of Object.values(value)) {
      if (entry && typeof entry === "object") {
        const nested = deepFindAttachmentList(entry, seen);
        if (nested.length > 0) {
          return nested;
        }
      }
    }

    return [];
  };

  const deepAttachments = deepFindAttachmentList(record);

  if (deepAttachments.length > 0) {
    return deepAttachments.map((file: any) => ({
      ...file,
      cUrl: resolveImageUrl(
        file?.cUrl ?? file?.cFilePath ?? file?.url ?? file?.path ?? "",
      ),
    }));
  }

  return [];
};

const pickAllAttachments = (record: any) => {
  const directAttachments = pickAttachments(record);

  if (directAttachments.length > 0) {
    return directAttachments.map((file: any) => ({
      ...file,
      uid:
        file?.uid ??
        file?.nAttachementId ??
        file?.AttachmentId ??
        file?.nAttachmentId ??
        file?.id,
      name:
        file?.name ??
        file?.FileName ??
        file?.cFileName ??
        file?.cDocumentName ??
        file?.DocumentName,
      cUrl: resolveImageUrl(
        file?.cUrl ??
          file?.cFilePath ??
          file?.url ??
          file?.path ??
          file?.Location ??
          file?.location ??
          file?.FilePath ??
          file?.filepath ??
          "",
      ),
    }));
  }

  const nestedObjects = [
    record?.Data,
    record?.data,
    record?.Result,
    record?.result,
    record?.message,
    record?.response,
    record?.response?.data,
    record?.Data?.data,
    record?.data?.data,
    record?.Data?.result,
    record?.data?.result,
  ].filter(Boolean);

  for (const item of nestedObjects) {
    const nestedAttachments = pickAttachments(item);

    if (nestedAttachments.length > 0) {
      return nestedAttachments.map((file: any) => ({
        ...file,
        uid:
          file?.uid ??
          file?.nAttachementId ??
          file?.AttachmentId ??
          file?.nAttachmentId ??
          file?.id,
        name:
          file?.name ??
          file?.FileName ??
          file?.cFileName ??
          file?.cDocumentName ??
          file?.DocumentName,
        cUrl: resolveImageUrl(
          file?.cUrl ??
            file?.cFilePath ??
            file?.url ??
            file?.path ??
            file?.Location ??
            file?.location ??
            file?.FilePath ??
            file?.filepath ??
            "",
        ),
      }));
    }
  }

  const extractedList = extractList(record);

  if (Array.isArray(extractedList) && extractedList.length > 0) {
    return extractedList.map((file: any) => ({
      ...file,
      uid:
        file?.uid ??
        file?.nAttachementId ??
        file?.AttachmentId ??
        file?.nAttachmentId ??
        file?.id,
      name:
        file?.name ??
        file?.FileName ??
        file?.cFileName ??
        file?.cDocumentName ??
        file?.DocumentName,
      cUrl: resolveImageUrl(
        file?.cUrl ??
          file?.cFilePath ??
          file?.url ??
          file?.path ??
          file?.Location ??
          file?.location ??
          file?.FilePath ??
          file?.filepath ??
          "",
      ),
    }));
  }

  return [];
};

const pickAssignedAgents = (record: any) => {
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

  if (Array.isArray(raw)) {
    return raw
      .map((agent: any) => ({
        nAgentId: Number(
          agent?.nAgentId ??
            agent?.agentId ??
            agent?.id ??
            agent?.value ??
            agent ??
            0,
        ),
        nRole: Number(agent?.nRole ?? 0),
      }))
      .filter((agent: any) => agent.nAgentId > 0);
  }

  const parsed = typeof raw === "string" ? Number(raw) : Number(raw ?? 0);
  return parsed > 0 ? [{ nAgentId: parsed, nRole: 0 }] : [];
};

const buildFollowupDetailRows = (record: any) => {
  const rows = [
    {
      label: "Followup Mode",
      value: formatDisplayValue(
        getFieldValue(record, [
          "FollowupMode",
          "cFollowupMode",
          "CallReportMode",
          "cCallReportMode",
          "ModeName",
          "cModeName",
        ]),
      ),
    },
    {
      label: "Followup Remarks",
      value: formatDisplayValue(
        getFieldValue(record, [
          "Remarks",
          "Remark",
          "FollowupRemarks",
          "cFollowupRemarks",
          "CallRemarks",
          "cCallRemarks",
          "CallSummary",
          "cCallSummary",
        ]),
      ),
    },
    {
      label: "Next Follow Up",
      value: formatDisplayValue(
        getFieldValue(record, [
          "NextFollowupDate",
          "dNextFollowupDate",
          "NextFollowUpDate",
          "dNextFollowUpDate",
          "UpcomingFollowupDate",
          "dUpcomingFollowupDate",
        ]),
      ),
    },
    {
      label: "Followup Status",
      value: formatDisplayValue(
        getFieldValue(record, [
          "FollowupStatus",
          "cFollowupStatus",
          "CallStatus",
          "cCallStatus",
          "Status",
          "cStatus",
        ]),
      ),
    },
  ];

  return rows.filter((item) => String(item.value ?? "").trim());
};

const getCurrentUserName = () => {
  for (const [storage, key] of [
    [sessionStorage, "userSession"],
    [localStorage, "userCredentials"],
  ] as const) {
    try {
      const parsed = JSON.parse(storage.getItem(key) ?? "{}");
      const candidates = [
        parsed?.data?.userDetails,
        parsed?.userDetails,
        parsed?.data?.agentDetails,
        parsed?.agentDetails,
        parsed?.data?.user,
        parsed?.user,
        parsed?.data,
        parsed,
      ].flatMap((candidate) =>
        Array.isArray(candidate) ? candidate : [candidate],
      );

      for (const user of candidates) {
        const name = formatDisplayValue(
          user?.cName ??
            user?.cAgentName ??
            user?.cUserName ??
            user?.cFullName ??
            user?.Name ??
            user?.name ??
            user?.UserName ??
            user?.userName ??
            user?.username ??
            "",
        ).trim();

        if (name) return name;
      }
    } catch {
      // Ignore malformed legacy session values and try the next source.
    }
  }

  return "";
};

const buildTicketStatusUpdatePayload = (
  ticketId: number,
  record: Record<string, any>,
  sessionPayload: Record<string, any>,
  nextStatusId: number,
  nextStatusLabel: string,
  comment = "",
) => {
  const ticketIdValue =
    Number(ticketId || 0) ||
    Number(getFieldValue(record, ["nTicketId", "TicketId", "ticketId"]) || 0);

  return {
    nTicketId: ticketIdValue,
    TicketId: ticketIdValue,
    nStatus: Number(nextStatusId || 0),
    nTicketStatus: Number(nextStatusId || 0),
    TicketStatus: nextStatusLabel,
    cTicketStatus: nextStatusLabel,
    Status: nextStatusLabel,
    cStatus: nextStatusLabel,
    nCompanyId: Number(sessionPayload.nCompanyId ?? 0) || 0,
    cComment: String(comment ?? "").trim(),
    Comment: String(comment ?? "").trim(),
    nModifiedBy: Number(
      sessionPayload.nAgentId ??
        sessionPayload.id ??
        sessionPayload.nUserId ??
        0,
    ) || 0,
    cDbName: sessionPayload.cDbName ?? "",
    cSchemaName: sessionPayload.cSchemaName ?? "",
  };
};

const buildAmcExpiryPayload = (
  record: Record<string, any>,
  sessionPayload: Record<string, any>,
) => {
  const customerId = Number(
    getFirstTicketValue(record ?? {}, [
      "CustomerId",
      "nCustomerId",
      "customerId",
    ]) ?? 0,
  ) || 0;
  const assetId = Number(
    getFirstTicketValue(record ?? {}, [
      "AssetId",
      "nAssetId",
      "assetId",
    ]) ?? 0,
  ) || 0;

  return {
    ...sessionPayload,
    CustomerId: customerId,
    customerId,
    nCustomerId: customerId,
    AssetId: assetId,
    assetId,
    nAssetId: assetId,
  };
};

const isUnderAmcOrWarranty = (response: any) => {
  const data = response?.data ?? response ?? {};
  const messageText = String(
    data?.message ?? data?.title ?? "",
  ).toLowerCase();
  const amcFlag = Boolean(
    data?.bUnderAmc ??
      data?.bAMC ??
      data?.amc ??
      data?.underAmc ??
      data?.isUnderAmc,
  );
  const warrantyFlag = Boolean(
    data?.bUnderWarranty ??
      data?.bWarranty ??
      data?.warranty ??
      data?.underWarranty ??
      data?.isUnderWarranty,
  );
  const successFlag = data?.success ?? data?.isSuccess ?? data?.status;

  return (
    amcFlag ||
    warrantyFlag ||
    successFlag === true ||
    String(successFlag).toLowerCase() === "true" ||
    (!messageText.includes("not under") &&
      !messageText.includes("not available"))
  );
};

const getMergedTicketBanner = (
  historyItems: any[],
  currentTicketId: number,
  currentTicketNo: string,
) => {
  const mergeHistoryItem = [...historyItems].reverse().find((item: any) => {
    const title = normalizeText(
      getFieldValue(item, [
        "cViewSummary",
        "ViewSummary",
        "Summary",
        "Title",
        "Action",
        "Activity",
      ]),
    );
    const remarks = normalizeText(
      getFieldValue(item, [
        "Remarks",
        "Remark",
        "Comment",
        "Description",
        "cDescription",
        "CallSummary",
        "cCallSummary",
      ]),
    );

    return title.includes("merge") || remarks.includes("merge");
  });

  if (!mergeHistoryItem) return null;

  const title = formatDisplayValue(
    getFieldValue(mergeHistoryItem, [
      "cViewSummary",
      "ViewSummary",
      "Summary",
      "Title",
      "Action",
      "Activity",
    ]),
  );
  const remarks = formatDisplayValue(
    getFieldValue(mergeHistoryItem, [
      "Remarks",
      "Remark",
      "Comment",
      "Description",
      "cDescription",
      "CallSummary",
      "cCallSummary",
    ]),
  );

  const primaryTicketNo = formatDisplayValue(
    getFieldValue(mergeHistoryItem, [
      "nPrimaryTicketNo",
      "PrimaryTicketNo",
      "nPrimaryTicketNumber",
      "PrimaryTicketNumber",
    ]),
  );
  const mergedTicketNo = formatDisplayValue(
    getFieldValue(mergeHistoryItem, [
      "nMergedTicketNo",
      "MergedTicketNo",
      "nMergedWithTicketNo",
      "MergedWithTicketNo",
      "nMergeTicketNo",
      "MergeTicketNo",
    ]),
  );

  const mergedText =
    (title && /merged/i.test(title) && /into/i.test(title) && title) ||
    (remarks && /merged/i.test(remarks) && /into/i.test(remarks) && remarks) ||
    (mergedTicketNo || primaryTicketNo
      ? `Merged : Ticket No. ${mergedTicketNo || ""} Into Ticket No. ${
          primaryTicketNo || currentTicketNo || currentTicketId || ""
        }`
      : "");

  if (!mergedText) return null;

  const primaryTicketId = Number(
    getFieldValue(mergeHistoryItem, ["nPrimaryTicketId", "PrimaryTicketId"]) ||
      currentTicketId ||
      0,
  );
  const mergedTicketId = Number(
    getFieldValue(mergeHistoryItem, [
      "nMergedTicketId",
      "MergedTicketId",
      "MergedWithTicketId",
      "nMergeTicketId",
      "MergeTicketId",
      "TargetTicketId",
      "nTargetTicketId",
    ]) || 0,
  );

  return {
    text: mergedText,
    primaryTicketId,
    mergedTicketId,
    primaryTicketNo: Number(primaryTicketNo || currentTicketNo || currentTicketId || 0),
    mergedTicketNo: Number(mergedTicketNo || 0),
  };
};

const TicketView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const state = (location.state as TicketViewState | null) ?? {};
  const selectedRow = state.selectedRow ?? state.savedTicketRecord ?? {};
  const isItemRepairContext = state.isFrom === "item-repair";
  const isReviewClosedContext = state.isFrom === "review-closed-tickets";
  const isFollowupPage = location.pathname
    .toLowerCase()
    .includes("/tickets/followup/");
  const isFollowupContext = state.isFrom === "followup";
  const showFilesTab = true;
  const pageHeading =
    state.isFrom === "ongoing"
      ? "Ongoing"
      : state.isFrom === "upcoming"
      ? "Upcoming"
      : state.isFrom === "unassigned"
      ? "Unassigned"
      : state.isFrom === "overdue"
      ? "Overdue"
      : state.isFrom === "created"
      ? "Created Tickets"
      : state.isFrom === "postponed"
      ? "Postponed"
      : state.isFrom === "review-closed-tickets"
      ? "Review Closed Tickets"
      : isFollowupPage
      ? "Follow Up"
      : "Ticket";

  const showFollowupAction = isFollowupContext || isFollowupPage;
  const ticketContentRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "history" | "files">(
    state.activeTab === "history" ||
      state.activeTab === "files" ||
      state.activeTab === "details"
      ? state.activeTab
      : "details",
  );
  const [repairPanelTab, setRepairPanelTab] = useState<
    "activity" | "callReports"
  >("activity");

  const [quickCallOpen, setQuickCallOpen] = useState(
    Boolean(state.openQuickCall),
  );
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetDepartmentFilter, setAssetDepartmentFilter] = useState("All");
  const [assetBrandFilter, setAssetBrandFilter] = useState("All");
  const [shareInfoOpen, setShareInfoOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferType, setTransferType] = useState<"agent" | "vendor">("agent");
  const [repairStatusOpen, setRepairStatusOpen] = useState(false);
  const [repairActivityEditOpen, setRepairActivityEditOpen] = useState(false);
  const [repairActivityEditing, setRepairActivityEditing] = useState<Record<string, any> | null>(null);
  const [repairActivityCost, setRepairActivityCost] = useState<number>(0);
  const [repairActivityComment, setRepairActivityComment] = useState("");
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [loadAttachmentHistory, setLoadAttachmentHistory] = useState(true);
  const [tick, setTick] = useState(() => Date.now());
  const [displayAssetName, setDisplayAssetName] = useState("");
  const [sessionMergeBanner, setSessionMergeBanner] = useState<TicketViewState["mergeBanner"] | null>(null);
  const [hideMergedBanner, setHideMergedBanner] = useState(false);
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [reviewCommentOpen, setReviewCommentOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [pendingReviewAction, setPendingReviewAction] = useState<"verify" | "reject" | null>(null);
  const [historyCallReportState, setHistoryCallReportState] = useState<Record<string, any> | null>(
    null,
  );
  const [statusOverride, setStatusOverride] = useState<{ id: number; label: string } | null>(null);
  const [previousWorkflowStatus, setPreviousWorkflowStatus] = useState<{ id: number; label: string } | null>(null);
  const [workflowStarted, setWorkflowStarted] = useState(false);
  const workflowHydratedTicketRef = useRef<number | null>(null);
  const previousWorkflowStatusRef = useRef<{ id: number; label: string } | null>(null);
  const queryClient = useQueryClient();
  const { mutateAsync: checkAmcExpiry } = useCheckAmcExpiry();
  const {
    acceptTicket,
    unShareTicket,
    unMergeTicket,
    updateTicketStatus,
  } = useTicketActions();
  const sessionPayload = useMemo(() => getRequestPayload(), []);
  const currentUserName = useMemo(() => getCurrentUserName(), []);

  useEffect(() => {
    if (!showFilesTab && activeTab === "files") {
      setActiveTab("details");
    }
  }, [activeTab, showFilesTab]);

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const ticketId = Number(
    params.id ??
      selectedRow?.nTicketId ??
      selectedRow?.TicketId ??
      selectedRow?.ticketId ??
      0,
  );

  useEffect(() => {
    ticketContentRef.current?.scrollTo({ top: 0 });
  }, [activeTab, ticketId]);

  const workflowStorageKey = ticketId
    ? `${WORKFLOW_STORAGE_PREFIX}:${ticketId}`
    : "";

  const persistWorkflowState = (
    nextState: {
      workflowStarted: boolean;
      statusOverride?: { id: number; label: string } | null;
      previousWorkflowStatus?: { id: number; label: string } | null;
    } | null,
  ) => {
    if (!workflowStorageKey) return;

    if (!nextState) {
      sessionStorage.removeItem(workflowStorageKey);
      return;
    }

    sessionStorage.setItem(
      workflowStorageKey,
      JSON.stringify({
        ticketId,
        ...nextState,
      }),
    );
  };

  const syncTicketStatusCache = (
    nextStatusId: number,
    nextStatusLabel: string,
  ) => {
    const updateStatusFields = (record: Record<string, any>) => ({
      ...record,
      nTicketStatus: Number(nextStatusId || 0),
      TicketStatus: nextStatusLabel,
      Status: nextStatusLabel,
      cTicketStatus: nextStatusLabel,
      cStatus: nextStatusLabel,
      nStatus: Number(nextStatusId || 0),
      StatusId: Number(nextStatusId || 0),
    });

    queryClient.setQueriesData(
      { queryKey: ["ticket-view"] },
      (oldData: any) => {
        if (!oldData || typeof oldData !== "object") return oldData;

        if (Array.isArray(oldData)) {
          return oldData.map((item) =>
            item?.nTicketId === ticketId || item?.TicketId === ticketId
              ? updateStatusFields(item)
              : item,
          );
        }

        if (oldData.data && typeof oldData.data === "object") {
          return {
            ...oldData,
            data: updateStatusFields(oldData.data),
          };
        }

        return updateStatusFields(oldData);
      },
    );

    queryClient.setQueriesData(
      { queryKey: ["ticket-list"] },
      (oldData: any) => {
        if (!oldData || typeof oldData !== "object") return oldData;

        const patchListItem = (item: any) => {
          const itemTicketId = Number(
            item?.nTicketId ?? item?.TicketId ?? item?.ticketId ?? 0,
          );
          return itemTicketId === ticketId ? updateStatusFields(item) : item;
        };

        if (Array.isArray(oldData)) {
          return oldData.map(patchListItem);
        }

        if (Array.isArray(oldData.data)) {
          return {
            ...oldData,
            data: oldData.data.map(patchListItem),
          };
        }

        if (Array.isArray(oldData.items)) {
          return {
            ...oldData,
            items: oldData.items.map(patchListItem),
          };
        }

        return oldData;
      },
    );
  };

  useEffect(() => {
    if (state.openQuickCall) {
      setActiveTab("history");
      return;
    }

    if (
      state.activeTab === "details" ||
      state.activeTab === "history" ||
      state.activeTab === "files"
    ) {
      setActiveTab(state.activeTab);
      return;
    }

    setActiveTab("details");
  }, [state.activeTab, state.openQuickCall, ticketId]);

  useEffect(() => {
    if (activeTab === "files") {
      setLoadAttachmentHistory(true);
    }
  }, [activeTab]);

  useEffect(() => {
    const raw = sessionStorage.getItem(MERGE_BANNER_STORAGE_KEY);

    if (!raw) {
      setSessionMergeBanner(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setSessionMergeBanner(parsed);
    } catch {
      setSessionMergeBanner(null);
    } finally {
      sessionStorage.removeItem(MERGE_BANNER_STORAGE_KEY);
    }
  }, [ticketId]);
  const supportSessionPayload = useMemo(() => getRequestPayload(), []);
  const repairSupportPayload = useMemo(
    () => ({
      ...supportSessionPayload,
      pageNumber: 1,
      pageSize: 1000,
    }),
    [supportSessionPayload],
  );

  const payload = useMemo(
    () => ({
      nCompanyId: Number(supportSessionPayload.nCompanyId ?? 0),
      cSchemaName: supportSessionPayload.cSchemaName ?? "",
      cDbName: supportSessionPayload.cDbName ?? "",
      nTicketId: ticketId,
    }),
    [supportSessionPayload, ticketId],
  );
  const statusLookupPayload = useMemo(
    () => ({
      ...supportSessionPayload,
      pageNumber: 1,
      pageSize: 1000,
    }),
    [supportSessionPayload],
  );

  const canLoadTicketView =
    !!ticketId &&
    !!supportSessionPayload.nCompanyId &&
    !!String(supportSessionPayload.cSchemaName ?? "").trim() &&
    !!String(supportSessionPayload.cDbName ?? "").trim();

  const { data: ticketViewData, isLoading: isTicketViewLoading } = useTicketView(
    payload,
    canLoadTicketView,
  );
  const { data: statusLookupData } = useGetStatuses(statusLookupPayload);

  const data = ticketViewData;
  const isLoading = isTicketViewLoading;

  const ticketData = useMemo(() => pickRecord(data), [data]);
  const resolvedRecord = useMemo(
    () => {
      const merged = {
        ...(selectedRow || {}),
        ...(ticketData || {}),
      };

      const attachmentKeys = [
        "attachments",
        "Attachments",
        "TicketAttachments",
        "ticketAttachments",
        "files",
        "Files",
        "FileList",
        "fileList",
        "ImageList",
        "imageList",
        "Photos",
        "photos",
        "cFileMappings",
      ];

      const hasValue = (value: any) => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "string") return value.trim().length > 0;
        return value !== undefined && value !== null && value !== "";
      };

      for (const key of attachmentKeys) {
        const selectedValue = (selectedRow as any)?.[key];
        const ticketValue = (ticketData as any)?.[key];

        if (!hasValue(merged[key]) && hasValue(selectedValue)) {
          merged[key] = selectedValue;
        } else if (!hasValue(merged[key]) && hasValue(ticketValue)) {
          merged[key] = ticketValue;
        }
      }

      return merged;
    },
    [selectedRow, ticketData],
  );
  const statusLookupOptions = useMemo(
    () =>
      extractList(statusLookupData)
        .map((item: any) => ({
          id: Number(
            getFieldValue(item, [
              "nTicketStatusId",
              "nTicketStatusid",
              "TicketStatusId",
              "nStatusId",
              "StatusId",
              "id",
              "value",
            ]) || 0,
          ),
          label: formatDisplayValue(
            getFieldValue(item, [
              "cTicketStatusName",
              "cTicketStatus",
              "TicketStatusName",
              "TicketStatus",
              "cStatusName",
              "cStatus",
              "name",
              "label",
            ]),
          ),
        }))
        .filter((item: any) => item.id > 0 && String(item.label ?? "").trim()),
    [statusLookupData],
  );
  const currentStatusId = Number(
    getFieldValue(resolvedRecord, ["nTicketStatus", "TicketStatus", "StatusId"]) || 0,
  );
  const customerId = Number(
    getFieldValue(resolvedRecord, [
      "nCustomerId",
      "CustomerId",
      "customerId",
    ]) || 0,
  );
  const groupId = Number(
    getFieldValue(resolvedRecord, ["nGroupId", "GroupId", "groupId"]) || 0,
  );
  const customerSupportPayload = useMemo(
    () => ({
      ...supportSessionPayload,
      nCustomerId: customerId,
      CustomerId: customerId,
      customerId,
    }),
    [customerId, supportSessionPayload],
  );
  const historyPayload = useMemo(
    () => ({
      nTicketId: ticketId,
      nCompanyId: supportSessionPayload.nCompanyId,
      cSchemaName: supportSessionPayload.cSchemaName,
      cDbName: supportSessionPayload.cDbName,
    }),
    [
      supportSessionPayload.cDbName,
      supportSessionPayload.cSchemaName,
      supportSessionPayload.nCompanyId,
      ticketId,
    ],
  );
  const assignAgentPayload = useMemo(
    () => ({
      ...supportSessionPayload,
      nGroupId: groupId,
      dDate: new Date().toISOString().slice(0, 10).replaceAll("-", "/"),
    }),
    [groupId, supportSessionPayload],
  );
  const repairItemPayload = useMemo(
    () => ({
      ...supportSessionPayload,
      nTicketId: ticketId,
      TicketId: ticketId,
      nCustomerId: customerId,
      CustomerId: customerId,
    }),
    [customerId, supportSessionPayload, ticketId],
  );
  const repairActionPayload = useMemo(() => {
    const repairRecord =
      (resolvedRecord as Record<string, any>)?.partsRepair?.[0] ?? resolvedRecord;
    const itemRepairId = Number(
      getFieldValue(repairRecord, [
        "nItemRepairId",
        "ItemRepairId",
        "nRepairId",
        "RepairId",
        "nPartRepairId",
        "PartRepairId",
        "nId",
        "Id",
      ]) || 0,
    );
    const callPartId = Number(
      getFieldValue(repairRecord, [
        "nCallPartId",
        "CallPartId",
        "callPartId",
        "nTicketCallPartId",
        "TicketCallPartId",
        "nCallPartsId",
      ]) ??
      getFieldValue(resolvedRecord, [
        "nCallPartId",
        "CallPartId",
        "callPartId",
        "nTicketCallPartId",
        "TicketCallPartId",
        "nCallPartsId",
      ]) ??
      0,
    );

    return {
      ...repairItemPayload,
      nItemRepairId: itemRepairId,
      ItemRepairId: itemRepairId,
      nRepairId: itemRepairId,
      RepairId: itemRepairId,
      nCallPartId: callPartId,
      CallPartId: callPartId,
    };
  }, [repairItemPayload, resolvedRecord]);

  const { data: customerAssetDepartmentsData } =
    useGetCustomerAssetDepartments(supportSessionPayload);
  const { data: customerBrandOptionsData } =
    useGetCustomerBrandOptions(supportSessionPayload);
  const { data: customerAssetsData } = useGetCustomerWiseAssets(
    customerSupportPayload,
    !!customerId,
  );
  const { data: alternativeContactsData } = useGetCustomerAlternativeContacts(
    customerSupportPayload,
    !!customerId,
  );
  const { data: assignAgentListData } = useGetAssignAgentList(
    assignAgentPayload,
    !!groupId,
  );
  const { data: repairAgentDropdownData } = useGetAgentDropdown(
    repairSupportPayload,
    isItemRepairContext,
  );
  const { data: repairVendorDropdownData } = useGetVendorDropdown(
    repairSupportPayload,
    isItemRepairContext,
  );
  const { data: repairPartsData } = useGetParts(
    repairSupportPayload,
    isItemRepairContext,
  );
  const { data: repairItemActivityData } = useRepairItemActivityList(
    repairItemPayload,
    !!ticketId && isItemRepairContext,
  );
  const { data: ticketHistoryData } = useTicketHistory(
    historyPayload,
    !!ticketId && !!supportSessionPayload.nCompanyId,
  );
  const { data: ticketHistoryAttachmentData, isFetching: isTicketAttachmentFetching } =
    useTicketHistoryAttachment(
      historyPayload,
      loadAttachmentHistory && !!ticketId && !!supportSessionPayload.nCompanyId,
    );

  const attachments = useMemo(() => {
    const directAttachments = pickAllAttachments(resolvedRecord);
    const historyAttachments = loadAttachmentHistory
      ? pickAllAttachments(ticketHistoryAttachmentData)
      : [];

    if (!historyAttachments.length) {
      return directAttachments;
    }

    const directIds = new Set(
      directAttachments.map((file: any) =>
        String(
          file?.nAttachementId ??
            file?.AttachmentId ??
            file?.id ??
            file?.uid ??
            file?.cUrl ??
            ""
        )
      )
    );

    const missingHistoryAttachments = historyAttachments.filter(
      (file: any) =>
        !directIds.has(
          String(
            file?.nAttachementId ??
              file?.AttachmentId ??
              file?.id ??
              file?.uid ??
              file?.cUrl ??
              ""
          )
        )
    );

    return [...directAttachments, ...missingHistoryAttachments];
  }, [loadAttachmentHistory, resolvedRecord, ticketHistoryAttachmentData]);
  const customerAssetList = useMemo(
    () => extractList(customerAssetsData),
    [customerAssetsData],
  );
  const customerAssetDepartmentOptions = useMemo(
    () => extractList(customerAssetDepartmentsData),
    [customerAssetDepartmentsData],
  );
  const customerBrandOptions = useMemo(
    () => extractList(customerBrandOptionsData),
    [customerBrandOptionsData],
  );
  const alternativeContacts = useMemo(
    () => extractList(alternativeContactsData),
    [alternativeContactsData],
  );
  const assignAgentOptions = useMemo(
    () =>
      extractList(assignAgentListData).map((agent: any) => {
        const id = Number(
          getFieldValue(agent, ["nAgentId", "agentId", "id", "value"]) || 0,
        );
        const name =
          formatDisplayValue(
            getFieldValue(agent, ["cAgentName", "agentName", "name", "cName"]),
          ) || `Agent ${id || ""}`;

        return {
          label: name,
          value: String(id),
        };
      }),
    [assignAgentListData],
  );
  const repairAgentDropdownOptions = useMemo(
    () => extractList(repairAgentDropdownData),
    [repairAgentDropdownData],
  );
  const repairVendorDropdownOptions = useMemo(
    () => extractList(repairVendorDropdownData),
    [repairVendorDropdownData],
  );
  const repairPartsOptions = useMemo(
    () => extractList(repairPartsData),
    [repairPartsData],
  );
  const historyItems = useMemo(
    () => extractList(ticketHistoryData),
    [ticketHistoryData],
  );
  const repairActivityItems = useMemo(() => {
    const nestedRepairItems = Array.isArray(
      (resolvedRecord as Record<string, any>)?.partsRepair?.[0]?.repairItemActivity,
    )
      ? (resolvedRecord as Record<string, any>)?.partsRepair?.[0]?.repairItemActivity
      : [];

    if (nestedRepairItems.length > 0) return nestedRepairItems;

    const apiRepairItems = extractList(repairItemActivityData);
    if (apiRepairItems.length > 0) return apiRepairItems;

    return historyItems;
  }, [historyItems, repairItemActivityData, resolvedRecord]);
  const openRepairActivityEdit = (item: Record<string, any>) => {
    setRepairActivityEditing(item);
    setRepairActivityCost(
      Number(
        getFieldValue(item, [
          "nVendorCharge",
          "VendorCharge",
          "nServiceCost",
          "ServiceCost",
          "nRepairCost",
        ]) || 0,
      ),
    );
    setRepairActivityComment(
      formatDisplayValue(
        getFieldValue(item, ["cComment", "Comment", "cRemarks", "Remarks", "cDescription"]),
      ),
    );
    setRepairActivityEditOpen(true);
  };
  const saveRepairActivityEdit = async () => {
    if (!repairActivityEditing) return;
    const formData = new FormData();
    const field = (name: string, keys: string[], fallback: string | number = 0) => {
      formData.append(name, String(getFieldValue(repairActivityEditing, keys) || fallback));
    };
    field("nRepairActivityId", ["nRepairActivityId", "RepairActivityId", "nRepairId"]);
    field("nCallPartId", ["nCallPartId", "CallPartId", "nCallReportPartId"]);
    formData.append("nCompanyId", String(sessionPayload.nCompanyId || 0));
    field("nRepairStatus", ["nRepairStatus", "RepairStatusId", "nStatus"]);
    field("nAgentId", ["nAgentId", "AgentId", "nAssignedAgentId"]);
    field("nVendorId", ["nVendorId", "VendorId"]);
    field("nPartId", ["nPartId", "PartId"]);
    formData.append("nVendorCharge", String(repairActivityCost || 0));
    formData.append("cComment", repairActivityComment.trim());
    formData.append("cDeleteAttachmentIds", "");
    formData.append(
      "nModifiedBy",
      String(sessionPayload.id ?? sessionPayload.nAgentId ?? 0),
    );
    const expectedDate = getFieldValue(repairActivityEditing, [
      "dExpectedCompletionDate",
      "ExpectedCompletionDate",
    ]);
    if (expectedDate) formData.append("dExpectedCompletionDate", String(expectedDate));
    formData.append("cSchemaName", String(sessionPayload.cSchemaName ?? ""));
    formData.append("cDbName", String(sessionPayload.cDbName ?? ""));

    await itemRepairApis.itemRepairActionUpdate(formData);
    message.success("Repair activity updated successfully.");
    setRepairActivityEditOpen(false);
    setRepairActivityEditing(null);
    await queryClient.invalidateQueries({ queryKey: ["repair-item-activity-list"] });
    await queryClient.invalidateQueries({ queryKey: ["ticket-view"] });
  };
  const deleteRepairActivity = (item: Record<string, any>) => {
    const repairActivityId =
      Number(getFieldValue(item, ["nRepairActivityId", "RepairActivityId", "nRepairId"])) || 0;
    const callPartId =
      Number(getFieldValue(item, ["nCallPartId", "CallPartId", "nCallReportPartId"])) || 0;
    if (!repairActivityId || !callPartId) {
      message.error("Repair activity details are missing.");
      return;
    }
    Modal.confirm({
      title: "Are you sure?",
      content: "Do you want to delete these records? This process cannot be undone.",
      okText: "Delete",
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        await itemRepairApis.itemRepairActionDelete({
          nRepairActivityId: repairActivityId,
          nCallPartId: callPartId,
          nCompanyId: sessionPayload.nCompanyId,
          nDeletedBy: sessionPayload.id ?? sessionPayload.nAgentId ?? 0,
          cSchemaName: sessionPayload.cSchemaName,
          cDbName: sessionPayload.cDbName,
        });
        message.success("Repair activity deleted successfully.");
        await queryClient.invalidateQueries({ queryKey: ["repair-item-activity-list"] });
        await queryClient.invalidateQueries({ queryKey: ["ticket-view"] });
      },
    });
  };
  const latestShareHistoryRecordId = useMemo(() => {
    const reversedItems = [...historyItems].reverse();

    const sharedHistoryItem = reversedItems.find((item: Record<string, any>) => {
      const title = normalizeText(
        getFieldValue(item, [
          "cViewSummary",
          "ViewSummary",
          "Summary",
          "Title",
          "Action",
          "Activity",
        ]),
      );
      const remarks = normalizeText(
        getFieldValue(item, [
          "Remarks",
          "Remark",
          "Comment",
          "Description",
          "cDescription",
          "CallSummary",
          "cCallSummary",
        ]),
      );

      return title.includes("shared") || remarks.includes("shared");
    });

    return Number(
      getFieldValue(sharedHistoryItem, [
        "nSharedId",
        "SharedId",
        "nShareId",
        "ShareId",
        "nShareDataId",
        "ShareDataId",
        "Id",
        "id",
      ]) || 0,
    );
  }, [historyItems]);
  const estimateHistoryId = Number(
    getFieldValue(historyItems[0], [
      "nHistoryId",
      "HistoryId",
      "Id",
      "id",
    ]) || 0,
  );
  const assignedAgentDetails = useMemo(
    () => state.assignedAgentDetails ?? pickAssignedAgents(resolvedRecord),
    [resolvedRecord, state.assignedAgentDetails],
  );
  const assignedAgentsText = useMemo(
    () =>
      assignedAgentDetails
        .map((agent: any) =>
          formatDisplayValue(
            getFieldValue(agent, ["cAgentName", "agentName", "name"]),
          ),
        )
        .filter(Boolean)
        .join(", "),
    [assignedAgentDetails],
  );

  const ticketNo = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "nTicketNo",
    ]),
  );
  const customerName = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "cCustomerName",
    ]),
  );
  const summary = formatDisplayValue(
    getFieldValue(resolvedRecord, [
    
      "cTicketSummary",
    ]),
  );
  const description = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "cDescription",
    ]),
  );
  const createdDateValue = getFieldValue(resolvedRecord, [
   
    "dCreatedDate",
  ]);
  const createdDate = formatDisplayValue(createdDateValue);
  const ticketAge = formatTicketAge(createdDateValue || createdDate, tick);
  const priority = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      
      "cPriority",
    ]),
  );
  const period = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "cPeriod",
      "Period",
    ]),
  );
  const status = statusOverride?.label || normalizeTicketStatus(resolvedRecord);
  const scheduledOn = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "cScheduleDate",
      "ScheduleDate",
      "dScheduleDate",
    ]),
  );
  const followupDate = formatFollowupDateTime(
    getFieldValue(resolvedRecord, [
     
      "dFollowupDate",
     
     
    ]),
  );
  const source = formatDisplayValue(
    getFieldValue(resolvedRecord, [
     
      "cSourceName",
      
    ]),
  );
  const group = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "GroupName",
      "cGroupName",
      "TicketGroup",
      "cTicketGroup",
    ]),
  );
  const serviceType = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "ServiceTypeName",
      "cServiceTypeName",
      "ServiceType",
      "cServiceType",
    ]),
  );
  const address = formatDisplayValue(
    getFieldValue(resolvedRecord, ["Address", "cCustomerAddress"]),
  );
  const assetName = formatDisplayValue(
    getFieldValue(resolvedRecord, ["AssetName", "cAssetName", "Asset"]),
  );
  useEffect(() => {
    setDisplayAssetName(assetName);
  }, [assetName, ticketId]);
  const contactNumber = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "cContactNumber",
      "ContactNumber",
      "PhoneNumber",
    ]),
  );
  const email = formatDisplayValue(
    getFieldValue(resolvedRecord, ["cEmail", "Email"]),
  );
  const createdByTeam = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "TeamName",
      "cTeamName",
      "CreatedByTeam",
      "cCreatedByTeam",
      "GroupName",
      "cGroupName",
      "cCreatedBy",
      "CreatedBy",
    ]),
  );
  const isSharedTicket = (() => {
    const value = getFieldValue(resolvedRecord, ["bShared", "isShared"]);

    return value === true || value === "true" || value === 1 || value === "1";
  })();
  const sharedAgentName = formatDisplayValue(
    findDeepFieldValue(resolvedRecord, [
      "ShareTo",
      "cShareTo",
      "SharedTo",
      "cSharedTo",
      "SharedAgentName",
      "cSharedAgentName",
      "ShareAgentName",
      "cShareAgentName",
    ]),
  );
  const sharedAgentId = Number(
    findDeepFieldValue(resolvedRecord, [
      "nSharedId",
      "SharedId",
      "ShareId",
      "nShareId",
      "nShareDataId",
      "ShareDataId",
      "nSharedToAgentId",
      "SharedToAgentId",
      "sharedToAgentId",
      "nSharedWithAgentId",
      "SharedWithAgentId",
      "sharedWithAgentId",
      "nShareToAgentId",
      "ShareToAgentId",
      "nShareWithAgentId",
      "ShareWithAgentId",
    ]) || 0,
  );
  const sharedRecordId = sharedAgentId;
  const currentAgentId = Number(sessionPayload.nAgentId ?? sessionPayload.id ?? 0);
  const resolvedSharedRecordId = sharedRecordId || latestShareHistoryRecordId;
  const handleUnShare = () => {
    if (!isSharedTicket) return;

    if (!resolvedSharedRecordId || !currentAgentId) {
      message.error("Unable to resolve unshare identifiers");
      return;
    }

    const payload: Record<string, any> = {
      nSharedId: resolvedSharedRecordId,
      nAgentId: currentAgentId,
      nTicketId: ticketId,
      nCompanyId: Number(sessionPayload.nCompanyId ?? 0),
      cSchemaName: sessionPayload.cSchemaName ?? "",
      cDbName: sessionPayload.cDbName ?? "",
    };

    unShareTicket.mutate(payload, {
      onSuccess: () => {
        message.success("Ticket Unshared Successfully");
      },
      onError: (error: any) => {
        message.error(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to unshare ticket",
        );
      },
    });
  };
  const detailRows = useMemo(
    () => {
      const rows = isFollowupPage
        ? buildFollowupDetailRows(resolvedRecord)
        : scheduledOn
        ? [{ label: "Scheduled on", value: scheduledOn, icon: calendarIcon }]
        : [];

      const repairRows =
        state.isFrom === "item-repair"
          ? [
              {
                label: "Repair Vendors",
                value: String(repairVendorDropdownOptions.length || 0),
              },
              {
                label: "Repair Agents",
                value: String(repairAgentDropdownOptions.length || 0),
              },
              {
                label: "Repair Parts",
                value: String(repairPartsOptions.length || 0),
              },
            ]
          : [];

      return [...rows, ...repairRows].filter((item) => String(item.value ?? "").trim() !== "");
    },
    [
      isFollowupPage,
      repairAgentDropdownOptions.length,
      repairPartsOptions.length,
      repairVendorDropdownOptions.length,
      resolvedRecord,
      scheduledOn,
      state.isFrom,
    ],
  );
  const selectedAssetName = displayAssetName || assetName || "+Add Asset";
  const assetModalDepartments = useMemo(() => {
    const mapped = customerAssetDepartmentOptions.map((item: any) => ({
      label:
        formatDisplayValue(
          getFieldValue(item, ["cDepartmentName", "DepartmentName", "name"]),
        ) || "All",
      value:
        getFieldValue(item, [
          "nDepartmentId",
          "DepartmentId",
          "id",
          "value",
        ]) || formatDisplayValue(item) || "All",
    }));

    return mapped.filter(
      (item: any, index: number, arr: any[]) =>
        item.label && arr.findIndex((x) => x.label === item.label) === index,
    );
  }, [customerAssetDepartmentOptions]);
  const assetModalBrands = useMemo(() => {
    const mapped = customerBrandOptions.map((item: any) => ({
      label:
        formatDisplayValue(
          getFieldValue(item, ["cBrandName", "BrandName", "name"]),
        ) || "All",
      value:
        getFieldValue(item, ["nBrandId", "BrandId", "id", "value"]) ||
        formatDisplayValue(item) ||
        "All",
    }));

    return mapped.filter(
      (item: any, index: number, arr: any[]) =>
        item.label && arr.findIndex((x) => x.label === item.label) === index,
    );
  }, [customerBrandOptions]);
  const filteredAssetRows = useMemo(() => {
    const searchTerm = String(assetSearch ?? "").trim().toLowerCase();

    return customerAssetList.filter((item: any) => {
      const name = formatDisplayValue(
        getFieldValue(item, [
          "cAssetName",
          "cAssetMasterName",
          "AssetName",
          "name",
        ]),
      );
      const department = formatDisplayValue(
        getFieldValue(item, [
          "cDepartmentName",
          "DepartmentName",
          "department",
        ]),
      );
      const brand = formatDisplayValue(
        getFieldValue(item, ["cBrandName", "BrandName", "brand"]),
      );
      const departmentId = String(
        getFieldValue(item, [
          "nDepartmentId",
          "DepartmentId",
          "departmentId",
          "department",
        ]) ?? department,
      );
      const brandId = String(
        getFieldValue(item, ["nBrandId", "BrandId", "brandId", "brand"]) ?? brand,
      );

      const haystack = `${name} ${department} ${brand}`.toLowerCase();
      const matchesDepartment =
        assetDepartmentFilter === "All" ||
        normalizeText(assetDepartmentFilter) === normalizeText(departmentId) ||
        normalizeText(assetDepartmentFilter) === normalizeText(department);
      const matchesBrand =
        assetBrandFilter === "All" ||
        normalizeText(assetBrandFilter) === normalizeText(brandId) ||
        normalizeText(assetBrandFilter) === normalizeText(brand);

      return (
        (!searchTerm || haystack.includes(searchTerm)) &&
        matchesDepartment &&
        matchesBrand
      );
    });
  }, [assetBrandFilter, assetDepartmentFilter, assetSearch, customerAssetList]);

  const latestCallReport = useMemo(() => {
    const candidates = [...historyItems].reverse();
    const item = candidates.find((entry: any) => {
      const summary = formatDisplayValue(
        getFieldValue(entry, [
          "cCallSummary",
          "CallSummary",
          "cViewSummary",
          "ViewSummary",
          "Remarks",
          "Remark",
          "Comment",
          "Description",
        ]),
      );
      return Boolean(summary);
    });

    if (!item) return null;

    const title = formatDisplayValue(
      getFieldValue(item, [
        "cViewSummary",
        "ViewSummary",
        "CallSummary",
        "cCallSummary",
        "Activity",
        "Action",
        "Title",
      ]),
    );
    const remarks = formatDisplayValue(
      getFieldValue(item, [
        "Remarks",
        "Remark",
        "Comment",
        "Description",
        "cDescription",
        "CallSummary",
        "cCallSummary",
      ]),
    );
    const dateText = formatDisplayValue(
      getFieldValue(item, [
        "dCreatedDate",
        "CreatedDate",
        "CreatedOn",
        "dSortDate",
        "SortDate",
      ]),
    );
    const createdBy = formatDisplayValue(
      getFieldValue(item, [
        "CreatedByName",
        "cCreatedByName",
        "AgentName",
        "cAgentName",
        "CreatedBy",
        "cCreatedBy",
      ]),
    );

    return { title, remarks, dateText, createdBy };
  }, [historyItems]);

  const latestCallReportFollowupId = useMemo(() => {
    const candidates = [...historyItems].reverse();
    const item = candidates.find((entry: any) => {
      const summary = formatDisplayValue(
        getFieldValue(entry, [
          "cCallSummary",
          "CallSummary",
          "cViewSummary",
          "ViewSummary",
          "Remarks",
          "Remark",
          "Comment",
          "Description",
        ]),
      );
      return Boolean(summary);
    });

    return Number(
      findDeepFieldValue(item ?? {}, [
        "nFollowupId",
        "nfollowupid",
        "FollowupId",
        "nWorksheetId",
        "nworksheetid",
        "WorksheetId",
        "Id",
        "id",
      ]) || 0,
    );
  }, [historyItems]);

  const previousCallReportFromTicket = useMemo(() => {
    const previousReports = extractList(
      getFieldValue(resolvedRecord, ["previousCallreport", "previousCallReport"]),
    );
    const item = previousReports[0];

    if (!item) return null;

    const title = formatDisplayValue(
      getFieldValue(item, [
        "cViewSummary",
        "ViewSummary",
        "cCallSummary",
        "CallSummary",
        "Summary",
        "Title",
      ]),
    );
    const remarks = formatDisplayValue(
      getFieldValue(item, [
        "cCallSummary",
        "CallSummary",
        "Remarks",
        "Remark",
        "Comment",
        "Description",
        "cComment",
      ]),
    );
    const dateText = formatDisplayValue(
      getFieldValue(item, [
        "dCreatedDate",
        "CreatedDate",
        "CreatedOn",
        "dSortDate",
        "SortDate",
      ]),
    );
    const createdBy = formatDisplayValue(
      getFieldValue(item, [
     "cAssignedAgent",
      ]),
    );

    return { title, remarks, dateText, createdBy };
  }, [resolvedRecord]);

  const isUnassignedTicket = state.isFrom === "unassigned";
  const isWorkflowStatus =
    normalizeText(status).replace(/\s+/g, "") === "inprogress" ||
    normalizeText(status).replace(/\s+/g, "") === "pending";
  const isWorkflowTicket =
    state.isFrom === "ongoing" ||
    state.isFrom === "upcoming" ||
    state.isFrom === "overdue" ||
    state.isFrom === "created" ||
    state.isFrom === "postponed" ||
    workflowStarted ||
    isWorkflowStatus;
  const showWorkflowStartPanel =
    state.isFrom === "ongoing" ||
    state.isFrom === "upcoming" ||
    state.isFrom === "overdue" ||
    state.isFrom === "postponed" ||
    workflowStarted ||
    isWorkflowStatus;
  const pendingStatusOption = useMemo(
    () =>
      statusLookupOptions.find(
        (item: any) =>
          normalizeText(item.label).replace(/\s+/g, "") === "pending",
      ) ?? null,
    [statusLookupOptions],
  );
  const inProgressStatusOption = useMemo(
    () =>
      statusLookupOptions.find(
        (item: any) =>
          normalizeText(item.label).replace(/\s+/g, "") === "inprogress",
      ) ?? null,
    [statusLookupOptions],
  );
  const repairWaitingStatusOption = useMemo(
    () =>
      statusLookupOptions.find((item: any) =>
        normalizeText(item.label).replace(/\s+/g, "").includes("waitingforcustomerapproval"),
      ) ?? {
        id: Number(
          getFieldValue(resolvedRecord, [
            "nNextStatusId",
            "NextStatusId",
            "nItemRepairStatusId",
            "ItemRepairStatusId",
          ]) || 0,
        ),
        label: "Waiting For Customer Approval",
      },
    [resolvedRecord, statusLookupOptions],
  );
  const reviewVerifyStatusOption = useMemo(
    () =>
      statusLookupOptions.find((item: any) => {
        const label = normalizeText(item.label).replace(/\s+/g, "");
        return (
          label.includes("verify") ||
          label.includes("verified") ||
          label.includes("approved") ||
          label.includes("complete") ||
          label.includes("closed")
        );
      }) ?? null,
    [statusLookupOptions],
  );
  const reviewRejectStatusOption = useMemo(
    () =>
      statusLookupOptions.find((item: any) =>
        normalizeText(item.label).replace(/\s+/g, "").includes("reject"),
      ) ?? null,
    [statusLookupOptions],
  );
  const isWorkflowStarted = workflowStarted;
  useEffect(() => {
    if (!ticketId) return;
    if (workflowHydratedTicketRef.current === ticketId) return;

    workflowHydratedTicketRef.current = ticketId;

    const hydrateFromStorage = () => {
      if (!workflowStorageKey) return null;

      try {
        const raw = sessionStorage.getItem(workflowStorageKey);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    const savedState = hydrateFromStorage();

    if (savedState?.ticketId === ticketId) {
      setWorkflowStarted(Boolean(savedState.workflowStarted));
      setStatusOverride(
        savedState.statusOverride ?? null,
      );
      setPreviousWorkflowStatus(
        savedState.previousWorkflowStatus ?? null,
      );
      previousWorkflowStatusRef.current =
        savedState.previousWorkflowStatus ?? null;
      return;
    }

    const initialStatusLabel = normalizeTicketStatus(resolvedRecord) || status;
    const initialStatusText = normalizeText(initialStatusLabel).replace(/\s+/g, "");

    if (initialStatusText === "inprogress") {
      setWorkflowStarted(true);
      setStatusOverride(
        currentStatusId > 0 && initialStatusLabel
          ? {
              id: currentStatusId,
              label: initialStatusLabel,
            }
          : inProgressStatusOption
            ? {
                id: inProgressStatusOption.id,
                label: inProgressStatusOption.label,
              }
            : null,
      );
      setPreviousWorkflowStatus(
        pendingStatusOption
          ? {
              id: pendingStatusOption.id,
              label: pendingStatusOption.label,
            }
          : null,
      );
      previousWorkflowStatusRef.current =
        pendingStatusOption
          ? {
              id: pendingStatusOption.id,
              label: pendingStatusOption.label,
            }
          : null;
    }
  }, [
    currentStatusId,
    inProgressStatusOption,
    pendingStatusOption,
    resolvedRecord,
    status,
    ticketId,
    workflowStorageKey,
  ]);

  const detailPreviousCallReport =
    previousCallReportFromTicket || latestCallReport || null;
  const mergedBanner = useMemo(
    () =>
      hideMergedBanner
        ? null
        : state.mergeBanner ??
          sessionMergeBanner ??
          getMergedTicketBanner(historyItems, ticketId, ticketNo),
    [hideMergedBanner, historyItems, sessionMergeBanner, state.mergeBanner, ticketId, ticketNo],
  );

  const billTicketSummary = useMemo(() => {
    const ticketSummary = getFieldValue(resolvedRecord ?? {}, [
      "TicketSummary",
      "cTicketSummary",
      "cCallSummary",
      "CallSummary",
      "Summary",
    ]);

    return {
      companyName:
        String(
          (sessionPayload as any).cCompanyName ??
            (sessionPayload as any).companyName ??
            (sessionPayload as any).cCustomerName ??
            "Company Name",
        ).trim() || "Company Name",
      userName: currentUserName || "User Name",
      ticketNo:
        getFieldValue(resolvedRecord ?? {}, [
          "TicketNo",
          "nTicketNo",
          "ticketNo",
        ]) || ticketNo || ticketId,
      customerName:
        getFieldValue(resolvedRecord ?? {}, [
          "CustomerName",
          "cCustomerName",
        ]) || customerName || "-",
      customerId:
        getFieldValue(resolvedRecord ?? {}, [
          "CustomerId",
          "nCustomerId",
          "customerId",
        ]) || "-",
      contactPerson:
        getFieldValue(resolvedRecord ?? {}, [
          "ContactPerson",
          "cContactPerson",
        ]) || "-",
      contactNumber:
        getFieldValue(resolvedRecord ?? {}, [
          "ContactNumber",
          "cContactNumber",
        ]) || "-",
      email:
        getFieldValue(resolvedRecord ?? {}, [
          "Email",
          "cEmail",
        ]) || "-",
      summary: ticketSummary || "-",
    };
  }, [currentUserName, customerName, resolvedRecord, sessionPayload, ticketId, ticketNo]);

  const handleSplitMerge = () => {
    if (!mergedBanner) return;

    if (!mergedBanner.primaryTicketId || !mergedBanner.mergedTicketId) {
      message.error("Unable to resolve merge details");
      return;
    }

    const payload = {
      cDbName: supportSessionPayload.cDbName,
      cSchemaName: supportSessionPayload.cSchemaName,
      nCompanyId: supportSessionPayload.nCompanyId,
      nMergedBy: Number(
        supportSessionPayload.nAgentId ?? supportSessionPayload.id ?? 0,
      ),
      nPrimaryTicketId: mergedBanner.primaryTicketId,
      nMergedTicketId: mergedBanner.mergedTicketId,
      nPrimaryTicketNo: mergedBanner.primaryTicketNo,
      nMergedTicketNo: mergedBanner.mergedTicketNo,
    };

    unMergeTicket.mutate(payload as any, {
      onSuccess: () => {
        message.success("Ticket split successfully");
        setHideMergedBanner(true);
        setSessionMergeBanner(null);
        sessionStorage.removeItem(MERGE_BANNER_STORAGE_KEY);
        queryClient.invalidateQueries({ queryKey: ["ticket-view"] });
        queryClient.invalidateQueries({ queryKey: ["ticket-history"] });
      },
      onError: (error: any) => {
        message.error(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to split ticket",
        );
      },
    });
  };

  const handleStartWorkflow = () => {
    if (!inProgressStatusOption) {
      message.error("In Progress status is not available");
      return;
    }

    const previousStatus =
      statusOverride ??
      (currentStatusId > 0 && status
        ? {
            id: currentStatusId,
            label: status,
          }
        : pendingStatusOption);

    updateTicketStatus.mutate(
      buildTicketStatusUpdatePayload(
        ticketId,
        resolvedRecord,
        supportSessionPayload,
        inProgressStatusOption.id,
        inProgressStatusOption.label,
      ) as any,
      {
        onSuccess: () => {
          setPreviousWorkflowStatus(previousStatus ?? null);
          previousWorkflowStatusRef.current = previousStatus ?? null;
          setStatusOverride({
            id: inProgressStatusOption.id,
            label: inProgressStatusOption.label,
          });
          syncTicketStatusCache(
            inProgressStatusOption.id,
            inProgressStatusOption.label,
          );
          setWorkflowStarted(true);
          persistWorkflowState({
            workflowStarted: true,
            statusOverride: {
              id: inProgressStatusOption.id,
              label: inProgressStatusOption.label,
            },
            previousWorkflowStatus: previousStatus ?? null,
          });
          setStartConfirmOpen(false);
          message.success("Ticket moved to In Progress");
          void (async () => {
            try {
              const amcPayload = buildAmcExpiryPayload(
                resolvedRecord ?? {},
                supportSessionPayload,
              );
              const assetId = Number(amcPayload.nAssetId ?? amcPayload.assetId ?? 0);

              if (assetId > 0) {
                const eligibility = await checkAmcExpiry(amcPayload);

                if (!isUnderAmcOrWarranty(eligibility)) {
                  await showAmcWarning();
                }
              }
            } catch {
              console.error("AMC check failed while opening call report");
            } finally {
              setQuickCallOpen(true);
            }
          })();
          queryClient.invalidateQueries({ queryKey: ["ticket-view"] });
          queryClient.invalidateQueries({ queryKey: ["ticket-list"] });
        },
        onError: (error: any) => {
          message.error(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to update ticket status",
          );
        },
      },
    );
  };

  const handleReviewClosedAction = (
    nextStatusOption: { id: number; label: string } | null,
    successMessage: string,
    comment: string,
    onSuccess?: () => void,
  ) => {
    if (!nextStatusOption) {
      message.error("Required status is not available");
      return;
    }

    updateTicketStatus.mutate(
      buildTicketStatusUpdatePayload(
        ticketId,
        resolvedRecord,
        supportSessionPayload,
        nextStatusOption.id,
        nextStatusOption.label,
        comment,
      ) as any,
      {
        onSuccess: () => {
          syncTicketStatusCache(nextStatusOption.id, nextStatusOption.label);
          queryClient.invalidateQueries({ queryKey: ["ticket-view"] });
          queryClient.invalidateQueries({ queryKey: ["ticket-list"] });
          message.success(successMessage);
          onSuccess?.();
          navigate("/more/review-closed-tickets");
        },
        onError: (error: any) => {
          message.error(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to update ticket status",
          );
        },
      },
    );
  };

  const openReviewCommentModal = (action: "verify" | "reject") => {
    setPendingReviewAction(action);
    setReviewComment("");
    setReviewCommentOpen(true);
  };

  const closeReviewCommentModal = () => {
    setReviewCommentOpen(false);
    setPendingReviewAction(null);
    setReviewComment("");
  };

  const submitReviewComment = () => {
    const action = pendingReviewAction;

    if (!action) {
      closeReviewCommentModal();
      return;
    }

    const nextStatusOption =
      action === "verify" ? reviewVerifyStatusOption : reviewRejectStatusOption;
    const successMessage =
      action === "verify"
        ? "Ticket verified successfully"
        : "Ticket rejected successfully";

    handleReviewClosedAction(
      nextStatusOption,
      successMessage,
      reviewComment.trim(),
      closeReviewCommentModal,
    );
  };

  const showAmcWarning = () =>
    new Promise<void>((resolve) => {
      Modal.warning({
        title: "Warning",
        centered: true,
        content: "Asset is not under AMC or Warranty",
        okText: "Ok",
        onOk: () => resolve(),
      });
    });

  // const showGenerateBillConfirm = () =>
  //   new Promise<boolean>((resolve) => {
  //     Modal.confirm({
  //       title: "Confirmation",
  //       centered: true,
  //       content: "Do You Want To Generate Bill ?",
  //       okText: "Yes",
  //       cancelText: "No",
  //       onOk: () => resolve(true),
  //       onCancel: () => resolve(false),
  //     });
  //   });

  const loadRevertBillInfo = async (followupIdOverride?: number) => {
    const customerId = Number(
      getFirstTicketValue(resolvedRecord ?? {}, [
        "CustomerId",
        "nCustomerId",
        "customerId",
      ]) ?? 0,
    ) || 0;
    const assetId = Number(
      getFirstTicketValue(resolvedRecord ?? {}, [
        "AssetId",
        "nAssetId",
        "assetId",
      ]) ?? 0,
    ) || 0;

    const payload = {
      ...supportSessionPayload,
      nCompanyId: Number(supportSessionPayload.nCompanyId ?? 0) || 0,
      nTicketId: ticketId,
      nCustomerId: customerId,
      nAssetId: assetId,
      cSchemaName: supportSessionPayload.cSchemaName ?? "",
      cDbName:
        supportSessionPayload.cDbName ??
        (supportSessionPayload as any).dbName ??
        "",
    };

    const [lastBillResponse, partListResponse] = await Promise.all([
      billingApis.lastBillNumber(payload),
      billingApis.partListForBilling(payload),
    ]);

    const lastBillPayload = lastBillResponse?.data ?? lastBillResponse ?? {};
    const lastBillNumber =
      lastBillPayload?.lastBillNumber ??
      lastBillPayload?.LastBillNumber ??
      lastBillPayload?.cBillNo ??
      lastBillPayload?.billNo ??
      lastBillPayload?.BillNo ??
      "";

    const partList = normalizeBillParts(partListResponse);
    const summary = getFieldValue(resolvedRecord ?? {}, [
      "TicketSummary",
      "cTicketSummary",
      "cCallSummary",
      "CallSummary",
      "Summary",
    ]);

    return {
      companyName:
        String(
          (sessionPayload as any).cCompanyName ??
            (sessionPayload as any).companyName ??
            (sessionPayload as any).cCustomerName ??
            "Company Name",
        ).trim() || "Company Name",
      billNo: String(lastBillNumber ?? "").trim(),
      customerName:
        getFieldValue(resolvedRecord ?? {}, ["CustomerName", "cCustomerName"]) ||
        customerName ||
        "-",
      customerId: customerId || 0,
      ticketNo:
        Number(
          getFieldValue(resolvedRecord ?? {}, ["TicketNo", "nTicketNo", "ticketNo"]) ||
            ticketNo ||
            ticketId,
        ) || ticketId,
      contactPerson:
        getFieldValue(resolvedRecord ?? {}, [
          "ContactPerson",
          "cContactPerson",
        ]) || "-",
      contactNumber:
        getFieldValue(resolvedRecord ?? {}, [
          "ContactNumber",
          "cContactNumber",
        ]) || "-",
      email:
        getFieldValue(resolvedRecord ?? {}, ["Email", "cEmail"]) || "-",
      summary: summary || "-",
      partList,
      sessionPayload: {
        ...supportSessionPayload,
        nCompanyId: Number(supportSessionPayload.nCompanyId ?? 0) || 0,
        nFollowupId: followupIdOverride || latestCallReportFollowupId,
        nWorksheetId: followupIdOverride || latestCallReportFollowupId,
        WorksheetId: followupIdOverride || latestCallReportFollowupId,
        nTicketId: ticketId,
        nCustomerId: customerId,
        nAssetId: assetId,
        cSchemaName: supportSessionPayload.cSchemaName ?? "",
        cDbName:
          supportSessionPayload.cDbName ??
          (supportSessionPayload as any).dbName ??
          "",
      },
      nFollowupId: followupIdOverride || latestCallReportFollowupId,
      nWorksheetId: followupIdOverride || latestCallReportFollowupId,
      WorksheetId: followupIdOverride || latestCallReportFollowupId,
    };
  };

  const handleRevertBillFlow = async (
    followupIdOverride?: number,
    options?: { skipConfirm?: boolean },
  ) => {
    if (!options?.skipConfirm) {
      const shouldGenerateBill = await showGenerateBillConfirm();
      if (!shouldGenerateBill) return;
    }

    try {
      const billPageState = await loadRevertBillInfo(followupIdOverride);
      sessionStorage.setItem(BILL_PREVIEW_STORAGE_KEY, JSON.stringify(billPageState));
      navigate("/billsandreceipts/bills/add", {
        state: billPageState,
      });
    } catch (error) {
      console.error("Failed to load revert bill info", error);
      message.error("Unable to load bill details");
    }
  };

  const promptRevertAmcWarning = async () => {
    try {
      const amcPayload = buildAmcExpiryPayload(
        resolvedRecord ?? {},
        supportSessionPayload,
      );

      const eligibility = await checkAmcExpiry(amcPayload);

      if (!isUnderAmcOrWarranty(eligibility)) {
        await showAmcWarning();
      }
    } catch {
      console.error("AMC check failed while preparing revert");
    }
  };

  const handleRevertWorkflowStatus = () => {
    const revertStatus =
      previousWorkflowStatusRef.current ??
      previousWorkflowStatus;

    if (!revertStatus) {
      message.error("Previous status is not available");
      return;
    }

    setStatusOverride({
      id: revertStatus.id,
      label: revertStatus.label,
    });
    syncTicketStatusCache(revertStatus.id, revertStatus.label);
    setWorkflowStarted(false);
    persistWorkflowState(null);

    void (async () => {
      await promptRevertAmcWarning();

      setPreviousWorkflowStatus(null);
      previousWorkflowStatusRef.current = null;
      message.success("Ticket reverted successfully");
      syncTicketStatusCache(revertStatus.id, revertStatus.label);
      queryClient.invalidateQueries({ queryKey: ["ticket-view"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-list"] });
      void handleRevertBillFlow();
    })();
  };

  const handleCallReportSaved = ({
    statusId,
    statusLabel,
  }: {
    statusId: number;
    statusLabel: string;
    ticketId: number;
    nFollowupId?: number;
  }) => {
    setStatusOverride({
      id: Number(statusId || 0),
      label: statusLabel || status || "",
    });
    syncTicketStatusCache(Number(statusId || 0), statusLabel || status || "");
    setWorkflowStarted(true);
    if (!previousWorkflowStatusRef.current && previousWorkflowStatus) {
      previousWorkflowStatusRef.current = previousWorkflowStatus;
    }
    persistWorkflowState({
      workflowStarted: true,
      statusOverride: {
        id: Number(statusId || 0),
        label: statusLabel || status || "",
      },
      previousWorkflowStatus:
        previousWorkflowStatusRef.current ?? previousWorkflowStatus ?? null,
    });
    setStartConfirmOpen(false);
    queryClient.invalidateQueries({ queryKey: ["ticket-view"] });
    queryClient.invalidateQueries({ queryKey: ["ticket-list"] });
  };

  if (isItemRepairContext) {
    const repairCallReportItems = repairActivityItems.filter((item) =>
      isCallReportHistoryItem(item),
    );
    const visibleRepairItems =
      repairPanelTab === "callReports"
        ? repairCallReportItems
        : repairActivityItems;
    const repairCommentKeys = [
          "Comment",
          "Remarks",
          "Remark",
          "Description",
          "cComment",
          "cRemarks",
          "cRemark",
          "cDescription",
        ];
    const repairComment =
      formatDisplayValue(getFieldValue(resolvedRecord, repairCommentKeys)) ||
      repairActivityItems
        .map((item) => formatDisplayValue(getFieldValue(item, repairCommentKeys)))
        .find(Boolean) ||
      "-";

    return (
      <TicketPageShell contentClassName="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
        <div className="flex w-full items-center justify-between px-0 pb-2 pt-0">
          <h1 className="text-2xl font-medium leading-none text-slate-900">
            Item Details
          </h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-900 hover:bg-slate-100"
            >
              <img
                src={closeblack}
                alt=""
                className="h-4 w-4"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid min-h-0 flex-1 lg:grid-cols-2 ">
            <div className="min-w-0 border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-900">
                    Ticket No : <span className="font-normal">{ticketNo || "N/A"}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-700">
                    Item Taken on{" "}
                    <span className="font-normal">
                      {createdDate || "-"} {createdByTeam ? `(by ${createdByTeam})` : ""}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-slate-700">
                  <div>
                    Ticket Summary : <span className="text-slate-600">{summary || "-"}</span>
                  </div>
                  <div>
                    Ticket Description :{" "}
                    <span className="text-slate-600">{description || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4">
                <div className="text-base font-semibold text-slate-900">
                  {customerName || "-"}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-700">
                  <span className="inline-flex items-center gap-2">
                    <span className="text-slate-500">📞</span>
                    {contactNumber || "NIL"}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="text-slate-500">✉️</span>
                    {email || "NIL"}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-slate-100 px-3 py-3 text-sm text-slate-700">
                <span className="font-medium text-slate-900">Description :</span>{" "}
                {detailPreviousCallReport?.remarks || "No description available"}
              </div>

              <div className="mt-3 text-sm text-slate-700">
                <span className="font-medium text-slate-900">Comment :</span> {repairComment}
              </div>
            </div>

            <div className="min-w-0 flex min-h-0 flex-col">
              <div className="flex items-center gap-8 border-b border-slate-200 px-4 pt-4 text-base font-semibold">
                <button
                  type="button"
                  onClick={() => setRepairPanelTab("activity")}
                  className={`pb-2 ${
                    repairPanelTab === "activity"
                      ? "border-b-2 border-slate-900 text-slate-900"
                      : "text-slate-700"
                  }`}
                >
                  Activity
                </button>
                <button
                  type="button"
                  onClick={() => setRepairPanelTab("callReports")}
                  className={`pb-2 ${
                    repairPanelTab === "callReports"
                      ? "border-b-2 border-slate-900 text-slate-900"
                      : "text-slate-700"
                  }`}
                >
                  Call Reports
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden px-4 py-4">
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                  {visibleRepairItems.length > 0 ? (
                    <div className="relative space-y-5 border-l-2 border-sky-300 pl-5">
                      {visibleRepairItems.map((item: Record<string, any>, index: number) => {
                        const title = formatDisplayValue(
                          getFieldValue(item,[
                            "cViewSummary",
                            "ViewSummary",
                            "Summary",
                            "Title",
                            "Action",
                            "Activity",
                            "cStatusName",
                            "StatusName",
                            "Status",
                            "cRepairStatusName",
                          ]),
                        ) || "Activity";
                        const remarks = formatDisplayValue(
                          getFieldValue(item, [
                            "Remarks",
                            "Remark",
                            "Comment",
                            "Description",
                            "cDescription",
                            "cComment",
                            "cRemarks",
                            "cRemark",
                            "CallSummary",
                            "cCallSummary",
                          ]),
                        );
                        const actor = formatDisplayValue(
                          getFieldValue(item, [
                            "cAssignedAgent",
                          ]),
                        );
                        const isAssignedEntry = normalizeText(title).includes("assigned");
                        const isTransferEntry =
                          normalizeText(title).includes("transfer") ||
                          normalizeText(title).includes("vendor");
                        const isServiceCostEntry =
                          normalizeText(title).includes("service cost") ||
                          normalizeText(title).includes("cost estimate");
                        const actorLabel = isAssignedEntry
                          ? "Assigned to :"
                          : isTransferEntry
                            ? "Vendor Name :"
                            : "";
                        const showActions = isTransferEntry || isServiceCostEntry;
                        const dateText = formatRepairDateLabel(
                          getFieldValue(item, [
                            ...(isAssignedEntry
                              ? [
                                  "cCreatedDate",
                                  "dCreatedDate",
                                  "CreatedOn",
                                  "CreatedDateTime",
                                  "dSortDate",
                                  "SortDate",
                                ]
                              : [
                                  "cCreatedDate",
                                  "dSortDate",
                                  "cSortDate",
                                  "SortDate",
                                  "dCreatedDate",
                                  "CreatedOn",
                                  "CreatedDateTime",
                                ]),
                          ]),
                        );
                        const datePrefix = isAssignedEntry ? "Assigned on : " : "On : ";

                        return (
                          <div key={`${title}-${index}`} className="relative pb-3">
                            <span className="absolute -left-[23px] top-1.5 h-4 w-4 rounded-full border-2 border-sky-300 bg-sky-400 ring-4 ring-white" />
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-sm font-medium text-slate-900">
                                {title}
                                {dateText ? (
                                  <span className="ml-2 text-xs font-normal italic text-slate-500">
                                    ({datePrefix}
                                    {dateText})
                                  </span>
                                ) : null}
                              </div>
                              {showActions ? (
                                <div className="flex items-center gap-2 pt-0.5">
                                  <button
                                    type="button"
                                    aria-label="Edit timeline entry"
                                    onClick={() => openRepairActivityEdit(item)}
                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-slate-100"
                                  >
                                    <img src={editBlackIcon} alt="" className="h-[15px] w-[15px]" />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Delete timeline entry"
                                    onClick={() => deleteRepairActivity(item)}
                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-red-50"
                                  >
                                    <img src={deleteRedIcon} alt="" className="h-[15px] w-[15px]" />
                                  </button>
                                </div>
                              ) : null}
                            </div>
                            {actor ? (
                              <div className="mt-1 text-sm text-slate-700">
                                {actorLabel ? (
                                  <>
                                    <span className="font-medium text-slate-900">{actorLabel}</span>{" "}
                                    <span>{actor}</span>
                                  </>
                                ) : (
                                  actor
                                )}
                              </div>
                            ) : null}
                            {remarks ? (
                              <div className="mt-1 text-sm text-slate-600">
                                <span className="font-medium text-slate-900">Comment :</span> {remarks}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
                      No data found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-4 py-3">
            <button
              type="button"
              onClick={() =>
                navigate("/tickets/estimate", {
                  state: {
                    ticketId,
                    nTicketId: ticketId,
                    customerId,
                    nCustomerId: customerId,
                    customerName,
                    historyId: estimateHistoryId,
                    sessionPayload,
                    returnTo: location.pathname,
                    returnState: location.state,
                  },
                })
              }
              className="inline-flex items-center gap-2 rounded-md border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
            >
              <img src={EstimateIcon} alt="" className="h-5 w-5" />
              Cost Estimate
            </button>
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  { key: "agent", label: "Agent" },
                  { key: "vendor", label: "External Vendor" },
                ],
                onClick: ({ key }) => {
                  setTransferType(key as "agent" | "vendor");
                  setTransferOpen(true);
                },
              }}
            >
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
              >
                <img src={transferIcon} alt="" className="h-5 w-5" />
                Transfer
              </button>
            </Dropdown>
            <Dropdown
              trigger={["click"]}
              placement="topRight"
              menu={{
                items: [
                  {
                    key: String(repairWaitingStatusOption.id || "waiting-approval"),
                    label: repairWaitingStatusOption.label,
                  },
                ],
                onClick: () => setRepairStatusOpen(true),
              }}
            >
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Update Status
              </button>
            </Dropdown>
          </div>
        </div>

        <QuickCallReportModal
          open={quickCallOpen}
          ticketId={ticketId}
          onClose={() => setQuickCallOpen(false)}
          ticketValues={resolvedRecord}
          selectedCustomerName={customerName}
          sessionPayload={getRequestPayload()}
          skipAmcWarningOnSave
          onSaved={handleCallReportSaved}
        />
        <Modal
          title="Edit Repair Activity"
          open={repairActivityEditOpen}
          onCancel={() => {
            setRepairActivityEditOpen(false);
            setRepairActivityEditing(null);
          }}
          onOk={saveRepairActivityEdit}
          okText="Save"
          centered
          okButtonProps={{ className: "bg-emerald-500" }}
        >
          <div className="space-y-4 pt-2">
            <label className="block">
              <span className="mb-1 block text-sm text-slate-700">Service Cost</span>
              <InputNumber
                min={0}
                precision={2}
                value={repairActivityCost}
                onChange={(value) => setRepairActivityCost(Number(value) || 0)}
                className="w-full"
                prefix="₹"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-700">Comment</span>
              <Input.TextArea
                rows={4}
                value={repairActivityComment}
                onChange={(event) => setRepairActivityComment(event.target.value)}
              />
            </label>
          </div>
        </Modal>
        <TransferTicketModal
          open={transferOpen}
          ticketId={ticketId}
          transferType={transferType}
          transferContext="repair"
          repairPayload={{
            ...repairActionPayload,
            nCallPartId:
              repairActionPayload.nCallPartId ||
              Number(
                getFieldValue(repairActivityItems[0] ?? {}, [
                  "nCallPartId",
                  "CallPartId",
                  "callPartId",
                  "nTicketCallPartId",
                ]) || 0,
              ),
            CallPartId:
              repairActionPayload.CallPartId ||
              Number(
                getFieldValue(repairActivityItems[0] ?? {}, [
                  "nCallPartId",
                  "CallPartId",
                  "callPartId",
                  "nTicketCallPartId",
                ]) || 0,
              ),
          }}
          onClose={() => setTransferOpen(false)}
          onTransferred={() => {
            queryClient.invalidateQueries({ queryKey: ["ticket-view"] });
            queryClient.invalidateQueries({ queryKey: ["ticket-history"] });
            queryClient.invalidateQueries({ queryKey: ["repair-item-activity-list"] });
          }}
        />
        <RepairStatusModal
          open={repairStatusOpen}
          onClose={() => setRepairStatusOpen(false)}
          statusId={repairWaitingStatusOption.id}
          statusName={repairWaitingStatusOption.label}
          repairPayload={{
            ...repairActionPayload,
            nCallPartId:
              repairActionPayload.nCallPartId ||
              Number(getFieldValue(repairActivityItems[0] ?? {}, ["nCallPartId", "CallPartId", "callPartId"]) || 0),
            CallPartId:
              repairActionPayload.CallPartId ||
              Number(getFieldValue(repairActivityItems[0] ?? {}, ["nCallPartId", "CallPartId", "callPartId"]) || 0),
          }}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ["ticket-view"] });
            queryClient.invalidateQueries({ queryKey: ["repair-item-activity-list"] });
          }}
        />
        <EstimateModal
          open={estimateOpen}
          onClose={() => setEstimateOpen(false)}
          ticketId={ticketId}
          historyId={estimateHistoryId}
          customerId={customerId}
          customerName={customerName}
          sessionPayload={sessionPayload}
        />
      </TicketPageShell>
    );
  }

  return (
    <TicketPageShell contentClassName="relative flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex w-full items-center justify-between px-0 pb-2 pt-0">
        <h1 className="text-2xl font-medium leading-none text-slate-900">
          {isFollowupContext ? null : pageHeading}
        </h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Share"
            onClick={() => setShareInfoOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
          >
            <img src={shareIcon} alt="" className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-900 hover:bg-slate-100"
          >
            <img src={closeblack} alt="" className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {mergedBanner ? (
        <div className="mx-2 mt-3 rounded-md bg-teal-600/10 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-sm text-slate-900">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-500">
                <img src={mergeIcon} alt="" className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="truncate">{mergedBanner.text}</span>
            </div>
            <Button
              type="primary"
              loading={unMergeTicket.isPending}
              onClick={handleSplitMerge}
              className="!border-emerald-500 !bg-white !text-emerald-500 hover:!border-emerald-600 hover:!text-emerald-600"
            >
              Split
            </Button>
          </div>
        </div>
      ) : null}

      {isSharedTicket ? (
        <div className="mx-2 mt-3 w-170  my-5 rounded-md bg-teal-600/10 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-900 h-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-500 ">
                <img src={sendIcon} alt="not found" className="w-5 h-5 "/>
              </span>
              <span className="px-2 w-20">
                Share to : {sharedAgentName || `Agent ${resolvedSharedRecordId || ""}`}
              </span>
            </div>
            <Button
              type="primary"
              loading={unShareTicket.isPending}
              onClick={handleUnShare}
              className="!border-emerald-500 !bg-white !text-emerald-500 hover:!border-emerald-600 hover:!text-emerald-600 ml-106 "
            >
              UnShare
            </Button>
          </div>
        </div>
      ) : null}

      <div
        ref={ticketContentRef}
        className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${
          activeTab === "files"
            ? "files-list-scrollbar"
            : "ticket-overview-scrollbar"
        }`}
      >
        <TicketOverviewSection
          ticketId={ticketId}
          customerId={customerId}
          isLoading={isLoading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onEditAssetClick={() => setAssetPickerOpen(true)}
          ticketNo={ticketNo}
          customerName={customerName}
          summary={summary}
          description={description}
          createdDate={createdDate}
          priority={priority}
          period={period}
          status={status}
          followupDate={followupDate}
          address={address}
          assetName={selectedAssetName}
          source={source}
          serviceType={serviceType}
          group={group}
          contactNumber={contactNumber}
          email={email}
          attachments={attachments}
          attachmentsLoading={loadAttachmentHistory && isTicketAttachmentFetching}
          createdByTeam={createdByTeam}
          assignedTo={assignedAgentsText || createdByTeam}
          alternativeContacts={alternativeContacts}
          showFilesTab={showFilesTab}
          showFilesInDetails={false}
          showAssetEditIcon={!isFollowupPage && !isFollowupContext}
          extraRows={detailRows}
          showFollowUpAction={showFollowupAction}
          previousCallReport={detailPreviousCallReport}
          onOpenCallReport={setHistoryCallReportState}
          onFollowUpClick={() => {
            navigate("/tickets/create", {
              state: {
                selectedRow: resolvedRecord,
                followupSourceTicket: {
                  nTicketId: ticketId,
                  nTicketNo: ticketNo,
                  cViewSummary: summary || description || "Follow up ticket",
                  summary: summary,
                  description: description,
                },
                draftValues: {
                  CustomerId: getFieldValue(resolvedRecord, [
                    "nCustomerId",
                    "CustomerId",
                    "customerId",
                  ]),
                  CustomerName: customerName,
                  ContactPerson: getFieldValue(resolvedRecord, [
                    "cContactPerson",
                    "ContactPerson",
                  ]),
                  ContactNo: contactNumber,
                  Email: email,
                  IssueSummary: summary || description || "Follow up ticket",
                  Description: description || summary || "",
                  Priority: priority || "Low",
                  Group:
                    getFieldValue(resolvedRecord, ["nGroupId", "GroupId"]) === 0
                      ? undefined
                      : getFieldValue(resolvedRecord, ["nGroupId", "GroupId"]),
                  AssignToAgent:
                    getFieldValue(assignedAgentDetails[0] ?? {}, [
                      "nAgentId",
                      "AgentId",
                      "id",
                    ]) || undefined,
                  ServiceType:
                    getFieldValue(resolvedRecord, [
                      "nServiceTypeId",
                      "ServiceTypeId",
                    ]) === 0
                      ? undefined
                      : getFieldValue(resolvedRecord, [
                          "nServiceTypeId",
                          "ServiceTypeId",
                        ]),
                  Source: getFieldValue(resolvedRecord, [
                    "nTicketSourceId",
                    "TicketSourceId",
                  ]),
                  AssetId: getFieldValue(resolvedRecord, [
                    "nAssetId",
                    "AssetId",
                  ]),
                  AssetName: selectedAssetName,
                  FollowupDate: dayjs(),
                  files: attachments,
                },
              },
            });
          }}
        />
      </div>
      <Modal
        open={assetPickerOpen}
        title="Asset"
        centered
        width={560}
        footer={null}
        onCancel={() => setAssetPickerOpen(false)}
      >
        <div className="space-y-3">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Search"
            value={assetSearch}
            onChange={(event) => setAssetSearch(event.target.value)}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              placeholder="Department"
              value={assetDepartmentFilter}
              onChange={setAssetDepartmentFilter}
              options={[
                { label: "All", value: "All" },
                ...assetModalDepartments.map((item: any) => ({
                  label: item.label,
                  value: String(item.value ?? item.label),
                })),
              ]}
            />
            <Select
              placeholder="Brand"
              value={assetBrandFilter}
              onChange={setAssetBrandFilter}
              options={[
                { label: "All", value: "All" },
                ...assetModalBrands.map((item: any) => ({
                  label: item.label,
                  value: String(item.value ?? item.label),
                })),
              ]}
            />
          </div>

          <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
            {filteredAssetRows.length ? (
              filteredAssetRows.map((asset: any, index: number) => {
                const name =
                  formatDisplayValue(
                    getFieldValue(asset, [
                      "cAssetName",
                      "cAssetMasterName",
                      "AssetName",
                      "name",
                    ]),
                  ) || "Asset";
                const department = formatDisplayValue(
                  getFieldValue(asset, [
                    "cDepartmentName",
                    "DepartmentName",
                    "department",
                  ]),
                );
                const brand = formatDisplayValue(
                  getFieldValue(asset, ["cBrandName", "BrandName", "brand"]),
                );
                const serialNo = formatDisplayValue(
                  getFieldValue(asset, ["cSerialNo", "SerialNo", "serialNo"]),
                );

                return (
                  <button
                    key={`${name}-${index}`}
                    type="button"
                    className="w-full rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-left transition-colors hover:border-sky-300 hover:bg-sky-100"
                    onClick={() => {
                      setDisplayAssetName(name);
                      setAssetPickerOpen(false);
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-sky-100 pb-2">
                      <div className="font-medium text-slate-900">{name}</div>
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-slate-600">
                      <div>Department : {department || "-"}</div>
                      <div>Brand : {brand || "-"}</div>
                      {serialNo ? <div>Srl No : {serialNo}</div> : null}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                No data found
              </div>
            )}
          </div>
        </div>
      </Modal>
      {!isFollowupPage && !isFollowupContext && isUnassignedTicket ? (
        <div className="mt-4 flex items-center justify-end gap-4 px-1">
          <Button
            className="!border-emerald-500 !text-emerald-600 !bg-white rounded-xl shadow-sm h-10 px-8"
            onClick={() => setAssignOpen(true)}
          >
            Assign
          </Button>
          <Button
            type="primary"
            className="!bg-emerald-500 !border-emerald-500 rounded-xl h-10 px-8"
            loading={acceptTicket.isPending}
            onClick={() =>
              acceptTicket.mutate(
                {
                  ...sessionPayload,
                  TicketId: ticketId,
                  nTicketId: ticketId,
                  nAgentId: Number(
                    sessionPayload.nAgentId ??
                      sessionPayload.id ??
                      0,
                  ),
                } as any,
                {
                  onSuccess: () => {
                    message.success("Ticket accepted successfully");
                    navigate("/tickets", {
                      replace: true,
                      state: { activeTab: "ONGOING" },
                    });
                  },
                  onError: (error: any) => {
                    message.error(
                      error?.response?.data?.message ||
                        error?.message ||
                        "Unable to accept ticket",
                    );
                  },
                }
              )
            }
          >
            Accept
          </Button>
        </div>
      ) : null}
      {!isFollowupPage &&
      !isFollowupContext &&
      isWorkflowTicket &&
      !isUnassignedTicket ? (
        <div className="mt-4 flex flex-col gap-2 px-1 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              className="!border-black !text-black !bg-white rounded-[4px] shadow-none flex items-center gap-2 h-8 px-3"
              onClick={() => setEstimateOpen(true)}
            >
              <img src={EstimateIcon} alt="" className="h-5 w-5 " /> Estimate
            </Button>
            <Button
              className="!border-black !text-black rounded-[4px] border-black bg-white text-black shadow-none h-8 px-3"
              onClick={() => {
                setTransferType("agent");
                setTransferOpen(true);
              }}
            >
              <img src={transferIcon} alt="" className="h-5 w-5 " /> Transfer
            </Button>
            <Button
              className="!border-black !text-black rounded-[4px] border-black bg-white text-black shadow-none h-8 px-3"
              onClick={() => setPostponeOpen(true)}
            >
              <img src={postponeIcon} alt="" className="h-5 w-5 " />
              Postpone
            </Button>
            <Button
              className="!border-black !text-black rounded-[4px] border-black bg-white text-black shadow-none h-8 px-3"
              onClick={() => {
                if (isSharedTicket) {
                  message.info("Ticket already shared");
                  return;
                }

                setShareOpen(true);
              }}
            >
              <img src={sendIcon} alt="" className="h-5 w-5 " /> Share
            </Button>
            <Button
              className="!border-black !text-black rounded-[4px] border-black bg-white text-black shadow-none h-8 px-3"
              onClick={() =>
                navigate("/tickets/merge", {
                  state: {
                    selectedRow: resolvedRecord,
                    ticketId,
                    ticketNo,
                    isFrom: state.isFrom,
                    activeTab,
                  },
                })
              }
            >
              <img src={mergeIcon} alt="" className="h-5 w-5 " /> Merge
            </Button>
          </div>
          {showWorkflowStartPanel ? (
            <div className="flex min-h-[60px] w-full items-center justify-between gap-3 rounded-[2px]   bg-[#6f7d84] px-3 py-2 text-white lg:max-w-[520px]">
              <p className="text-[14px] font-normal leading-5 text-white">
                <span className="font-semibold">
                  Hi {currentUserName || "User"},
                </span>{" "}
                Please click the Start button to proceed with this ticket.
              </p>
              <div className="flex shrink-0 items-center gap-2">
                {isWorkflowStarted ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRevertWorkflowStatus}
                      disabled={updateTicketStatus.isPending}
                      className="rounded-[3px] border border-white bg-transparent px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-70"
                    >
                      Revert
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickCallOpen(true)}
                      className="rounded-[3px] bg-[#24c276] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#1fad69]"
                    >
                      Call Report
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStartConfirmOpen(true)}
                    disabled={updateTicketStatus.isPending}
                    className="rounded-[3px] bg-[#24c276] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#1fad69] disabled:opacity-70"
                  >
                    Start
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {isReviewClosedContext ? (
        <div className="mt-4 flex items-center justify-end gap-3 px-1">
          <Button
            danger
            type="primary"
            loading={updateTicketStatus.isPending}
            className="h-10 rounded-xl !border-red-500 !bg-red-500 px-8 hover:!border-red-600 hover:!bg-red-600"
            onClick={() => openReviewCommentModal("reject")}
          >
            Reject
          </Button>
          <Button
            type="primary"
            loading={updateTicketStatus.isPending}
            className="h-10 rounded-xl !border-emerald-500 !bg-emerald-500 px-8 hover:!border-emerald-600 hover:!bg-emerald-600"
            onClick={() => openReviewCommentModal("verify")}
          >
            Verify
          </Button>
        </div>
      ) : null}
      <Modal
        open={reviewCommentOpen}
        title="Add your comment"
        centered
        footer={null}
        onCancel={closeReviewCommentModal}
        width={420}
      >
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-sm text-slate-600">Comment</div>
            <Input.TextArea
              rows={6}
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              placeholder="Enter comment"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button onClick={closeReviewCommentModal}>Cancel</Button>
            <Button
              type="primary"
              className="!border-emerald-500 !bg-emerald-500 hover:!border-emerald-600 hover:!bg-emerald-600"
              onClick={submitReviewComment}
            >
              Ok
            </Button>
          </div>
        </div>
      </Modal>
      <QuickCallReportModal
        open={quickCallOpen}
        onClose={() => setQuickCallOpen(false)}
        ticketId={ticketId}  
        ticketValues={resolvedRecord}
        selectedCustomerName={customerName}
        sessionPayload={getRequestPayload()}
        skipAmcWarningOnSave
        onSaved={handleCallReportSaved}
      />
      {historyCallReportState
        ? createPortal(
            <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/30 p-4">
              <div className="h-[78vh] w-full max-w-[1000px] overflow-hidden rounded-xl bg-white shadow-2xl">
                <CallReportViewPage
                  embedded
                  historyMode
                  overrideState={historyCallReportState}
                  onClose={() => setHistoryCallReportState(null)}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
      <AssignTicketModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        ticketId={ticketId}
        agentOptions={assignAgentOptions}
      />
      <ShareInfoModal
        open={shareInfoOpen}
        onClose={() => setShareInfoOpen(false)}
        ticketId={ticketId}
        ticketNo={ticketNo}
        customerEmail={email}
        attachments={attachments}
      />
      <ShareTicketModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        ticketId={ticketId}
        ticketNo={ticketNo}
      />
      <TransferTicketModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        ticketId={ticketId}
        transferType={transferType}
        transferContext="ticket"
      />
      <FollowupModal
        open={postponeOpen}
        onClose={() => setPostponeOpen(false)}
        ticketId={ticketId}
      />
      <EstimateModal
        open={estimateOpen}
        onClose={() => setEstimateOpen(false)}
        ticketId={ticketId}
        customerId={customerId}
        historyId={estimateHistoryId}
        customerName={customerName}
        sessionPayload={getRequestPayload()}
      />
      <Modal
        open={startConfirmOpen}
        title="Confirmation"
        centered
        footer={null}
        onCancel={() => setStartConfirmOpen(false)}
        width={360}
      >
        <div className="space-y-5">
          <div className="text-sm leading-6 text-slate-600">
            Only one ticket can be in 'In Progress' status at a time. If you
            proceed, the previous tickets will be moved back to 'Pending', and
            the current ticket will be marked as 'In Progress'. Do you wish to
            continue?
          </div>
          <div className="flex justify-end gap-3">
            <Button onClick={() => setStartConfirmOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              loading={updateTicketStatus.isPending}
              className="!border-emerald-500 !bg-emerald-500 hover:!border-emerald-600 hover:!bg-emerald-600"
              onClick={handleStartWorkflow}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
      {/* </div> */}
    </TicketPageShell>
  );
};

export default TicketView;


