export interface AgentDetails {
  nAgentId: number;
  cAgentName: string;
  nType: number;
  cAgentshName?: string;
  nAssignTicketCount?: number;
  nSiteVistCount?: number;
  [key: string]: any;
}
