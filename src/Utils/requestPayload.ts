export const getRequestPayload = () => {
  const session = JSON.parse(
    sessionStorage.getItem("userSession") || "{}"
  );

  return {
    cDbName:
      session.cDbName ??
      session.dbName ??
      session.DbName ??
      session.cDatabaseName ??
      session.databaseName,
    cSchemaName: session.cSchemaName,
    nCompanyId: session.nCompanyId,
    id: session.id,
    nType: session.nType,
    nAgentId: session.id ?? session.nAgentId,
  };
};
