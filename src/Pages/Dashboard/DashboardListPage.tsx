/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { CloseOutlined, SearchOutlined, SwapOutlined } from "@ant-design/icons";
import { Empty, Input, Popover, Spin, Table } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";
import { dashboardApis } from "../../Axios/DashboardApis";
import { agentApis } from "../../Axios/MasterApis";
import { itemRepairApis } from "../../Axios/ItemRepairApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import searchFilterIcon from "../../assets/icons/searchFilterIcon.svg";
import dashboardBanner from "../../assets/icons/dashboard-banner.svg";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import AgentSelectorModal, {
  type SharedAgentOption,
} from "../More/Common/AgentSelectorModal";
import TicketModulePagination from "../Ticket/Common/TicketModulePagination";
import "./DashboardCreatedTickets/DashboardCreatedTickets.css";

type Row = Record<string, any>;
type PageKind =
  | "call-report"
  | "postponed"
  | "collection-summary"
  | "ongoing"
  | "overdue"
  | "unassigned"
  | "upcoming";
type Props = { page: PageKind };

const getValue = (row: Row, keys: string[], fallback: any = "") => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") {
      return row[key];
    }
  }
  const match = Object.keys(row || {}).find((key) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
  );
  return match ? row[match] : fallback;
};

const getRows = (response: any): Row[] => {
  const rows = extractList(response);
  if (rows.length) return rows;
  const containers = [
    response,
    response?.data,
    response?.result,
    response?.message,
    response?.data?.data,
    response?.data?.result,
  ];
  const keys = [
    "Data",
    "callReportList",
    "CallReportList",
    "postponedTicketList",
    "PostponedTicketList",
    "collectionSummaryList",
    "CollectionSummaryList",
    "agentUnderSupervisorList",
    "AgentUnderSupervisorList",
    "agentList",
    "AgentList",
  ];
  for (const container of containers) {
    for (const key of keys) {
      if (Array.isArray(container?.[key])) return container[key];
    }
  }
  return [];
};

const getUser = () => {
  for (const storage of [sessionStorage, localStorage]) {
    for (const key of ["userSession", "userCredentials"]) {
      try {
        const parsed = JSON.parse(storage.getItem(key) ?? "{}");
        const source = parsed?.data ?? parsed;
        return {
          label: String(
            source?.cName ??
              source?.cAgentName ??
              source?.cUserName ??
              "Self",
          ),
          role: String(
            source?.cUserType ?? source?.cTypeName ?? source?.cRoleName ?? "Admin",
          ),
        };
      } catch {
        // Ignore malformed sessions.
      }
    }
  }
  return { label: "Self", role: "Admin" };
};

const formatDate = (value: unknown) => {
  const parsed = dayjs(String(value ?? ""));
  return parsed.isValid() ? parsed.format("DD/MM/YYYY hh:mm A") : String(value || "-");
};

const renderTicketDate = (row: Row, keys: string[]) => {
  const period = String(
    getValue(row, ["cPeriod", "Period", "cAge", "TicketAge"], ""),
  );
  const details = String(
    getValue(
      row,
      ["cViewSummary", "ViewSummary", "cCreatedSummary", "CreatedSummary"],
      "",
    ),
  );
  return (
    <div className="whitespace-normal">
      <span>{formatDate(getValue(row, keys))}</span>
      {period ? <span className="ml-1 text-slate-400">({period})</span> : null}
      {details ? (
        <div className="mt-1 text-[10px] leading-4 text-blue-600">{details}</div>
      ) : null}
    </div>
  );
};

const titles: Record<PageKind, string> = {
  "call-report": "Call Reports",
  postponed: "Postponed Tickets",
  "collection-summary": "Collection Summary",
  ongoing: "Ongoing",
  overdue: "Overdue",
  unassigned: "Unassigned",
  upcoming: "Upcoming",
};

