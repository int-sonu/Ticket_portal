import { useEffect, useMemo, useState } from "react";
import { Button, message } from "antd";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  useRepairItemActivityList,
  useTicketView,
} from "../../../Hooks/Ticket/useTicketQueries";
import { getApiImageBaseUrl } from "../../../Axios/config";
import { getRequestPayload } from "../../../Utils/requestPayload";
import { extractList } from "../../Master/Common/SimpleMasterUtils";
import QuickCallReportModal from "../Common/QuickCallReportModal";
import TicketPageShell from "../Common/TicketPageShell";
import TicketOverviewSection from "./TicketOverviewSection";
import shareIcon from "../../../assets/icons/shareIcon.svg";
import closeblack from "../../../assets/icons/close-black.svg";
import EstimateIcon from "../../../assets/icons/EstimateIcon.svg";
import transferIcon from "../../../assets/icons/transferIcon.svg";
import postponeIcon from "../../../assets/icons/postponeIcon.svg";
import sendIcon from "../../../assets/icons/sendIcon.svg";
import mergeIcon from "../../../assets/icons/mergeIcon.svg";
import { useGetAssignAgentList } from "../../Master/Agent/Hooks";
import {
  useGetCustomerAlternativeContacts,
  useGetCustomerAssetDepartments,
  useGetCustomerBrandOptions,
  useGetCustomerWiseAssets,
} from "../../Master/CustomerMaster/Hooks";
import TransferTicketModal from "../Common/TransferTicketModal";
import ShareTicketModal from "../Common/ShareTicketModal";
import FollowupModal from "../Common/FollowupModal";
type TicketViewState = {
  selectedRow?: Record<string, any> | null;
  quickCallTicketValues?: Record<string, any> | null;
  assignedAgentDetails?: any[];
  openQuickCall?: boolean;
  isFrom?: string;
};

const getFieldValue = (record: any, keys: string[]) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null) {
      return record[key];
    }
  }

  const recordKey = Object.keys(record || {}).find((item) =>
    keys.some((key) => key.toLowerCase() === item.toLowerCase()),
  );

  if (!recordKey) return "";

  return record?.[recordKey] ?? "";
};

const formatDisplayValue = (value: any): string => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
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
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*([AP]M))?)?$/i,
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
      0,
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

  const dataObj = response?.Data ?? response?.data ?? response;

  if (dataObj && typeof dataObj === "object" && !Array.isArray(dataObj)) {
    // Handle both TicketSummary (object) and ticketSummary (array)
    const summaryObj =
      dataObj.TicketSummary ??
      (Array.isArray(dataObj.ticketSummary)
        ? dataObj.ticketSummary[0]
        : dataObj.ticketSummary) ??
      null;

    if (summaryObj) {
      return {
        ...summaryObj, // cDescription, cTicketSummary, etc. from summary
        ...dataObj, // root fields overwrite (nCustomerId, attachments, etc.)
      };
    }
    return dataObj;
  }

  return response ?? {};
};

/** Resolve a potentially-relative image path to a full URL */
const resolveImageUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  try {
    const base = getApiImageBaseUrl().replace(/\/$/, "");
    return `${base}/${path.replace(/^\//, "")}`;
  } catch {
    return path;
  }
};

const pickAttachments = (record: any) => {
  // API returns lowercase 'attachments' — add both cases
  const candidates = [
    record?.attachments,
    record?.Attachments,
    record?.TicketAttachments,
    record?.ticketAttachments,
    record?.Files,
    record?.files,
    record?.FileList,
    record?.fileList,
    record?.AttachmentList,
    record?.attachmentList,
    record?.Images,
    record?.images,
    record?.ImageList,
    record?.imageList,
    record?.Photos,
    record?.photos,
    record?.data?.attachments,
    record?.data?.Attachments,
    record?.data?.Files,
    record?.data?.files,
    record?.data?.Images,
    record?.data?.images,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      // Resolve relative URLs for each attachment
      return candidate.map((file: any) => ({
        ...file,
        cUrl: resolveImageUrl(
          file?.cUrl ?? file?.cFilePath ?? file?.url ?? file?.path ?? "",
        ),
      }));
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
            0,
        ),
        nRole: Number(agent?.nRole ?? 0),
      }))
      .filter((agent: any) => agent.nAgentId > 0);
  }

  const parsed = typeof raw === "string" ? Number(raw) : Number(raw ?? 0);
  return parsed > 0 ? [{ nAgentId: parsed, nRole: 0 }] : [];
};

