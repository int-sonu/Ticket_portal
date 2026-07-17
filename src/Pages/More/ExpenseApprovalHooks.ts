import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { approvalApis, type ApprovalPayload } from "../../Axios/MoreApis";

export const useExpenseApprovalList = (payload: ApprovalPayload) =>
  useQuery({
    queryKey: ["expense-approval-list", payload],
    queryFn: () => approvalApis.expenseApprovalList(payload),
  });

export const useApprovalPendingList = (payload: ApprovalPayload) =>
  useQuery({
    queryKey: ["approval-pending-list", payload],
    queryFn: () => approvalApis.approvalPendingList(payload),
  });

export const useExpenseApprovalPeriodList = (payload: ApprovalPayload, enabled: boolean) =>
  useQuery({
    queryKey: ["expense-approval-period-list", payload],
    queryFn: () => approvalApis.expenseApprovalPeriodList(payload),
    enabled,
  });

export const useRefreshExpenseApprovalLists = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => true,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-approval-list"] });
      queryClient.invalidateQueries({ queryKey: ["approval-pending-list"] });
      queryClient.invalidateQueries({ queryKey: ["expense-approval-period-list"] });
    },
  });
};

