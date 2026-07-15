import { Button, Empty, Spin } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import { agentApis } from "../../Axios/MasterApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import year from "../../assets/icons/year.svg";
import DateFilterIconPopover from "../../ui/CalendarPopup/DateFilterIconPopover";
import AgentSelectorModal from "./AgentSelectorModal";

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
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [draftDate, setDraftDate] = useState(selectedDate.toDate());
  const [calendarOpen, setCalendarOpen] = useState(false);
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

  const openAssignedTickets = (row: TaskRow) => {
    const agentId = String(getValue(row, ["nAgentId", "AgentId", "agentId"]) || selectedAgent.value);
    const agentName = text(
      getValue(row, ["cAgentName", "AgentName", "cName", "Name"]) || selectedAgent.label,
    );
    const date =
      formatDate(getValue(row, ["dDate", "Date", "cDate", "TaskDate"])) ||
      selectedDate.format("DD/MM/YYYY");

    navigate(
      `/tickets/agenttickets?agentId=${encodeURIComponent(agentId)}&agentName=${encodeURIComponent(agentName)}&dDate=${encodeURIComponent(selectedDate.format("YYYY/MM/DD"))}`,
      {
        state: {
          agentId,
          agentName,
          returnTo: "/more/task-calendar",
          taskDate: date,
          dDate: selectedDate.format("YYYY/MM/DD"),
        },
      },
    );
  };

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden p-5">
      <div className="flex flex-none items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-medium">Task Calendar</h2>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setAgentSearch("");
              setExpandedAgentId(null);
              setAgentModalOpen(true);
              void refetchAgentDropdown();
            }}
            className="!flex !h-12 !min-w-[240px] !items-center !justify-between !rounded-lg !border-sky-200 !bg-sky-50 !px-3 !py-2 !shadow-sm"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-300 text-sm font-semibold">
                {(selectedAgent.label[0] || "S").toUpperCase()}
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="font-medium text-slate-700">{selectedAgent.label}</span>
                <span className="text-xs text-slate-500">{selectedAgent.role}</span>
              </span>
            </span>
            <DownOutlined className="text-[10px] text-slate-500" />
          </Button>

          <DateFilterIconPopover
            open={calendarOpen}
            iconSrc={year}
            alt="Open calendar"
            ariaLabel="Open task calendar"
            onOpenToggle={() => {
              setDraftDate(selectedDate.toDate());
              setCalendarOpen((current) => !current);
            }}
            month={draftDate}
            selectedDate={draftDate}
            onMonthChange={setDraftDate}
            onYearChange={setDraftDate}
            onSelectDate={(date) => {
              setDraftDate(date);
              setSelectedDate(dayjs(date));
              setCalendarOpen(false);
            }}
            onApply={() => {
              setSelectedDate(dayjs(draftDate));
              setCalendarOpen(false);
            }}
            onCancel={() => setCalendarOpen(false)}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
        <div className="grid min-w-[820px] grid-cols-[140px_1fr] border-b border-slate-100 px-4 py-4 text-[13px] font-medium text-slate-700">
          <div>Date</div>
          <div>Task</div>
        </div>
        <Spin spinning={isLoading || isFetching}>
          {rows.length ? (
            <div className="max-h-[calc(100vh-220px)] overflow-auto">
              {rows.map((row, index) => {
                const dateValue = formatDate(getValue(row, ["dDate", "Date", "cDate", "TaskDate"])) || selectedDate.format("DD/MM/YYYY");
                const taskText =
                  text(getValue(row, ["cTask", "Task", "cDescription", "Description"])) ||
                  "No Ticket Assigned";
                return (
                  <button
                    key={String(getValue(row, ["nTaskCalendarId", "TaskCalendarId", "id"]) || index)}
                    type="button"
                    className="grid min-w-[820px] grid-cols-[140px_1fr] border-b border-slate-50 px-4 py-4 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                    onClick={() => openAssignedTickets(row)}
                  >
                    <div className="flex flex-col">
                      <span>{dateValue}</span>
                      <span className="text-xs text-slate-500">{getWeekdayLabel(getValue(row, ["cDayName", "DayName", "Day"]), selectedDate)}</span>
                    </div>
                    <div className="font-medium text-lime-500">{taskText}</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[330px] items-center justify-center">
              <Empty description="No data" />
            </div>
          )}
        </Spin>
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
