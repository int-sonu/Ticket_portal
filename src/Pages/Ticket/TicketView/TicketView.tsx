import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useTicketView } from "../../../Hooks/Ticket/useTicketQueries";
import { getRequestPayload } from "../../../Utils/requestPayload";
import { extractList } from "../../Master/Common/SimpleMasterUtils";
import QuickCallReportModal from "../Common/QuickCallReportModal";
import TicketPageShell from "../Common/TicketPageShell";
import TicketOverviewSection from "./TicketOverviewSection";
import shareIcon from "../../../assets/icons/shareIcon.svg";
import closeblack from "../../../assets/icons/close-black.svg";
type TicketViewState = {
  selectedRow?: Record<string, any> | null;
  quickCallTicketValues?: Record<string, any> | null;
  assignedAgentDetails?: any[];
  openQuickCall?: boolean;
};

const getFieldValue = (record: any, keys: string[]) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null) {
      return record[key];
    }
  }

  const recordKey = Object.keys(record || {}).find((item) =>
    keys.some((key) => key.toLowerCase() === item.toLowerCase())
  );

  if (!recordKey) return "";

  return record?.[recordKey] ?? "";
};

const formatDisplayValue = (value: any): string => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (Array.isArray(value)) {
    return value
      .map((item) => formatDisplayValue(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return (
      value?.name ??
      value?.label ??
      value?.Label ??
      value?.title ??
      value?.Title ??
      value?.text ??
      value?.Text ??
      value?.value ??
      value?.Value ??
      value?.cName ??
      value?.cTitle ??
      value?.cDescription ??
     
      ""
    );
  }

  return String(value);
};

const parseTicketDate = (value: any): number | null => {
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }

  if (typeof value !== "string") return null;

  const text = value.trim();
  if (!text) return null;

  const dmYTimeMatch = text.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*([AP]M))?)?$/i
  );

  if (dmYTimeMatch) {
    const [, dd, mm, yyyy, hh = "0", min = "0", meridiem] = dmYTimeMatch;
    let hour = Number(hh);
    const minute = Number(min);

    if (meridiem) {
      const upper = meridiem.toUpperCase();
      if (upper === "PM" && hour < 12) hour += 12;
      if (upper === "AM" && hour === 12) hour = 0;
    }

    const parsed = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      hour,
      minute,
      0,
      0
    );
    const ms = parsed.getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  const fallback = Date.parse(text);
  return Number.isNaN(fallback) ? null : fallback;
};

const formatTicketAge = (createdDate: any, nowMs = Date.now()): string => {
  const createdMs = parseTicketDate(createdDate);

  if (createdMs === null) return "";

  const diffMs = Math.max(nowMs - createdMs, 0);
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return `${days} day${days === 1 ? "" : "s"} ${hours} hr ${minutes} min`;
};

const getTicketStatusValue = (record: any) =>
  getFieldValue(record, [
    "Status",
    "StatusName",
    "cStatus",
    "cStatusName",
    "TicketStatus",
    "TicketStatusName",
    "cTicketStatus",
    "cTicketStatusName",
    "cTicketStatusDesc",
    "cDescription",
    "TicketStatusDesc",
    "cStatusDesc",
    "StatusDesc",
    "cViewSummary",
    "cStatusDescription",
    "StatusDescription",
    "TicketStatusDescription",
    "StatusValue",
    "nStatus",
    "nTicketStatus",
    "nStatusId",
    "cStatusId",
    "cTicketStatusId",
    "cCurrentStatus",
    "cCurrentStatusName",
    "cCallStatus",
    "cCallStatusName",
    "status",
  ]) ||
  getFieldValue(record?.status, [
    "name",
    "Name",
    "statusName",
    "StatusName",
    "cStatusName",
    "cDescription",
    "cTicketStatusName",
    "cTicketStatus",
    "cTicketStatusDesc",
    "StatusDesc",
    "cViewSummary",
    "StatusDescription",
    "TicketStatusDescription",
    "value",
    "label",
  ]) ||
  getFieldValue(record?.ticketStatus, [
    "name",
    "Name",
    "statusName",
    "StatusName",
    "cStatusName",
    "cTicketStatusName",
    "cTicketStatus",
    "cTicketStatusDesc",
    "cDescription",
    "StatusDesc",
    "StatusDescription",
    "TicketStatusDescription",
    "value",
    "label",
  ]) ||
  getFieldValue(record?.Status, [
    "name",
    "Name",
    "statusName",
    "StatusName",
    "cStatusName",
    "cTicketStatusName",
    "cTicketStatus",
    "cTicketStatusDesc",
    "StatusDesc",
    "cDescription",
    "StatusDescription",
    "TicketStatusDescription",
    "value",
    "label",
  ]);

