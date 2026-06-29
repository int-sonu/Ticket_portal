import { Button, Input, message } from "antd";
import { CloseOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ticketApis } from "../../../Axios/TicketsApi";

const CALL_REPORT_VIEW_STORAGE_KEY = "ticket_portal_callreport_view_state";
const BILL_PREVIEW_STORAGE_KEY = "ticket_portal_bill_preview_state";

const normalizeSingleRecord = (value: any) => {
  if (Array.isArray(value)) {
    return value[0] ?? {};
  }

  if (value && typeof value === "object") {
    return value;
  }

  return {};
};

type ShareCallReportState = {
  nFollowupId?: string | number;
  nFollowUpId?: string | number;
  nCompanyId?: string | number;
  cSchemaName?: string;
  cDbName?: string;
  companyName?: string;
  customerName?: string;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  ticketNo?: string | number;
  billNo?: string | number;
  summary?: string;
  description?: string;
  amount?: number;
  billDate?: string;
};

const ShareCallReportView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as ShareCallReportState;
  const [loading, setLoading] = useState(false);
  const [apiState, setApiState] = useState<any>(null);

  const requestPayload = useMemo(
    () => ({
      nFollowupId: Number(state.nFollowupId ?? 0) || 0,
      nCompanyId: Number(state.nCompanyId ?? 0) || 0,
      cSchemaName: state.cSchemaName ?? "",
      cDbName: state.cDbName ?? "",
    }),
    [state.cDbName, state.cSchemaName, state.nCompanyId, state.nFollowupId],
  );

  useEffect(() => {
    if (!requestPayload.nFollowupId || !requestPayload.nCompanyId) {
      return;
    }

    let active = true;

    const loadView = async () => {
      setLoading(true);
      try {
        const response = await ticketApis.callreportView(requestPayload);
        const resolvedApiData = response?.data?.data ?? response?.data ?? response ?? null;
        try {
          sessionStorage.setItem(
            CALL_REPORT_VIEW_STORAGE_KEY,
            JSON.stringify(resolvedApiData),
          );
        } catch {
          // Best effort only.
        }
        if (active) {
          setApiState(resolvedApiData);
        }
      } catch (error: any) {
        console.error("Failed to load call report view", error);
        message.error(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load call report view",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadView();

    return () => {
      active = false;
    };
  }, [requestPayload]);

  const viewData = apiState ?? {};
  const callreportSummary = normalizeSingleRecord(
    viewData.callreportSummary ?? viewData.data?.callreportSummary,
  );
  const ticketSummary = normalizeSingleRecord(viewData.ticketSummary ?? viewData.data?.ticketSummary);
  const billSummary = normalizeSingleRecord(viewData.billSummary ?? viewData.data?.billSummary);
  const worksheetDetails = normalizeSingleRecord(
    viewData.worsheetDetails ?? viewData.data?.worsheetDetails,
  );

  const companyName =
    ticketSummary.cViewSummary ||
    state.companyName ||
    "New Company Pvt ltd edit";
  const customerName =
    ticketSummary.cCustomerName || state.customerName || "Assetcus";
  const contactPerson =
    worksheetDetails.cContactPerson || state.contactPerson || "jeslin marian";
  const contactNumber =
    worksheetDetails.cContactNumber || state.contactNumber || "7356496403";
  const email =
    worksheetDetails.cEmail || state.email || "jeslin.ortezinfotech@gmail.com";
  const ticketNo =
    ticketSummary.nTicketId ||
    ticketSummary.nTicketNo ||
    state.ticketNo ||
    130;
  const billNo = billSummary.nBillNo || state.billNo || 54;
  const summary = callreportSummary.cCallSummary || state.summary || "abc";
  const description = worksheetDetails.cComment || state.description || "abc";
  const amount = billSummary.nTotalAmount ?? state.amount ?? 222;
  const billDate = billSummary.dBillDate || state.billDate || "27/06/2026 15:20 PM";

  const handleGenerateBill = () => {
    const resolvedCallReportSummary = callreportSummary;
    const resolvedFollowupId =
      Number(
        resolvedCallReportSummary.nFollowupId ??
          resolvedCallReportSummary.nFollowUpId ??
          resolvedCallReportSummary.nWorksheetId ??
          resolvedCallReportSummary.WorksheetId ??
          viewData.nFollowupId ??
          viewData.nfollowupid ??
          viewData.nFollowUpId ??
          viewData.nWorksheetId ??
          viewData.nworksheetid ??
          viewData.WorksheetId ??
          viewData.data?.callreportSummary?.nFollowupId ??
          viewData.data?.callreportSummary?.nFollowUpId ??
          viewData.data?.callreportSummary?.nWorksheetId ??
          viewData.data?.callreportSummary?.WorksheetId ??
          requestPayload.nFollowupId ??
          0,
      ) || 0;

    try {
      sessionStorage.removeItem(BILL_PREVIEW_STORAGE_KEY);
      sessionStorage.setItem(
        CALL_REPORT_VIEW_STORAGE_KEY,
        JSON.stringify(viewData),
      );
      sessionStorage.setItem(
        BILL_PREVIEW_STORAGE_KEY,
        JSON.stringify({
          companyName,
          billNo,
          customerName,
          customerId: ticketSummary.nCustomerId,
          ticketNo: ticketSummary.nTicketId || ticketNo,
          nFollowupId: resolvedFollowupId,
          nFollowUpId: resolvedFollowupId,
          nWorksheetId: resolvedFollowupId,
          WorksheetId: resolvedFollowupId,
          nCompanyId: requestPayload.nCompanyId,
          contactPerson,
          contactNumber,
          email,
          summary,
          partList: worksheetDetails.partDetails ?? [],
          sessionPayload: {
            nCompanyId: requestPayload.nCompanyId,
            cSchemaName: requestPayload.cSchemaName,
            cDbName: requestPayload.cDbName,
            nFollowupId: resolvedFollowupId,
            nFollowUpId: resolvedFollowupId,
            nTicketId: ticketSummary.nTicketId || ticketNo,
            nCustomerId: ticketSummary.nCustomerId,
            nAssetId: 0,
          },
          callreportData: viewData,
        }),
      );
    } catch {
      // Best effort only.
    }

    navigate("/billsandreceipts/bills/add", {
      state: {
        companyName,
        billNo,
        customerName,
        customerId: ticketSummary.nCustomerId,
        ticketNo: ticketSummary.nTicketId || ticketNo,
        nFollowupId: resolvedFollowupId,
        nFollowUpId: resolvedFollowupId,
        nWorksheetId: resolvedFollowupId,
        WorksheetId: resolvedFollowupId,
        nCompanyId: requestPayload.nCompanyId,
        contactPerson,
        contactNumber,
        email,
        summary,
        partList: worksheetDetails.partDetails ?? [],
        sessionPayload: {
          nCompanyId: requestPayload.nCompanyId,
          cSchemaName: requestPayload.cSchemaName,
          cDbName: requestPayload.cDbName,
          nFollowupId: resolvedFollowupId,
          nFollowUpId: resolvedFollowupId,
          nTicketId: ticketSummary.nTicketId || ticketNo,
          nCustomerId: ticketSummary.nCustomerId,
          nAssetId: 0,
        },
        callreportData: viewData,
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
          <div className="flex items-center gap-2 text-[15px] font-medium text-slate-900">
            <span>{companyName}</span>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={() => navigate(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-800 transition hover:bg-slate-100"
          >
            <CloseOutlined />
          </button>
        </div>

        <div className="px-6 pb-6 pt-3">
          <div className="mx-auto max-w-[1120px]">
            <div className="text-center text-[18px] font-medium text-slate-800">
              {companyName}
            </div>
            {loading ? (
              <div className="mt-6 text-center text-sm text-slate-500">
                Loading call report...
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-4 border-b border-slate-200 pb-3 text-[13px] text-slate-700">
              <div>
                <span className="text-slate-500">Customer Name</span>{" "}
                <span className="font-medium">{customerName}</span>
              </div>
              <div>
                <span className="text-slate-500">Contact Person Name</span>{" "}
                <span className="font-medium">{contactPerson}</span>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <span className="inline-flex items-center gap-1">
                  <PhoneOutlined /> {contactNumber}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MailOutlined /> {email}
                </span>
              </div>
            </div>

            <div className="pt-4">
              <div className="text-[18px] font-medium text-slate-900">Call Report Details</div>
              <div className="mt-3 space-y-1 text-[13px] text-slate-700">
                <div>
                  <span className="text-sky-700">Call Report Id :</span> {ticketNo}
                </div>
                <div>
                  <span className="text-slate-500">Summary :</span> {summary}
                </div>
                <div>
                  <span className="text-slate-500">Description :</span> {description}
                </div>
              </div>
            </div>

            <div className="mt-10">
              <div className="text-[18px] font-medium text-slate-900">Bill Details</div>
              <div className="mt-3 grid gap-2 text-[13px] text-slate-700">
                <div className="grid grid-cols-[120px_1fr]">
                  <span className="text-slate-500">Bill No</span>
                  <span>{billNo}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr]">
                  <span className="text-slate-500">Date and Time</span>
                  <span>{billDate}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr]">
                  <span className="text-slate-500">Amount</span>
                  <span>₹{Number(amount || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-2 text-[13px] text-slate-700">Comments</div>
                <Input.TextArea rows={5} placeholder="Enter comments" />
              </div>

              <div className="mt-4 flex items-end justify-end">
                <div className="flex flex-col items-end gap-3">
                  <div className="text-[13px] text-slate-700">Signature</div>
                  <Button
                    type="primary"
                    className="!bg-emerald-500 !border-emerald-500 px-6"
                    onClick={handleGenerateBill}
                  >
                    Generate Bill
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareCallReportView;
