import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Checkbox, Input, InputNumber, Select, message } from "antd";
import {
  CloseOutlined,
  FileTextOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { billingApis } from "../../Axios/BillingApis";
import { useGetCustomerDropDown } from "../Master/CustomerMaster/Hooks";
import deleteRed from "../../assets/icons/delete-red.svg";
import squarePlusIcon from "../../assets/icons/FaSquarePlus.svg";
import RightSideDrawer from "../../ui/Drawer/RightSideDrawer";
import paymentModeHero from "../../assets/payMode/paymentModeImage.png";
import cashPayModeImage from "../../assets/payMode/cash.png";
import chequePayModeImage from "../../assets/payMode/cheque.png";
import complementaryPayModeImage from "../../assets/payMode/complementary.png";
import masterPayModeImage from "../../assets/payMode/master.png";
import netPayModeImage from "../../assets/payMode/net.png";
import splitPayModeImage from "../../assets/payMode/splitMode.png";
import upiPayModeImage from "../../assets/payMode/upi.png";
import qrPayModeImage from "../../assets/payMode/paymentQr.png";
import companyPayModeImage from "../../assets/payMode/company.png";
import qrFullImage from "../../assets/Bills/QRfull.png";

type BillPart = {
  key?: string | number;
  name?: string;
  qty?: string | number;
  rate?: string | number;
  total?: string | number;
};

type BillPreviewState = {
  companyName?: string;
  billNo?: string;
  billId?: string | number;
  nBillId?: string | number;
  customerName?: string;
  customerId?: string | number;
  ticketNo?: string | number;
  nFollowUpId?: string | number;
  nWorksheetId?: string | number;
  WorksheetId?: string | number;
  nCompanyId?: string | number;
  callreportData?: Record<string, any>;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  summary?: string;
  partList?: BillPart[];
  sessionPayload?: Record<string, any>;
  isEditMode?: boolean;
  sourcePage?: string;
};

type BillRow = {
  key: string;
  partId: string | null;
  qty: number;
  rate: number;
  value: number;
  discount: number;
  tax: number;
  total: number;
};

type PartOption = {
  nPartId: number;
  cPartName: string;
  nRate: number;
  raw: any;
};

type CustomerOption = {
  nCustomerId: number;
  cCustomerName: string;
  raw: any;
};

type PayModeOption = {
  key: string;
  label: string;
  image: string;
};

const BILL_PREVIEW_STORAGE_KEY = "ticket_portal_bill_preview_state";
const CALL_REPORT_VIEW_STORAGE_KEY = "ticket_portal_callreport_view_state";
const BILL_PAY_MODE_STORAGE_KEY = "ticket_portal_bill_pay_mode";

const PAY_MODE_OPTIONS: PayModeOption[] = [
  { key: "QR", label: "QR Code", image: qrPayModeImage },
  { key: "UPI", label: "UPI", image: upiPayModeImage },
  { key: "Card", label: "Card", image: masterPayModeImage },
  { key: "Net Banking", label: "Net Banking", image: netPayModeImage },
  { key: "Cheque", label: "Cheque", image: chequePayModeImage },
  { key: "Complimentary", label: "Complimentary", image: complementaryPayModeImage },
  { key: "Company", label: "Company Credit", image: companyPayModeImage },
  { key: "Cash", label: "Cash", image: cashPayModeImage },
  { key: "Split", label: "Split", image: splitPayModeImage },
];

const SPLIT_METHOD_OPTIONS = [
  { key: "Cash", label: "Cash", image: cashPayModeImage },
  { key: "UPI", label: "UPI", image: upiPayModeImage },
  { key: "Card", label: "Card", image: masterPayModeImage },
  { key: "Net Banking", label: "NetBanking", image: netPayModeImage },
  { key: "Cheque", label: "Cheque", image: chequePayModeImage },
  { key: "Complimentary", label: "Complementary", image: complementaryPayModeImage },
  { key: "Company", label: "Company Credit", image: companyPayModeImage },
];

const makeRow = (): BillRow => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  partId: null,
  qty: 0,
  rate: 0,
  value: 0,
  discount: 0,
  tax: 0,
  total: 0,
});

const getFirstValue = (record: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
};

const normalizeSingleRecord = (value: any) => {
  if (Array.isArray(value)) {
    return (value[0] ?? {}) as Record<string, any>;
  }

  if (value && typeof value === "object") {
    return value as Record<string, any>;
  }

  return {};
};

const formatDisplayValue = (value: any) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    return (
      value?.name ??
      value?.label ??
      value?.title ??
      value?.text ??
      value?.value ??
      value?.cName ??
      value?.cTitle ??
      value?.cDescription ??
      ""
    );
  }

  return String(value);
};

const toSafeNumber = (
  value: any,
  fallback = 0,
  options: { min?: number; max?: number; decimals?: number } = {},
) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const min = options.min ?? Number.NEGATIVE_INFINITY;
  const max = options.max ?? Number.POSITIVE_INFINITY;
  const bounded = Math.min(Math.max(parsed, min), max);

  if (typeof options.decimals === "number") {
    return Number(bounded.toFixed(options.decimals));
  }

  return bounded;
};

const toSafeInteger = (value: any, fallback = 0, max = 2147483647) =>
  Math.trunc(toSafeNumber(value, fallback, { min: 0, max }));

const normalizePartOptions = (response: any): PartOption[] => {
  const payload = response?.data ?? response ?? {};
  const candidates = [
    payload?.data,
    payload?.partList,
    payload?.parts,
    payload?.PartList,
    payload?.PartDetails,
    payload,
  ];

  const list = candidates.find((item) => Array.isArray(item)) ?? [];

  return list.map((item: any, index: number) => ({
    nPartId: Number(
      getFirstValue(item ?? {}, ["nPartId", "partId", "PartId", "id", "Id"]) || index + 1,
    ),
    cPartName: String(
      getFirstValue(item ?? {}, ["cPartName", "PartName", "name", "label", "cName"]) || `Part ${index + 1}`,
    ),
    nRate: Number(getFirstValue(item ?? {}, ["nRate", "rate", "price", "nPrice"]) || 0),
    raw: item,
  }));
};

