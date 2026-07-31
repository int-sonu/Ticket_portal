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
  receiptId?: string | number;
  nReceiptId?: string | number;
  receiptNo?: string | number;
  receiptDetails?: Record<string, any>;
  isEditMode?: boolean;
};

type OutstandingBillRow = Record<string, any>;

const RECEIPT_CREATE_STORAGE_KEY = "ticket_portal_receipt_create_state";
const RECEIPT_PAY_MODE_STORAGE_KEY = "ticket_portal_receipt_pay_mode";
const PAY_MODE_IDS: Record<string, number> = {
  Cash: 1,
  UPI: 2,
  Card: 3,
  "Net Banking": 4,
  Cheque: 5,
  Complimentary: 6,
  Company: 7,
  QR: 8,
  Split: 9,
};

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
        "nRecNo",
      ]),
    ) ||
    formatDisplayValue(
      getFirstValue(data, [
        "nRecNo",
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

const normalizeReceiptDetailRows = (response: any) => {
  const candidates = [
    response?.data?.data?.receiptDetails,
    response?.data?.data?.ReceiptDetails,
    response?.data?.receiptDetails,
    response?.data?.ReceiptDetails,
    response?.receiptDetails,
    response?.ReceiptDetails,
    response?.data?.data?.billDetails,
    response?.data?.billDetails,
    response?.billDetails,
  ];

  for (const candidate of candidates) {
    const rows = extractList(candidate);
    if (rows.length > 0) return rows as OutstandingBillRow[];
  }

  return normalizeOutstandingRows(response);
};

const normalizeReceiptSummary = (response: any) => {
  const candidates = [
    response?.data?.data?.receiptSummary,
    response?.data?.data?.ReceiptSummary,
    response?.data?.receiptSummary,
    response?.data?.ReceiptSummary,
    response?.receiptSummary,
    response?.ReceiptSummary,
    response?.data?.data,
    response?.data,
    response,
  ];

  for (const candidate of candidates) {
    const record = normalizeSingleRecord(candidate);
    if (Object.keys(record).length > 0) return record;
  }

  return {} as Record<string, any>;
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

  const sessionPayload: Record<string, any> =
    receiptState.sessionPayload ?? getRequestPayload();
  const receiptId = Number(
    receiptState.receiptId ?? receiptState.nReceiptId ?? 0,
  ) || 0;
  const isEditMode = Boolean(receiptState.isEditMode && receiptId);
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
  const [isSaving, setIsSaving] = useState(false);

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
        const [receiptResponse, detailResponse] = await Promise.all([
          billingApis.lastReceiptNumber(sessionPayload),
          isEditMode
            ? billingApis.receiptDetailsView({
                ...sessionPayload,
                nReceiptId: receiptId,
                nRecId: receiptId,
              })
            : billingApis.outstandingBillListCustomerWise({
                ...sessionPayload,
                nCustomerId: customerId,
                customerId,
                CustomerId: customerId,
              }),
        ]);

        if (!alive) return;

        const summary = isEditMode ? normalizeReceiptSummary(detailResponse) : {};
        setReceiptNo(
          formatDisplayValue(
            getFirstValue(summary, ["nRecNo", "ReceiptNo", "nReceiptNo"]),
          ) ||
            formatDisplayValue(receiptState.receiptNo) ||
            normalizeReceiptNumber(receiptResponse),
        );
        const rows = isEditMode
          ? normalizeReceiptDetailRows(detailResponse)
          : normalizeOutstandingRows(detailResponse);
        setOutstandingRows(rows);

        if (isEditMode) {
          setNarration(
            formatDisplayValue(
              getFirstValue(summary, ["cNarration", "Narration", "narration"]),
            ),
          );
          setPayMode(
            formatDisplayValue(
              getFirstValue(summary, [
                "cPaymodeName",
                "cPayMode",
                "PayMode",
                "PayModeName",
              ]),
            ) || "Cash",
          );
          const existingAmount = Number(
            getFirstValue(summary, [
              "nAmount",
              "nPaidAmount",
              "AmountPaid",
              "nReceiptAmount",
            ]) || 0,
          );
          setAmountPaid(Number.isFinite(existingAmount) ? existingAmount : 0);
        }

        setBillAllocations((previous) => {
          const next: Record<string, number> = {};

          rows.forEach((row, index) => {
            const key = getOutstandingRowKey(row, index);
            const rowAmount = Number(
              getFirstValue(
                row,
                isEditMode
                  ? [
                      "nPayedAmount",
                      "nPaidAmount",
                      "AmountPaid",
                      "nReceiptAmount",
                    ]
                  : [
                      "outstandingAmt",
                      "nOutstandingAmount",
                      "OutstandingAmount",
                      "nBalanceAmount",
                      "BalanceAmount",
                      "Amount",
                      "amount",
                    ],
              ) ||
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
  }, [customerId, isEditMode, receiptId, receiptState.receiptNo, sessionPayload]);

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
        getFirstValue(row, [
          "outstandingAmt",
          "nOutstandingAmount",
          "OutstandingAmount",
          "nBalanceAmount",
          "BalanceAmount",
          "Amount",
          "amount",
        ]) ||
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

  const handleSaveReceipt = async () => {
    if (isSaving) return;

    const receiptDetails = outstandingRows
      .map((row, index) => {
        const rowKey = getOutstandingRowKey(row, index);
        const paidAmount = Number(billAllocations[rowKey] ?? 0);
        const billId = Number(
          getFirstValue(row, ["nBillId", "BillId", "billId", "nInvoiceId", "Id"]) ||
            0,
        );
        const billAmount = Number(
          getFirstValue(row, [
            "nAmount",
            "nBillAmount",
            "BillAmount",
          ]) || 0,
        );

        return {
          nBillId: billId,
          nBillAmount: Number.isFinite(billAmount) ? billAmount : 0,
          nPayedAmount: Number.isFinite(paidAmount) ? paidAmount : 0,
          nCompanyId: Number(sessionPayload.nCompanyId ?? 0),
        };
      })
      .filter((detail) => detail.nBillId > 0 && detail.nPayedAmount > 0);

    const paidAmount = receiptDetails.reduce(
      (sum, detail) => sum + detail.nPayedAmount,
      0,
    );

    if (paidAmount <= 0) {
      message.warning("Enter an amount paid before saving the receipt.");
      return;
    }

    const payModeId = PAY_MODE_IDS[payMode];
    if (!payModeId) {
      message.warning("Select a pay mode before saving the receipt.");
      return;
    }

    const createdBy = Number(
      sessionPayload.nAgentId ??
        sessionPayload.nCreatedBy ??
        sessionPayload.ncreatedBy ??
        sessionPayload.id ??
        0,
    );

    const payload = {
      ...sessionPayload,
      nReceiptId: receiptId,
      nRecId: receiptId,
      nCustomerId: customerId,
      nPaymode: payModeId,
      nAmount: paidAmount,
      cCustomerName: customerName,
      cNarration: narration,
      ncreatedBy: createdBy,
      receiptDetails,
      payDtls: [{ nPayAmount: paidAmount, nPaymode: payModeId }],
      chequeDtls: [],
      customerCreditDtls: [],
      transationDtls: [],
    };

    setIsSaving(true);
    try {
      const response = isEditMode
        ? await billingApis.receiptUpdate(payload)
        : await billingApis.receiptSave(payload);
      if (Number(response?.statusCode ?? 200) >= 400) {
        throw new Error(response?.message || "Unable to save receipt.");
      }

      message.success(
        response?.message ||
          (isEditMode
            ? "Receipt payment mode updated successfully."
            : "Receipt saved successfully."),
      );
      setPayModeOpen(false);
      sessionStorage.removeItem(RECEIPT_CREATE_STORAGE_KEY);
      navigate("/receipts", { replace: true });
    } catch (error: any) {
      console.error("Failed to save receipt", error);
      message.error(
        error?.response?.data?.message ??
          error?.message ??
          "Unable to save receipt.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openBillDetails = (row: OutstandingBillRow) => {
    const billId = Number(
      getFirstValue(row, ["nBillId", "BillId", "billId", "nInvoiceId", "Id"]) ||
        0,
    );

    if (!billId) {
      message.warning("Bill details are not available.");
      return;
    }

    navigate("/billsandreceipts/bill/view", {
      state: {
        billId,
        nBillId: billId,
        billData: row,
        sessionPayload,
        returnTo: isEditMode
          ? "/billsandreceipts/receipts/edit"
          : "/receipts/add",
        returnState: receiptState,
      },
    });
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
        <div className="grid min-w-[900px] grid-cols-[48px_84px_1fr_120px_140px_120px_150px] gap-2 border-b border-slate-200 bg-white px-2 py-3 text-[12px] font-medium text-slate-900">
          <div>Srl</div>
          <div>Bill No</div>
          <div>Bill Date</div>
          <div>Bill Amount</div>
          <div>Outstanding Amount</div>
          <div>Amount Paid</div>
          <div />
        </div>

        <div className="mt-2 min-h-[290px] rounded-xl border border-slate-100 bg-white p-3">
          <Spin spinning={isLoading}>
            {isError ? (
              <div className="flex min-h-[250px] items-center justify-center">
                <Empty description="No data" />
              </div>
            ) : outstandingRows.length > 0 ? (
              <div className="call-report-scrollbar max-h-[calc(100vh-370px)] overflow-auto pr-2">
                {outstandingRows.map((row, index) => {
                  const rowKey = getOutstandingRowKey(row, index);
                  const billNo = formatDisplayValue(
                    getFirstValue(row, ["nBillNo", "BillNo", "billNo", "cBillNo"]),
                  ) || "-";
                  const billDate = formatDateValue(
                    getFirstValue(row, ["dBillDate", "BillDate", "dRecDate"]),
                  );
                  const billAmount = Number(
                    getFirstValue(row, [
                      "nAmount",
                      "nBillAmount",
                      "BillAmount",
                    ]) ||
                      0,
                  );
                  const outstandingAmount = Number(
                    getFirstValue(row, [
                      "outstandingAmt",
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
                      className="grid min-w-[900px] grid-cols-[48px_84px_1fr_120px_140px_120px_150px] items-center gap-2 border-b border-slate-100 px-2 py-3 text-[12px] text-slate-700"
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
                          disabled={isEditMode}
                          onChange={(value) => updateBillAllocation(rowKey, Number(value ?? 0))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Button
                          size="small"
                          onClick={() => openBillDetails(row)}
                          className="w-full"
                        >
                          View Bill Details
                        </Button>
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
            disabled={isEditMode}
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
              disabled={isEditMode}
              className="w-[110px]"
            />
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <Button
              type="primary"
              onClick={() => setPayModeOpen(true)}
              className="min-w-[120px] !bg-emerald-500"
            >
              {isEditMode ? "Change Pay Mode" : "Paymode"}
            </Button>
            {isEditMode ? (
              <Button
                type="primary"
                loading={isSaving}
                onClick={() => void handleSaveReceipt()}
                className="min-w-[74px] !bg-emerald-500"
              >
                Save
              </Button>
            ) : null}
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
      saving={isSaving}
      onSelectPayMode={(mode) => {
        setPayMode(mode);
      }}
    />
    </div>
  );
};

export default ReceiptCreatePage;
