import { useEffect, useMemo, useState } from "react";
import { Empty, Input, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { billingApis } from "../../Axios/BillingApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import TicketModulePagination from "../Ticket/Common/TicketModulePagination";
import { useGetCustomerDropDown } from "../Master/CustomerMaster/Hooks";
import CustomerPickerModal from "../Ticket/TicketCreate/CustomerPickerModal";

type ReceiptRow = Record<string, any>;

const getFieldValue = (record: ReceiptRow, keys: string[]) => {
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

const normalizeText = (value: any) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const extractReceiptRows = (response: any) => {
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
    response?.receiptList,
    response?.ReceiptList,
    response?.data?.receiptList,
    response?.data?.ReceiptList,
  ];

  for (const candidate of candidates) {
    const rows = extractList(candidate);
    if (rows.length > 0) return rows as ReceiptRow[];
  }

  return [] as ReceiptRow[];
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

const parseDateValue = (value: any) => {
  const text = formatDisplayValue(value);
  if (!text) return null;

  const match = text.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*([AP]M))?$/,
  );

  if (match) {
    const [, dd, mm, yyyy, hh = "0", min = "0", meridiem] = match;
    let hour = Number(hh);
    const minute = Number(min);
    const upperMeridiem = meridiem?.toUpperCase();

    if (upperMeridiem === "PM" && hour < 12) hour += 12;
    if (upperMeridiem === "AM" && hour === 12) hour = 0;

    const parsed = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      hour,
      minute,
      0,
      0,
    );

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateValue = (value: any) => {
  const parsed = parseDateValue(value);
  if (!parsed) return "-";

  return parsed.toLocaleDateString("en-GB");
};

const formatAmount = (value: any) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "₹0.00";
  return `₹${amount.toFixed(2)}`;
};

const getReceiptNo = (row: ReceiptRow) =>
  formatDisplayValue(
    getFieldValue(row, ["nReceiptNo", "ReceiptNo", "receiptNo", "cReceiptNo", "ReceiptNumber"]),
  );

const getCustomerName = (row: ReceiptRow) =>
  formatDisplayValue(
    getFieldValue(row, ["cCustomerName", "CustomerName", "Customer", "cName"]),
  );

const getReceiptAmount = (row: ReceiptRow) =>
  getFieldValue(row, ["nTotalAmount", "TotalAmount", "Amount", "ReceiptAmount"]);

const getPayMode = (row: ReceiptRow) =>
  formatDisplayValue(
    getFieldValue(row, ["cPaymodeName", "cPayMode", "PayMode", "PayModeName"]),
  );

const getSearchText = (row: ReceiptRow) =>
  [
    getReceiptNo(row),
    getFieldValue(row, ["dReceiptDate", "ReceiptDate", "Date"]),
    getCustomerName(row),
    getReceiptAmount(row),
    getPayMode(row),
  ]
    .map((item) => normalizeText(item))
    .join(" ");

