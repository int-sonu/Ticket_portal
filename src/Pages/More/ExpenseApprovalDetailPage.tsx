/* eslint-disable @typescript-eslint/no-explicit-any -- approval response shapes vary by tenant. */
import {
  CloseOutlined,
  EditOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Drawer, Empty, Image, InputNumber, Spin, message } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import { approvalApis } from "../../Axios/MoreApis";
import { getApiImageBaseUrl } from "../../Axios/config";
import { getRequestPayload } from "../../Utils/requestPayload";
import noDataImage from "../../assets/images/noDataGif.gif";
import {
  formatCurrency,
  formatDate,
  getValue,
  number,
  text,
} from "./ExpenseApprovalUtils";

type DetailState = {
  approvalId?: number;
  approvalDetailId?: number;
  expenseApprovalId?: number;
  nAgentId?: number;
  approval?: Record<string, unknown>;
  periodRow?: Record<string, unknown>;
  tripModes?: unknown;
  approvalViewData?: unknown;
} | null;

const unwrap = (response: unknown): Record<string, any> => {
  const source = response as any;
  const candidates = [
    source?.data?.data,
    source?.data?.result,
    source?.data,
    source?.result,
    source,
  ];
  return (candidates.find((item) => item && typeof item === "object") ?? {}) as Record<string, any>;
};

const findNamedList = (response: unknown, keys: string[]) => {
  const queue: unknown[] = [response];
  const visited = new Set<unknown>();
  while (queue.length) {
    let value = queue.shift();
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        continue;
      }
    }
    if (!value || typeof value !== "object" || visited.has(value)) continue;
    visited.add(value);
    if (Array.isArray(value)) continue;
    const record = value as Record<string, unknown>;
    const matched = Object.keys(record).find((key) =>
      keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
    );
    if (matched && Array.isArray(record[matched])) {
      return record[matched] as Record<string, unknown>[];
    }
    Object.values(record).forEach((item) => queue.push(item));
  }
  return [] as Record<string, unknown>[];
};

const collectRecords = (response: unknown) => {
  const records: Record<string, unknown>[] = [];
  const queue: unknown[] = [response];
  const visited = new Set<unknown>();

  while (queue.length) {
    let value = queue.shift();
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        continue;
      }
    }
    if (!value || typeof value !== "object" || visited.has(value)) continue;
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item && typeof item === "object") records.push(item as Record<string, unknown>);
        queue.push(item);
      });
      continue;
    }

    const record = value as Record<string, unknown>;
    Object.values(record).forEach((item) => queue.push(item));
  }

  return records.filter(
    (record, index) => records.findIndex((candidate) => candidate === record) === index,
  );
};

const hasAnyValue = (record: Record<string, unknown>, keys: string[]) =>
  getValue(record, keys) !== "";

