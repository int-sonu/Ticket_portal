import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentApis, groupApis } from '../../../Axios/AgentApis';
import type { AgentPayload, GroupPayload } from '../../../Axios/AgentApis';

// Query Keys
export const AGENT_KEYS = {
  all: ['agents'] as const,
  lists: () => [...AGENT_KEYS.all, 'list'] as const,
  list: (filters: string) => [...AGENT_KEYS.lists(), { filters }] as const,
  details: () => [...AGENT_KEYS.all, 'detail'] as const,
  detail: (id: string | number) => [...AGENT_KEYS.details(), id] as const,
};

export const GROUP_KEYS = {
  all: ['groups'] as const,
  lists: () => [...GROUP_KEYS.all, 'list'] as const,
  list: (filters: string) => [...GROUP_KEYS.lists(), { filters }] as const,
};

// 1. Fetch all agents
export const useGetAgents = (payload: AgentPayload) => {
  return useQuery({
    queryKey: AGENT_KEYS.list(JSON.stringify(payload)),
    queryFn: () => agentApis.agentListAll(payload),
    enabled: !!payload, // Ensures it doesn't fetch until we have a valid payload
  });
};

// 2. Fetch specific agent details
export const useGetAgentDetails = (payload: AgentPayload) => {
  return useQuery({
    queryKey: AGENT_KEYS.detail(JSON.stringify(payload)),
    queryFn: () => agentApis.agentView(payload),
    enabled: !!payload && Object.keys(payload).length > 0,
  });
};

// 3. Save new agent
export const useSaveAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AgentPayload) => agentApis.agentSave(payload),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.lists() });
    },
  });
};

// 4. Update agent
export const useUpdateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AgentPayload) => agentApis.agentUpdate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.all });
    },
  });
};

// 5. Delete agent
export const useDeleteAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AgentPayload) => agentApis.agentDelete(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_KEYS.lists() });
    },
  });
};

export const useGetGroups = (payload: GroupPayload) => {
  return useQuery({
    queryKey: GROUP_KEYS.list(JSON.stringify(payload)),
    queryFn: () => groupApis.groupList(payload),
    enabled: !!payload,
  });
};

export const useSaveGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GroupPayload) => groupApis.groupSave(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.lists() });
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GroupPayload) => groupApis.groupUpdate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.lists() });
    },
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GroupPayload) => groupApis.groupDelete(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUP_KEYS.lists() });
    },
  });
};
