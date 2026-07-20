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
};
