import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { ticketApis } from "../../Axios/TicketsApi";

export const useTicketAttachments = () => {
  const queryClient =
    useQueryClient();

  const refreshTickets = () => {
    queryClient.invalidateQueries({
      queryKey: ["ticket"],
    });

    queryClient.invalidateQueries({
      queryKey: ["ticket-view"],
    });

    queryClient.invalidateQueries({
      queryKey: ["ticket-history"],
    });
  };

  const uploadTicketAttachment =
    useMutation({
      mutationFn: (
        formData: FormData
      ) =>
        ticketApis.ticketAttachmentUpload(
          formData
        ),

      onSuccess: refreshTickets,
    });

  const deleteTicketAttachment =
    useMutation({
      mutationFn:
        ticketApis.ticketAttachmentDelete,

      onSuccess: refreshTickets,
    });

  const uploadRepairPartAttachment =
    useMutation({
      mutationFn: (
        formData: FormData
      ) =>
        ticketApis.repairPartAttachmentUpload(
          formData
        ),

      onSuccess: refreshTickets,
    });

  const deleteRepairPartAttachment =
    useMutation({
      mutationFn:
        ticketApis.repairPartAttachmentDelete,

      onSuccess: refreshTickets,
    });

  return {
    uploadTicketAttachment,
    deleteTicketAttachment,

    uploadRepairPartAttachment,
    deleteRepairPartAttachment,
  };
};