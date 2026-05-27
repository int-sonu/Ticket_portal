import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { statusApis } from "../../../Axios/AgentApis";

import type { StatusPayload } from "../../../Axios/AgentApis";

export const STATUS_KEYS = {
  all: ["statuses"] as const,

  lists: () =>
    [...STATUS_KEYS.all, "list"] as const,

  list: (filters: string) =>
    [
      ...STATUS_KEYS.lists(),
      { filters },
    ] as const,
};



// GET LIST

export const useGetStatuses = (
  payload: StatusPayload
) => {
  return useQuery({
    queryKey: STATUS_KEYS.list(
      JSON.stringify(payload)
    ),

    queryFn: () =>
      statusApis.statusList(payload),

    enabled: !!payload,
  });
};



// SAVE

export const useSaveStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: StatusPayload
    ) =>
      statusApis.statusSave(
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          STATUS_KEYS.all,
      });
      queryClient.invalidateQueries({
        queryKey:
          STATUS_KEYS.lists(),
      });
      queryClient.refetchQueries({
        queryKey:
          STATUS_KEYS.lists(),
      });
    },
  });
};



// UPDATE

export const useUpdateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: StatusPayload
    ) =>
      statusApis.statusUpdate(
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          STATUS_KEYS.all,
      });
      queryClient.invalidateQueries({
        queryKey:
          STATUS_KEYS.lists(),
      });
      queryClient.refetchQueries({
        queryKey:
          STATUS_KEYS.lists(),
      });
    },
  });
};



// DELETE

export const useDeleteStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: StatusPayload
    ) =>
      statusApis.statusDelete(
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          STATUS_KEYS.all,
      });
      queryClient.invalidateQueries({
        queryKey:
          STATUS_KEYS.lists(),
      });
      queryClient.refetchQueries({
        queryKey:
          STATUS_KEYS.lists(),
      });
    },
  });
};
