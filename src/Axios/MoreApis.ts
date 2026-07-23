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
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },
};

export type ApprovalPayload = Record<string, unknown>;

export const approvalApis = {
  expenseApprovalList: async (payload: ApprovalPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Approval/ExpenseApprovalList",
      payload,
    );
    return response.data;
  },

  approvalPendingList: async (payload: ApprovalPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Approval/ApprovalPendingList",
      payload,
    );
    return response.data;
  },

  approvalPendingExpenseList: async (payload: ApprovalPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Approval/ApprovalPendingExpenseList",
      payload,
    );
    return response.data;
  },

  expenseApprovalSave: async (payload: ApprovalPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Approval/ExpenseApprovalSave",
      payload,
    );
    return response.data;
  },

  expenseApprovalPeriodList: async (payload: ApprovalPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Approval/ExpenseApprovalPeriodList",
      payload,
    );
    return response.data;
  },

  expenseApprovalView: async (payload: ApprovalPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Approval/ExpenseApprovalView",
      payload,
    );
    return response.data;
  },

  tripModeListDropdown: async (payload: ApprovalPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/TripMode/TripModeListDropdown",
      payload,
    );
    return response.data;
  },
};

export const agentApis = {
  agentAvailability: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post(
      "/Api/V1/Agent/AgentAvailability",
      payload,
    );
    return response.data;
  },
};

export const attendanceApis = {
  punchIn: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post(
      "/Api/V1/Attendance/PunchIn",
      payload,
    );
    return response.data;
  },

  punchOut: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post(
      "/Api/V1/Attendance/PunchOut",
      payload,
    );
    return response.data;
  },

  attendanceStatus: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post(
      "/Api/V1/Attendance/AttendanceStatus",
      payload,
    );
    return response.data;
  },

  attendanceSummaryMonthly: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post(
      "/Api/V1/Attendance/AttendanceSummayMonthly",
      payload,
    );
    return response.data;
  },

  attendanceSummaryDaily: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post(
      "/Api/V1/Attendance/AttendanceSummayDaily",
      payload,
    );
    return response.data;
  },
};