const buildFollowupDetailRows = (record: any) => {
  const rows = [
    {
      label: "Followup Mode",
      value: formatDisplayValue(
        getFieldValue(record, [
          "FollowupMode",
          "cFollowupMode",
          "CallReportMode",
          "cCallReportMode",
          "ModeName",
          "cModeName",
        ]),
      ),
    },
    {
      label: "Followup Remarks",
      value: formatDisplayValue(
        getFieldValue(record, [
          "Remarks",
          "Remark",
          "FollowupRemarks",
          "cFollowupRemarks",
          "CallRemarks",
          "cCallRemarks",
          "CallSummary",
          "cCallSummary",
        ]),
      ),
    },
    {
      label: "Next Follow Up",
      value: formatDisplayValue(
        getFieldValue(record, [
          "NextFollowupDate",
          "dNextFollowupDate",
          "NextFollowUpDate",
          "dNextFollowUpDate",
          "UpcomingFollowupDate",
          "dUpcomingFollowupDate",
        ]),
      ),
    },
    {
      label: "Followup Status",
      value: formatDisplayValue(
        getFieldValue(record, [
          "FollowupStatus",
          "cFollowupStatus",
          "CallStatus",
          "cCallStatus",
          "Status",
          "cStatus",
        ]),
      ),
    },
  ];

  return rows.filter((item) => String(item.value ?? "").trim());
};

