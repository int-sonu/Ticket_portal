import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { issueSummaryApis } from "../../../Axios/MasterApis";

import type { IssueSummaryPayload } from "../../../Axios/MasterApis";

export const ISSUE_SUMMARY_KEYS = {
  all: ["issue-summary"] as const,

  lists: () => [...ISSUE_SUMMARY_KEYS.all, "list"] as const,

  list: (filters: string) =>
    [...ISSUE_SUMMARY_KEYS.lists(), { filters }] as const,
};

export const useGetIssueSummaries = (payload: IssueSummaryPayload) =>
  useQuery({
    queryKey: ISSUE_SUMMARY_KEYS.list(JSON.stringify(payload)),

    queryFn: () => issueSummaryApis.issueSummaryList(payload),

    enabled: !!payload,
  });

export const useGetIssueSuggestions = (payload: IssueSummaryPayload) =>
  useQuery({
    queryKey: [...ISSUE_SUMMARY_KEYS.all, "suggestions", payload],

    queryFn: () => issueSummaryApis.issueSuggestionList(payload),

    enabled: !!payload,
  });

export const useSaveIssueSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IssueSummaryPayload) =>
      issueSummaryApis.issueSummarySave(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ISSUE_SUMMARY_KEYS.lists(),
      });
    },
  });
};

export const useUpdateIssueSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IssueSummaryPayload) =>
      issueSummaryApis.issueSummaryUpdate(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ISSUE_SUMMARY_KEYS.lists(),
      });
    },
  });
};

export const useDeleteIssueSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IssueSummaryPayload) =>
      issueSummaryApis.issueSummaryDelete(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ISSUE_SUMMARY_KEYS.lists(),
      });
    },
  });
};
