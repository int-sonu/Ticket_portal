import React, { useMemo } from "react";
import billicon from "../../assets/Bills/billIcon.png"
import customericonbill from "../../assets/Bills/customerIconbill.png"
import gst from "../../assets/Bills/gstIcon.png"
import previewicon from "../../assets/Bills/PreviewIcon.png"
import shareicon from "../../assets/Bills/ShareIcon.png"
import printicon from "../../assets/Bills/PrintIcon.png"
import download from "../../assets/Bills/download.svg"

type BillReadonlyViewProps = {
  viewData?: Record<string, any>;
  fallbackState?: Record<string, any>;
  billViewData?: Record<string, any>;
  partListData?: any[];
  loading?: boolean;
};

type BillItemRow = {
  key: string;
  description: string;
  qty: number;
  rate: number;
  value: number;
  discount: number;
  tax: number;
  total: number;
};

const normalizeSingleRecord = (value: any) => {
  if (Array.isArray(value)) return value[0] ?? {};
  if (value && typeof value === "object") return value;
  return {};
};

const getFirstValue = (record: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
};

const toNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatMoney = (value: number) => `₹${Number(value || 0).toFixed(2)}`;

const normalizePartRows = (
  partDetails: any[],
): BillItemRow[] => {
  const rows = (Array.isArray(partDetails) ? partDetails : []).map((item: any, index: number) => {
    const qty = toNumber(
      getFirstValue(item ?? {}, ["nQty", "qty", "Qty", "nQuantity", "quantity"]),
      1,
    );
    const rate = toNumber(
      getFirstValue(item ?? {}, ["nRate", "rate", "Rate", "nAmount", "amount"]),
      0,
    );
    const value = toNumber(
      getFirstValue(item ?? {}, ["nValue", "value", "Value", "nGrossAmount"]),
      qty * rate,
    );
    const discount = toNumber(
      getFirstValue(item ?? {}, ["nDiscountAmt", "discount", "Discount", "nDiscount"]),
      0,
    );
    const tax = toNumber(
      getFirstValue(item ?? {}, ["nTaxAmount", "tax", "Tax", "nTaxValue"]),
      0,
    );
    const total = toNumber(
      getFirstValue(item ?? {}, ["nTotalAmount", "total", "Total", "nGrandTotal"]),
      value - discount + tax,
    );

    return {
      key: String(getFirstValue(item ?? {}, ["nPartId", "partId", "id", "Id"]) || index + 1),
      description:
        String(
          getFirstValue(item ?? {}, [
            "cPartName",
            "PartName",
            "cDescription",
            "Description",
            "cItemName",
            "ItemName",
          ]),
        ) || `Item ${index + 1}`,
      qty,
      rate,
      value,
      discount,
      tax,
      total,
    };
  });

  if (rows.length > 0) return rows;

  return [];
};

