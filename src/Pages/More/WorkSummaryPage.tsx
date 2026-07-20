import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import dayjs from "dayjs";

import { agentApis } from "../../Axios/MasterApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import AgentSelectorModal from "./AgentSelectorModal";
import type { SharedAgentOption } from "./AgentSelectorModal";
import CustomerTicketChart from "../CustomerTicketChart";
import DateFilterIconPopover from "../../ui/CalendarPopup/DateFilterIconPopover";

// Helper assets
import filterIcon from "../../assets/icons/searchFilterIcon.svg";
import groupVisitImg from "../../assets/images/workSummaryGroupvisitimg.png";
import topExpenseImg from "../../assets/images/topExpensiveImg.png";
import topExpenseIcon from "../../assets/icons/topExpenseIcon.svg";
import otherExpenseIcon from "../../assets/icons/otherExpenseIcon.svg";
import profileSwitch from "../../assets/icons/profile-switch.svg";

const text = (value: unknown, fallback = "") => String(value ?? "").trim() || fallback;

const numberValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getCurrentAgent = () => {
  for (const storage of [sessionStorage, localStorage]) {
    for (const key of ["userSession", "userCredentials"]) {
      try {
        const parsed = JSON.parse(storage.getItem(key) ?? "{}");
        const source = parsed?.data ?? parsed;
        const name = text(source?.cAgentName ?? source?.cName ?? source?.cUserName ?? source?.Name);
        if (name) {
          const role = text(source?.cTypeName ?? source?.cRoleName ?? source?.cUserType, "Agent");
          return { name, role };
        }
      } catch {
        // Ignore malformed legacy session values.
      }
    }
  }
  return { name: "Self", role: "Agent" };
};

