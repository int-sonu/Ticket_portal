import { Spin } from "antd";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

import { agentApis, groupApis } from "../../Axios/MasterApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import filterIcon from "../../assets/icons/searchFilterIcon.svg";
import FilterList from "./FilterList";
import noDataIcon from "../../assets/images/noDataGif.gif";

type RowLike = Record<string, any>;

const CarouselItems = [
  { label: "Assigned Tickets", id: 1 },
  { label: "Accepted Tickets", id: 2 },
  { label: "Completed by self", id: 3 },
  { label: "Transferred Without Call report", id: 4 },
  { label: "Transferred After Call report", id: 5 },
  { label: "Postponed Tickets", id: 6 },
  { label: "Shared Tickets", id: 7 },
  { label: "Overdue Instance", id: 8 },
];

const text = (value: unknown, fallback = "") => String(value ?? "").trim() || fallback;

const getValue = (record: RowLike, keys: string[]) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null && record?.[key] !== "") {
      return record[key];
    }
  }

  const matched = Object.keys(record || {}).find((key) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
  );

  return matched ? record[matched] : "";
};

const extractRows = (response: unknown): RowLike[] => {
  const direct = extractList(response);
  if (direct.length) return direct as RowLike[];
  if (!response || typeof response !== "object") return [];

  const source = response as RowLike;
  for (const nested of [
    source.data,
    source.result,
    source.items,
    source.list,
    source.AgentAnalysisList,
    source.agentAnalysisList,
    source.analysisList,
    source.GroupList,
    source.groupList,
  ]) {
    const rows = extractList(nested);
    if (rows.length) return rows as RowLike[];
  }

  return [];
};

