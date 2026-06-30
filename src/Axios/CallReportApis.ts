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

export const callReportApis = {
  callReportList: async (payload: Record<string, any>) => {
    const response = await axiosInstance.post(
      "/Api/V1/CallReport/CallreportList",
      normalizeCallReportListPayload(payload),
    );

    return response.data;
  },

  callReportProgressNoteList: async (payload: Record<string, any>) => {
    const urls = [
      "/Api/V1/ProgressNotes/ProgressNoteListCallrapi",
      "/Api/V1/ProgressNotes/ProgressNoteListCallreportWise",
      "/Api/V1/CallReport/ProgressNoteListCallreport",
      "/Api/V1/CallReport/ProgressNoteList",
      "/Api/V1/CallReport/ProgressNoteListCallReport",
    ];

    let lastError: any;

    for (const url of urls) {
      try {
        const response = await axiosInstance.post(url, payload);
        return response.data;
      } catch (error: any) {
        lastError = error;
        const status = error?.response?.status;
        if (![404, 405].includes(status)) {
          throw error;
        }
      }
    }

    throw lastError;
  },
};
