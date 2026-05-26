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
};

export const getSessionPayload = (): SessionPayload => {
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

export const extractList = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.result)) return response.result;
  if (Array.isArray(response?.items)) return response.items;

  return [];
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
