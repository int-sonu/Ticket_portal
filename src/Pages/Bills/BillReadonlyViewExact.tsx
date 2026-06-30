import React, { useMemo, useState } from "react";
import billicon from "../../assets/Bills/billIcon.png";
import customericonbill from "../../assets/Bills/customerIconbill.png";
import editIcon from "../../assets/Bills/EditIcon.png";
import gst from "../../assets/Bills/gstIcon.png";
import previewIcon from "../../assets/Bills/PreviewIcon.png";
import printIcon from "../../assets/Bills/PrintIcon.png";
import shareIcon from "../../assets/Bills/ShareIcon.png";
import closeblack from "../../assets/icons/close-black.svg";
import deleteRed from "../../assets/icons/delete-red.svg";

type BillReadonlyViewExactProps = {
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

const safeParse = (value: string | null) => {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const formatMoney = (value: number) => `₹${Number(value || 0).toFixed(2)}`;

const formatDateText = (value: any) => {
  if (value === null || value === undefined || value === "") return "-";
  const text = String(value).trim();
  if (!text) return "-";
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toLocaleString("en-GB");
};

const normalizePartRows = (partDetails: any[]): BillItemRow[] =>
  (Array.isArray(partDetails) ? partDetails : []).map((item: any, index: number) => {
    const qty = toNumber(getFirstValue(item ?? {}, ["nQty", "qty", "Qty"]), 1);
    const rate = toNumber(getFirstValue(item ?? {}, ["nRate", "rate", "Rate"]), 0);
    const value = qty * rate;
    const discount = toNumber(
      getFirstValue(item ?? {}, ["nDiscountAmt", "nDiscAmt", "discount", "Discount"]),
      0,
    );
    const tax = toNumber(
      getFirstValue(item ?? {}, ["nTaxAmount", "nTaxAmt", "tax", "Tax"]),
      0,
    );
    const rawTotal = getFirstValue(item ?? {}, ["nTotalAmount", "total", "Total"]);
    const computedTotal = value - discount + tax;
    const total =
      rawTotal === "" || rawTotal === null || rawTotal === undefined || Number(rawTotal) === 0
        ? computedTotal
        : toNumber(rawTotal, computedTotal);

    return {
      key: String(getFirstValue(item ?? {}, ["nRowId", "nPartId", "partId", "id"]) || index + 1),
      description:
        String(
          getFirstValue(item ?? {}, [
            "cPartName",
            "PartName",
            "cNarration",
            "cDescription",
            "Description",
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

const BillReadonlyViewExact: React.FC<BillReadonlyViewExactProps> = ({
  viewData = {},
  fallbackState = {},
  billViewData = {},
  partListData = [],
  loading = false,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const storedCredentials = safeParse(localStorage.getItem("userCredentials"));
  const companyDetails = normalizeSingleRecord(
    storedCredentials?.data?.companyDetails ?? storedCredentials?.companyDetails ?? {},
  );
  const resolvedBillViewData = normalizeSingleRecord(
    billViewData.data ?? billViewData.billSummary ?? billViewData,
  );
  const callreportSummary = normalizeSingleRecord(
    viewData.callreportSummary ?? viewData.data?.callreportSummary,
  );
  const ticketSummary = normalizeSingleRecord(
    viewData.ticketSummary ?? viewData.data?.ticketSummary,
  );
  const worksheetDetails = normalizeSingleRecord(
    viewData.worsheetDetails ?? viewData.data?.worsheetDetails,
  );
  const billSummary = normalizeSingleRecord(
    resolvedBillViewData.billSummary ??
      resolvedBillViewData.BillSummary ??
      resolvedBillViewData.data?.billSummary ??
      resolvedBillViewData.data?.BillSummary ??
      resolvedBillViewData,
  );

  const customerName =
    billSummary.cCustomerName || ticketSummary.cCustomerName || fallbackState.customerName || "-";
  const companyName =
    fallbackState.companyName ||
    companyDetails.cComapnyName ||
    companyDetails.cCompanyName ||
    viewData.companyName ||
    viewData.cCompanyName ||
    "Testing Company";
  const address =
    billSummary.cAddress ||
    ticketSummary.cCustomerAddress ||
    fallbackState.address ||
    "NIL";
  const gstNo = billSummary.cGstNumber || billSummary.cGSTNo || fallbackState.cGstNumber || "-";
  const billNo = billSummary.nBillNo || fallbackState.billNo || "-";
  const billDate = formatDateText(billSummary.dBillDate || fallbackState.billDate || "-");
  const companyAddress =
    companyDetails.cAddress ||
    companyDetails.cCompanyAddress ||
    companyDetails.cLocation ||
    address;
  const companyEmail =
    companyDetails.cEmail ||
    companyDetails.cCompanyEmail ||
    storedCredentials?.data?.cEmail ||
    storedCredentials?.cEmail ||
    "";
  const companyPhone =
    companyDetails.cMobile ||
    companyDetails.cPhone ||
    companyDetails.cContactNumber ||
    storedCredentials?.data?.cMobile ||
    storedCredentials?.cMobile ||
    "";

  const payDetails = Array.isArray(billSummary.payDtls)
    ? billSummary.payDtls
    : Array.isArray(billSummary.PayDtls)
      ? billSummary.PayDtls
      : [];
  const payMode =
    payDetails[0]?.cPaymode || payDetails[0]?.cPayMode || fallbackState.payMode || "-";

  const rowSource =
    (Array.isArray(billSummary.itemDtls) && billSummary.itemDtls.length > 0
      ? billSummary.itemDtls
      : Array.isArray(billSummary.ItemDtls) && billSummary.ItemDtls.length > 0
        ? billSummary.ItemDtls
        : Array.isArray(partListData) && partListData.length > 0
          ? partListData
          : []) ?? [];

  const rows = useMemo(() => normalizePartRows(rowSource), [rowSource]);

  const totals = useMemo(
    () => ({
      value: toNumber(billSummary.nGrossAmount, rows.reduce((sum, row) => sum + row.value, 0)),
      discount: toNumber(billSummary.nDiscountAmt, rows.reduce((sum, row) => sum + row.discount, 0)),
      tax: toNumber(billSummary.nTaxAmount, rows.reduce((sum, row) => sum + row.tax, 0)),
      roundoff: toNumber(billSummary.nRoundoffAmount, 0),
      total: toNumber(billSummary.nTotalAmount, rows.reduce((sum, row) => sum + row.total, 0)),
    }),
    [billSummary, rows],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
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
          <span className="font-medium text-slate-800">Address :</span> {address}
        </div>
      </div>

      <div className="mt-3 flex-1 overflow-hidden rounded-lg border border-slate-100">
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

        <div className="max-h-full overflow-y-auto bg-white">
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
            <div className="px-4 py-6 text-center text-sm text-slate-500">No bill items available.</div>
          )}
        </div>
      </div>

<div className="sticky bottom-0 left-0 mt-57 border-t border-slate-200 bg-[#f3f3f3] px-2 py-5">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2 text-[13px] text-slate-700">
            <div className="flex min-w-[210px] justify-between gap-10">
              <span>Total</span>
              <span>{formatMoney(totals.value || totals.total)}</span>
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
              <span>{formatMoney(totals.roundoff)}</span>
            </div>
            <div className="flex min-w-[220px] justify-between gap-10 font-semibold text-slate-900">
              <span>Grand Total</span>
              <span>{formatMoney(totals.total)}</span>
            </div>
          </div>

          <div className="flex w-full flex-col items-end gap-4 md:w-auto">
            <div className="grid w-full max-w-[320px] grid-cols-[auto_1fr] gap-x-12 gap-y-3 text-[13px] text-slate-700">
              <span>Pay Amount</span>
              <span className="text-right text-[18px] font-semibold text-amber-500">
                {formatMoney(totals.total)}
              </span>
              <span>Pay Mode</span>
              <span className="text-right font-medium text-slate-900">{payMode}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center hover:bg-slate-50"
                aria-label="Preview bill"
                onClick={() => setPreviewOpen(true)}
              >
                <img src={previewIcon} alt="" className="h-9 w-9   rounded-md border border-black/25" />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center  hover:bg-slate-50"
                aria-label="Share bill"
              >
                <img src={shareIcon} alt="" className="h-9 w-9  rounded-md border border-black/25" />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center  hover:bg-slate-50"
                aria-label="Print bill"
              >
                <img src={printIcon} alt="" className="h-9 w-9  rounded-md border border-black/25" />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center  hover:bg-slate-50"
                aria-label="Edit bill"
              >
                <img src={editIcon} alt="" className="h-9 w-9  rounded-md border border-black/25" />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#ff4d4f] bg-[#ff4d4f] hover:opacity-90"
                aria-label="Delete bill"
              >
                <img src={deleteRed} alt="" className="h-4 w-4 brightness-0 invert" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/20 p-4">
          <div className="w-full max-w-[760px] overflow-hidden rounded-md bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="text-[18px] font-semibold text-slate-900">Bill Preview</div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
                  aria-label="Share bill preview"
                >
                  <img src={shareIcon} alt="" className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
                  aria-label="Close bill preview"
                  onClick={() => setPreviewOpen(false)}
                >
                  <img src={closeblack} alt="" className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="rounded-sm border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-5">
                  <div className="text-center text-[15px] font-semibold text-slate-900">
                    {companyName}
                  </div>
                  <div className="mt-1 text-center text-[12px] text-slate-500">
                    {address}
                  </div>
                </div>

                <div className="flex items-start justify-between px-4 py-3 text-[13px] text-slate-700">
                  <div>
                    <div>Bill No : {billNo}</div>
                    <div className="mt-2">Customer : {customerName}</div>
                  </div>
                  <div>{billDate}</div>
                </div>

                <div className="border-t border-slate-200">
                  <div className="grid grid-cols-[40px_minmax(180px,1.8fr)_70px_90px_90px_90px_70px_90px] bg-sky-100 text-[12px] font-medium text-slate-700">
                    <div className="border-r border-sky-200 px-3 py-3">Sl</div>
                    <div className="border-r border-sky-200 px-3 py-3">Description</div>
                    <div className="border-r border-sky-200 px-3 py-3 text-right">Qty</div>
                    <div className="border-r border-sky-200 px-3 py-3 text-right">Rate</div>
                    <div className="border-r border-sky-200 px-3 py-3 text-right">Value</div>
                    <div className="border-r border-sky-200 px-3 py-3 text-right">Discount</div>
                    <div className="border-r border-sky-200 px-3 py-3 text-right">Tax</div>
                    <div className="px-3 py-3 text-right">Total</div>
                  </div>

                  {rows.map((row, index) => (
                    <div
                      key={`preview-${row.key}`}
                      className="grid grid-cols-[40px_minmax(180px,1.8fr)_70px_90px_90px_90px_70px_90px] border-t border-slate-200 text-[12px] text-slate-700"
                    >
                      <div className="border-r border-slate-200 px-3 py-3">{index + 1}</div>
                      <div className="border-r border-slate-200 px-3 py-3">{row.description}</div>
                      <div className="border-r border-slate-200 px-3 py-3 text-right">{row.qty.toFixed(2)}</div>
                      <div className="border-r border-slate-200 px-3 py-3 text-right">{formatMoney(row.rate)}</div>
                      <div className="border-r border-slate-200 px-3 py-3 text-right">{formatMoney(row.value)}</div>
                      <div className="border-r border-slate-200 px-3 py-3 text-right">{formatMoney(row.discount)}</div>
                      <div className="border-r border-slate-200 px-3 py-3 text-right">{formatMoney(row.tax)}</div>
                      <div className="px-3 py-3 text-right">{formatMoney(row.total)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 bg-[#f6f4f4] px-4 py-4">
                <div className="flex justify-end">
                  <div className="w-full max-w-[260px] space-y-2 text-[13px] text-slate-700">
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span>{formatMoney(totals.value || totals.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span>{formatMoney(totals.discount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatMoney(totals.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Round Off</span>
                      <span>{formatMoney(totals.roundoff)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>Grand Total</span>
                      <span>{formatMoney(totals.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BillReadonlyViewExact;
