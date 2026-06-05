import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ticketSourceApis } from "../../../Axios/MasterApis";

export const useGetTicketSources = (payload: any) => {
  return useQuery({
    queryKey: ["ticket-source-list", payload],

    queryFn: () => ticketSourceApis.ticketSourceListAll(payload),
  });
};

export const useGetTicketSourceDropdown = (payload: any) => {
  return useQuery({
    queryKey: ["ticket-source-dropdown", payload],

    queryFn: () => ticketSourceApis.ticketSourceDropDown(payload),
  });
};

export const useSaveTicketSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketSourceApis.ticketSourceSave,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-source-list"],
      });
    },
  });
};

export const useUpdateTicketSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketSourceApis.ticketSourceUpdate,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-source-list"],
      });
    },
  });
};

export const useDeleteTicketSource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketSourceApis.ticketSourceDelete,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-source-list"],
      });
    },
  });
};
