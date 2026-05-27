export type AgentRow = {
  id: string | number;
  key: string | number;
  srl: number;
  name: string;
  shortName: string;
  userType: string;
  nUserType?: number;
  nAgentGroupId?: string | number;
  groupName: string;
  nReportTo?: string | number;
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
  if (Array.isArray(response?.message)) return response.message;
  if (Array.isArray(response?.data?.message)) return response.data.message;
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
    userType: agent?.cTypeName ?? agent?.cUserType ?? agent?.role ?? USER_TYPE_LABEL[Number(agent?.nType)] ?? 'Agent',
    nUserType: agent?.nType ?? agent?.nUserType,
    nAgentGroupId: agent?.nGroupId ?? agent?.nAgentGroupId,
    groupName: agent?.cGroupName ?? agent?.groupName ?? 'N/A',
    nReportTo: agent?.nReportAgentId ?? agent?.nReportTo,
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

export const normalizeValue = (value: any) => String(value ?? '').trim().toLowerCase();
export const normalizeCompareText = normalizeValue;

export const trimAgentFormValues = (values: any) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.trim() : value,
    ]),
  );

export const buildAgentFormValues = (agent?: AgentRow | null) => ({
  agentName: agent?.name ?? '',
  agentShortName: agent?.shortName ?? '',
  nUserType: agent?.nUserType,
  nReportTo: agent?.nReportTo,
  nAgentGroupId: agent?.nAgentGroupId,
  cAgentGroupName: agent?.groupName === 'N/A' ? '' : agent?.groupName,
  bSupportAgent: agent?.isSupportAgent ?? false,
  cMobileNo: agent?.phoneNo ?? '',
  email: agent?.email ?? '',
  cEmail: agent?.email ?? '',
  username: agent?.username ?? '',
  password: '',
  active: agent?.active ?? true,
});

export const getSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem('userSession') || '{}');
  } catch {
    return {};
  }
};

export const extractFirstRecord = (response: any) => {
  const list = extractAgentList(response);

  return list[0] ?? response?.data ?? response?.result ?? response;
};

export const extractGenericList = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.message)) return response.message;
  if (Array.isArray(response?.data?.message)) return response.data.message;
  if (Array.isArray(response?.result)) return response.result;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.list)) return response.list;
  if (Array.isArray(response?.agentList)) return response.agentList;
  if (Array.isArray(response?.data?.agentList)) return response.data.agentList;
  if (Array.isArray(response?.groupList)) return response.groupList;
  if (Array.isArray(response?.data?.groupList)) return response.data.groupList;
  if (Array.isArray(response?.data?.result)) return response.data.result;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.list)) return response.data.list;

  return [];
};

export const extractNamedList = (response: any, keys: string[]): any[] => {
  if (!response || typeof response !== 'object') return [];

  const stack = [response];
  const normalizedKeys = keys.map((key) => key.toLowerCase());

  while (stack.length) {
    const current = stack.shift();

    if (!current || typeof current !== 'object') continue;

    for (const [key, value] of Object.entries(current)) {
      if (normalizedKeys.includes(key.toLowerCase()) && Array.isArray(value)) {
        return value;
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        stack.push(value);
      }
    }
  }

  return [];
};

export const buildAgentPayload = (formValues: any, selectedAgent: AgentRow | null) => {
  const userCreds = getSession();
  const values = trimAgentFormValues(formValues);
  const payload: Record<string, any> = {
    nAgentId: selectedAgent?.id,
    cAgentName: values.agentName,
    cAgentshName: values.agentShortName,
    nGroupId: values.nAgentGroupId,
    cGroupName: values.cAgentGroupName,
    cPhoneNo: values.cMobileNo,
    cEmail: values.cEmail,
    cUsername: values.username,
    nType: values.nUserType,
    nReportAgentId: values.nReportTo,
    bNonSuportingUser: !values.bSupportAgent,
    nCreatedBy: userCreds.id,
    bActive: values.active ?? true,
    nCompanyId: userCreds.nCompanyId,
    cSchemaName: userCreds.cSchemaName,
    cDbName: userCreds.dbName,
  };

  if (values.password) {
    payload.cPassword = values.password;
  }

  return payload;
};

export const makeOption = (
  item: any,
  valueKeys: string[],
  labelKeys: string[],
) => {
  const value = valueKeys.map((key) => item?.[key]).find((itemValue) => itemValue !== undefined && itemValue !== null);
  const label = labelKeys.map((key) => item?.[key]).find((itemLabel) => itemLabel !== undefined && itemLabel !== null && itemLabel !== '');

  if (value === undefined || value === null || !label) return null;

  return {
    label: String(label),
    value,
    raw: item,
  };
};

export const makeUserTypeOption = (item: any) => {
  const value = item?.nType ?? item?.nUserType ?? item?.id ?? item?.value;
  const label = item?.cTypeName ?? item?.cUserType ?? item?.userType ?? item?.label ?? USER_TYPE_LABEL[Number(value)];

  if (value === undefined || value === null || !label) return null;

  return {
    label: String(label),
    value,
    raw: item,
  };
};

export const uniqueOptions = <T extends { value: string | number }>(options: Array<T | null>) => {
  const seen = new Set<string | number>();

  return options.filter((option): option is T => {
    if (!option || seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
};

export const isApiSuccess = (response: any) => {
  const statusCode = response?.statusCode ?? response?.data?.statusCode;

  return statusCode === undefined || (Number(statusCode) >= 200 && Number(statusCode) < 300);
};

export const getApiMessage = (response: any, fallback: string) =>
  String(
    response?.response?.data?.message ??
    response?.data?.message ??
    response?.message ??
    fallback,
  ).includes('tm_agent_cusername_key')
    ? 'Username already exists in backend. Please use another username.'
    : response?.response?.data?.message ??
      response?.data?.message ??
      response?.message ??
      fallback;
