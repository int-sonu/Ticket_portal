import axiosInstance from "./axios";

type HttpMethod = "post" | "put" | "delete";

const methodFromAllowHeader = (
  allowHeader?: string
): HttpMethod | undefined => {
  const allowed = String(
    allowHeader ?? ""
  ).toLowerCase();

  if (allowed.includes("put")) return "put";
  if (allowed.includes("delete")) return "delete";
  if (allowed.includes("post")) return "post";

  return undefined;
};

const sendPayload = async (
  method: HttpMethod,
  url: string,
  payload: any
) => {
  if (method === "delete") {
    return axiosInstance.delete(url, {
      data: payload,
    });
  }

  return axiosInstance[method](
    url,
    payload
  );
};

const sendWithMethodFallback = async (
  method: HttpMethod,
  url: string,
  payload: any,
  fallbackMethods: HttpMethod[] = []
) => {
  try {
    return await sendPayload(
      method,
      url,
      payload
    );
  } catch (error: any) {
    const status =
      error?.response?.status;

    const allowMethod =
      methodFromAllowHeader(
        error?.response?.headers?.allow
      );

    const retryMethods = [
      allowMethod,
      ...fallbackMethods,
    ].filter(
      (
        item
      ): item is HttpMethod =>
        !!item && item !== method
    );

    if (
      status !== 405 ||
      !retryMethods.length
    ) {
      throw error;
    }

    return sendPayload(
      retryMethods[0],
      url,
      payload
    );
  }
};

export interface TicketPayload {
  [key: string]: any;
}

export const ticketApis = {
  // LIST

  ticketListAll: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/TicketListAll",
        payload
      );

    return response.data;
  },

  ticketListActive: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/TicketListActive",
        payload
      );

    return response.data;
  },

  ticketListAgentWise: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/TicketListAgentWise",
        payload
      );

    return response.data;
  },

  ticketOngoing: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/TicketOngoing",
        payload
      );

    return response.data;
  },

  ticketUpcoming: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/TicketUpcoming",
        payload
      );

    return response.data;
  },

  ticketUnAssigned: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/TicketUnAssigned",
        payload
      );

    return response.data;
  },

  closedTicketList: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/ClosedTicketList",
        payload
      );

    return response.data;
  },

  // CRUD

  ticketSave: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/TicketSave",
        payload
      );

    return response.data;
  },

  ticketUpdate: async (
    payload: TicketPayload
  ) => {
    const response =
      await sendWithMethodFallback(
        "put",
        "/Api/V1/Ticket/TicketUpdate",
        payload,
        ["post"]
      );

    return response.data;
  },

  ticketDelete: async (
    payload: TicketPayload
  ) => {
    const response =
      await sendWithMethodFallback(
        "delete",
        "/Api/V1/Ticket/TicketDelete",
        payload,
        ["post"]
      );

    return response.data;
  },

  ticketView: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/TicketView",
        payload
      );

    return response.data;
  },
};