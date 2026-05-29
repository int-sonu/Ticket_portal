import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { financialYearApis } from "../../../Axios/MasterApis";

import type { FinancialYearPayload } from "../../../Axios/MasterApis";

export const FINANCIAL_YEAR_KEYS = {
  all: ["financialYears"] as const,

  lists: () => [...FINANCIAL_YEAR_KEYS.all, "list"] as const,

  list: (filters: string) =>
    [...FINANCIAL_YEAR_KEYS.lists(), { filters }] as const,
};

// GET LIST

export const useGetFinancialYears = (payload: FinancialYearPayload) => {
  return useQuery({
    queryKey: FINANCIAL_YEAR_KEYS.list(JSON.stringify(payload)),

    queryFn: () => financialYearApis.financialYearList(payload),

    enabled: !!payload,
  });
};

// SAVE

export const useSaveFinancialYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FinancialYearPayload) =>
      financialYearApis.financialYearSave(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FINANCIAL_YEAR_KEYS.lists(),
      });
    },
  });
};

// UPDATE

export const useUpdateFinancialYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FinancialYearPayload) =>
      financialYearApis.financialYearUpdate(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FINANCIAL_YEAR_KEYS.lists(),
      });
    },
  });
};

// DELETE

export const useDeleteFinancialYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FinancialYearPayload) =>
      financialYearApis.financialYearDelete(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FINANCIAL_YEAR_KEYS.lists(),
      });
    },
  });
};
