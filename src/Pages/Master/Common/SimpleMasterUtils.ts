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
      cDbName: session?.dbName,
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

  return (
    validationMessage ||
    response?.response?.data?.message ||
    response?.response?.data?.title ||
    response?.response?.statusText ||
    response?.data?.message ||
    response?.data?.title ||
    response?.message ||
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
