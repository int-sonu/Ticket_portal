export type AgentRow = {
  id: string | number;
  key: string | number;
  srl: number;
  name: string;
  shortName: string;
  userType: string;
  groupName: string;
  phoneNo: string;
  email: string;
  username: string;
  reportingTo: string;
  isSupportAgent: boolean;
  active: boolean;
};

export const USER_TYPE_LABEL: Record<number, string> = {
  1: 'Admin',
  2: 'Manager',
  3: 'Agent',
};

export const getSessionPayload = () => {
  try {
    const session = JSON.parse(sessionStorage.getItem('userSession') || '{}');

    return {
      cDbName: session?.dbName,
      cSchemaName: session?.cSchemaName,
      nCompanyId: session?.nCompanyId,
    };
  } catch {
    return {};
  }
};

export const extractAgentList = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.result)) return response.result;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.agentList)) return response.agentList;

  return [];
};

export const getTotalCount = (response: any, fallback: number) =>
  response?.totalCount ??
  response?.data?.totalCount ??
  response?.data?.totalRecords ??
  response?.totalRecords ??
  fallback;

export const mapAgentRow = (agent: any, index: number): AgentRow => {
  const id = agent?.nAgentId ?? agent?.agentId ?? agent?.id ?? agent?.nUserId ?? index + 1;
  const firstName = agent?.cFirstName || agent?.firstName || '';
  const lastName = agent?.cLastName || agent?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    id,
    key: id,
    srl: index + 1,
    name: agent?.cAgentName ?? agent?.agentName ?? agent?.cName ?? agent?.name ?? fullName ?? 'N/A',
    shortName: agent?.cAgentshName ?? agent?.shortName ?? agent?.cShortName ?? '',
    userType: USER_TYPE_LABEL[Number(agent?.nType)] ?? agent?.cTypeName ?? agent?.role ?? 'Agent',
    groupName: agent?.cGroupName ?? agent?.groupName ?? 'N/A',
    phoneNo: agent?.cPhoneNo ?? agent?.phoneNo ?? '',
    email: agent?.cEmail ?? agent?.email ?? agent?.cEmailId ?? '',
    username: agent?.cUsername ?? agent?.username ?? '',
    reportingTo: agent?.cReportingagentDtls ?? agent?.reportingTo ?? '',
    isSupportAgent: !agent?.bNonSuportingUser,
    active: agent?.bActive !== false && agent?.bCancelled !== true,
  };
};

export const filterAgents = (agents: AgentRow[], searchTerm: string) => {
  const search = searchTerm.trim().toLowerCase();

  if (!search) return agents;

  return agents.filter((agent) =>
    agent.name.toLowerCase().includes(search) ||
    agent.shortName.toLowerCase().includes(search) ||
    agent.userType.toLowerCase().includes(search) ||
    agent.groupName.toLowerCase().includes(search),
  );
};

export const buildAgentFormValues = (agent?: AgentRow | null) => ({
  name: agent?.name ?? '',
  shortName: agent?.shortName ?? '',
  userType: agent?.userType ?? undefined,
  reportingTo: agent?.reportingTo || undefined,
  agentGroup: agent?.groupName ?? undefined,
  isSupportAgent: agent?.isSupportAgent ?? false,
  phoneNo: agent?.phoneNo ?? '',
  email: agent?.email ?? '',
  username: agent?.username ?? '',
  password: '',
  active: agent?.active ?? true,
});
