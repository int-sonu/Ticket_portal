import axiosInstance from "./axios";

export interface DashboardPayload {
  [key: string]: any;
}

export const dashboardApis = {
  dashboardCount: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/DashboardCount",
      payload,
    );

    return response.data;
  },

  collectionSummary: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/CollectionSummary",
      payload,
    );

    return response.data;
  },

  agentsActivityList: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/AgentsActivityList",
      payload,
    );

    return response.data;
  },

  ongoingTicketList: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/OngoingTicketList",
      payload,
    );

    return response.data;
  },

  overdueTicketList: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/OverdueTicketList",
      payload,
    );

    return response.data;
  },

  postponedTicketList: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/PostponededTicketList",
      payload,
    );

    return response.data;
  },

  closedTicketListWithStatus: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/ClosedTicketListWithStatus",
      payload,
    );

    return response.data;
  },

  closedResolvedTicketList: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/ClosedResolvedTicketList",
      payload,
    );

    return response.data;
  },

  closedUnResolvedTicketList: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/ClosedUnResolvedTicketList",
      payload,
    );

    return response.data;
  },

  upcomingTicketList: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/UpcomingTicketList",
      payload,
    );

    return response.data;
  },

  onHoldTicketList: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/OnHoldTicketList",
      payload,
    );

    return response.data;
  },

  pendingTicketList: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/PendingTicketList",
      payload,
    );

    return response.data;
  },

  createdTicketList: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/CreatedTicketList",
      payload,
    );

    return response.data;
  },

  unAssignedTicketList: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/UnAssignedTicketList",
      payload,
    );

    return response.data;
  },

  callReportList: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/CallReportList",
      payload,
    );

    return response.data;
  },

  billList: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/BillList",
      payload,
    );

    return response.data;
  },

  receiptList: async (payload: DashboardPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Dashboard/ReceiptList",
      payload,
    );

    return response.data;
  },
};
