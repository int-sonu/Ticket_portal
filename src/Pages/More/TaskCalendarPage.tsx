import { Button, Empty, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import { agentApis } from "../../Axios/MasterApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import TicketModulePagination from "../Ticket/Common/TicketModulePagination";
import AgentSelectorModal from "./AgentSelectorModal";
import profileSwitch from "../../assets/icons/profile-switch.svg";

type TaskRow = Record<string, any>;
type AgentOption = { label: string; value: string; role: string; isSelf?: boolean };

const text = (value: unknown, fallback = "") => String(value ?? "").trim() || fallback;

const getValue = (record: TaskRow, keys: string[]) => {
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

const extractRows = (response: unknown): TaskRow[] => {
  const direct = extractList(response);
  if (direct.length) return direct as TaskRow[];
  if (!response || typeof response !== "object") return [];

  const source = response as TaskRow;
  for (const nested of [source.data, source.result, source.items, source.list, source.TaskCalenderList, source.taskCalenderList]) {
    const rows = extractList(nested);
    if (rows.length) return rows as TaskRow[];
  }

  return [];
};

const getCurrentUserName = () => {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of ["userCredentials", "userSession"]) {
      try {
        const parsed = JSON.parse(storage.getItem(key) ?? "{}");
        const source = parsed?.data ?? parsed;
        const name = text(source?.cAgentName ?? source?.cName ?? source?.cUserName);
        if (name) return name;
      } catch {
        // ignore
      }
    }
  }

  return "Self";
};

const getAgentRole = (row: TaskRow) => {
  const explicit = text(getValue(row, ["cTypeName", "cUserType", "Role"]));
  if (explicit) return explicit;
  return Number(getValue(row, ["nType", "nUserType"])) === 2 ? "Supervisor" : "Agent";
};

const formatDate = (value: unknown) => {
  if (!value) return "";
  const parsed = dayjs(value as any);
  if (!parsed.isValid()) return text(value);
  return parsed.format("DD/MM/YYYY");
};

const getWeekdayLabel = (value: unknown, fallbackDate: dayjs.Dayjs) => {
  const textValue = text(value);
  const match = textValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (match) {
    const [, dd, mm, yyyy] = match;
    const parsed = dayjs(`${yyyy}-${mm}-${dd}`);
    if (parsed.isValid()) return parsed.format("dddd");
  }

  return fallbackDate.format("dddd");
};

