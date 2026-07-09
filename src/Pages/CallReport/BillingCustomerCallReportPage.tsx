// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Empty, Input, Spin, message } from "antd";
import {
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  CloseOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";

import { billingApis } from "../../Axios/BillingApis";
import { unbilledCallReportApis } from "../../Axios/UnbilledCallReportAllApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import TicketModulePagination from "../Ticket/Common/TicketModulePagination";

type CallReportRow = Record<string, any>;

const normalizeText = (value: any) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

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

const getFieldValue = (record: CallReportRow, keys: string[]) => {
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

const extractCallReportRows = (response: any) => {
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
    response?.callReportList,
    response?.CallReportList,
    response?.callreportList,
    response?.billedCallReportList,
    response?.BilledCallReportList,
    response?.unbilledCallReportList,
    response?.UnbilledCallReportList,
    response?.data?.callReportList,
    response?.data?.CallReportList,
    response?.data?.callreportList,
    response?.data?.billedCallReportList,
    response?.data?.BilledCallReportList,
    response?.data?.unbilledCallReportList,
    response?.data?.UnbilledCallReportList,
  ];

  for (const candidate of candidates) {
    const rows = extractList(candidate);
    if (rows.length > 0) return rows as CallReportRow[];
  }

  return [] as CallReportRow[];
};

const getCustomerId = (row: CallReportRow) =>
  Number(getFieldValue(row, ["nCustomerId", "CustomerId", "customerId"]) || 0) || 0;

const getCustomerName = (row: CallReportRow) =>
  formatDisplayValue(
    getFieldValue(row, ["cCustomerName", "CustomerName", "Customer", "cName"]),
  );

const getCustomerContact = (row: CallReportRow) =>
  formatDisplayValue(
    getFieldValue(row, [
      "cContactNumber",
      "ContactNumber",
      "cMobile",
      "Mobile",
      "Phone",
      "cPhoneNo",
      "cMobileNo",
      "MobileNo",
    ]),
  );

const getCustomerEmail = (row: CallReportRow) =>
  formatDisplayValue(getFieldValue(row, ["cEmail", "Email", "email", "cEmailId"]));

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

const getCallReportId = (row: CallReportRow) =>
  formatDisplayValue(
    getFieldValue(row, [
      "nFollowupId",
      "nFollowUpId",
      "nCallReportId",
      "CallReportId",
      "cCallReportId",
      "nTicketId",
    ]),
  );

const getAgentName = (row: CallReportRow) =>
  formatDisplayValue(getFieldValue(row, ["cAgentName", "AgentName", "Agent"]));

const getCallSummary = (row: CallReportRow) =>
  formatDisplayValue(
    getFieldValue(row, [
      "cCallreportSummary",
      "cCallReportSummary",
      "cTicketSummary",
      "CallSummary",
      "cCallSummary",
      "Summary",
      "cViewSummary",
    ]),
  );

const getStatus = (row: CallReportRow) =>
  formatDisplayValue(
    getFieldValue(row, [
      "cTicketStatus",
      "cStatus",
      "Status",
      "StatusName",
      "cClosedStatus",
    ]),
  );

const normalizeBillPartList = (response: any) => {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
    response?.data?.result,
    response?.data?.items,
    response?.data?.list,
    response?.result,
    response?.items,
    response?.list,
    response?.message,
    response?.partList,
    response?.PartList,
    response?.partDetails,
    response?.PartDetails,
  ];

  for (const candidate of candidates) {
    const list = extractList(candidate);
    if (list.length > 0) return list;
  }

  return [];
};

const BillingCustomerCallReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = (location.state ?? {}) as Record<string, any>;
  const customerIdFromRoute = Number(routeState?.customerId ?? routeState?.nCustomerId ?? 0) || 0;
  const customerNameFromRoute =
    formatDisplayValue(routeState?.customerName ?? routeState?.CustomerName) || "Customer";
  const customerPhoneFromRoute =
    formatDisplayValue(routeState?.phone ?? routeState?.cPhoneNo ?? routeState?.cMobileNo) || "NIL";
  const customerEmailFromRoute =
    formatDisplayValue(routeState?.email ?? routeState?.cEmail ?? routeState?.cEmailId) || "NIL";
  const sessionPayload = routeState?.sessionPayload ?? getRequestPayload();

  const payload = useMemo(
    () => ({
      ...getRequestPayload(),
      nCustomerId: customerIdFromRoute || undefined,
      CustomerId: customerIdFromRoute || undefined,
      customerId: customerIdFromRoute || undefined,
      cCustomerName: customerNameFromRoute,
      CustomerName: customerNameFromRoute,
      pageNumber: 1,
      pageSize: 1000,
    }),
    [customerIdFromRoute, customerNameFromRoute],
  );

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ["customer-wise-unbilled-call-report", payload],
    queryFn: () => unbilledCallReportApis.customerWiseUnbilledCallReportList(payload),
    enabled: !!customerIdFromRoute,
  });

  const sourceRows = useMemo(() => extractCallReportRows(data), [data]);

  const filteredRows = useMemo(() => {
    const term = normalizeText(search);
    return sourceRows.filter((row) => {
      const rowSearchText = [
        getFieldValue(row, ["dCallReportDate", "dCreatedDate", "cCallReportDate"]),
        getCallReportId(row),
        getFieldValue(row, ["nTicketNo", "TicketNo", "TicketNo.", "cTicketNo"]),
      getFieldValue(row, ["cTicketSummary", "cCallSummary", "Summary", "cViewSummary"]),
      ]
        .map((item) => normalizeText(item))
        .join(" ");

      return !term || rowSearchText.includes(term);
    });
  }, [search, sourceRows]);

  const handleRowClick = async (row: CallReportRow) => {
    const rowCustomerId = getCustomerId(row) || customerIdFromRoute;
    const rowCustomerName = getCustomerName(row) || customerNameFromRoute;
    const rowCustomerPhone = getCustomerContact(row) || customerPhoneFromRoute;
    const rowCustomerEmail = getCustomerEmail(row) || customerEmailFromRoute;
    const rowTicketNo =
      Number(
        getFieldValue(row, ["nTicketId", "TicketId", "ticketId", "nTicketNo", "TicketNo"]),
      ) || 0;
    const rowFollowupId =
      Number(
        getFieldValue(row, [
          "nFollowupId",
          "nFollowUpId",
          "nWorksheetId",
          "WorksheetId",
          "nCallReportId",
          "CallReportId",
        ]),
      ) || rowTicketNo || 0;

    const billPayload = {
      ...getRequestPayload(),
      ...sessionPayload,
      nCompanyId: Number(sessionPayload?.nCompanyId ?? 0) || Number(getRequestPayload().nCompanyId ?? 0) || 0,
      cSchemaName: sessionPayload?.cSchemaName ?? getRequestPayload().cSchemaName ?? "",
      cDbName: sessionPayload?.cDbName ?? getRequestPayload().cDbName ?? "",
    };

    try {
      const [lastBillResponse, partListResponse] = await Promise.all([
        billingApis.lastBillNumber(billPayload),
        billingApis.partListForBilling({
          ...billPayload,
          nCustomerId: rowCustomerId || undefined,
          CustomerId: rowCustomerId || undefined,
          customerId: rowCustomerId || undefined,
          nTicketId: rowTicketNo || undefined,
          TicketId: rowTicketNo || undefined,
          ticketId: rowTicketNo || undefined,
        }),
      ]);

      const lastBillPayload = lastBillResponse?.data ?? lastBillResponse ?? {};
      const lastBillNumber =
        lastBillPayload?.lastBillNumber ??
        lastBillPayload?.LastBillNumber ??
        lastBillPayload?.cBillNo ??
        lastBillPayload?.billNo ??
        lastBillPayload?.BillNo ??
        "";

      const partList = normalizeBillPartList(partListResponse);
      const callreportData = {
        callreportSummary: row,
        ticketSummary: row,
        data: {
          callreportSummary: row,
          ticketSummary: row,
        },
      };

      const billPreviewState = {
        companyName:
          formatDisplayValue(
            routeState?.companyName ?? routeState?.cCompanyName ?? routeState?.CompanyName,
          ) || "Company Name",
        billNo: String(lastBillNumber ?? "").trim(),
        lastBillNumber: String(lastBillNumber ?? "").trim(),
        isEditMode: false,
        customerName: rowCustomerName,
        customerId: rowCustomerId,
        ticketNo: rowTicketNo || getFieldValue(row, ["TicketNo", "nTicketNo"]) || 0,
        nFollowupId: rowFollowupId,
        nFollowUpId: rowFollowupId,
        nWorksheetId: rowFollowupId,
        WorksheetId: rowFollowupId,
        nCompanyId: Number(billPayload?.nCompanyId ?? 0) || 0,
        contactPerson: rowCustomerName,
        contactNumber: rowCustomerPhone,
        email: rowCustomerEmail,
        summary: getCallSummary(row) || "-",
        partList,
        sessionPayload: {
          ...billPayload,
          nCompanyId: Number(billPayload?.nCompanyId ?? 0) || 0,
          nCustomerId: rowCustomerId,
          CustomerId: rowCustomerId,
          customerId: rowCustomerId,
          nTicketId: rowTicketNo || undefined,
          TicketId: rowTicketNo || undefined,
          ticketId: rowTicketNo || undefined,
          nFollowupId: rowFollowupId,
          nFollowUpId: rowFollowupId,
          nWorksheetId: rowFollowupId,
          WorksheetId: rowFollowupId,
        },
        callreportData,
        sourcePage: "callreports",
      };

      try {
        sessionStorage.setItem("ticket_portal_bill_preview_state", JSON.stringify(billPreviewState));
        sessionStorage.setItem("ticket_portal_callreport_view_state", JSON.stringify(callreportData));
      } catch {
        // Best effort only.
      }

      navigate("/billsandreceipts/bills/add", { state: billPreviewState });
    } catch (error: any) {
      console.error("Failed to open bill add page from customer report", error);
      // Keep the user on the report page if the supporting APIs fail.
      // The bill page can still be opened manually if needed.
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.title ||
          error?.message ||
          "Unable to open bill page",
      );
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, customerIdFromRoute]);

  const totalRows = filteredRows.length;

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalRows / pageSize));
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }, [currentPage, pageSize, totalRows]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, filteredRows]);

  const tableRows = useMemo(
    () =>
      paginatedRows.map((row, index) => ({
        raw: row,
        srl: (currentPage - 1) * pageSize + index + 1,
        callReportDate: formatDateValue(
          getFieldValue(row, ["dCallReportDate", "dCreatedDate", "cCallReportDate"]),
        ),
        callReportId: getCallReportId(row) || "-",
        ticketNo:
          formatDisplayValue(
            getFieldValue(row, ["nTicketNo", "TicketNo", "TicketNo.", "cTicketNo"]),
          ) || "-",
        callSummary:
          formatDisplayValue(
            getFieldValue(row, ["cTicketSummary", "cCallSummary", "Summary", "cViewSummary"]),
          ) || "-",
      })),
    [currentPage, pageSize, paginatedRows],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[18px] font-medium text-slate-900">Customer Call Reports</h1>

        <button
          type="button"
          aria-label="Close customer call reports"
          onClick={() => navigate(-1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <CloseOutlined />
        </button>
      </div>

      <div className="mt-3 rounded-md border border-sky-200 bg-[#eaf5ff] px-3 py-2 text-[13px] text-slate-700">
        <div className="grid grid-cols-[1.2fr_110px_130px_1.4fr] items-center gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <UserOutlined className="shrink-0 text-[16px] text-slate-900" />
            <span className="truncate font-semibold uppercase text-slate-900">
              {customerNameFromRoute}
            </span>
          </div>

          <div className="border-l border-sky-200 pl-4 text-center text-[13px] text-slate-700">
            ID : {customerIdFromRoute || "-"}
          </div>

          <div className="border-l border-sky-200 pl-4">
            <div className="flex min-w-0 items-center gap-2">
              <PhoneOutlined className="shrink-0 text-[16px] text-slate-900" />
              <span className="truncate">{customerPhoneFromRoute}</span>
            </div>
          </div>

          <div className="border-l border-sky-200 pl-4">
            <div className="flex min-w-0 items-center gap-2">
              <MailOutlined className="shrink-0 text-[16px] text-slate-900" />
              <span className="truncate">{customerEmailFromRoute}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="text-[14px] text-slate-700">Please select a ticket to bill.</div>

        <div className="w-full max-w-[320px]">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-500" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="h-[34px]"
          />
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-hidden">
        <Spin spinning={isLoading}>
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded border border-slate-200 bg-white">
            <div className="grid grid-cols-[48px_1.2fr_100px_80px_1.6fr] gap-1 border-b border-slate-200 px-4 py-3 text-[12px] font-medium text-slate-900">
              <div>Srl</div>
              <div>Call Report Date</div>
              <div>Call Report Id</div>
              <div>Ticket No.</div>
              <div>Ticket Summary</div>
            </div>

            <div className="min-h-[320px] flex-1 overflow-hidden p-0">
              {tableRows.length > 0 ? (
                <div className="call-report-scrollbar h-full max-h-[calc(100vh-310px)] overflow-y-auto overflow-x-hidden">
                  {tableRows.map((row) => (
                    <div
                      key={`${row.callReportId}-${row.srl}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        void handleRowClick(row.raw);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          void handleRowClick(row.raw);
                        }
                      }}
                      className="grid cursor-pointer grid-cols-[48px_1.2fr_100px_80px_1.6fr] gap-1 border-b border-slate-100 px-4 py-3 text-[12px] text-slate-700 hover:bg-sky-50"
                    >
                      <div>{row.srl}</div>
                      <div>{row.callReportDate}</div>
                      <div>{row.callReportId}</div>
                      <div>{row.ticketNo}</div>
                      <div className="truncate">{row.callSummary}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[220px] items-center justify-center">
                  <Empty description="No data" />
                </div>
              )}
            </div>
          </div>
        </Spin>

        {totalRows > 0 ? (
          <div className="mt-3 bg-white">
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

export default BillingCustomerCallReportPage;
