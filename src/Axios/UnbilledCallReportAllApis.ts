import axiosInstance from "./axios";

const formatDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeCallReportListPayload = (payload: Record<string, any> = {}) => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  return {
    ...payload,
    cFromDate: payload?.cFromDate ?? formatDate(thirtyDaysAgo),
    cToDate: payload?.cToDate ?? formatDate(today),
  };
};

export const unbilledCallReportApis = {
  unbilledCallReportList: async (payload: Record<string, any>) => {
    const response = await axiosInstance.post(
      "/Api/V1/CallReport/UnBilledCallreportList",
      normalizeCallReportListPayload(payload),
    );

    return response.data;
  },

  customerWiseUnbilledCallReportList: async (payload: Record<string, any>) => {
    try {
      const response = await axiosInstance.post(
        "/Api/V1/CallReport/CustomerWiseUnBilledCallreportList",
        payload,
      );

      return response.data;
    } catch (error: any) {
      const statusCode = error?.response?.status ?? error?.response?.data?.statusCode;
      const message = String(
        error?.response?.data?.message ?? error?.message ?? "",
      ).toLowerCase();

      if (statusCode === 404 || message.includes("not found")) {
        return {
          statusCode: 200,
          data: [],
          message: "No customer found",
        };
      }

      throw error;
    }
  },
};
