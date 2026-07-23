import { useEffect, useMemo, useState } from "react";
import { Button, Empty, Input, InputNumber, Spin, message } from "antd";
import { CloseOutlined, FileTextOutlined, UserOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

import { billingApis } from "../../Axios/BillingApis";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import { getRequestPayload } from "../../Utils/requestPayload";
import PayModeDrawer from "./PayModeDrawer";

type ReceiptState = {
  customerId?: string | number;
  nCustomerId?: string | number;
  customerName?: string;
  CustomerName?: string;
  sessionPayload?: Record<string, any>;
  sourcePage?: string;
};

type OutstandingBillRow = Record<string, any>;

const RECEIPT_CREATE_STORAGE_KEY = "ticket_portal_receipt_create_state";
const RECEIPT_PAY_MODE_STORAGE_KEY = "ticket_portal_receipt_pay_mode";

const getFirstValue = (record: OutstandingBillRow, keys: string[]) => {
  for (const key of keys) {
    if (
      record?.[key] !== undefined &&
      record?.[key] !== null &&
      record?.[key] !== ""
    ) {
      return record[key];
    }
  }

  const recordKey = Object.keys(record || {}).find((item) =>
    keys.some((key) => key.toLowerCase() === item.toLowerCase()),
  );

  return recordKey ? record?.[recordKey] : "";
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

const formatDateValue = (value: any) => {
  const text = formatDisplayValue(value);
  if (!text) return "-";
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return parsed.toLocaleDateString("en-GB");
};

const formatDateTimeValue = (value: Date | string | number) => {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value ?? "");

  const date = parsed.toLocaleDateString("en-GB").replace(/\//g, "-");
  const time = parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} ${time}`;
};

const formatAmount = (value: any) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "₹0.00";
  return `₹${amount.toFixed(2)}`;
};

const normalizeSingleRecord = (value: any) => {
  if (Array.isArray(value)) return (value[0] ?? {}) as Record<string, any>;
  if (value && typeof value === "object") return value as Record<string, any>;
  return {};
};

const normalizeReceiptNumber = (response: any) => {
  const data = response?.data ?? response ?? {};
  const record = normalizeSingleRecord(data?.data ?? data?.result ?? data);

  return (
    formatDisplayValue(
      getFirstValue(record, [
        "nReceiptNo",
        "ReceiptNo",
        "receiptNo",
        "cReceiptNo",
        "ReceiptNumber",
        "nLastReceiptNo",
        "LastReceiptNo",
      ]),
    ) ||
    formatDisplayValue(
      getFirstValue(data, [
        "nReceiptNo",
        "ReceiptNo",
        "receiptNo",
        "cReceiptNo",
        "ReceiptNumber",
        "nLastReceiptNo",
        "LastReceiptNo",
        "message",
        "result",
      ]),
    ) ||
    "1"
  );
};

const normalizeOutstandingRows = (response: any) => {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
    response?.data?.result,
    response?.data?.items,
    response?.data?.list,
    response?.data?.message,
    response?.result,
    response?.items,
    response?.list,
    response?.message,
    response?.outstandingBillList,
    response?.OutstandingBillList,
    response?.data?.outstandingBillList,
    response?.data?.OutstandingBillList,
  ];

  for (const candidate of candidates) {
    const rows = extractList(candidate);
    if (rows.length > 0) return rows as OutstandingBillRow[];
  }

  return [] as OutstandingBillRow[];
};

const getOutstandingRowKey = (row: OutstandingBillRow, index: number) =>
  String(
    getFirstValue(row, ["nBillId", "BillId", "billId", "nInvoiceId", "Id"]) ||
      getFirstValue(row, ["nBillNo", "BillNo", "billNo"]) ||
      index + 1,
  );

const ReceiptCreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const receiptState = useMemo<ReceiptState>(() => {
    const fromState = (location.state ?? {}) as ReceiptState;
    if (Object.keys(fromState).length > 0) return fromState;

    try {
      const raw = sessionStorage.getItem(RECEIPT_CREATE_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ReceiptState) : {};
    } catch {
      return {};
    }
  }, [location.state]);

  const sessionPayload = receiptState.sessionPayload ?? getRequestPayload();
  const customerId = Number(
    receiptState.customerId ?? receiptState.nCustomerId ?? 0,
  ) || 0;
  const customerName =
    receiptState.customerName ?? receiptState.CustomerName ?? "Customer";

  const [payModeOpen, setPayModeOpen] = useState(false);
  const [payMode, setPayMode] = useState(() => {
    try {
      return sessionStorage.getItem(RECEIPT_PAY_MODE_STORAGE_KEY) || "Cash";
    } catch {
      return "Cash";
    }
  });
  const [narration, setNarration] = useState("");
  const [amountPaid, setAmountPaid] = useState<number | null>(null);
  const [billAllocations, setBillAllocations] = useState<Record<string, number>>({});
  const [receiptNo, setReceiptNo] = useState("1");
  const [outstandingRows, setOutstandingRows] = useState<OutstandingBillRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!customerId) {
      navigate("/receipts", { replace: true });
    }
  }, [customerId, navigate]);

  useEffect(() => {
    let alive = true;

    const loadReceiptData = async () => {
      if (!customerId) return;

      setIsLoading(true);
      setIsError(false);

      try {
        const [receiptResponse, outstandingResponse] = await Promise.all([
          billingApis.lastReceiptNumber(sessionPayload),
          billingApis.outstandingBillListCustomerWise({
            ...sessionPayload,
            nCustomerId: customerId,
            customerId,
            CustomerId: customerId,
          }),
        ]);

        if (!alive) return;

        setReceiptNo(normalizeReceiptNumber(receiptResponse));
        const rows = normalizeOutstandingRows(outstandingResponse);
        setOutstandingRows(rows);

        setBillAllocations((previous) => {
          const next: Record<string, number> = {};

          rows.forEach((row, index) => {
            const key = getOutstandingRowKey(row, index);
            const rowAmount = Number(
              getFirstValue(row, ["nOutstandingAmount", "OutstandingAmount", "Amount", "amount"]) ||
                0,
            );

            next[key] = previous[key] ?? rowAmount ?? 0;
          });

          return next;
        });
      } catch (error) {
        if (!alive) return;
        console.error("Failed to load receipt data", error);
        setIsError(true);
        setOutstandingRows([]);
        setReceiptNo("1");
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    void loadReceiptData();

    return () => {
      alive = false;
    };
  }, [customerId, sessionPayload]);

  useEffect(() => {
    try {
      sessionStorage.setItem(RECEIPT_PAY_MODE_STORAGE_KEY, payMode);
    } catch {
      // Best effort only.
    }
  }, [payMode]);

  useEffect(() => {
    if (!Object.keys(receiptState).length) return;

    try {
      sessionStorage.setItem(
        RECEIPT_CREATE_STORAGE_KEY,
        JSON.stringify(receiptState),
      );
    } catch {
      // Best effort only.
    }
  }, [receiptState]);

  const currentDateTime = formatDateTimeValue(new Date());

  const totalOutstanding = useMemo(() => {
    return outstandingRows.reduce((sum, row) => {
      const rowAmount = Number(
        getFirstValue(row, ["nOutstandingAmount", "OutstandingAmount", "Amount", "amount"]) ||
          0,
      );
      return sum + (Number.isFinite(rowAmount) ? rowAmount : 0);
    }, 0);
  }, [outstandingRows]);

  const totalAllocated = useMemo(() => {
    return Object.values(billAllocations).reduce(
      (sum, value) => sum + (Number(value) || 0),
      0,
    );
  }, [billAllocations]);

  const updateBillAllocation = (rowKey: string, value: number) => {
    setBillAllocations((previous) => ({
      ...previous,
      [rowKey]: Number.isFinite(Number(value)) ? Number(value) : 0,
    }));
  };

  const handleSaveReceipt = () => {
    message.info("Cannot save receipt — no amount paid.");
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex items-center justify-between bg-white px-4 py-3 text-[14px] text-slate-900">
        <div className="text-xl font-medium">Receipts</div>
        <div className="flex items-center gap-3">
          <span>{currentDateTime}</span>
          <button
            type="button"
            onClick={() => navigate("/receipts", { replace: true })}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-900 hover:bg-slate-100"
            aria-label="Close receipt page"
          >
            <CloseOutlined className="text-sm" />
          </button>
        </div>
      </div>

      <div className="mx-3 mt-1 rounded-md border border-sky-200 bg-[#eaf5fc] text-[14px] text-slate-700">
        <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_1fr]">
          <div className="flex items-center gap-3 whitespace-nowrap border-b border-sky-100 px-3 py-3 md:border-b-0 md:border-r">
            <FileTextOutlined className="text-lg text-slate-700" />
            <span className="text-slate-900">Receipt No :</span>
            <span className="font-medium text-slate-700">{receiptNo}</span>
          </div>
          <div className="flex items-center gap-3 whitespace-nowrap px-3 py-3">
            <UserOutlined className="text-lg text-slate-700" />
            <span className="text-slate-900">Customer Name :</span>
            <span className="truncate font-medium text-slate-700">{customerName}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-2 pt-2">
        <div className="grid grid-cols-[48px_84px_1fr_120px_140px_120px] gap-2 border-b border-slate-200 bg-white px-2 py-3 text-[12px] font-medium text-slate-900">
          <div>Srl</div>
          <div>Bill No</div>
          <div>Bill Date</div>
          <div>Bill Amount</div>
          <div>Outstanding Amount</div>
          <div>Amount Paid</div>
        </div>

        <div className="mt-2 min-h-[290px] rounded-xl border border-slate-100 bg-white p-3">
          <Spin spinning={isLoading}>
            {isError ? (
              <div className="flex min-h-[250px] items-center justify-center">
                <Empty description="No data" />
              </div>
            ) : outstandingRows.length > 0 ? (
              <div className="call-report-scrollbar max-h-[calc(100vh-370px)] overflow-y-auto overflow-x-hidden pr-2">
                {outstandingRows.map((row, index) => {
                  const rowKey = getOutstandingRowKey(row, index);
                  const billNo = formatDisplayValue(
                    getFirstValue(row, ["nBillNo", "BillNo", "billNo", "cBillNo"]),
                  ) || "-";
                  const billDate = formatDateValue(
                    getFirstValue(row, ["dBillDate", "BillDate", "Date"]),
                  );
                  const billAmount = Number(
                    getFirstValue(row, ["nBillAmount", "BillAmount", "TotalAmount", "Amount"]) ||
                      0,
                  );
                  const outstandingAmount = Number(
                    getFirstValue(row, [
                      "nOutstandingAmount",
                      "OutstandingAmount",
                      "nBalanceAmount",
                      "BalanceAmount",
                      "Amount",
                    ]) || 0,
                  );
                  const paidValue = Number(billAllocations[rowKey] ?? 0);

                  return (
                    <div
                      key={`${rowKey}-${index}`}
                      className="grid grid-cols-[48px_84px_1fr_120px_140px_120px] gap-2 border-b border-slate-100 px-2 py-3 text-[12px] text-slate-700"
                    >
                      <div>{index + 1}</div>
                      <div>{billNo}</div>
                      <div>{billDate}</div>
                      <div>{formatAmount(billAmount)}</div>
                      <div>{formatAmount(outstandingAmount)}</div>
                      <div>
                        <InputNumber
                          min={0}
                          value={paidValue}
                          onChange={(value) => updateBillAllocation(rowKey, Number(value ?? 0))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-slate-200 bg-white">
                <Empty description="No data" />
              </div>
            )}
          </Spin>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-0 border-t border-slate-200 bg-[#f3f3f3] px-4 py-3 md:grid-cols-[1fr_320px]">
        <div className="pr-4">
          <div className="mb-1 text-[13px] font-medium text-slate-900">Narration</div>
          <Input.TextArea
            value={narration}
            onChange={(event) => setNarration(event.target.value)}
            rows={3}
            className="!resize-none"
          />
        </div>

        <div className="border-l border-slate-200 pl-4">
          <div className="flex items-center justify-between text-slate-700">
            <span>Total Outstanding Amount</span>
            <span className="text-[24px] font-semibold text-slate-900">{formatAmount(totalOutstanding)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-slate-700">
            <span>Amount Paid</span>
            <InputNumber
              min={0}
              value={amountPaid ?? totalAllocated}
              onChange={(value) => setAmountPaid(Number(value ?? 0))}
              className="w-[110px]"
            />
          </div>
          <div className="mt-4 flex items-center justify-end">
            <Button
              type="primary"
              onClick={() => setPayModeOpen(true)}
              className="min-w-[120px] !bg-emerald-500"
            >
              Paymode
            </Button>
          </div>
        </div>
      </div>

      <PayModeDrawer
        open={payModeOpen}
      amount={amountPaid ?? totalAllocated}
      payMode={payMode}
      onClose={() => setPayModeOpen(false)}
      onCancel={() => setPayModeOpen(false)}
      onSave={handleSaveReceipt}
      onSelectPayMode={(mode) => {
        setPayMode(mode);
      }}
    />
    </div>
  );
};

export default ReceiptCreatePage;