const getDeepValue = (source: unknown, keys: string[]) => {
  const queue: unknown[] = [source];
  const visited = new Set<unknown>();
  while (queue.length) {
    let value = queue.shift();
    if (typeof value === "string" && /^[\[{]/.test(value.trim())) {
      try {
        value = JSON.parse(value);
      } catch {
        // Keep ordinary strings out of the object traversal.
      }
    }
    if (!value || typeof value !== "object" || visited.has(value)) continue;
    visited.add(value);
    if (!Array.isArray(value)) {
      const found = getValue(value as Record<string, unknown>, keys);
      if (found !== "") return found;
    }
    Object.values(value as Record<string, unknown>).forEach((nested) => {
      if (nested && typeof nested === "object") queue.push(nested);
      else if (typeof nested === "string" && /^[\[{]/.test(nested.trim())) queue.push(nested);
    });
  }
  return "";
};

const getDeepValueByKeyPattern = (source: unknown, pattern: RegExp) => {
  const queue: unknown[] = [source];
  const visited = new Set<unknown>();
  while (queue.length) {
    let value = queue.shift();
    if (typeof value === "string" && /^[\[{]/.test(value.trim())) {
      try {
        value = JSON.parse(value);
      } catch {
        // Ignore non-JSON strings.
      }
    }
    if (!value || typeof value !== "object" || visited.has(value)) continue;
    visited.add(value);
    if (Array.isArray(value)) {
      value.forEach((nested) => queue.push(nested));
      continue;
    }
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (
        pattern.test(key) &&
        (typeof nested === "string" || typeof nested === "number") &&
        isMeaningful(nested)
      ) {
        return nested;
      }
      if (nested && typeof nested === "object") queue.push(nested);
      else if (typeof nested === "string" && /^[\[{]/.test(nested.trim())) queue.push(nested);
    }
  }
  return "";
};

const isMeaningful = (value: unknown) => {
  const normalized = text(value);
  return Boolean(normalized && !/^(n\/a|null|undefined|-|0)$/i.test(normalized));
};

const expenseAmount = (record: Record<string, unknown>) =>
  number(
    getValue(record, [
      "nAmount",
      "Amount",
      "nExpenseAmount",
      "ExpenseAmount",
      "nClaimedAmount",
      "nOtherExpenseAmount",
      "nTravelExpenseAmount",
      "nTotalAmount",
      "nTotalExpense",
      "nExpense",
    ]),
  );

const displayTime = (value: unknown) => {
  const raw = text(value);
  if (!raw || /^(n\/a|null|undefined|-)$/i.test(raw)) return "";
  if (/^\d{1,2}:\d{2}(\s?[AP]M)?$/i.test(raw)) return raw;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime())
    ? raw
    : parsed.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
};

const mergeNonEmptyRecords = (
  current: Record<string, unknown>,
  incoming: Record<string, unknown>,
) => {
  const merged = { ...current };
  Object.entries(incoming).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") merged[key] = value;
  });
  return merged;
};

const mergeTravelRecords = (records: Record<string, unknown>[]) => {
  const grouped = new Map<string, Record<string, unknown>>();
  let unmatchedIndex = 0;

  records.forEach((record) => {
    const travelId = text(
      getValue(record, [
        "nTravelLogId",
        "TravelLogId",
        "nTravelExpenseId",
        "TravelExpenseId",
        "nTicketTravelId",
        "TicketTravelId",
        "nTripId",
        "TripId",
      ]),
    );
    const eventTime = displayTime(
      getValue(record, [
        "cPunchInTime",
        "dPunchInTime",
        "cCheckInTime",
        "dCheckInTime",
        "cStartingTime",
        "cStartTime",
        "dStartTime",
        "cTime",
        "Time",
      ]),
    );
    const eventDate = text(
      getValue(record, ["dExpenseDate", "dDate", "cDate", "Date", "dCreatedDate"]),
    );
    const key = eventTime
      ? `event:${eventDate}|${eventTime}`
      : travelId
        ? `id:${travelId}`
        : `unmatched:${unmatchedIndex++}`;
    grouped.set(
      key,
      grouped.has(key)
        ? mergeNonEmptyRecords(grouped.get(key)!, record)
        : { ...record },
    );
  });

  const mergedRows = [...grouped.values()];
  const timedRows = mergedRows.filter((record) =>
    isMeaningful(
      getDeepValue(record, [
        "cPunchInTime",
        "dPunchInTime",
        "cCheckInTime",
        "dCheckInTime",
        "cStartingTime",
        "cStartTime",
        "dStartTime",
        "cTime",
        "Time",
      ]),
    ),
  );
  const untimedRows = mergedRows.filter((record) => !timedRows.includes(record));

  if (timedRows.length === 1 && untimedRows.length) {
    return [
      untimedRows.reduce(
        (current, record) => mergeNonEmptyRecords(current, record),
        timedRows[0],
      ),
    ];
  }
  return mergedRows;
};

const expenseName = (record: Record<string, unknown>, fallback: string) =>
  text(
    getValue(record, [
      "cItem",
      "cItemName",
      "cOtherExpenseName",
      "OtherExpenseName",
      "cExpenseName",
      "ExpenseName",
      "cExpenseTitle",
      "cParticulars",
      "cName",
      "Name",
    ]),
    fallback,
  );

const expenseRemarks = (record: Record<string, unknown>) =>
  text(
    getValue(record, [
      "cRemarks",
      "Remarks",
      "cComment",
      "cComments",
      "Comment",
      "Comments",
      "cDescription",
      "Description",
      "cExpenseDescription",
      "cOtherExpenseDescription",
    ]),
    "",
  );

const resolveImageUrl = (value: unknown) => {
  const path = text(value);
  if (!path || /^(https?:|data:|blob:)/i.test(path)) return path;
  try {
    return `${getApiImageBaseUrl().replace(/\/+$/, "")}/${path
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")}`;
  } catch {
    return path.replace(/\\/g, "/");
  }
};

const attachmentValueKeys = [
  "cUrl",
  "url",
  "cFileUrl",
  "FileUrl",
  "cFilePath",
  "FilePath",
  "filePath",
  "cAttachment",
  "Attachment",
  "attachment",
  "cAttachmentPath",
  "AttachmentPath",
  "attachmentPath",
  "cOtherExpenseAttachment",
  "OtherExpenseAttachment",
  "cImage",
  "Image",
  "image",
  "cImagePath",
  "ImagePath",
  "imagePath",
  "cDocumentPath",
  "DocumentPath",
  "cPath",
  "path",
];

const attachmentUrlsFromValue = (
  value: unknown,
  attachmentContext = false,
  depth = 0,
): string[] => {
  if (depth > 5 || value === null || value === undefined) return [];

  if (typeof value === "string") {
    const source = value.trim();
    if (!source) return [];
    if (/^[\[{]/.test(source)) {
      try {
        return attachmentUrlsFromValue(JSON.parse(source), attachmentContext, depth + 1);
      } catch {
        // Continue as a regular attachment path.
      }
    }
    const looksLikeFile =
      /^(https?:|data:|blob:)/i.test(source) ||
      /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(source) ||
      /[\\/](upload|attachment|expense|image|document)s?[\\/]/i.test(source);
    return attachmentContext && looksLikeFile ? [resolveImageUrl(source)] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      attachmentUrlsFromValue(item, attachmentContext, depth + 1),
    );
  }
  if (typeof value !== "object") return [];

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
    const isAttachmentKey =
      attachmentValueKeys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()) ||
      /(attachment|image|photo|document|proof|file)/i.test(key);
    return attachmentUrlsFromValue(
      nested,
      attachmentContext || isAttachmentKey,
      depth + 1,
    );
  });
};

const expenseRecordIds = (record: Record<string, unknown>) =>
  [
    "nExpenseId",
    "ExpenseId",
    "nOtherExpenseId",
    "OtherExpenseId",
    "nExpenseDtlId",
    "nExpenseDetailId",
    "nOtherExpenseDtlId",
    "nOtherExpenseDetailId",
    "nApprovalExpenseDtlId",
    "nApprovaldtlId",
  ]
    .map((key) => getValue(record, [key]))
    .filter((value) => value !== "")
    .map(String);

const expenseAttachments = (
  record: Record<string, unknown>,
  responseRecords: Record<string, unknown>[] = [],
) => {
  let source = getValue(record, [
    "attachments",
    "Attachments",
    "attachmentList",
    "AttachmentList",
    "otherExpenseAttachments",
    "OtherExpenseAttachments",
  ]);
  if (!source) {
    source = getValue(record, [
      "cUrl",
      "url",
      "cFileUrl",
      "FileUrl",
      "cFilePath",
      "FilePath",
      "cAttachmentPath",
      "AttachmentPath",
      "cAttachment",
      "Attachment",
      "cOtherExpenseAttachment",
      "OtherExpenseAttachment",
      "cImagePath",
      "ImagePath",
      "cDocumentPath",
      "DocumentPath",
      "cPath",
      "path",
    ]);
  }

  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      source = source.trim() ? [source] : [];
    }
  }

  const values = Array.isArray(source) ? source : source ? [source] : [];
  const directUrls = values
    .map((attachment) => {
      if (typeof attachment === "string") return resolveImageUrl(attachment);
      return resolveImageUrl(
        getValue(attachment as Record<string, unknown>, [
          "cUrl",
          "url",
          "cFileUrl",
          "FileUrl",
          "cFilePath",
          "FilePath",
          "cAttachmentPath",
          "AttachmentPath",
          "cAttachment",
          "Attachment",
          "cOtherExpenseAttachment",
          "OtherExpenseAttachment",
          "cImagePath",
          "ImagePath",
          "cDocumentPath",
          "DocumentPath",
          "cPath",
          "path",
        ]),
      );
    })
    .filter(Boolean);

  const rowIds = expenseRecordIds(record);
  const linkedUrls = rowIds.length
    ? responseRecords.flatMap((candidate) => {
        if (candidate === record) return [];
        const candidateIds = expenseRecordIds(candidate);
        return candidateIds.some((id) => rowIds.includes(id))
          ? attachmentUrlsFromValue(candidate)
          : [];
      })
    : [];

  return [...new Set([...directUrls, ...attachmentUrlsFromValue(record), ...linkedUrls])];
};

