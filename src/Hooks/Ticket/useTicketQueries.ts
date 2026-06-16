import { useQuery } from "@tanstack/react-query";
import { ticketApis } from "../../Axios/TicketsApi";
import { itemRepairApis } from "../../Axios/ItemRepairApis";

// ============================
// TICKET LISTS
// ============================

export const useTicketListAll = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: ["ticket-list-all", payload],
    queryFn: () =>
      ticketApis.ticketListAll(payload),
    enabled,
  });
};

export const useOverdueTicketList = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: ["overdue-ticket-list", payload],
    queryFn: () =>
      ticketApis.overdueTicketList(payload),
    enabled,
  });
};

export const usePostponedTicketList = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: [
      "postponed-ticket-list",
      payload,
    ],
    queryFn: () =>
      ticketApis.postponedTicketList(
        payload
      ),
    enabled,
  });
};

export const useCreatedTicketList = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: ["created-ticket-list", payload],
    queryFn: () =>
      ticketApis.createdTicketList(payload),
    enabled,
  });
};

export const useTicketListActive = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: ["ticket-list-active", payload],
    queryFn: () =>
      ticketApis.ticketListActive(payload),
    enabled,
  });
};

export const useTicketListAgentWise = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: ["ticket-list-agent-wise", payload],
    queryFn: () =>
      ticketApis.ticketListAgentWise(payload),
    enabled,
  });
};

export const useTicketOngoing = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: ["ticket-ongoing", payload],
    queryFn: () =>
      ticketApis.ticketOngoing(payload),
    enabled,
  });
};

export const useTicketUpcoming = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: ["ticket-upcoming", payload],
    queryFn: () =>
      ticketApis.ticketUpcoming(payload),
    enabled,
  });
};

export const useTicketUnAssigned = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: ["ticket-unassigned", payload],
    queryFn: () =>
      ticketApis.ticketUnAssigned(payload),
    enabled,
  });
};

export const useClosedTicketList = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: ["closed-ticket-list", payload],
    queryFn: () =>
      ticketApis.closedTicketList(payload),
    enabled,
  });
};

export const useCallReportList = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: ["call-report-list", payload],
    queryFn: () =>
      ticketApis.callReportList(payload),
    enabled,
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

export const useRepairItemActivityList = (
  payload: any,
  enabled = true
) => {
  return useQuery({
    queryKey: ["repair-item-activity-list", payload],
    queryFn: () => itemRepairApis.repairItemActivityList(payload),
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