const BillReadonlyView: React.FC<BillReadonlyViewProps> = ({
  viewData = {},
  fallbackState = {},
  billViewData = {},
  partListData = [],
  loading = false,
}) => {
  const resolvedBillViewData = normalizeSingleRecord(
    billViewData.data ?? billViewData.billSummary ?? billViewData,
  );
  const callreportSummary = normalizeSingleRecord(
    viewData.callreportSummary ?? viewData.data?.callreportSummary,
  );
  const ticketSummary = normalizeSingleRecord(
    viewData.ticketSummary ?? viewData.data?.ticketSummary,
  );
  const billSummary = normalizeSingleRecord(viewData.billSummary ?? viewData.data?.billSummary);
  const worksheetDetails = normalizeSingleRecord(
    viewData.worsheetDetails ?? viewData.data?.worsheetDetails,
  );
  const resolvedBillSummary = normalizeSingleRecord(
    resolvedBillViewData.billSummary ??
      resolvedBillViewData.BillSummary ??
      resolvedBillViewData.data?.billSummary ??
      resolvedBillViewData.data?.BillSummary ??
      resolvedBillViewData,
  );

  const summaryText =
    String(callreportSummary.cCallSummary || worksheetDetails.cSummary || fallbackState.summary || "")
      .trim();
  const customerName =
    resolvedBillSummary.cCustomerName ||
    ticketSummary.cCustomerName ||
    fallbackState.customerName ||
    "-";
  const address =
    resolvedBillSummary.cCustomerAddress ||
    ticketSummary.cCustomerAddress ||
    fallbackState.address ||
    "NIL";
  const gstNo =
    resolvedBillSummary.cGstNumber ||
    resolvedBillSummary.cGSTNo ||
    ticketSummary.cGstNumber ||
    fallbackState.cGstNumber ||
    "-";
  const billNo = resolvedBillSummary.nBillNo || billSummary.nBillNo || fallbackState.billNo || "-";
  const billDate =
    resolvedBillSummary.dBillDate || billSummary.dBillDate || fallbackState.billDate || "-";
  const payMode =
    resolvedBillSummary.cPaymodeName ||
    billSummary.cPaymodeName ||
    fallbackState.payMode ||
    "-";
  const billAmount = toNumber(
    resolvedBillSummary.nTotalAmount ?? billSummary.nTotalAmount ?? fallbackState.amount,
    0,
  );

  const rows = useMemo(
    () =>
      normalizePartRows(
        (Array.isArray(partListData) && partListData.length > 0
          ? partListData
          : resolvedBillSummary.partDetails) ??
          resolvedBillSummary.PartDetails ??
          billSummary.partDetails ??
          billSummary.PartDetails ??
          worksheetDetails.partDetails ??
          [],
      ),
    [
      partListData,
      resolvedBillSummary.partDetails,
      resolvedBillSummary.PartDetails,
      billSummary.partDetails,
      billSummary.PartDetails,
      worksheetDetails.partDetails,
    ],
  );

  const totals = useMemo(() => {
    const computed = rows.reduce(
      (acc, row) => {
        acc.value += row.value;
        acc.discount += row.discount;
        acc.tax += row.tax;
        acc.total += row.total;
        return acc;
      },
      { value: 0, discount: 0, tax: 0, total: 0 },
    );

    return {
      value: computed.value,
      discount: computed.discount,
      tax: computed.tax,
      total: billAmount || computed.total,
    };
  }, [billAmount, rows]);

  return (
    <div className="flex min-h-0 flex-col bg-white">
      <div className="rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-4">
        <div className="grid gap-3 text-[13px] text-slate-700 md:grid-cols-[auto_auto_auto_1fr] md:items-center">
          <div className="flex items-center gap-2 whitespace-nowrap border-sky-100 md:border-r md:pr-6">
             <img src={billicon} alt="" className="h-5 w-5" />  
            <span className="font-semibold text-slate-700">Bill No :</span>
           <span>{billNo}</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap border-sky-100 md:border-r md:px-6">
             <img src={customericonbill} alt="" className="h-5 w-5" />  
            <span className="font-semibold text-slate-700">Customer Name :</span>
            <span>{customerName}</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap border-sky-100 md:border-r md:px-6">
             <img src={gst} alt="" className="h-5 w-5" />  
            <span className="font-semibold text-slate-700">GST No :</span>
            <span>{gstNo}</span>
          </div>
          <div className="text-right font-semibold text-slate-800">{billDate}</div>
        </div>
        <div className="mt-3 text-[13px] text-slate-700">
          <span className="font-medium text-slate-800">Address :</span> {address || "NIL"}
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-100">
        <div className="grid grid-cols-[40px_minmax(220px,1.8fr)_80px_100px_100px_100px_90px_110px] gap-x-2 bg-[#6aa8d9] px-3 py-2 text-[13px] font-medium text-white">
          <div>Srl</div>
          <div>Description</div>
          <div className="text-right">Qty</div>
          <div className="text-right">Rate</div>
          <div className="text-right">Value</div>
          <div className="text-right">Discount</div>
          <div className="text-right">Tax</div>
          <div className="text-right">Total</div>
        </div>

        <div className="bg-white">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">Loading bill details...</div>
          ) : rows.length > 0 ? (
            rows.map((row, index) => (
              <div
                key={row.key}
                className="grid grid-cols-[40px_minmax(220px,1.8fr)_80px_100px_100px_100px_90px_110px] gap-x-2 border-b border-slate-100 px-3 py-3 text-[13px] text-slate-700 last:border-b-0"
              >
                <div>{index + 1}</div>
                <div>{row.description}</div>
                <div className="text-right">{row.qty.toFixed(2)}</div>
                <div className="text-right">{formatMoney(row.rate)}</div>
                <div className="text-right">{formatMoney(row.value)}</div>
                <div className="text-right">{formatMoney(row.discount)}</div>
                <div className="text-right">{formatMoney(row.tax)}</div>
                <div className="text-right">{formatMoney(row.total)}</div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              No bill items available.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-[#f3f3f3] px-4 py-5">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2 text-[13px] text-slate-700">
            <div className="flex min-w-[220px] justify-between gap-10">
              <span>Total</span>
              <span>{formatMoney(totals.total)}</span>
            </div>
            <div className="flex min-w-[220px] justify-between gap-10">
              <span>Discount</span>
              <span>{formatMoney(totals.discount)}</span>
            </div>
            <div className="flex min-w-[220px] justify-between gap-10">
              <span>Tax Amount</span>
              <span>{formatMoney(totals.tax)}</span>
            </div>
            <div className="flex min-w-[220px] justify-between gap-10">
              <span>Round Off</span>
              <span>{formatMoney(0)}</span>
            </div>
            <div className="flex min-w-[220px] justify-between gap-10 font-semibold text-slate-900">
              <span>Grand Total</span>
              <span>{formatMoney(totals.total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-x-12 gap-y-3 text-[13px] text-slate-700 md:min-w-[300px]">
            <span>Pay Amount</span>
            <span className="text-right text-[18px] font-semibold text-amber-500">
              {formatMoney(totals.total)}
            </span>
            <span>Pay Mode</span>
            <span className="text-right font-medium text-slate-900">{payMode}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillReadonlyView;
