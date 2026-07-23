import { useEffect, useMemo, useState } from "react";
import { message, Modal, Spin } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

import { attendanceApis } from "../../Axios/MoreApis";
import { agentApis } from "../../Axios/MasterApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import AgentSelectorModal from "./AgentSelectorModal";
import type { SharedAgentOption } from "./AgentSelectorModal";
import punchIllustration from "../../assets/images/PunchImg.svg";
import clockGreen from "../../assets/icons/clock-green.svg";
import clockMagenta from "../../assets/icons/clock-Magenta.svg";
import clockGrey from "../../assets/icons/clock-grey.svg";
import profileSwitch from "../../assets/icons/profile-switch.svg";

type RecordLike = Record<string, any>;

const getValue = (record: RecordLike, keys: string[], fallback: any = "") => {
  if (!record || typeof record !== "object") return fallback;
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }
  const entry = Object.entries(record).find(([key]) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
  );
  return entry?.[1] ?? fallback;
};

const unwrap = (response: any): any => {
  let value = response;
  for (let index = 0; index < 4; index += 1) {
    if (!value || typeof value !== "object" || Array.isArray(value)) break;
    const nested = value.data ?? value.result ?? value.items ?? value.list;
    if (nested === undefined || nested === value) break;
    value = nested;
  }
  return value;
};

const rowsFrom = (response: any): RecordLike[] => {
  const value = unwrap(response);
  if (Array.isArray(value)) return value;
  return value && typeof value === "object" ? [value] : [];
};

const parseClockTime = (value: unknown) => {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? 0);
  const period = match[4]?.toUpperCase();
  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return { hour, minute, second };
};

const displayTime = (value: unknown, fallback = "00:00", includeSeconds = false) => {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const clock = parseClockTime(raw);
  if (clock) {
    const period = clock.hour >= 12 ? "PM" : "AM";
    const hour = clock.hour % 12 || 12;
    return `${String(hour).padStart(2, "0")}:${String(clock.minute).padStart(2, "0")}${includeSeconds ? `:${String(clock.second).padStart(2, "0")}` : ""} ${period}`;
  }
  const parsed = dayjs(raw);
  if (parsed.isValid() && /[-T/]/.test(raw)) return parsed.format(includeSeconds ? "hh:mm:ss A" : "hh:mm A");
  return raw;
};

const durationSeconds = (value: unknown) => {
  const raw = String(value ?? "").trim();
  const clock = raw.match(/^(\d+):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/);
  if (clock) return Number(clock[1]) * 3600 + Number(clock[2]) * 60 + Number(clock[3] ?? 0);
  const hours = Number(raw.match(/(\d+)\s*(?:hrs?|hours?)/i)?.[1] ?? 0);
  const minutes = Number(raw.match(/(\d+)\s*(?:mins?|minutes?)/i)?.[1] ?? 0);
  const seconds = Number(raw.match(/(\d+)\s*(?:secs?|seconds?)/i)?.[1] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
};

const elapsedSeconds = (from: unknown, to: unknown) => {
  const start = parseClockTime(from);
  const end = parseClockTime(to);
  if (!start || !end) return 0;
  const startSeconds = start.hour * 3600 + start.minute * 60 + start.second;
  const endSeconds = end.hour * 3600 + end.minute * 60 + end.second;
  return endSeconds >= startSeconds ? endSeconds - startSeconds : endSeconds + 86400 - startSeconds;
};

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const displayDate = (value: unknown, fallback: string) => {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const parsed = dayjs(raw);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY") : raw;
};

const dateKey = (value: unknown) => {
  const raw = String(value ?? "").trim();
  const slashDate = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashDate) return `${slashDate[3]}-${slashDate[2]}-${slashDate[1]}`;
  const parsed = dayjs(raw);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
};

const getCurrentUser = () => {
  for (const storage of [sessionStorage, localStorage]) {
    for (const key of ["userSession", "userCredentials"]) {
      try {
        const parsed = JSON.parse(storage.getItem(key) ?? "{}");
        const source = parsed?.data ?? parsed;
        const name = String(source?.cName ?? source?.cAgentName ?? source?.cUserName ?? "Testing Team").trim() || "Testing Team";
        const role = String(source?.cTypeName ?? source?.cRoleName ?? source?.cUserType ?? "Admin").trim() || "Admin";
        if (name !== "Self" || source?.id) return { name, role };
      } catch {
        // Ignore malformed legacy session values.
      }
    }
  }
  return { name: "Self", role: "Admin" };
};

