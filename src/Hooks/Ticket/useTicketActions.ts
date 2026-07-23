import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { ticketApis } from "../../Axios/TicketsApi";

export const useTicketActions = () => {
  const queryClient =
    useQueryClient();

  const refreshTickets = () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const [rootKey] = query.queryKey;

        return (
          typeof rootKey === "string" &&
          (rootKey.startsWith("ticket") ||
            rootKey === "overdue-ticket-list" ||
            rootKey === "postponed-ticket-list" ||
            rootKey === "created-ticket-list" ||
            rootKey === "assign-agent-ticket-list" ||
            rootKey === "customer-wise-active-ticket-list")
        );
      },
    });
  };

  const assignTicket = useMutation({
    mutationFn: ticketApis.assignTicket,
    onSuccess: refreshTickets,
  });

  const updateTicket = useMutation({
    mutationFn: ticketApis.ticketUpdate,
    onSuccess: refreshTickets,
  });

  const acceptTicket = useMutation({
    mutationFn: ticketApis.acceptTicket,
    onSuccess: refreshTickets,
  });

  const shareTicket = useMutation({
    mutationFn: ticketApis.shareTicket,
    onSuccess: refreshTickets,
  });

  const unShareTicket = useMutation({
    mutationFn: ticketApis.unShareTicket,
    onSuccess: refreshTickets,
  });

  const transferTicket = useMutation({
    mutationFn: ticketApis.transferTicket,
    onSuccess: refreshTickets,
  });

  const unTransferTicket =
    useMutation({
      mutationFn:
        ticketApis.unTransferTicket,
      onSuccess: refreshTickets,
    });

  const mergeTicket = useMutation({
    mutationFn: ticketApis.mergeTicket,
    onSuccess: refreshTickets,
  });

  const unMergeTicket =
    useMutation({
      mutationFn:
        ticketApis.unMergeTicket,
      onSuccess: refreshTickets,
    });

  const reopenTicket =
    useMutation({
      mutationFn:
        ticketApis.reopenTicket,
      onSuccess: refreshTickets,
    });

  const updateTicketStatus =
    useMutation({
      mutationFn:
        ticketApis.updateTicketStatus,
      onSuccess: refreshTickets,
    });

  return {
    assignTicket,
    updateTicket,
    acceptTicket,

    shareTicket,
    unShareTicket,

    transferTicket,
    unTransferTicket,

    mergeTicket,
    unMergeTicket,

    reopenTicket,

    updateTicketStatus,
  };
};
