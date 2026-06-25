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
  switch (method) {
    case "post":
      return axiosInstance.post(url, payload);
    case "put":
      return axiosInstance.put(url, payload);
    case "delete":
      return axiosInstance.delete(url, {
        data: payload,
      });
    default:
      return axiosInstance.post(url, payload);
  }
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

const returnEmptyListOnNoTickets = (
  error: any
) => {
  if (
    error?.response?.status === 404 &&
    error?.response?.data?.message
      ?.toLowerCase?.()
      ?.includes("no") &&
    error?.response?.data?.message
      ?.toLowerCase?.()
      ?.includes("tickets")
  ) {
    return {
      ...error.response.data,
      data: [],
    };
  }

  throw error;
};

const normalizeCustomerWiseListPayload = (
  payload: TicketPayload
) => {
  const companyId =
    payload?.nCompanyId ??
    0;
  const agentId =
    payload?.nAgentId ??
    payload?.id ??
    0;
  const customerId =
    payload?.nCustomerId ??
    0;
  const schemaName =
    payload?.cSchemaName ??
    "";

  return {
    cDbName: payload?.cDbName,
    cSchemaName: schemaName,
    nCompanyId: Number(companyId || 0),
    nAgentId: Number(agentId || 0),
    nCustomerId: Number(customerId || 0),
  };
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

  overdueTicketList: async (
    payload: TicketPayload
  ) => {
    try {
      const response =
        await axiosInstance.post(
          "/Api/V1/Dashboard/OverdueTicketList",
          payload
        );

      return response.data;
    } catch (error) {
      return returnEmptyListOnNoTickets(
        error
      );
    }
  },

  postponedTicketList: async (
    payload: TicketPayload
  ) => {
    try {
      const response =
        await axiosInstance.post(
"/Api/V1/Ticket/PostponeTicket",
          payload
        );

      return response.data;
    } catch (error) {
      return returnEmptyListOnNoTickets(
        error
      );
    }
  },

  createdTicketList: async (
    payload: TicketPayload
  ) => {
    try {
      const response =
        await axiosInstance.post(
          "/Api/V1/Dashboard/CreatedTicketList",
          payload
        );

      return response.data;
    } catch (error) {
      return returnEmptyListOnNoTickets(
        error
      );
    }
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

  customerWiseActiveTicketList: async (
    payload: TicketPayload
  ) => {
    try {
      const response =
        await axiosInstance.post(
          "/Api/V1/Ticket/CustomerWiseActiveTicketList",
          normalizeCustomerWiseListPayload(payload)
        );

      return response.data;
    } catch (error) {
      return returnEmptyListOnNoTickets(error);
    }
  },

  customerWiseAllTicketList: async (
    payload: TicketPayload
  ) => {
    try {
      const response =
        await axiosInstance.post(
          "/Api/V1/Ticket/CustomerWiseAllTicketList",
          normalizeCustomerWiseListPayload(payload)
        );

      return response.data;
    } catch (error) {
      return returnEmptyListOnNoTickets(error);
    }
  },

  assignAgentTicketList: async (
    payload: TicketPayload
  ) => {
    try {
      const response =
        await axiosInstance.post(
          "/Api/V1/Ticket/AssignAgentTicketList",
          payload
        );

      return response.data;
    } catch (error) {
      return returnEmptyListOnNoTickets(error);
    }
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

  callReportList: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/CallReport/CallreportList",
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

  ticketQuickCallReportSave: async (
    payload: TicketPayload
  ) => {
    const response = await sendWithMethodFallback(
      "post",
      "/Api/V1/Ticket/TicketQuickCallReportSave",
      payload
    );

    return response.data;
  },

  postponeTicket: async (
    payload: TicketPayload
  ) => {
    const response = await sendWithMethodFallback(
      "post",
      "/Api/V1/Ticket/PostponeTicket",
      payload
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

  transferTicket: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/TransferTicket",
        payload
      );

    return response.data;
  },

  shareTicket: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/ShareTicket",
        payload
      );

    return response.data;
  },

  unTransferTicket: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/UnTransferTicket",
        payload
      );

    return response.data;
  },

  unShareTicket: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/UnShareTicket",
        payload
      );

    return response.data;
  },

  mergeTicket: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/MergeTicket",
        payload
      );

    return response.data;
  },

  unMergeTicket: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/UnMergeTicket",
        payload
      );

    return response.data;
  },

  sendEstimateMail: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Estimate/SendEstimateMail",
        payload
      );

    return response.data;
  },

  ticketHistory: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/TicketHistory",
        payload
      );

    return response.data;
  },

  ticketHistoryAttachment: async (
    payload: TicketPayload
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/TicketHistoryAttachment",
        payload
      );

    return response.data;
  },

  ticketAttachmentUpload: async (
    payload: FormData
  ) => {
    const nCompanyId = payload.get("nCompanyId");
    const nTicketId = payload.get("nTicketId");
    const ticketId = payload.get("TicketId");

    const response =
      await axiosInstance.post(
        "/Api/V1/Ticket/TicketAttachmentUpload",
        payload,
        {
          params: {
            ...(nCompanyId !== null ? { nCompanyId } : {}),
            ...(nTicketId !== null ? { nTicketId } : {}),
            ...(ticketId !== null ? { TicketId: ticketId } : {}),
          },
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

    return response.data;
  },

  ticketAttachmentDelete: async (
    payload: TicketPayload
  ) => {
    const response =
      await sendWithMethodFallback(
        "delete",
        "/Api/V1/Ticket/TicketAttachmentDelete",
        payload,
        ["post"]
      );

    return response.data;
  },

  repairPartAttachmentUpload: async (
    payload: FormData
  ) => {
    const response =
      await axiosInstance.post(
        "/Api/V1/ItemRepair/RepairPartAttachmentUpload",
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

    return response.data;
  },

  repairPartAttachmentDelete: async (
    payload: TicketPayload
  ) => {
    const response =
      await sendWithMethodFallback(
        "delete",
        "/Api/V1/ItemRepair/RepairPartAttachmentDelete",
        payload,
        ["post"]
      );

    return response.data;
  },
};
