import axiosInstance from "./axios";

export type LeavePayload = Record<string, unknown>;

export const leaveApis = {
  agentwiseLeaveList: async (payload: LeavePayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Leave/AgentwiseLeaveList",
      payload,
    );
    return response.data;
  },

  leaveList: async (payload: LeavePayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Leave/LeaveList",
      payload,
    );
    return response.data;
  },

  leaveApprovalDetailsView: async (payload: LeavePayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Leave/LeaveApprovalDetailsView",
      payload,
    );
    return response.data;
  },

  leaveApproval: async (payload: LeavePayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Leave/LeaveApproval",
      payload,
    );
    return response.data;
  },

  leaveDetailsView: async (payload: LeavePayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Leave/LeaveDetailsView",
      payload,
    );
    return response.data;
  },

  leaveSave: async (payload: LeavePayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Leave/LeaveSave",
      payload,
    );
    return response.data;
  },

  leaveUpdate: async (payload: LeavePayload) => {
    const response = await axiosInstance.put(
      "/Api/V1/Leave/LeaveUpdate",
      payload,
    );
    return response.data;
  },

  leaveAttachmentDelete: async (payload: LeavePayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Leave/LeaveAttachmentDelete",
      payload,
    );
    return response.data;
  },

  leaveDelete: async (payload: LeavePayload) => {
    const response = await axiosInstance.delete(
      "/Api/V1/Leave/LeaveDelete",
      { data: payload },
    );
    return response.data;
  },

  leaveAttachmentUpload: async (payload: FormData) => {
    const nCompanyId = payload.get("nCompanyId");
    const nLeaveId = payload.get("nLeaveId");
    const response = await axiosInstance.post(
      "/Api/V1/Leave/LeaveAttachmentUpload",
      payload,
      {
        params: { nCompanyId, nLeaveId },
      },
    );
    return response.data;
  },
};
