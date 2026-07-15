import axiosInstance from "./axios";

const formatDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeBillListPayload = (payload: Record<string, any> = {}) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    ...payload,
    dFromDate: payload?.dFromDate ?? payload?.cFromDate ?? formatDate(firstDayOfMonth),
    dToDate: payload?.dToDate ?? payload?.cToDate ?? formatDate(today),
    cFromDate: payload?.cFromDate ?? payload?.dFromDate ?? formatDate(firstDayOfMonth),
    cToDate: payload?.cToDate ?? payload?.dToDate ?? formatDate(today),
  };
};

const normalizeReceiptListPayload = (payload: Record<string, any> = {}) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    ...payload,
    dFromDate: payload?.dFromDate ?? payload?.cFromDate ?? formatDate(firstDayOfMonth),
    dToDate: payload?.dToDate ?? payload?.cToDate ?? formatDate(today),
    cFromDate: payload?.cFromDate ?? payload?.dFromDate ?? formatDate(firstDayOfMonth),
    cToDate: payload?.cToDate ?? payload?.dToDate ?? formatDate(today),
  };
};

const normalizeReceiptCustomerPayload = (payload: Record<string, any> = {}) => ({
  ...payload,
  nCustomerId:
    payload?.nCustomerId ??
    payload?.customerId ??
    payload?.CustomerId ??
    payload?.id ??
    0,
  customerId:
    payload?.customerId ??
    payload?.nCustomerId ??
    payload?.CustomerId ??
    payload?.id ??
    0,
  CustomerId:
    payload?.CustomerId ??
    payload?.nCustomerId ??
    payload?.customerId ??
    payload?.id ??
    0,
});

const normalizeBillDeletePayload = (payload: Record<string, any> = {}) => {
  const billId =
    payload?.nBillId ?? payload?.BillId ?? payload?.billId ?? payload?.id ?? 0;
  const createdBy =
    payload?.nCreatedby ??
    payload?.nCreatedBy ??
    payload?.id ??
    payload?.nAgentId ??
    payload?.createdBy ??
    0;

  return {
    cDbName: payload?.cDbName,
    cSchemaName: payload?.cSchemaName,
    nCompanyId: payload?.nCompanyId,
    nBillId: Number(billId) || 0,
    nCreatedby: Number(createdBy) || 0,
  };
};

export const billingApis = {
  billView: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Billing/BillView",
      payload,
    );

    return response.data;
  },

  billList: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Billing/BillList",
      normalizeBillListPayload(payload),
    );

    return response.data;
  },

  billListCustomerWise: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Billing/BillListCustomerWise",
      normalizeReceiptCustomerPayload(payload),
    );

    return response.data;
  },

  billDelete: async (payload: any) => {
    const response = await axiosInstance.delete(
      "/Api/V1/Billing/BillDelete",
      {
        data: normalizeBillDeletePayload(payload),
      },
    );

    return response.data;
  },

  receiptList: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Receipt/ReceiptList",
      normalizeReceiptListPayload(payload),
    );

    return response.data;
  },

  collectionSummaryList: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/CollectionSummary/CollectionSummaryList",
      payload,
    );

    return response.data;
  },

  travelExpenseList: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Travel/TravelExpenseList",
      payload,
    );

    return response.data;
  },

  travelExpense: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Travel/TravelExpense",
      payload,
    );

    return response.data;
  },

  travelLogList: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Travel/TravelLogList",
      payload,
    );

    return response.data;
  },

  otherExpenseList: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/OtherExpenses/OtherExpenseList",
      payload,
    );

    return response.data;
  },

  otherExpensesSave: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/OtherExpenses/OtherExpensesSave",
      payload,
    );

    return response.data;
  },

  otherExpensesUpdate: async (payload: any) => {
    const response = await axiosInstance.put(
      "/Api/V1/OtherExpenses/OtherExpensesUpdate",
      payload,
    );

    return response.data;
  },

  otherExpensesDelete: async (payload: any) => {
    const response = await axiosInstance.delete(
      "/Api/V1/OtherExpenses/OtherExpensesDelete",
      { data: payload },
    );

    return response.data;
  },

  outstandingBillListCustomerWise: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Receipt/OutstandingBillListCustomerWise",
      normalizeReceiptCustomerPayload(payload),
    );

    return response.data;
  },

  lastReceiptNumber: async (payload: any) => {
    const response = await axiosInstance.post(
      "/Api/V1/Receipt/LastReceiptNumber",
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
