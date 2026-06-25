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
      session.databaseName ??
      session.database ??
      session.DatabaseName,
    cSchemaName:
      session.cSchemaName ??
      session.schemaName ??
      session.SchemaName ??
      session.companyCode ??
      session.CompanyCode ??
      session.companycode,
    nCompanyId:
      session.nCompanyId ??
      session.companyId ??
      session.CompanyId ??
      session.companyID,
    id: session.id,
    nType: session.nType,
    nAgentId: session.id ?? session.nAgentId,
  };
};
