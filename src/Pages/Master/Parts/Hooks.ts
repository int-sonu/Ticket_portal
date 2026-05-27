import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { partsApis } from "../../../Axios/AgentApis";

import type { PartsPayload } from "../../../Axios/AgentApis";

export const PARTS_KEYS = {
  all: ["parts"] as const,

  lists: () =>
    [...PARTS_KEYS.all, "list"] as const,

  list: (filters: string) =>
    [
      ...PARTS_KEYS.lists(),
      { filters },
    ] as const,
};



// GET LIST

export const useGetParts = (
  payload: PartsPayload
) => {
  return useQuery({
    queryKey:
      PARTS_KEYS.list(
        JSON.stringify(payload)
      ),

    queryFn: () =>
      partsApis.partsList(payload),

    enabled: !!payload,
  });
};



// SAVE

export const useSaveParts = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload: PartsPayload
    ) =>
      partsApis.partsSave(
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          PARTS_KEYS.all,
      });
      queryClient.invalidateQueries({
        queryKey:
          PARTS_KEYS.lists(),
      });
      queryClient.refetchQueries({
        queryKey:
          PARTS_KEYS.lists(),
      });
    },
  });
};



// UPDATE

export const useUpdateParts = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload: PartsPayload
    ) =>
      partsApis.partsUpdate(
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          PARTS_KEYS.all,
      });
      queryClient.invalidateQueries({
        queryKey:
          PARTS_KEYS.lists(),
      });
      queryClient.refetchQueries({
        queryKey:
          PARTS_KEYS.lists(),
      });
    },
  });
};



// DELETE

export const useDeleteParts = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload: PartsPayload
    ) =>
      partsApis.partsDelete(
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          PARTS_KEYS.all,
      });
      queryClient.invalidateQueries({
        queryKey:
          PARTS_KEYS.lists(),
      });
      queryClient.refetchQueries({
        queryKey:
          PARTS_KEYS.lists(),
      });
    },
  });
};