const normalizeBillRows = (response: any): BillRow[] => {
  const payload = response?.data ?? response ?? {};
  const candidates = [
    payload?.data?.itemDtls,
    payload?.data?.ItemDtls,
    payload?.itemDtls,
    payload?.ItemDtls,
    payload?.data?.billSummary?.itemDtls,
    payload?.data?.billSummary?.ItemDtls,
    payload?.billSummary?.itemDtls,
    payload?.billSummary?.ItemDtls,
    payload?.data?.partDetails,
    payload?.data?.PartDetails,
    payload?.partDetails,
    payload?.PartDetails,
  ];

  const list = candidates.find((item) => Array.isArray(item)) ?? [];

  return list.map((item: any, index: number) => {
    const qty = toSafeNumber(
      getFirstValue(item ?? {}, ["nQty", "qty", "Qty", "Quantity", "nQuantity"]),
      0,
      { min: 0, max: 999999999, decimals: 3 },
    );
    const rate = toSafeNumber(
      getFirstValue(item ?? {}, ["nRate", "rate", "Rate", "Price", "nPrice"]),
      0,
      { min: 0, max: 999999999, decimals: 2 },
    );
    const discount = toSafeNumber(
      getFirstValue(item ?? {}, ["nDiscAmt", "nDiscountAmt", "discount", "Discount"]),
      0,
      { min: 0, max: 999999999, decimals: 2 },
    );
    const tax = toSafeNumber(
      getFirstValue(item ?? {}, ["nTaxAmount", "nTaxAmt", "tax", "Tax"]),
      0,
      { min: 0, max: 999999999, decimals: 2 },
    );
    const value = toSafeNumber(
      getFirstValue(item ?? {}, ["nAmount", "nValue", "value", "Value"]),
      qty * rate,
      { min: 0, max: 999999999, decimals: 2 },
    );
    const total = toSafeNumber(
      getFirstValue(item ?? {}, ["nTotalAmount", "total", "Total"]),
      value - discount + tax,
      { min: 0, max: 999999999, decimals: 2 },
    );

    return {
      key: String(getFirstValue(item ?? {}, ["nRowId", "nBillItemId", "Id", "id"]) || index + 1),
      partId:
        String(getFirstValue(item ?? {}, ["nPartId", "partId", "PartId", "id"]) || "") || null,
      qty,
      rate,
      value,
      discount,
      tax,
      total,
    };
  });
};

const resolveTaxAmount = (response: any) => {
  const data = response?.data ?? response ?? {};
  const possibleValues = [
    data?.data?.nTaxAmount,
    data?.data?.taxAmount,
    data?.data?.nTaxValue,
    data?.data?.taxValue,
    data?.data?.amount,
    data?.nTaxAmount,
    data?.taxAmount,
    data?.nTaxValue,
    data?.taxValue,
    data?.amount,
    data?.data?.result?.nTaxAmount,
    data?.data?.result?.taxAmount,
    data?.data?.result?.taxValue,
    data?.result?.nTaxAmount,
    data?.result?.taxAmount,
    data?.result?.taxValue,
  ];

  const parsed = Number(
    possibleValues.find((value) => {
      const num = Number(value);
      return Number.isFinite(num) && num >= 0;
    }) ?? 0,
  );

  return Number.isFinite(parsed) ? parsed : 0;
};

const resolvePartTaxMeta = (part: any) => {
  const taxId = toSafeInteger(
    getFirstValue(part ?? {}, ["nTaxId", "taxId", "TaxId", "nTaxMasterId"]),
    0,
  );
  const taxRate = toSafeNumber(
    getFirstValue(part ?? {}, ["nTaxRate", "taxRate", "TaxRate", "rate"]),
    0,
    { min: 0, max: 100, decimals: 4 },
  );

  return { taxId, taxRate };
};

  const normalizeCustomerOptions = (response: any): CustomerOption[] => {
  const payload = response?.data ?? response ?? {};
  const candidates = [
    payload?.data,
    payload?.customerList,
    payload?.customers,
    payload?.CustomerList,
    payload?.CustomerDropdown,
    payload?.CustomerDropDown,
    payload,
  ];

  const list = candidates.find((item) => Array.isArray(item)) ?? [];

  return list.map((item: any, index: number) => ({
    nCustomerId: Number(
      getFirstValue(item ?? {}, ["nCustomerId", "customerId", "CustomerId", "id", "Id"]) || index + 1,
    ),
    cCustomerName: String(
      getFirstValue(item ?? {}, ["cCustomerName", "CustomerName", "name", "label", "cName"]) || `Customer ${index + 1}`,
    ),
    raw: item,
  }));
};

const resolvePayModeId = (mode: string) => {
  switch (mode) {
    case "Cash":
      return 1;
    case "UPI":
      return 2;
    case "Card":
      return 3;
    case "Net Banking":
      return 4;
    case "Cheque":
      return 5;
    case "Complimentary":
      return 6;
    case "Company":
      return 7;
    case "QR":
      return 8;
    case "Split":
      return 9;
    default:
      return 0;
  }
};

const BillPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const billData = useMemo<BillPreviewState>(() => {
    const fromState = (location.state ?? {}) as BillPreviewState;
    if (Object.keys(fromState).length > 0) {
      return fromState;
    }

    try {
      const raw = sessionStorage.getItem(BILL_PREVIEW_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as BillPreviewState) : {};
    } catch {
      return {};
    }
  }, [location.state]);
  const isCallReportBill = billData.sourcePage === "callreports";
  const isEditMode = Boolean(
    !isCallReportBill &&
      (billData.isEditMode || billData.sourcePage === "bills" || billData.billId || billData.nBillId),
  );
  const editingBillId = Number(billData.billId ?? billData.nBillId ?? 0) || 0;

  const normalizeCallReportSnapshot = (value: Record<string, any> | undefined | null) => {
    if (!value || Object.keys(value).length === 0) return {};

    if (value.callreportSummary || value.ticketSummary || value.billSummary || value.worsheetDetails) {
      return value;
    }

    if (value.data && typeof value.data === "object") {
      return value.data;
    }

    return value;
  };

  const callReportData = useMemo<Record<string, any>>(() => {
    const fromRouteState = normalizeCallReportSnapshot(billData.callreportData);
    if (Object.keys(fromRouteState).length > 0) {
      return fromRouteState;
    }

    try {
      const raw = sessionStorage.getItem(CALL_REPORT_VIEW_STORAGE_KEY);
      const storedCallReport = raw ? normalizeCallReportSnapshot(JSON.parse(raw) as Record<string, any>) : {};
      if (Object.keys(storedCallReport).length > 0) {
        return storedCallReport;
      }
    } catch {
      // Ignore and fall back to route state below.
    }

    return {};
  }, [billData.callreportData]);

  const callReportSummary = normalizeSingleRecord(
    callReportData.callreportSummary ?? callReportData.data?.callreportSummary,
  );

  const sessionPayload = billData.sessionPayload ?? {};
  const effectiveCompanyId = Number(
    callReportSummary.nCompanyId ??
      callReportData.data?.callreportSummary?.nCompanyId ??
      billData.nCompanyId ??
      billData.sessionPayload?.nCompanyId ??
      0,
  ) || 0;
  const customerDropdownPayload = useMemo(
    () => ({
      ...sessionPayload,
      pageNumber: 1,
      pageSize: 1000,
      nCompanyId: effectiveCompanyId || Number(sessionPayload?.nCompanyId ?? 0) || 0,
      cSchemaName: sessionPayload?.cSchemaName ?? "",
      cDbName: sessionPayload?.cDbName ?? "",
    }),
    [effectiveCompanyId, sessionPayload],
  );
  const [partOptions, setPartOptions] = useState<PartOption[]>(
    normalizePartOptions({ data: billData.partList ?? [] }),
  );
  const [loadingParts, setLoadingParts] = useState(false);
  const [rows, setRows] = useState<BillRow[]>([makeRow()]);
  const [payModeOpen, setPayModeOpen] = useState(false);
  const [draftPayMode, setDraftPayMode] = useState("QR");
  const [payMode, setPayMode] = useState(() => {
    try {
      return sessionStorage.getItem(BILL_PAY_MODE_STORAGE_KEY) || "QR";
    } catch {
      return "QR";
    }
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const draggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const [payModeFields, setPayModeFields] = useState<Record<string, Record<string, string>>>({});
  const [splitStep, setSplitStep] = useState<"choose" | "details">("choose");
  const [splitSelections, setSplitSelections] = useState<Record<string, boolean>>({});
  const [splitCustomerDropdownOpen, setSplitCustomerDropdownOpen] = useState(false);
  const [splitCustomerSearch, setSplitCustomerSearch] = useState("");
  const [savingBill, setSavingBill] = useState(false);

  const { data: customerDropdownData } = useGetCustomerDropDown(
    customerDropdownPayload,
  );
  const { data: lastBillNumberData } = useQuery({
    queryKey: ["bill-last-number", effectiveCompanyId, sessionPayload],
    queryFn: () =>
      billingApis.lastBillNumber({
        ...sessionPayload,
        nCompanyId: effectiveCompanyId || Number(sessionPayload?.nCompanyId ?? 0) || 0,
        cSchemaName: sessionPayload?.cSchemaName ?? "",
        cDbName: sessionPayload?.cDbName ?? "",
      }),
    enabled:
      !!effectiveCompanyId &&
      !!sessionPayload?.cSchemaName &&
      !!sessionPayload?.cDbName,
  });
  const { data: editBillViewData, isLoading: isEditBillLoading } = useQuery({
    queryKey: ["bill-view-edit", editingBillId, sessionPayload],
    queryFn: () =>
      billingApis.billView({
        ...sessionPayload,
        nBillId: editingBillId,
        BillId: editingBillId,
        billId: editingBillId,
    }),
    enabled: isEditMode && !!editingBillId,
  });
  const editBillRecord = useMemo(
    () =>
      normalizeSingleRecord(editBillViewData?.data?.data ?? editBillViewData?.data ?? editBillViewData ?? {}),
    [editBillViewData],
  );
  const editBillSummary = useMemo(
    () =>
      normalizeSingleRecord(
        editBillRecord.billSummary ??
          editBillRecord.BillSummary ??
          editBillRecord.data?.billSummary ??
          editBillRecord.data?.BillSummary ??
          editBillRecord,
      ),
    [editBillRecord],
  );
  const editTicketSummary = useMemo(
    () =>
      normalizeSingleRecord(
        editBillRecord.ticketSummary ??
          editBillRecord.TicketSummary ??
          editBillRecord.data?.ticketSummary ??
          editBillRecord.data?.TicketSummary ??
          {},
      ),
    [editBillRecord],
  );

  useEffect(() => {
    const handleWindowMouseMove = (event: MouseEvent) => {
      const el = scrollContainerRef.current;
      if (!draggingRef.current || !el) return;

      const diffX = event.pageX - startX;
      if (Math.abs(diffX) > 5) {
        dragMovedRef.current = true;
        el.scrollLeft = scrollLeftState - diffX;
      }
    };

    const handleWindowMouseUp = () => {
      draggingRef.current = false;
      setIsDragging(false);
      window.setTimeout(() => {
        dragMovedRef.current = false;
      }, 0);

      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleWindowMouseMove);
      window.addEventListener("mouseup", handleWindowMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [isDragging, scrollLeftState, startX]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    draggingRef.current = true;
    dragMovedRef.current = false;
    setIsDragging(true);
    setStartX(e.pageX);
    setScrollLeftState(el.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingRef.current) {
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    draggingRef.current = false;
    setIsDragging(false);
    window.setTimeout(() => {
      dragMovedRef.current = false;
    }, 0);
  };

  const handleMouseLeave = () => {
    draggingRef.current = false;
    setIsDragging(false);
    window.setTimeout(() => {
      dragMovedRef.current = false;
    }, 0);
  };

  useEffect(() => {
    try {
      sessionStorage.setItem(BILL_PAY_MODE_STORAGE_KEY, payMode);
    } catch {
      // Best effort only.
    }
  }, [payMode]);

  useEffect(() => {
    if (payMode !== "Split") {
      setSplitStep("choose");
      return;
    }

    setSplitStep("choose");
  }, [payMode]);

  useEffect(() => {
    let alive = true;

    const loadParts = async () => {
      const ticketIdFromEdit =
        Number(
          editBillSummary.nTicketId ??
            editBillSummary.nTicketNo ??
            editBillSummary.TicketId ??
            editTicketSummary.nTicketId ??
            editTicketSummary.TicketId ??
            billData.ticketNo ??
            billData.sessionPayload?.nTicketId ??
            0,
        ) || 0;
      const customerIdFromEdit =
        Number(
          editBillSummary.nCustomerId ??
            editBillSummary.CustomerId ??
            editTicketSummary.nCustomerId ??
            editTicketSummary.CustomerId ??
            billData.customerId ??
            billData.sessionPayload?.nCustomerId ??
            0,
        ) || 0;
      const assetIdFromEdit =
        Number(
          editBillSummary.nAssetId ??
            editBillSummary.AssetId ??
            editTicketSummary.nAssetId ??
            editTicketSummary.AssetId ??
            billData.sessionPayload?.nAssetId ??
            0,
        ) || 0;
      const payload = {
        ...sessionPayload,
        nCompanyId: effectiveCompanyId || Number(sessionPayload?.nCompanyId ?? 0) || 0,
        cSchemaName: sessionPayload?.cSchemaName ?? "",
        cDbName: sessionPayload?.cDbName ?? "",
        nTicketId: ticketIdFromEdit,
        nCustomerId: customerIdFromEdit,
        nAssetId: assetIdFromEdit,
      };

      if (!payload.nCompanyId || !payload.cSchemaName || !payload.cDbName) {
        return;
      }

      setLoadingParts(true);
      try {
        const response = await billingApis.partListForBilling(payload);
        const normalized = normalizePartOptions(response);
        if (alive && normalized.length > 0) {
          setPartOptions(normalized);
        }
      } catch (error) {
        console.error("Failed to load bill parts", error);
        message.error("Unable to load part list for billing");
      } finally {
        if (alive) setLoadingParts(false);
      }
    };

    void loadParts();

    return () => {
      alive = false;
    };
  }, [sessionPayload, effectiveCompanyId, editBillSummary, editTicketSummary]);

  useEffect(() => {
    if (!isEditMode || !editBillViewData) return;

    const normalizedRows = normalizeBillRows(editBillViewData);
    if (normalizedRows.length > 0) {
      setRows(normalizedRows);
    }

    const editBillRecord = normalizeSingleRecord(
      editBillViewData?.data?.data ?? editBillViewData?.data ?? editBillViewData ?? {},
    );
    const editPayMode =
      String(
        getFirstValue(editBillRecord, [
          "cPaymodeName",
          "cPayMode",
          "PayMode",
          "PayModeName",
        ]) || "",
      ) || payMode;

    if (editPayMode) {
      setPayMode(editPayMode);
    }
  }, [editBillViewData, isEditMode]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += Number(row.total || 0);
        acc.discount += Number(row.discount || 0);
        acc.tax += Number(row.tax || 0);
        return acc;
      },
      { total: 0, discount: 0, tax: 0 },
    );
  }, [rows]);

  const billTotal = Math.max(0, totals.total - totals.discount + totals.tax);
  const selectedPayMode =
    PAY_MODE_OPTIONS.find((item) => item.key === payMode) ?? PAY_MODE_OPTIONS[0];
  const lastBillNumberRecord = normalizeSingleRecord(
    lastBillNumberData?.data?.data ?? lastBillNumberData?.data ?? lastBillNumberData ?? {},
  );
  const fetchedBillNo = getFirstValue(lastBillNumberRecord, [
    "nBillNo",
    "BillNo",
    "billNo",
    "LastBillNumber",
    "lastBillNumber",
    "nLastBillNumber",
  ]);

  const readLatestCallReport = () => {
    const fromRouteState = normalizeCallReportSnapshot(billData.callreportData);
    if (Object.keys(fromRouteState).length > 0) {
      return fromRouteState;
    }

    try {
      const raw = sessionStorage.getItem(CALL_REPORT_VIEW_STORAGE_KEY);
      return raw ? normalizeCallReportSnapshot(JSON.parse(raw) as Record<string, any>) : callReportData;
    } catch {
      return callReportData;
    }
  };

  const handleSaveClick = async () => {
    if (savingBill) return;

    const latestCallReport = readLatestCallReport();
    const latestCallReportSummary = normalizeSingleRecord(
      latestCallReport.callreportSummary ?? latestCallReport.data?.callreportSummary,
    );
    const latestCallReportTicket = normalizeSingleRecord(
      latestCallReport.ticketSummary ?? latestCallReport.data?.ticketSummary,
    );

    const validRows = rows.filter((row) => row.partId !== null && row.qty > 0 && row.rate > 0);
    if (!validRows.length) {
      message.warning("Please select a part description and enter a valid quantity and rate first.");
      return;
    }

    const ticketId = Number(
        latestCallReportTicket.nTicketId ??
        latestCallReport.data?.ticketSummary?.nTicketId ??
        billData.ticketNo ??
        billData.sessionPayload?.nTicketId ??
        0,
    ) || 0;
    const followupId = Number(
        latestCallReportSummary.nFollowupId ??
        latestCallReportSummary.nfollowupid ??
        latestCallReportSummary.nFollowUpId ??
        latestCallReportSummary.nWorksheetId ??
        latestCallReportSummary.nworksheetid ??
        latestCallReportSummary.WorksheetId ??
        latestCallReport.nFollowupId ??
        latestCallReport.nfollowupid ??
        latestCallReport.nFollowUpId ??
        latestCallReport.nWorksheetId ??
        latestCallReport.nworksheetid ??
        latestCallReport.WorksheetId ??
        latestCallReport.data?.callreportSummary?.nFollowupId ??
        latestCallReport.data?.callreportSummary?.nfollowupid ??
        latestCallReport.data?.callreportSummary?.nFollowUpId ??
        latestCallReport.data?.callreportSummary?.nWorksheetId ??
        latestCallReport.data?.callreportSummary?.nworksheetid ??
        latestCallReport.data?.callreportSummary?.WorksheetId ??
        billData.sessionPayload?.nFollowupId ??
        billData.sessionPayload?.nfollowupid ??
        billData.sessionPayload?.nFollowUpId ??
        billData.sessionPayload?.nWorksheetId ??
        billData.sessionPayload?.nworksheetid ??
        billData.sessionPayload?.WorksheetId ??
        billData.nFollowUpId ??
        billData.nWorksheetId ??
        billData.WorksheetId ??
        0,
    ) || 0;
    const customerId = Number(
        latestCallReportTicket.nCustomerId ??
        latestCallReport.data?.ticketSummary?.nCustomerId ??
        billData.customerId ??
        billData.sessionPayload?.nCustomerId ??
        0,
    ) || 0;
    const companyId = Number(
      latestCallReportSummary.nCompanyId ??
      latestCallReport.data?.callreportSummary?.nCompanyId ??
      billData.sessionPayload?.nCompanyId ??
      billData.nCompanyId ??
      0,
    ) || 0;
    const createdBy = Number(
      billData.sessionPayload?.nCreatedBy ??
        billData.sessionPayload?.id ??
        billData.sessionPayload?.nAgentId ??
        0,
    ) || 0;

    // if (!ticketId || !followupId || !customerId || !companyId) {
    //   message.error(
    //     "Unable to save bill: ticket, customer, company, or follow-up details are missing.",
    //   );
    //   return;
    // }

    const itemDtls = validRows.map((row) => {
      return {
        nPartId: Number(row.partId ?? 0),
        nQty: Number(row.qty || 0),
        nRate: Number(row.rate || 0),
        nDiscAmt: Number(row.discount || 0),
        nTaxAmount: Number(row.tax || 0),
        cNarration: "",
        nCompanyId: companyId || Number(sessionPayload?.nCompanyId ?? 0) || 0,
      };
    });

    const payModeId = resolvePayModeId(payMode);
    const payDtls = [
      {
        nPayAmount: billTotal,
        nPaymode: payModeId,
      },
    ];

    const payload = {
      nBillId: editingBillId || Number(billData.billId ?? billData.nBillId ?? 0) || 0,
      BillId: editingBillId || Number(billData.billId ?? billData.nBillId ?? 0) || 0,
      billId: editingBillId || Number(billData.billId ?? billData.nBillId ?? 0) || 0,
      nTicketId: ticketId,
      nFollowupId: followupId,
      nFollowUpId: followupId,
      nCustomerId: customerId,
      cCustomerName: billData.customerName ?? "",
      nGrossAmount: Number(totals.total || 0),
      nTaxAmount: Number(totals.tax || 0),
      nDiscountAmt: Number(totals.discount || 0),
      nRoundoffAmount: 0,
      nTotalAmount: Number(billTotal || 0),
      nCreatedBy: createdBy,
      nCompanyId: companyId || Number(sessionPayload?.nCompanyId ?? 0) || 0,
      cSchemaName: billData.sessionPayload?.cSchemaName ?? "",
      cDbName: billData.sessionPayload?.cDbName ?? "",
      itemDtls,
      payDtls,
      transationDtls: [],
      ChequeDtls: [],
      CustomerCreditDtls: [],
    };

    setSavingBill(true);
    try {
      const response = await billingApis.billSave(payload);
      message.success(response?.message || "Bill save successful.");

      const callReportState = {
        ...latestCallReport,
        selectedRow:
          latestCallReport.selectedRow ??
          latestCallReport.data?.selectedRow ??
          latestCallReport.data?.callreportSummary ??
          latestCallReportSummary ??
          {},
        nCallReportId: followupId,
        nFollowupId: followupId,
        nFollowUpId: followupId,
        nWorksheetId: followupId,
        WorksheetId: followupId,
        isFrom: "callreports",
        billId: Number(response?.data?.nBillId ?? response?.data?.BillId ?? response?.nBillId ?? 0) || 0,
      };

      try {
        sessionStorage.setItem(
          CALL_REPORT_VIEW_STORAGE_KEY,
          JSON.stringify(callReportState),
        );
      } catch {
        // best effort only
      }

      if (billData.sourcePage === "bills" || isEditMode || isCallReportBill) {
        navigate("/bills", { replace: true });
      } else {
        navigate("/callreports/view", {
          state: callReportState,
          replace: true,
        });
      }
    } catch (error: any) {
      console.error("Failed to save bill", error);
      message.error(error?.response?.data?.message || error?.message || "Unable to save bill");
    } finally {
      setSavingBill(false);
    }
  };

  const recalculateTax = async (row: BillRow, overridePartId?: string | null) => {
    const partId = overridePartId ?? row.partId;
    const part = partOptions.find((item) => String(item.nPartId) === String(partId ?? ""));
    const quantity = toSafeNumber(row.qty, 0, { min: 0, max: 999999999, decimals: 3 });
    const rate = toSafeNumber(row.rate, 0, { min: 0, max: 999999999, decimals: 2 });
    const discount = toSafeNumber(row.discount, 0, { min: 0, max: 999999999, decimals: 2 });
    const baseAmount = toSafeNumber(row.value || quantity * rate, 0, { min: 0, max: 999999999, decimals: 2 });
    const taxableAmount = toSafeNumber(Math.max(baseAmount - discount, 0), 0, {
      min: 0,
      max: 999999999,
      decimals: 2,
    });
    const { taxId, taxRate } = resolvePartTaxMeta(part?.raw ?? {});

    if (!partId) {
      updateRow(row.key, {
        tax: 0,
        total: taxableAmount,
      });
      return;
    }

    try {
      const payload = {
        ...sessionPayload,
        nCompanyId: toSafeInteger(sessionPayload?.nCompanyId ?? 0),
        cSchemaName: sessionPayload?.cSchemaName ?? "",
        cDbName: sessionPayload?.cDbName ?? "",
        nTicketId: toSafeInteger(sessionPayload?.nTicketId ?? 0),
        nCustomerId: toSafeInteger(sessionPayload?.nCustomerId ?? 0),
        nPartId: toSafeInteger(part?.nPartId ?? partId ?? 0),
        nTaxId: taxId,
        nTaxRate: taxRate,
        nQty: quantity,
        nRate: rate,
        nDiscAmt: discount,
        nAmount: baseAmount,
        nTaxableAmount: taxableAmount,
        nGrossAmount: taxableAmount,
      };

      const response = await billingApis.getTaxValue(payload);
      const apiTaxAmount = resolveTaxAmount(response);
      updateRow(row.key, {
        tax: apiTaxAmount,
        total: taxableAmount + apiTaxAmount,
      });
    } catch (error) {
      console.error("Failed to load tax value", error);
      updateRow(row.key, {
        tax: 0,
        total: taxableAmount,
      });
    }
  };

  const updateRow = (key: string, patch: Partial<BillRow>) => {
    setRows((prev) =>
      prev.map((row) =>
        row.key === key
          ? {
              ...row,
              ...patch,
            }
          : row,
      ),
    );
  };

  const addRow = () => setRows((prev) => [...prev, makeRow()]);

  const deleteRow = (key: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev));
  };

  const openPayModePicker = () => {
    const hasValidParts = rows.some((row) => row.partId !== null && row.qty > 0 && row.rate > 0);

    if (!hasValidParts) {
      message.warning("Please select a part description and enter a valid quantity and rate first.");
      return;
    }

    setDraftPayMode(payMode);
    setPayModeOpen(true);
  };

  const updatePayModeField = (mode: string, field: string, value: string) => {
    setPayModeFields((prev) => ({
      ...prev,
      [mode]: {
        ...(prev[mode] ?? {}),
        [field]: value,
      },
    }));
  };

  const customerOptions = useMemo(
    () => normalizeCustomerOptions(customerDropdownData),
    [customerDropdownData],
  );

  const filteredCustomerOptions = useMemo(() => {
    const query = splitCustomerSearch.trim().toLowerCase();

    if (!query) return customerOptions;

    return customerOptions.filter((item) =>
      String(item.cCustomerName ?? "").toLowerCase().includes(query),
    );
  }, [customerOptions, splitCustomerSearch]);

  const chooseSplitCustomer = (customer: CustomerOption) => {
    setSplitCustomerSearch(customer.cCustomerName);
    setSplitCustomerDropdownOpen(false);
    updatePayModeField("Split", "customerName", customer.cCustomerName);
  };

  const renderModeFields = (mode: string) => {
    const modeFields = payModeFields[mode] ?? {};

    switch (mode) {
      case "QR":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 text-sm font-medium text-slate-700">QR Code</div>
              <img src={qrFullImage} alt="QR Code" className="mx-auto max-h-64 w-full max-w-[240px] object-contain" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 text-sm text-slate-600">Customer Mobile No/Email Id</div>
                <Input
                  value={modeFields.customerContact ?? ""}
                  onChange={(event) => updatePayModeField(mode, "customerContact", event.target.value)}
                  placeholder="Enter Mobile No/Email Id"
                />
              </div>
              <div className="flex items-end justify-end">
                <div className="text-right text-xs text-slate-500">Scan the QR and complete payment</div>
              </div>
            </div>
          </div>
        );
      case "Cash":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-sm text-slate-600">Tender Cash</div>
              <Input
                value={modeFields.tenderCash ?? ""}
                onChange={(event) => updatePayModeField(mode, "tenderCash", event.target.value)}
                placeholder="Enter Tender Cash"
              />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-600">Balance</div>
              <Input value={modeFields.balance ?? "0.00"} readOnly />
            </div>
          </div>
        );
      case "UPI":
        return (
          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
            <div>
              <div className="mb-1 text-sm text-slate-600">Enter Customer UPI Id</div>
              <Input
                value={modeFields.upiId ?? ""}
                onChange={(event) => updatePayModeField(mode, "upiId", event.target.value)}
                placeholder="Enter UPI ID"
              />
            </div>
            <div className="flex items-end">
              <Button type="primary" className="!bg-emerald-500 !border-emerald-500">
                Verify
              </Button>
            </div>
          </div>
        );
      case "Card":
        return (
          <div className="grid gap-4 md:grid-cols-[1fr_180px_auto]">
            <div>
              <div className="mb-1 text-sm text-slate-600">Card Number</div>
              <Input
                value={modeFields.cardNumber ?? ""}
                onChange={(event) => updatePayModeField(mode, "cardNumber", event.target.value)}
                placeholder="Card Number"
              />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-600">Valid Thru</div>
              <Input
                value={modeFields.validThru ?? ""}
                onChange={(event) => updatePayModeField(mode, "validThru", event.target.value)}
                placeholder="MM/YY"
              />
            </div>
          </div>
        );
      case "Net Banking":
        return (
          <div className="grid gap-4">
            <div>
              <div className="mb-1 text-sm text-slate-600">Bank Name</div>
              <Input
                value={modeFields.bankName ?? ""}
                onChange={(event) => updatePayModeField(mode, "bankName", event.target.value)}
                placeholder="Enter Bank Name"
              />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-600">Number</div>
              <Input
                value={modeFields.number ?? ""}
                onChange={(event) => updatePayModeField(mode, "number", event.target.value)}
                placeholder="Enter Number"
              />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-600">Date</div>
              <Input
                value={modeFields.date ?? ""}
                onChange={(event) => updatePayModeField(mode, "date", event.target.value)}
                placeholder="Select Date"
              />
            </div>
          </div>
        );
      case "Cheque":
        return (
          <div className="grid gap-4">
            <div>
              <div className="mb-1 text-sm text-slate-600">Bank Name</div>
              <Input
                value={modeFields.bankName ?? ""}
                onChange={(event) => updatePayModeField(mode, "bankName", event.target.value)}
                placeholder="Enter Bank Name"
              />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-600">Number</div>
              <Input
                value={modeFields.number ?? ""}
                onChange={(event) => updatePayModeField(mode, "number", event.target.value)}
                placeholder="Enter Number"
              />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-600">Date</div>
              <Input
                value={modeFields.date ?? ""}
                onChange={(event) => updatePayModeField(mode, "date", event.target.value)}
                placeholder="Select Date"
              />
            </div>
          </div>
        );
      case "Complimentary":
        return (
          <div className="grid gap-4">
            <div>
              <div className="mb-1 text-sm text-slate-600">Customer Name</div>
              <Input
                value={modeFields.customerName ?? ""}
                onChange={(event) => updatePayModeField(mode, "customerName", event.target.value)}
                placeholder="Enter Customer Name"
              />
            </div>
          </div>
        );
      case "Company":
        return (
          <div className="grid gap-4">
            <div>
              <div className="mb-1 text-sm text-slate-600">Customer Name</div>
              <Input
                value={modeFields.customerName ?? ""}
                onChange={(event) => updatePayModeField(mode, "customerName", event.target.value)}
                placeholder="Enter Customer Name"
              />
            </div>
          </div>
        );
      case "Split":
        return splitStep === "choose" ? (
          <div className="space-y-4">
            <div className="text-[15px] font-medium text-slate-700">
              Choose Multiple Payment Method Below
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {SPLIT_METHOD_OPTIONS.map((item) => {
                const checked = Boolean(splitSelections[item.key]);

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setSplitSelections((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key],
                      }))
                    }
                    className={`flex items-center gap-3 rounded-sm border px-3 py-3 text-left transition ${
                      checked
                        ? "border-emerald-500 bg-emerald-50/40"
                        : "border-slate-300 bg-white hover:border-slate-400"
                    }`}
                  >
                    <Checkbox checked={checked} onChange={() => undefined} />
                    <img src={item.image} alt={item.label} className="h-5 w-5 object-contain" />
                    <span className="text-[13px] text-slate-700">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-end">
              <Button
                type="primary"
                className="!bg-emerald-500 !border-emerald-500"
                onClick={() => {
                  const hasSelection = Object.values(splitSelections).some(Boolean);

                  if (!hasSelection) {
                    message.warning("Please select at least one payment method");
                    return;
                  }

                  setSplitStep("details");
                }}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-slate-700"
              onClick={() => setSplitStep("choose")}
            >
              <span className="text-lg leading-none">←</span>
              <span className="text-[14px] font-medium">Split Pay Mode</span>
            </button>

            <div>
              <div className="mb-1 text-sm text-slate-600">Customer Name</div>
              <div className="relative">
                <Input
                  value={splitCustomerSearch || modeFields.customerName || ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSplitCustomerSearch(value);
                    updatePayModeField(mode, "customerName", value);
                    setSplitCustomerDropdownOpen(true);
                  }}
                  onClick={() => setSplitCustomerDropdownOpen(true)}
                  onFocus={() => setSplitCustomerDropdownOpen(true)}
                  placeholder="Select customer"
                />
                {splitCustomerDropdownOpen ? (
                  <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                    {filteredCustomerOptions.length > 0 ? (
                      filteredCustomerOptions.map((customer) => (
                        <button
                          key={customer.nCustomerId}
                          type="button"
                          className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-sky-50 last:border-b-0"
                          onClick={() => chooseSplitCustomer(customer)}
                        >
                          <span className="font-medium text-slate-900">
                            {customer.cCustomerName}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        No customer found
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-600">Amount</div>
              <Input
                value={modeFields.amount ?? ""}
                onChange={(event) => updatePayModeField(mode, "amount", event.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-600">Bank Name</div>
              <Input
                value={modeFields.bankName ?? ""}
                onChange={(event) => updatePayModeField(mode, "bankName", event.target.value)}
                placeholder="Enter Bank Name"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const displayDate = new Date().toLocaleString();
  const headerDateText =
    formatDisplayValue(
      getFirstValue(editBillSummary, ["dBillDate", "BillDate", "dCreatedDate", "CreatedDate"]),
    ) || displayDate;
  const createdByLabel =
    formatDisplayValue(
      getFirstValue(editBillSummary, ["cCreatedBy", "CreatedBy", "CreatedByName", "cAgentName"]),
    ) || "Testing Team";
  const billNo = formatDisplayValue(
    getFirstValue(editBillSummary, ["nBillNo", "BillNo", "billNo", "cBillNo"]),
  ) || billData.billNo || fetchedBillNo || "-";
  const customerName =
    formatDisplayValue(
      getFirstValue(editBillSummary, ["cCustomerName", "CustomerName", "Customer", "cName"]),
    ) || billData.customerName || "-";
  const gstNo =
    formatDisplayValue(
      getFirstValue(editBillSummary, ["cGstNumber", "cGSTNo", "GSTNo", "GSTNumber"]),
    ) || "-";
  const address =
    formatDisplayValue(
      getFirstValue(editBillSummary, ["cCustomerAddress", "CustomerAddress", "Address", "cAddress"]),
    ) || "NIL";
  const canEditBillItems = !isEditMode || isCallReportBill;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex items-center justify-between bg-[#dcebf5] px-2 py-1 text-[11px] text-slate-600">
        <div>Created by : {createdByLabel}</div>
        <div className="flex items-center gap-2">
          <span>{headerDateText}</span>
          <Button
            type="text"
            size="small"
            className="!h-5 !w-5 !min-w-5 !p-0 !text-base !text-slate-700"
            icon={<CloseOutlined className="text-sm" />}
            onClick={() => navigate(-1)}
          />
        </div>
      </div>

      <div className="mx-2 mt-2 rounded border border-sky-100 bg-[#eef6fd] text-[11px] text-slate-700">
        <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_1fr_1fr]">
          <div className="flex items-center gap-2 whitespace-nowrap border-b border-sky-100 px-2 py-1 md:border-b-0 md:border-r">
            <FileTextOutlined className="text-slate-600" />
            <span className="text-slate-900">Bill No :</span>
            <span className="font-medium text-slate-700">{billNo}</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap border-b border-sky-100 px-2 py-1 md:border-b-0 md:border-r">
            <UserOutlined className="text-slate-600" />
            <span className="text-slate-900">Customer Name :</span>
            <span className="truncate font-medium text-slate-700">{customerName}</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap px-2 py-1">
            <span className="text-slate-900">GST No :</span>
            <span className="font-medium text-slate-700">{gstNo}</span>
          </div>
        </div>
        <div className="border-t border-sky-100 px-2 py-2 text-slate-700">
          <span className="text-slate-900">Address :</span> {address}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-2 pt-2">
        <div className="mb-1 text-[13px] font-semibold text-slate-900">Add Items</div>

        <div className="overflow-hidden">
          <div className="grid grid-cols-[28px_minmax(220px,1.8fr)_78px_88px_88px_82px_70px_82px_56px_36px] gap-x-4 bg-[#6aa8d9] px-2 py-2 text-[10px] font-medium text-white">
            <div>Srl</div>
            <div>Description</div>
            <div>Qty</div>
            <div>Rate</div>
            <div>Value</div>
            <div>Discount</div>
            <div>Tax</div>
            <div>Total</div>
            <div>Delete</div>
            <div />
          </div>

          <div className="bg-white">
            {rows.map((row, index) => (
              <div
                key={row.key}
                className="grid grid-cols-[28px_minmax(220px,1.8fr)_78px_88px_88px_82px_70px_82px_56px_36px] items-center gap-x-4 border-b border-slate-100 px-2 py-2 text-[11px] last:border-b-0"
              >
                <div className="text-slate-700">{index + 1}</div>
                <div className="pr-1">
                  <Select
                    className="w-full"
                    size="small"
                    placeholder={loadingParts || isEditBillLoading ? "Loading..." : "Select Part"}
                    value={row.partId}
                    loading={loadingParts || isEditBillLoading}
                    disabled={!canEditBillItems}
                    options={partOptions.map((part) => ({
                      label: part.cPartName,
                      value: String(part.nPartId),
                    }))}
                    onChange={(value) => {
                      const part = partOptions.find((item) => String(item.nPartId) === String(value));
                      const nextRate = Number(part?.nRate || 0);
                      const nextQty = 1;
                      const nextValue = nextQty * nextRate;
                      updateRow(row.key, {
                        partId: String(value),
                        qty: nextQty,
                        rate: nextRate,
                        value: nextValue,
                        total: nextValue,
                      });
                      void recalculateTax(
                        {
                          ...row,
                          partId: String(value),
                          qty: nextQty,
                          rate: nextRate,
                          value: nextValue,
                          total: nextValue,
                        },
                        String(value),
                      );
                    }}
                  />
                </div>
                <div className="pl-1 pr-1">
                  <InputNumber
                    className="w-full"
                    size="small"
                    min={0}
                    value={row.qty}
                    disabled={!canEditBillItems}
                    onChange={(value) => {
                      const nextQty = Number(value || 0);
                      const nextValue = nextQty * Number(row.rate || 0);
                      const nextTotal = nextValue - Number(row.discount || 0) + Number(row.tax || 0);
                      updateRow(row.key, {
                        qty: nextQty,
                        value: nextValue,
                        total: nextTotal,
                      });
                      void recalculateTax(
                        {
                          ...row,
                          qty: nextQty,
                          value: nextValue,
                          total: nextTotal,
                        },
                      );
                    }}
                  />
                </div>
                <div className="pl-1 pr-1">
                  <InputNumber
                    className="w-full"
                    size="small"
                    min={0}
                    value={row.rate}
                    disabled={!canEditBillItems}
                    prefix="₹"
                    onChange={(value) => {
                      const nextRate = Number(value || 0);
                      const nextValue = Number(row.qty || 0) * nextRate;
                      const nextTotal = nextValue - Number(row.discount || 0) + Number(row.tax || 0);
                      updateRow(row.key, {
                        rate: nextRate,
                        value: nextValue,
                        total: nextTotal,
                      });
                      void recalculateTax(
                        {
                          ...row,
                          rate: nextRate,
                          value: nextValue,
                          total: nextTotal,
                        },
                      );
                    }}
                  />
                </div>
                <div className="pl-1 text-slate-700">₹{Number(row.value || 0).toFixed(2)}</div>
                <div className="pl-1">
                  <InputNumber
                    className="w-full"
                    size="small"
                    min={0}
                    value={row.discount}
                    disabled={!canEditBillItems}
                    prefix="₹"
                    onChange={(value) => {
                      const nextDiscount = Number(value || 0);
                      const nextTotal = Number(row.value || 0) - nextDiscount + Number(row.tax || 0);
                      updateRow(row.key, {
                        discount: nextDiscount,
                        total: nextTotal,
                      });
                      void recalculateTax(
                        {
                          ...row,
                          discount: nextDiscount,
                          total: nextTotal,
                        },
                      );
                    }}
                  />
                </div>
                <div className="pl-1 text-slate-700">₹{Number(row.tax || 0).toFixed(2)}</div>
                <div className="pl-1 text-slate-700">₹{Number(row.total || 0).toFixed(2)}</div>
                <div className="flex justify-center pl-1 text-rose-500">
                  {canEditBillItems ? (
                    <Button
                      type="text"
                      className="flex items-center justify-center p-0 hover:bg-rose-50"
                      icon={<img src={deleteRed} alt="delete" className="h-4 w-4" />}
                      onClick={() => deleteRow(row.key)}
                    />
                  ) : null}
                </div>
                <div className="flex justify-center pl-1">
                  {canEditBillItems && index === rows.length - 1 ? (
                    <Button
                      type="text"
                      className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#e9eef3] p-0 hover:bg-slate-300"
                      onClick={addRow}
                      icon={<img src={squarePlusIcon} alt="add" className="h-4 w-4" />}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-[#f3f3f3] px-4 py-3">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-1 text-[11px] leading-relaxed text-slate-700">
            <div className="flex gap-8">
              <span className="w-20">Total</span>
              <span>₹{totals.total.toFixed(2)}</span>
            </div>
            <div className="flex gap-8">
              <span className="w-20">Discount</span>
              <span>₹{totals.discount.toFixed(2)}</span>
            </div>
            <div className="flex gap-8">
              <span className="w-20">Tax Amount</span>
              <span>₹{totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex gap-8">
              <span className="w-20">Round Off</span>
              <span>₹0.00</span>
            </div>
            <div className="flex gap-8 font-semibold text-slate-900 border-t border-slate-200 pt-1">
              <span className="w-20">Bill Total</span>
              <span>₹{billTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            <div className="grid w-full max-w-[280px] grid-cols-[auto_1fr] items-baseline gap-x-12 gap-y-2 text-[11px]">
              <span className="text-slate-600 text-left">Pay Amount</span>
              <span className="text-right text-[24px] font-bold leading-none text-amber-500">
                {"₹"}{billTotal.toFixed(2)}
              </span>

              <span className="text-slate-600 text-left">Pay Mode</span>
              <span className="text-right font-medium text-slate-700">
                {selectedPayMode.label}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Button
                type="default"
                onClick={openPayModePicker}
                className="min-w-[120px] border-[#10b981] text-[#10b981] hover:!border-[#10b981] hover:!text-[#10b981]"
              >
                Change Pay Mode
              </Button>
              <Button
                type="primary"
                onClick={handleSaveClick}
                loading={savingBill}
                className="min-w-[58px] !bg-white !border-[#222] !text-[#111] hover:!border-[#111] hover:!text-[#111]"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <RightSideDrawer
        open={payModeOpen}
        onClose={() => setPayModeOpen(false)}
        title=""
        width={480}
        maskClosable={false}
        keyboard={false}
        bodyStyle={{ padding: 0, overflow: "hidden" }}
        hideHeader
        footer={
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-3">
            <Button onClick={() => setPayModeOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={handleSaveClick} loading={savingBill}>
              Save
            </Button>
          </div>
        }
      >
        <div className="flex min-h-0 w-full min-w-0 flex-col bg-white">
          <div className="relative bg-gradient-to-r from-[#e5f5fd] to-[#f4f7fe] px-5 py-6">
            <button
              type="button"
              aria-label="Close pay mode picker"
              onClick={() => setPayModeOpen(false)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-slate-800"
            >
              <CloseOutlined className="text-base" />
            </button>

            <div className="flex items-center gap-4">
              <div className="h-28 w-28 shrink-0 overflow-hidden">
                <img
                  src={paymentModeHero}
                  alt="Payment"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="text-[13px] font-medium text-slate-600">Payable Amount</div>
                <div className="text-[40px] font-bold leading-none text-[#eab308] mt-1.5">
                  ₹{billTotal.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 px-5">
            <div className="text-[15px] font-semibold text-slate-900">
              Select Your Payment Method
            </div>
            <div className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              "Choose your preferred payment option from the available methods to complete your transaction securely and conveniently."
            </div>
          </div>

          <div className="overflow-hidden px-5 pb-5 pt-4">
            <div
              ref={scrollContainerRef}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              className={`paymode-scrollbar flex gap-4  overflow-y-hidden scroll-smooth pb-3 pr-1 snap-x snap-mandatory select-none ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
            >
              {PAY_MODE_OPTIONS.map((option) => {
                const active = draftPayMode === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dragMovedRef.current) {
                        return;
                      }
                      setDraftPayMode(option.key);
                      setPayMode(option.key);
                    }}
                    className="flex shrink-0 snap-start flex-col items-center gap-2 cursor-pointer outline-none focus:outline-none"
                  >
                    <div
                      draggable={false}
                      className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border transition-all duration-200 ${
                        active
                          ? "border-sky-500 bg-sky-50/50 shadow-sm shadow-sky-100"
                          : "border-slate-100 bg-[#f4f7f9] hover:border-slate-300 hover:bg-[#eaf0f4]"
                      }`}
                    >
                      <img
                        src={option.image}
                        alt={option.label}
                        draggable={false}
                        className="h-9 w-9 object-contain"
                      />
                    </div>
                    <div
                      className={`w-[80px] text-center text-[10px] font-medium transition-colors duration-200 truncate ${
                        active ? "text-sky-600 font-bold" : "text-slate-700"
                      }`}
                    >
                      {option.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-h-[calc(100vh-360px)] overflow-y-auto px-5 pb-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-50">
              <div className="mb-4 text-[15px] font-semibold text-slate-900">
                {selectedPayMode.label}
              </div>
              {renderModeFields(selectedPayMode.key)}
            </div>
          </div>
        </div>
      </RightSideDrawer>
    </div>
  );
};

export default BillPreviewPage;
