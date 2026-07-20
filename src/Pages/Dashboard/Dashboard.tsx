import { useMemo, useState } from "react";
import type { FC } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Spin } from "antd";

import { agentApis } from "../../Axios/MasterApis";
import { dashboardApis } from "../../Axios/DashboardApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../../Pages/Master/Common/SimpleMasterUtils";
import DashboardMainContent from "../../Components/Dashboard/DashboardMainContent/DashboardMainContent";
import DashboardRightSidebar from "../../Components/Dashboard/DashboardRightSidebar/DashboardRightSidebar";
import AgentSelectorModal, { type SharedAgentOption } from "../../Pages/More/AgentSelectorModal";
import type { DashboardChartAgent, DashboardStats, SidePanelStats } from "../../Types/dashboard.types";

type RecordLike = Record<string, any>;

type RequestPayload = Record<string, any> & {
  nCompanyId?: number | string;
  nAgentId?: number | string;
  id?: number | string;
  cDbName?: string;
  cSchemaName?: string;
};

const text = (value: unknown, fallback = "") => String(value ?? "").trim() || fallback;

const toNumber = (value: unknown) => {
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCountFromResponse = (response: unknown, fallbackKeys: string[] = []) => {
  const source = (response ?? {}) as RecordLike;
  const candidates: unknown[] = [
    response,
    source?.data,
    source?.result,
    source?.items,
    source?.list,
    source?.data?.data,
    source?.data?.result,
    source?.data?.items,
    source?.data?.list,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.length;
    const rows = extractList(candidate);
    if (rows.length) return rows.length;
  }

  for (const key of fallbackKeys) {
    const value = getValue(source, [key], undefined);
    if (value !== undefined && value !== null && value !== "") {
      return toNumber(value);
    }
  }

  return 0;
};

const getValue = (record: RecordLike, keys: string[], fallback: any = "") => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null && record?.[key] !== "") {
      return record[key];
    }
  }

  const matched = Object.keys(record || {}).find((key) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
  );

  return matched ? record[matched] : fallback;
};

const extractRows = (response: unknown, nestedKeys: string[] = []) => {
  const source = (response ?? {}) as RecordLike;
  const candidates: unknown[] = [
    response,
    source?.data,
    source?.result,
    source?.items,
    source?.list,
  ];

  for (const key of nestedKeys) {
    candidates.push(source?.[key]);
    candidates.push(source?.data?.[key]);
  }

  for (const candidate of candidates) {
    const rows = extractList(candidate);
    if (rows.length) return rows as RecordLike[];
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      return [candidate as RecordLike];
    }
  }

  return [];
};

const getCurrentUser = () => {
  for (const storage of [sessionStorage, localStorage]) {
    for (const key of ["userSession", "userCredentials"]) {
      try {
        const parsed = JSON.parse(storage.getItem(key) ?? "{}");
        const source = parsed?.data ?? parsed;
        const name = text(source?.cName ?? source?.cAgentName ?? source?.cUserName ?? source?.Name, "Self");
        const role = text(source?.cUserType ?? source?.cTypeName ?? source?.cRoleName ?? "Admin", "Admin");
        if (name) return { name, role };
      } catch {
        // Ignore malformed session values.
      }
    }
  }

  return { name: "Self", role: "Admin" };
};

const getAgentOptionValue = (row: RecordLike, index: number) =>
  String(getValue(row, ["nAgentId", "AgentId", "id", "nUserId"], index + 1));

const getAgentOptionLabel = (row: RecordLike, index: number) =>
  text(getValue(row, ["cAgentName", "AgentName", "cUserName", "cName", "Name"], `Agent ${index + 1}`));

