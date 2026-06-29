import { useMemo, useState } from "react";
import { Button, Spin } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { customerApis } from "../../Axios/MasterApis";
import { ticketApis } from "../../Axios/TicketsApi";
import { callReportApis } from "../../Axios/CallReportApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import { useGetCustomerDropDown } from "../Master/CustomerMaster/Hooks";
import shareIcon from "../../assets/icons/shareIcon.svg";
import closeblack from "../../assets/icons/close-black.svg";

const CALL_REPORT_VIEW_STORAGE_KEY = "ticket_portal_callreport_view_state";
const BILL_PREVIEW_STORAGE_KEY = "ticket_portal_bill_preview_state";

const normalizeSingleRecord = (value: any) => {
  if (Array.isArray(value)) return value[0] ?? {};
  if (value && typeof value === "object") return value;
  return {};
};

const formatDisplayValue = (value: any): string => {
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

const parseDateText = (value: any) => {
  const text = formatDisplayValue(value);
  if (!text) return "";
  const exact = text.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*([AP]M))?$/);
  if (!exact) return text;
  const [, dd, mm, yyyy, hh = "0", min = "0", meridiem] = exact;
  let hour = Number(hh);
  const minute = Number(min);
  if (meridiem?.toUpperCase() === "PM" && hour < 12) hour += 12;
  if (meridiem?.toUpperCase() === "AM" && hour === 12) hour = 0;
  const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd), hour, minute, 0, 0);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toLocaleString("en-GB");
};

const getFieldValue = (record: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null && record?.[key] !== "") {
      return record[key];
    }
  }
  const recordKey = Object.keys(record || {}).find((item) =>
    keys.some((key) => key.toLowerCase() === item.toLowerCase()),
  );
  return recordKey ? record?.[recordKey] : "";
};

const normalizeList = (response: any) => extractList(response);

const getCustomerViewRecord = (response: any) => {
  const candidates = [
    response?.data?.data,
    response?.data?.message,
    response?.data,
    response?.message,
    response?.result,
    response?.customer,
    response?.Customer,
    response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate[0] ?? {};
    if (Array.isArray(candidate?.data)) return candidate.data[0] ?? {};
    if (Array.isArray(candidate?.result)) return candidate.result[0] ?? {};
    if (candidate && typeof candidate === "object") return candidate;
  }

  return {};
};

const CallReportViewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as Record<string, any>;
  const [activeTab, setActiveTab] = useState<"callreport" | "details" | "history" | "bill">(
    "callreport",
  );

  const sessionPayload = useMemo(() => getRequestPayload(), []);

  const callReportId = Number(
    state.selectedRow?.nCallReportId ??
      state.selectedRow?.CallReportId ??
      state.selectedRow?.nFollowupId ??
      state.selectedRow?.nFollowUpId ??
      state.selectedRow?.nWorksheetId ??
      state.selectedRow?.WorksheetId ??
      state.nCallReportId ??
      state.nFollowupId ??
      0,
  );

  const requestPayload = useMemo(
    () => ({
      ...sessionPayload,
      nCompanyId: Number(sessionPayload.nCompanyId ?? state.nCompanyId ?? 0),
      cSchemaName: sessionPayload.cSchemaName ?? state.cSchemaName ?? "",
      cDbName: sessionPayload.cDbName ?? state.cDbName ?? "",
      nTicketId: Number(state.selectedRow?.nTicketId ?? state.ticketNo ?? 0),
      nFollowupId: callReportId,
      nFollowUpId: callReportId,
      nCallReportId: callReportId,
      CallReportId: callReportId,
    }),
    [callReportId, sessionPayload, state],
  );

  const customerDropdownPayload = useMemo(
    () => ({
      ...sessionPayload,
      pageNumber: 1,
      pageSize: 1000,
      nCompanyId: Number(requestPayload.nCompanyId ?? 0),
      cSchemaName: requestPayload.cSchemaName ?? "",
      cDbName: requestPayload.cDbName ?? "",
    }),
    [requestPayload.cDbName, requestPayload.cSchemaName, requestPayload.nCompanyId, sessionPayload],
  );

  const customerViewPayload = useMemo(
    () => ({
      ...sessionPayload,
      nCustomerId: Number(state.nCustomerId ?? state.customerId ?? state.selectedRow?.nCustomerId ?? 0),
      CustomerId: Number(state.nCustomerId ?? state.customerId ?? state.selectedRow?.nCustomerId ?? 0),
      customerId: Number(state.nCustomerId ?? state.customerId ?? state.selectedRow?.nCustomerId ?? 0),
      pageNumber: 1,
      pageSize: 1000,
      nCompanyId: Number(requestPayload.nCompanyId ?? 0),
      cSchemaName: requestPayload.cSchemaName ?? "",
      cDbName: requestPayload.cDbName ?? "",
    }),
    [
      requestPayload.cDbName,
      requestPayload.cSchemaName,
      requestPayload.nCompanyId,
      sessionPayload,
      state.nCustomerId,
      state.customerId,
      state.selectedRow,
    ],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["callreport-view", requestPayload],
    queryFn: () => ticketApis.callreportView(requestPayload),
    enabled:
      !!callReportId &&
      !!requestPayload.nCompanyId &&
      !!String(requestPayload.cSchemaName ?? "").trim() &&
      !!String(requestPayload.cDbName ?? "").trim(),
  });

  const { data: customerDropdownData } = useGetCustomerDropDown(customerDropdownPayload);

  const { data: customerViewData } = useQuery({
    queryKey: ["callreport-customer-view", customerViewPayload],
    queryFn: () => customerApis.customerView(customerViewPayload),
    enabled:
      !!Number(customerViewPayload.nCustomerId ?? 0) &&
      !!requestPayload.nCompanyId &&
      !!String(requestPayload.cSchemaName ?? "").trim() &&
      !!String(requestPayload.cDbName ?? "").trim(),
  });

  const { data: progressNoteData, isLoading: isProgressNoteLoading } = useQuery({
    queryKey: ["callreport-progress-notes", requestPayload],
    queryFn: () => callReportApis.callReportProgressNoteList(requestPayload),
    enabled:
      !!callReportId &&
      !!requestPayload.nCompanyId &&
      !!String(requestPayload.cSchemaName ?? "").trim() &&
      !!String(requestPayload.cDbName ?? "").trim(),
  });

  const viewData = data?.data?.data ?? data?.data ?? data ?? {};
  const progressNotes = useMemo(() => normalizeList(progressNoteData), [progressNoteData]);
  const customerOptions = useMemo(
    () =>
      normalizeList(customerDropdownData).map((item: any) => ({
        value: Number(
          getFieldValue(item, ["nCustomerId", "CustomerId", "customerId", "id", "value"]) || 0,
        ),
        label:
          formatDisplayValue(
            getFieldValue(item, ["cCustomerName", "CustomerName", "name", "label"]),
          ) || "Customer",
      })),
    [customerDropdownData],
  );
  const customerViewRecord = useMemo(
    () => getCustomerViewRecord(customerViewData),
    [customerViewData],
  );

  const callreportSummary = normalizeSingleRecord(
    viewData.callreportSummary ??
      viewData.callReportSummary ??
      viewData.callreportsummary ??
      viewData.data?.callreportSummary ??
      viewData.data?.callReportSummary,
  );
  const ticketSummary = normalizeSingleRecord(
    viewData.ticketSummary ??
      viewData.TicketSummary ??
      viewData.data?.ticketSummary ??
      viewData.data?.TicketSummary,
  );
  const billSummary = normalizeSingleRecord(
    viewData.billSummary ??
      viewData.BillSummary ??
      viewData.data?.billSummary ??
      viewData.data?.BillSummary,
  );
  const worksheetDetails = normalizeSingleRecord(
    viewData.worsheetDetails ??
      viewData.worksheetDetails ??
      viewData.workSheetDetails ??
      viewData.WorsheetDetails ??
      viewData.data?.worsheetDetails ??
      viewData.data?.worksheetDetails ??
      viewData.data?.workSheetDetails,
  );

  const companyName = ticketSummary.cViewSummary || state.companyName || "Call Report";
  const customerName =
    ticketSummary.cCustomerName ||
    ticketSummary.CustomerName ||
    customerViewRecord.cCustomerName ||
    customerViewRecord.CustomerName ||
    customerViewRecord.name ||
    state.customerName ||
    "-";
  const selectedCustomerId = Number(ticketSummary.nCustomerId ?? state.customerId ?? 0);
  const selectedCustomerOption =
    customerOptions.find((item) => item.value === selectedCustomerId) ?? customerOptions[0] ?? null;
  const customerLabel = selectedCustomerOption?.label || customerName || "-";
  const customerContactPerson =
    customerViewRecord.cContactPerson ||
    customerViewRecord.ContactPerson ||
    customerViewRecord.cName ||
    "";
  const customerMobile =
    customerViewRecord.cContactNumber ||
    customerViewRecord.ContactNumber ||
    customerViewRecord.cPhoneNo ||
    customerViewRecord.cMobile ||
    "";
  const customerEmail =
    customerViewRecord.cEmail ||
    customerViewRecord.Email ||
    "";
  const contactPerson =
    worksheetDetails.cContactPerson ||
    worksheetDetails.ContactPerson ||
    customerContactPerson ||
    state.contactPerson ||
    "-";
  const contactNumber =
    worksheetDetails.cContactNumber ||
    worksheetDetails.ContactNumber ||
    customerMobile ||
    state.contactNumber ||
    "-";
  const email =
    worksheetDetails.cEmail || worksheetDetails.Email || customerEmail || state.email || "-";
  const ticketNo = ticketSummary.nTicketNo || ticketSummary.nTicketId || state.ticketNo || "-";
  const billNo = billSummary.nBillNo || state.billNo || "-";
  const summary =
    callreportSummary.cCallSummary ||
    callreportSummary.cSummary ||
    worksheetDetails.cCallSummary ||
    state.summary ||
    "-";
  const description =
    worksheetDetails.cComment ||
    worksheetDetails.Comment ||
    callreportSummary.cComments ||
    state.description ||
    "-";
  const amount = billSummary.nTotalAmount ?? state.amount ?? 0;
  const billDate = parseDateText(billSummary.dBillDate || state.billDate || "");
  const callReportDate = parseDateText(
    callreportSummary.dCallReportDate ||
      callreportSummary.dCallreportDate ||
      viewData.dCallReportDate ||
      viewData.dCallreportDate ||
      state.dCallReportDate ||
      "",
  );

  const detailRows = [
    { label: "Call Report Id", value: callReportId || "-" },
    { label: "Ticket No.", value: ticketNo || "-" },
    { label: "Customer Name", value: customerLabel || "-" },
    { label: "Summary", value: summary || "-" },
    { label: "Comment", value: description || "-" },
  ];

  const worksheetInfoRows = [
    {
      label: "Mode of Engagement",
      value:
        worksheetDetails.cModeOfEngagement ||
        worksheetDetails.ModeOfEngagement ||
        callreportSummary.cFollowupMode ||
        callreportSummary.FollowupMode ||
        "-",
    },
    { label: "Contact Person", value: contactPerson },
    { label: "Mobile No", value: contactNumber },
    { label: "Email", value: email },
    {
      label: "Follow Up",
      value:
        parseDateText(
          worksheetDetails.dFollowUp ||
            worksheetDetails.dFollowupDate ||
            callreportSummary.dFollowUp ||
            callreportSummary.dFollowupDate ||
            "",
        ) || "-",
    },
    {
      label: "To Do",
      value:
        worksheetDetails.cToDo ||
        worksheetDetails.ToDo ||
        callreportSummary.cToDo ||
        callreportSummary.ToDo ||
        "-",
    },
  ];

  const handleGenerateBill = () => {
    try {
      sessionStorage.setItem(CALL_REPORT_VIEW_STORAGE_KEY, JSON.stringify(viewData));
      sessionStorage.setItem(
        BILL_PREVIEW_STORAGE_KEY,
        JSON.stringify({
          companyName,
          billNo,
          customerName,
          customerId: ticketSummary.nCustomerId,
          ticketNo: ticketSummary.nTicketId || ticketNo,
          nFollowupId: callReportId,
          nFollowUpId: callReportId,
          nWorksheetId: callReportId,
          WorksheetId: callReportId,
          nCompanyId: requestPayload.nCompanyId,
          contactPerson,
          contactNumber,
          email,
          summary,
          partList: extractList(worksheetDetails.partDetails ?? []),
          sessionPayload: requestPayload,
          callreportData: viewData,
        }),
      );
    } catch {
      // best effort only
    }

    navigate("/billsandreceipts/bills/add", {
      state: {
        companyName,
        billNo,
        customerName,
        customerId: ticketSummary.nCustomerId,
        ticketNo: ticketSummary.nTicketId || ticketNo,
        nFollowupId: callReportId,
        nFollowUpId: callReportId,
        nWorksheetId: callReportId,
        WorksheetId: callReportId,
        nCompanyId: requestPayload.nCompanyId,
        contactPerson,
        contactNumber,
        email,
        summary,
        partList: extractList(worksheetDetails.partDetails ?? []),
        sessionPayload: requestPayload,
        callreportData: viewData,
      },
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <div className="flex h-full min-h-0 w-full flex-col px-4 py-2">
        <div className="mx-auto flex h-full w-full max-w-[1320px] flex-col overflow-hidden">
          <div className="sticky top-0 z-30 shrink-0 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="text-[16px] font-semibold text-slate-900">{companyName}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
                  aria-label="Share call report"
                >
                  <img src={shareIcon} alt="" className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => navigate(-1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
                >
                  <img src={closeblack} alt="" className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex items-end border-t border-slate-200 bg-white">
              {[
                ["callreport", "Call Report"],
                ["details", "Ticket Details"],
                ["history", "Ticket History"],
                ["bill", "Bill"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key as any)}
                  className={`px-4 py-2.5 text-[15px] font-medium ${
                    activeTab === key
                      ? "bg-sky-500 text-white"
                      : "bg-white text-black hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="flex-1" />
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Spin spinning={isLoading}>
              <div className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-2">
                {activeTab === "callreport" ? (
                  <>
                    <div className="flex items-start justify-between px-3 pt-1">
                      <div>
                        <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                          <span>Call Report Id : {callReportId || "-"}</span>
                          <span className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-normal text-sky-600">
                            {ticketSummary.cTicketStatus || "Pending"}
                          </span>
                        </div>
                        <div className="mt-1 text-[14px] font-medium text-slate-900">
                          {customerLabel || "-"}
                        </div>
                      </div>
                      <div className="pt-1 text-[13px] text-slate-900">
                        Call Report on {callReportDate || "-"}
                      </div>
                    </div>

                    <div className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-3">
                      <div className="text-[16px] font-semibold text-slate-900">Work Sheet</div>
                      <div className="mt-3 space-y-1.5 text-[14px] text-slate-700">
                        <div>
                          <span className="text-slate-700">Summary : </span>
                          <span className="text-slate-900">{summary || "-"}</span>
                        </div>
                        <div>
                          <span className="text-slate-700">Comment : </span>
                          <span className="text-slate-900">{description || "-"}</span>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-slate-200 pt-3">
                        <div className="grid gap-x-8 gap-y-2 md:grid-cols-3">
                          {worksheetInfoRows.map((item) => (
                            <div key={item.label} className="min-w-0">
                              <div className="flex items-start gap-2 text-[13px] text-slate-700">
                                <div className="mt-0.5 text-slate-500">-</div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-slate-900">
                                    {item.label}
                                    {" : "}
                                  </span>
                                  <span className="text-slate-500">{item.value || "-"}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}

                {activeTab === "details" ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Ticket Details</div>
                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      <div className="grid grid-cols-[120px_1fr] gap-3">
                        <div className="text-slate-500">Ticket No.</div>
                        <div>{ticketNo || "-"}</div>
                      </div>
                      <div className="grid grid-cols-[120px_1fr] gap-3">
                        <div className="text-slate-500">Customer</div>
                        <div>{customerLabel || "-"}</div>
                      </div>
                      <div className="grid grid-cols-[120px_1fr] gap-3">
                        <div className="text-slate-500">Status</div>
                        <div>{ticketSummary.cTicketStatus || "-"}</div>
                      </div>
                      <div className="grid grid-cols-[120px_1fr] gap-3">
                        <div className="text-slate-500">Created Date</div>
                        <div>{parseDateText(ticketSummary.dCreatedDate || "") || "-"}</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeTab === "history" ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Progress Notes</div>
                    <div className="mt-4 space-y-3">
                      <Spin spinning={isProgressNoteLoading}>
                        {progressNotes.length > 0 ? (
                          progressNotes.slice(0, 5).map((note: any, index: number) => {
                            const noteDate = parseDateText(
                              getFieldValue(note, [
                                "dCreatedDate",
                                "CreatedDate",
                                "dNoteDate",
                                "NoteDate",
                                "dCreatedOn",
                              ]),
                            );
                            const noteTitle =
                              formatDisplayValue(
                                getFieldValue(note, [
                                  "cSummary",
                                  "Summary",
                                  "cProgressNote",
                                  "ProgressNote",
                                  "cNote",
                                  "Note",
                                ]),
                              ) || `Note ${index + 1}`;
                            const noteComment =
                              formatDisplayValue(
                                getFieldValue(note, [
                                  "cComments",
                                  "Comments",
                                  "cComment",
                                  "Comment",
                                  "cRemarks",
                                  "Remarks",
                                ]),
                              ) || "-";

                            return (
                              <div
                                key={`${noteTitle}-${index}`}
                                className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="font-medium text-slate-900">{noteTitle}</div>
                                  <div className="text-xs text-slate-500">{noteDate || "-"}</div>
                                </div>
                                <div className="mt-2 text-slate-700">{noteComment}</div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-sm text-slate-500">No progress notes found.</div>
                        )}
                      </Spin>
                    </div>
                  </div>
                ) : null}

                {activeTab === "bill" ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Bill Details</div>
                    <div className="mt-4 space-y-3 text-sm text-slate-700">
                      <div className="grid grid-cols-[120px_1fr] gap-3">
                        <div className="text-slate-500">Bill No</div>
                        <div>{billNo || "-"}</div>
                      </div>
                      <div className="grid grid-cols-[120px_1fr] gap-3">
                        <div className="text-slate-500">Date</div>
                        <div>{billDate || "-"}</div>
                      </div>
                      <div className="grid grid-cols-[120px_1fr] gap-3">
                        <div className="text-slate-500">Amount</div>
                        <div>Rs. {Number(amount || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="sticky bottom-3 z-20 flex justify-end pt-4 ">
                  <Button
                    type="primary"
                    className="!border-emerald-500 !bg-emerald-500 px-6"
                    onClick={handleGenerateBill}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </Spin>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallReportViewPage;
