import axiosInstance from './axios';

export const userLogin = async (data: any) => {
  const response = await axiosInstance.post('/Authentication/UserLogin', data);
  return response.data;
};

export const changePassword = async (data: any) => {
  const response = await axiosInstance.post('/Authentication/ChangePassword', data);
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post('/Authentication/Logout');
  return response.data;
};
