import closeblack from "../../assets/icons/close-black.svg";
import EngagementMode from "../../assets/icons/EngagementMode.svg";
import calender from "../../assets/icons/calender.svg";
import mail from "../../assets/icons/mail.svg";
import phone from "../../assets/icons/phone.svg";
import contact from "../../assets/icons/contact.svg";

type CallReportHistoryModalProps = {
  record?: Record<string, any> | null;
  onClose: () => void;
};

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
      value?.cCustomerName ??
      value?.label ??
      value?.title ??
      value?.text ??
      value?.value ??
      value?.cCustomerName ??
      value?.cTitle ??
      value?.cDescription ??
      ""
    );
  }
  return String(value);
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

const parseDateText = (value: any) => {
  const text = formatDisplayValue(value);
  if (!text) return "";
  const exact = text.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)?)?$/i,
  );
  if (!exact) return text.replace(/,\s*/, " ");
  const [, dd, mm, yyyy, hh, min = "00", meridiem] = exact;
  if (!hh) return `${dd}/${mm}/${yyyy}`;
  let hour = Number(hh);
  if (meridiem?.toUpperCase() === "PM" && hour < 12) hour += 12;
  if (meridiem?.toUpperCase() === "AM" && hour === 12) hour = 0;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${dd}/${mm}/${yyyy} ${String(displayHour).padStart(2, "0")}:${min} ${period}`;
};

const CallReportHistoryModal = ({ record, onClose }: CallReportHistoryModalProps) => {
  const source = record ?? {};
  const viewData = normalizeSingleRecord(source.data ?? source);
  const callreportSummary = normalizeSingleRecord(
    viewData.callreportSummary ??
      viewData.callReportSummary ??
      viewData.callreportsummary,
  );
  const ticketSummary = normalizeSingleRecord(
    viewData.ticketSummary ??
      viewData.TicketSummary,
  );
  const worksheetDetails = normalizeSingleRecord(
    viewData.worsheetDetails ??
      viewData.worksheetDetails ??
      viewData.workSheetDetails ??
      viewData.WorsheetDetails,
  );
  const agentName =
    formatDisplayValue(
      getFieldValue(worksheetDetails, ["cAgentName", "AgentName"]) ||
        getFieldValue(source, ["cAgentName", "AgentName"]),
    ) || "";
  const title =
    formatDisplayValue(
      getFieldValue(source, ["cHistorySummary", "HistorySummary"]) ||
        getFieldValue(ticketSummary, ["cViewSummary", "ViewSummary"]) ||
        getFieldValue(source, ["cViewSummary", "ViewSummary"]),
    ) ||
    (agentName ? `CallReport by ${agentName}` : "Call Report");
  const callReportId = formatDisplayValue(
    getFieldValue(callreportSummary, [
      "nFollowupId",
      "nFollowUpId",
      "nCallReportId",
      "CallReportId",
    ]) ||
      getFieldValue(source, [
      "nCallReportId",
      "CallReportId",
      "nFollowupId",
      "nFollowUpId",
      "nWorksheetId",
      "WorksheetId",
      "nId",
      "Id",
      "id",
    ]),
  );
  const status =
    formatDisplayValue(
      getFieldValue(ticketSummary, ["cTicketStatus", "TicketStatus"]) ||
        getFieldValue(source, ["cTicketStatus", "TicketStatus", "cStatus", "Status"]),
    ) || "Pending";
  const cCustomerName =
    formatDisplayValue(
      getFieldValue(ticketSummary, ["cCustomerName"]) ||
        getFieldValue(source, ["cCustomerName"]),
    ) || "-";
  const createdDate = parseDateText(
    getFieldValue(callreportSummary, ["dCreatedDate"]) ||
      getFieldValue(worksheetDetails, ["dCreatedDate"]) ||
      getFieldValue(source, [
        "historyCreatedDate",
        "dCreatedDate",
        "CreatedDate",
        "dSortDate",
        "SortDate",
      ]),
  );
  const summary =
    formatDisplayValue(
      getFieldValue(callreportSummary, ["cCallSummary"]) ||
        getFieldValue(worksheetDetails, ["cSummary", "cCallSummary"]) ||
        getFieldValue(source, [
        "cCallSummary",
        "CallSummary",
        "cSummary",
        "Summary",
        "cViewSummary",
        "ViewSummary",
      ]),
    ) || "-";
  const comment =
    formatDisplayValue(
      getFieldValue(worksheetDetails, ["cComment", "Comment"]) ||
        getFieldValue(callreportSummary, ["cComments", "cDescription"]) ||
        getFieldValue(source, [
        "cComment",
        "Comment",
        "cComments",
        "Comments",
        "cDescription",
        "Description",
      ]),
    ) || "-";

  const worksheetInfoRows = [
    {
       label: "Mode of Engagement",
      icon: EngagementMode,
      value:
        worksheetDetails.cCallMode ||
        worksheetDetails.CallMode ||
     
        "-",
    },
    {
      label: "Contact Person",
      icon: contact,
      value:
        formatDisplayValue(
          getFieldValue(worksheetDetails, ["cContactPerson", "ContactPerson"]) ||
            getFieldValue(source, ["cContactPerson", "ContactPerson"]),
        ) || "-",
    },
    {
      label: "Mobile No",
      icon: phone,
      value:
        formatDisplayValue(
          getFieldValue(worksheetDetails, ["cContactNumber", "ContactNumber", "cPhoneNo"]) ||
            getFieldValue(source, ["cContactNumber", "ContactNumber", "cPhoneNo"]),
        ) ||
        "-",
    },
    {
      label: "Email",
      icon: mail,
      value:
        formatDisplayValue(
          getFieldValue(worksheetDetails, ["cEmail", "Email"]) ||
            getFieldValue(source, ["cEmail", "Email"]),
        ) || "-",
    },
    {
      label: "Follow Up",
      icon: calender,
      value:
        parseDateText(
          getFieldValue(worksheetDetails, ["dNextFollowupDate", "NextFollowupDate"]) ||
            getFieldValue(callreportSummary, ["dFollowupDate", "FollowupDate"]) ||
            getFieldValue(source, [
              "dNextFollowupDate",
              "NextFollowupDate",
              "dFollowupDate",
              "FollowupDate",
            ]),
        ) || "-",
    },
    {
      label: "To Do",
      value:
        formatDisplayValue(
          getFieldValue(worksheetDetails, ["cToDo", "ToDo"]) ||
            getFieldValue(source, ["cToDo", "ToDo"]),
        ) || "-",
    },
  ];

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <div className="text-[18px] font-semibold text-slate-900">{title}</div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"
        >
          <img src={closeblack} alt="" className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-5 py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                <span>Call Report Id : {callReportId || "-"}</span>
                <span className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-normal text-sky-600">
                  {status}
                </span>
              </div>
              <div className="mt-1 text-[14px] font-medium text-slate-900">{cCustomerName}</div>
            </div>
            <div className="pt-1 text-[13px] text-slate-900">Call Report on {createdDate || "-"}</div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-4">
            <div className="text-[16px] font-semibold text-slate-900">Work Sheet</div>
            <div className="mt-3 space-y-1.5 text-[14px] text-slate-700">
              <div>
                <span className="text-slate-700">Summary : </span>
                <span className="text-slate-900">{summary}</span>
              </div>
              <div>
                <span className="text-sky-700">Comment : </span>
                <span className="text-slate-900">{comment}</span>
              </div>
            </div>

            <div className="mt-3 border-t border-slate-200 pt-3">
              <div className="grid gap-x-8 gap-y-2 md:grid-cols-3">
                {worksheetInfoRows.map((item) => (
                  <div key={item.label} className="min-w-0">
                    <div className="flex items-start gap-2 text-[13px] text-slate-700">
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                          {item.icon ? (
                            <img
                              src={item.icon}
                              alt=""
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden="true"
                            />
                          ) : null}
                          <span>
                            {item.label}
                            {" : "}
                          </span>
                        </span>
                        <span className="text-slate-500">{item.value || "-"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallReportHistoryModal;
