import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agentApis } from "../../../Axios/MasterApis";
import type { AgentPayload } from "../../../Axios/MasterApis";

export const AGENT_KEYS = {
  all: ["agents"] as const,
  lists: () => [...AGENT_KEYS.all, "list"] as const,
  list: (filters: string) => [...AGENT_KEYS.lists(), { filters }] as const,
  dropdown: (filters: string) =>
    [...AGENT_KEYS.all, "dropdown", { filters }] as const,
  assignList: (filters: string) =>
    [...AGENT_KEYS.all, "assign-list", { filters }] as const,
  reportTo: (filters: string) =>
    [...AGENT_KEYS.all, "report-to", { filters }] as const,
  details: () => [...AGENT_KEYS.all, "detail"] as const,
  detail: (id: string | number) => [...AGENT_KEYS.details(), id] as const,
};

export const useGetAgents = (payload: AgentPayload) => {
  return useQuery({
    queryKey: AGENT_KEYS.list(JSON.stringify(payload)),
    queryFn: () => agentApis.agentListAll(payload),
    enabled: !!payload,
  });
};

export const useGetAgentDetails = (payload: AgentPayload) => {
  return useQuery({
    queryKey: AGENT_KEYS.detail(JSON.stringify(payload)),
    queryFn: () => agentApis.agentView(payload),
    enabled: !!payload?.nAgentId,
  });
};

export const useGetAgentDropdown = (payload: AgentPayload) => {
  return useQuery({
    queryKey: AGENT_KEYS.dropdown(JSON.stringify(payload)),
    queryFn: () => agentApis.agentDropDown(payload),
    enabled: !!payload,
  });
};

export const useGetAssignAgentList = (
  payload: AgentPayload,
  enabled = true
) => {
  return useQuery({
    queryKey: AGENT_KEYS.assignList(JSON.stringify(payload)),
    queryFn: () => agentApis.assignAgentList(payload),
    enabled: enabled && !!payload?.nGroupId,
  });
};

export const useGetReportToAgents = (payload: AgentPayload) => {
  return useQuery({
    queryKey: AGENT_KEYS.reportTo(JSON.stringify(payload)),
    queryFn: () => agentApis.agentToReportList(payload),
    enabled: !!payload,
  });
};

export const useSaveAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AgentPayload) => agentApis.agentSave(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.all });
      queryClient.refetchQueries({ queryKey: AGENT_KEYS.lists() });
    },
  });
};

export const useUpdateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AgentPayload) => agentApis.agentUpdate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.all });
      queryClient.refetchQueries({ queryKey: AGENT_KEYS.lists() });
    },
  });
};

export const useDeleteAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AgentPayload) => agentApis.agentDelete(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.all });
      queryClient.refetchQueries({ queryKey: AGENT_KEYS.lists() });
    },
  });
};
