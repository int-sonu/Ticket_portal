import axiosInstance from "./axios";

export const billingApis = {
  billView: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Billing/BillView",
      payload,
    );

    return response.data;
  },

  companyDetails: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Configuration/GetCompanyDetails",
      payload,
    );

    return response.data;
  },

  getConfiguration: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Configuration/GetConfiguration",
      payload,
    );

    return response.data;
  },

  billExportPdf: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Billing/BillExportPdf",
      payload,
    );

    return response.data;
  },

  sendBillMail: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Billing/SendBillMail",
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
