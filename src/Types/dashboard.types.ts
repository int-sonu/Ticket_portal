// TypeScript types for Dashboard API data

export interface DashboardStats {
  createdTicket: number;
  callReport: number;
  postponed: number;
  closed: number;
  resolved: number;
  unresolved: number;
  receipts: number;
  receiptsAmount: number;
  bills: number;
  billsAmount: number;
}

export interface SidePanelStats {
  ongoing: number;
  overdue: number;
  unassigned: number;
  upcoming: number;
}

export interface DashboardChartAgent {
  name: string;
  callReport: number;
  createdTicket: number;
}
