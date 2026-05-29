import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { currencyApis } from "../../../Axios/MasterApis";

import type { CurrencyPayload } from "../../../Axios/MasterApis";

export const CURRENCY_KEYS = {
  all: ["currencies"] as const,

  lists: () => [...CURRENCY_KEYS.all, "list"] as const,

  list: (filters: string) => [...CURRENCY_KEYS.lists(), { filters }] as const,
};

export const useGetCurrencies = (payload: CurrencyPayload) => {
  return useQuery({
    queryKey: CURRENCY_KEYS.list(JSON.stringify(payload)),

    queryFn: () => currencyApis.currencyListAll(payload),

    enabled: !!payload,
  });
};

export const useSaveCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CurrencyPayload) =>
      currencyApis.currencySave(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CURRENCY_KEYS.lists(),
      });
    },
  });
};

export const useUpdateCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CurrencyPayload) =>
      currencyApis.currencyUpdate(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CURRENCY_KEYS.lists(),
      });
    },
  });
};

export const useDeleteCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CurrencyPayload) =>
      currencyApis.currencyDelete(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CURRENCY_KEYS.lists(),
      });
    },
  });
};
