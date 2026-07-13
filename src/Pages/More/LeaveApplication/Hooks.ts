import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { leaveApis } from "../../../Axios/MoreApis";
import type { LeavePayload } from "../../../Axios/MoreApis";

export const useAgentwiseLeaveList = (payload: LeavePayload) =>
  useQuery({
    queryKey: ["agentwise-leave-list", payload],
    queryFn: () => leaveApis.agentwiseLeaveList(payload),
  });

export const useLeaveDetailsView = (payload: LeavePayload, enabled: boolean) =>
  useQuery({
    queryKey: ["leave-details-view", payload],
    queryFn: () => leaveApis.leaveDetailsView(payload),
    enabled,
  });

export const useSaveLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeavePayload) => leaveApis.leaveSave(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agentwise-leave-list"] }),
  });
};

export const useUploadLeaveAttachments = () =>
  useMutation({
    mutationFn: (payload: FormData) => leaveApis.leaveAttachmentUpload(payload),
  });

export const useUpdateLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeavePayload) => leaveApis.leaveUpdate(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agentwise-leave-list"] }),
  });
};

export const useDeleteLeaveAttachments = () =>
  useMutation({
    mutationFn: (payload: LeavePayload) => leaveApis.leaveAttachmentDelete(payload),
  });

export const useDeleteLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LeavePayload) => leaveApis.leaveDelete(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agentwise-leave-list"] }),
  });
};
