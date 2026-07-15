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
import share from "../../assets/icons/shareIcon.svg";
import { billingApis } from "../../Axios/BillingApis";
import { getApiImageBaseUrl } from "../../Axios/config";
import { getRequestPayload } from "../../Utils/requestPayload";
import { useQuery } from "@tanstack/react-query";
import BillShareModal from "./BillShareModal";

type BillReadonlyViewExactProps = {
  viewData?: Record<string, any>;
  fallbackState?: Record<string, any>;
  billViewData?: Record<string, any>;
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

const resolveConfigurationRecord = (value: any) => {
  const root = normalizeSingleRecord(value);
  const candidates = [
    root?.data,
    root?.result,
    root?.configuration,
    root?.companyDetails,
    root?.CompanyDetails,
    root?.Data,
    root?.Result,
  ];
  const targetKeys = new Set([
    "ccompanyname",
    "ccomapnyname",
    "companyname",
    "caddress",
    "address",
    "ccompanyaddress",
    "companyaddress",
    "cemail",
    "email",
    "ccompanyemail",
    "cmail",
    "cphoneno",
    "cphonenumber",
    "phonenumber",
    "phone",
    "phoneno",
    "cmobile",
    "cmobileno",
    "mobileno",
    "ccontactno",
    "contactno",
    "clogourl",
    "logourl",
    "ccompanylogourl",
    "clogopath",
    "logopath",
    "clogo",
    "ccompanylogo",
    "ccompanylogoimage",
  ]);

  const deepFind = (input: any, seen = new Set<any>()): Record<string, any> => {
    if (!input || typeof input !== "object" || seen.has(input)) return {};
    seen.add(input);

    if (Array.isArray(input)) {
      for (const item of input) {
        const match = deepFind(item, seen);
        if (Object.keys(match).length > 0) return match;
      }
      return {};
    }

    const keys = Object.keys(input);
    const hasTarget = keys.some((key) => targetKeys.has(key.toLowerCase()));
    if (hasTarget) {
      return input as Record<string, any>;
    }

    for (const key of keys) {
      const match = deepFind((input as any)[key], seen);
      if (Object.keys(match).length > 0) return match;
    }

    return {};
  };

  const hasTargetKeys = (record: Record<string, any>) =>
    Object.keys(record ?? {}).some((key) => targetKeys.has(key.toLowerCase()));

  for (const candidate of candidates) {
    const resolved = normalizeSingleRecord(candidate);
    if (Object.keys(resolved).length > 0 && hasTargetKeys(resolved)) {
      return resolved;
    }

    const deepResolved = deepFind(candidate);
    if (Object.keys(deepResolved).length > 0) {
      return deepResolved;
    }
  }

  const deepRoot = deepFind(root);
  if (Object.keys(deepRoot).length > 0) return deepRoot;

  return root;
};

const scoreBillRecord = (record: Record<string, any>) => {
  if (!record || typeof record !== "object") return -1;

  const keys = Object.keys(record).map((key) => key.toLowerCase());
  const has = (names: string[]) => keys.some((key) => names.includes(key));

  let score = 0;

  if (has(["nbillid", "billid"])) score += 100;
  if (has(["nbillno", "billno", "cbillno"])) score += 25;
  if (has(["dbilldate", "billdate"])) score += 10;
  if (has(["itemdtls", "itemdetails", "partdetails", "rows"])) score += 12;
  if (has(["paydtls", "paymentdetails", "paymentdtls"])) score += 8;
  if (has(["totals", "total", "billsummary"])) score += 6;
  if (has(["ccustomername", "customername"])) score += 4;
  if (has(["ccompanyname", "companyname", "ccomapnyname"])) score += 4;
  if (has(["caddress", "address"])) score += 2;
  if (has(["cemail", "email"])) score += 2;
  if (has(["cphoneno", "phoneno", "phonenumber", "phone"])) score += 2;

  const numericId = Number(record.nBillId ?? record.BillId ?? record.billId ?? 0);
  if (Number.isFinite(numericId) && numericId > 0) {
    score += Math.min(numericId / 1000, 1);
  }

  return score;
};

const findBestBillRecord = (value: any) => {
  const seen = new Set<any>();
  let bestRecord: Record<string, any> = {};
  let bestScore = -1;
  let bestId = -1;

  const visit = (input: any) => {
    if (!input || typeof input !== "object" || seen.has(input)) return;
    seen.add(input);

    if (Array.isArray(input)) {
      for (const item of input) {
        visit(item);
      }
      return;
    }

    const record = input as Record<string, any>;
    const score = scoreBillRecord(record);
    const numericId = Number(record.nBillId ?? record.BillId ?? record.billId ?? 0) || 0;

    if (
      score > bestScore ||
      (score === bestScore && numericId > bestId) ||
      (score === bestScore && numericId === bestId && Object.keys(record).length > Object.keys(bestRecord).length)
    ) {
      bestScore = score;
      bestId = numericId;
      bestRecord = record;
    }

    for (const child of Object.values(record)) {
      if (child && typeof child === "object") {
        visit(child);
      }
    }
  };

  visit(value);
  return bestRecord;
};

const collectBillIds = (value: any) => {
  const seen = new Set<any>();
  const ids: number[] = [];

  const visit = (input: any) => {
    if (!input || typeof input !== "object" || seen.has(input)) return;
    seen.add(input);

    if (Array.isArray(input)) {
      for (const item of input) {
        visit(item);
      }
      return;
    }

    const numericId = Number(input.nBillId ?? input.BillId ?? input.billId ?? 0);
    if (Number.isFinite(numericId) && numericId > 0) {
      ids.push(numericId);
    }

    for (const child of Object.values(input)) {
      if (child && typeof child === "object") {
        visit(child);
      }
    }
  };

  visit(value);
  return ids;
};

const getBillPdfUrl = (response: any) => {
  const responseData = response?.data ?? response ?? {};
  const candidates = [
    responseData?.data?.pdfPath,
    responseData?.data?.cPdfPath,
    responseData?.data?.filePath,
    responseData?.data?.path,
    responseData?.data?.pdfUri,
    responseData?.data?.pdfUrl,
    responseData?.data?.url,
    responseData?.pdfPath,
    responseData?.cPdfPath,
    responseData?.filePath,
    responseData?.path,
    responseData?.pdfUri,
    responseData?.pdfUrl,
    responseData?.url,
  ];

  const match = candidates.find((item) => typeof item === "string" && item.trim());
  return typeof match === "string" ? match.trim() : "";
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

export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const getPdfUrlFromResponse = (response: any) => {
  const responseData = response?.data ?? response ?? {};
  const candidates = [
    responseData?.data?.pdfPath,
    responseData?.data?.cPdfPath,
    responseData?.data?.filePath,
    responseData?.data?.path,
    responseData?.data?.cFileUrl,
    responseData?.cFileUrl,
    responseData?.data?.fileUrl,
    responseData?.fileUrl,
    responseData?.data?.pdfUri,
    responseData?.pdfUri,
    responseData?.data?.pdfUrl,
    responseData?.data?.cPdfUrl,
    responseData?.data?.url,
    responseData?.data?.fileUrl,
    responseData?.data?.path,
    responseData?.pdfPath,
    responseData?.cPdfPath,
    responseData?.filePath,
    responseData?.path,
    responseData?.pdfUrl,
    responseData?.cPdfUrl,
    responseData?.url,
    responseData?.fileUrl,
    responseData?.path,
  ];

  const match = candidates.find(
    (value) => typeof value === "string" && value.trim(),
  );

  return typeof match === "string" ? match.trim() : "";
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
  (Array.isArray(partDetails) ? partDetails : []).map(
    (item: any, index: number) => {
      const qty = toNumber(
        getFirstValue(item ?? {}, ["nQty", "qty", "Qty"]),
        1,
      );
      const rate = toNumber(
        getFirstValue(item ?? {}, ["nRate", "rate", "Rate"]),
        0,
      );
      const value = qty * rate;
      const discount = toNumber(
        getFirstValue(item ?? {}, [
          "nDiscountAmt",
          "nDiscAmt",
          "discount",
          "Discount",
        ]),
        0,
      );
      const tax = toNumber(
        getFirstValue(item ?? {}, ["nTaxAmount", "nTaxAmt", "tax", "Tax"]),
        0,
      );
      const rawTotal = getFirstValue(item ?? {}, [
        "nTotalAmount",
        "total",
        "Total",
      ]);
      const computedTotal = value - discount + tax;
      const total =
        rawTotal === "" ||
        rawTotal === null ||
        rawTotal === undefined ||
        Number(rawTotal) === 0
          ? computedTotal
          : toNumber(rawTotal, computedTotal);

      return {
        key: String(
          getFirstValue(item ?? {}, ["nRowId", "nPartId", "partId", "id"]) ||
            index + 1,
        ),
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
    },
  );

const BillReadonlyViewExact: React.FC<BillReadonlyViewExactProps> = ({
  viewData = {},
  fallbackState = {},
  billViewData = {},
  loading = false,
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printPdfUrl, setPrintPdfUrl] = useState("");
  const storedCredentials = safeParse(localStorage.getItem("userCredentials"));
  const sessionPayload = useMemo(() => getRequestPayload(), []);
  const companyDetails = normalizeSingleRecord(
    storedCredentials?.data?.companyDetails ??
      storedCredentials?.companyDetails ??
      {},
  );
  const resolvedBillViewData = normalizeSingleRecord(
    billViewData.data ?? billViewData.billSummary ?? billViewData,
  );
  const bestBillRecord = useMemo(
    () =>
      findBestBillRecord({
        viewData,
        fallbackState,
        billViewData,
        resolvedBillViewData,
        billSummary: resolvedBillViewData.billSummary ?? resolvedBillViewData,
      }),
    [billViewData, fallbackState, resolvedBillViewData, viewData],
  );
  const billIdCandidates = useMemo(
    () =>
      collectBillIds({
        viewData,
        fallbackState,
        billViewData,
        resolvedBillViewData,
        billSummary: resolvedBillViewData.billSummary ?? resolvedBillViewData,
      }),
    [billViewData, fallbackState, resolvedBillViewData, viewData],
  );
  const ticketSummary = normalizeSingleRecord(
    viewData.ticketSummary ?? viewData.data?.ticketSummary,
  );
  const billSummary = normalizeSingleRecord(
    resolvedBillViewData.billSummary ??
      resolvedBillViewData.BillSummary ??
      resolvedBillViewData.data?.billSummary ??
      resolvedBillViewData.data?.BillSummary ??
      resolvedBillViewData,
  );
  const companyDetailsPayload = useMemo(
    () => ({
      nCompanyId:
        Number(
          billSummary.nCompanyId ??
            ticketSummary.nCompanyId ??
            fallbackState.nCompanyId ??
            fallbackState.companyDetails?.nCompanyId ??
            fallbackState.companyDetails?.companyId ??
            fallbackState.sessionPayload?.nCompanyId ??
            viewData.sessionPayload?.nCompanyId ??
            viewData.companyDetails?.nCompanyId ??
            viewData.companyDetails?.companyId ??
            viewData.nCompanyId ??
            sessionPayload.nCompanyId ??
            storedCredentials?.data?.nCompanyId ??
            storedCredentials?.data?.companyDetails?.nCompanyId ??
            storedCredentials?.data?.companyDetails?.companyId ??
            storedCredentials?.companyDetails?.nCompanyId ??
            storedCredentials?.companyDetails?.companyId ??
            storedCredentials?.nCompanyId ??
            0,
        ) || 0,
      cSchemaName:
        fallbackState.companyDetails?.cSchemaName ??
        viewData.companyDetails?.cSchemaName ??
        storedCredentials?.data?.companyDetails?.cSchemaName ??
        storedCredentials?.companyDetails?.cSchemaName ??
        fallbackState.sessionPayload?.cSchemaName ??
        viewData.sessionPayload?.cSchemaName ??
        sessionPayload.cSchemaName ??
        fallbackState.cSchemaName ??
        viewData.cSchemaName ??
        storedCredentials?.data?.cSchemaName ??
        storedCredentials?.cSchemaName ??
        "",
      cDbName:
        fallbackState.companyDetails?.cDbName ??
        viewData.companyDetails?.cDbName ??
        storedCredentials?.data?.companyDetails?.cDbName ??
        storedCredentials?.companyDetails?.cDbName ??
        fallbackState.sessionPayload?.cDbName ??
        viewData.sessionPayload?.cDbName ??
        sessionPayload.cDbName ??
        fallbackState.cDbName ??
        viewData.cDbName ??
        storedCredentials?.data?.cDbName ??
        storedCredentials?.cDbName ??
        "",
    }),
    [
      billSummary.nCompanyId,
      fallbackState,
      sessionPayload,
      storedCredentials,
      ticketSummary.nCompanyId,
      viewData,
    ],
  );
  const { data: companyDetailsResponse } = useQuery({
    queryKey: ["bill-readonly-company-details", companyDetailsPayload],
    queryFn: () => billingApis.companyDetails(companyDetailsPayload),
    enabled: !!companyDetailsPayload.nCompanyId,
  });
  const apiCompanyDetails = normalizeSingleRecord(
    resolveConfigurationRecord(
      companyDetailsResponse?.data?.data ??
        companyDetailsResponse?.data ??
        companyDetailsResponse ??
        {},
    ),
  );

  const customerName =
    billSummary.cCustomerName ||
    ticketSummary.cCustomerName ||
    fallbackState.customerName ||
    "-";
  const companyName =
    fallbackState.companyName ||
    apiCompanyDetails.cComapnyName ||
    apiCompanyDetails.cCompanyName ||
    apiCompanyDetails.companyName ||
    apiCompanyDetails.cName ||
    companyDetails.cCompanyName ||
    companyDetails.companyName ||
    viewData.cCompanyName ||
    viewData.companyName ||
    "Testing Company";
  const address =
    apiCompanyDetails.cAddress ||
    apiCompanyDetails.address ||
    apiCompanyDetails.cCompanyAddress ||
    apiCompanyDetails.companyAddress ||
    companyDetails.cAddress ||
    companyDetails.address ||
    companyDetails.cCompanyAddress ||
    companyDetails.companyAddress ||
    billSummary.cAddress ||
    ticketSummary.cCustomerAddress ||
    fallbackState.address ||
    "NIL";
  const gstNo =
    billSummary.cGstNumber ||
    billSummary.cGSTNo ||
    fallbackState.cGstNumber ||
    "-";
    
  const billNo =
    bestBillRecord.nBillNo ??
    bestBillRecord.BillNo ??
    bestBillRecord.billNo ??
    billSummary.nBillNo ??
    fallbackState.billNo ??
    "-";
  const billId = Math.max(
    0,
    ...billIdCandidates,
    Number(
      bestBillRecord.nBillId ??
        bestBillRecord.BillId ??
        bestBillRecord.billId ??
        fallbackState.billId ??
        fallbackState.nBillId ??
        fallbackState.BillId ??
        viewData.billId ??
        viewData.nBillId ??
        viewData.BillId ??
        billViewData.billId ??
        billViewData.nBillId ??
        billViewData.BillId ??
        billSummary.nBillId ??
        billSummary.BillId ??
        billSummary.billId ??
        0,
    ) || 0,
  );
  const billDate = formatDateText(
    billSummary.dBillDate || fallbackState.billDate || "-",
  );
  const companyAddress =
    apiCompanyDetails.cAddress ||
    apiCompanyDetails.address ||
    apiCompanyDetails.cCompanyAddress ||
    apiCompanyDetails.companyAddress ||
    fallbackState.address ||
    address ||
    "";
  const Email =
    apiCompanyDetails.cEmail ||
    apiCompanyDetails.email ||
    apiCompanyDetails.cCompanyEmail ||
    apiCompanyDetails.cMail ||
    companyDetails.cEmail ||
    "";
    
  const phone =
    apiCompanyDetails.cPhoneNo ||
    apiCompanyDetails.phoneNo ||
    apiCompanyDetails.cPhone ||
    apiCompanyDetails.cMobileNo ||
    apiCompanyDetails.mobileNo ||
    apiCompanyDetails.cContactNo ||
    companyDetails.cPhoneNo ||
    "";

  const companyLogoUrl = ensureAbsoluteUrl(
    apiCompanyDetails.cLogoUrl ||
      apiCompanyDetails.logoUrl ||
      apiCompanyDetails.cCompanyLogoUrl ||
      apiCompanyDetails.cLogoPath ||
      apiCompanyDetails.logoPath ||
      apiCompanyDetails.cLogo ||
      apiCompanyDetails.cCompanyLogo ||
      companyDetails.cLogoUrl ||
      companyDetails.logoUrl ||
      companyDetails.cCompanyLogoUrl ||
      companyDetails.cLogoPath ||
      companyDetails.logoPath ||
      companyDetails.cLogo ||
      fallbackState.cLogoUrl ||
      viewData.cLogoUrl ||
      viewData.logoUrl,
  );
  const payDetails = Array.isArray(billSummary.payDtls)
    ? billSummary.payDtls
    : Array.isArray(billSummary.PayDtls)
      ? billSummary.PayDtls
      : [];
  const payMode =
    payDetails[0]?.cPaymode ||
    payDetails[0]?.cPayMode ||
    fallbackState.payMode ||
    "-";

  const itemSourceCandidates = [
    billSummary.itemDtls,
    billSummary.ItemDtls,
    billSummary.partDetails,
    billSummary.PartDetails,
    billSummary.rows,
    billSummary.Rows,
    billViewData.itemDtls,
    billViewData.ItemDtls,
    billViewData.partDetails,
    billViewData.PartDetails,
    billViewData.rows,
    billViewData.Rows,
    resolvedBillViewData.itemDtls,
    resolvedBillViewData.ItemDtls,
    resolvedBillViewData.partDetails,
    resolvedBillViewData.PartDetails,
    resolvedBillViewData.rows,
    resolvedBillViewData.Rows,
    resolvedBillViewData.data?.itemDtls,
    resolvedBillViewData.data?.ItemDtls,
    resolvedBillViewData.data?.partDetails,
    resolvedBillViewData.data?.PartDetails,
    resolvedBillViewData.data?.rows,
    resolvedBillViewData.data?.Rows,
  ];

  const rowSource =
    itemSourceCandidates.find(
      (candidate) => Array.isArray(candidate) && candidate.length > 0,
    ) ?? [];

  const rows = useMemo(() => normalizePartRows(rowSource), [rowSource]);

  const totals = useMemo(
    () => ({
      value: toNumber(
        billSummary.nGrossAmount,
        rows.reduce((sum, row) => sum + row.value, 0),
      ),
      discount: toNumber(
        billSummary.nDiscountAmt,
        rows.reduce((sum, row) => sum + row.discount, 0),
      ),
      tax: toNumber(
        billSummary.nTaxAmount,
        rows.reduce((sum, row) => sum + row.tax, 0),
      ),
      roundoff: toNumber(billSummary.nRoundoffAmount, 0),
      total: toNumber(
        billSummary.nTotalAmount,
        rows.reduce((sum, row) => sum + row.total, 0),
      ),
    }),
    [billSummary, rows],
  );
  const billShareContext = useMemo(
    () => ({
      billNo,
      billId,
      billDate,
      billSummary,
      ticketSummary,
      rows,
      totals,
      payDtls: payDetails,
      customerName,
      companyName,
      companyAddress,
      companyEmail: Email,
      companyPhone: phone,
      cSchemaName: companyDetailsPayload.cSchemaName,
      cDbName: companyDetailsPayload.cDbName,
      nCompanyId: companyDetailsPayload.nCompanyId,
      payMode,
      rawViewData: viewData,
      rawFallbackState: fallbackState,
      rawBillViewData: billViewData,
    }),
    [
      Email,
      billDate,
      billNo,
      billId,
      billSummary,
      companyAddress,
      companyDetailsPayload.cDbName,
      companyDetailsPayload.cSchemaName,
      companyDetailsPayload.nCompanyId,
      companyName,
      customerName,
      payDetails,
      payMode,
      phone,
      rows,
      ticketSummary,
      totals,
      viewData,
      fallbackState,
      billViewData,
    ],
  );

  const handlePrintBill = async () => {
    if (isPrinting) return;

    const companyId = Number(companyDetailsPayload.nCompanyId ?? 0) || 0;
    const schemaName = String(companyDetailsPayload.cSchemaName ?? "").trim();
    const dbName = String(companyDetailsPayload.cDbName ?? "").trim();

    if (!companyId || !schemaName || !dbName) {
      return;
    }

    const billIdToExport = billId;
    if (!billIdToExport) {
      return;
    }

    setIsPrinting(true);
    try {
      const configResponse = await billingApis.getConfiguration({
        ...sessionPayload,
        ...companyDetailsPayload,
      });
      const configuration = normalizeSingleRecord(
        configResponse?.data?.data ?? configResponse?.data ?? configResponse ?? {},
      );

      const exportPayload = {
        ...sessionPayload,
        ...companyDetailsPayload,
        ...billShareContext,
        nCompanyId: companyId,
        cSchemaName: schemaName,
        cDbName: dbName,
        nBillId: billIdToExport,
        BillId: billIdToExport,
        billId: billIdToExport,
        cCompanyName:
          billShareContext.companyName ??
          configuration?.cCompanyName ??
          configuration?.companyName ??
          "",
        cAddress:
          billShareContext.companyAddress ??
          configuration?.cAddress ??
          configuration?.address ??
          "",
        cEmail:
          billShareContext.companyEmail ??
          configuration?.cEmail ??
          configuration?.email ??
          "",
        cPhoneNo:
          billShareContext.companyPhone ??
          configuration?.cPhoneNo ??
          configuration?.phoneNo ??
          "",
        nBillNo: billShareContext.billNo ?? "",
        cBillNo: billShareContext.billNo ?? "",
        customerName: billShareContext.customerName ?? "",
        cCustomerName: billShareContext.customerName ?? "",
        billSummary: billShareContext.billSummary ?? {},
        ticketSummary: billShareContext.ticketSummary ?? {},
        itemDtls: billShareContext.rows ?? [],
        payDtls: billShareContext.payDtls ?? [],
        totals: billShareContext.totals ?? {},
      };

      const exportResponse = await billingApis.billExportPdf(exportPayload);
      const pdfUrl = getBillPdfUrl(exportResponse);

      if (!pdfUrl) {
        return;
      }

      const finalUrl = ensureAbsoluteUrl(pdfUrl);
      setPrintPdfUrl(finalUrl);
      setPrintModalOpen(true);
    } catch (error) {
      console.error("Failed to export bill PDF", error);
    } finally {
      setIsPrinting(false);
    }
  };

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
            <span className="font-semibold text-slate-700">
              Customer Name :
            </span>
            <span>{customerName}</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap border-sky-100 md:border-r md:px-6">
            <img src={gst} alt="" className="h-5 w-5" />
            <span className="font-semibold text-slate-700">GST No :</span>
            <span>{gstNo}</span>
          </div>
          <div className="text-right font-semibold text-slate-800">
            {billDate}
          </div>
        </div>
        <div className="mt-3 text-[13px] text-slate-700">
          <span className="font-medium text-slate-800">Address :</span>{" "}
          {address}
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
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              Loading bill details...
            </div>
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
              <span className="text-right font-medium text-slate-900">
                {payMode}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center hover:bg-slate-50"
                aria-label="Preview bill"
                onClick={() => setPreviewOpen(true)}
              >
                <img
                  src={previewIcon}
                  alt=""
                  className="h-9 w-9   rounded-md border border-black/25"
                />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center  hover:bg-slate-50"
                aria-label="Share bill"
                onClick={() => setShareModalOpen(true)}
              >
                <img
                  src={shareIcon}
                  alt=""
                  className="h-9 w-9  rounded-md border border-black/25"
                />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center  hover:bg-slate-50"
                aria-label="Print bill"
                onClick={() => {
                  void handlePrintBill();
                }}
                disabled={isPrinting}
              >
                <img
                  src={printIcon}
                  alt=""
                  className="h-9 w-9  rounded-md border border-black/25"
                />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center  hover:bg-slate-50"
                aria-label="Edit bill"
              >
                <img
                  src={editIcon}
                  alt=""
                  className="h-9 w-9  rounded-md border border-black/25"
                />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#ff4d4f] bg-[#ff4d4f] hover:opacity-90"
                aria-label="Delete bill"
              >
                <img
                  src={deleteRed}
                  alt=""
                  className="h-4 w-4 brightness-0 invert"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/20 p-4">
          <div className="w-full max-w-[760px] overflow-hidden rounded-md bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="text-[18px] font-semibold text-slate-900">
                Bill Preview
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
                  aria-label="Share bill preview"
                  onClick={() => setShareModalOpen(true)}
                >
                  <img src={share} alt="" className="h-5 w-5 " />
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
              <div className="rounded-sm border border-slate-200 bg-white border-x-shadow-sm border-x-gray-200">
                <div className="border-b border-slate-200 px-4 py-5">
                 
                 
                  {companyLogoUrl ? (
                    <div className="mb-3 flex justify-center">
                      <img
                        src={companyLogoUrl}
                        alt={companyName}
                        className="h-14 w-auto max-w-[220px] object-contain"
                      />
                    </div>
                  ) : null}
                  <div className="text-center text-[15px] font-bold text-slate-900">
                    {companyName}
                  </div>
                  <div className="mt-1 text-center text-[12px] font-semibold text-black">
                    {companyAddress}
                  </div>
                  <div className="mt-1 text-center text-[12px] font-semibold text-black">
                    {`Email: ${Email}`} |  {`Phone: ${phone}`}
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
                    <div className="border-r border-sky-200 px-3 py-3">
                      Description
                    </div>
                    <div className="border-r border-sky-200 px-3 py-3 text-right">
                      Qty
                    </div>
                    <div className="border-r border-sky-200 px-3 py-3 text-right">
                      Rate
                    </div>
                    <div className="border-r border-sky-200 px-3 py-3 text-right">
                      Value
                    </div>
                    <div className="border-r border-sky-200 px-3 py-3 text-right">
                      Discount
                    </div>
                    <div className="border-r border-sky-200 px-3 py-3 text-right">
                      Tax
                    </div>
                    <div className="px-3 py-3 text-right">Total</div>
                  </div>

                  {rows.map((row, index) => (
                    <div
                      key={`preview-${row.key}`}
                      className="grid grid-cols-[40px_minmax(180px,1.8fr)_70px_90px_90px_90px_70px_90px] border-t border-slate-200 text-[12px] text-slate-700"
                    >
                      <div className="border-r border-slate-200 px-3 py-3">
                        {index + 1}
                      </div>
                      <div className="border-r border-slate-200 px-3 py-3">
                        {row.description}
                      </div>
                      <div className="border-r border-slate-200 px-3 py-3 text-right">
                        {row.qty.toFixed(2)}
                      </div>
                      <div className="border-r border-slate-200 px-3 py-3 text-right">
                        {formatMoney(row.rate)}
                      </div>
                      <div className="border-r border-slate-200 px-3 py-3 text-right">
                        {formatMoney(row.value)}
                      </div>
                      <div className="border-r border-slate-200 px-3 py-3 text-right">
                        {formatMoney(row.discount)}
                      </div>
                      <div className="border-r border-slate-200 px-3 py-3 text-right">
                        {formatMoney(row.tax)}
                      </div>
                      <div className="px-3 py-3 text-right">
                        {formatMoney(row.total)}
                      </div>
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

      {printModalOpen ? (
        <div className="fixed inset-0 z-[1350] flex items-center justify-center bg-black/40 p-3">
          <div className="flex h-[90vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="text-[18px] font-semibold text-slate-900">
                Bill Print Preview
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
                aria-label="Close print preview"
                onClick={() => {
                  setPrintModalOpen(false);
                  setPrintPdfUrl("");
                }}
              >
                <img src={closeblack} alt="" className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 p-3">
              {printPdfUrl ? (
                <iframe
                  title="Bill Print Preview"
                  src={printPdfUrl}
                  className="h-full w-full rounded-md border border-slate-200 bg-white"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Loading PDF preview...
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <BillShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        companyPayload={companyDetailsPayload}
        billContext={billShareContext}
      />
    </div>
  );
};

export default BillReadonlyViewExact;
