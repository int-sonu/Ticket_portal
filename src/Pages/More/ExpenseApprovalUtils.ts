import { extractList } from "../Master/Common/SimpleMasterUtils";

export type ExpenseApprovalRecord = Record<string, unknown>;

export const getValue = (record: unknown, keys: string[]) => {
  if (!record || typeof record !== "object") return "";
  const source = record as ExpenseApprovalRecord;

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }

  const matched = Object.keys(source).find((key) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
  );

  return matched ? source[matched] : "";
};

export const text = (value: unknown, fallback = "N/A") =>
  String(value ?? "").trim() || fallback;

export const number = (value: unknown, fallback = 0) => {
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isApprovalRow = (record: ExpenseApprovalRecord) => {
  const hasId = getValue(record, [
    "nExpenseApprovalId",
    "ExpenseApprovalId",
    "nExpenseId",
    "ExpenseId",
    "id",
  ]) !== "";

  const hasContent =
    getValue(record, ["cAgentName", "AgentName", "cName", "Name"]) !== "" ||
    getValue(record, ["dDate", "Date", "cDate"]) !== "" ||
    getValue(record, ["dFromDate", "FromDate", "cFromDate"]) !== "" ||
    getValue(record, ["dTodate", "dToDate", "ToDate", "cToDate"]) !== "" ||
    getValue(record, ["cPeriod", "Period"]) !== "" ||
    getValue(record, ["nTravelExpense", "TravelExpense", "nTravelExpenseAmount"]) !== "" ||
    getValue(record, ["nOtherExpense", "OtherExpense", "nOtherExpenseAmount"]) !== "" ||
    getValue(record, ["nClaimedExpense", "ClaimedExpense", "nClaimedAmount", "nTotalExpenseAmount"]) !== "" ||
    getValue(record, ["nApprovedExpense", "ApprovedExpense", "nApprovedAmount"]) !== "";

  return hasId || hasContent;
};

export const extractRows = (response: unknown): ExpenseApprovalRecord[] => {
  const rows = new Map<string, ExpenseApprovalRecord>();
  const visited = new Set<unknown>();

  const collect = (value: unknown) => {
    if (!value || typeof value !== "object" || visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }

    const record = value as ExpenseApprovalRecord;
    if (isApprovalRow(record)) {
      const id = getValue(record, [
        "nExpenseApprovalId",
        "ExpenseApprovalId",
        "nExpenseId",
        "ExpenseId",
        "id",
      ]);
      const rowSignature = [
        getValue(record, ["dCreatedDate", "CreatedDate", "dDate", "Date", "cDate"]),
        getValue(record, ["cAgentName", "AgentName", "cName", "Name"]),
        getValue(record, ["cGroupName", "GroupName"]),
        getValue(record, ["nTotalTravelAmount", "nTravelExpenseAmount", "nTravelExpense", "TravelExpense"]),
        getValue(record, ["nTotalOtherAmount", "nOtherExpenseAmount", "nOtherExpense", "OtherExpense"]),
        getValue(record, ["nTotalExpenseAmount", "nTotalExpense", "TotalExpense", "nClaimedAmount", "ClaimedAmount"]),
      ]
        .map((value) => String(value ?? "").trim())
        .join("|");
      const key =
        id !== ""
          ? `id-${id}-${rowSignature}`
          : `row-${rowSignature || rows.size}-${Object.keys(record).join("|")}`;
      rows.set(key, record);
    }

    Object.values(record).forEach(collect);
  };

  collect(response);
  if (rows.size) return [...rows.values()];
  return extractList(response) as ExpenseApprovalRecord[];
};

export const extractDetails = (response: unknown, fallback: ExpenseApprovalRecord) => {
  const rows = extractRows(response);
  if (rows.length) return rows[0];
  if (!response || typeof response !== "object") return fallback;

  const source = response as ExpenseApprovalRecord;
  for (const candidate of [
    source.data,
    source.result,
    source.details,
    source.periodList,
    source.expenseApprovalPeriodList,
    source.ExpenseApprovalPeriodList,
  ]) {
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      return candidate as ExpenseApprovalRecord;
    }
  }

  return source;
};

export const formatDateTime = (value: unknown) => {
  const source = text(value, "");
  if (!source) return "N/A";

  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return source;

  return date
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", "");
};

export const formatDate = (value: unknown) => {
  const source = text(value, "");
  if (!source) return "N/A";

  const dayFirst = source.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (dayFirst) return `${dayFirst[1]}/${dayFirst[2]}/${dayFirst[3]}`;

  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? source : date.toLocaleDateString("en-GB");
};

export const formatCurrency = (value: unknown) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(number(value, 0));

export const isActiveRow = (record: ExpenseApprovalRecord) => {
  const activeValue = getValue(record, [
    "bActive",
    "isActive",
    "active",
    "cActive",
    "Active",
  ]);

  if (activeValue === "") return true;

  if (typeof activeValue === "boolean") {
    return activeValue;
  }

  const normalized = String(activeValue).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "y" || normalized === "yes" || normalized === "active";
};
