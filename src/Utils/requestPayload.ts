export const getRequestPayload = () => {
  const session = JSON.parse(
    sessionStorage.getItem("userSession") || "{}"
  );

  console.log("FULL SESSION:", JSON.stringify(session, null, 2)); // 👈 see exact keys
  
  return {
    cDbName: session.cDbName || session.DbName || session.cDatabaseName || session.databaseName,
    cSchemaName: session.cSchemaName,
    nCompanyId: session.nCompanyId,
  };
};