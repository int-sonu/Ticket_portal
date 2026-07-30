/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import {
  CloseOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Empty, Input, Popover, Spin, Table } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";

import { dashboardApis } from "../../../Axios/DashboardApis";
import { agentApis } from "../../../Axios/MasterApis";
import { getRequestPayload } from "../../../Utils/requestPayload";
import searchFilterIcon from "../../../assets/icons/searchFilterIcon.svg";
import profileSwitch from "../../../assets/icons/profile-switch.svg";
import { extractList } from "../../Master/Common/SimpleMasterUtils";
import TicketModulePagination from "../../Ticket/Common/TicketModulePagination";
import AgentSelectorModal, {
  type SharedAgentOption,
} from "../../More/Common/AgentSelectorModal";
import "./DashboardCreatedTickets.css";

import dashboardBanner from "../../../assets/icons/dashboard-banner.svg";
type RecordLike = Record<string, any>;

const valueOf = (row: RecordLike, keys: string[], fallback: any = "") => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") {
      return row[key];
    }
  }

  const matched = Object.keys(row || {}).find((key) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
  );
  return matched ? row[matched] : fallback;
};

const rowsOf = (response: any): RecordLike[] => {
  const rows = extractList(response);
  if (rows.length) return rows;
  if (Array.isArray(response?.Data)) return response.Data;
  if (Array.isArray(response?.data?.Data)) return response.data.Data;

  const containers = [
    response,
    response?.data,
    response?.result,
    response?.message,
    response?.data?.data,
    response?.data?.result,
  ];
  const listKeys = [
    "agentUnderSupervisorList",
    "AgentUnderSupervisorList",
    "agentList",
    "AgentList",
    "lAgentList",
    "agents",
    "Agents",
  ];

  for (const container of containers) {
    for (const key of listKeys) {
      if (Array.isArray(container?.[key])) {
        return container[key];
      }
    }
  }

  return [];
};

const currentUser = () => {
  for (const storage of [sessionStorage, localStorage]) {
    for (const key of ["userSession", "userCredentials"]) {
      try {
        const parsed = JSON.parse(storage.getItem(key) ?? "{}");
        const source = parsed?.data ?? parsed;
        const label = String(
          source?.cName ??
            source?.cAgentName ??
            source?.cUserName ??
            source?.Name ??
            "Self",
        );
        const role = String(
          source?.cUserType ??
            source?.cTypeName ??
            source?.cRoleName ??
            "Admin",
        );
        if (label) return { label, role };
      } catch {
        // Ignore malformed stored sessions.
      }
    }
  }
  return { label: "Self", role: "Admin" };
};

const formatDateTime = (value: unknown) => {
  if (!value) return "-";
  const parsed = dayjs(String(value));
  return parsed.isValid() ? parsed.format("DD/MM/YYYY hh:mm A") : String(value);
};

