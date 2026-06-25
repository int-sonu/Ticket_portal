import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { followupApis } from "../../../Axios/MasterApis";
import type { FollowupPayload } from "../../../Axios/MasterApis";

export const FOLLOWUP_KEYS = {
  all: ["followupModes"] as const,

  lists: () => [...FOLLOWUP_KEYS.all, "list"] as const,

  list: (filters: string) => [...FOLLOWUP_KEYS.lists(), { filters }] as const,
};

export const useGetFollowupModes = (payload: FollowupPayload) => {
  return useQuery({
    queryKey: FOLLOWUP_KEYS.list(JSON.stringify(payload)),

    queryFn: () => followupApis.followupList(payload),

    enabled: !!payload,
  });
};

export const useGetActiveFollowupModes = (payload: FollowupPayload) => {
  return useQuery({
    queryKey: [...FOLLOWUP_KEYS.list(JSON.stringify(payload)), "active"],

    queryFn: () => followupApis.followupActiveList(payload),

    enabled: !!payload,
  });
};

export const useSaveFollowupMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FollowupPayload) =>
      followupApis.followupSave(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FOLLOWUP_KEYS.lists(),
      });
    },
  });
};

export const useUpdateFollowupMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FollowupPayload) =>
      followupApis.followupUpdate(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FOLLOWUP_KEYS.lists(),
      });
    },
  });
};

export const useDeleteFollowupMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FollowupPayload) =>
      followupApis.followupDelete(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FOLLOWUP_KEYS.lists(),
      });
    },
  });
};