const Dashboard: FC = () => {
  const basePayload = useMemo(() => getRequestPayload() as RequestPayload, []);
  const currentUser = useMemo(() => getCurrentUser(), []);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<SharedAgentOption>({
    label: currentUser.name,
    value: String(basePayload.nAgentId ?? basePayload.id ?? ""),
    role: currentUser.role,
    isSelf: true,
  });

  const companyPayload = useMemo<RequestPayload>(
    () => ({
      ...basePayload,
      nCompanyId: basePayload.nCompanyId,
      cDbName: basePayload.cDbName,
      cSchemaName: basePayload.cSchemaName,
      nPageNo: 1,
      nPageSize: 1000,
    }),
    [basePayload],
  );

  const agentDropdownPayload = useMemo<RequestPayload>(
    () => ({
      ...companyPayload,
      nCompanyId: basePayload.nCompanyId,
      nAgentId: Number(selectedAgent.value || basePayload.nAgentId || basePayload.id || 0),
      cAgentId: selectedAgent.value || String(basePayload.nAgentId ?? basePayload.id ?? ""),
      dDate: selectedDate.format("YYYY-MM-DD"),
    }),
    [basePayload, companyPayload, selectedAgent.value, selectedDate],
  );

  const dashboardPayload = useMemo<RequestPayload>(
    () => ({
      ...companyPayload,
      nCompanyId: basePayload.nCompanyId,
      nAgentId: Number(selectedAgent.value || basePayload.nAgentId || basePayload.id || 0),
      cAgentId: selectedAgent.value || String(basePayload.nAgentId ?? basePayload.id ?? ""),
      agentId: selectedAgent.value || String(basePayload.nAgentId ?? basePayload.id ?? ""),
      dDate: selectedDate.format("YYYY-MM-DD"),
      dFromDate: selectedDate.startOf("month").format("YYYY-MM-DD"),
      dToDate: selectedDate.endOf("month").format("YYYY-MM-DD"),
      cFromDate: selectedDate.startOf("month").format("YYYY-MM-DD"),
      cToDate: selectedDate.endOf("month").format("YYYY-MM-DD"),
    }),
    [basePayload, companyPayload, selectedAgent.value, selectedDate],
  );

  const {
    data: agentDropdownData,
    isFetching: isAgentDropdownFetching,
    refetch: refetchAgentDropdown,
  } = useQuery({
    queryKey: ["dashboard-agent-dropdown", agentDropdownPayload],
    queryFn: () => agentApis.agentDropDown(agentDropdownPayload),
    enabled: Boolean(companyPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const { data: dashboardCountData, isFetching: isCountFetching, refetch: refetchDashboardCount } = useQuery({
    queryKey: ["dashboard-count", dashboardPayload],
    queryFn: () => dashboardApis.dashboardCount(dashboardPayload),
    enabled: Boolean(dashboardPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const { data: collectionSummaryData, isFetching: isCollectionFetching, refetch: refetchCollectionSummary } = useQuery({
    queryKey: ["dashboard-collection-summary", dashboardPayload],
    queryFn: () => dashboardApis.collectionSummary(dashboardPayload),
    enabled: Boolean(dashboardPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const { data: agentsActivityData, isFetching: isAgentsActivityFetching, refetch: refetchAgentsActivity } = useQuery({
    queryKey: ["dashboard-agents-activity", dashboardPayload],
    queryFn: () => dashboardApis.agentsActivityList(dashboardPayload),
    enabled: Boolean(dashboardPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const { data: ongoingData, isFetching: isOngoingFetching, refetch: refetchOngoing } = useQuery({
    queryKey: ["dashboard-ongoing", dashboardPayload],
    queryFn: () => dashboardApis.ongoingTicketList(dashboardPayload),
    enabled: Boolean(dashboardPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const { data: overdueData, isFetching: isOverdueFetching, refetch: refetchOverdue } = useQuery({
    queryKey: ["dashboard-overdue", dashboardPayload],
    queryFn: () => dashboardApis.overdueTicketList(dashboardPayload),
    enabled: Boolean(dashboardPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const { data: postponedData, isFetching: isPostponedFetching, refetch: refetchPostponed } = useQuery({
    queryKey: ["dashboard-postponed", dashboardPayload],
    queryFn: () => dashboardApis.postponedTicketList(dashboardPayload),
    enabled: Boolean(dashboardPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const { data: closedStatusData, isFetching: isClosedStatusFetching, refetch: refetchClosedStatus } = useQuery({
    queryKey: ["dashboard-closed-status", dashboardPayload],
    queryFn: () => dashboardApis.closedTicketListWithStatus(dashboardPayload),
    enabled: Boolean(dashboardPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const { data: resolvedData, isFetching: isResolvedFetching, refetch: refetchResolved } = useQuery({
    queryKey: ["dashboard-closed-resolved", dashboardPayload],
    queryFn: () => dashboardApis.closedResolvedTicketList(dashboardPayload),
    enabled: Boolean(dashboardPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const { data: unresolvedData, isFetching: isUnresolvedFetching, refetch: refetchUnresolved } = useQuery({
    queryKey: ["dashboard-closed-unresolved", dashboardPayload],
    queryFn: () => dashboardApis.closedUnResolvedTicketList(dashboardPayload),
    enabled: Boolean(dashboardPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const { data: upcomingData, isFetching: isUpcomingFetching, refetch: refetchUpcoming } = useQuery({
    queryKey: ["dashboard-upcoming", dashboardPayload],
    queryFn: () => dashboardApis.upcomingTicketList(dashboardPayload),
    enabled: Boolean(dashboardPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const { data: createdData, isFetching: isCreatedFetching, refetch: refetchCreated } = useQuery({
    queryKey: ["dashboard-created", dashboardPayload],
    queryFn: () => dashboardApis.createdTicketList(dashboardPayload),
    enabled: Boolean(dashboardPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const { data: unassignedData, isFetching: isUnassignedFetching, refetch: refetchUnassigned } = useQuery({
    queryKey: ["dashboard-unassigned", dashboardPayload],
    queryFn: () => dashboardApis.unAssignedTicketList(dashboardPayload),
    enabled: Boolean(dashboardPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const { data: callReportData, isFetching: isCallReportFetching, refetch: refetchCallReport } = useQuery({
    queryKey: ["dashboard-call-report", dashboardPayload],
    queryFn: () => dashboardApis.callReportList(dashboardPayload),
    enabled: Boolean(dashboardPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const { data: billListData, isFetching: isBillListFetching, refetch: refetchBillList } = useQuery({
    queryKey: ["dashboard-bill-list", dashboardPayload],
    queryFn: () => dashboardApis.billList(dashboardPayload),
    enabled: Boolean(dashboardPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const { data: receiptListData, isFetching: isReceiptListFetching, refetch: refetchReceiptList } = useQuery({
    queryKey: ["dashboard-receipt-list", dashboardPayload],
    queryFn: () => dashboardApis.receiptList(dashboardPayload),
    enabled: Boolean(dashboardPayload.nCompanyId),
    refetchOnMount: "always",
  });

  const agentOptions = useMemo<SharedAgentOption[]>(() => {
    const rows = extractRows(agentDropdownData);
    const self = {
      label: currentUser.name,
      value: String(basePayload.nAgentId ?? basePayload.id ?? ""),
      role: currentUser.role,
      isSelf: true,
    };

    const options = rows.map((row, index) => ({
      label: getAgentOptionLabel(row, index),
      value: getAgentOptionValue(row, index),
      role: text(getValue(row, ["cTypeName", "cUserType", "cRoleName", "role"], "Agent"), "Agent"),
      isSelf: false,
    }));

    const seen = new Set<string>();
    return [self, ...options].filter((item) => {
      const key = `${item.value}-${item.label}`.toLowerCase();
      if (!item.value || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [agentDropdownData, basePayload.nAgentId, basePayload.id, currentUser.name, currentUser.role]);

  const dashboardRow = useMemo(() => extractRows(dashboardCountData)[0] ?? {}, [dashboardCountData]);
  const collectionRows = useMemo(() => extractRows(collectionSummaryData), [collectionSummaryData]);
  const activityRows = useMemo(() => extractRows(agentsActivityData), [agentsActivityData]);

  const stats = useMemo<DashboardStats>(
    () => ({
      createdTicket: getCountFromResponse(createdData, ["nCreatedTicket", "CreatedTicket", "createdTicket", "nCreatedTickets"]),
      callReport: getCountFromResponse(callReportData, ["nCallReport", "CallReport", "callReport", "nCallReportCount"]),
      postponed: getCountFromResponse(postponedData, ["nPostponed", "Postponed", "postponed", "nPostponedTicket"]),
      closed:
        getCountFromResponse(closedStatusData, ["nClosed", "Closed", "closed", "nClosedTicket"]) ||
        getCountFromResponse(resolvedData, ["nResolved", "Resolved", "resolved", "nResolvedTicket"]) +
          getCountFromResponse(unresolvedData, ["nUnresolved", "Unresolved", "unresolved", "nUnresolvedTicket"]),
      resolved: getCountFromResponse(resolvedData, ["nResolved", "Resolved", "resolved", "nResolvedTicket"]),
      unresolved: getCountFromResponse(unresolvedData, ["nUnresolved", "Unresolved", "unresolved", "nUnresolvedTicket"]),
      receipts: getCountFromResponse(receiptListData, ["nReceipts", "Receipts", "receipts", "nReceipt"]),
      receiptsAmount: toNumber(getValue(dashboardRow, ["nReceiptsAmount", "ReceiptsAmount", "receiptsAmount", "ReceiptAmount"])),
      bills: getCountFromResponse(billListData, ["nBills", "Bills", "bills", "nBill"]),
      billsAmount: toNumber(getValue(dashboardRow, ["nBillsAmount", "BillsAmount", "billsAmount", "BillAmount"])),
    }),
    [
      billListData,
      callReportData,
      closedStatusData,
      createdData,
      dashboardRow,
      postponedData,
      receiptListData,
      resolvedData,
      unresolvedData,
    ],
  );

  const sideStats = useMemo<SidePanelStats>(
    () => ({
      ongoing: getCountFromResponse(ongoingData, ["nOngoing", "Ongoing", "ongoing", "nOngoingTicket"]),
      overdue: getCountFromResponse(overdueData, ["nOverdue", "Overdue", "overdue", "nOverdueTicket"]),
      unassigned: getCountFromResponse(unassignedData, ["nUnassigned", "Unassigned", "unassigned", "nUnAssignedTicket"]),
      upcoming: getCountFromResponse(upcomingData, ["nUpcoming", "Upcoming", "upcoming", "nUpcomingTicket"]),
    }),
    [ongoingData, overdueData, unassignedData, upcomingData],
  );

  const agents = useMemo<DashboardChartAgent[]>(() => {
    return activityRows.map((row, index) => ({
      name: getAgentOptionLabel(row, index),
      callReport: toNumber(getValue(row, ["nCallReport", "CallReport", "callReport", "nCallReportCount"])),
      createdTicket: toNumber(getValue(row, ["nCreatedTickets", "CreatedTickets", "createdTickets", "nCreatedTicket", "CreatedTicket"])),
    }));
  }, [activityRows]);

  const collectionSummaryAmount = useMemo(() => {
    const amountFromRows = collectionRows.reduce(
      (sum, row) => sum + toNumber(getValue(row, ["nAmount", "Amount", "amount", "nTotalAmount", "TotalAmount"])),
      0,
    );
    const fallback = toNumber(
      getValue(collectionRows[0] ?? {}, ["nAmount", "Amount", "amount", "nTotalAmount", "TotalAmount"]),
    );
    return Number(amountFromRows || fallback);
  }, [collectionRows]);

  const formatAmount = (amount: number) =>
    Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const isLoading =
    isCountFetching ||
    isCollectionFetching ||
    isAgentsActivityFetching ||
    isAgentDropdownFetching ||
    isOngoingFetching ||
    isOverdueFetching ||
    isPostponedFetching ||
    isClosedStatusFetching ||
    isResolvedFetching ||
    isUnresolvedFetching ||
    isUpcomingFetching ||
    isCreatedFetching ||
    isUnassignedFetching ||
    isCallReportFetching ||
    isBillListFetching ||
    isReceiptListFetching;

  const handleRefresh = () => {
    void Promise.all([
      refetchAgentDropdown(),
      refetchDashboardCount(),
      refetchCollectionSummary(),
      refetchAgentsActivity(),
      refetchOngoing(),
      refetchOverdue(),
      refetchPostponed(),
      refetchClosedStatus(),
      refetchResolved(),
      refetchUnresolved(),
      refetchUpcoming(),
      refetchCreated(),
      refetchUnassigned(),
      refetchCallReport(),
      refetchBillList(),
      refetchReceiptList(),
    ]);
  };

  return (
    <div className="-m-6 grid h-full min-h-0 grid-cols-[minmax(0,1fr)_280px] overflow-hidden ">
      <div className="dashboard-scroll min-w-0 overflow-y-auto overflow-x-hidden p-4 pr-3 transition-all duration-300 mt-5 scroll-width: thin">
        <div className="w-full origin-top-left scale-[1.02]">
          <Spin spinning={isLoading}>
            <DashboardMainContent
              stats={stats}
              agentLabel={selectedAgent.label}
              agentRole={selectedAgent.role ?? currentUser.role}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              formatAmount={formatAmount}
              collectionSummaryAmount={`Rs. ${formatAmount(collectionSummaryAmount)}`}
              agents={agents}
              onAgentClick={() => setAgentModalOpen(true)}
              onRefresh={handleRefresh}
            />
          </Spin>
        </div>
      </div>

      <div className="min-w-0  border-sky-100 bg-white px-3 py-4 mt-7">
        <div className="sticky top-4 w-full">
          <DashboardRightSidebar sideStats={sideStats} />
        </div>
      </div>

      <AgentSelectorModal
        open={agentModalOpen}
        loading={isAgentDropdownFetching}
        options={agentOptions}
        selectedValue={selectedAgent.value}
        search={agentSearch}
        expandedAgentId={expandedAgentId}
        selfOption={{
          label: currentUser.name,
          value: String(basePayload.nAgentId ?? basePayload.id ?? ""),
          role: currentUser.role,
          isSelf: true,
        }}
        onSearch={setAgentSearch}
        onSelect={(agent) => {
          setSelectedAgent(agent);
          setAgentModalOpen(false);
        }}
        onExpandedChange={setExpandedAgentId}
        onClose={() => {
          setAgentModalOpen(false);
          setExpandedAgentId(null);
        }}
      />
    </div>
  );
};

export default Dashboard;
