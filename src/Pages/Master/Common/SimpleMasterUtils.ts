export type SimpleMasterRow = {
  id: string | number;
  key: string | number;
  srl: number;
  name: string;
  shortName: string;
  active: boolean;
  raw?: any;
  [key: string]: any;
};

export type SessionPayload = {
  cDbName?: string;
  cSchemaName?: string;
  nCompanyId?: number;
  nModifiedBy?: number;
};

export const getSessionPayload = (): SessionPayload => {
  try {
    const session = JSON.parse(sessionStorage.getItem('userSession') || '{}');

    return {
      cDbName: session?.cDbName ?? session?.dbName,
      cSchemaName: session?.cSchemaName,
      nCompanyId: session?.nCompanyId,
      nModifiedBy: session?.id,
    };
  } catch {
    return {};
  }
};

export const extractList = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.message)) return response.message;
  if (Array.isArray(response?.data?.message)) return response.data.message;
  if (Array.isArray(response?.result)) return response.result;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.list)) return response.list;
  if (Array.isArray(response?.data?.result)) return response.data.result;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data?.list)) return response.data.list;
  if (Array.isArray(response?.groupList)) return response.groupList;
  if (Array.isArray(response?.data?.groupList)) return response.data.groupList;
  if (Array.isArray(response?.vendorList)) return response.vendorList;
  if (Array.isArray(response?.data?.vendorList)) return response.data.vendorList;
  if (Array.isArray(response?.brandList)) return response.brandList;
  if (Array.isArray(response?.data?.brandList)) return response.data.brandList;
  if (Array.isArray(response?.departmentList)) return response.departmentList;
  if (Array.isArray(response?.data?.departmentList)) return response.data.departmentList;
  if (Array.isArray(response?.assetList)) return response.assetList;
  if (Array.isArray(response?.data?.assetList)) return response.data.assetList;
  if (Array.isArray(response?.issueList)) return response.issueList;
  if (Array.isArray(response?.data?.issueList)) return response.data.issueList;
  if (Array.isArray(response?.ticketSourceList)) return response.ticketSourceList;
  if (Array.isArray(response?.data?.ticketSourceList)) return response.data.ticketSourceList;
  if (Array.isArray(response?.statusList)) return response.statusList;
  if (Array.isArray(response?.data?.statusList)) return response.data.statusList;
  if (Array.isArray(response?.ticketStatusList)) return response.ticketStatusList;
  if (Array.isArray(response?.data?.ticketStatusList)) return response.data.ticketStatusList;

  return [];
};

const truthyValues = new Set(['true', '1', 'yes', 'y']);

export const isTruthyFlag = (value: any) => {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') return truthyValues.has(value.trim().toLowerCase());

  return false;
};

export const isCancelled = (item: any) =>
  isTruthyFlag(item?.bCancelled) ||
  isTruthyFlag(item?.bCancel) ||
  isTruthyFlag(item?.cancelled) ||
  isTruthyFlag(item?.isCancelled) ||
  isTruthyFlag(item?.bDeleted) ||
  isTruthyFlag(item?.deleted) ||
  isTruthyFlag(item?.isDeleted);

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

const formatValidationErrors = (errors: any) => {
  if (!errors || typeof errors !== 'object') return '';

  return Object.entries(errors)
    .flatMap(([field, messages]) => {
      const list = Array.isArray(messages) ? messages : [messages];

      return list.map((item) => `${field}: ${item}`);
    })
    .join(', ');
};

export const getApiMessage = (response: any, fallback: string) => {
  const validationMessage =
    formatValidationErrors(response?.response?.data?.errors) ||
    formatValidationErrors(response?.data?.errors) ||
    formatValidationErrors(response?.errors);
  const status = response?.response?.status ?? response?.status;

  return (
    validationMessage ||
    response?.response?.data?.message ||
    response?.response?.data?.title ||
    response?.data?.message ||
    response?.data?.title ||
    response?.message ||
    response?.response?.statusText ||
    (status === 405 ? 'This action is not allowed by the API. Please refresh and try again.' : '') ||
    fallback
  );
};

export const getTotalCount = (response: any, fallback: number) =>
  response?.totalCount ??
  response?.data?.totalCount ??
  response?.data?.totalRecords ??
  response?.totalRecords ??
  fallback;

export const filterSimpleMasterRows = (rows: SimpleMasterRow[], searchTerm: string) => {
  const search = searchTerm.trim().toLowerCase();

  if (!search) return rows;

  return rows.filter((row) =>
    row.name.toLowerCase().includes(search) ||
    row.shortName.toLowerCase().includes(search),
  );
};

export const buildSimpleMasterFormValues = (row?: SimpleMasterRow | null) => ({
  name: row?.name ?? '',
  shortName: row?.shortName ?? '',
  active: row?.active ?? true,
});

export const normalizeText = (value: any) => String(value ?? '').trim();

export const normalizeCompareText = (value: any) => normalizeText(value).toLowerCase();

export const trimFormValues = (values: any) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.trim() : value,
    ]),
  );
