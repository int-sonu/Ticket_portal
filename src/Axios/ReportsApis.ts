import axiosInstance from "./axios";

export const reportApis = {
  companyList: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post(
      "/Api/V1/Report/CompanyList",
      payload,
    );
    return response.data;
  },

  customerDetailsReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post(
      "/Api/V1/Report/CustomerDetailsReport",
      payload,
    );
    return response.data;
  },

  ticketListReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post(
      "/Api/V1/Report/TicketListReport",
      payload,
    );
    return response.data;
  },

  callReportListReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post(
      "/Api/V1/Report/CallReportListReport",
      payload,
    );
    return response.data;
  },

  travelLogReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post(
      "/Api/V1/Report/TravelLogReport",
      payload,
    );
    return response.data;
  },

  expenseReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post(
      "/Api/V1/Report/ExpenseReport",
      payload,
    );
    return response.data;
  },

  billReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post(
      "/Api/V1/Report/BillReport",
      payload,
    );
    return response.data;
  },

  itemWiseSalesReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post(
      "/Api/V1/Report/ItemWiseSalesReport",
      payload,
    );
    return response.data;
  },

  customerOutstandingReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post("/Api/V1/Report/CustomerOutstandingReport", payload);
    return response.data;
  },

  repairPartsReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post("/Api/V1/Report/RepairPartsReport", payload);
    return response.data;
  },

  replacePartsReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post("/Api/V1/Report/ReplacePartsReport", payload);
    return response.data;
  },

  receiptReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post("/Api/V1/Report/ReceiptReport", payload);
    return response.data;
  },

  attendanceSummaryReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post("/Api/V1/Report/AttendanceSummaryReport", payload);
    return response.data;
  },

  leaveApplicationReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post("/Api/V1/Report/LeaveApplicationReport", payload);
    return response.data;
  },

  leaveApprovalReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post("/Api/V1/Report/LeaveApprovalReport", payload);
    return response.data;
  },

  agentListReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post("/Api/V1/Report/AgentListReport", payload);
    return response.data;
  },

  incomeExpenseReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post("/Api/V1/Report/IncomeExpenseReport", payload);
    return response.data;
  },

  ticketNumberList: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post("/Api/V1/Report/TicketNumberList", payload);
    return response.data;
  },

  ticketHistoryReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post("/Api/V1/Report/TicketHistoryReport", payload);
    return response.data;
  },

  dailyServiceReport: async (payload: Record<string, unknown>) => {
    const response = await axiosInstance.post("/Api/V1/Report/DailyServiceReport", payload);
    return response.data;
  },
};
