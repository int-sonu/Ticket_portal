import axiosInstance from './axios';
import { getRequestPayload } from '../Utils/requestPayload';
import { hydrateSessionStorage } from '../Utils/session';

export const userLogin = async (data: any) => {
  const response = await axiosInstance.post('/Authentication/UserLogin', data);
  return response.data;
};

export const changePassword = async (data: any) => {
  const response = await axiosInstance.post('/Authentication/ChangePassword', data);
  return response.data;
};

export const logout = async () => {
  const requestPayload = getRequestPayload();
  const storedSession = hydrateSessionStorage();
  const session = storedSession?.data ?? storedSession ?? {};

  const response = await axiosInstance.post(
    '/Api/V1/Authentication/Logout',
    {
      nAgentId: Number(requestPayload.nAgentId ?? requestPayload.id ?? 0),
      nCompanyId: Number(requestPayload.nCompanyId ?? 0),
      cSchemaName: requestPayload.cSchemaName ?? '',
      cDbName: requestPayload.cDbName ?? '',
      cSessionId: session.cSessionId ?? '',
    },
  );
  return response.data;
};
