export const getRequestPayload = () => {
  const safeParse = (value: string | null) => {
    try {
      return value ? JSON.parse(value) : {};
    } catch {
      return {};
    }
  };

  const session = safeParse(sessionStorage.getItem("userSession"));
  const credentials = safeParse(localStorage.getItem("userCredentials"));
  const sessionData = session?.data ?? session;
  const credentialData = credentials?.data ?? credentials;
  const companyDetails =
    sessionData?.companyDetails ??
    credentialData?.companyDetails ??
    {};
  const companyId =
    sessionData?.nCompanyId ??
    sessionData?.companyId ??
    sessionData?.CompanyId ??
    sessionData?.companyID ??
    companyDetails?.nCompanyId ??
    companyDetails?.companyId ??
    companyDetails?.CompanyId ??
    credentials?.nCompanyId ??
    credentials?.companyId ??
    credentials?.CompanyId ??
    credentials?.companyID;
  const agentId =
    sessionData?.id ??
    sessionData?.nAgentId ??
    credentialData?.id ??
    credentialData?.nAgentId ??
    credentials?.id ??
    credentials?.nAgentId;

  return {
    cDbName:
      sessionData?.cDbName ??
      sessionData?.dbName ??
      sessionData?.DbName ??
      sessionData?.cDatabaseName ??
      sessionData?.databaseName ??
      sessionData?.database ??
      sessionData?.DatabaseName ??
      credentialData?.cDbName ??
      credentialData?.dbName,
    cSchemaName:
      sessionData?.cSchemaName ??
      sessionData?.schemaName ??
      sessionData?.SchemaName ??
      sessionData?.companyCode ??
      sessionData?.CompanyCode ??
      sessionData?.companycode ??
      credentialData?.cSchemaName ??
      credentialData?.schemaName ??
      credentialData?.companyCode ??
      credentialData?.CompanyCode,
    nCompanyId: companyId,
    id: agentId,
    nType: sessionData?.nType ?? credentialData?.nType,
    nAgentId: agentId,
  };
};