const getValue = (record: Record<string, any>, keys: string[], fallback: any = "") => {
  if (!record || typeof record !== "object") return fallback;
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") return record[key];
  }
  // Try case insensitive
  const entries = Object.entries(record);
  for (const key of keys) {
    const lower = key.toLowerCase();
    const match = entries.find(([k]) => k.toLowerCase() === lower);
    if (match && match[1] !== undefined && match[1] !== null && match[1] !== "") return match[1];
  }
  return fallback;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const WorkSummaryPage = () => {
  const basePayload = useMemo(() => getRequestPayload(), []);
  const currentAgent = useMemo(() => getCurrentAgent(), []);
  const currentAgentId = String(basePayload.nAgentId ?? basePayload.id ?? "");
  const currentUserName = currentAgent.name;
  const currentUserRole = currentAgent.role;

  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(() => dayjs().toDate());
  const [draftMonth, setDraftMonth] = useState(() => dayjs().startOf("month").toDate());
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  
  const [selectedAgent, setSelectedAgent] = useState<SharedAgentOption>({
    label: currentUserName,
    value: currentAgentId,
    role: currentUserRole,
    isSelf: true,
  });

  // Fetch Agent dropdown
  const agentDropdownPayload = useMemo(() => ({
    nCompanyId: basePayload.nCompanyId,
    cSchemaName: basePayload.cSchemaName,
    cDbName: basePayload.cDbName,
  }), [basePayload]);

  const {
    data: agentResponse,
    isFetching: isAgentFetching,
    refetch: refetchAgentDropdown,
  } = useQuery({
    queryKey: ["work-summary-agent-dropdown", agentDropdownPayload],
    queryFn: () => agentApis.agentDropDown(agentDropdownPayload),
    enabled: !!basePayload.nCompanyId,
    refetchOnMount: "always",
  });

  const agentOptions = useMemo<SharedAgentOption[]>(() => {
    let rows: any[] = [];
    if (agentResponse) {
      // Safely extract rows using fallback checks
      const extracted = agentResponse.data || agentResponse.result || agentResponse;
      rows = Array.isArray(extracted) ? extracted : Array.isArray(extracted?.data) ? extracted.data : [];
    }
    const options = rows.map((row: any) => ({
      label: text(getValue(row, ["cAgentName", "AgentName", "cName", "Name"]), "Agent"),
      value: text(getValue(row, ["nAgentId", "AgentId", "id"])),
      role: text(getValue(row, ["cRoleName", "cTypeName", "role", "cUserType"]), "Agent"),
    })).filter((option) => option.value);

    const self = { label: currentUserName, value: currentAgentId, role: currentUserRole, isSelf: true };
    const seen = new Set<string>();
    return [self, ...options].filter((option) => {
      if (!option.value || seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    });
  }, [agentResponse, currentAgentId, currentUserName, currentUserRole]);

  const visibleAgents = useMemo(() => {
    const search = agentSearch.trim().toLowerCase();
    if (!search) return agentOptions;
    return agentOptions.filter((agent) =>
      `${agent.label} ${agent.role}`.toLowerCase().includes(search)
    );
  }, [agentOptions, agentSearch]);

  // Fetch Work Summary Data
  const workSummaryPayload = useMemo(() => ({
    cAgentId: selectedAgent.value,
    dDate: selectedDate.format("YYYY/MM/DD"),
    nCompanyId: basePayload.nCompanyId,
    cSchemaName: basePayload.cSchemaName,
    cDbName: basePayload.cDbName,
  }), [basePayload, selectedAgent.value, selectedDate]);

  const { data: summaryResponse, isLoading: isSummaryLoading, isFetching: isSummaryFetching } = useQuery({
    queryKey: ["agent-work-summary", workSummaryPayload],
    queryFn: () => agentApis.workSummary(workSummaryPayload),
    enabled: !!basePayload.nCompanyId && !!selectedAgent.value,
  });

  const summaryData = useMemo(() => {
    const source = summaryResponse?.data || summaryResponse?.result || summaryResponse || {};
    const raw = Array.isArray(source) ? source[0] ?? {} : source;
    
    const workingHrs = text(getValue(raw, ["cTotalWorkingHrs", "TotalWorkingHrs", "workingHours", "totalWorkingHrs", "workingHrs"]), "00 hrs 00 mins");
    const attended = numberValue(getValue(raw, ["nTotalTicketCount", "nAttendedTickets", "AttendedTickets", "attendedTickets", "totalTickets"], 0));
    const resolved = numberValue(getValue(raw, ["nResolvedTicketCount", "nResolvedTickets", "ResolvedTickets", "resolvedTickets", "resolved"], 0));
    const unresolved = numberValue(getValue(raw, ["nUnresolvedTicketCount", "nUnresolvedTickets", "UnresolvedTickets", "unresolved"], 0));
    
    const website = numberValue(getValue(raw, ["nWebsite", "website", "nWebsiteCount", "websiteTickets"], 0));
    const direct = numberValue(getValue(raw, ["nDirect", "direct", "nDirectCount", "directTickets"], 0));
    const call = numberValue(getValue(raw, ["nCall", "call", "nCallCount", "callTickets"], 0));
    const email = numberValue(getValue(raw, ["nEmail", "nEmailCount", "email", "emailTickets", "nMailCount"], 0));
    const message = numberValue(getValue(raw, ["nMessage", "nMessageCount", "message", "messageTickets", "nSmsCount"], 0));
    
    const generalVisit = numberValue(getValue(raw, ["nGeneralVists", "nGeneralVisit", "GeneralVisit", "generalVisit", "generalVisitCount"], 0));
    const travelExpense = numberValue(getValue(raw, ["nTravelExpense", "TravelExpense", "travelExpense", "travel"], 0));
    const travelDistance = numberValue(getValue(raw, ["nTraveledKm", "nTravelDistance", "TravelDistance", "travelDistance", "distance", "nTotalDistance"], 0));
    const otherExpense = numberValue(getValue(raw, ["nOtherExpenses", "nOtherExpense", "OtherExpense", "otherExpense", "other"], 0));
    const totalExpense = numberValue(getValue(raw, ["nTotalExpenses", "nTotalExpense", "TotalExpense", "totalExpense", "expense"], travelExpense + otherExpense));
    const modeDetails = getValue(raw, ["modewiseDtls", "ModewiseDtls", "modeWiseDetails"], []);
    const modes = Array.isArray(modeDetails) && modeDetails.length
      ? modeDetails.map((mode: Record<string, any>, index: number) => ({
          key: getValue(mode, ["nCallModeId", "nModeId", "id"], index),
          name: text(getValue(mode, ["cCallModeName", "cModeName", "name"]), "Mode"),
          count: numberValue(getValue(mode, ["nTicketCount", "nCount", "count"], 0)),
        }))
      : [
          { key: "website", name: "Website", count: website },
          { key: "direct", name: "Direct", count: direct },
          { key: "call", name: "CALL", count: call },
          { key: "email", name: "E-Mail", count: email },
          { key: "message", name: "Message", count: message },
        ];

    return {
      workingHrs,
      attended,
      resolved,
      unresolved,
      website,
      direct,
      call,
      email,
      message,
      generalVisit,
      totalExpense,
      travelExpense,
      travelDistance,
      otherExpense,
      modes,
    };
  }, [summaryResponse]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-auto bg-white p-5 lg:overflow-y-hidden">
      <header className="flex flex-none flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-lg font-medium text-slate-950">Work Summary</h1>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setAgentSearch("");
              setExpandedAgentId(null);
              setAgentModalOpen(true);
              void refetchAgentDropdown();
            }}
            className="flex h-10 min-w-[200px] items-center justify-between rounded-lg border border-sky-200 bg-sky-50 px-3 text-left hover:bg-sky-100/60"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-300 text-xs font-semibold text-slate-800">
                {(selectedAgent.label[0] || "S").toUpperCase()}
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-sm font-medium text-slate-700">{selectedAgent.label}</span>
                <span className="text-[10px] text-slate-500">{selectedAgent.role}</span>
              </span>
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500">
              <img src={profileSwitch} alt="" className="h-4 w-4 brightness-0 invert" />
            </span>
          </button>

          <span className="text-sm text-slate-950">{selectedDate.format("DD/MM/YYYY")}</span>
          <DateFilterIconPopover
            open={calendarOpen}
            iconSrc={filterIcon}
            alt="Open date filter"
            ariaLabel="Filter work summary by date"
            title="Filter"
            month={draftMonth}
            selectedDate={draftDate}
            onOpenToggle={() => {
              if (!calendarOpen) {
                const current = selectedDate.toDate();
                setDraftDate(current);
                setDraftMonth(new Date(current.getFullYear(), current.getMonth(), 1));
              }
              setCalendarOpen((current) => !current);
            }}
            onMonthChange={setDraftMonth}
            onYearChange={setDraftMonth}
            onSelectDate={setDraftDate}
            onApply={() => {
              setSelectedDate(dayjs(draftDate));
              setCalendarOpen(false);
            }}
            onCancel={() => setCalendarOpen(false)}
          />
        </div>
      </header>

      <Spin spinning={isSummaryLoading || isSummaryFetching}>
        <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <div className="flex h-[60px] items-center justify-between rounded-[5px] border border-[#d8efff] bg-[#e7f4fd] px-3">
              <p className="m-0 text-base font-medium text-[#0d71b5]">Total Working Hrs</p>
              <p className="m-0 text-xl font-semibold text-[#0d71b5]">{summaryData.workingHrs}</p>
            </div>

            <div className="mt-2 [&>section]:h-[455px] [&>section]:rounded-[10px] [&>section]:border-[#deeef6]">
              <CustomerTicketChart
                total={summaryData.attended}
                resolved={summaryData.resolved}
                unresolved={summaryData.unresolved}
                modes={summaryData.modes}
              />
            </div>
          </div>

          <div className="h-full min-w-0 rounded-[10px] border border-[#f4f4f4] px-3 py-2">
            <div
              className="flex h-[60px] items-center justify-between rounded-[5px] border border-[#f2dede] bg-[#f2dede] bg-cover px-3"
              style={{ backgroundImage: `url(${groupVisitImg})` }}
            >
              <p className="m-0 text-base font-semibold text-[#d46060]">General Visit</p>
              <p className="m-0 text-xl font-semibold text-[#d46060]">{String(summaryData.generalVisit).padStart(2, "0")}</p>
            </div>

            <div className="mt-2 flex h-[440px] flex-col rounded-[5px] bg-gradient-to-b from-[#def2ee] via-[#f9f9f9] to-[#ddf1ed]">
              <div className="flex items-center justify-between border-b border-[#c6ece5] px-3 py-3">
                <p className="m-0 text-base font-semibold text-[#2d6a8c]">Total Expense</p>
                <p className="m-0 text-[26px] font-semibold text-[#deb940]">{formatCurrency(summaryData.totalExpense)}</p>
              </div>
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <img src={topExpenseImg} alt="Expense summary" className="max-h-[210px] w-[240px] object-contain" />
              </div>
              <div className="px-3 py-2">
                <div className="flex items-center justify-between border-b border-dashed border-[#c2e3f6] pb-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white">
                      <img src={topExpenseIcon} alt="" className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 text-base font-medium text-[#2d6a8c]">Travel Expense</p>
                      <p className="m-0 text-[13px] text-[#587b8f]">(Total Travel Distance : {summaryData.travelDistance} Km)</p>
                    </div>
                  </div>
                  <p className="m-0 text-xl font-semibold text-[#2d6a8c]">{formatCurrency(summaryData.travelExpense)}</p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                      <img src={otherExpenseIcon} alt="" className="h-5 w-5" />
                    </span>
                    <p className="m-0 text-base font-medium text-[#2d6a8c]">Other Expense</p>
                  </div>
                  <p className="m-0 text-xl font-semibold text-[#2d6a8c]">{formatCurrency(summaryData.otherExpense)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Spin>

      {/* Agent Selector Modal */}
      <AgentSelectorModal
        open={agentModalOpen}
        loading={isAgentFetching}
        options={visibleAgents}
        selectedValue={selectedAgent.value}
        search={agentSearch}
        expandedAgentId={expandedAgentId}
        selfOption={{ label: currentUserName, value: currentAgentId, role: currentUserRole, isSelf: true }}
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

export default WorkSummaryPage;
