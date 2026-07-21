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
      cDbName: session?.cDbName ?? session?.dbName,
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

const truthyValues = new Set(['true', '1', 'yes', 'y']);
const falseyValues = new Set(['false', '0', 'no', 'n']);

const isFalseValue = (value: any) => {
  if (value === false || value === 0) return true;
  if (typeof value === 'string') {
    return falseyValues.has(value.trim().toLowerCase());
  }

  return false;
};

export const isCancelledAgent = (agent: any) => {
  const values = [
    agent?.bCancelled,
    agent?.bCancel,
    agent?.cancelled,
    agent?.isCancelled,
    agent?.bDeleted,
    agent?.deleted,
    agent?.isDeleted,
  ];

  return values.some((value) => {
    if (value === true || value === 1) return true;
    if (typeof value === 'string') return truthyValues.has(value.trim().toLowerCase());

    return false;
  });
};

export const getTotalCount = (response: any, fallback: number) =>
  response?.totalCount ??
  response?.data?.totalCount ??
  response?.data?.totalRecords ??
  response?.totalRecords ??
  fallback;

const normalizeKey = (key: string) =>
  key.toLowerCase().replace(/[^a-z0-9]/g, '');

const getValueByKeys = (item: any, keys: string[]) => {
  if (!item || typeof item !== 'object') return undefined;

  const normalizedKeys = keys.map(normalizeKey);
  const entries = Object.entries(item);

  for (const key of keys) {
    const directValue = item[key];

    if (directValue !== undefined && directValue !== null && directValue !== '') {
      return directValue;
    }
  }

  for (const [itemKey, value] of entries) {
    if (
      normalizedKeys.includes(normalizeKey(itemKey)) &&
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value;
    }
  }

  return undefined;
};

const getTextValue = (value: any): string => {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'object') return String(value);

  const nestedValue = getValueByKeys(value, [
    'cAgentName',
    'agentName',
    'cName',
    'name',
    'label',
    'cReportingAgentName',
    'cReportingagentDtls',
    'cReportingAgentDtls',
    'reportingTo',
    'reportToName',
  ]);

  return nestedValue === undefined || nestedValue === null || typeof nestedValue === 'object'
    ? ''
    : String(nestedValue);
};

const getOptionValue = (value: any) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object') return value;

  return getValueByKeys(value, [
    'value',
    'nAgentId',
    'nReportAgentId',
    'nReportingAgentId',
    'nReportingToId',
    'nReportToId',
    'nReportTo',
    'agentId',
    'id',
    'nUserId',
  ]);
};

