import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { serviceTypeApis } from "../../../Axios/MasterApis";

import type { ServiceTypePayload } from "../../../Axios/MasterApis";

export const SERVICE_TYPE_KEYS = {
  all: ["service-types"] as const,

  lists: () => [...SERVICE_TYPE_KEYS.all, "list"] as const,

  list: (filters: string) =>
    [...SERVICE_TYPE_KEYS.lists(), { filters }] as const,
};

export const useGetServiceTypes = (payload: ServiceTypePayload) => {
  return useQuery({
    queryKey: SERVICE_TYPE_KEYS.list(JSON.stringify(payload)),

    queryFn: () => serviceTypeApis.serviceTypeList(payload),

    enabled: !!payload,
  });
};

export const useGetServiceTypeDropdown = (payload: ServiceTypePayload) => {
  return useQuery({
    queryKey: [...SERVICE_TYPE_KEYS.all, "dropdown", JSON.stringify(payload)],

    queryFn: () => serviceTypeApis.serviceTypeDropDown(payload),

    enabled: !!payload,
  });
};

export const useSaveServiceType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ServiceTypePayload) =>
      serviceTypeApis.serviceTypeSave(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SERVICE_TYPE_KEYS.lists(),
      });
    },
  });
};

export const useUpdateServiceType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ServiceTypePayload) =>
      serviceTypeApis.serviceTypeUpdate(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SERVICE_TYPE_KEYS.lists(),
      });
    },
  });
};

export const useDeleteServiceType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ServiceTypePayload) =>
      serviceTypeApis.serviceTypeDelete(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SERVICE_TYPE_KEYS.lists(),
      });
    },
  });
};
