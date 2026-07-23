import { useQuery } from "@tanstack/react-query";
import { agentApis } from "../../Axios/MoreApis";

export type AgentAvailabilityPayload = {
  nCompanyId?: number;
  nAgentId?: number;
  cSchemaName?: string;
  cDbName?: string;
  dFromDate?: string;
  dToDate?: string;
  bDateRange?: boolean;
};

export const useAgentAvailability = (payload: AgentAvailabilityPayload) =>
  useQuery({
    queryKey: ["agent-availability", payload],
    queryFn: () => agentApis.agentAvailability(payload),
    enabled: Boolean(payload.nCompanyId && payload.cSchemaName && payload.cDbName),
  });
