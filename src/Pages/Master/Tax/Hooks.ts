import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { taxApis } from "../../../Axios/AgentApis";

import type { TaxPayload } from "../../../Axios/AgentApis";

export const TAX_KEYS = {
  all: ["taxes"] as const,

  lists: () =>
    [...TAX_KEYS.all, "list"] as const,

  list: (filters: string) =>
    [
      ...TAX_KEYS.lists(),
      { filters },
    ] as const,
};



// GET LIST

export const useGetTaxes = (
  payload: TaxPayload
) => {
  return useQuery({
    queryKey: TAX_KEYS.list(
      JSON.stringify(payload)
    ),

    queryFn: () =>
      taxApis.taxList(payload),

    enabled: !!payload,
  });
};



// SAVE

export const useSaveTax = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: TaxPayload
    ) =>
      taxApis.taxSave(
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          TAX_KEYS.lists(),
      });
    },
  });
};



// UPDATE

export const useUpdateTax = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: TaxPayload
    ) =>
      taxApis.taxUpdate(
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          TAX_KEYS.lists(),
      });
    },
  });
};



// DELETE

export const useDeleteTax = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: TaxPayload
    ) =>
      taxApis.taxDelete(
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          TAX_KEYS.lists(),
      });
    },
  });
};