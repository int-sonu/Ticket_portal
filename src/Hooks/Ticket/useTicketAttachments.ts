import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { ticketApis } from "../../Axios/TicketsApi";

export const useTicketAttachments = () => {
  const queryClient = useQueryClient();

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["ticket"],
    });

    queryClient.invalidateQueries({
      queryKey: ["ticket-view"],
    });
  };

  const uploadTicketAttachment =
    useMutation({
      mutationFn:
        ticketApis.ticketAttachmentUpload,
      onSuccess: refresh,
    });

  const deleteTicketAttachment =
    useMutation({
      mutationFn:
        ticketApis.ticketAttachmentDelete,
      onSuccess: refresh,
    });

  const uploadRepairPartAttachment =
    useMutation({
      mutationFn:
        ticketApis.repairPartAttachmentUpload,
      onSuccess: refresh,
    });

  const deleteRepairPartAttachment =
    useMutation({
      mutationFn:
        ticketApis.repairPartAttachmentDelete,
      onSuccess: refresh,
    });

  return {
    uploadTicketAttachment,
    deleteTicketAttachment,
    uploadRepairPartAttachment,
    deleteRepairPartAttachment,
  };
};