const TaskCalendarPage = () => {
  const navigate = useNavigate();
  const payload = useMemo(() => getRequestPayload() as Record<string, any>, []);
  const currentUserName = useMemo(() => getCurrentUserName(), []);
  const currentAgentId = String(payload.nAgentId ?? payload.id ?? "");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedDate] = useState(dayjs());
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentOption>({
    label: currentUserName,
    value: currentAgentId,
    role: "Self",
    isSelf: true,
  });

  const agentPayload = useMemo(
    () => ({
      nCompanyId: payload.nCompanyId,
      cSchemaName: payload.cSchemaName,
      cDbName: payload.cDbName,
    }),
    [payload],
  );

  const {
    data: agentResponse,
    isLoading: isAgentLoading,
    isFetching: isAgentFetching,
    refetch: refetchAgentDropdown,
  } = useQuery({
    queryKey: ["task-calendar-agent-dropdown", agentPayload],
    queryFn: () => agentApis.agentDropDown(agentPayload),
    enabled: !!payload.nCompanyId,
    refetchOnMount: "always",
  });

  const agentOptions = useMemo<AgentOption[]>(() => {
    const rows = extractRows(agentResponse?.data ?? agentResponse ?? {});
    const options = rows
      .map((row) => ({
        label: text(getValue(row, ["cAgentName", "AgentName", "cUserName", "Name"]), "Agent"),
        value: text(getValue(row, ["nAgentId", "AgentId", "id"])),
        role: getAgentRole(row),
      }))
      .filter((option) => option.value);

    const self = { label: currentUserName, value: currentAgentId, role: "Self", isSelf: true };
    const seen = new Set<string>();
    return [self, ...options].filter((option) => {
      if (!option.value || seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    });
  }, [agentResponse, currentAgentId, currentUserName]);

  const visibleAgents = useMemo(() => {
    const search = agentSearch.trim().toLowerCase();
    if (!search) return agentOptions;
    return agentOptions.filter((agent) => `${agent.label} ${agent.role}`.toLowerCase().includes(search));
  }, [agentOptions, agentSearch]);

  const listPayload = useMemo(
    () => ({
      ...payload,
      nCompanyId: payload.nCompanyId,
      nAgentId: selectedAgent.value,
      agentId: selectedAgent.value,
      dDate: selectedDate.format("YYYY/MM/DD"),
      dFromDate: selectedDate.format("YYYY/MM/DD"),
      dToDate: selectedDate.format("YYYY/MM/DD"),
      cSearch: "",
      pageNumber: 1,
      pageSize: 1000,
    }),
    [payload, selectedAgent.value, selectedDate],
  );

  const { data: taskResponse, isLoading, isFetching } = useQuery({
    queryKey: ["task-calendar-list", listPayload],
    queryFn: () => agentApis.taskCalender(listPayload),
    enabled: !!listPayload.nCompanyId && !!listPayload.nAgentId,
  });

  const rows = useMemo(() => extractRows(taskResponse?.data ?? taskResponse ?? {}), [taskResponse]);
  const totalRows = rows.length;

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [currentPage, pageSize, rows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, selectedAgent.value]);

  const openAssignedTickets = (row: TaskRow) => {
    const agentId = String(
      getValue(row, [
        "nAgentId",
        "AgentId",
        "agentId",
        "nAssignAgentId",
        "nAssignedAgentId",
        "nAssignToId",
        "nUserId",
      ]) || selectedAgent.value
    ).trim();
    const agentName = text(
      getValue(row, ["cAgentName", "AgentName", "cName", "Name", "cAssignAgentName", "AssignAgentName"]) ||
        selectedAgent.label,
    );
    const taskDate =
      formatDate(getValue(row, ["dDate", "Date", "cDate", "TaskDate"])) ||
      selectedDate.format("DD/MM/YYYY");
    const requestDate =
      taskDate.includes("/")
        ? dayjs(taskDate, "DD/MM/YYYY", true).isValid()
          ? dayjs(taskDate, "DD/MM/YYYY").format("YYYY/MM/DD")
          : selectedDate.format("YYYY/MM/DD")
        : selectedDate.format("YYYY/MM/DD");

    navigate("/more/taskcalendar/view", {
      state: {
        agentId,
        agentName,
        dDate: requestDate,
        taskDate,
        returnTo: "/more/task-calendar",
      },
    });
  };

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden p-5">
      <div className="flex flex-none flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-medium">Task Calendar</h2>
        <div className="flex min-w-0 items-center gap-3">
          <Button
            onClick={() => {
              setAgentSearch("");
              setExpandedAgentId(null);
              setAgentModalOpen(true);
              void refetchAgentDropdown();
            }}
            className="!flex !h-12 !w-full !max-w-[240px] !items-center !justify-between !rounded-lg !border-sky-200 !bg-sky-50 !px-3 !py-2 !shadow-sm"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-300 text-sm font-semibold">
                {(selectedAgent.label[0] || "S").toUpperCase()}
              </span>
              <span className="flex min-w-0 flex-col items-start leading-tight">
                <span className="truncate font-medium text-slate-700">{selectedAgent.label}</span>
                <span className="text-xs text-slate-500">{selectedAgent.role}</span>
              </span>
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500">
              <img src={profileSwitch} alt="" className="h-4 w-4 brightness-0 invert" />
            </span>
          </Button>
        </div>
      </div>

      <div className="flex min-h-50 flex-1 flex-col  rounded-lg border border-slate-100 bg-white shadow-sm  ">
        <div className="grid grid-cols-[140px_minmax(0,1fr)] border-b border-slate-100 px-4 py-4 text-[13px] font-medium text-slate-700 ">
          <div>Date</div>
          <div>Task</div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-blue scrollbar-track-slate-50">
          <Spin spinning={isLoading || isFetching} className="flex min-h-0 flex-1">
            {rows.length ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
                {pagedRows.map((row, index) => {
                  const dateValue = formatDate(getValue(row, ["dDate", "Date", "cDate", "TaskDate"])) || selectedDate.format("DD/MM/YYYY");
                  const taskText =
                    text(getValue(row, ["cTask", "Task", "cDescription", "Description"])) ||
                    "No Ticket Assigned";
                  return (
                    <button
                      key={String(getValue(row, ["nTaskCalendarId", "TaskCalendarId", "id"]) || index)}
                      type="button"
                      className="grid w-full grid-cols-[140px_minmax(0,1fr)] border-b border-slate-50 px-4 py-4 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                      onClick={() => openAssignedTickets(row)}
                    >
                      <div className="flex flex-col">
                        <span>{dateValue}</span>
                        <span className="text-xs text-slate-500">{getWeekdayLabel(getValue(row, ["cDayName", "DayName", "Day"]), selectedDate)}</span>
                      </div>
                      <div className="min-w-0 break-words font-medium text-lime-500">{taskText}</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[430px] items-center justify-center">
                <Empty description="No data" />
              </div>
            )}
          </Spin>

        
        </div>
      </div>

        <div className="shrink-0 border-b border-slate-100 px-3 -py-20 flex items-center justify-end">
            <TicketModulePagination
              current={currentPage}
              pageSize={pageSize}
              total={totalRows}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              onShowSizeChange={(_, size) => {
                setCurrentPage(1);
                setPageSize(size);
              }}
            />
          </div>

      <AgentSelectorModal
        open={agentModalOpen}
        loading={isAgentLoading || isAgentFetching}
        options={visibleAgents}
        selectedValue={selectedAgent.value}
        search={agentSearch}
        expandedAgentId={expandedAgentId}
        selfOption={{
          label: currentUserName,
          value: currentAgentId,
          role: "Self",
          isSelf: true,
        }}
        onSearch={setAgentSearch}
        onSelect={(agent) => {
          setSelectedAgent({ label: agent.label, value: agent.value, role: agent.role || "Agent" });
          setAgentModalOpen(false);
        }}
        onExpandedChange={setExpandedAgentId}
        onClose={() => {
          setAgentModalOpen(false);
          setExpandedAgentId(null);
        }}
      />
    </section>
  );
};

export default TaskCalendarPage;