const ReceiptsListPage = () => {
  const navigate = useNavigate();
  const payload = useMemo(
    () => ({
      ...getRequestPayload(),
    }),
    [],
  );

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddReceiptModalOpen, setIsAddReceiptModalOpen] = useState(false);
  const { data: customerDropdownData } = useGetCustomerDropDown({
    ...payload,
    pageNumber: 1,
    pageSize: 1000,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["receipt-list", payload],
    queryFn: () => billingApis.receiptList(payload),
  });
  const customers = useMemo(
    () => extractList(customerDropdownData),
    [customerDropdownData],
  );

  const sourceRows = useMemo(() => extractReceiptRows(data), [data]);

  const displayedRows = useMemo(() => {
    const searchTerm = normalizeText(search);
    return sourceRows.filter((row) => !searchTerm || getSearchText(row).includes(searchTerm));
  }, [search, sourceRows]);

  const totalRows = displayedRows.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalRows / pageSize));
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }, [currentPage, pageSize, totalRows]);

  const handleCustomerSelect = (customerId: any) => {
    const customer = customers.find((item: any) => {
      const itemId =
        item?.nCustomerId ??
        item?.customerId ??
        item?.CustomerId ??
        item?.id ??
        item?.Id;
      return String(itemId ?? "") === String(customerId);
    });

    const customerName =
      customer?.cCustomerName ??
      customer?.CustomerName ??
      customer?.name ??
      customer?.cName ??
      "Customer";

    setIsAddReceiptModalOpen(false);
    navigate("/receipts/add", {
      state: {
        customerId,
        nCustomerId: customerId,
        customerName,
        CustomerName: customerName,
        sessionPayload: payload,
        sourcePage: "receipts",
      },
    });
  };

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return displayedRows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, displayedRows]);

  const tableRows = useMemo(
    () =>
      paginatedRows.map((row, index) => ({
        raw: row,
        srl: (currentPage - 1) * pageSize + index + 1,
        receiptNo: getReceiptNo(row) || "-",
        receiptDate: formatDateValue(getFieldValue(row, ["dReceiptDate", "ReceiptDate", "Date"])),
        customerName: getCustomerName(row) || "-",
        amount: formatAmount(getReceiptAmount(row)),
        payMode: getPayMode(row) || "-",
      })),
    [currentPage, pageSize, paginatedRows],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-white px-4 py-7">
      <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
          <h1 className="text-[18px] font-medium text-slate-900">Receipts</h1>
          <div className="flex items-center gap-2">
            <Input
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-[340px]"
              style={{ height: 34 }}
            />
            <button
              type="button"
              onClick={() => setIsAddReceiptModalOpen(true)}
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Add Receipt
            </button>
          </div>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="grid grid-cols-[48px_84px_1fr_1fr_120px_100px] gap-1 border-b border-slate-200 bg-white px-2 py-3 text-[12px] font-medium text-slate-900">
            <div>Srl</div>
            <div>Receipt No</div>
            <div>Date</div>
            <div>Customer Name</div>
            <div>Amount</div>
            <div>Pay Mode</div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden p-3">
            <Spin spinning={isLoading}>
              {isError ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-xl">
                  <div className="text-sm">No data.</div>
                </div>
              ) : tableRows.length > 0 ? (
                <div className="call-report-scrollbar max-h-[calc(100vh-220px)] overflow-y-auto overflow-x-hidden pr-2">
                  {tableRows.map((row) => (
                    <div
                      key={`${row.receiptNo}-${row.srl}`}
                      className="grid grid-cols-[48px_84px_1fr_1fr_120px_100px] gap-1 border-b border-slate-100 px-2 py-2 text-[12px] text-slate-700 hover:bg-sky-50"
                    >
                      <div>{row.srl}</div>
                      <div>{row.receiptNo}</div>
                      <div>{row.receiptDate}</div>
                      <div>{row.customerName}</div>
                      <div>{row.amount}</div>
                      <div>{row.payMode}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-slate-200 bg-white">
                  <Empty description="No data" />
                </div>
              )}
            </Spin>
          </div>
        </div>

        {totalRows > 0 ? (
          <div className="bg-white -mb-5 px-4 py-0">
            <TicketModulePagination
              elevated={false}
              current={currentPage}
              pageSize={pageSize}
              total={totalRows}
              onChange={(page, nextPageSize) => {
                setCurrentPage(page);
                setPageSize(nextPageSize);
              }}
              onShowSizeChange={(page, nextPageSize) => {
                setCurrentPage(page);
                setPageSize(nextPageSize);
              }}
            />
          </div>
        ) : null}
      </div>

      <CustomerPickerModal
        open={isAddReceiptModalOpen}
        customers={customers}
        title="Choose a customer to add receipt"
        searchPlaceholder="Search customer"
        emptyMessage="No customer found"
        onCancel={() => setIsAddReceiptModalOpen(false)}
        onSelect={handleCustomerSelect}
      />
    </div>
  );
};

export default ReceiptsListPage;