const TicketView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const state = (location.state as TicketViewState | null) ?? {};
  const selectedRow = state.selectedRow ?? {};
  const isFollowupPage = location.pathname
    .toLowerCase()
    .includes("/tickets/followup/");
  const isFromCustomer = state.isFrom === "customerView";
  const showFilesTab = state.isFrom !== "ongoing";
  const pageHeading =
    state.isFrom === "ongoing"
      ? "Ongoing"
      : isFollowupPage
        ? "Follow Up"
        : "Ticket";

  const showFollowupAction = isFollowupPage && isFromCustomer;
  const [activeTab, setActiveTab] = useState<"details" | "history" | "files">(
    "details",
  );
  const [quickCallOpen, setQuickCallOpen] = useState(
    Boolean(state.openQuickCall),
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    if (!showFilesTab && activeTab === "files") {
      setActiveTab("details");
    }
  }, [activeTab, showFilesTab]);

  useEffect(() => {
    const id = window.setInterval(() => setTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const ticketId = Number(
    params.id ??
      selectedRow?.nTicketId ??
      selectedRow?.TicketId ??
      selectedRow?.ticketId ??
      0,
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
    [ticketId],
  );

  const { data, isLoading } = useTicketView(payload, !!ticketId);

  const ticketData = useMemo(() => pickRecord(data), [data]);
  const resolvedRecord = useMemo(
    () => ({
      ...(selectedRow || {}),
      ...(ticketData || {}),
    }),
    [selectedRow, ticketData],
  );
  const supportSessionPayload = useMemo(() => getRequestPayload(), []);
  const customerId = Number(
    getFieldValue(resolvedRecord, [
      "nCustomerId",
      "CustomerId",
      "customerId",
    ]) || 0,
  );
  const groupId = Number(
    getFieldValue(resolvedRecord, ["nGroupId", "GroupId", "groupId"]) || 0,
  );
  const customerSupportPayload = useMemo(
    () => ({
      ...supportSessionPayload,
      nCustomerId: customerId,
      CustomerId: customerId,
      customerId,
    }),
    [customerId, supportSessionPayload],
  );
  const assignAgentPayload = useMemo(
    () => ({
      ...supportSessionPayload,
      nGroupId: groupId,
      dDate: new Date().toISOString().slice(0, 10).replaceAll("-", "/"),
    }),
    [groupId, supportSessionPayload],
  );
  const repairItemPayload = useMemo(
    () => ({
      ...supportSessionPayload,
      nTicketId: ticketId,
      TicketId: ticketId,
      nCustomerId: customerId,
      CustomerId: customerId,
    }),
    [customerId, supportSessionPayload, ticketId],
  );

  useGetCustomerAssetDepartments(supportSessionPayload);
  useGetCustomerBrandOptions(supportSessionPayload);
  useGetCustomerWiseAssets(customerSupportPayload, !!customerId);
  const { data: alternativeContactsData } = useGetCustomerAlternativeContacts(
    customerSupportPayload,
    !!customerId,
  );
  useGetAssignAgentList(assignAgentPayload, !!groupId);
  useRepairItemActivityList(repairItemPayload, !!ticketId);

  const attachments = useMemo(
    () => pickAttachments(resolvedRecord),
    [resolvedRecord],
  );
  const alternativeContacts = useMemo(
    () => extractList(alternativeContactsData),
    [alternativeContactsData],
  );
  const assignedAgentDetails = useMemo(
    () => state.assignedAgentDetails ?? pickAssignedAgents(resolvedRecord),
    [resolvedRecord, state.assignedAgentDetails],
  );

  const ticketNo = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "TicketNo",
      "cTicketNo",
      "TicketNumber",
      "cTicketNumber",
      "nTicketNo",
    ]),
  );
  const customerName = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "CustomerName",
      "cCustomerName",
      "Customer",
    ]),
  );
  const summary = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "TicketSummary",
      "cTicketSummary",
      "Summary",
      "cSummary",
      "ViewSummary",
      "cViewSummary",
    ]),
  );
  const description = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "cDescription",
      "Description",
      "TicketDescription",
      "cTicketDescription",
      "DescriptionText",
    ]),
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
    ]),
  );
  const status = normalizeTicketStatus(resolvedRecord);
  const followupDate = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "FollowupDate",
      "dFollowupDate",
      "FollowUpDate",
      "dFollowUpDate",
    ]),
  );
  const source = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "SourceName",
      "cSourceName",
      "TicketSource",
      "cTicketSource",
    ]),
  );
  const group = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "GroupName",
      "cGroupName",
      "TicketGroup",
      "cTicketGroup",
    ]),
  );
  const serviceType = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "ServiceTypeName",
      "cServiceTypeName",
      "ServiceType",
      "cServiceType",
    ]),
  );
  const address = formatDisplayValue(
    getFieldValue(resolvedRecord, ["Address", "cCustomerAddress"]),
  );
  const assetName = formatDisplayValue(
    getFieldValue(resolvedRecord, ["AssetName", "cAssetName", "Asset"]),
  );
  const contactNumber = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "cContactNumber",
      "ContactNumber",
      "PhoneNumber",
    ]),
  );
  const email = formatDisplayValue(
    getFieldValue(resolvedRecord, ["cEmail", "Email"]),
  );
  const createdByTeam = formatDisplayValue(
    getFieldValue(resolvedRecord, [
      "TeamName",
      "cTeamName",
      "CreatedByTeam",
      "cCreatedByTeam",
      "GroupName",
      "cGroupName",
    ]),
  );
  const detailRows = useMemo(
    () => (isFollowupPage ? buildFollowupDetailRows(resolvedRecord) : []),
    [isFollowupPage, resolvedRecord],
  );

  return (
    <TicketPageShell contentClassName="p-4 relative flex h-full min-h-0 flex-col overflow-hidden">
      {/* absolute inset-4 forces this div to fill the padded area exactly, without expanding */}
      {/* <div className="absolute inset-4 flex flex-col overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white"> */}
      <div className="px-2 pb-1 text-xl font-medium text-slate-900">
        {pageHeading}
      </div>
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

      {/* flex-1 min-h-0 lets the section grow AND enables internal overflow-y:auto */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
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
          createdByTeam={createdByTeam}
          alternativeContacts={alternativeContacts}
          showFilesTab={showFilesTab}
          showFilesInDetails={showFilesTab}
          extraRows={detailRows}
          showFollowUpAction={showFollowupAction}
          onFollowUpClick={() => {
            navigate("/tickets/create", {
              state: {
                followupSourceTicket: {
                  nTicketId: ticketId,
                  cViewSummary: summary || description || "Follow up ticket",
                  summary: summary,
                  description: description,
                },
                draftValues: {
                  CustomerId: getFieldValue(resolvedRecord, [
                    "nCustomerId",
                    "CustomerId",
                    "customerId",
                  ]),
                  ContactNo: contactNumber,
                  Email: email,
                  IssueSummary: summary || description || "Follow up ticket",
                  Description: description || summary || "",
                  Priority: priority || "Low",
                  Group:
                    getFieldValue(resolvedRecord, ["nGroupId", "GroupId"]) === 0
                      ? undefined
                      : getFieldValue(resolvedRecord, ["nGroupId", "GroupId"]),
                  ServiceType:
                    getFieldValue(resolvedRecord, [
                      "nServiceTypeId",
                      "ServiceTypeId",
                    ]) === 0
                      ? undefined
                      : getFieldValue(resolvedRecord, [
                          "nServiceTypeId",
                          "ServiceTypeId",
                        ]),
                  Source: getFieldValue(resolvedRecord, [
                    "nTicketSourceId",
                    "TicketSourceId",
                  ]),
                  AssetId: getFieldValue(resolvedRecord, [
                    "nAssetId",
                    "AssetId",
                  ]),
                  AssetName: assetName,
                  files: attachments,
                },
              },
            });
          }}
        />
      </div>
      {!isFollowupPage ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 px-1 ">
          <Button
            className="!border-black !text-black !bg-white rounded-full shadow-sm flex items-center gap-3 w-28 "
            onClick={() => message.info("Estimate action will be added next")}
          >
            <img src={EstimateIcon} alt="" className="h-5 w-5 " /> Estimate
          </Button>
          <Button
            className="!border-black !text-black rounded-full border-black bg-white text-black shadow-sm w-28"
            onClick={() => setTransferOpen(true)}
          >
            <img src={transferIcon} alt="" className="h-5 w-5 " /> Transfer
          </Button>
          <Button
            className="!border-black !text-black rounded-full border-black bg-white text-black shadow-sm w-28 "
            onClick={() => setPostponeOpen(true)}
          >
            <img src={postponeIcon} alt="" className="h-5 w-5 " />
            Postponed
          </Button>
          <Button
            className="!border-black !text-black rounded-full border-black bg-white text-black shadow-sm w-28 "
            onClick={() => setShareOpen(true)}
          >
            <img src={sendIcon} alt="" className="h-5 w-5 " /> Share
          </Button>
          <Button
            className="!border-black !text-black rounded-full border-black bg-white text-black shadow-sm w-28 "
            onClick={() => message.info("Merge action will be added next")}
          >
            <img src={mergeIcon} alt="" className="h-5 w-5 " /> Merge
          </Button>
        </div>
      ) : null}
      <QuickCallReportModal
        open={quickCallOpen}
        onClose={() => setQuickCallOpen(false)}
        ticketId={ticketId}
        ticketValues={resolvedRecord}
        selectedCustomerName={customerName}
        sessionPayload={getRequestPayload()}
        assignedAgentDetails={assignedAgentDetails}
      />
      <ShareTicketModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        ticketId={ticketId}
      />
      <TransferTicketModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        ticketId={ticketId}
      />
      <FollowupModal
        open={postponeOpen}
        onClose={() => setPostponeOpen(false)}
        ticketId={ticketId}
        customerId={customerId}
        defaultTicketId={ticketId}
      />
      {/* </div> */}
    </TicketPageShell>
  );
};

export default TicketView;
