import { SearchOutlined } from "@ant-design/icons";
import { Empty, Input, Spin } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { billingApis } from "../Axios/BillingApis";
import { getRequestPayload } from "../Utils/requestPayload";
import { extractList } from "./Master/Common/SimpleMasterUtils";
import TicketModulePagination from "./Ticket/Common/TicketModulePagination";

interface CustomerProfileBillsProps {
  customerId: string | number;
  returnCustomer: Record<string, unknown>;
}

type BillRecord = Record<string, unknown>;

const getValue = (record: unknown, keys: string[]) => {
  if (!record || typeof record !== "object") return "";
  const source = record as BillRecord;

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }

  const matchedKey = Object.keys(source).find((key) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
  );
  return matchedKey ? source[matchedKey] : "";
};

const display = (value: unknown, fallback = "-") =>
  String(value ?? "").trim() || fallback;

const extractBillRows = (response: unknown) => {
  if (!response || typeof response !== "object") return extractList(response);
  const source = response as BillRecord;
  const data = source.data as BillRecord | undefined;
  const candidates = [
    response,
    source.billList,
    source.BillList,
    data?.data,
    data?.billList,
    data?.BillList,
    data,
  ];

  for (const candidate of candidates) {
    const rows = extractList(candidate);
    if (rows.length) return rows;
  }
  return [];
};

const parseDate = (value: unknown) => {
  const source = display(value, "");
  if (!source) return null;
  const direct = new Date(source);
  if (!Number.isNaN(direct.getTime())) return direct;

  const match = source.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?/i);
  if (!match) return null;
  const [, day, month, year, rawHour = "0", minute = "0", meridiem] = match;
  let hour = Number(rawHour);
  if (meridiem?.toUpperCase() === "PM" && hour < 12) hour += 12;
  if (meridiem?.toUpperCase() === "AM" && hour === 12) hour = 0;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day), hour, Number(minute));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateTime = (value: unknown) => {
  const parsed = parseDate(value);
  if (!parsed) return display(value);
  return `${parsed.toLocaleDateString("en-GB")} ${parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
};

const formatAmount = (value: unknown) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
};

const CustomerProfileBills = ({ customerId, returnCustomer }: CustomerProfileBillsProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const payload = useMemo(() => ({
    ...getRequestPayload(),
    nCustomerId: customerId,
    customerId,
    CustomerId: customerId,
    pageNumber: 1,
    pageSize: 1000,
  }), [customerId]);

  const billsQuery = useQuery({
    queryKey: ["customer-wise-bill-list", payload],
    queryFn: () => billingApis.billListCustomerWise(payload),
    enabled: Boolean(customerId),
  });

  const rows = useMemo(() => extractBillRows(billsQuery.data), [billsQuery.data]);
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row: unknown) => [
      getValue(row, ["nBillNo", "BillNo", "billNo", "cBillNo", "BillNumber"]),
      getValue(row, ["dBillDate", "BillDate", "Date", "dCreatedDate"]),
      getValue(row, ["nTotalAmount", "TotalAmount", "nBillAmount", "BillAmount", "Amount"]),
      getValue(row, ["cPaymodeName", "cPayMode", "PayMode", "PayModeName"]),
    ].join(" ").toLowerCase().includes(term));
  }, [rows, search]);

  const total = filteredRows.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden p-5">
      <div className="flex flex-none items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-medium">Bills</h2>
        <Input
          className="w-[240px]"
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Search"
          allowClear
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto border-b">
        <div className="sticky top-0 z-10 grid min-w-[720px] grid-cols-[60px_160px_220px_140px_minmax(150px,1fr)] border-y bg-white px-3 py-3 text-xs font-medium shadow-[0_1px_0_rgba(226,232,240,1)]">
          <span>Srl</span><span>Bill No</span><span>Date &amp; Time</span><span>Amount</span><span>Pay Mode</span>
        </div>

        {billsQuery.isFetching ? (
          <div className="flex h-72 items-center justify-center"><Spin /></div>
        ) : visibleRows.length ? visibleRows.map((row: unknown, index: number) => {
          const billId = Number(getValue(row, ["nBillId", "BillId", "billId", "Id"]) || 0);
          const billNo = display(getValue(row, ["nBillNo", "BillNo", "billNo", "cBillNo", "BillNumber"]));
          return (
            <button
              type="button"
              key={billId || `${safePage}-${index}`}
              className="grid min-h-[58px] w-full min-w-[720px] grid-cols-[60px_160px_220px_140px_minmax(150px,1fr)] items-center border-b px-3 text-left text-xs hover:bg-slate-50"
              onClick={() => billId && navigate("/billsandreceipts/bill/view", {
                state: {
                  billId,
                  nBillId: billId,
                  billNo,
                  billData: row,
                  sourcePage: "customer-details",
                  returnTo: "/more/customer-details",
                  returnState: { selectedCustomer: returnCustomer, tab: "Bills" },
                },
              })}
            >
              <span>{(safePage - 1) * pageSize + index + 1}</span>
              <span>{billNo}</span>
              <span>{formatDateTime(getValue(row, ["dBillDate", "BillDate", "Date", "dCreatedDate"]))}</span>
              <span>{formatAmount(getValue(row, ["nTotalAmount", "TotalAmount", "nBillAmount", "BillAmount", "Amount"]))}</span>
              <span>{display(getValue(row, ["cPaymodeName", "cPayMode", "PayMode", "PayModeName"]))}</span>
            </button>
          );
        }) : (
          <div className="flex h-72 items-center justify-center rounded-xl border m-2">
            <Empty description={billsQuery.isError ? "Unable to load bills" : "No data"} />
          </div>
        )}
      </div>

      {total > 0 ? (
        <TicketModulePagination
          className="w-full flex-none"
          elevated={false}
          current={safePage}
          pageSize={pageSize}
          total={total}
          onChange={(nextPage, size) => { setPage(nextPage); setPageSize(size); }}
          onShowSizeChange={(nextPage, size) => { setPage(nextPage); setPageSize(size); }}
        />
      ) : null}
    </section>
  );
};

export default CustomerProfileBills;