const ExpenseApprovalDetailPage = () => {
  const navigate = useNavigate();
  const [selectedExpense, setSelectedExpense] = useState<Record<string, unknown> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAmountKey, setEditingAmountKey] = useState("");
  const [approvedAmounts, setApprovedAmounts] = useState<Record<string, number>>({});
  const [approvalComments, setApprovalComments] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const state = useLocation().state as DetailState;
  const approval = state?.approval ?? {};
  const periodRow = state?.periodRow ?? {};
  const approvalId =
    Number(state?.approvalId ?? getValue(approval, ["nApprovalId", "ApprovalId"])) || 0;
  const approvalDetailId =
    Number(
      state?.approvalDetailId ??
        getValue(periodRow, [
          "nApprovaldtlId",
          "nApprovalDtlId",
          "ApprovaldtlId",
          "ApprovalDtlId",
          "id",
        ]),
    ) || 0;
  const context = getRequestPayload();
  const viewPayload = {
    nApprovalId: approvalId,
    nApprovaldtlId: approvalDetailId,
    nCompanyId: context.nCompanyId,
    cSchemaName: context.cSchemaName,
    cDbName: context.cDbName,
  };
  const basePayload = {
    nCompanyId: context.nCompanyId,
    cSchemaName: context.cSchemaName,
    cDbName: context.cDbName,
  };

  const viewQuery = useQuery({
    queryKey: ["expense-approval-view", viewPayload],
    queryFn: () => approvalApis.expenseApprovalView(viewPayload),
    enabled: approvalId > 0 && approvalDetailId > 0,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const tripModeQuery = useQuery({
    queryKey: ["trip-mode-dropdown", basePayload],
    queryFn: () => approvalApis.tripModeListDropdown(basePayload),
    enabled: !state?.tripModes,
  });

  const response = viewQuery.data ?? state?.approvalViewData;
  const details = unwrap(response);
  const tripModeResponse = tripModeQuery.data ?? state?.tripModes;
  const tripModes = collectRecords(tripModeResponse).filter((mode) =>
    hasAnyValue(mode, [
      "nTripModeId",
      "nTripmodeId",
      "nModeId",
      "cModeName",
      "cMode",
      "cTripModeName",
    ]),
  );
  const tripModeName = (item: Record<string, unknown>) => {
    const id = getValue(item, [
      "nTripModeId",
      "nTripmodeId",
      "TripModeId",
      "nTravelModeId",
      "nModeId",
    ]);
    const match = tripModes.find(
      (mode) =>
        String(getValue(mode, ["nTripModeId", "nTripmodeId", "TripModeId", "nModeId", "id"])) ===
        String(id),
    );
    return text(
      getValue(item, ["cTripMode", "TripMode", "cModeName", "cTripModeName"]) ||
        getValue(match, ["cModeName", "ModeName", "cMode", "cTripModeName", "cName"]),
      "",
    );
  };

  const allRows = collectRecords(response);
  const travelItems = findNamedList(response, [
    "travelExpenseList",
    "travelExpenseDetails",
    "travelDetails",
    "tripExpenseList",
    "travelExpenses",
    "lTravelExpense",
    "travelExpenseDtls",
    "travelLogList",
    "ticketTravelList",
    "travelList",
  ]);
  const otherItems = findNamedList(response, [
    "otherExpenseList",
    "otherExpenseDetails",
    "otherDetails",
    "expenseOtherList",
    "otherExpenses",
    "lOtherExpense",
    "otherExpenseDtls",
  ]);
  const fallbackTravel = allRows.filter((row) => {
    const kind = text(getValue(row, ["cExpenseType", "ExpenseType", "cType"]), "").toLowerCase();
    const typeCode = Number(getValue(row, ["nExpenseType", "ExpenseTypeId", "nType"]));
    return (
      typeCode === 1 ||
      kind.includes("travel") ||
      hasAnyValue(row, [
        "cStartingLocation",
        "cEndingLocation",
        "cPunchInLocation",
        "cPunchOutLocation",
        "cFromLocation",
        "cToLocation",
        "nTripModeId",
        "nTripmodeId",
      ])
    );
  });
  const fallbackOther = allRows.filter((row) => {
    const kind = text(getValue(row, ["cExpenseType", "ExpenseType", "cType"]), "").toLowerCase();
    const typeCode = Number(getValue(row, ["nExpenseType", "ExpenseTypeId", "nType"]));
    const hasGenericExpense =
      expenseAmount(row) > 0 &&
      hasAnyValue(row, ["cName", "Name", "cTitle", "Title", "cExpense"]);
    return (
      typeCode === 2 ||
      kind.includes("other") ||
      hasGenericExpense ||
      hasAnyValue(row, [
        "cItem",
        "cItemName",
        "cOtherExpenseName",
        "cExpenseName",
        "cExpense",
        "ExpenseName",
        "cExpenseTitle",
        "cParticulars",
        "cRemarks",
        "cDescription",
      ])
    );
  });
  const travelRows = mergeTravelRecords([...travelItems, ...fallbackTravel]).filter(
    (row) => {
      const location = getDeepValue(row, [
        "cInLocation",
        "cStartingLocation", "StartingLocation", "StartLocation", "cStartLocation",
        "cPunchOutLocation", "cPunchoutLocation", "cCheckOutLocation", "cCheckoutLocation",
        "cEndingLocation", "EndingLocation", "EndLocation", "cEndLocation",
        "cPunchInAddress", "cCheckInAddress", "cStartingAddress", "cStartAddress",
        "cPunchOutAddress", "cCheckOutAddress", "cEndingAddress", "cEndAddress",
        "cPunchInPlusCode", "cCheckInPlusCode", "cStartingPlusCode", "cStartPlusCode",
        "cPunchOutPlusCode", "cCheckOutPlusCode", "cEndingPlusCode", "cEndPlusCode",
      ]);
      const patternedLocation = getDeepValueByKeyPattern(
        row,
        /(punch.?in|punch.?out|check.?in|check.?out|start|starting|end|ending|from|to).*(location|address|place|plus.?code)|(location|address|place|plus.?code).*(punch.?in|punch.?out|check.?in|check.?out|start|starting|end|ending|from|to)/i,
      );
      const distance = number(
        getDeepValue(row, [
          "nTravelledKm", "nCalculatedDistance", "nTravelDistance", "nDistance", "nKm",
        ]),
      );
      const punchTime = getDeepValue(row, [
        "cPunchInTime", "dPunchInTime", "cPunchinTime", "PunchInTime",
        "cStartingTime", "cStartTime", "dStartTime", "cTime", "Time",
      ]);
      return (
        isMeaningful(punchTime) ||
        isMeaningful(location) ||
        isMeaningful(patternedLocation) ||
        distance > 0 ||
        expenseAmount(row) > 0
      );
    },
  );
  const otherRows = otherItems.length ? otherItems : fallbackOther;
  const listedTravelTotal = travelRows.reduce((total, row) => total + expenseAmount(row), 0);
  const listedOtherTotal = otherRows.reduce((total, row) => total + expenseAmount(row), 0);

  const value = (keys: string[]) =>
    getValue(details, keys) || getValue(periodRow, keys) || getValue(approval, keys);
  const agentName = text(value(["cAgentName", "AgentName", "cName", "Name"]), "Expense Approval");
  const initials = agentName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const department = text(
    value(["cDepartmentName", "DepartmentName", "cGroupName", "GroupName", "cService"]),
    "Service",
  );
  const travelAmount =
    listedTravelTotal ||
    number(value(["nTotalTravelAmount", "nTravelExpenseAmount", "nTravelExpense"]));
  const otherAmount =
    listedOtherTotal ||
    number(value(["nTotalOtherAmount", "nOtherExpenseAmount", "nOtherExpense"]));
  const hasDetailRows = travelRows.length > 0 || otherRows.length > 0;
  const claimedAmount = hasDetailRows
    ? travelAmount + otherAmount
    : number(value(["nTotalExpenseAmount", "nClaimedAmount", "nClaimedExpense"]));
  const approvedTravel = travelRows.length
    ? travelAmount
    : number(value(["nApprovedTravelExpense", "ApprovedTravelExpense"])) || travelAmount;
  const approvedOther = otherRows.length
    ? otherAmount
    : number(value(["nApprovedOtherExpense", "ApprovedOtherExpense"])) || otherAmount;
  const approvedTotal = hasDetailRows
    ? approvedTravel + approvedOther
    : number(value(["nApprovedExpense", "ApprovedExpense", "nApprovedAmount"]));
  const date = formatDate(
    value([
      "dExpenseDate",
      "dApprovalDtlDate",
      "dDate",
      "Date",
      "dCreatedDate",
      "dCreatedOn",
      "dApprovalDate",
    ]),
  );

  const loading = viewQuery.isFetching || tripModeQuery.isFetching;

  const travelDetails = (item: Record<string, unknown>) => {
    const locationText = (
      directKeys: string[],
      addressKeys: string[],
      plusCodeKeys: string[],
      fieldPattern: RegExp,
      latitudeKeys: string[],
      longitudeKeys: string[],
    ) => {
      const direct = text(getDeepValue(item, directKeys));
      if (direct && !/^(n\/a|null|undefined|-)$/i.test(direct)) return direct;
      const parts = [
        text(getDeepValue(item, plusCodeKeys)),
        text(getDeepValue(item, addressKeys)),
        text(getDeepValue(item, ["cArea", "Area", "cLocality", "Locality"])),
        text(getDeepValue(item, ["cCity", "City", "cDistrict", "District"])),
        text(getDeepValue(item, ["cPincode", "Pincode", "cPostalCode", "PostalCode"])),
      ].filter((part) => part && !/^(n\/a|null|undefined|-)$/i.test(part));
      const composed = [...new Set(parts)].join(", ");
      if (composed) return composed;

      const patterned = text(getDeepValueByKeyPattern(item, fieldPattern));
      if (patterned) return patterned;

      const latitude = text(getDeepValue(item, latitudeKeys));
      const longitude = text(getDeepValue(item, longitudeKeys));
      return latitude && longitude ? `${latitude}, ${longitude}` : "-";
    };
    const startTime = displayTime(
      getDeepValue(item, [
        "cPunchInTime",
        "dPunchInTime",
        "cCheckInTime",
        "dCheckInTime",
        "cStartingTime",
        "cStartTime",
        "dStartTime",
        "cTime",
        "Time",
      ]),
    );
    const endTime = displayTime(
      getDeepValue(item, [
        "cPunchOutTime",
        "dPunchOutTime",
        "cCheckOutTime",
        "dCheckOutTime",
        "cEndingTime",
        "cEndTime",
        "dEndTime",
      ]),
    );
    const startLocation = locationText(
      [
        "cInLocation",
        
      ],
      [
        "cPunchInAddress",
        "cPunchinAddress",
        "PunchInAddress",
        "cCheckInAddress",
        "cStartingAddress",
        "StartingAddress",
        "cStartAddress",
        "cFromAddress",
      ],
      [
        "cPunchInPlusCode",
        "cCheckInPlusCode",
        "cStartingPlusCode",
        "cStartPlusCode",
      ],
      /(punch.?in|check.?in|start|starting|from).*(cInLocation|address|place|plus.?code)|(cInLocation|address|place|plus.?code).*(punch.?in|check.?in|start|starting|from)/i,
      [
        "cPunchInLatitude", "nPunchInLatitude", "cCheckInLatitude",
        "cStartingLatitude", "cStartLatitude",
      ],
      [
        "cPunchInLongitude", "nPunchInLongitude", "cCheckInLongitude",
        "cStartingLongitude", "cStartLongitude",
      ],
    );
    const endLocation = locationText(
      [
        "cInLocation",
        "cPunchoutLocation",
        "PunchOutLocation",
        "cCheckOutLocation",
        "cCheckoutLocation",
        "cCheckinLocation",
        "cEndingLocation",
        "EndingLocation",
        "EndLocation",
        "cToLocation",
        "cEndLocation",
      ],
      [
        "cPunchOutAddress",
        "cPunchoutAddress",
        "PunchOutAddress",
        "cCheckOutAddress",
        "cEndingAddress",
        "EndingAddress",
        "cEndAddress",
        "cToAddress",
      ],
      [
        "cPunchOutPlusCode",
        "cCheckOutPlusCode",
        "cEndingPlusCode",
        "cEndPlusCode",
      ],
      /(punch.?out|check.?out|checkin|end|ending|to).*(location|address|place|plus.?code)|(location|address|place|plus.?code).*(punch.?out|check.?out|checkin|end|ending|to)/i,
      [
        "cPunchOutLatitude", "nPunchOutLatitude", "cCheckOutLatitude",
        "cEndingLatitude", "cEndLatitude",
      ],
      [
        "cPunchOutLongitude", "nPunchOutLongitude", "cCheckOutLongitude",
        "cEndingLongitude", "cEndLongitude",
      ],
    );
    const distance = text(
      getDeepValue(item, [
        "nDistance",
        "Distance",
        "nTravelDistance",
        "TravelDistance",
        "nTravelledKm",
        "TravelledKm",
        "nCalculatedDistance",
        "CalculatedDistance",
        "nKm",
        "cDistance",
      ]),
      "0",
    );
    const employee = text(
      getDeepValue(item, [
        "cEmployeeName",
        "EmployeeName",
        "cCheckInBy",
        "cUserName",
        "UserName",
        "cAgentName",
        "AgentName",
      ]),
      agentName,
    );
    const activityValue = text(
      getDeepValue(item, [
        "cActivity",
        "Activity",
        "cCheckType",
        "CheckType",
        "cTravelStatus",
        "TravelStatus",
        "cVisitType",
      ]),
    );
    const modeValue = tripModeName(item) || text(
      getDeepValue(item, ["cTravelMode", "TravelMode", "cMode", "Mode"]),
    );
    const comment = text(
      getDeepValue(item, [
        "cComment",
        "Comment",
        "cComments",
        "Comments",
        "cRemarks",
        "Remarks",
        "cDescription",
        "Description",
      ]),
      "",
    );
    const hasCheckDetails =
      isMeaningful(endTime) ||
      isMeaningful(endLocation) ||
      number(distance) > 0 ||
      isMeaningful(activityValue) ||
      isMeaningful(modeValue) ||
      expenseAmount(item) > 0;

    return {
      startTime,
      endTime: endTime || startTime,
      startLocation,
      endLocation,
      distance,
      employee,
      activity: activityValue || "Check In",
      mode: modeValue || "-",
      comment,
      hasCheckDetails,
    };
  };

  const expenseRowKey = (
    kind: "travel" | "other",
    item: Record<string, unknown>,
    index: number,
  ) =>
    `${kind}:${
      text(
        getValue(item, [
          "nExpenseId",
          "ExpenseId",
          "nTravelExpenseId",
          "nOtherExpenseId",
          "nExpenseDtlId",
        ]),
      ) || index
    }`;

  const startEditing = () => {
    const amounts: Record<string, number> = {};
    const comments: Record<string, string> = {};
    travelRows.forEach((item, index) => {
      const key = expenseRowKey("travel", item, index);
      amounts[key] =
        number(getValue(item, ["nApprovedAmount", "ApprovedAmount"])) ||
        expenseAmount(item);
      comments[key] = text(
        getValue(item, ["cApprovalComment", "ApprovalComment", "cComment", "Comment"]),
      );
    });
    otherRows.forEach((item, index) => {
      const key = expenseRowKey("other", item, index);
      amounts[key] =
        number(getValue(item, ["nApprovedAmount", "ApprovedAmount"])) ||
        expenseAmount(item);
      comments[key] = text(
        getValue(item, ["cApprovalComment", "ApprovalComment", "cComment", "Comment"]),
      );
    });
    setApprovedAmounts(amounts);
    setApprovalComments(comments);
    setSelectedExpense(null);
    setEditingAmountKey("");
    setIsEditing(true);
  };

  const handleSave = async () => {
    const currentAgentId = Number(context.nAgentId ?? context.id) || 0;
    const approvalAgentId =
      Number(
        state?.nAgentId ??
          getValue(periodRow, ["nAgentId", "AgentId"]) ??
          getValue(approval, ["nAgentId", "AgentId"]),
      ) || 0;
    const travelExpensesDtls = travelRows.map((item, index) => {
      const key = expenseRowKey("travel", item, index);
      const travel = travelDetails(item);
      return {
        dDate: text(getDeepValue(item, ["dDate", "cDate", "Date", "dCreatedDate"])),
        cTime: travel.startTime,
        cTypeName: travel.activity,
        nTripMode: number(
          getDeepValue(item, ["nTripMode", "nTripModeId", "nTripmodeId", "nModeId"]),
        ),
        cModeName: travel.mode,
        nRate: number(getDeepValue(item, ["nRate", "Rate"])),
        nKm: number(getDeepValue(item, ["nKm", "Km"])),
        cInLocation: travel.startLocation === "-" ? "" : travel.startLocation,
        cInLattitude: text(
          getDeepValue(item, ["cInLattitude", "cInLatitude", "cPunchInLatitude"]),
        ),
        cInLongitude: text(
          getDeepValue(item, ["cInLongitude", "cPunchInLongitude"]),
        ),
        cCustomerName: text(
          getDeepValue(item, ["cCustomerName", "CustomerName"]),
        ),
        nMode: number(getDeepValue(item, ["nMode", "Mode"])),
        nTravelledKm: number(
          getDeepValue(item, ["nTravelledKm", "nCalculatedDistance", "nDistance"]),
        ),
        nAmount: expenseAmount(item),
        cNote: text(getDeepValue(item, ["cNote", "Note"])),
        nStartingKm: number(getDeepValue(item, ["nStartingKm", "StartingKm"])),
        nEndingKm: number(getDeepValue(item, ["nEndingKm", "EndingKm"])),
        nEditedDistance: number(
          getDeepValue(item, ["nEditedDistance", "EditedDistance"]),
        ),
        cStartAttachment: text(
          getDeepValue(item, ["cStartAttachment", "StartAttachment"]),
        ),
        cEndAttachment: text(
          getDeepValue(item, ["cEndAttachment", "EndAttachment"]),
        ),
        cComment: travel.comment,
        nExpenseId: number(
          getValue(item, ["nExpenseId", "ExpenseId", "nTravelExpenseId"]),
        ),
        nApprovedMode: number(
          getDeepValue(item, ["nApprovedMode", "ApprovedMode", "nMode"]),
        ),
        nApprovedTraveledDistance: number(
          getDeepValue(item, [
            "nApprovedTraveledDistance",
            "ApprovedTraveledDistance",
            "nTravelledKm",
          ]),
        ),
        nClaimedAmount: expenseAmount(item),
        nApprovedAmount: approvedAmounts[key] ?? expenseAmount(item),
        cApprovalComment: approvalComments[key] ?? "",
      };
    });
    const otherExpensesDtls = otherRows.map((item, index) => {
      const key = expenseRowKey("other", item, index);
      return {
        nExpenseId: number(
          getValue(item, ["nExpenseId", "ExpenseId", "nOtherExpenseId"]),
        ),
        cItemName: expenseName(item, `Item ${index + 1}`),
        cComment: expenseRemarks(item),
        nAmount: expenseAmount(item),
        nClaimedAmount: expenseAmount(item),
        nApprovedAmount: approvedAmounts[key] ?? expenseAmount(item),
        cApprovalComment: approvalComments[key] ?? "",
      };
    });
    const updatedApprovedAmount = [...travelExpensesDtls, ...otherExpensesDtls].reduce(
      (total, item) => total + number(item.nApprovedAmount),
      0,
    );
    const payload = {
      nApprovalId: approvalId,
      nApprovalDtlId: approvalDetailId,
      nAgentId: approvalAgentId,
      nCreatedBy: currentAgentId,
      nTotalTravelExpense: travelAmount,
      nTotalOtherExpenseExpense: otherAmount,
      nClaimedAmount: claimedAmount,
      nApprovedAmount: updatedApprovedAmount,
      nApprovedBy: currentAgentId,
      expenseApprovalDtls: [
        {
          nApprovalDtlId: approvalDetailId,
          nApprovedAmount: updatedApprovedAmount,
          travelExpensesDtls,
          otherExpensesDtls,
        },
      ],
      nCompanyId: context.nCompanyId,
      cSchemaName: context.cSchemaName,
      cDbName: context.cDbName,
    };

    try {
      setIsSaving(true);
      const result = await approvalApis.expenseApprovalUpdate(payload);
      message.success(text((result as any)?.message, "Expense approval updated successfully."));
      setIsEditing(false);
      setEditingAmountKey("");
      navigate(-1);
    } catch (error: any) {
      message.error(
        text(
          error?.response?.data?.message ?? error?.response?.data?.title,
          "Unable to update expense approval.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white px-5 py-3 text-[14px] text-[#062a55]">
      <header className="mb-2 flex flex-none items-center justify-between">
        <h1 className="m-0 text-xl font-medium leading-7 text-black">Expense Approval</h1>
        <button
          type="button"
          aria-label="Close expense details"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center border-0 bg-transparent text-slate-900 hover:bg-slate-100"
        >
          <CloseOutlined className="text-lg" />
        </button>
      </header>

      <div className="relative flex flex-none items-center gap-4 rounded-md bg-[#eaf4fb] px-3 py-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#8FCFF4] text-base font-medium text-slate-800">
          {initials || "EP"}
        </div>
        <div>
          <div className="text-[15px] font-semibold text-slate-900">{agentName}</div>
          <div className="text-xs text-slate-500">{department}</div>
        </div>
        <div className="ml-auto mr-2 mt-5 flex items-center gap-7 whitespace-nowrap text-sm">
          <div>
            <span className="mr-2">Claimed Expense</span>
            <strong className="text-base font-medium text-amber-400">
              {formatCurrency(claimedAmount)}
            </strong>
          </div>
          <div>
            <span className="mr-2">Approved Expense</span>
            <strong className="text-base font-medium text-amber-400">
              {formatCurrency(approvedTotal)}
            </strong>
          </div>
        </div>
        <span className="absolute right-3 top-2 text-xs text-slate-500">{date}</span>
      </div>

      <div className="relative mt-2 min-h-0 flex-1">
        {loading ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60">
            <Spin />
          </div>
        ) : null}
        <div className="grid h-full min-h-0 grid-cols-2 overflow-hidden border border-slate-200">
          <div className="flex min-h-0 flex-col bg-white">
            <div className="grid min-h-[38px] grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-3 border-b border-slate-200 px-3 py-2 text-sm">
              <strong className="leading-5">Claimed Travel expense</strong>
              <span className="text-blue-600">{formatCurrency(travelAmount)}</span>
              <strong>Approved</strong>
              <span className="text-blue-600">{formatCurrency(approvedTravel)}</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-7 py-4">
              {travelRows.length ? (
                <div className="space-y-4">
                  {travelRows.map((item, index) => {
                    const travel = travelDetails(item);
                    if (!travel.hasCheckDetails) {
                      return (
                        <div
                          key={index}
                          className="mx-auto grid max-w-[290px] grid-cols-[26px_minmax(0,1fr)] gap-x-3 text-[13px] text-[#13395d]"
                        >
                          <EnvironmentOutlined className="text-[17px] text-[#00699c]" />
                          <div>
                            <div className="font-medium text-[#173652]">
                              {travel.startTime}
                            </div>
                            <div className="mt-1 font-medium text-[#173652]">
                              Punch In Location :
                            </div>
                            <div className="mt-1 text-[12px] text-slate-500">
                              {travel.startLocation}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={index} className="mx-auto max-w-[290px] text-[13px] text-[#13395d]">
                        <div className="grid grid-cols-[26px_minmax(0,1fr)] gap-x-3">
                          <div className="flex flex-col items-center">
                            <EnvironmentOutlined className="text-[17px] text-[#00699c]" />
                            <div className="relative my-1 min-h-16 flex-1 border-l border-dashed border-[#b9d8d2]">
                              <span className="absolute right-3 top-1/2 w-9 -translate-y-1/2 text-[10px] text-slate-400">
                                {travel.distance} Km
                              </span>
                            </div>
                            <span className="h-3 w-3 rounded-full border-2 border-[#17a85b] bg-white" />
                          </div>
                          <div>
                            <div className="font-medium text-[#173652]">{travel.startTime}</div>
                            <div className="mt-1 font-medium text-[#173652]">
                              Punch In Location :
                            </div>
                            <div className="mt-1 min-h-9 text-[12px] text-slate-500">
                              {travel.startLocation}
                            </div>
                            <div className="font-medium text-[#173652]">{travel.endTime}</div>
                            <div className="mt-1 text-[12px] text-slate-500">
                              {travel.endLocation}
                            </div>
                            <div className="mt-3 flex items-center gap-1 font-medium text-[#173652]">
                              <UserOutlined className="text-base" />
                              {travel.employee}
                            </div>
                            <div className="mt-2 overflow-hidden rounded border border-[#63aaf8] bg-white">
                              <div className="flex items-center gap-2 bg-[#4e86f7] px-3 py-1.5 text-[12px] font-medium text-white">
                                <EnvironmentOutlined />
                                <span>{travel.activity}</span>
                                <span className="text-blue-200">|</span>
                                <UserOutlined />
                                <span>{travel.employee}</span>
                              </div>
                              <div className="space-y-1 px-3 py-2">
                                <div>
                                  <span className="font-medium">Travel Mode : </span>
                                  {travel.mode}
                                </div>
                                <div>
                                  <span className="font-medium">Comment : </span>
                                  {travel.comment}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 border-t border-dashed border-[#63aaf8] px-3 py-2 text-[12px]">
                                <span className="font-medium">Claim Details -</span>
                                <span>Travel Mode : {travel.mode}</span>
                                <span className="ml-auto whitespace-nowrap">
                                  Amount : {formatCurrency(expenseAmount(item))}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Empty
                    image={noDataImage}
                    imageStyle={{ height: 126 }}
                    description={<span className="text-base text-black">No Data!</span>}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col border-l border-slate-200 bg-[#eaf4fb]">
            <div className="grid min-h-[58px] grid-cols-[minmax(88px,1fr)_auto_auto_auto] items-center gap-x-2 border-b border-slate-200 px-3 py-2 text-sm">
              <strong className="leading-5">Claimed Other expense</strong>
              <span className="whitespace-nowrap text-blue-600">
                {formatCurrency(otherAmount)}
              </span>
              <strong className="whitespace-nowrap">Approved</strong>
              <span className="whitespace-nowrap text-blue-600">
                {formatCurrency(approvedOther)}
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
              {otherRows.length ? (
                <div className="space-y-1">
                  {otherRows.map((item, index) => {
                    const remarks = expenseRemarks(item);
                    const attachments = expenseAttachments(item, allRows);
                    const rowKey = expenseRowKey("other", item, index);
                    const approvedAmount =
                      approvedAmounts[rowKey] ?? expenseAmount(item);
                    return (
                      <div
                        key={rowKey}
                        role={!isEditing ? "button" : undefined}
                        tabIndex={!isEditing ? 0 : undefined}
                        onClick={() => {
                          if (!isEditing) setSelectedExpense(item);
                        }}
                        onKeyDown={(event) => {
                          if (!isEditing && (event.key === "Enter" || event.key === " ")) {
                            setSelectedExpense(item);
                          }
                        }}
                        className={`rounded border border-sky-300 bg-white text-sm ${
                          !isEditing ? "cursor-pointer hover:border-sky-500" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 px-3 py-2.5">
                          <div>
                            <div className="font-normal leading-5 text-[#063462]">
                              {expenseName(item, `Item ${index + 1}`)}
                            </div>
                            {remarks ? (
                              <div className="text-[13px] leading-5 text-[#25496c]">
                                ({remarks})
                              </div>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <strong>{formatCurrency(approvedAmount)}</strong>
                            {isEditing ? (
                              <button
                                type="button"
                                aria-label={`Edit ${expenseName(item, "expense")} amount`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setEditingAmountKey(rowKey);
                                }}
                                className="flex h-6 w-6 items-center justify-center border-0 bg-transparent text-slate-900"
                              >
                                <EditOutlined />
                              </button>
                            ) : null}
                          </div>
                        </div>
                        {attachments.length ? (
                          <Image.PreviewGroup>
                            <div className="mx-3 mb-2 flex w-fit flex-wrap gap-2 rounded border border-[#063462] bg-white p-1">
                              {attachments.map((url, attachmentIndex) => (
                                <Image
                                  key={`${url}-${attachmentIndex}`}
                                  src={url}
                                  width={82}
                                  height={82}
                                  className="rounded object-cover"
                                  alt={`${expenseName(item, "Expense")} attachment`}
                                />
                              ))}
                            </div>
                          </Image.PreviewGroup>
                        ) : null}
                        {isEditing && editingAmountKey === rowKey ? (
                          <div className="border-t border-sky-200 bg-white px-3 py-2">
                            <label className="block text-[12px] text-slate-600">
                              Amount
                              <InputNumber
                                autoFocus
                                min={0}
                                value={approvedAmount}
                                controls={false}
                                className="mt-1 block w-28"
                                onChange={(value) =>
                                  setApprovedAmounts((current) => ({
                                    ...current,
                                    [rowKey]: number(value),
                                  }))
                                }
                              />
                            </label>
                            <label className="mt-2 block text-[12px] text-slate-600">
                              Comment
                              <textarea
                                value={approvalComments[rowKey] ?? remarks}
                                onChange={(event) =>
                                  setApprovalComments((current) => ({
                                    ...current,
                                    [rowKey]: event.target.value,
                                  }))
                                }
                                rows={4}
                                className="mt-1 block w-full resize-y rounded border border-slate-300 px-2 py-2 text-sm text-slate-700 outline-none focus:border-sky-400"
                              />
                            </label>
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setEditingAmountKey("")}
                                className="rounded bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-600"
                              >
                                Ok
                              </button>
                            </div>
                          </div>
                        ) : isEditing ? (
                          <>
                            <div className="border-t border-sky-200 bg-[#eaf7fd] px-3 py-2 text-[12px]">
                              <div className="font-medium text-[#173652]">Comment:</div>
                              <input
                                aria-label={`Approval comment for ${expenseName(item, "expense")}`}
                                value={approvalComments[rowKey] ?? remarks}
                                onChange={(event) =>
                                  setApprovalComments((current) => ({
                                    ...current,
                                    [rowKey]: event.target.value,
                                  }))
                                }
                                className="mt-1 w-full border-0 bg-transparent p-0 text-slate-500 outline-none"
                              />
                            </div>
                            <div className="flex items-center gap-4 border-t border-dashed border-sky-300 px-3 py-2 text-[12px]">
                              <span className="font-medium">Claimed Details -</span>
                              <span className="ml-auto">
                                Amount : {formatCurrency(expenseAmount(item))}
                              </span>
                            </div>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Empty
                    image={noDataImage}
                    imageStyle={{ height: 126 }}
                    description={<span className="text-base text-black">No Data!</span>}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-none justify-end">
        {isEditing ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="min-w-20 rounded bg-emerald-500 px-5 py-2 font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        ) : (
          <button
            type="button"
            aria-label="Edit expense approval"
            onClick={startEditing}
            className="flex h-9 w-9 items-center justify-center rounded border border-slate-800 bg-white hover:bg-slate-50"
          >
            <EditOutlined className="text-lg" />
          </button>
        )}
      </div>

      <Drawer
        open={Boolean(selectedExpense)}
        placement="right"
        width={500}
        closable={false}
        onClose={() => setSelectedExpense(null)}
        bodyStyle={{ padding: 20 }}
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Expense</span>
            <button
              type="button"
              aria-label="Close expense"
              onClick={() => setSelectedExpense(null)}
              className="flex h-8 w-8 items-center justify-center border-0 bg-transparent text-black"
            >
              <CloseOutlined className="text-lg" />
            </button>
          </div>
        }
      >
        {selectedExpense ? (
          <div className="text-sm text-slate-700">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-medium text-[#07588d]">
                  {expenseName(selectedExpense, "Expense")}
                </div>
                <div className="mt-2 text-slate-500">
                  {expenseRemarks(selectedExpense)}
                </div>
              </div>
              <div className="text-base text-slate-800">
                {formatCurrency(expenseAmount(selectedExpense))}
              </div>
            </div>
            {expenseAttachments(selectedExpense, allRows).length ? (
              <div className="mt-5">
                <div className="mb-2 font-medium text-slate-700">File</div>
                <Image.PreviewGroup>
                  <div className="flex flex-wrap gap-3">
                    {expenseAttachments(selectedExpense, allRows).map(
                      (url, attachmentIndex) => (
                        <Image
                          key={`${url}-${attachmentIndex}`}
                          src={url}
                          width={200}
                          height={200}
                          className="rounded object-cover shadow"
                          alt={`${expenseName(selectedExpense, "Expense")} file`}
                        />
                      ),
                    )}
                  </div>
                </Image.PreviewGroup>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </section>
  );
};

export default ExpenseApprovalDetailPage;
