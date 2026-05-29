import {
  useTicketListAll,
  useTicketListActive,
  useTicketOngoing,
  useTicketUpcoming,
  useTicketUnAssigned,
  useClosedTicketList,
} from "../../../Hooks/Ticket/useTicketQueries";

interface TicketListServiceProps {
  ticketType: string;
  payload: any;
}

export const useTicketListService = ({
  ticketType,
  payload,
}: TicketListServiceProps) => {
  const allTickets =
    useTicketListAll(payload);

  const activeTickets =
    useTicketListActive(payload);

  const ongoingTickets =
    useTicketOngoing(payload);

  const upcomingTickets =
    useTicketUpcoming(payload);

  const unassignedTickets =
    useTicketUnAssigned(payload);

  const closedTickets =
    useClosedTicketList(payload);

  switch (ticketType) {
    case "ACTIVE":
      return activeTickets;

    case "ONGOING":
      return ongoingTickets;

    case "UPCOMING":
      return upcomingTickets;

    case "UNASSIGNED":
      return unassignedTickets;

    case "CLOSED":
      return closedTickets;

    default:
      return allTickets;
  }
};