export const mapAgentRow = (agent: any, index: number): AgentRow => {
  const id = getValueByKeys(agent, ['nAgentId', 'agentId', 'id', 'nUserId']) ?? index + 1;
  const firstName = getValueByKeys(agent, ['cFirstName', 'firstName']) || '';
  const lastName = getValueByKeys(agent, ['cLastName', 'lastName']) || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const reportingToId = getValueByKeys(agent, [
    'nReportAgentId',
    'nReportingAgentId',
    'nReportingToId',
    'nReportToId',
    'nReportTo',
    'nReportingTo',
    'nRepAgentId',
    'nParentAgentId',
    'nManagerAgentId',
    'reportAgentId',
    'reportingAgentId',
    'reportToId',
    'reportingToId',
    'managerAgentId',
  ]);
  const reportingToName = getTextValue(getValueByKeys(agent, [
    'cReportingagentDtls',
    'cReportingAgentDtls',
    'cReportingAgentName',
    'cReportingToAgentName',
    'cReportAgentName',
    'cReportToName',
    'cReportingTo',
    'cReportTo',
    'reportingAgentName',
    'reportingToAgentName',
    'reportingTo',
    'reportToName',
    'managerName',
  ]));

  return {
    id,
    key: id,
    srl: index + 1,
    name: getValueByKeys(agent, ['cAgentName', 'agentName', 'cName', 'name']) ?? fullName ?? 'N/A',
    shortName: getValueByKeys(agent, ['cAgentshName', 'shortName', 'cShortName']) ?? '',
    userType:
      getValueByKeys(agent, ['cTypeName', 'cUserType', 'role']) ??
      USER_TYPE_LABEL[Number(getValueByKeys(agent, ['nType', 'nUserType']))] ??
      'Agent',
    nUserType: getValueByKeys(agent, ['nType', 'nUserType']),
    nAgentGroupId: getValueByKeys(agent, ['nGroupId', 'nAgentGroupId']),
    groupName: getValueByKeys(agent, ['cGroupName', 'groupName', 'cAgentGroupName', 'agentGroupName']) ?? 'N/A',
    nReportTo: reportingToId,
    phoneNo: getValueByKeys(agent, ['cPhoneNo', 'phoneNo', 'cMobileNo', 'mobileNo']) ?? '',
    email: getValueByKeys(agent, ['cEmail', 'email', 'cEmailId']) ?? '',
    username: getValueByKeys(agent, ['cUsername', 'username']) ?? '',
    reportingTo: reportingToName,
    isSupportAgent: !getValueByKeys(agent, ['bNonSuportingUser', 'bNonSupportingUser']),
    active:
      !isFalseValue(getValueByKeys(agent, ['bActive'])) &&
      !isCancelledAgent(agent),
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
  cReportingagentDtls: agent?.reportingTo ?? '',
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
  const reportAgentId =
    selectedAgent?.reportingTo &&
    !selectedAgent?.nReportTo &&
    normalizeCompareText(values.nReportTo) === normalizeCompareText(selectedAgent.reportingTo)
      ? undefined
      : values.nReportTo;
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
    nReportAgentId: reportAgentId,
    nReportTo: reportAgentId,
    nReportToId: reportAgentId,
    nReportingAgentId: reportAgentId,
    nReportingToId: reportAgentId,
    cReportingagentDtls: values.cReportingagentDtls,
    cReportingAgentDtls: values.cReportingagentDtls,
    bNonSuportingUser: !values.bSupportAgent,
    nCreatedBy: selectedAgent ? undefined : userCreds.id,
    nModifiedBy: selectedAgent ? userCreds.id : undefined,
    bActive: values.active ?? true,
    nCompanyId: userCreds.nCompanyId,
    cSchemaName: userCreds.cSchemaName,
    cDbName: userCreds.cDbName ?? userCreds.dbName,
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
  const value = getOptionValue(getValueByKeys(item, valueKeys));
  const label = getTextValue(getValueByKeys(item, labelKeys));

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
  const messageText = String(
    response?.message ??
      response?.data?.message ??
      response?.title ??
      response?.data?.title ??
      ''
  ).toLowerCase();
  const successFlag =
    response?.success ??
    response?.data?.success ??
    response?.isSuccess ??
    response?.data?.isSuccess ??
    response?.status ??
    response?.data?.status;

  if (
    messageText.includes('cannot delete') ||
    messageText.includes('can not delete') ||
    messageText.includes('cannot be deleted') ||
    messageText.includes('failed') ||
    messageText.includes('error') ||
    messageText.includes('not found')
  ) {
    return false;
  }

  if (typeof successFlag === 'boolean') return successFlag;
  if (typeof successFlag === 'string') {
    const normalizedFlag = successFlag.trim().toLowerCase();

    if (['true', 'success', 'succeeded', 'ok', '1'].includes(normalizedFlag)) return true;
    if (['false', 'failed', 'failure', 'error', '0'].includes(normalizedFlag)) return false;
  }

  return statusCode === undefined || (Number(statusCode) >= 200 && Number(statusCode) < 300);
};

export const getApiMessage = (response: any, fallback: string) =>
  formatAgentMessage(response, fallback);

const formatValidationErrors = (errors: any) => {
  if (!errors || typeof errors !== 'object') return '';

  return Object.entries(errors)
    .flatMap(([field, messages]) => {
      const list = Array.isArray(messages) ? messages : [messages];

      return list.map((item) => `${field}: ${item}`);
    })
    .join(', ');
};

const formatAgentMessage = (response: any, fallback: string) => {
  const rawMessage =
    formatValidationErrors(response?.response?.data?.errors) ||
    formatValidationErrors(response?.data?.errors) ||
    response?.response?.data?.message ||
    response?.response?.data?.title ||
    response?.data?.message ||
    response?.data?.title ||
    response?.message ||
    fallback;
  const status = response?.response?.status ?? response?.status;

  if (String(rawMessage).includes('tm_agent_cusername_key')) {
    return 'Username already exists. Please use another username.';
  }

  if (status === 405) {
    return 'Agent action is not allowed by the API. Please refresh and try again.';
  }

  return rawMessage;
};