const formatTicketAge = (value: unknown) => {
  const created = dayjs(String(value ?? ""));
  if (!created.isValid()) return "";

  const minutes = Math.max(0, dayjs().diff(created, "minute"));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;
  const parts = [];
  if (days) parts.push(`${days}D`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${remainingMinutes}m`);
  return parts.join(" ");
};

const DashboardCreatedTickets = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state as RecordLike | null) ?? {};
  const basePayload = useMemo(() => getRequestPayload(), []);
  const user = useMemo(() => currentUser(), []);
  const initialAgent = routeState.selectedAgent as SharedAgentOption | undefined;
  const [selectedAgent, setSelectedAgent] = useState<SharedAgentOption>({
    label: initialAgent?.label || user.label,
    value: String(
      initialAgent?.value ?? basePayload.nAgentId ?? basePayload.id ?? "",
    ),
    role: initialAgent?.role || user.role,
    isSelf: initialAgent?.isSelf ?? true,
  });
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const effectiveDate = useMemo(() => {
    const selectedDate = dayjs(routeState.selectedDate);
    return selectedDate.isValid() ? selectedDate : dayjs();
  }, [routeState.selectedDate]);
  const effectiveFromDate = useMemo(() => {
    const selectedFromDate = dayjs(routeState.selectedFromDate);
    return selectedFromDate.isValid() ? selectedFromDate : effectiveDate;
  }, [effectiveDate, routeState.selectedFromDate]);
  const effectiveToDate = useMemo(() => {
    const selectedToDate = dayjs(routeState.selectedToDate);
    return selectedToDate.isValid() ? selectedToDate : effectiveDate;
  }, [effectiveDate, routeState.selectedToDate]);

  const agentPayload = useMemo(
    () => ({
      ...basePayload,
      nCompanyId: basePayload.nCompanyId,
      nAgentId: Number(basePayload.nAgentId || basePayload.id || 0),
      cAgentId: String(basePayload.nAgentId ?? basePayload.id ?? ""),
      nPageNo: 1,
      nPageSize: 1000,
    }),
    [basePayload],
  );

  const ticketPayload = useMemo(
    () => ({
      ...basePayload,
      nCompanyId: basePayload.nCompanyId,
      nAgentId: Number(selectedAgent.value || 0),
      cAgentId: String(
        selectedAgent.queryAgentId || selectedAgent.value || "0",
      ),
      agentId: String(
        selectedAgent.queryAgentId || selectedAgent.value || "0",
      ),
      nMode: 0,
      nPageNo: 1,
      nPageSize: 1000,
      dDate: effectiveDate.format("YYYY-MM-DD"),
      dFromDate: effectiveFromDate.format("YYYY-MM-DD"),
      dToDate: effectiveToDate.format("YYYY-MM-DD"),
      cFromDate: effectiveFromDate.format("YYYY-MM-DD"),
      cToDate: effectiveToDate.format("YYYY-MM-DD"),
    }),
    [
      basePayload,
      effectiveDate,
      effectiveFromDate,
      effectiveToDate,
      selectedAgent.queryAgentId,
      selectedAgent.value,
    ],
  );

  const { data: agentData, isFetching: agentsLoading } = useQuery({
    queryKey: ["created-tickets-agent-dropdown", agentPayload],
    queryFn: () => agentApis.agentDropDown(agentPayload),
    enabled: Boolean(basePayload.nCompanyId),
  });

  const supervisorPayload = useMemo(
    () => ({
      nCompanyId: basePayload.nCompanyId,
      nAgentId: Number(expandedAgentId || 0),
      cSchemaName: basePayload.cSchemaName,
      cDbName: basePayload.cDbName,
    }),
    [
      basePayload.cDbName,
      basePayload.cSchemaName,
      basePayload.nCompanyId,
      expandedAgentId,
    ],
  );

  const {
    data: supervisorAgentData,
    isFetching: supervisorAgentsLoading,
  } = useQuery({
    queryKey: ["created-tickets-agents-under-supervisor", supervisorPayload],
    queryFn: () => agentApis.agentUnderSupervisorList(supervisorPayload),
    enabled:
      agentModalOpen &&
      Boolean(supervisorPayload.nCompanyId) &&
      Boolean(supervisorPayload.nAgentId),
  });

  const { data: ticketData, isFetching: ticketsLoading } = useQuery({
    queryKey: ["dashboard-created-tickets-page", ticketPayload],
    queryFn: () => dashboardApis.createdTicketList(ticketPayload),
    enabled: Boolean(basePayload.nCompanyId),
    refetchOnMount: "always",
  });

  const agents = useMemo<SharedAgentOption[]>(
    () =>
      rowsOf(agentData)
        .map((row: RecordLike, index: number) => ({
          label: String(
            valueOf(row, ["cAgentName", "AgentName", "cUserName", "cName", "Name"], `Agent ${index + 1}`),
          ),
          value: String(valueOf(row, ["nAgentId", "AgentId", "id", "nUserId"], "")),
          role: String(valueOf(row, ["cGroupName", "GroupName", "cTypeName", "cUserType", "cRoleName"], "Agent")),
          nType: Number(valueOf(row, ["nType", "type"], 3)),
        }))
        .filter((agent: SharedAgentOption) => agent.value),
    [agentData],
  );
  const selfOption = useMemo<SharedAgentOption>(
    () => ({
      label: "Self",
      value: String(basePayload.nAgentId ?? basePayload.id ?? ""),
      role: user.role,
      isSelf: true,
    }),
    [basePayload.id, basePayload.nAgentId, user.role],
  );
  const visibleAgents = useMemo(
    () =>
      agents.filter(
        (agent) =>
          String(agent.value) !== String(selfOption.value) &&
          agent.label.toLowerCase() !== "self",
      ),
    [agents, selfOption.value],
  );
  const supervisorAgents = useMemo<SharedAgentOption[]>(
    () =>
      rowsOf(supervisorAgentData)
        .map((row: RecordLike, index: number) => ({
          label: String(
            valueOf(
              row,
              ["cAgentName", "AgentName", "cUserName", "cName", "Name"],
              `Agent ${index + 1}`,
            ),
          ),
          value: String(
            valueOf(row, ["nAgentId", "AgentId", "id", "nUserId"], ""),
          ),
          role: String(
            valueOf(
              row,
              [
                "cGroupName",
                "GroupName",
                "cTypeName",
                "cUserType",
                "cRoleName",
              ],
              "Agent",
            ),
          ),
          nType: Number(valueOf(row, ["nType", "type"], 3)),
        }))
        .filter(
          (agent: SharedAgentOption) =>
            agent.value && agent.value !== String(expandedAgentId ?? ""),
        ),
    [expandedAgentId, supervisorAgentData],
  );
  const viewAllOption = useMemo<SharedAgentOption>(() => {
    const supervisorCount = visibleAgents.filter(
      (agent) =>
        Number(agent.nType) === 2 ||
        String(agent.role).toLowerCase().includes("supervisor"),
    ).length;
    const agentCount = Math.max(0, visibleAgents.length - supervisorCount);
    return {
      label: "View All",
      value: "0",
      role: `Self ${supervisorCount} Supervisor ${agentCount} Agent`,
      avatarText: String(visibleAgents.length),
    };
  }, [visibleAgents]);

  const ticketRows = useMemo(() => rowsOf(ticketData), [ticketData]);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ticketRows.filter((row: RecordLike) => {
      const searchableText = [
        valueOf(row, ["nTicketNo", "TicketNo", "cTicketNo"]),
        valueOf(row, ["cCustomerName", "CustomerName", "cCustName"]),
        valueOf(row, ["cTicketSummary", "TicketSummary", "cSummary"]),
        valueOf(row, ["cPriority", "Priority", "cPriorityName"]),
        valueOf(row, ["cStatus", "Status", "cStatusName"]),
      ]
        .join(" ")
        .toLowerCase();
      const status = String(
        valueOf(row, [
          "cStatus",
          "Status",
          "cStatusName",
          "TicketStatusName",
        ]),
      ).toLowerCase();

      const searchMatches = !query || searchableText.includes(query);
      let statusMatches = true;

      if (statusFilter === "Open") {
        statusMatches =
          status.includes("open") &&
          !status.includes("reopen") &&
          !status.includes("closed");
      } else if (statusFilter === "Pending") {
        statusMatches = status.includes("pending");
      } else if (statusFilter === "On Hold") {
        statusMatches = status.includes("hold");
      } else if (statusFilter === "Closed") {
        statusMatches =
          status.includes("closed") || status.includes("resolved");
      } else if (statusFilter === "Reopen") {
        statusMatches = status.includes("reopen");
      } else if (statusFilter === "In Progress") {
        statusMatches = status.includes("progress");
      }

      return searchMatches && statusMatches;
    });
  }, [search, statusFilter, ticketRows]);
  const maxPage = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(currentPage, maxPage);
  const pagedRows = useMemo(
    () =>
      filteredRows.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize,
      ),
    [filteredRows, pageSize, safePage],
  );

  const summary = useMemo(() => {
    const counts = { open: 0, pending: 0, onHold: 0, closed: 0, reopen: 0, inProgress: 0 };
    ticketRows.forEach((row: RecordLike) => {
      const status = String(
        valueOf(row, ["cStatus", "Status", "cStatusName", "TicketStatusName"]),
      ).toLowerCase();
      if (status.includes("reopen")) counts.reopen += 1;
      else if (status.includes("hold")) counts.onHold += 1;
      else if (status.includes("progress")) counts.inProgress += 1;
      else if (status.includes("pending")) counts.pending += 1;
      else if (status.includes("closed") || status.includes("resolved")) counts.closed += 1;
      else counts.open += 1;
    });
    return counts;
  }, [ticketRows]);

  const columns = [
    {
      title: "Srl",
      width: 50,
      render: (_: unknown, __: RecordLike, index: number) =>
        (safePage - 1) * pageSize + index + 1,
    },
    {
      title: "Ticket No.",
      width: 80,
      render: (_: unknown, row: RecordLike) =>
        valueOf(row, ["nTicketNo", "TicketNo", "cTicketNo"], "-"),
    },
    {
      title: "Created Date & Time",
      width: 250,
      render: (_: unknown, row: RecordLike) => {
        const createdDate = valueOf(row, ["dCreatedDate", "CreatedDate"]);
        const providedAge = valueOf(
          row,
          ["cPeriod", "Period", "cAge", "TicketAge"],
          "",
        );
        const mergeText = String(
          valueOf(
            row,
            [
              "cMergeMessage",
              "MergeMessage",
              "cMergeSummary",
              "MergeSummary",
              "cViewSummary",
              "cRemarks",
            ],
            "",
          ),
        );

        return (
          <div className="leading-5">
            <div>
              {formatDateTime(createdDate)}{" "}
              <span className="text-slate-400">
                ({providedAge || formatTicketAge(createdDate)})
              </span>
            </div>
            {mergeText.toLowerCase().includes("merge") ? (
              <div className="max-w-[240px] whitespace-normal text-[10px] leading-4 text-blue-500">
                {mergeText}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Assigned To",
      width: 130,
      render: (_: unknown, row: RecordLike) =>
        valueOf(row, ["cAssignedTo", "cAgentName", "AgentName"], "-"),
    },
    {
      title: "Customer Name",
      width: 150,
      render: (_: unknown, row: RecordLike) =>
        valueOf(row, ["cCustomerName"]),
    },
    {
      title: "Ticket Summary",
      render: (_: unknown, row: RecordLike) =>
        valueOf(row, ["cTicketSummary"]),
    },
  ];

  const summaryItems = [
    ["Open", summary.open],
    ["Pending", summary.pending],
    ["On Hold", summary.onHold],
    ["Closed", summary.closed],
    ["Reopen", summary.reopen],
    ["In Progress", summary.inProgress],
  ];
  const statusFilterOptions = [
    "Open",
    "Pending",
    "On Hold",
    "Closed",
    "Reopen",
    "In Progress",
  ];

  return (
    <div className="created-tickets-page relative -m-6 flex h-[calc(100vh-64px)] min-h-0 flex-col bg-white p-5 pb-[72px] text-xs">
      <div className="flex items-center justify-between">
        <h1 className="px-4 pt-3 text-base font-semibold text-slate-800">Created Tickets</h1>
        <button type="button" onClick={() => navigate("/dashboard")} aria-label="Close created tickets">
          <CloseOutlined className="text-lg text-slate-800" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between px-4  gap-3">
        <button
          type="button"
          onClick={() => setAgentModalOpen(true)}
          className="flex h-10 w-[267px] max-w-full items-center gap-2.5 rounded-md border border-[#83ccff] bg-[#d8eefc] px-3 text-left"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8eccf7] text-xs font-medium text-[#173d59]">
            {selectedAgent.avatarText ||
              (selectedAgent.label[0] || "S").toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-slate-700">
              {selectedAgent.label}{" "}
              {selectedAgent.role ? (
                <span className="font-normal text-slate-500">
                  ({selectedAgent.role})
                </span>
              ) : null}
            </span>
            {selectedAgent.detail ? (
              <span className="block text-[10px] text-slate-500">
                ({selectedAgent.detail})
              </span>
            ) : null}
          </span>
          <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] bg-[#0797e5]">
            <img src={profileSwitch} alt="" className="h-[18px] w-[17px]" />
          </span>
        </button>
        <div className="flex items-center gap-2">
          <Popover
            overlayClassName="created-ticket-filter-popover"
            open={filterOpen}
            onOpenChange={setFilterOpen}
            trigger="click"
            placement="bottomLeft"
            content={
              <div className="flex w-[90px] flex-col py-1">
                {statusFilterOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setStatusFilter(status);
                      setCurrentPage(1);
                      setFilterOpen(false);
                    }}
                    className={`h-[35px] px-4 text-left text-[11px] hover:bg-slate-50 ${
                      statusFilter === status
                        ? "font-medium text-sky-600"
                        : "text-slate-600"
                    }`}
                  >
                    {status}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("");
                    setCurrentPage(1);
                    setFilterOpen(false);
                  }}
                  className="h-[38px] border-t border-slate-100 px-4 text-left text-[11px] text-red-500 hover:bg-red-50"
                >
                  Clear Filter
                </button>
              </div>
            }
          >
            <button
              type="button"
              aria-label="Filter created tickets"
              className={`flex h-8 w-9 items-center justify-center rounded-md border ${
                statusFilter
                  ? "border-sky-500 bg-sky-50 text-sky-600"
                  : "border-slate-800 bg-white text-slate-700"
              }`}
            >
              <img src={searchFilterIcon} alt="" className="h-4 w-4" />
            </button>
          </Popover>
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            prefix={<SearchOutlined />}
            placeholder="Search"
            allowClear
            className="w-[200px]"
          />
        </div>
      </div>

      <div className="ml-4 mr-4 mt-4 flex min-h-[60px] items-center justify-between rounded-sm bg-sky-50 px-4 py-2">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-slate-800">
            Created Tickets Summary{" "}
            <span className="font-normal text-slate-500">
              (Total Tickets : {String(ticketRows.length).padStart(2, "0")})
            </span>
          </div>

          <div className="mt-1 flex flex-wrap text-[11px] text-slate-600">
            {summaryItems.map(([label, count], index) => (
              <span key={String(label)}>
                {index ? ", " : ""}
                {label} :{" "}
                <b className="text-slate-900">
                  {String(count).padStart(2, "0")}
                </b>
              </span>
            ))}
          </div>
        </div>
        <img
          src={dashboardBanner}
          alt=""
          className="h-12 w-20 shrink-0 object-contain"
        />
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-hidden">
        <Spin spinning={ticketsLoading}>
          <Table
            className="created-tickets-table"
            rowKey={(row) => String(valueOf(row, ["nTicketId", "TicketId", "nTicketNo", "TicketNo"]))}
            columns={columns}
             size="small"
            dataSource={pagedRows}
            pagination={false}
            scroll={{ x: 900, y: "calc(100vh - 295px)" }}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data" /> }}
            onRow={(row) => ({
              onClick: () => {
                const id = Number(valueOf(row,["nTicketId", "TicketId"],0));
                if (id) navigate(`/tickets/view/${id}`, { state: { selectedRow: row, isFrom: "created" } });
              },
              style: { cursor: "pointer" },
            })}
          />
        </Spin>
      </div>

      <div className="dashboard-drilldown-pagination absolute pt-135 pl-4px; ">
        <TicketModulePagination
          current={safePage}
          pageSize={pageSize}
          total={filteredRows.length}
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

      <AgentSelectorModal
        open={agentModalOpen}
        loading={agentsLoading}
        options={visibleAgents.filter((agent) =>
          agent.label.toLowerCase().includes(agentSearch.trim().toLowerCase()),
        )}
        selectedValue={selectedAgent.value}
        search={agentSearch}
        expandedAgentId={expandedAgentId}
        selfOption={selfOption}
        viewAllOption={viewAllOption}
        showOverviewOptions
        supervisorOptions={supervisorAgents}
        supervisorLoading={supervisorAgentsLoading}
        onSearch={setAgentSearch}
        onSelect={(agent) => {
          setSelectedAgent(agent);
          setAgentModalOpen(false);
        }}
        onExpandedChange={setExpandedAgentId}
        onClose={() => setAgentModalOpen(false)}
      />
    </div>
  );
};

export default DashboardCreatedTickets;
