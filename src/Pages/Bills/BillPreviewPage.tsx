import React, { useEffect, useMemo, useState } from "react";
import { Button, InputNumber, Select, message } from "antd";
import {
  CloseOutlined,
  FileTextOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

import { billingApis } from "../../Axios/MasterApis";
import deleteRed from "../../assets/icons/delete-red.svg";
import squarePlusIcon from "../../assets/icons/FaSquarePlus.svg";

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
  customerName?: string;
  customerId?: string | number;
  ticketNo?: string | number;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  summary?: string;
  partList?: BillPart[];
  sessionPayload?: Record<string, any>;
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

const BILL_PREVIEW_STORAGE_KEY = "ticket_portal_bill_preview_state";

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

const BillPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const billData = useMemo<BillPreviewState>(() => {
    const fromState = (location.state ?? {}) as BillPreviewState;
    if (Object.keys(fromState).length > 0) return fromState;

    try {
      const raw = sessionStorage.getItem(BILL_PREVIEW_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as BillPreviewState) : {};
    } catch {
      return {};
    }
  }, [location.state]);

  const sessionPayload = billData.sessionPayload ?? {};
  const [partOptions, setPartOptions] = useState<PartOption[]>(
    normalizePartOptions({ data: billData.partList ?? [] }),
  );
  const [loadingParts, setLoadingParts] = useState(false);
  const [rows, setRows] = useState<BillRow[]>([makeRow()]);

  useEffect(() => {
    let alive = true;

    const loadParts = async () => {
      const payload = {
        ...sessionPayload,
        nCompanyId: Number(sessionPayload?.nCompanyId ?? 0) || 0,
        cSchemaName: sessionPayload?.cSchemaName ?? "",
        cDbName: sessionPayload?.cDbName ?? "",
        nTicketId: Number(sessionPayload?.nTicketId ?? 0) || 0,
        nCustomerId: Number(sessionPayload?.nCustomerId ?? 0) || 0,
        nAssetId: Number(sessionPayload?.nAssetId ?? 0) || 0,
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
  }, [sessionPayload]);

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

  const displayDate = new Date().toLocaleString();
  const customerName = billData.customerName || "-";
  const billNo = billData.billNo || "-";
  const customerId = billData.customerId || "-";
  const contactNumber = billData.contactNumber || "-";
  const email = billData.email || "-";
  const summaryText = billData.summary || "-";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex items-center justify-between px-2 py-1">
        <div className="text-[15px] font-semibold text-slate-900">Bill</div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">{displayDate}</span>
          <Button
            type="text"
            size="small"
            className="!h-5 !w-5 !min-w-5 !p-0 !text-base !text-slate-700"
            icon={<CloseOutlined className="text-sm" />}
            onClick={() => navigate(-1)}
          />
        </div>
      </div>

      <div className="border-b border-slate-200" />

      <div className="mx-0 mt-1 rounded border border-sky-100 bg-[#eef6fd] text-[11px] text-slate-700">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          <div className="flex items-center gap-2 whitespace-nowrap border-b border-sky-100 px-2 py-1 lg:border-b-0 lg:border-r">
            <FileTextOutlined />
            <span className="text-slate-600">Bill No :</span>
            <span className="font-medium text-slate-700">{billNo}</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap border-b border-sky-100 px-2 py-1 lg:border-b-0 lg:border-r">
            <UserOutlined />
            <span className="text-slate-600">Customer Name :</span>
            <span className="truncate font-medium text-slate-700">{customerName}</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap border-b border-sky-100 px-2 py-1 lg:border-b-0 lg:border-r">
            <span className="font-semibold">ID :</span>
            <span className="font-medium text-slate-700">{customerId}</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap border-b border-sky-100 px-2 py-1 lg:border-b-0 lg:border-r">
            <PhoneOutlined />
            <span className="font-medium text-slate-700">{contactNumber}</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap px-2 py-1">
            <MailOutlined />
            <span className="truncate font-medium text-slate-700">{email}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4">
          <div className="flex items-center gap-2 whitespace-nowrap px-2 py-1 lg:col-span-2">
            <span className="text-slate-600">Call Report Id :</span>
            <span className="font-medium text-slate-700">{billData.ticketNo || "-"}</span>
          </div>
          <div className="px-2 py-1 lg:col-span-5">
            <span className="text-slate-600">Summary :</span>
            
            <span className="break-words text-slate-700">{summaryText}</span>
          </div>
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
                    placeholder={loadingParts ? "Loading..." : "Select Part"}
                    value={row.partId}
                    loading={loadingParts}
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
                  <Button
                    type="text"
                    className="flex items-center justify-center p-0 hover:bg-rose-50"
                    icon={<img src={deleteRed} alt="delete" className="h-4 w-4" />}
                    onClick={() => deleteRow(row.key)}
                  />
                </div>
                <div className="flex justify-center pl-1">
                  {index === rows.length - 1 ? (
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
            <div className="grid grid-cols-[auto_1fr] gap-x-12 gap-y-2 text-[11px] items-baseline w-full max-w-[280px]">
              <span className="text-slate-600 text-left">Pay Amount</span>
              <span className="text-[24px] font-bold text-amber-500 text-right leading-none">
                ₹{billTotal.toFixed(2)}
              </span>

              <span className="text-slate-600 text-left">Pay Mode</span>
              <span className="font-medium text-slate-700 text-right">Cash</span>

              <span className="text-slate-600 text-left">Cash</span>
              <span className="font-medium text-slate-700 text-right">₹{billTotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Button
                type="default"
                className="min-w-[120px] border-[#10b981] text-[#10b981] hover:!border-[#10b981] hover:!text-[#10b981]"
              >
                Change Pay Mode
              </Button>
              <Button
                type="primary"
                style={{ backgroundColor: "#fff", borderColor: "#222", color: "#111" }}
                className="min-w-[58px]"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillPreviewPage;