const PunchInOutPage = () => {
  const basePayload = useMemo(() => getRequestPayload(), []);
  const [now, setNow] = useState(() => dayjs());
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryMonth, setSummaryMonth] = useState(() => dayjs().startOf("month"));
  const currentUser = useMemo(() => getCurrentUser(), []);
  const currentAgentId = String(basePayload.nAgentId ?? basePayload.id ?? "");
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [summaryAgent, setSummaryAgent] = useState<SharedAgentOption>({
    label: "Self",
    value: currentAgentId,
    role: currentUser.role,
    isSelf: true,
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(dayjs()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const enabled = Boolean(
    basePayload.nCompanyId && basePayload.cDbName && basePayload.cSchemaName,
  );
  const attendanceStatusPayload = useMemo(() => ({
    nAgentId: Number(basePayload.nAgentId ?? basePayload.id) || 0,
    nCompanyId: Number(basePayload.nCompanyId) || 0,
    cSchemaName: basePayload.cSchemaName,
    cDbName: basePayload.cDbName,
  }), [basePayload]);
  const attendanceDailyPayload = useMemo(() => ({
    ...attendanceStatusPayload,
    dDate: dayjs().format("YYYY-MM-DD"),
  }), [attendanceStatusPayload]);
  const agentPayload = useMemo(() => ({
    nCompanyId: basePayload.nCompanyId,
    cDbName: basePayload.cDbName,
    cSchemaName: basePayload.cSchemaName,
  }), [basePayload]);
  const agentQuery = useQuery({
    queryKey: ["attendance-agent-dropdown", agentPayload],
    queryFn: () => agentApis.agentDropDown(agentPayload),
    enabled: enabled && agentModalOpen,
  });
  const statusQuery = useQuery({
    queryKey: ["attendance-status", attendanceStatusPayload],
    queryFn: () => attendanceApis.attendanceStatus(attendanceStatusPayload),
    enabled,
  });
  const dailyQuery = useQuery({
    queryKey: ["attendance-summary-daily", attendanceDailyPayload],
    queryFn: () => attendanceApis.attendanceSummaryDaily(attendanceDailyPayload),
    enabled,
  });
  const monthlyPayload = useMemo(() => ({
    nCompanyId: attendanceStatusPayload.nCompanyId,
    nAgentId: Number(summaryAgent.value) || summaryAgent.value,
    nMonth: summaryMonth.month() + 1,
    nYear: summaryMonth.year(),
    cSchemaName: attendanceStatusPayload.cSchemaName,
    cDbName: attendanceStatusPayload.cDbName,
  }), [attendanceStatusPayload, summaryAgent.value, summaryMonth]);
  const monthlyQuery = useQuery({
    queryKey: ["attendance-summary-monthly", monthlyPayload],
    queryFn: () => attendanceApis.attendanceSummaryMonthly(monthlyPayload),
    enabled,
  });

  const status = rowsFrom(statusQuery.data)[0] ?? {};
  const dailyRows = rowsFrom(dailyQuery.data);
  const daily = dailyRows[0] ?? {};
  const monthlyRows = rowsFrom(monthlyQuery.data);
  const monthlyDays = Array.from({ length: summaryMonth.daysInMonth() }, (_, index) => summaryMonth.date(index + 1));
  const agentOptions = useMemo<SharedAgentOption[]>(() => {
    const source = agentQuery.data?.data ?? agentQuery.data?.result ?? agentQuery.data;
    const rows = Array.isArray(source) ? source : Array.isArray(source?.data) ? source.data : [];
    return rows.map((row: RecordLike) => {
      const type = Number(getValue(row, ["nType", "nUserType", "UserType", "userType"], 3));
      const roleFromApi = String(getValue(row, ["cRoleName", "cTypeName", "cUserType", "role"], "")).trim();
      const role = type === 2 ? "Supervisor" : roleFromApi || (type === 0 || type === 1 ? "Admin" : "Agent");
      return {
        label: String(getValue(row, ["cAgentName", "AgentName", "cName", "Name"], "Agent")),
        value: String(getValue(row, ["nAgentId", "AgentId", "id"])),
        role,
        isSelf: false,
      };
    }).filter((agent: SharedAgentOption) => agent.label);
  }, [agentQuery.data]);
  const selfOption = useMemo<SharedAgentOption>(() => ({
    label: currentUser.name,
    value: currentAgentId,
    role: "Self",
    isSelf: true,
  }), [currentAgentId, currentUser.name]);
  const visibleAgentOptions = useMemo(() => {
    const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();
    const seen = new Set<string>();
    const selfKey = `${normalize(selfOption.value)}::${normalize(selfOption.label)}`;
    const options = [selfOption, ...agentOptions].filter((agent) => {
      if (!agent.label) return false;
      const key = `${normalize(agent.value)}::${normalize(agent.label)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      if (key === selfKey) return true;
      const currentUserRow =
        (currentAgentId && String(agent.value) === currentAgentId) ||
        (normalize(currentUser.name) && normalize(agent.label) === normalize(currentUser.name));
      return !currentUserRow;
    });
    const search = agentSearch.trim().toLowerCase();
    return search
      ? options.filter((agent) => `${agent.label} ${agent.role ?? ""} ${agent.isSelf ? "self" : ""}`.toLowerCase().includes(search))
      : options;
  }, [agentOptions, agentSearch, currentAgentId, currentUser.name, selfOption]);

  const punchIn = getValue(status, ["cPunchInTime", "cPunchinTime", "dPunchInTime", "PunchInTime", "punchIn"]);
  const punchOut = getValue(status, ["cPunchOutTime", "cPunchoutTime", "dPunchOutTime", "PunchOutTime", "punchOut"]);
  const workingHours = getValue(status, ["cWorkingHrs", "cWorkingHours", "cWorkingTime", "cTotalWorkingHrs", "WorkingHrs", "WorkingHours", "workingHours"], "00:00:00");
  const rawStatus = String(getValue(status, ["cStatus", "AttendanceStatus", "status", "nStatus"], "")).toLowerCase();
  const isPunchedOut = Boolean(punchOut) || ["2", "out", "punch out", "punched out", "already punched out"].includes(rawStatus);
  const isPunchedIn = !isPunchedOut && (Boolean(punchIn) || ["1", "in", "punch in", "punched in"].includes(rawStatus));

  const dailyPunchIn = getValue(daily, ["cPunchInTime", "cPunchinTime", "dPunchInTime", "PunchInTime", "punchIn"], punchIn);
  const dailyPunchOut = getValue(daily, ["cPunchOutTime", "cPunchoutTime", "dPunchOutTime", "PunchOutTime", "punchOut"], punchOut);
  const dailyWorking = getValue(daily, ["cWorkingHrs", "cWorkingHours", "cWorkingTime", "cTotalWorkingHrs", "WorkingHrs", "WorkingHours", "workingHours"], workingHours);
  const calculatedWorkingSeconds = elapsedSeconds(punchIn || dailyPunchIn, punchOut || dailyPunchOut);
  const effectiveWorkingSeconds = Math.max(durationSeconds(workingHours), durationSeconds(dailyWorking), calculatedWorkingSeconds);
  const displayedWorkingHours = formatDuration(effectiveWorkingSeconds);
  const dailyDate = getValue(daily, ["dDate", "cDate", "AttendanceDate", "date"]);
  const punchinId = Number(
    getValue(status, ["nPunchinId", "nPunchInId", "PunchinId", "PunchInId", "id"], 0),
  ) || 0;
  const punchActionPayload = {
    nAgentId: Number(basePayload.nAgentId ?? basePayload.id) || 0,
    nCompanyId: Number(basePayload.nCompanyId) || 0,
    cLocation: "",
    cLattitude: "",
    cLongitude: "",
    cComment: "",
    cSchemaName: basePayload.cSchemaName,
    cDbName: basePayload.cDbName,
  };
  const loading = statusQuery.isLoading || dailyQuery.isLoading;
  const refreshing = statusQuery.isFetching || dailyQuery.isFetching || monthlyQuery.isFetching;
  const punchMutation = useMutation({
    mutationFn: () => isPunchedIn
      ? attendanceApis.punchOut({ ...punchActionPayload, nPunchinId: punchinId })
      : attendanceApis.punchIn(punchActionPayload),
    onSuccess: async () => {
      await Promise.all([
        statusQuery.refetch(),
        monthlyQuery.refetch(),
        dailyQuery.refetch(),
      ]);
      message.success(isPunchedIn ? "Punch out recorded." : "Punch in recorded.");
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || error?.message || "Unable to update attendance.");
    },
  });

  return (
    <section className="flex h-full min-h-0 flex-1 overflow-auto bg-white">
      <Spin spinning={loading} fullscreen={false} className="!w-full">
        <div className="grid min-h-[calc(100vh-65px)] w-full grid-cols-1 md:grid-cols-[52.5%_47.5%]">
          <div className="flex min-h-[590px] flex-col border-l-[5px] border-r border-l-sky-800 border-r-slate-200 px-4 py-3">
            {!isPunchedOut ? (
              <>
                <h1 className="m-0 text-base font-medium text-slate-950">
                  {isPunchedIn ? "Punch Out" : "Punch In"}
                </h1>
                <p className="mt-4 border-b border-slate-200 pb-2 text-[15px] text-slate-700">
                  Click the {isPunchedIn ? "Punch Out" : "Punch In"} button to log your {isPunchedIn ? "out" : "in"} time.
                </p>
              </>
            ) : null}
            <div className="mt-3 text-lg text-slate-700">{now.format("DD/MM/YYYY")}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-950">{now.format("hh:mm:ss A")}</div>

            {isPunchedOut ? (
              <p className="mt-5 text-base text-slate-900">Already Punched Out</p>
            ) : (
              <button
                type="button"
                onClick={() => punchMutation.mutate()}
                disabled={refreshing || punchMutation.isPending}
                className={`mt-4 flex h-44 w-44 cursor-pointer items-center justify-center self-start rounded-full border-[11px] text-lg font-semibold text-white shadow-[inset_0_0_0_12px_rgba(0,0,0,0.06)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-wait disabled:opacity-80 ${
                  isPunchedIn
                    ? "border-rose-400 bg-rose-500"
                    : "border-emerald-400 bg-emerald-500"
                }`}
                aria-label={isPunchedIn ? "Punch Out" : "Punch In"}
              >
                {isPunchedIn ? "Punch Out" : "Punch In"}
              </button>
            )}

            <div className="mt-auto border-t border-slate-200 pt-8 text-[13px] text-slate-800">
              <div className="mb-2">Punch in Time : <strong>{displayTime(punchIn, "-", true)}</strong></div>
              <div className="mb-2">Punch out Time : <strong>{displayTime(punchOut, "-", true)}</strong></div>
              <div>Working Hrs <strong className="text-lg text-slate-950">{displayedWorkingHours}</strong></div>
            </div>
          </div>

          <div className="flex min-h-[590px] flex-col bg-[#edf8ff]">
            <div className="flex justify-end px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setSummaryMonth(dayjs().startOf("month"));
                  setSummaryOpen(true);
                }}
                className="cursor-pointer rounded-full bg-sky-400 px-7 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-500 active:bg-sky-600"
              >
                View Attendance Summary
              </button>
            </div>
            <div className="px-5 pt-5">
              <h2 className="m-0 text-xl font-medium text-slate-950">Last Day Punch In Details</h2>
              <div className="mt-4 flex justify-center">
                <img src={punchIllustration} alt="Attendance summary" className="h-[260px] max-w-full object-contain" />
              </div>
            </div>
            <div className="mt-auto border-t border-cyan-100 bg-[#ecfffd]">
              <div className="px-1 py-2 text-sm text-slate-800">
                {displayDate(dailyDate, now.format("DD/MM/YYYY"))}
              </div>
              <div className="grid grid-cols-3 divide-x divide-cyan-100 border-t border-cyan-100">
                <SummaryMetric icon={clockGreen} color="text-teal-500" label="Punch In" value={displayTime(dailyPunchIn)} />
                <SummaryMetric icon={clockMagenta} color="text-pink-500" label="Punch Out" value={displayTime(dailyPunchOut)} />
                <SummaryMetric icon={clockGrey} color="text-lime-600" label="Working Hrs" value={displayedWorkingHours} />
              </div>
            </div>
          </div>
        </div>
      </Spin>

      <Modal
        open={summaryOpen}
        onCancel={() => setSummaryOpen(false)}
        footer={null}
        title="Attendance Summary"
        width={490}
        centered
        styles={{ body: { padding: 0 }, header: { marginBottom: 0 } }}
      >
        <Spin spinning={monthlyQuery.isLoading || monthlyQuery.isFetching}>
          <div className="border-t border-slate-100">
            <div className="flex h-[62px] items-center justify-between px-2">
              <div className="flex items-center gap-7">
                <button type="button" onClick={() => setSummaryMonth((month) => month.subtract(1, "month"))} className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-400 text-sky-500 hover:bg-sky-50" aria-label="Previous month">
                  <LeftOutlined />
                </button>
                <span className="min-w-[58px] text-xs font-medium text-sky-800">{summaryMonth.format("YYYY MMMM")}</span>
                <button type="button" onClick={() => setSummaryMonth((month) => month.add(1, "month"))} className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 text-sky-300 hover:bg-sky-50" aria-label="Next month">
                  <RightOutlined />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAgentSearch("");
                  setExpandedAgentId(null);
                  setAgentModalOpen(true);
                  void agentQuery.refetch();
                }}
                className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-sky-300 bg-sky-50 px-2 text-xs text-slate-600 hover:bg-sky-100"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-200 text-sky-800">{(summaryAgent.label[0] || "S").toUpperCase()}</span>
                <span>({summaryAgent.label}) ({summaryAgent.role || "Agent"})</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500"><img src={profileSwitch} alt="" className="h-4 w-4 brightness-0 invert" /></span>
              </button>
            </div>
            <div className="grid grid-cols-[100px_96px_96px_1fr] bg-sky-100 px-4 py-2 text-xs font-medium text-sky-900">
              <span>Date</span><span>Punch In</span><span>Punch Out</span><span className="text-right">Working Hrs</span>
            </div>
            <div className="max-h-[430px] overflow-y-auto overflow-x-hidden">
              {monthlyDays.map((date) => {
                const row = monthlyRows.find((item) => dateKey(getValue(item, ["dDate", "cDate", "AttendanceDate", "date"])) === date.format("YYYY-MM-DD")) ?? {};
                const rowPunchIn = getValue(row, ["cPunchInTime", "cPunchinTime", "dPunchInTime", "PunchInTime"]);
                const rowPunchOut = getValue(row, ["cPunchOutTime", "cPunchoutTime", "dPunchOutTime", "PunchOutTime"]);
                const rowWorking = getValue(row, ["cWorkingHrs", "cWorkingHours", "cWorkingTime", "WorkingHrs", "WorkingHours"]);
                const rowDuration = Math.max(durationSeconds(rowWorking), elapsedSeconds(rowPunchIn, rowPunchOut));
                return (
                  <div key={date.format("YYYY-MM-DD")} className="grid min-h-8 grid-cols-[100px_96px_96px_1fr] items-center border-b border-slate-100 px-4 py-2 text-[11px] text-slate-600">
                    <span>{date.format("DD ddd")}</span>
                    <span>{displayTime(rowPunchIn, "-")}</span>
                    <span>{displayTime(rowPunchOut, "-")}</span>
                    <span className="text-right">{rowDuration ? formatDuration(rowDuration) : "-"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Spin>
      </Modal>

      <AgentSelectorModal
        open={agentModalOpen}
        loading={agentQuery.isLoading || agentQuery.isFetching}
        options={visibleAgentOptions}
        selectedValue={summaryAgent.value}
        search={agentSearch}
        expandedAgentId={expandedAgentId}
        selfOption={selfOption}
        onSearch={setAgentSearch}
        onSelect={(agent) => {
          setSummaryAgent(agent);
          setAgentModalOpen(false);
        }}
        onExpandedChange={setExpandedAgentId}
        onClose={() => setAgentModalOpen(false)}
      />
    </section>
  );
};

const SummaryMetric = ({ icon, color, label, value }: { icon: string; color: string; label: string; value: string }) => (
  <div className="px-2 py-7">
    <div className="flex items-center gap-1 text-sm text-slate-500">
      <img src={icon} alt="" className="h-4 w-4" aria-hidden="true" />
      {label}
    </div>
    <div className={`mt-1 text-xl font-medium ${color}`}>{value}</div>
  </div>
);

export default PunchInOutPage;