const DashboardListPage = ({ page }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as Row | null) ?? {};
  const base = useMemo(() => getRequestPayload(), []);
  const user = useMemo(() => getUser(), []);
  const initialAgent = state.selectedAgent as SharedAgentOption | undefined;
  const [selectedAgent, setSelectedAgent] = useState<SharedAgentOption>({
    label: initialAgent?.label || user.label,
    value: String(initialAgent?.value ?? base.nAgentId ?? base.id ?? ""),
    role: initialAgent?.role || user.role,
    isSelf: initialAgent?.isSelf ?? true,
  });
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const selectedDate = useMemo(() => {
    const parsed = dayjs(state.selectedDate);
    return parsed.isValid() ? parsed : dayjs();
  }, [state.selectedDate]);

  const payload = useMemo(
    () => ({
      ...base,
      nCompanyId: base.nCompanyId,
      nAgentId: Number(selectedAgent.value || 0),
      cAgentId: String(selectedAgent.queryAgentId || selectedAgent.value || "0"),
      agentId: String(selectedAgent.queryAgentId || selectedAgent.value || "0"),
      nMode: 0,
      nPageNo: 1,
      nPageSize: 1000,
      dDate: selectedDate.format("YYYY-MM-DD"),
      dFromDate: selectedDate.startOf("month").format("YYYY-MM-DD"),
      dToDate: selectedDate.endOf("month").format("YYYY-MM-DD"),
      cFromDate: selectedDate.startOf("month").format("YYYY-MM-DD"),
      cToDate: selectedDate.endOf("month").format("YYYY-MM-DD"),
    }),
    [base, selectedAgent.queryAgentId, selectedAgent.value, selectedDate],
  );
  const agentPayload = useMemo(
    () => ({
      ...base,
      nAgentId: Number(base.nAgentId || base.id || 0),
      cAgentId: String(base.nAgentId ?? base.id ?? ""),
      nPageNo: 1,
      nPageSize: 1000,
    }),
    [base],
  );

  const listQuery = useQuery({
    queryKey: ["dashboard-drilldown", page, payload],
    queryFn: () => {
      switch (page) {
        case "call-report":
          return dashboardApis.callReportList(payload);
        case "postponed":
          return dashboardApis.postponedTicketList(payload);
        case "collection-summary":
          return dashboardApis.collectionSummaryList(payload);
        case "ongoing":
          return dashboardApis.ongoingTicketList(payload);
        case "overdue":
          return dashboardApis.overdueTicketList(payload);
        case "unassigned":
          return dashboardApis.unAssignedTicketList(payload);
        case "upcoming":
          return dashboardApis.upcomingTicketList(payload);
      }
    },
    enabled: Boolean(payload.nCompanyId),
    refetchOnMount: "always",
  });
  useQuery({
    queryKey: ["dashboard-postponed-repair-activity", payload],
    queryFn: () => itemRepairApis.repairItemActivityDropDown(payload),
    enabled:
      ["postponed", "ongoing", "overdue", "unassigned", "upcoming"].includes(
        page,
      ) && Boolean(payload.nCompanyId),
  });
  const agentQuery = useQuery({
    queryKey: ["dashboard-drilldown-agents", page, agentPayload],
    queryFn: () => agentApis.agentDropDown(agentPayload),
    enabled: page !== "unassigned" && Boolean(agentPayload.nCompanyId),
  });
  const supervisorPayload = useMemo(
    () => ({
      nCompanyId: base.nCompanyId,
      nAgentId: Number(expandedAgentId || 0),
      cSchemaName: base.cSchemaName,
      cDbName: base.cDbName,
    }),
    [base.cDbName, base.cSchemaName, base.nCompanyId, expandedAgentId],
  );
  const supervisorQuery = useQuery({
    queryKey: ["dashboard-drilldown-supervisor", page, supervisorPayload],
    queryFn: () => agentApis.agentUnderSupervisorList(supervisorPayload),
    enabled:
      page !== "unassigned" &&
      agentOpen &&
      Boolean(supervisorPayload.nCompanyId) &&
      Boolean(supervisorPayload.nAgentId),
  });

  const mapAgents = (response: any): SharedAgentOption[] =>
    getRows(response)
      .map((row, index) => ({
        label: String(
          getValue(
            row,
            ["cAgentName", "AgentName", "cUserName", "cName", "Name"],
            `Agent ${index + 1}`,
          ),
        ),
        value: String(getValue(row, ["nAgentId", "AgentId", "id"], "")),
        role: String(
          getValue(
            row,
            ["cGroupName", "GroupName", "cTypeName", "cRoleName"],
            "Agent",
          ),
        ),
        nType: Number(getValue(row, ["nType", "type"], 3)),
      }))
      .filter((agent) => agent.value);
  const agents = useMemo(() => mapAgents(agentQuery.data), [agentQuery.data]);
  const selfOption = useMemo<SharedAgentOption>(
    () => ({
      label: "Self",
      value: String(base.nAgentId ?? base.id ?? ""),
      role: user.role,
      isSelf: true,
    }),
    [base.id, base.nAgentId, user.role],
  );
  const visibleAgents = useMemo(
    () =>
      agents.filter(
        (agent) =>
          agent.value !== selfOption.value &&
          agent.label.toLowerCase() !== "self",
      ),
    [agents, selfOption.value],
  );
  const supervisorAgents = useMemo(
    () =>
      mapAgents(supervisorQuery.data).filter(
        (agent) => agent.value !== String(expandedAgentId ?? ""),
      ),
    [expandedAgentId, supervisorQuery.data],
  );
  const viewAllOption = useMemo<SharedAgentOption>(() => {
    const supervisors = visibleAgents.filter(
      (agent) => Number(agent.nType) === 2,
    ).length;
    return {
      label: "View All",
      value: "0",
      role: `Self ${supervisors} Supervisor ${Math.max(
        0,
        visibleAgents.length - supervisors,
      )} Agent`,
      avatarText: String(visibleAgents.length),
    };
  }, [visibleAgents]);

  const rows = useMemo(() => getRows(listQuery.data), [listQuery.data]);
  const displayRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const searchMatches =
        !query || Object.values(row).join(" ").toLowerCase().includes(query);
      if (!statusFilter) return searchMatches;
      const status = String(
        getValue(row, ["cStatus", "Status", "cStatusName", "TicketStatusName"]),
      ).toLowerCase();
      const statusMatches =
        statusFilter === "Pending"
          ? status.includes("pending")
          : status.includes("hold");
      return searchMatches && statusMatches;
    });
  }, [rows, search, statusFilter]);
  const maxPage = Math.max(1, Math.ceil(displayRows.length / pageSize));
  const safePage = Math.min(currentPage, maxPage);
  const pagedRows = displayRows.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const callSummary = useMemo(() => {
    const customers = new Set(
      rows
        .map((row) =>
          String(getValue(row, ["nCustomerId", "CustomerId", "cCustomerName"])),
        )
        .filter(Boolean),
    );
    const current = rows.filter((row) =>
      String(getValue(row, ["cTicketType", "TicketType", "cStatus"]))
        .toLowerCase()
        .includes("current"),
    ).length;
    return {
      tickets: rows.length,
      customers: customers.size,
      current,
      old: Math.max(0, rows.length - current),
    };
  }, [rows]);
  const ongoingSummary = useMemo(() => {
    const today = dayjs().startOf("day");
    const overdue = rows.filter((row) => {
      const dueDate = dayjs(
        getValue(row, [
          "dDueDate",
          "DueDate",
          "dFollowupDate",
          "FollowupDate",
          "dScheduledOn",
        ]),
      );
      return dueDate.isValid() && dueDate.isBefore(today);
    }).length;
    const current = rows.filter((row) =>
      String(getValue(row, ["cTicketType", "TicketType", "cStatus"]))
        .toLowerCase()
        .includes("current"),
    ).length;
    return {
      total: rows.length,
      current,
      old: Math.max(0, rows.length - current),
      overdue,
    };
  }, [rows]);
  const postponedSummary = useMemo(() => {
    const counts = { open: 0, pending: 0, onHold: 0, closed: 0, reopen: 0, progress: 0 };
    rows.forEach((row) => {
      const status = String(
        getValue(row, ["cStatus", "Status", "cStatusName"]),
      ).toLowerCase();
      if (status.includes("reopen")) counts.reopen += 1;
      else if (status.includes("hold")) counts.onHold += 1;
      else if (status.includes("progress")) counts.progress += 1;
      else if (status.includes("pending")) counts.pending += 1;
      else if (status.includes("closed")) counts.closed += 1;
      else counts.open += 1;
    });
    return counts;
  }, [rows]);

  const callColumns = [
    { title: "Srl", width: 55, render: (_: any, __: any, index: number) => index + 1 },
    { title: "Call Report Id", width: 100, render: (_: any, row: Row) => getValue(row, ["nTicketId"], "-") },
    { title: "Call Report Date", width: 120, render: (_: any, row: Row) => formatDate(getValue(row, ["dCallReportDate",])) },
    { title: "Ticket No.", width: 95, render: (_: any, row: Row) => getValue(row, ["nTicketNo"]) },
    { title: "Agent Name", width: 110, render: (_: any, row: Row) => getValue(row, ["cAgentName"]) },
    { title: "Customer Name", width: 120, render: (_: any, row: Row) => getValue(row, ["cCustomerName"]) },
    { title: "Call Summary", render: (_: any, row: Row) => getValue(row, ["cCallReportSummary"]) },
    { title: "Status", width: 90, render: (_: any, row: Row) => getValue(row, ["cPriority"]) },
  ];
  const collectionColumns = [
    { title: "Srl", width: 55, render: (_: any, __: any, index: number) => index + 1 },
    { title: "No", width: 75, render: (_: any, row: Row) => getValue(row, ["nNo"]) },
    { title: "Payment Type", width: 120, render: (_: any, row: Row) => getValue(row, ["cType"]) },
    { title: "Date", width: 110, render: (_: any, row: Row) => formatDate(getValue(row, ["dDate", "Date", "dReceiptDate"])) },
    { title: "Customer Name", render: (_: any, row: Row) => getValue(row, ["cCustomerName"]) },
    { title: "Amount", width: 100, render: (_: any, row: Row) => Number(getValue(row, ["nAmount"], 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 }) },
    { title: "Paymode", width: 120, render: (_: any, row: Row) => getValue(row, ["cPaymodeName"]) },
  ];
  const postponedColumns = [
    { title: "Srl", width: 55, render: (_: any, __: any, index: number) => index + 1 },
    { title: "Ticket No.", width: 100, render: (_: any, row: Row) => getValue(row, ["nTicketNo"]) },
    { title: "Created Date & Time", width: 160, render: (_: any, row: Row) => formatDate(getValue(row, ["dCreatedDate"])) },
    { title: "Assigned To", width: 120, render: (_: any, row: Row) => getValue(row, ["cAssignedTo"]) },
    { title: "Customer Name", width: 130, render: (_: any, row: Row) => getValue(row, ["cCustomerName"]) },
    { title: "Ticket Summary", render: (_: any, row: Row) => getValue(row, ["cTicketSummary"]) },
    { title: "Priority", width: 90, render: (_: any, row: Row) => getValue(row, ["cPriority"]) },
    { title: "Status", width: 90, render: (_: any, row: Row) => getValue(row, ["cStatus"]) },
  ];
  const ongoingColumns = [
    { title: "Srl", width: 55, render: (_: any, __: any, index: number) => index + 1 },
    { title: "Ticket No.", width: 100, render: (_: any, row: Row) => getValue(row, ["nTicketNo", "TicketNo"], "-") },
    { title: "Created Date & Time", width: 260, render: (_: any, row: Row) => renderTicketDate(row, ["dCreatedDate", "CreatedDate"]) },
    { title: "Customer Name", width: 150, render: (_: any, row: Row) => getValue(row, ["cCustomerName", "CustomerName"], "-") },
    { title: "Assigned To", width: 150, render: (_: any, row: Row) => getValue(row, ["cAssignedTo", "AssignedTo", "cAgentName"], "-") },
    { title: "Ticket Summary", render: (_: any, row: Row) => getValue(row, ["cTicketSummary", "TicketSummary"], "-") },
  ];
  const overdueColumns = [
    { title: "Srl", width: 55, render: (_: any, __: any, index: number) => index + 1 },
    { title: "Ticket No.", width: 100, render: (_: any, row: Row) => getValue(row, ["nTicketNo", "TicketNo"], "-") },
    { title: "Schedule Date", width: 270, render: (_: any, row: Row) => renderTicketDate(row, ["dScheduleDate", "ScheduleDate", "dCreatedDate"]) },
    { title: "Overdue Date", width: 160, render: (_: any, row: Row) => getValue(row, ["cOverdueDate", "OverdueDate", "cAge"], "-") },
    { title: "Assigned To", width: 150, render: (_: any, row: Row) => getValue(row, ["cAssignedTo", "AssignedTo", "cAgentName"], "-") },
    { title: "Customer Name", render: (_: any, row: Row) => getValue(row, ["cCustomerName", "CustomerName"], "-") },
  ];
  const unassignedColumns = [
    { title: "Srl", width: 55, render: (_: any, __: any, index: number) => index + 1 },
    { title: "Ticket No.", width: 100, render: (_: any, row: Row) => getValue(row, ["nTicketNo", "TicketNo"], "-") },
    { title: "Created Date & Time", width: 280, render: (_: any, row: Row) => renderTicketDate(row, ["dCreatedDate", "CreatedDate"]) },
    { title: "Agent Name", width: 140, render: (_: any, row: Row) => getValue(row, ["cAgentName", "AgentName", "cCreatedBy"], "-") },
    { title: "Customer Name", width: 150, render: (_: any, row: Row) => getValue(row, ["cCustomerName", "CustomerName"], "-") },
    { title: "Created By", render: (_: any, row: Row) => getValue(row, ["cCreatedBy", "CreatedBy", "cViewSummary"], "-") },
  ];
  const upcomingColumns = [
    { title: "Srl", width: 55, render: (_: any, __: any, index: number) => index + 1 },
    { title: "Scheduled on", width: 250, render: (_: any, row: Row) => renderTicketDate(row, ["dScheduledOn", "ScheduledOn", "dScheduleDate"]) },
    { title: "Ticket No.", width: 100, render: (_: any, row: Row) => getValue(row, ["nTicketNo", "TicketNo"], "-") },
    { title: "Agent Name", width: 140, render: (_: any, row: Row) => getValue(row, ["cAgentName", "AgentName", "cAssignedTo"], "-") },
    { title: "Customer Name", width: 150, render: (_: any, row: Row) => getValue(row, ["cCustomerName", "CustomerName"], "-") },
    { title: "Ticket Summary", render: (_: any, row: Row) => getValue(row, ["cTicketSummary", "TicketSummary"], "-") },
  ];
  const columns =
    page === "call-report"
      ? callColumns
      : page === "postponed"
        ? postponedColumns
        : page === "collection-summary"
          ? collectionColumns
          : page === "ongoing"
            ? ongoingColumns
            : page === "overdue"
              ? overdueColumns
              : page === "unassigned"
                ? unassignedColumns
                : upcomingColumns;

  return (
    <div className="dashboard-drilldown-page flex h-full min-h-0 flex-col overflow-hidden bg-white py-1">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800">{titles[page]}</h1>
        <div className="flex items-center gap-3">
          {page === "unassigned" ? (
            <Input value={search} onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }} prefix={<SearchOutlined />} placeholder="Search" allowClear className="w-[215px]" />
          ) : null}
          <button type="button" onClick={() => navigate("/dashboard")} aria-label={`Close ${titles[page]}`}>
            <CloseOutlined className="text-xl text-slate-800" />
          </button>
        </div>
      </div>
      {page !== "unassigned" ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setAgentOpen(true)} className="flex min-w-[190px] items-center gap-3 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-left">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-200 font-medium">
              {selectedAgent.avatarText || (selectedAgent.label[0] || "S").toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-700">
                {selectedAgent.label} {selectedAgent.role ? <span className="font-normal text-slate-500">({selectedAgent.role})</span> : null}
              </span>
              {selectedAgent.detail ? <span className="block text-xs text-slate-500">({selectedAgent.detail})</span> : null}
            </span>
            <SwapOutlined className="rounded-md bg-sky-500 p-1.5 text-white" />
          </button>
          <div className="flex items-center gap-2">
          {page === "ongoing" || page === "upcoming" ? (
            <Popover
              overlayClassName="created-ticket-filter-popover"
              open={filterOpen}
              onOpenChange={setFilterOpen}
              trigger="click"
              placement="bottomLeft"
              content={
                <div className="flex w-[90px] flex-col py-1">
                  {["Pending", "On Hold"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setStatusFilter(status);
                        setCurrentPage(1);
                        setFilterOpen(false);
                      }}
                      className={`h-[35px] px-4 text-left text-xs hover:bg-slate-50 ${
                        statusFilter === status
                          ? "font-medium text-sky-600"
                          : "text-slate-600"
                      }`}
                    >
                      {status === "On Hold" ? "OnHold" : status}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("");
                      setCurrentPage(1);
                      setFilterOpen(false);
                    }}
                    className="h-[38px] border-t border-slate-100 px-4 text-left text-xs text-red-500 hover:bg-red-50"
                  >
                    Clear Filter
                  </button>
                </div>
              }
            >
              <button
                type="button"
                aria-label={`Filter ${titles[page]}`}
                className={`flex h-8 w-9 items-center justify-center rounded-md border ${
                  statusFilter
                    ? "border-sky-500 bg-sky-50"
                    : "border-slate-800 bg-white"
                }`}
              >
                <img src={searchFilterIcon} alt="" className="h-4 w-4" />
              </button>
            </Popover>
          ) : null}
          <Input value={search} onChange={(event) => {
            setSearch(event.target.value);
            setCurrentPage(1);
          }} prefix={<SearchOutlined />} placeholder="Search" allowClear className="w-[240px]" />
          </div>
        </div>
      ) : null}
      {!["collection-summary", "overdue"].includes(page) ? (
        <div className="mt-4 flex min-h-[58px] items-center justify-between rounded-sm bg-sky-50 px-4 py-2">
          <div>
            <div className="text-xs font-semibold text-slate-800">
              {page === "call-report"
                ? "Call Report Summary"
                : page === "postponed"
                  ? "Postponed Tickets Summary"
                  : page === "ongoing"
                    ? `Ongoing Summary (Total Tickets : ${ongoingSummary.total})`
                    : page === "unassigned"
                      ? `Unassigned Summary (Total Tickets : ${rows.length})`
                      : `Upcoming Summary ${rows.length}`}
            </div>
            <div className="mt-1 text-xs text-slate-600">
              {page === "call-report" ? (
                <>Tickets handled :<b>{String(callSummary.tickets).padStart(2, "0")}</b>, Customers handled :<b>{String(callSummary.customers).padStart(2, "0")}</b>, Current ticket :<b>{String(callSummary.current).padStart(2, "0")}</b>, Old ticket :<b>{String(callSummary.old).padStart(2, "0")}</b></>
              ) : page === "postponed" ? (
                <>Open :<b>{String(postponedSummary.open).padStart(2, "0")}</b>, Pending :<b>{String(postponedSummary.pending).padStart(2, "0")}</b>, On Hold :<b>{String(postponedSummary.onHold).padStart(2, "0")}</b>, Closed :<b>{String(postponedSummary.closed).padStart(2, "0")}</b>, Reopen :<b>{String(postponedSummary.reopen).padStart(2, "0")}</b>, In Progress :<b>{String(postponedSummary.progress).padStart(2, "0")}</b></>
              ) : page === "ongoing" ? (
                <>Current ticket :<b>{String(ongoingSummary.current).padStart(2, "0")}</b>, Old ticket :<b>{String(ongoingSummary.old).padStart(2, "0")}</b>, Overdue :<b>{String(ongoingSummary.overdue).padStart(2, "0")}</b></>
              ) : page === "unassigned" ? (
                <>Tickets Handled :<b>{String(rows.length).padStart(2, "0")}</b>, Customers Handled :<b>{String(callSummary.customers).padStart(2, "0")}</b>, Current Tickets :<b>{String(callSummary.current).padStart(2, "0")}</b>, Old Tickets :<b>{String(callSummary.old).padStart(2, "0")}</b></>
              ) : (
                <>Pending :<b>{String(postponedSummary.pending).padStart(2, "0")}</b>, OnHold :<b>{String(postponedSummary.onHold).padStart(2, "0")}</b></>
              )}
            </div>
          </div>
          <img src={dashboardBanner} alt="" className="h-12 w-20 object-contain" />
        </div>
      ) : null}
      <div className="mt-3 min-h-0 flex-1 overflow-hidden">
        <Spin spinning={listQuery.isFetching}>
          <Table
            className="created-tickets-table dashboard-drilldown-table"
            rowKey={(row, index) => String(getValue(row, ["nCallReportId", "nTicketId", "TicketId", "nReceiptId", "id"], index))}
            columns={columns}
            dataSource={
              ["ongoing", "overdue", "unassigned", "upcoming"].includes(page)
                ? pagedRows
                : displayRows
            }
            pagination={false}
            size="small"
            scroll={{
              x: 1000,
              y: ["ongoing", "overdue", "unassigned", "upcoming"].includes(page)
                ? "calc(100vh - 390px)"
                : "calc(100vh - 300px)",
            }}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" /> }}
            onRow={(row) => ({
              onClick: () => {
                if (
                  !["ongoing", "overdue", "unassigned", "upcoming"].includes(
                    page,
                  )
                ) {
                  return;
                }
                const ticketId = Number(
                  getValue(row, ["nTicketId", "TicketId", "ticketId"], 0),
                );
                if (ticketId) {
                  navigate(`/tickets/view/${ticketId}`, {
                    state: { selectedRow: row, isFrom: page },
                  });
                }
              },
              style: {
                cursor: ["ongoing", "overdue", "unassigned", "upcoming"].includes(
                  page,
                )
                  ? "pointer"
                  : "default",
              },
            })}
          />
        </Spin>
      </div>
      {["ongoing", "overdue", "unassigned", "upcoming"].includes(page) &&
      displayRows.length ? (
        <div className="dashboard-drilldown-pagination mt-auto shrink-0 pt-2">
          <TicketModulePagination
            current={safePage}
            pageSize={pageSize}
            total={displayRows.length}
            onChange={(nextPage, nextPageSize) => {
              setCurrentPage(nextPage);
              setPageSize(nextPageSize);
            }}
            onShowSizeChange={(_, nextPageSize) => {
              setCurrentPage(1);
              setPageSize(nextPageSize);
            }}
            showSizeChanger
            elevated={false}
          />
        </div>
      ) : null}
      <AgentSelectorModal
        open={agentOpen}
        loading={agentQuery.isFetching}
        options={visibleAgents.filter((agent) => agent.label.toLowerCase().includes(agentSearch.trim().toLowerCase()))}
        selectedValue={selectedAgent.value}
        search={agentSearch}
        expandedAgentId={expandedAgentId}
        selfOption={selfOption}
        viewAllOption={viewAllOption}
        showOverviewOptions
        supervisorOptions={supervisorAgents}
        supervisorLoading={supervisorQuery.isFetching}
        onSearch={setAgentSearch}
        onSelect={(agent) => {
          setSelectedAgent(agent);
          setCurrentPage(1);
          setAgentOpen(false);
        }}
        onExpandedChange={setExpandedAgentId}
        onClose={() => setAgentOpen(false)}
      />
    </div>
  );
};

export default DashboardListPage;
