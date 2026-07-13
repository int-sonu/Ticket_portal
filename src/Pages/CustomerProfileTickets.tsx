import { SearchOutlined } from "@ant-design/icons";
import { Button, Empty, Input, Popover, Radio, Spin } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCustomerWiseAllTicketList } from "../Hooks/Ticket/useTicketQueries";
import { useGetAgentDropdown } from "./Master/Agent/Hooks";
import { useGetStatuses } from "./Master/StatusMaster/Hooks";
import { extractList } from "./Master/Common/SimpleMasterUtils";
import { getRequestPayload } from "../Utils/requestPayload";
import TicketModulePagination from "./Ticket/Common/TicketModulePagination";
import filterdetails from "../assets/icons/filterdetails.svg";


interface CustomerProfileTicketsProps {
  customerId: string | number;
  customerName: string;
}

type ApiRecord = Record<string, unknown>;

const getValue = (record: unknown, keys: string[]) => {
  if (!record || typeof record !== "object") return "";
  const source = record as ApiRecord;

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }

  const matchedKey = Object.keys(source).find((key) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
  );
  return matchedKey ? source[matchedKey] : "";
};

const text = (value: unknown, fallback = "-") =>
  String(value ?? "").trim() || fallback;

const parseTicketDate = (value: unknown) => {
  if (!value) return null;
  const source = String(value).trim();
  const direct = new Date(source);
  if (!Number.isNaN(direct.getTime())) return direct;

  const match = source.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?/i,
  );
  if (!match) return null;

  const [, day, month, year, rawHour = "0", minute = "0", meridiem] = match;
  let hour = Number(rawHour);
  if (meridiem?.toUpperCase() === "PM" && hour < 12) hour += 12;
  if (meridiem?.toUpperCase() === "AM" && hour === 12) hour = 0;

  const parsed = new Date(Number(year), Number(month) - 1, Number(day), hour, Number(minute));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateTime = (value: unknown) => {
  const parsed = parseTicketDate(value);
  if (!parsed) return text(value);

  return `${parsed.toLocaleDateString("en-GB")} ${parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
};

const formatTicketAge = (value: unknown) => {
  const parsed = parseTicketDate(value);
  if (!parsed) return "";

  const totalMinutes = Math.floor(Math.max(Date.now() - parsed.getTime(), 0) / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return `${days}D ${hours}h ${minutes}m`;
};

const toOptions = (response: unknown, valueKeys: string[], labelKeys: string[]) =>
  extractList(response).map((item: unknown, index: number) => ({
    value: String(getValue(item, valueKeys) || index),
    label: text(getValue(item, labelKeys)),
  }));

const CustomerProfileTickets = ({ customerId, customerName }: CustomerProfileTicketsProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<string>();
  const [agent, setAgent] = useState<string>();
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<string>();
  const [draftAgent, setDraftAgent] = useState<string>();

  const payload = useMemo(() => ({
    ...getRequestPayload(),
    CustomerId: customerId,
    customerId,
    nCustomerId: customerId,
    CustomerName: customerName,
    cCustomerName: customerName,
    pageNumber: 1,
    pageSize: 1000,
  }), [customerId, customerName]);

  const ticketsQuery = useCustomerWiseAllTicketList(payload, Boolean(customerId));
  const statusQuery = useGetStatuses(payload);
  const agentQuery = useGetAgentDropdown(payload);

  const statusOptions = useMemo(() => toOptions(
    statusQuery.data,
    ["nTicketStatusId", "nStatusId", "StatusId", "id"],
    ["cTicketStatus", "cStatusName", "StatusName", "name"],
  ), [statusQuery.data]);
  const agentOptions = useMemo(() => toOptions(
    agentQuery.data,
    ["nAgentId", "AgentId", "id"],
    ["cAgentName", "AgentName", "name"],
  ), [agentQuery.data]);
  const rows = useMemo(() => extractList(ticketsQuery.data), [ticketsQuery.data]);
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const selectedStatus = statusOptions.find((option) => option.value === status)?.label.toLowerCase();
    const selectedAgent = agentOptions.find((option) => option.value === agent)?.label.toLowerCase();

    return rows.filter((row: unknown) => {
      const ticketStatus = text(getValue(row, ["cTicketStatus", "Status", "StatusName"]), "").toLowerCase();
      const ticketAgent = text(getValue(row, ["cAgentName", "AgentName", "AssignedAgent"]), "").toLowerCase();
      const ticketActivity = text(getValue(row, ["cRepairItemActivity", "cActivityName", "ActivityName"]), "").toLowerCase();
      const searchable = [
        getValue(row, ["nTicketNo", "TicketNo", "cTicketNo"]),
        getValue(row, ["cTicketSummary", "TicketSummary", "cSummary", "cDescription"]),
        ticketStatus,
        ticketAgent,
        ticketActivity,
      ].join(" ").toLowerCase();

      return (!term || searchable.includes(term))
        && (!selectedStatus || ticketStatus === selectedStatus)
        && (!selectedAgent || ticketAgent === selectedAgent);
    });
  }, [agent, agentOptions, rows, search, status, statusOptions]);

  const total = filteredRows.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openFilters = () => {
    setDraftStatus(status);
    setDraftAgent(agent);
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setStatus(draftStatus);
    setAgent(draftAgent);
    setPage(1);
    setFilterOpen(false);
  };

  const openFollowUp = (row: unknown) => {
    const ticketId = Number(getValue(row, ["nTicketId", "TicketId", "nTicketid"]) || 0);
    if (!ticketId) return;

    navigate(`/tickets/view/${ticketId}`, {
      state: {
        selectedRow: row,
        isFrom: "followup",
      },
    });
  };

  const filterPanel = (
    <div className="flex h-[430px] w-[335px] flex-col">
      <h2 className="m-0 border-b px-3 pb-3 text-lg font-medium">Apply Filter</h2>
      <section className="border-b px-3 py-3">
        <h3 className="mb-3 text-base font-medium">Status</h3>
        <div className="h-[135px] overflow-y-auto pr-2">
          <Radio.Group value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {statusOptions.map((option) => <Radio key={option.value} value={option.value} className="block w-full">{option.label}</Radio>)}
          </Radio.Group>
        </div>
      </section>
      <section className="min-h-0 flex-1 px-3 py-4">
        <h3 className="mb-3 text-base font-medium">Agent</h3>
        <div className="max-h-[145px] overflow-y-auto pr-2">
          <Radio.Group value={draftAgent} onChange={(event) => setDraftAgent(event.target.value)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {agentOptions.map((option) => <Radio key={option.value} value={option.value} className="block w-full">{option.label}</Radio>)}
          </Radio.Group>
        </div>
      </section>
      <div className="flex flex-none justify-end gap-4 px-3 pt-2">
        <Button className="h-10 min-w-[83px] border-emerald-500 text-emerald-500" onClick={() => setFilterOpen(false)}>Cancel</Button>
        <Button
          type="primary"
          className="h-10 min-w-[78px]"
          style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
          onClick={applyFilters}
        >
          Apply
        </Button>
      </div>
    </div>
  );

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden p-5">
      <div className="flex flex-none flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-medium">{customerName} Tickets</h2>
        <div className="flex gap-3">
          <Input className="w-[205px]" prefix={<SearchOutlined className="text-slate-400" />} placeholder="Search" allowClear value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          <Popover
            content={filterPanel}
            trigger="click"
            placement="bottomRight"
            arrow={false}
            open={filterOpen}
            onOpenChange={(open) => open ? openFilters() : setFilterOpen(false)}
          >
            <button type="button" aria-label="Open ticket filters">
              <img src={filterdetails} alt="" className="h-8 w-8 cursor-pointer rounded border p-1" />
            </button>
          </Popover>
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden border-b">
        <div className="sticky top-0 z-10 grid w-full grid-cols-[40px_minmax(145px,1.35fr)_80px_minmax(150px,2fr)_80px_100px] border-y bg-white px-2 py-3 text-xs font-medium shadow-[0_1px_0_rgba(226,232,240,1)]">
          <span>Srl</span><span>Created Date &amp; Time</span><span>Ticket No.</span><span>Ticket Summary</span><span>Priority</span><span>Status</span>
        </div>
        {ticketsQuery.isFetching ? (
          <div className="flex h-72 items-center justify-center"><Spin /></div>
        ) : visibleRows.length ? visibleRows.map((row: unknown, index: number) => {
          const ticketId = Number(getValue(row, ["nTicketId", "TicketId", "nTicketid"]) || 0);
          const createdDate = getValue(row, ["dCreatedDate", "CreatedDate", "CreatedDateTime", "dCreatedOn"]);
          const age = formatTicketAge(createdDate);
          const activitySummary = text(getValue(row, [
            "cViewSummary",
            "ViewSummary",
            "cHistorySummary",
            "HistorySummary",
            "cActivity",
            "Activity",
            "ActivityDescription",
          ]), "");
          return (
            <button
              type="button"
              key={ticketId || `${safePage}-${index}`}
              className="grid min-h-[74px] w-full grid-cols-[40px_minmax(145px,1.35fr)_80px_minmax(150px,2fr)_80px_100px] items-center border-b px-2 text-left text-xs hover:bg-slate-50"
              onClick={() => openFollowUp(row)}
            >
              <span>{(safePage - 1) * pageSize + index + 1}</span>
              <span className="space-y-1 pr-3">
                <span className="block">
                  {formatDateTime(createdDate)}{age ? <span className="ml-1 text-slate-400">({age})</span> : null}
                </span>
                {activitySummary ? <span className="block text-[10px] leading-4 text-blue-600">{activitySummary}</span> : null}
              </span>
              <span>{text(getValue(row, ["nTicketNo", "TicketNo", "cTicketNo"]))}</span>
              <span className="pr-3">{text(getValue(row, ["cTicketSummary", "TicketSummary", "cSummary", "cDescription"]))}</span>
              <span>{text(getValue(row, ["cPriorityName", "PriorityName", "Priority", "cPriority"]))}</span>
              <span>{text(getValue(row, ["cTicketStatus", "StatusName", "Status"]))}</span>
            </button>
          );
        }) : (
          <div className="flex h-72 items-center justify-center"><Empty description={ticketsQuery.isError ? "Unable to load customer tickets" : "No tickets found"} /></div>
        )}
      </div>

      <TicketModulePagination
        className="w-full flex-none"
        elevated={false}
        current={safePage}
        pageSize={pageSize}
        total={total}
        onChange={(nextPage, size) => { setPage(nextPage); setPageSize(size); }}
        onShowSizeChange={(nextPage, size) => { setPage(nextPage); setPageSize(size); }}
      />
    </section>
  );
};

export default CustomerProfileTickets;
