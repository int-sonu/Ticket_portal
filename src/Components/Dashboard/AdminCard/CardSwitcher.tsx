import { useNavigate } from "react-router-dom";
import type { Dispatch, SetStateAction } from "react";

import type { AgentDetails } from "./Utils";

type Props = {
  agentDetails: AgentDetails;
  cAgentId: string;
  handleIdChange: (newId: number) => void;
  handleAgentId: (id: string) => void;
  NoViewAll?: boolean;
  setAgentUnderSupervisorCount?: Dispatch<
    SetStateAction<number>
  >;
};

const getAgentName = (agent: AgentDetails) =>
  String(
    agent?.cAgentName ??
      agent?.agentName ??
      agent?.name ??
      "Agent"
  );

const getAgentShortName = (agent: AgentDetails) =>
  String(
    agent?.cAgentshName ??
      agent?.shortName ??
      getAgentName(agent)
        .slice(0, 2)
        .toUpperCase()
  );

const CardSwitcher = ({
  agentDetails,
  handleIdChange,
  handleAgentId,
}: Props) => {
  const navigate = useNavigate();
  const agentId = Number(agentDetails?.nAgentId ?? 0);
  const agentName = getAgentName(agentDetails);
  const shortName = getAgentShortName(agentDetails);
  const ticketCount = Number(
    agentDetails?.nAssignTicketCount ??
      agentDetails?.nTicketCount ??
      agentDetails?.ticketCount ??
      0
  );
  const visitCount = Number(agentDetails?.nSiteVistCount ?? 0);

  const openAgentTickets = () => {
    const params = new URLSearchParams({
      agentId: String(agentId),
      agentName,
    });

    navigate(`/tickets/agenttickets?${params.toString()}`, {
      state: {
        agentId,
        agentName,
        returnTo: window.location.pathname + window.location.search,
      },
    });
  };

  return (
    <div className="flex w-full items-center justify-between rounded-md border border-slate-100 bg-white px-3 py-2 text-left transition-colors hover:bg-sky-50">
      <span className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-300 text-sm font-semibold text-white"
          onClick={() => {
            handleIdChange(agentId);
            handleAgentId(String(agentId));
          }}
        >
          {shortName}
        </button>
        <button
          type="button"
          className="text-sm font-medium text-slate-900"
          onClick={() => {
            handleIdChange(agentId);
            handleAgentId(String(agentId));
          }}
        >
          {agentName}
        </button>
      </span>

      <button
        type="button"
        className="flex items-center gap-1 rounded-md border-b border-blue-500 px-0 pb-0.5 text-sm text-blue-600"
        onClick={(event) => {
          event.stopPropagation();
          openAgentTickets();
        }}
        >
        <span>{ticketCount} Tickets</span>
        <span className="text-base leading-none">⌂</span>
        <span>{visitCount}</span>
      </button>
    </div>
  );
};

export default CardSwitcher;
