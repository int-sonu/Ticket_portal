import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { ticketApis } from "../../Axios/TicketsApi";

export const useTicketMutations = () => {
  const queryClient = useQueryClient();

  const refreshTickets = () => {
    queryClient.invalidateQueries({
      queryKey: ["ticket"],
    });

    queryClient.invalidateQueries({
      queryKey: ["ticket-list"],
    });
  };

  // CRUD
  const createTicket = useMutation({
    mutationFn: ticketApis.ticketSave,
    onSuccess: refreshTickets,
  });

  const updateTicket = useMutation({
    mutationFn: ticketApis.ticketUpdate,
    onSuccess: refreshTickets,
  });

  const deleteTicket = useMutation({
    mutationFn: ticketApis.ticketDelete,
    onSuccess: refreshTickets,
  });

  // Ticket Actions
  const assignTicket = useMutation({
    mutationFn: ticketApis.assignTicket,
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

  const unTransferTicket = useMutation({
    mutationFn: ticketApis.unTransferTicket,
    onSuccess: refreshTickets,
  });

  const mergeTicket = useMutation({
    mutationFn: ticketApis.mergeTicket,
    onSuccess: refreshTickets,
  });

  const unMergeTicket = useMutation({
    mutationFn: ticketApis.unMergeTicket,
    onSuccess: refreshTickets,
  });

  const reopenTicket = useMutation({
    mutationFn: ticketApis.reopenTicket,
    onSuccess: refreshTickets,
  });

  // Followup
  const followupSave = useMutation({
    mutationFn: ticketApis.ticketFollowupSave,
    onSuccess: refreshTickets,
  });

  // Status
  const updateTicketStatus = useMutation({
    mutationFn: ticketApis.updateTicketStatus,
    onSuccess: refreshTickets,
  });

  // Quick Call Report
  const quickCallReportSave = useMutation({
    mutationFn: ticketApis.ticketQuickCallReportSave,
    onSuccess: refreshTickets,
  });

  return {
    createTicket,
    updateTicket,
    deleteTicket,

    assignTicket,
    acceptTicket,

    shareTicket,
    unShareTicket,

    transferTicket,
    unTransferTicket,

    mergeTicket,
    unMergeTicket,

    reopenTicket,

    followupSave,

    updateTicketStatus,

    quickCallReportSave,

  };
};
