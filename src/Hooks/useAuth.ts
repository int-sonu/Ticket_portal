import { useMutation } from '@tanstack/react-query';
import { userLogin, changePassword, logout } from '../Axios/AuthApi';

export const useUserLogin = () => {
  return useMutation({
    mutationFn: userLogin,
    onSuccess: (data) => {
      if (data.statusCode === 200) {
        console.log('Login successful', data);
        // You can store token/session info here, e.g. localStorage.setItem('token', data.token);
      }
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const data = error?.response?.data;
      console.error('Login error', {
        message: error?.message,
        status,
        data,
      });
    }
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: changePassword,
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Clear localStorage or state
      console.log('Logout successful');
    }
  });
};
