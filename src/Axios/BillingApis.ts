import axiosInstance from "./axios";

export const billingApis = {
  billView: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Billing/BillView",
      payload,
    );

    return response.data;
  },

  getTaxValue: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Billing/GetTaxValue",
      payload,
    );

    return response.data;
  },

  lastBillNumber: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Billing/LastBillNumber",
      payload,
    );

    return response.data;
  },

  partListForBilling: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Billing/PartListForBilling",
      payload,
    );

    return response.data;
  },

  billSave: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Billing/BillSave",
      payload,
    );

    return response.data;
  },
};
