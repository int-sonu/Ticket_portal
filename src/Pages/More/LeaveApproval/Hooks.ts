import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { leaveApis } from "../../../Axios/MoreApis";
import type { LeavePayload } from "../../../Axios/MoreApis";

export const useLeaveApprovalList = (payload: LeavePayload) =>
  useQuery({
    queryKey: ["leave-approval-list", payload],
    queryFn: () => leaveApis.leaveList(payload),
  });

export const useLeaveApprovalDetails = (payload: LeavePayload, enabled: boolean) =>
  useQuery({
    queryKey: ["leave-approval-details", payload],
    queryFn: () => leaveApis.leaveApprovalDetailsView(payload),
    enabled,
  });

export const useApproveOrRejectLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeavePayload) => leaveApis.leaveApproval(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-approval-list"] });
      queryClient.invalidateQueries({ queryKey: ["agentwise-leave-list"] });
    },
  });
};
