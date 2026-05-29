import { useQuery } from "@tanstack/react-query";
import { ticketApis } from "../../Axios/TicketsApi";

// ============================
// TICKET LISTS
// ============================

export const useTicketListAll = (
  payload: any
) => {
  return useQuery({
    queryKey: ["ticket-list-all", payload],
    queryFn: () =>
      ticketApis.ticketListAll(payload),
  });
};

export const useTicketListActive = (
  payload: any
) => {
  return useQuery({
    queryKey: ["ticket-list-active", payload],
    queryFn: () =>
      ticketApis.ticketListActive(payload),
  });
};

export const useTicketListAgentWise = (
  payload: any
) => {
  return useQuery({
    queryKey: ["ticket-list-agent-wise", payload],
    queryFn: () =>
      ticketApis.ticketListAgentWise(payload),
  });
};

export const useTicketOngoing = (
  payload: any
) => {
  return useQuery({
    queryKey: ["ticket-ongoing", payload],
    queryFn: () =>
      ticketApis.ticketOngoing(payload),
  });
};

export const useTicketUpcoming = (
  payload: any
) => {
  return useQuery({
    queryKey: ["ticket-upcoming", payload],
    queryFn: () =>
      ticketApis.ticketUpcoming(payload),
  });
};

export const useTicketUnAssigned = (
  payload: any
) => {
  return useQuery({
    queryKey: ["ticket-unassigned", payload],
    queryFn: () =>
      ticketApis.ticketUnAssigned(payload),
  });
};

export const useClosedTicketList = (
  payload: any
) => {
  return useQuery({
    queryKey: ["closed-ticket-list", payload],
    queryFn: () =>
      ticketApis.closedTicketList(payload),
  });
};

// ============================
// TICKET DETAILS
// ============================

export const useTicketView = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: ["ticket-view", payload],
    queryFn: () =>
      ticketApis.ticketView(payload),
    enabled,
  });
};

export const useTicketHistory = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: ["ticket-history", payload],
    queryFn: () =>
      ticketApis.ticketHistory(payload),
    enabled,
  });
};

export const useTicketHistoryAttachment = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: [
      "ticket-history-attachment",
      payload,
    ],
    queryFn: () =>
      ticketApis.ticketHistoryAttachment(
        payload
      ),
    enabled,
  });
};

// ============================
// CUSTOMER TICKETS
// ============================

export const useCustomerWiseActiveTicketList = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: [
      "customer-wise-active-ticket-list",
      payload,
    ],
    queryFn: () =>
      ticketApis.customerWiseActiveTicketList(
        payload
      ),
    enabled,
  });
};

export const useCustomerWiseAllTicketList = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: [
      "customer-wise-all-ticket-list",
      payload,
    ],
    queryFn: () =>
      ticketApis.customerWiseAllTicketList(
        payload
      ),
    enabled,
  });
};

// ============================
// ASSIGN AGENT
// ============================

export const useAssignAgentTicketList = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: [
      "assign-agent-ticket-list",
      payload,
    ],
    queryFn: () =>
      ticketApis.assignAgentTicketList(
        payload
      ),
    enabled,
  });
};

// ============================
// VALIDATIONS
// ============================

export const useCheckMultipleInProgress = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: [
      "check-multiple-in-progress",
      payload,
    ],
    queryFn: () =>
      ticketApis.checkMultipleInProgress(
        payload
      ),
    enabled,
  });
};