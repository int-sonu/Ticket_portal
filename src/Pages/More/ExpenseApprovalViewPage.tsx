import { CloseOutlined, FilterOutlined } from "@ant-design/icons";
import { EyeOutlined, PrinterOutlined, ShareAltOutlined } from "@ant-design/icons";
import { Empty, Modal, Spin, message } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";

import { billingApis } from "../../Axios/BillingApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import {
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

type LocationState = {
  approvalId?: number;
  expenseApprovalId?: number;
  nAgentId?: number;
  cAgentId?: string;
  approval?: ExpenseApprovalRecord;
  fromDate?: string;
  toDate?: string;
} | null;

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

const extractFeatureItems = (response: unknown): Record<string, unknown>[] => {
  const visited = new Set<unknown>();
  const collect = (value: unknown): Record<string, unknown>[] => {
    if (!value || typeof value !== "object" || visited.has(value)) return [];
    visited.add(value);

    if (Array.isArray(value)) {
      const records = value.filter((item) => item && typeof item === "object") as Record<string, unknown>[];
      if (records.length) return records;
      for (const item of value) {
        const nested = collect(item);
        if (nested.length) return nested;
      }
      return [];
    }

    const source = value as Record<string, unknown>;
    for (const key of [
      "data",
      "Data",
      "result",
      "Result",
      "items",
      "Items",
      "list",
      "List",
      "features",
      "Features",
      "companyFeatures",
      "CompanyFeatures",
    ]) {
      const candidate = source[key];
      if (Array.isArray(candidate)) {
        const records = candidate.filter((item) => item && typeof item === "object") as Record<string, unknown>[];
        if (records.length) return records;
      }

      const nested = collect(candidate);
      if (nested.length) return nested;
    }

    return [];
  };

  return collect(response);
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

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFromDate, setDraftFromDate] = useState<Dayjs>(defaultFromDate);
  const [draftToDate, setDraftToDate] = useState<Dayjs>(defaultToDate);
  const [appliedFromDate, setAppliedFromDate] = useState<Dayjs>(defaultFromDate);
  const [appliedToDate, setAppliedToDate] = useState<Dayjs>(defaultToDate);
  const [calendarMonth, setCalendarMonth] = useState(defaultToDate.startOf("month"));
  const [approvalSuccessOpen, setApprovalSuccessOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const approvalMutation = useApproveExpenseApproval();
  const requestPayload = getRequestPayload();
  const previewPayload = useMemo(
    () => ({
      nCompanyId: requestPayload.nCompanyId,
      cSchemaName: requestPayload.cSchemaName,
      cDbName: requestPayload.cDbName,
    }),
    [requestPayload.cDbName, requestPayload.cSchemaName, requestPayload.nCompanyId],
  );

  const { data: configurationResponse, isFetching: configurationLoading } = useQuery({
    queryKey: ["expense-approval-configuration", previewPayload],
    queryFn: () => billingApis.getConfiguration(previewPayload),
    enabled: previewOpen,
  });

  const { data: featureResponse, isFetching: featuresLoading } = useQuery({
    queryKey: ["expense-approval-company-features", previewPayload],
    queryFn: () => billingApis.getCompanyFeatures(previewPayload),
    enabled: previewOpen,
  });

  const payload = useMemo(() => {
    const { nCompanyId, cSchemaName, cDbName } = requestPayload;
    const dFromDate = appliedFromDate.format("YYYY/MM/DD");
    const dToDate = appliedToDate.format("YYYY/MM/DD");

    return {
      nApprovalId: approvalId,
      nExpenseApprovalId: expenseApprovalId,
      nExpenseId: expenseApprovalId,
      nAgentId: agentId,
      cAgentId,
      nCompanyId,
      cSchemaName,
      cDbName,
      bDateFilter: true,
      dFromDate,
      dToDate,
    };
  }, [approvalId, expenseApprovalId, agentId, cAgentId, appliedFromDate, appliedToDate, requestPayload]);

  const detailsQuery = useExpenseApprovalPeriodList(payload, detailQueryEnabled);
  const details = extractDetails(detailsQuery.data, fallback);
  const configuration = normalizeRecord(
    configurationResponse?.data?.data ?? configurationResponse?.data ?? configurationResponse ?? {},
  );
  const companyFeatures = extractFeatureItems(
    featureResponse?.data?.data ?? featureResponse?.data ?? featureResponse ?? {},
  );
  const periodRows = useMemo(
    () => {
      const topLevelRows = extractTopLevelRows(detailsQuery.data).filter(isActiveRow);
      if (topLevelRows.length) return topLevelRows;
      return extractRows(detailsQuery.data).filter(isActiveRow);
    },
    [detailsQuery.data],
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
    return periodRows.reduce(
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
    getValue(configuration, [
      "cCompanyName",
      "cComapnyName",
      "companyName",
      "cName",
      "Name",
    ]),
    agentName,
  );
  const previewCompanyAddress = text(
    getValue(configuration, [
      "cAddress",
      "address",
      "cCompanyAddress",
      "companyAddress",
    ]),
    "",
  );
  const previewCompanyEmail = text(
    getValue(configuration, [
      "cEmail",
      "email",
      "cCompanyEmail",
      "cMail",
    ]),
    "",
  );
  const previewCompanyPhone = text(
    getValue(configuration, [
      "cPhoneNo",
      "phoneNo",
      "cPhone",
      "cMobileNo",
      "mobileNo",
      "cContactNo",
    ]),
    "",
  );
  const previewCompanyLogo = text(
    getValue(configuration, [
      "cLogoUrl",
      "logoUrl",
      "cCompanyLogoUrl",
      "cLogoPath",
      "logoPath",
      "cLogo",
      "cCompanyLogo",
    ]),
    "",
  );
  const previewFeatureLabels = companyFeatures
    .map((feature, index) =>
      text(
        getValue(feature, [
          "cFeatureName",
          "FeatureName",
          "cName",
          "Name",
          "featureName",
          "feature",
        ]),
        `Feature ${index + 1}`,
      ),
    )
    .filter(Boolean);
  const handleOpenFilter = () => {
    setDraftFromDate(appliedFromDate);
    setDraftToDate(appliedToDate);
    setCalendarMonth(appliedFromDate.startOf("month"));
    setFilterOpen(true);
  };

  const handleApplyFilter = () => {
    const nextFrom = draftFromDate.isAfter(draftToDate, "day") ? draftToDate : draftFromDate;
    const nextTo = draftToDate.isBefore(draftFromDate, "day") ? draftFromDate : draftToDate;
    setAppliedFromDate(nextFrom);
    setAppliedToDate(nextTo);
    setFilterOpen(false);
  };

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white px-4 py-2">
      <header className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="m-0 text-xl font-medium text-slate-950">Expense Approval</h1>
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-slate-800">
            {appliedFromDate.format("DD/MM/YYYY")} - {appliedToDate.format("DD/MM/YYYY")}
          </div>
          <button
            type="button"
            onClick={handleOpenFilter}
            aria-label="Open filters"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <FilterOutlined className="text-[15px]" />
          </button>
          <button
            type="button"
            aria-label="Close page"
            onClick={() => navigate("/more/expense-approval")}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-transparent bg-transparent text-slate-950 transition-colors hover:bg-slate-50"
          >
            <CloseOutlined className="text-[18px]" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 px-1 pt-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8FC6F2] text-lg font-medium text-slate-700">
              {initials || "EP"}
            </div>
            <div>
              <div className="text-base font-medium text-slate-950">{agentName}</div>
              <div className="text-sm text-slate-500">{summaryPeriod || "N/A"}</div>
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

          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {detailsQuery.isFetching ? (
              <div className="flex h-52 items-center justify-center">
                <Spin />
              </div>
            ) : periodRows.length ? (
              <div className="min-h-0">
                <div className="grid grid-cols-[42px_150px_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-700">
                  <span className="whitespace-pre-line leading-tight">
                    S
                    <br />
                    rl
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
                    const travelAmount = getValue(row, [
                      "nTotalTravelAmount",
                      "nTravelExpenseAmount",
                      "nTravelExpense",
                      "TravelExpense",
                    ]);
                    const otherAmount = getValue(row, [
                      "nTotalOtherAmount",
                      "nOtherExpenseAmount",
                      "nOtherExpense",
                      "OtherExpense",
                    ]);
                    const claimedAmount = getValue(row, [
                      "nTotalExpenseAmount",
                      "nClaimedAmount",
                      "ClaimedAmount",
                      "nClaimedExpense",
                      "ClaimedExpense",
                    ]);
                    const approvedAmount = getValue(row, [
                      "nApprovedExpense",
                      "ApprovedExpense",
                      "nApprovedAmount",
                    ]) || travelAmount + otherAmount;

                    return (
                      <div
                        key={String(
                          getValue(row, [
                            "nExpensePeriodId",
                            "ExpensePeriodId",
                            "id",
                          "nExpenseApprovalPeriodId",
                        ]) || index,
                        )}
                        className="grid min-h-[62px] grid-cols-[42px_150px_1fr_1fr_1fr_1fr_1fr_1fr] items-center border-b border-slate-100 bg-white px-2 text-xs"
                      >
                        <span>{index + 1}</span>
                        <span>{formatDateTime(getValue(row, ["dCreatedDate", "dApprovalDate", "Date", "dDate", "cDate"]))}</span>
                        <span>{text(getValue(row, ["cStartingLocation", "StartingLocation", "cFromLocation", "FromLocation"]), "-")}</span>
                        <span>{text(getValue(row, ["cEndingLocation", "EndingLocation", "cToLocation", "ToLocation"]), "-")}</span>
                        <span className="text-right">{formatCurrency(travelAmount)}</span>
                        <span className="text-right">{formatCurrency(otherAmount)}</span>
                        <span className="text-right">{formatCurrency(claimedAmount)}</span>
                        <span className="text-right">{formatCurrency(approvedAmount)}</span>
                      </div>
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

      <div className="mt-3 flex flex-none items-end justify-between gap-4 border-t border-slate-200 pt-4">
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              aria-label="Preview expense"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <EyeOutlined className="text-[16px]" />
            </button>
            <button
              type="button"
              onClick={() => message.info("Share preview is not wired yet")}
              aria-label="Share expense"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <ShareAltOutlined className="text-[16px]" />
            </button>
            <button
              type="button"
              onClick={() => message.info("Print preview is not wired yet")}
              aria-label="Print expense"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <PrinterOutlined className="text-[16px]" />
            </button>
          </div>

          <button
            type="button"
            className="rounded-md bg-emerald-500 px-6 py-2.5 text-base font-medium text-white transition-colors hover:bg-emerald-600"
            onClick={async () => {
              try {
                await approvalMutation.mutateAsync({
                  nExpenseApprovalId: expenseApprovalId,
                  nAgentId: agentId,
                  cAgentId,
                  nStatus: 1,
                  nCompanyId: requestPayload.nCompanyId,
                  cSchemaName: requestPayload.cSchemaName,
                  cDbName: requestPayload.cDbName,
                  dFromDate: appliedFromDate.format("YYYY/MM/DD"),
                  dToDate: appliedToDate.format("YYYY/MM/DD"),
                  bDateFilter: true,
                });
                setApprovalSuccessOpen(true);
                message.success("Expense approved successfully");
              } catch (error) {
                const data = (error as { response?: { data?: { message?: string; title?: string } } })?.response?.data;
                message.error(data?.message || data?.title || "Unable to approve expense");
              }
            }}
            disabled={approvalMutation.isPending}
          >
            {approvalMutation.isPending ? "Approving..." : "Approve"}
          </button>
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
        onCancel={() => setPreviewOpen(false)}
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
        {configurationLoading || featuresLoading ? (
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
                onClick={() => message.info("Share preview is not wired yet")}
              >
                <ShareAltOutlined className="text-[16px]" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
                aria-label="Close expense preview"
                onClick={() => setPreviewOpen(false)}
              >
                <CloseOutlined className="text-[16px]" />
              </button>
            </div>
          </div>

          <div className="rounded-md border border-sky-100 bg-sky-50/60 px-4 py-4">
            <div className="grid gap-3 md:grid-cols-[auto_1fr] md:items-center">
              {previewCompanyLogo ? (
                <div className="flex justify-center md:justify-start">
                  <img
                    src={previewCompanyLogo}
                    alt={previewCompanyName}
                    className="h-14 w-auto max-w-[220px] object-contain"
                  />
                </div>
              ) : null}
              <div className="text-center md:text-left">
                <div className="text-[15px] font-semibold text-slate-900">{previewCompanyName}</div>
                <div className="mt-1 text-[12px] text-slate-700">{previewCompanyAddress || " "}</div>
                <div className="mt-1 text-[12px] text-slate-700">
                  {previewCompanyEmail ? `Email: ${previewCompanyEmail}` : ""}
                  {previewCompanyEmail && previewCompanyPhone ? " | " : ""}
                  {previewCompanyPhone ? `Phone: ${previewCompanyPhone}` : ""}
                </div>
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

          {previewFeatureLabels.length ? (
            <div className="flex flex-wrap gap-2 rounded-md bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
              {previewFeatureLabels.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-sky-200 bg-white px-3 py-1"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}

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
                  const travelAmount = getValue(row, [
                    "nTotalTravelAmount",
                    "nTravelExpenseAmount",
                    "nTravelExpense",
                    "TravelExpense",
                  ]);
                  const otherAmount = getValue(row, [
                    "nTotalOtherAmount",
                    "nOtherExpenseAmount",
                    "nOtherExpense",
                    "OtherExpense",
                  ]);
                  const claimedAmount = getValue(row, [
                    "nTotalExpenseAmount",
                    "nClaimedAmount",
                    "ClaimedAmount",
                    "nClaimedExpense",
                    "ClaimedExpense",
                  ]);
                  const approvedAmount = getValue(row, [
                    "nApprovedExpense",
                    "ApprovedExpense",
                    "nApprovedAmount",
                  ]) || travelAmount + otherAmount;

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
                {text(value(["cGroupName", "GroupName", "cService", "Service"]), "Service")}
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
              <span className="text-slate-500">{formatCurrency(summaryTotals.claimed)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Approved expense</span>
              <span className="text-slate-500">{formatCurrency(summaryTotals.approved)}</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              className="rounded-md bg-emerald-500 px-6 py-2.5 text-base font-medium text-white transition-colors hover:bg-emerald-600"
              onClick={() => {
                setApprovalSuccessOpen(false);
                navigate("/more/expenseapproval/pendingapproval");
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