const normalizeTicketStatus = (record: any): string => {
  const statusValue = getTicketStatusValue(record);
  const statusText = formatDisplayValue(statusValue).trim();

  if (!statusText) return "";

  const lowered = statusText.toLowerCase();
  const fieldNameMarkers = [
    "cticketstatus",
    "ticketstatus",
    "statusname",
    "cstatus",
    "status",
  ];

  if (fieldNameMarkers.includes(lowered)) {
    return "";
  }

  return statusText;
};

const pickRecord = (response: any) => {
  const rows = extractList(response);

  if (rows.length > 0) return rows[0];
  if (response?.Data && !Array.isArray(response.Data)) return response.Data;
  if (response?.data && !Array.isArray(response.data)) return response.data;

  return response ?? {};
};

const pickAttachments = (record: any) => {
  const candidates = [
    record?.Attachments,
    record?.TicketAttachments,
    record?.Files,
    record?.FileList,
    record?.AttachmentList,
    record?.HistoryAttachments,
    record?.Images,
    record?.ImageList,
    record?.Photos,
    record?.PhotoList,
    record?.data?.Attachments,
    record?.data?.TicketAttachments,
    record?.data?.Files,
    record?.data?.FileList,
    record?.data?.Images,
    record?.data?.ImageList,
    record?.data?.Photos,
    record?.data?.PhotoList,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }

  return [];
};

const pickAssignedAgents = (record: any) => {
  const raw = [
    record?.cAssignedId,
    record?.assignedAgentDetails,
    record?.AssignedAgentDetails,
    record?.assignedAgents,
    record?.AssignedAgents,
    record?.AssignToAgent,
    record?.assignToAgent,
    record?.AgentId,
    record?.agentId,
    record?.nAgentId,
  ].find((value) => value !== undefined && value !== null && value !== "");

  if (Array.isArray(raw)) {
    return raw
      .map((agent: any) => ({
        nAgentId: Number(
          agent?.nAgentId ??
            agent?.agentId ??
            agent?.id ??
            agent?.value ??
            agent ??
            0
        ),
        nRole: Number(agent?.nRole ?? 0),
      }))
      .filter((agent: any) => agent.nAgentId > 0);
  }

  const parsed = typeof raw === "string" ? Number(raw) : Number(raw ?? 0);
  return parsed > 0 ? [{ nAgentId: parsed, nRole: 0 }] : [];
};

