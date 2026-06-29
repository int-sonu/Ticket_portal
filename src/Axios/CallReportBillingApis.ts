import axiosInstance from "./axios";

const formatDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeCallReportListPayload = (payload: Record<string, any> = {}) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    ...payload,
    cFromDate: payload?.cFromDate ?? formatDate(firstDayOfMonth),
    cToDate: payload?.cToDate ?? formatDate(today),
  };
};

export const callReportBillingApis = {
  billedCallReportList: async (payload: Record<string, any>) => {
    const response = await axiosInstance.post(
      "/Api/V1/CallReport/BilledCallreportList",
      normalizeCallReportListPayload(payload),
    );

    return response.data;
  },
};
