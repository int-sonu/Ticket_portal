import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupApis } from "../../../Axios/MasterApis";
import type { GroupPayload } from "../../../Axios/MasterApis";

export const GROUP_KEYS = {
  all: ["groups"] as const,
  lists: () => [...GROUP_KEYS.all, "list"] as const,
  list: (filters: string) => [...GROUP_KEYS.lists(), { filters }] as const,
  dropdown: (filters: string) =>
    [...GROUP_KEYS.all, "dropdown", { filters }] as const,
  details: () => [...GROUP_KEYS.all, "detail"] as const,
  detail: (id: string | number) => [...GROUP_KEYS.details(), id] as const,
};

export const useGetGroups = (payload: GroupPayload) => {
  return useQuery({
    queryKey: GROUP_KEYS.list(JSON.stringify(payload)),
    queryFn: () => groupApis.groupList(payload),
    enabled: !!payload,
  });
};

export const useGetGroupDropdown = (payload: GroupPayload) => {
  return useQuery({
    queryKey: GROUP_KEYS.dropdown(JSON.stringify(payload)),
    queryFn: () => groupApis.groupDropDown(payload),
    enabled: !!payload,
  });
};

export const useGetGroupDetails = (payload: GroupPayload) => {
  return useQuery({
    queryKey: GROUP_KEYS.detail(JSON.stringify(payload)),
    queryFn: () => groupApis.groupView(payload),
    enabled: !!payload?.nGroupId,
  });
};

export const useSaveGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GroupPayload) => groupApis.groupSave(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.all });
      queryClient.refetchQueries({ queryKey: GROUP_KEYS.lists() });
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GroupPayload) => groupApis.groupUpdate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.all });
      queryClient.refetchQueries({ queryKey: GROUP_KEYS.lists() });
    },
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GroupPayload) => groupApis.groupDelete(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.all });
      queryClient.refetchQueries({ queryKey: GROUP_KEYS.lists() });
    },
  });
};
