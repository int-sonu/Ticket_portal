import { extractList } from "../../Master/Common/SimpleMasterUtils";

export type LeaveApprovalRecord = Record<string, unknown>;

export const getValue = (record: unknown, keys: string[]) => {
  if (!record || typeof record !== "object") return "";
  const source = record as LeaveApprovalRecord;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") return source[key];
  }
  const matched = Object.keys(source).find((key) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
  );
  return matched ? source[matched] : "";
};

export const text = (value: unknown, fallback = "N/A") => String(value ?? "").trim() || fallback;

export const extractRows = (response: unknown): LeaveApprovalRecord[] => {
  const rows = new Map<string, LeaveApprovalRecord>();
  const visited = new Set<unknown>();

  const collect = (value: unknown) => {
    if (!value || typeof value !== "object" || visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }

    const record = value as LeaveApprovalRecord;
    const leaveId = getValue(record, ["nLeaveId", "LeaveId", "leaveId"]);
    const refNo = getValue(record, ["nLeaveRefNo", "cLeaveRefNo", "cRefNo", "RefNo"]);
    const isLeaveRecord = leaveId !== "" || (
      refNo !== "" && getValue(record, ["cReason", "Reason", "dLeaveFrom", "cName"]) !== ""
    );

    if (isLeaveRecord) {
      const key = leaveId !== ""
        ? `id-${leaveId}`
        : `ref-${refNo}-${getValue(record, ["cName", "Name"])}-${getValue(record, ["cReason", "Reason"])}`;
      rows.set(key, record);
    }

    Object.values(record).forEach(collect);
  };

  collect(response);
  if (rows.size) return [...rows.values()];
  return extractList(response) as LeaveApprovalRecord[];
};

export const extractDetails = (response: unknown, fallback: LeaveApprovalRecord) => {
  const rows = extractRows(response);
  if (rows.length) return rows[0];
  if (!response || typeof response !== "object") return fallback;
  const source = response as LeaveApprovalRecord;
  for (const candidate of [source.data, source.result, source.leaveDetails, source.LeaveDetails]) {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      return candidate as LeaveApprovalRecord;
    }
  }
  return source;
};

export const formatDateTime = (value: unknown) => {
  const source = text(value, "");
  if (!source) return "N/A";
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return source;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).replace(",", "");
};

export const formatDate = (value: unknown) => {
  const source = text(value, "");
  if (!source) return "N/A";
  const dayFirst = source.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (dayFirst) return `${dayFirst[1]}/${dayFirst[2]}/${dayFirst[3]}`;
  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? source : date.toLocaleDateString("en-GB");
};

export const statusText = (record: LeaveApprovalRecord) =>
  text(getValue(record, ["cStatus", "Status", "cLeaveStatus", "LeaveStatus"]), "Pending");
