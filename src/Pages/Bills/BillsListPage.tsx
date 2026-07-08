import { useEffect, useMemo, useState } from "react";
import { Empty, Input, Spin, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { billingApis } from "../../Axios/BillingApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import TicketModulePagination from "../Ticket/Common/TicketModulePagination";
import editIcon from "../../assets/icons/edit-black.svg";
import deleteRed from "../../assets/icons/delete-red.svg";

type BillRow = Record<string, any>;

const getFieldValue = (record: BillRow, keys: string[]) => {
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

const extractBillRows = (response: any) => {
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
    response?.billList,
    response?.BillList,
    response?.data?.billList,
    response?.data?.BillList,
  ];

  for (const candidate of candidates) {
    const rows = extractList(candidate);
    if (rows.length > 0) return rows as BillRow[];
  }

  return [] as BillRow[];
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

const getBillNo = (row: BillRow) =>
  formatDisplayValue(
    getFieldValue(row, ["nBillNo", "BillNo", "billNo", "cBillNo", "BillNumber"]),
  );

const getCustomerName = (row: BillRow) =>
  formatDisplayValue(
    getFieldValue(row, ["cCustomerName", "CustomerName", "Customer", "cName"]),
  );

const getPayMode = (row: BillRow) =>
  formatDisplayValue(
    getFieldValue(row, ["cPaymodeName", "cPayMode", "PayMode", "PayModeName"]),
  );

const getBillAmount = (row: BillRow) =>
  getFieldValue(row, ["nTotalAmount", "TotalAmount", "Amount", "BillAmount"]);

const getBillId = (row: BillRow) =>
  Number(getFieldValue(row, ["nBillId", "BillId", "billId", "Id"]) || 0) || 0;

const getSearchText = (row: BillRow) =>
  [
    getBillNo(row),
    getFieldValue(row, ["dBillDate", "BillDate", "Date"]),
    getCustomerName(row),
    getBillAmount(row),
    getPayMode(row),
  ]
    .map((item) => normalizeText(item))
    .join(" ");

const BillsListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const payload = useMemo(
    () => ({
      ...getRequestPayload(),
    }),
    [],
  );

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bill-list", payload],
    queryFn: () => billingApis.billList(payload),
  });

  const sourceRows = useMemo(() => extractBillRows(data), [data]);

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

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return displayedRows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, displayedRows]);

  const tableRows = useMemo(
    () =>
      paginatedRows.map((row, index) => ({
        raw: row,
        srl: (currentPage - 1) * pageSize + index + 1,
        billId: getBillId(row),
        billNo: getBillNo(row) || "-",
        billDate: formatDateValue(getFieldValue(row, ["dBillDate", "BillDate", "Date"])),
        customerName: getCustomerName(row) || "-",
        amount: formatAmount(getBillAmount(row)),
        payMode: getPayMode(row) || "-",
      })),
    [currentPage, pageSize, paginatedRows],
  );

  const handleEditBill = (row: (typeof tableRows)[number]) => {
    navigate("/billsandreceipts/bills/edit", {
      state: {
        billId: row.billId,
        nBillId: row.billId,
        billNo: row.billNo,
        billData: row.raw,
        sessionPayload: payload,
        isEditMode: true,
        sourcePage: "bills",
      },
    });
  };

  const handleDeleteBill = async (row: (typeof tableRows)[number]) => {
    const billId = row.billId;
    if (!billId) {
      message.warning("Bill id not found.");
      return;
    }

    const confirmed = window.confirm(`Delete bill ${row.billNo}?`);
    if (!confirmed) return;

    try {
      const response = await billingApis.billDelete({
        ...payload,
        nBillId: billId,
        nCreatedby: payload?.nCreatedBy ?? payload?.id ?? payload?.nAgentId ?? 0,
      });
      message.success(response?.message || "Bill deleted successfully.");
      void queryClient.invalidateQueries({ queryKey: ["bill-list"] });
    } catch (error: any) {
      console.error("Failed to delete bill", error);
      message.error(error?.response?.data?.message || error?.message || "Unable to delete bill");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-white px-4 py-7">
      <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
        <div className="flex items-center justify-between gap-4 pb-2">
          <h1 className="text-[18px] font-medium text-slate-900">Bills</h1>
          <div className="flex items-center gap-2 mr-3 w-100 h-8">
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
              onClick={() => navigate("/billsandreceipts/bills/add")}
              className="rounded-md bg-emerald-500 w-25 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Add Bill
            </button>
          </div>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="grid grid-cols-[48px_84px_1fr_1fr_120px_100px_60px_60px] gap-1 border-b border-slate-200 bg-white px-2 py-3 text-[12px] font-medium text-slate-900">
            <div>Srl</div>
            <div>Bill No</div>
            <div>Date</div>
            <div>Customer Name</div>
            <div>Amount</div>
            <div>Pay Mode</div>
            <div>Edit</div>
            <div>Delete</div>
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
                      key={`${row.billNo}-${row.srl}`}
                      className="grid grid-cols-[48px_84px_1fr_1fr_120px_100px_60px_60px] gap-1 border-b border-slate-100 px-2 py-2 text-[12px] text-slate-700 hover:bg-sky-50"
                    >
                      <div>{row.srl}</div>
                      <div>{row.billNo}</div>
                      <div>{row.billDate}</div>
                      <div>{row.customerName}</div>
                      <div>{row.amount}</div>
                      <div>{row.payMode}</div>
                      <button
                        type="button"
                        className="flex items-center justify-center rounded-sm hover:bg-sky-100"
                        aria-label={`Edit bill ${row.billNo}`}
                        onClick={() => handleEditBill(row)}
                      >
                        <img src={editIcon} alt="" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-center rounded-sm hover:bg-rose-100"
                        aria-label={`Delete bill ${row.billNo}`}
                        onClick={() => void handleDeleteBill(row)}
                      >
                        <img src={deleteRed} alt="" className="h-4 w-4" />
                      </button>
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
    </div>
  );
};

export default BillsListPage;
