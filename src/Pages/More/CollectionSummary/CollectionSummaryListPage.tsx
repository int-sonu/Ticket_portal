import { useEffect, useMemo, useRef, useState } from "react";
import { Empty, Spin } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import CustomPagination from "../../../ui/Table/CustomPagination";
import DateFilterIconPopover from "../../../ui/CalendarPopup/DateFilterIconPopover";

import { billingApis } from "../../../Axios/BillingApis";
import { extractList } from "../../Master/Common/SimpleMasterUtils";
import { getRequestPayload } from "../../../Utils/requestPayload";
import filterIcon from "../../../assets/icons/searchFilterIcon.svg";

const pad = (value: number) => String(value).padStart(2, "0");

const formatDateInput = (value: Date) =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;

const formatDateLabel = (value: string) => {
  if (!value) return "-";
  const parts = value.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return value;
};

const toDisplayDate = (value: any) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const toNumber = (value: any) => {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const normalizeDate = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const getFieldValue = (record: Record<string, any>, keys: string[]) => {
  const entries = Object.entries(record ?? {});
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }

    const normalizedKey = key.toLowerCase();
    const match = entries.find(([entryKey, entryValue]) => {
      if (entryValue === undefined || entryValue === null || entryValue === "") {
        return false;
      }

      return entryKey.toLowerCase() === normalizedKey;
    });

    if (match) {
      return match[1];
    }
  }

  return undefined;
};

const findFieldValueDeep = (
  input: any,
  keys: string[],
  seen = new Set<any>(),
): any => {
  if (!input || typeof input !== "object" || seen.has(input)) return undefined;
  seen.add(input);

  if (Array.isArray(input)) {
    for (const item of input) {
      const match = findFieldValueDeep(item, keys, seen);
      if (match !== undefined && match !== null && match !== "") {
        return match;
      }
    }
    return undefined;
  }

  const directMatch = getFieldValue(input, keys);
  if (directMatch !== undefined && directMatch !== null && directMatch !== "") {
    return directMatch;
  }

  for (const value of Object.values(input)) {
    const match = findFieldValueDeep(value, keys, seen);
    if (match !== undefined && match !== null && match !== "") {
      return match;
    }
  }

  return undefined;
};

const rowScore = (row: Record<string, any>) =>
  [
    "nBillId",
    "BillId",
    "billId",
    "cCustomerName",
    "CustomerName",
    "cPaymode",
    "cPaymodeName",
    "nAmount",
    "Amount",
    "dDate",
    "BillDate",
  ].reduce((score, key) => (row?.[key] !== undefined ? score + 1 : score), 0);

const findBestArrayCandidate = (value: any, seen = new Set<any>()): any[] => {
  if (!value || typeof value !== "object" || seen.has(value)) return [];
  seen.add(value);

  const directCandidates: any[][] = [];
  if (Array.isArray(value)) {
    directCandidates.push(value);
  } else {
    for (const nested of Object.values(value)) {
      if (Array.isArray(nested)) {
        directCandidates.push(nested);
      }
    }
  }

  let best = directCandidates.find((candidate) => candidate.length > 0) ?? [];
  let bestScore = best.reduce((sum, item) => sum + rowScore(item ?? {}), 0);

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      const candidate = findBestArrayCandidate(nested, seen);
      const candidateScore = candidate.reduce((sum, item) => sum + rowScore(item ?? {}), 0);
      if (candidate.length > 0 && candidateScore >= bestScore) {
        best = candidate;
        bestScore = candidateScore;
      }
    }
  }

  return best;
};

const getRowBillId = (row: Record<string, any>) =>
  Number(
    findFieldValueDeep(row, [
      "nBillId",
      "BillId",
      "billId",
      "billID",
      "BillID",
      "nBillID",
      "NBillId",
      "NBillID",
      "billid",
      "No",
      "nNo",
      "BillNo",
      "nBillNo",
      "cBillNo",
    ]) ?? 0,
  ) || 0;

const getRowBillNo = (row: Record<string, any>) =>
  String(
    getFieldValue(row, ["nBillNo", "BillNo", "billNo", "cBillNo", "No", "nNo"]) ?? "",
  ).trim();

const CollectionSummaryListPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const returnState = (location.state ?? {}) as Record<string, any>;
  const [fromDate, setFromDate] = useState(() => {
    if (returnState.fromDate) return String(returnState.fromDate);
    const today = new Date();
    const fromDateValue = new Date(today);
    fromDateValue.setFullYear(fromDateValue.getFullYear() - 1);
    return formatDateInput(fromDateValue);
  });
  const [toDate, setToDate] = useState(() => {
    if (returnState.toDate) return String(returnState.toDate);
    return formatDateInput(new Date());
  });
  const [search, setSearch] = useState(() => String(returnState.search ?? ""));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftCalendarMonth, setDraftCalendarMonth] = useState(() =>
    normalizeDate(new Date(toDate)),
  );
  const [draftSelectedDate, setDraftSelectedDate] = useState(() =>
    normalizeDate(new Date(toDate)),
  );

  const sessionPayload = useMemo(() => getRequestPayload(), []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (returnState.fromDate) setFromDate(String(returnState.fromDate));
    if (returnState.toDate) setToDate(String(returnState.toDate));
    if (returnState.search !== undefined) setSearch(String(returnState.search ?? ""));
  }, [returnState.fromDate, returnState.search, returnState.toDate]);

  useEffect(() => {
    setDraftCalendarMonth(normalizeDate(new Date(toDate)));
    setDraftSelectedDate(normalizeDate(new Date(toDate)));
  }, [toDate]);

  const requestPayload = useMemo(
    () => ({
      ...sessionPayload,
      cFromDate: fromDate,
      cToDate: toDate,
      dFromDate: fromDate,
      dToDate: toDate,
    }),
    [fromDate, sessionPayload, toDate],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["collection-summary-list", requestPayload],
    queryFn: () => billingApis.collectionSummaryList(requestPayload),
    enabled:
      !!requestPayload.nCompanyId &&
      !!String(requestPayload.cSchemaName ?? "").trim() &&
      !!String(requestPayload.cDbName ?? "").trim(),
  });

  const rows = useMemo(() => {
    const rawResponse = data?.data ?? data ?? [];
    const list =
      extractList(rawResponse).length > 0
        ? extractList(rawResponse)
        : findBestArrayCandidate(rawResponse);
    const normalizedSearch = search.trim().toLowerCase();

    return list.filter((row) => {
      if (!normalizedSearch) return true;

      const haystack = [
        getFieldValue(row, ["cBillNo", "BillNo", "billNo", "nBillNo"]),
        getFieldValue(row, ["cCustomerName", "CustomerName", "customerName"]),
        getFieldValue(row, ["cPaymode", "cPaymodeName", "Paymode", "payMode"]),
        getFieldValue(row, ["nAmount", "Amount", "amount", "nTotalAmount"]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [data, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, fromDate, toDate]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          const amount = toNumber(
            getFieldValue(row, ["nAmount", "Amount", "amount", "nTotalAmount"]) ?? 0,
          );
          acc.amount += amount;

          const payMode = String(
            getFieldValue(row, ["cPaymode", "cPaymodeName", "Paymode", "payMode"]) ?? "",
          ).trim().toLowerCase();

          if (payMode.includes("cash")) acc.cash += amount;
          else if (payMode.includes("net")) acc.netBanking += amount;
          else if (payMode === "bank" || payMode.includes("bank")) acc.bank += amount;
          else if (payMode.includes("upi")) acc.upi += amount;
          else if (payMode.includes("card")) acc.card += amount;
          else acc.other += amount;

          return acc;
        },
        { amount: 0, cash: 0, netBanking: 0, bank: 0, upi: 0, card: 0, other: 0 },
      ),
    [rows],
  );

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, rows]);

  const isDataLoaded = !!data && !isLoading && !isFetching;

  const handleRowClick = (row: Record<string, any>) => {
    const billId = getRowBillId(row);
    if (!billId) {
      return;
    }

    navigate("/billsandreceipts/bill/view", {
      state: {
        billId,
        nBillId: billId,
        BillId: billId,
        billNo: getRowBillNo(row) || billId,
        billData: row,
        sessionPayload,
        sourcePage: "collection-summary",
        returnTo: "/more/collectionsummary",
        returnState: {
          fromDate,
          toDate,
          search,
        },
      },
    });
  };

  const handleToggleFilter = () => {
    setDraftCalendarMonth(normalizeDate(new Date(toDate)));
    setDraftSelectedDate(normalizeDate(new Date(toDate)));
    setIsFilterOpen((current) => !current);
  };

  const handleApplyFilter = () => {
    const selectedDate = formatDateInput(draftSelectedDate);
    setFromDate(selectedDate);
    setToDate(selectedDate);
    setIsFilterOpen(false);
  };

  const handleCancelFilter = () => {
    setDraftCalendarMonth(normalizeDate(new Date(toDate)));
    setDraftSelectedDate(normalizeDate(new Date(toDate)));
    setIsFilterOpen(false);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-white px-0 py-0">
      <div className="flex w-full flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-medium text-slate-900">Collection Summary</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-10 w-[240px] items-center rounded-md border border-sky-200 bg-white px-3 shadow-sm">
              <svg
                viewBox="0 0 24 24"
                className="mr-2 h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="h-full w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
            <div ref={filterPanelRef}>
              <DateFilterIconPopover
                open={isFilterOpen}
                iconSrc={filterIcon}
                ariaLabel="Filter collection summary"
                onOpenToggle={handleToggleFilter}
                month={draftCalendarMonth}
                selectedDate={draftSelectedDate}
                onMonthChange={setDraftCalendarMonth}
                onYearChange={setDraftCalendarMonth}
                onSelectDate={setDraftSelectedDate}
                onApply={handleApplyFilter}
                onCancel={handleCancelFilter}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-sky-100 bg-[#edf6fe] px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-sky-100 pb-2">
            <div className="text-[15px] text-slate-800">
              The total collection on {formatDateLabel(fromDate)} to {formatDateLabel(toDate)}
            </div>
            <div className="text-[18px] font-semibold text-[#e3b400]">
              {formatCurrency(totals.amount)}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-0 text-[13px] text-slate-700 md:grid-cols-5">
            <div className="px-4 py-1">
              Cash : <span className="font-semibold">{formatCurrency(totals.cash)}</span>
            </div>
            <div className="border-l border-sky-200 px-4 py-1">
              NetBanking : <span className="font-semibold">{formatCurrency(totals.netBanking)}</span>
            </div>
            <div className="border-l border-sky-200 px-4 py-1">
              Upi : <span className="font-semibold">{formatCurrency(totals.upi)}</span>
            </div>
            <div className="border-l border-sky-200 px-4 py-1">
              Bank : <span className="font-semibold">{formatCurrency(totals.bank)}</span>
            </div>
            <div className="border-l border-sky-200 px-4 py-1">
              Card : <span className="font-semibold">{formatCurrency(totals.card)}</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-t-lg border border-slate-100 bg-white shadow-sm ">
          <Spin spinning={isLoading}>
            {paginatedRows.length > 0 ? (
              <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
                <div className="min-w-full">
                  <div className="grid grid-cols-[60px_170px_120px_80px_minmax(180px,1fr)_140px_140px] gap-x-4 border-b border-slate-100 bg-white px-4 py-4 text-left text-[13px] font-medium text-slate-700">
                    <div>Srl</div>
                    <div>Date</div>
                    <div>Payment Type</div>
                    <div>No</div>
                    <div>Customer Name</div>
                    <div className="text-right">Amount</div>
                    <div>Paymode</div>
                  </div>

                  {paginatedRows.map((row, index) => {
                    const billId = getRowBillId(row);
                    const key =
                      billId ||
                      `${getFieldValue(row, ["cBillNo", "BillNo", "billNo"]) ?? "row"}-${index}`;

                    return (
                      <button
                        key={String(key)}
                        type="button"
                        onClick={() => handleRowClick(row)}
                        title="Open bill view"
                        aria-label={`Open bill view for ${getFieldValue(row, ["nNo", "BillNo", "cBillNo"]) ?? "selected row"}`}
                        className="grid w-full grid-cols-[60px_170px_120px_80px_minmax(180px,1fr)_140px_140px] gap-x-4 items-center border-b border-slate-50 px-4 py-4 text-left text-[13px] text-slate-700 transition-colors hover:bg-sky-50/50 active:bg-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400 cursor-pointer"
                      >
                        <div>{(currentPage - 1) * pageSize + index + 1}</div>
                        <div>
                          {toDisplayDate(getFieldValue(row, ["dDate"]))}
                        </div>
                        <div>
                          {getFieldValue(row, ["cPaymentType", "PaymentType", "paymentType"]) ??
                            "Bill"}
                        </div>
                        <div>{getFieldValue(row, ["nNo"])}</div>
                        <div>{getFieldValue(row, ["cCustomerName"])}</div>
                        <div className="text-right">
                          {formatCurrency(
                            toNumber(getFieldValue(row, ["nAmount"]) ?? 0),
                          )}
                        </div>
                        <div className="pl-2">{getFieldValue(row, ["cPaymodeName"])}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : isDataLoaded ? (
              <div className="flex min-h-[360px] items-center justify-center px-4 py-10">
                <Empty description="No collection summary records found" />
              </div>
            ) : (
              <div className="flex min-h-[360px] items-center justify-center px-4 py-10">
                <div className="text-sm text-slate-500">Loading collection summary...</div>
              </div>
            )}
          </Spin>
        </div>

        <div className="rounded-b-lg border border-t-0 border-sky-100 bg-white shadow-sm  ">
          <CustomPagination
            current={currentPage}
            pageSize={pageSize}
            total={rows.length}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
            onShowSizeChange={(_, size) => {
              setCurrentPage(1);
              setPageSize(size);
            }}
            className="!border-0 !rounded-none"
          />
        </div>
      </div>
    </div>
  );
};
export default CollectionSummaryListPage;