const TicketView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const state = (location.state as TicketViewState | null) ?? {};
  const selectedRow = state.selectedRow ?? {};
  const [activeTab, setActiveTab] = useState<"details" | "history" | "files">(
    "details"
  );
  const [quickCallOpen, setQuickCallOpen] = useState(
    Boolean(state.openQuickCall)
  );
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const ticketId = Number(
    params.id ??
      selectedRow?.nTicketId ??
      selectedRow?.TicketId ??
      selectedRow?.ticketId ??
      0
  );

  useEffect(() => {
    setActiveTab(state.openQuickCall ? "history" : "details");
  }, [state.openQuickCall, ticketId]);

  const payload = useMemo(
    () => ({
      ...getRequestPayload(),
      TicketId: ticketId,
      nTicketId: ticketId,
    }),
    [ticketId]
  );

  const { data, isLoading } = useTicketView(payload, !!ticketId);

  const ticketData = useMemo(() => pickRecord(data), [data]);
  const resolvedRecord = useMemo(
    () => ({
      ...(selectedRow || {}),
      ...(ticketData || {}),
    }),
    [selectedRow, ticketData]
  );
  const attachments = useMemo(() => pickAttachments(resolvedRecord), [resolvedRecord]);
  const assignedAgentDetails = useMemo(
    () => state.assignedAgentDetails ?? pickAssignedAgents(resolvedRecord),
    [resolvedRecord, state.assignedAgentDetails]
  );

  const ticketNo = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "TicketNo",
      "cTicketNo",
      "TicketNumber",
      "cTicketNumber",
      "nTicketNo",
    ])
  );
  const customerName = formatDisplayValue(
    getFieldValue(resolvedRecord, ["CustomerName", "cCustomerName", "Customer"])
  );
  const summary = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "TicketSummary",
      "cTicketSummary",
      "Summary",
      "cSummary",
      "ViewSummary",
      "cViewSummary",
    ])
  );
  const description = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "cDescription",
      "Description",
      "TicketDescription",
      "cTicketDescription",
      "DescriptionText",
    ])
  );
  const createdDateValue = getFieldValue(resolvedRecord, [
    "CreatedDate",
    "CreatedDateTime",
    "CreatedOn",
    "dCreatedDate",
    "dCreatedOn",
    "cDate",
  ]);
  const createdDate = formatDisplayValue(createdDateValue);
  const ticketAge = formatTicketAge(createdDateValue || createdDate, tick);
  const priority = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "Priority",
      "PriorityName",
      "cPriority",
      "cPriorityName",
    ])
  );
  const status = normalizeTicketStatus(resolvedRecord);
  const followupDate = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "FollowupDate",
      "dFollowupDate",
      "FollowUpDate",
      "dFollowUpDate",
    ])
  );
  const source = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "SourceName",
      "cSourceName",
      "TicketSource",
      "cTicketSource",
    ])
  );
  const group = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "GroupName",
      "cGroupName",
      "TicketGroup",
      "cTicketGroup",
    ])
  );
  const serviceType = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "ServiceTypeName",
      "cServiceTypeName",
      "ServiceType",
      "cServiceType",
    ])
  );
  const address = formatDisplayValue(
    getFieldValue(resolvedRecord, ["Address", "cCustomerAddress"])
  );
  const assetName = formatDisplayValue(
    getFieldValue(resolvedRecord, ["AssetName", "cAssetName", "Asset"])
  );
  const contactNumber = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "cContactNumber",
      "ContactNumber",
      "PhoneNumber",
    ])
  );
  const email = formatDisplayValue(getFieldValue(resolvedRecord, ["cEmail", "Email"]));

  return (
    <TicketPageShell>
      <div className="relative w-full rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-end gap-3 px-2 pt-0.5">
          <button
            type="button"
            aria-label="Share"
            className="rounded-full p-1 text-slate-700 hover:bg-slate-100"
          >
            <img src={shareIcon} alt="" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Close"
            className="rounded-full px-2 py-1 text-2xl leading-none text-slate-900 hover:bg-slate-100"
          >
            <img src={closeblack} alt="" className="h-4 w-4" />
          </button>
        </div>

        <TicketOverviewSection
          ticketId={ticketId}
          isLoading={isLoading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ticketNo={ticketNo}
          customerName={customerName}
          summary={summary}
          description={description}
          createdDate={createdDate}
          priority={priority}
          status={status}
          ticketAge={ticketAge}
          followupDate={followupDate}
          address={address}
          assetName={assetName}
          source={source}
          serviceType={serviceType}
          group={group}
          contactNumber={contactNumber}
          email={email}
          attachments={attachments}
        />
        <QuickCallReportModal
          open={quickCallOpen}
          onClose={() => setQuickCallOpen(false)}
          ticketId={ticketId}
          ticketValues={resolvedRecord}
          selectedCustomerName={customerName}
          sessionPayload={getRequestPayload()}
          assignedAgentDetails={assignedAgentDetails}
        />
      </div>
    </TicketPageShell>
  );
};

export default TicketView;
