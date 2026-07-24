import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Empty, Modal, Spin, message } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";

import { billingApis } from "../../Axios/BillingApis";
import { approvalApis } from "../../Axios/MoreApis";
import { settingsApis } from "../../Axios/SettingsApi";
import { getApiImageBaseUrl } from "../../Axios/config";
import { getRequestPayload } from "../../Utils/requestPayload";
import previewIcon from "../../assets/Bills/PreviewIcon.png";
import pdfIcon from "../../assets/Bills/PrintIcon.png";
import shareIcon from "../../assets/Bills/ShareIcon.png";
import shared from"../../assets/Bills/shared.svg";
import mailImage from "../../assets/images/mailImg.png";
import filtericon from "../../assets/Bills/filter.svg";
import {
  useApprovalPendingExpenseList,
  useApproveExpenseApproval,
  useExpenseApprovalPeriodList,
} from "./ExpenseApprovalHooks";
import {
  extractDetails,
  extractRows,
  formatCurrency,
  formatDate,
  formatDateTime,
  getValue,
  isActiveRow,
  number,
  text,
} from "./ExpenseApprovalUtils";
import type { ExpenseApprovalRecord } from "./ExpenseApprovalUtils";
import CalendarPopup from "../../ui/CalendarPopup/CalendarPopup";
import { usePrintPdf } from "../../Hooks/usePrintPdf";

type LocationState = {
  approvalId?: number;
  expenseApprovalId?: number;
  nAgentId?: number;
  cAgentId?: string;
  approval?: ExpenseApprovalRecord;
  fromDate?: string;
  toDate?: string;
  tripModes?: unknown;
  approvalViewData?: unknown;
  fromPending?: boolean;
} | null;

const ensureAbsoluteUrl = (maybePath?: string) => {
  const path = String(maybePath ?? "").trim();
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;

  try {
    const base = getApiImageBaseUrl().replace(/\/+$/, "");
    const cleanPath = path.replace(/^\/+/, "");
    return `${base}/${cleanPath}`;
  } catch {
    return path;
  }
};

const getExpenseApprovalPdfUrl = (response: any) => {
  const responseData = response?.data ?? response ?? {};
  const candidates = [
    typeof responseData?.data === "string" ? responseData.data : "",
    responseData?.data?.pdfPath,
    responseData?.data?.cPdfPath,
    responseData?.data?.filePath,
    responseData?.data?.path,
    responseData?.data?.pdfUri,
    responseData?.data?.pdfUrl,
    responseData?.data?.url,
    responseData?.data?.message,
    responseData?.pdfPath,
    responseData?.cPdfPath,
    responseData?.filePath,
    responseData?.path,
    responseData?.pdfUri,
    responseData?.pdfUrl,
    responseData?.url,
    responseData?.message,
    typeof responseData === "string" ? responseData : "",
  ];

  const match = candidates.find((item) => typeof item === "string" && item.trim());
  return typeof match === "string" ? match.trim() : "";
};

const parseDateValue = (value: unknown) => {
  const source = String(value ?? "").trim();
  if (!source) return null;

  const match = source.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    const parsed = dayjs(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    return parsed.isValid() ? parsed.startOf("day") : null;
  }

  const parsed = dayjs(source);
  return parsed.isValid() ? parsed.startOf("day") : null;
};

const extractTopLevelRows = (response: unknown) => {
  const visited = new Set<unknown>();
  const arrayKeys = [
    "expenseApprovalDtls",
    "ExpenseApprovalDtls",
    "expenseApprovalDetails",
    "ExpenseApprovalDetails",
    "expenseApprovalPeriodList",
    "ExpenseApprovalPeriodList",
    "expenseDetails",
    "ExpenseDetails",
    "data",
    "Data",
    "result",
    "Result",
    "items",
    "Items",
    "list",
    "List",
  ];

  const findRows = (value: unknown): Record<string, unknown>[] => {
    if (!value || typeof value !== "object" || visited.has(value)) return [];
    visited.add(value);

    if (Array.isArray(value)) {
      return value as Record<string, unknown>[];
    }

    const source = value as Record<string, unknown>;
    for (const key of arrayKeys) {
      const candidate = source[key];
      if (Array.isArray(candidate)) {
        return candidate as Record<string, unknown>[];
      }
    }

    for (const nestedKey of [
      "data",
      "Data",
      "result",
      "Result",
      "details",
      "Details",
      "expenseDetails",
      "ExpenseDetails",
      "expenseApprovalDetails",
      "ExpenseApprovalDetails",
      "periodList",
      "PeriodList",
    ]) {
      const nested = source[nestedKey];
      const nestedRows = findRows(nested);
      if (nestedRows.length) return nestedRows;
    }

    return [];
  };

  return findRows(response);
};

const normalizeRecord = (value: unknown): Record<string, unknown> => {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? {};
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
};

const findConfigurationEmail = (response: unknown) => {
  const queue: unknown[] = [response];
  const visited = new Set<unknown>();
  const aliases = [
    "cEmail",
    "email",
    "cEmailId",
    "emailId",
    "cMailId",
    "mailId",
    "cFromEmail",
    "fromEmail",
  ];

  while (queue.length) {
    const value = queue.shift();
    if (!value || typeof value !== "object" || visited.has(value)) continue;
    visited.add(value);
    const record = value as Record<string, unknown>;
    const email = getValue(record, aliases);
    if (typeof email === "string" && email.trim()) return email.trim();
    Object.values(record).forEach((item) => queue.push(item));
  }
  return "";
};

const ExpenseApprovalViewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const fallback = state?.approval ?? {};
  const approvalId =
    Number(
      state?.approvalId ??
        getValue(fallback, [
          "nApprovalId",
          "ApprovalId",
          "nApprovalID",
          "ApprovalID",
        ]),
    ) || 0;
  const expenseApprovalId =
    Number(
      state?.expenseApprovalId ??
        getValue(fallback, [
          "nExpenseApprovalId",
          "ExpenseApprovalId",
          "nExpenseId",
          "ExpenseId",
          "id",
        ]),
    ) || 0;
  const agentId =
    Number(
      state?.nAgentId ??
        getValue(fallback, [
          "nAgentId",
          "AgentId",
          "AgentID",
        ]),
    ) || 0;
  const cAgentId = text(
    state?.cAgentId ?? getValue(fallback, ["cAgentId", "AgentId", "AgentID"]),
    "",
  );
  const defaultFromDate =
    parseDateValue(state?.fromDate) ??
    parseDateValue(getValue(fallback, ["dFromDate", "FromDate", "cFromDate"])) ??
    dayjs().startOf("month");
  const defaultToDate =
    parseDateValue(state?.toDate) ??
    parseDateValue(getValue(fallback, ["dToDate", "ToDate", "cToDate"])) ??
    dayjs().startOf("day");
  const detailQueryEnabled = Boolean(
    state?.approval || state?.fromDate || state?.toDate || approvalId > 0,
  );

  // Pre-fetched data passed from the list page on row click
  const prefetchedApprovalViewData = state?.approvalViewData ?? null;


  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFromDate, setDraftFromDate] = useState<Dayjs>(defaultFromDate);
  const [draftToDate, setDraftToDate] = useState<Dayjs>(defaultToDate);
  const [appliedFromDate, setAppliedFromDate] = useState<Dayjs>(defaultFromDate);
  const [appliedToDate, setAppliedToDate] = useState<Dayjs>(defaultToDate);
  const [calendarMonth, setCalendarMonth] = useState(defaultToDate.startOf("month"));
  const [approvalSuccessOpen, setApprovalSuccessOpen] = useState(false);
  const [approvalCompleted, setApprovalCompleted] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { printPdf } = usePrintPdf({ extraWaitMs: 500 });
  const [isPrinting, setIsPrinting] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareEmails, setShareEmails] = useState<string[]>([]);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [openingPeriodId, setOpeningPeriodId] = useState<string | null>(null);
  const approvalMutation = useApproveExpenseApproval();
  const requestPayload = getRequestPayload();
  const companyContextPayload = useMemo(() => {
    const approvalRecord = normalizeRecord(fallback);
    const nCompanyId =
      Number(
        requestPayload.nCompanyId ??
          getValue(approvalRecord, ["nCompanyId", "CompanyId", "companyId"]),
      ) || 0;
    const cSchemaName = text(
      requestPayload.cSchemaName ??
        getValue(approvalRecord, ["cSchemaName", "SchemaName", "companyCode", "CompanyCode"]),
      "",
    );
    const cDbName = text(
      requestPayload.cDbName ??
        getValue(approvalRecord, ["cDbName", "DbName", "databaseName", "DatabaseName"]),
      "",
    );

    return { nCompanyId, cSchemaName, cDbName };
  }, [fallback, requestPayload.cDbName, requestPayload.cSchemaName, requestPayload.nCompanyId]);

  const previewPayload = useMemo(
    () => ({
      nCompanyId: companyContextPayload.nCompanyId,
      cSchemaName: companyContextPayload.cSchemaName,
      cDbName: companyContextPayload.cDbName,
    }),
    [companyContextPayload],
  );

  const { data: companyDetailsResponse, isFetching: companyDetailsLoading } = useQuery({
    queryKey: ["expense-approval-company-details", previewPayload],
    queryFn: () => billingApis.companyDetails(previewPayload),
    enabled:
      previewOpen &&
      Boolean(
        previewPayload.nCompanyId &&
          previewPayload.cSchemaName &&
          previewPayload.cDbName,
      ),
  });

  const configurationQuery = useQuery({
    queryKey: ["expense-share-configuration", previewPayload],
    queryFn: () => settingsApis.getConfiguration(previewPayload),
    enabled:
      shareModalOpen &&
      Boolean(
        previewPayload.nCompanyId &&
          previewPayload.cSchemaName &&
          previewPayload.cDbName,
      ),
  });

  useEffect(() => {
    const configuredEmail = findConfigurationEmail(configurationQuery.data);
    if (!configuredEmail) return;
    const configuredEmails = configuredEmail
      .split(/[;,]/)
      .map((email) => email.trim())
      .filter(Boolean);
    setShareEmails((current) => [...new Set([...current, ...configuredEmails])]);
  }, [configurationQuery.data]);

  const payload = useMemo(() => {
    const { nCompanyId, cSchemaName, cDbName } = requestPayload;

    return {
      nApprovalId: approvalId,
      nCompanyId,
      cSchemaName,
      cDbName,
    };
  }, [approvalId, requestPayload]);

  const pendingExpensePayload = useMemo(
    () => ({
      nAgentId: agentId,
      dFromDate: appliedFromDate.format("YYYY/MM/DD"),
      dToDate: appliedToDate.format("YYYY/MM/DD"),
      nCompanyId: companyContextPayload.nCompanyId,
      cSchemaName: companyContextPayload.cSchemaName,
      cDbName: companyContextPayload.cDbName,
    }),
    [
      agentId,
      appliedFromDate,
      appliedToDate,
      companyContextPayload,
    ],
  );
  const periodDetailsQuery = useExpenseApprovalPeriodList(
    payload,
    detailQueryEnabled && !state?.fromPending,
  );
  const pendingDetailsQuery = useApprovalPendingExpenseList(
    pendingExpensePayload,
    detailQueryEnabled && Boolean(state?.fromPending),
  );
  const detailsQuery = state?.fromPending ? pendingDetailsQuery : periodDetailsQuery;
  const details = extractDetails(detailsQuery.data ?? prefetchedApprovalViewData, fallback);
  const companyDetails = normalizeRecord(
    companyDetailsResponse?.data?.data ?? companyDetailsResponse?.data ?? companyDetailsResponse ?? {},
  );
  const periodRows = useMemo(
    () => {
      const source = detailsQuery.data ?? prefetchedApprovalViewData;
      const topLevelRows = extractTopLevelRows(source).filter(isActiveRow);
      if (topLevelRows.length) return topLevelRows;
      return extractRows(source).filter(isActiveRow);
    },
    [detailsQuery.data, prefetchedApprovalViewData],
  );


  const value = (keys: string[]) => getValue(details, keys) || getValue(fallback, keys);
  const agentName = text(value(["cAgentName", "AgentName", "cName", "Name"]), "Expense Approval");
  const initials = agentName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const summaryPeriod =
    text(value(["cPeriod", "Period"]), "") ||
    `${text(value(["dFromDate", "FromDate", "cFromDate"]), "")} - ${text(value(["dToDate", "ToDate", "cToDate"]), "")}`;

  const summaryTotals = useMemo(() => {
    return periodRows.reduce<{
      travel: number;
      other: number;
      claimed: number;
      approved: number;
      total: number;
    }>(
      (acc, row) => {
        const travelAmount = number(
          getValue(row, [
            "nTotalTravelAmount",
            "nTravelExpenseAmount",
            "nTravelExpense",
            "TravelExpense",
          ]),
        );
        const otherAmount = number(
          getValue(row, [
            "nTotalOtherAmount",
            "nOtherExpenseAmount",
            "nOtherExpense",
            "OtherExpense",
          ]),
        );
        const totalAmount = number(
          getValue(row, [
            "nTotalExpenseAmount",
            "nClaimedAmount",
            "ClaimedAmount",
            "nClaimedExpense",
            "ClaimedExpense",
            "nApprovedExpense",
            "ApprovedExpense",
            "nApprovedAmount",
          ]),
        ) || travelAmount + otherAmount;
        const claimedAmount = number(
          getValue(row, [
            "nTotalExpenseAmount",
            "nClaimedAmount",
            "ClaimedAmount",
            "nClaimedExpense",
            "ClaimedExpense",
          ]),
        ) || totalAmount;
        const approvedAmount = number(
          getValue(row, [
            "nApprovedExpense",
            "ApprovedExpense",
            "nApprovedAmount",
          ]),
        ) || totalAmount;

        acc.travel += travelAmount;
        acc.other += otherAmount;
        acc.claimed += claimedAmount;
        acc.approved += approvedAmount;
        acc.total += totalAmount;
        return acc;
      },
      { travel: 0, other: 0, claimed: 0, approved: 0, total: 0 },
    );
  }, [periodRows]);
  const previewCompanyName = text(
    getValue(companyDetails, [
      "cCompanyName",
      "cComapnyName",
      "companyName",
      "cName",
      "Name",
    ]),
    agentName,
  );
  const previewCompanyAddress = text(
    getValue(companyDetails, [
      "cAddress",
      "address",
      "cCompanyAddress",
      "companyAddress",
    ]),
    "",
  );
  const previewCompanyEmail = text(
    getValue(companyDetails, [
      "cEmail",
      "email",
      "cCompanyEmail",
      "cMail",
    ]),
    "",
  );
  const previewCompanyPhone = text(
    getValue(companyDetails, [
      "cPhoneNo",
      "phoneNo",
      "cPhone",
      "cMobileNo",
      "mobileNo",
      "cContactNo",
    ]),
    "",
  );
  const handlePeriodRowClick = async (row: Record<string, unknown>, rowKey: string) => {
    if (openingPeriodId === rowKey) return;
    setOpeningPeriodId(rowKey);

    let tripModes: unknown = null;
    let approvalViewData: unknown = null;
    const approvalDetailId = Number(
      getValue(row, [
        "nApprovaldtlId",
        "nApprovalDtlId",
        "ApprovaldtlId",
        "ApprovalDtlId",
        "nExpensePeriodId",
        "ExpensePeriodId",
        "id",
      ]) || 0,
    );

    try {
      const { nCompanyId, cSchemaName, cDbName } = getRequestPayload();
      const basePayload = { nCompanyId, cSchemaName, cDbName };
      const viewPayload = {
        ...basePayload,
        nApprovalId: approvalId,
        nApprovaldtlId: approvalDetailId,
      };

      [tripModes, approvalViewData] = await Promise.all([
        approvalApis.tripModeListDropdown(basePayload).catch(() => null),
        approvalApis.expenseApprovalView(viewPayload).catch(() => null),
      ]);
    } catch {
      // open with available row data if APIs fail
    } finally {
      setOpeningPeriodId(null);
    }

    navigate("/more/expenseapproval/expenseapprovalview", {
      state: {
        approvalId,
        approvalDetailId,
        expenseApprovalId,
        nAgentId: agentId,
        cAgentId,
        fromDate: appliedFromDate.format("YYYY/MM/DD"),
        toDate: appliedToDate.format("YYYY/MM/DD"),
        approval: fallback,
        periodRow: row,
        tripModes,
        approvalViewData,
      },
    });
  };

  const handleApplyFilter = () => {
    const nextFrom = draftFromDate.isAfter(draftToDate, "day") ? draftToDate : draftFromDate;
    const nextTo = draftToDate.isBefore(draftFromDate, "day") ? draftFromDate : draftToDate;
    setAppliedFromDate(nextFrom);
    setAppliedToDate(nextTo);
    setFilterOpen(false);
  };

  const handleApproveExpense = async () => {
    const currentAgentId =
      Number(requestPayload.id ?? requestPayload.nAgentId ?? 0) || 0;
    const toApiDate = (value: unknown) =>
      (parseDateValue(value) ?? appliedFromDate).format("YYYY/MM/DD");
    const asList = (value: unknown): Record<string, unknown>[] =>
      Array.isArray(value)
        ? value.filter(
            (item): item is Record<string, unknown> =>
              Boolean(item && typeof item === "object"),
          )
        : [];

    const expenseApprovalDtls = periodRows.map((row) => {
      const expenseDetails = normalizeRecord(
        getValue(row, ["expenseDetails", "ExpenseDetails"]),
      );
      const travelRows = asList(
        getValue(expenseDetails, [
          "travelLogData",
          "TravelLogData",
          "travelExpensesDtls",
        ]),
      );
      const otherRows = asList(
        getValue(expenseDetails, [
          "expenseData",
          "ExpenseData",
          "otherExpensesDtls",
        ]),
      );
      const travelTotal = number(
        getValue(row, [
          "nTotalTravelAmount",
          "nTravelExpenseAmount",
          "nTravelExpense",
        ]),
      );
      const otherTotal = number(
        getValue(row, [
          "nTotalOtherAmount",
          "nOtherExpenseAmount",
          "nOtherExpense",
        ]),
      );

      return {
        dExpenseDate: toApiDate(
          getValue(row, ["dCreatedDate", "dDate", "Date"]),
        ),
        cStartingLocation: text(
          getValue(row, ["cStartingLocation", "StartingLocation"]),
          "-",
        ),
        cEndingLocation: text(
          getValue(row, ["cEndingLocation", "EndingLocation"]),
          "-",
        ),
        nTotalTravelExpense: travelTotal,
        nTotalOtherExpenseExpense: otherTotal,
        nClaimedAmount: travelTotal + otherTotal,
        nApprovedAmount: travelTotal + otherTotal,
        travelExpensesDtls: travelRows.map((log) => {
          const claimed = number(getValue(log, ["nAmount", "nClaimedAmount"]));
          return {
            dDate: getValue(log, ["dDate", "Date"]),
            cTime: getValue(log, ["cTime", "Time"]),
            cTypeName: getValue(log, ["cTypeName", "TypeName"]),
            nTripMode: number(getValue(log, ["nTripModeId", "nTripMode"])),
            cModeName: getValue(log, ["cModeName", "ModeName"]),
            nRate: number(getValue(log, ["nRate", "Rate"])),
            nKm: number(getValue(log, ["nKM", "nKm"])),
            cInLocation: getValue(log, ["cInLocation", "InLocation"]),
            cInLattitude: getValue(log, ["cInLattitude", "InLattitude"]),
            cInLongitude: getValue(log, ["cInLongitude", "InLongitude"]),
            cCustomerName: getValue(log, ["cCustomerName", "CustomerName"]),
            nMode: number(getValue(log, ["nMode", "Mode"])),
            nTravelledKm: number(
              getValue(log, ["nTraveledKm", "nTravelledKm"]),
            ),
            nAmount: claimed,
            cNote: getValue(log, ["cNote", "Note"]),
            nStartingKm: number(getValue(log, ["nStartingKm", "StartingKm"])),
            nEndingKm: number(getValue(log, ["nEndingKm", "EndingKm"])),
            nEditedDistance: number(
              getValue(log, ["nEditedDistance", "EditedDistance"]),
            ),
            cStartAttachment: getValue(log, [
              "cStartAttachment",
              "StartAttachment",
            ]),
            cEndAttachment: getValue(log, [
              "cEndAttachment",
              "EndAttachment",
            ]),
            cComment: getValue(log, ["cComment", "Comment"]),
            nExpenseId: number(getValue(log, ["nExpenseId", "ExpenseId"])),
            nApprovedMode: number(
              getValue(log, ["nTripModeId", "nApprovedMode", "nTripMode"]),
            ),
            nApprovedTraveledDistance: number(
              getValue(log, [
                "nTraveledKm",
                "nTravelledKm",
                "nApprovedTraveledDistance",
              ]),
            ),
            nClaimedAmount: claimed,
            nApprovedAmount: claimed,
            cApprovalComment: getValue(log, [
              "cApprovalComment",
              "cComment",
              "Comment",
            ]),
          };
        }),
        otherExpensesDtls: otherRows.map((expense) => {
          const claimed = number(
            getValue(expense, ["nAmount", "nClaimedAmount"]),
          );
          return {
            nExpenseId: number(
              getValue(expense, ["nExpenseId", "ExpenseId"]),
            ),
            cItemName: getValue(expense, [
              "cItemName",
              "cItem",
              "ItemName",
            ]),
            cComment: getValue(expense, ["cComment", "Comment"]),
            nAmount: claimed,
            nClaimedAmount: claimed,
            nApprovedAmount: claimed,
            cApprovalComment: getValue(expense, [
              "cApprovalComment",
              "ApprovalComment",
            ]),
          };
        }),
      };
    });

    try {
      await approvalMutation.mutateAsync({
        nAgentId: agentId,
        nCreatedBy: currentAgentId,
        cPeriod:
          appliedFromDate.isSame(appliedToDate, "day")
            ? appliedFromDate.format("DD/MM/YYYY")
            : `${appliedFromDate.format("DD/MM/YYYY")} - ${appliedToDate.format("DD/MM/YYYY")}`,
        bPeriod: !appliedFromDate.isSame(appliedToDate, "day"),
        dFromDate: appliedFromDate.format("YYYY/MM/DD"),
        dToDate: appliedToDate.format("YYYY/MM/DD"),
        nTotalTravelExpense: summaryTotals.travel,
        nTotalOtherExpenseExpense: summaryTotals.other,
        nClaimedAmount: summaryTotals.claimed || summaryTotals.total,
        nApprovedAmount: summaryTotals.approved || summaryTotals.total,
        nApprovedBy: currentAgentId,
        expenseApprovalDtls,
        nCompanyId: companyContextPayload.nCompanyId,
        cSchemaName: companyContextPayload.cSchemaName,
        cDbName: companyContextPayload.cDbName,
      });
      setApprovalCompleted(true);
      setApprovalSuccessOpen(true);
      message.success("Expense approved successfully");
    } catch (error) {
      const data = (
        error as { response?: { data?: { message?: string; title?: string } } }
      )?.response?.data;
      message.error(data?.message || data?.title || "Unable to approve expense");
    }
  };

  const handlePrintExpense = async () => {
    if (isPrinting) return;

    const companyId = Number(companyContextPayload.nCompanyId ?? 0) || 0;
    const schemaName = String(companyContextPayload.cSchemaName ?? "").trim();
    const dbName = String(companyContextPayload.cDbName ?? "").trim();

    if (!companyId || !schemaName || !dbName || !approvalId) {
      message.error("Unable to prepare expense print preview.");
      return;
    }

    setIsPrinting(true);
    try {
      const exportResponse = await billingApis.expenseApprovalExportPdf({
        nCompanyId: companyId,
        cSchemaName: schemaName,
        cDbName: dbName,
        nApprovalId: approvalId,
      });

      const pdfUrl = getExpenseApprovalPdfUrl(exportResponse);
      if (!pdfUrl) {
        message.error("Unable to generate expense PDF link.");
        return;
      }

      const absolutePdfUrl = ensureAbsoluteUrl(pdfUrl);
      await printPdf(absolutePdfUrl);
    } catch (error) {
      console.error("Failed to export expense approval PDF", error);
      const apiMessage = text(
        (error as any)?.response?.data?.message ??
          (error as any)?.response?.data?.title,
        "Failed to generate expense print preview.",
      );
      message.error(apiMessage);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSendExpenseMail = async () => {
    if (!shareEmails.length || isSendingMail) {
      if (!shareEmails.length) message.warning("Add at least one email address");
      return;
    }

    const nCompanyId = Number(companyContextPayload.nCompanyId ?? 0) || 0;
    const nAgentId = Number(requestPayload.nAgentId ?? requestPayload.id ?? agentId ?? 0) || 0;
    const cSchemaName = String(companyContextPayload.cSchemaName ?? "");
    const cDbName = String(companyContextPayload.cDbName ?? "");

    if (!approvalId || !nCompanyId || !cSchemaName || !cDbName) {
      message.error("Unable to prepare the expense report email.");
      return;
    }

    setIsSendingMail(true);
    try {
      const exportResponse = await billingApis.expenseApprovalExportPdf({
        nApprovalId: approvalId,
        nCompanyId,
        cSchemaName,
        cDbName,
      });
      const pdfPath = getExpenseApprovalPdfUrl(exportResponse);
      if (!pdfPath) throw new Error("The expense PDF could not be generated.");
      const attachmentUrl = ensureAbsoluteUrl(pdfPath);

      await Promise.all(
        shareEmails.map((toEmail) =>
          approvalApis.sendMail({
            toEmail,
            subject: "Expense Report",
            body: "The expense report is attached to this email.",
            attachmentUrl,
            cType: "ExpenseApproval",
            nAgentId,
            nCompanyId,
            cSchemaName,
            cDbName,
          }),
        ),
      );

      await approvalApis.approvalPendingList({
        nAgentId,
        nCompanyId,
        cSchemaName,
        cDbName,
      });

      setShareModalOpen(false);
      setShareEmail("");
      message.success("Expense report sent successfully.");
      navigate("/more/expenseapproval/pendingapproval");
    } catch (error) {
      const apiError = error as {
        response?: { data?: { message?: string; title?: string } };
        message?: string;
      };
      message.error(
        apiError.response?.data?.message ||
          apiError.response?.data?.title ||
          apiError.message ||
          "Unable to send the expense report.",
      );
    } finally {
      setIsSendingMail(false);
    }
  };

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white px-5 py-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="m-0 text-xl font-medium text-slate-950">Expense Approval</h1>
        <button
          type="button"
          aria-label="Close page"
          onClick={() => navigate("/more/expense-approval")}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent bg-transparent text-slate-950 transition-colors hover:bg-slate-50"
        >
          <CloseOutlined className="text-[18px]" />
        </button>
      </header>

      <div className="min-h-0 flex-1">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-md bg-[#eaf4fb] px-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8FCFF4] text-base font-medium text-slate-700">
              {initials || "EP"}
            </div>
            <div>
              <div className="text-base font-medium text-slate-950">{agentName}</div>
            </div>
          </div>

          {/* <div className="grid grid-cols-2 gap-4 border-y border-slate-200 py-3 text-sm">
            <div>
              Travel Expense:{" "}
              <strong className="ml-2 text-base">
                {formatCurrency(travelExpense)}
              </strong>
            </div>
            <div>
              Other Expense:{" "}
              <strong className="ml-2 text-base">
                {formatCurrency(otherExpense)}
              </strong>
            </div>
            <div>
              Claimed Expense:{" "}
              <strong className="ml-2 text-base">
                {formatCurrency(claimedExpense)}
              </strong>
            </div>
            <div>
              Approved Expense:{" "}
              <strong className="ml-2 text-base">
                {formatCurrency(approvedExpense)}
              </strong>
            </div>
          </div> */}

          <div className="mt-7 min-h-0 flex-1 overflow-hidden border border-slate-200 bg-white">
            {detailsQuery.isFetching ? (
              <div className="flex h-52 items-center justify-center">
                <Spin />
              </div>
            ) : periodRows.length ? (
              <div className="min-h-0">
                <div className="grid grid-cols-[42px_150px_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-700">
                  <span className="whitespace-pre-line leading-tight">
                    Srl
                  </span>
                  <span>Date</span>
                  <span>Starting Location</span>
                  <span>Ending Location</span>
                  <span className="text-right">Travel Expense</span>
                  <span className="text-right">Other Expense</span>
                  <span className="text-right">Claimed Expense</span>
                  <span className="text-right">Approved Expense</span>
                </div>

                <div className="max-h-[calc(100vh-378px)] overflow-y-auto overflow-x-hidden scrollbar-thumb-gray scrollbar-track-slate-100 scrollbar-thin">
                  {periodRows.map((row, index) => {
                    const travelAmount = number(getValue(row, [
                      "nTotalTravelAmount",
                      "nTravelExpenseAmount",
                      "nTravelExpense",
                      "TravelExpense",
                    ]));
                    const otherAmount = number(getValue(row, [
                      "nTotalOtherAmount",
                      "nOtherExpenseAmount",
                      "nOtherExpense",
                      "OtherExpense",
                    ]));
                    const claimedAmount = number(getValue(row, [
                      "nTotalExpenseAmount",
                      "nClaimedAmount",
                      "ClaimedAmount",
                      "nClaimedExpense",
                      "ClaimedExpense",
                    ]));
                    const approvedAmount = number(getValue(row, [
                      "nApprovedExpense",
                      "ApprovedExpense",
                      "nApprovedAmount",
                    ])) || travelAmount + otherAmount;

                    const rowKey = String(
                      getValue(row, [
                        "nExpensePeriodId",
                        "ExpensePeriodId",
                        "nApprovaldtlId",
                        "nApprovalDtlId",
                        "id",
                        "nExpenseApprovalPeriodId",
                      ]) || index,
                    );
                    const isOpening = openingPeriodId === rowKey;

                    return (
                      <button
                        key={rowKey}
                        type="button"
                        disabled={isOpening}
                        onClick={() => { void handlePeriodRowClick(row, rowKey); }}
                        className={`grid min-h-[62px] w-full grid-cols-[42px_150px_1fr_1fr_1fr_1fr_1fr_1fr] items-center border-b border-slate-100 bg-white px-2 text-left text-xs transition-colors hover:bg-sky-50 ${
                          isOpening ? "cursor-wait opacity-60" : "cursor-pointer"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          {isOpening ? (
                            <Spin size="small" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </span>
                        <span>{formatDateTime(getValue(row, ["dCreatedDate", "dApprovalDate", "Date", "dDate", "cDate"]))}</span>
                        <span>{text(getValue(row, ["cStartingLocation", "StartingLocation", "cFromLocation", "FromLocation"]), "-")}</span>
                        <span>{text(getValue(row, ["cEndingLocation", "EndingLocation", "cToLocation", "ToLocation"]), "-")}</span>
                        <span className="text-right">{formatCurrency(travelAmount)}</span>
                        <span className="text-right">{formatCurrency(otherAmount)}</span>
                        <span className="text-right">{formatCurrency(claimedAmount)}</span>
                        <span className="text-right">{formatCurrency(approvedAmount)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center">
                <Empty description="No periodic records" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-none items-end justify-between gap-4 bg-[#f6f6f6] px-1 py-4">
        <div className="space-y-2 text-sm text-slate-700">
          <div className="flex items-center gap-4">
            <span className="w-28">Travel Expense</span>
            <strong className="text-base">{formatCurrency(summaryTotals.travel)}</strong>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-28">Other Expense</span>
            <strong className="text-base">{formatCurrency(summaryTotals.other)}</strong>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-28">Total Expense</span>
            <strong className="text-base text-yellow-500">{formatCurrency(summaryTotals.total)}</strong>
          </div>
        </div>

        <div className="flex items-end gap-2">
          {!state?.fromPending ? <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              aria-label="Preview expense"
              className="flex h-9 w-9 items-center justify-center hover:bg-slate-50"
            >
              <img src={previewIcon} alt="" className="h-9 w-9 rounded-md border border-black/25" />
            </button>
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              aria-label="Share expense"
              className="flex h-9 w-9 items-center justify-center hover:bg-slate-50"
            >
              <img src={shareIcon} alt="" className="h-9 w-9 rounded-md border border-black/25" />
            </button>
            <button
              type="button"
              onClick={() => {
                void handlePrintExpense();
              }}
              aria-label="Print expense"
              className="flex h-9 w-9 items-center justify-center hover:bg-slate-50"
              disabled={isPrinting}
            >
              <img src={pdfIcon} alt="" className="h-9 w-9 rounded-md border border-black/25" />
            </button>
          </div> : null}

          {state?.fromPending ? (
            <button
              type="button"
              className="rounded-md bg-emerald-500 px-6 py-2.5 text-base font-medium text-white transition-colors hover:bg-emerald-600"
              onClick={() => void handleApproveExpense()}
              disabled={approvalMutation.isPending}
            >
              {approvalMutation.isPending ? "Approving..." : "Approve"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative">
        <CalendarPopup
          open={filterOpen}
          title=""
          month={calendarMonth.toDate()}
          selectedDate={draftToDate.toDate()}
          selectedFromDate={draftFromDate.toDate()}
          selectedToDate={draftToDate.toDate()}
          onMonthChange={(nextMonth) => setCalendarMonth(dayjs(nextMonth))}
          onYearChange={(nextYear) => setCalendarMonth(dayjs(nextYear))}
          onSelectDate={(date) => {
            const picked = dayjs(date).startOf("day");
            if (picked.isBefore(draftFromDate, "day")) {
              setDraftFromDate(picked);
              setDraftToDate(picked);
              return;
            }
            setDraftToDate(picked);
          }}
          onSelectRangeDate={(date) => {
            const picked = dayjs(date).startOf("day");
            if (picked.isBefore(draftFromDate, "day")) {
              setDraftFromDate(picked);
              setDraftToDate(draftFromDate);
              return;
            }
            setDraftToDate(picked);
          }}
          onApply={handleApplyFilter}
          onCancel={() => setFilterOpen(false)}
          className="!right-4 !top-14 !mt-0 border border-slate-200 p-3 shadow-[0_12px_36px_rgba(0,0,0,0.12)]"
        />
      </div>

      <Modal
        open={previewOpen}
        onCancel={() => {
          setPreviewOpen(false);
          if (approvalCompleted) {
            setApprovalCompleted(false);
            navigate("/more/expenseapproval/pendingapproval");
          }
        }}
        footer={null}
        centered
        width={860}
        destroyOnClose
        title={null}
        closeIcon={<CloseOutlined className="text-xl text-black" />}
        styles={{
          body: { padding: "16px 18px 18px" },
        }}
      >
        {companyDetailsLoading ? (
          <div className="flex h-80 items-center justify-center">
            <Spin />
          </div>
        ) : (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
            <div className="text-[18px] font-medium text-slate-900">Expense</div>
            <div className="flex items-center gap-4 text-slate-700">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
                aria-label="Share expense preview"
                onClick={() => setShareModalOpen(true)}
              >
                <img src={shared} alt="" className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="rounded-md border border-sky-100 bg-sky-50/60 px-4 py-4">
            <div className="text-center">
              <div className="text-[15px] font-semibold text-slate-900">{previewCompanyName}</div>
              <div className="mt-1 text-[12px] text-slate-700">{previewCompanyAddress || " "}</div>
              <div className="mt-1 text-[12px] text-slate-700">
                {previewCompanyEmail ? `Email: ${previewCompanyEmail}` : ""}
                {previewCompanyEmail && previewCompanyPhone ? " | " : ""}
                {previewCompanyPhone ? `Phone: ${previewCompanyPhone}` : ""}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-[13px] text-slate-700">
            <div>
              <span className="font-medium text-slate-800">Agent Name :</span> {agentName}
            </div>
            <div>
              <span className="font-medium text-slate-800">Period :</span> {summaryPeriod}
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="grid grid-cols-[42px_110px_1fr_1fr_110px_110px_110px_110px] border-b border-slate-200 bg-sky-100 text-[12px] font-medium text-slate-700">
              <div className="border-r border-sky-200 px-3 py-3">Sl</div>
              <div className="border-r border-sky-200 px-3 py-3">Date</div>
              <div className="border-r border-sky-200 px-3 py-3">Starting Location</div>
              <div className="border-r border-sky-200 px-3 py-3">Ending Location</div>
              <div className="border-r border-sky-200 px-3 py-3 text-right">Travel Expense</div>
              <div className="border-r border-sky-200 px-3 py-3 text-right">Other Expense</div>
              <div className="border-r border-sky-200 px-3 py-3 text-right">Claimed Expense</div>
              <div className="px-3 py-3 text-right">Approved Expense</div>
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {periodRows.length ? (
                periodRows.map((row, index) => {
                  const travelAmount = number(getValue(row, [
                    "nTotalTravelAmount",
                    "nTravelExpenseAmount",
                    "nTravelExpense",
                    "TravelExpense",
                  ]));
                  const otherAmount = number(getValue(row, [
                    "nTotalOtherAmount",
                    "nOtherExpenseAmount",
                    "nOtherExpense",
                    "OtherExpense",
                  ]));
                  const claimedAmount = number(getValue(row, [
                    "nTotalExpenseAmount",
                    "nClaimedAmount",
                    "ClaimedAmount",
                    "nClaimedExpense",
                    "ClaimedExpense",
                  ]));
                  const approvedAmount = number(getValue(row, [
                    "nApprovedExpense",
                    "ApprovedExpense",
                    "nApprovedAmount",
                  ])) || travelAmount + otherAmount;

                  return (
                    <div
                      key={`preview-${index}`}
                      className="grid grid-cols-[42px_110px_1fr_1fr_110px_110px_110px_110px] border-b border-slate-100 text-[12px] text-slate-700 last:border-b-0"
                    >
                      <div className="border-r border-slate-100 px-3 py-3">{index + 1}</div>
                      <div className="border-r border-slate-100 px-3 py-3">{formatDate(getValue(row, ["dCreatedDate", "dApprovalDate", "Date", "dDate", "cDate"]))}</div>
                      <div className="border-r border-slate-100 px-3 py-3">{text(getValue(row, ["cStartingLocation", "StartingLocation", "cFromLocation", "FromLocation"]), "-")}</div>
                      <div className="border-r border-slate-100 px-3 py-3">{text(getValue(row, ["cEndingLocation", "EndingLocation", "cToLocation", "ToLocation"]), "-")}</div>
                      <div className="border-r border-slate-100 px-3 py-3 text-right">{formatCurrency(travelAmount)}</div>
                      <div className="border-r border-slate-100 px-3 py-3 text-right">{formatCurrency(otherAmount)}</div>
                      <div className="border-r border-slate-100 px-3 py-3 text-right">{formatCurrency(claimedAmount)}</div>
                      <div className="px-3 py-3 text-right">{formatCurrency(approvedAmount)}</div>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                  No periodic records
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#f6f4f4] px-4 py-4">
            <div className="flex flex-col gap-2 text-[13px] text-slate-700">
              <div className="flex justify-between">
                <span>Travel Expense</span>
                <span>{formatCurrency(summaryTotals.travel)}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Expense</span>
                <span>{formatCurrency(summaryTotals.other)}</span>
              </div>
              <div className="flex justify-between">
                <span>Claimed Expense</span>
                <span>{formatCurrency(summaryTotals.claimed)}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900">
                <span>Approved Expense</span>
                <span>{formatCurrency(summaryTotals.approved)}</span>
              </div>
            </div>
          </div>
        </div>
        )}
      </Modal>

      <Modal
        open={shareModalOpen}
        onCancel={() => {
          setShareModalOpen(false);
          setShareEmail("");
        }}
        footer={null}
        centered
        width={400}
        destroyOnClose
        title={null}
        closable={false}
        styles={{
          body: { padding: "14px 20px 20px" },
        }}
      >
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="m-0 text-[16px] font-medium text-slate-900">
              Share Expense Report
            </h2>
            <button
              type="button"
              aria-label="Close share dialog"
              onClick={() => {
                setShareModalOpen(false);
                setShareEmail("");
              }}
              className="flex h-7 w-7 items-center justify-center border-0 bg-transparent text-slate-900 hover:bg-slate-100"
            >
              <CloseOutlined className="text-xl" />
            </button>
          </div>

          <div className="flex h-[90px] w-20 flex-col items-center justify-center rounded-md bg-sky-100/80">
            <img src={mailImage} alt="Mail" className="h-10 w-10 object-contain" />
            <div className="mt-2 text-[12px] text-slate-600">Mail</div>
          </div>

          {shareEmails.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {shareEmails.map((email) => (
                <span
                  key={email}
                  className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700"
                >
                  {email}
                  <button
                    type="button"
                    aria-label={`Remove ${email}`}
                    onClick={() =>
                      setShareEmails((current) =>
                        current.filter((item) => item !== email)
                      )
                    }
                    className="border-0 bg-transparent p-0 text-sm leading-none text-slate-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3">
            <div className="mb-1 text-[13px] text-slate-700">Mail</div>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={shareEmail}
                onChange={(event) => setShareEmail(event.target.value)}
                placeholder="Enter email address"
                className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-[13px] outline-none transition-colors focus:border-sky-400"
              />
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-black text-white transition-colors hover:bg-slate-800"
                aria-label="Add email"
                onClick={() => {
                  const email = shareEmail.trim();
                  if (!email) return;
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    message.warning("Enter a valid email address");
                    return;
                  }
                  setShareEmails((current) =>
                    current.includes(email) ? current : [...current, email],
                  );
                  setShareEmail("");
                }}
              >
                <PlusOutlined className="text-[16px]" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              disabled={isSendingMail}
              className="min-w-[58px] rounded-md bg-black px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
              onClick={() => void handleSendExpenseMail()}
            >
              {isSendingMail ? "Sending..." : "Ok"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={approvalSuccessOpen}
        title="Expense Approval"
        centered
        footer={null}
        destroyOnClose
        onCancel={() => setApprovalSuccessOpen(false)}
        width={560}
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 rounded-md bg-slate-100 px-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8FC6F2] text-sm font-medium text-slate-700">
              {initials || "EP"}
            </div>
            <div>
              <div className="text-base font-medium text-slate-900">{agentName}</div>
              <div className="text-sm text-slate-500">
                {text(
                  value(["cGroupName", "GroupName", "cService", "Service"]),
                  "Service",
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Period</span>
              <span className="text-slate-500">{summaryPeriod}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Claimed expense</span>
              <span className="text-slate-500">
                {formatCurrency(summaryTotals.claimed)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Approved expense</span>
              <span className="text-slate-500">
                {formatCurrency(summaryTotals.approved)}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              className="rounded-md bg-emerald-500 px-6 py-2.5 text-base font-medium text-white transition-colors hover:bg-emerald-600"
              onClick={() => {
                setApprovalSuccessOpen(false);
                setPreviewOpen(true);
              }}
            >
              Ok
            </button>
          </div>
        </div>
      </Modal>

    </section>

  );
};

export default ExpenseApprovalViewPage;
