// Maps a notification's cType + nFormId to a navigation target. Single source of
// truth shared by the bell-dropdown click handler and the FCM click handler.
// See docs/Notifications.md (backend repo) for the matrix.

import type { NavigateFunction } from "react-router-dom";

const TICKET_TYPES = new Set([
  "TICKET_ASSIGNED",
  "TICKET_UNASSIGNED",
  "TICKET_SHARED",
  "TICKET_TRANSFERRED",
  "TICKET_REOPENED",
  "TICKET_ACCEPTED",
  "TICKET_REVIEW_REQUESTED",
  "TICKET_CLOSED",
  "TICKET_FOLLOWUP_POSTPONED",
  "CUSTOMER_TICKET_CREATED",
  "CUSTOMER_TICKET_UPDATED",
]);

const CALLREPORT_TYPES = new Set([
  "CALLREPORT_CREATED",
  "CALLREPORT_UPDATED",
]);

export function navigateByType(
  navigate: NavigateFunction,
  cType: string | undefined,
  nFormId: number | undefined
): boolean {
  if (!cType || !nFormId) return false;

  if (TICKET_TYPES.has(cType)) {
    navigate("/tickets/view", { state: { selectedRow: { nTicketId: nFormId } } });
    return true;
  }
  if (CALLREPORT_TYPES.has(cType)) {
    navigate("/callreports/view", { state: { selectedRow: { nCallReportId: nFormId } } });
    return true;
  }
  return false;
}