const normalizeCount = (value: unknown) => {
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const getGroupLabel = (row: RowLike) =>
  text(
    getValue(row, ["cGroupName", "GroupName", "groupName", "cName", "Name", "label"]),
   
  );

const ArrowButton = ({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
      disabled
        ? "border-slate-200 bg-white text-slate-300"
        : "border-sky-400 bg-white text-slate-900 hover:bg-sky-50"
    }`}
  >
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${direction === "left" ? "" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  </button>
);

const formatApiDate = (date: dayjs.Dayjs) => date.format("YYYY/MM/DD");

const getCarouselCount = (row: RowLike) => {
  return normalizeCount(getValue(row, ["nCount", "count"]));
};

const AgentAnalysisPage = () => {
  const payload = useMemo(() => getRequestPayload() as Record<string, any>, []);
  const currentAgentId = String(payload.nAgentId ?? payload.id ?? "");
  const [search, setSearch] = useState("");
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<{
    ticket: number | null;
    group: string | null;
  }>({
    ticket: CarouselItems[0]?.id ?? 1,
    group: null,
  });
  const [startDate, setStartDate] = useState(dayjs().startOf("day"));
  const [endDate, setEndDate] = useState(dayjs().endOf("day"));
  const [switchDate, setSwitchDate] = useState<1 | 2>(1);
  const [groupId, setGroupId] = useState(-1);
  const currentCarouselId = CarouselItems[activeCarouselIndex]?.id ?? 1;
  const requestPayload = useMemo(
    () => ({
      ...payload,
      nCompanyId: payload.nCompanyId,
      cSchemaName: payload.cSchemaName,
      cDbName: payload.cDbName,
      nAgentId: Number(currentAgentId) || currentAgentId,
      nType: currentCarouselId,
      nMode: switchDate,
      bDateFilter: true,
      dFromDate: formatApiDate(startDate),
      dToDate: formatApiDate(endDate),
      nGroupId: groupId,
      pageNumber: 1,
      pageSize: 1000,
    }),
    [payload, startDate, endDate, currentCarouselId, groupId, currentAgentId, switchDate],
  );

  const {
    data: analysisResponse,
    isLoading: isAnalysisLoading,
    isFetching: isAnalysisFetching,
  } = useQuery({
    queryKey: ["agent-analysis", requestPayload],
    queryFn: () => agentApis.agentAnalysis(requestPayload),
    enabled: !!requestPayload.nCompanyId,
    refetchOnMount: "always",
  });

  const {
    data: groupResponse,
    isLoading: isGroupLoading,
    isFetching: isGroupFetching,
  } = useQuery({
    queryKey: ["agent-analysis-groups", requestPayload],
    queryFn: () => groupApis.groupList(requestPayload),
    enabled: !!requestPayload.nCompanyId,
    refetchOnMount: "always",
  });

  const AgentGroupListData = useMemo(
    () => extractRows(groupResponse?.data ?? groupResponse ?? {}),
    [groupResponse],
  );

  const agents = useMemo(() => {
    const rows = extractRows(analysisResponse?.data ?? analysisResponse ?? {});
    return rows.map((row, index) => {
      const tickets = getCarouselCount(row);
      const groupName = getGroupLabel(row);

      return {
        id: text(getValue(row, ["nAgentId", "AgentId", "id", "nUserId"]), `agent-${index}`),
        name: text(getValue(row, ["cAgentName", "AgentName", "cName", "Name"]), "Agent"),
        role: text(getValue(row, ["cTypeName", "cUserType", "Role"]), "Agent"),
        groupName,
        tickets,
        raw: row,
      };
    });
  }, [analysisResponse, currentCarouselId]);

  const filteredAgents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return agents
      .filter((agent) => {
        const groupMatches =
          !selectedFilter.group ||
          String(agent.groupName).trim().toLowerCase() === String(selectedFilter.group).toLowerCase() ||
          String(agent.raw?.nGroupId ?? agent.raw?.GroupId ?? agent.raw?.groupId ?? "").trim() === String(selectedFilter.group);

        if (!groupMatches) return false;
        if (!keyword) return true;

        const haystack = [agent.name, agent.role, agent.groupName, agent.tickets]
          .join(" ")
          .toLowerCase();

        return haystack.includes(keyword);
      })
      .filter((agent) => Number(agent.tickets) > 0)
      .sort((left, right) => Number(right.tickets) - Number(left.tickets));
  }, [agents, search, selectedFilter.group]);

  const maximumTicketCount = useMemo(
    () => Math.max(1, ...filteredAgents.map((agent) => Number(agent.tickets) || 0)),
    [filteredAgents],
  );

  useEffect(() => {
    setSelectedFilter((current) => ({
      ...current,
      ticket: currentCarouselId,
    }));
  }, [currentCarouselId]);

  const handleSelectToday = () => {
    setSwitchDate(1);
    setStartDate(dayjs().startOf("day"));
    setEndDate(dayjs().endOf("day"));
  };

  const handleSelectLast7Days = () => {
    setSwitchDate(2);
    setStartDate(dayjs().subtract(6, "day").startOf("day"));
    setEndDate(dayjs().endOf("day"));
  };

  const handleApplyFilter = (filter: { ticket: number | null; group: string | null; startDate?: string; endDate?: string }) => {
    if (filter.ticket) {
      const nextIndex = CarouselItems.findIndex((item) => item.id === filter.ticket);
      if (nextIndex >= 0) {
        setActiveCarouselIndex(nextIndex);
      }
    }

    setSelectedFilter({
      ticket: filter.ticket,
      group: filter.group,
    });
    setGroupId(filter.group ? Number(filter.group) : -1);

    if (filter.startDate) {
      setStartDate(dayjs(filter.startDate));
    }

    if (filter.endDate) {
      setEndDate(dayjs(filter.endDate));
    }

    if (filter.startDate || filter.endDate) {
      setSwitchDate(2);
    }

    setFiltersOpen(false);
  };

  const handleFilterCancel = () => {
    setGroupId(-1);
    setSelectedFilter({ ticket: null, group: null });
    setFiltersOpen(false);
  };

  const stepAgent = (direction: -1 | 1) => {
    setActiveCarouselIndex((current) => {
      const next = current + direction;
      if (next < 0) return CarouselItems.length - 1;
      if (next >= CarouselItems.length) return 0;
      setSelectedFilter((prev) => ({ ...prev, ticket: CarouselItems[next]?.id ?? 1 }));
      return next;
    });
  };

  const activeCarouselItem = CarouselItems[activeCarouselIndex] ?? CarouselItems[0];
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-5">
      <div className="flex flex-none flex-wrap items-start justify-between gap-3">
        <h2 className="m-0 text-lg font-medium text-slate-950">Agent Analysis</h2>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white shadow-sm transition-colors hover:bg-slate-50"
              aria-label="Open filters"
            >
              <img src={filterIcon} alt="" className="h-4 w-4" />
            </button>

            {filtersOpen ? (
              <FilterList
                CarouselItems={CarouselItems}
                groupList={(AgentGroupListData?.filter(
                  (item: any) => item.bActive && item.bCancelled === false,
                ) ?? []) as any}
                onClose={handleFilterCancel}
                handleApplyFilter={handleApplyFilter}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
              />
            ) : null}
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="h-10 w-[280px] rounded-md border border-sky-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-none items-center justify-center gap-8">
        <ArrowButton direction="left" onClick={() => stepAgent(-1)} />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="text-base font-medium text-slate-900">{activeCarouselItem.label}</div>
          <div className="flex items-center gap-2">
            {CarouselItems.map((item, index) => (
              <span
                key={item.id}
                className={`h-2.5 w-2.5 rounded-full border ${
                  index === activeCarouselIndex ? "border-sky-700 bg-sky-700" : "border-slate-400 bg-white"
                }`}
                aria-label={item.label}
              />
            ))}
          </div>
        </div>

        <ArrowButton direction="right" onClick={() => stepAgent(1)} />
      </div>

      <div className="mt-4 flex flex-none justify-end ">
        <div className="inline-flex rounded-full border border-sky-300 bg-white p-0.5 shadow-sm -mt-11">
          <button
            type="button"
            onClick={handleSelectToday}
            className={`rounded-full px-10 py-2 text-sm font-medium transition-colors  ${
              switchDate === 1 ? "bg-sky-500 text-white" : "text-sky-600 hover:bg-sky-50"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleSelectLast7Days}
            className={`rounded-full px-8 py-2 text-sm font-medium transition-colors ${
              switchDate === 2 ? "bg-sky-500 text-white" : "text-sky-600 hover:bg-sky-50"
            }`}
          >
            Last 7 days
          </button>
        </div>
      </div>
      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm p-3">
        <Spin
          spinning={isAnalysisLoading || isAnalysisFetching || isGroupLoading || isGroupFetching}
          className="flex min-h-0 w-full flex-1 [&_.ant-spin-container]:w-full"
        >
          <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
            {filteredAgents.length ? (
              <div className="min-h-0 w-full flex-1 overflow-y-auto">
                {filteredAgents.map((agent, index) => {
                  const initials = agent.name
                    .split(/\s+/)
                    .map((part) => part.charAt(0))
                    .filter(Boolean)
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  const progress = Math.max(
                    4,
                    Math.min(100, (Number(agent.tickets) / maximumTicketCount) * 100),
                  );

                  return (
                    <div
                      key={agent.id}
                      className={`w-full px-1 py-2 ${
                        index < filteredAgents.length - 1
                          ? "border-b border-slate-100"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ffd98a] text-sm font-medium text-white">
                          {initials}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0 text-[15px] text-slate-900">
                              <span className="font-medium">{agent.name}</span>
                              {agent.groupName ? (
                                <span className="ml-2 text-[13px] text-slate-500">
                                  ({agent.groupName})
                                </span>
                              ) : null}
                            </div>
                            <div className="shrink-0 text-sm text-slate-600">
                              {agent.tickets}{" "}
                              {Number(agent.tickets) === 1 ? "Ticket" : "Tickets"}
                            </div>
                          </div>

                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-1 items-center justify-center">
                <img src={noDataIcon} alt="" className="h-60 w-60" />
              </div>
            )}
          </div>
        </Spin>
      </div>
    </section>
  );
};

export default AgentAnalysisPage;
