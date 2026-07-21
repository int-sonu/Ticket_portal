
import dayjs, { type Dayjs } from "dayjs";

import { extractList } from "../Master/Common/SimpleMasterUtils";
import type {
  ExtraFilterDraft,
  ExtraReportKey,
  RecordLike,
  ReportKey,
} from "./reportTypes";

export const text = (value: unknown, fallback = "-") =>
  String(value ?? "").trim() || fallback;

export const toOptionalInt = (value: unknown) => {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized.toLowerCase() === "all") return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getValue = (record: RecordLike, keys: string[], fallback: unknown = "") => {
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

export const parseDateValue = (value: unknown) => {
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

export const formatDateValue = (value: unknown) => {
  const parsed = parseDateValue(value);
  return parsed ? parsed.toLocaleDateString("en-GB") : "-";
};

export const updateDateRange = <T extends { from: Dayjs; to: Dayjs }>(
  current: T,
  picked: Dayjs,
  field: "from" | "to" | null,
): T => {
  const next = { ...current };
  if (field === "from") {
    next.from = picked;
    if (picked.isAfter(current.to, "day")) next.to = picked;
  } else if (field === "to") {
    next.to = picked;
    if (picked.isBefore(current.from, "day")) next.from = picked;
  }
  return next;
};

export const EXTRA_REPORT_KEYS: ExtraReportKey[] = ["outstanding", "repairParts", "replaceParts", "receipt", "attendance", "leaveApplication", "leaveApproval", "agentList", "incomeExpense", "ticketHistory", "dailyService"];
export const isExtraReportKey = (key: ReportKey): key is ExtraReportKey => EXTRA_REPORT_KEYS.includes(key as ExtraReportKey);
export const createExtraDraft = (): ExtraFilterDraft => ({
  companyId: "", from: dayjs(), to: dayjs(), customerId: "", agentId: "",
  status: "Approved", returnStatus: "All", reportType: "Summary", summaryLevel: "Month wise",
  dateType: "Created Date", ticketId: "", agentIds: [], detailedTravelExpense: false,
});

export const extractRowsFromResponse = (
  response: unknown,
  nestedKeys: string[] = [],
) => {
  const source = (response ?? {}) as RecordLike;
  const sourceData = source.data as RecordLike | undefined;
  const candidates: unknown[] = [
    response,
    sourceData,
    source?.result,
    source?.items,
    source?.list,
  ];

  for (const key of nestedKeys) {
    candidates.push(source[key]);
    candidates.push(sourceData?.[key]);
  }

  for (const candidate of candidates) {
    const rows = extractList(candidate);
    if (rows.length) return rows as RecordLike[];
  }

  const findNestedRows = (value: unknown, seen = new Set<unknown>()): RecordLike[] => {
    if (typeof value === "string" && /^(?:\[|\{)/.test(value.trim())) {
      try { return findNestedRows(JSON.parse(value), seen); } catch { return []; }
    }
    if (!value || typeof value !== "object" || seen.has(value)) return [];
    seen.add(value);

    if (Array.isArray(value)) {
      return value.length && value.every((item) => item && typeof item === "object")
        ? value as RecordLike[]
        : [];
    }

    for (const nested of Object.values(value as RecordLike)) {
      const rows = findNestedRows(nested, seen);
      if (rows.length) return rows;
    }

    return [];
  };

  const preferredKeys = new Set(nestedKeys.map((key) => key.toLowerCase()));
  const findPreferredRecord = (value: unknown, seen = new Set<unknown>()): RecordLike[] => {
    if (typeof value === "string" && /^(?:\[|\{)/.test(value.trim())) {
      try { return findPreferredRecord(JSON.parse(value), seen); } catch { return []; }
    }
    if (!value || typeof value !== "object" || seen.has(value)) return [];
    seen.add(value);

    for (const [key, nested] of Object.entries(value as RecordLike)) {
      if (preferredKeys.has(key.toLowerCase()) && nested && typeof nested === "object") {
        if (Array.isArray(nested)) return nested as RecordLike[];
        const nestedRows = findNestedRows(nested);
        return nestedRows.length ? nestedRows : [nested as RecordLike];
      }
    }

    for (const nested of Object.values(value as RecordLike)) {
      const rows = findPreferredRecord(nested, seen);
      if (rows.length) return rows;
    }
    return [];
  };

  const preferredRows = findPreferredRecord(response);
  if (preferredRows.length) return preferredRows;

  return findNestedRows(response);
};

export const extractSelectOptions = (
  response: unknown,
  labelKeys: string[],
  valueKeys: string[],
) =>
  extractRowsFromResponse(response).map((row, index) => ({
    label: text(getValue(row, labelKeys), "All"),
    value: String(getValue(row, valueKeys, index)),
  }));

export const getGeneratedBy = () => {
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

