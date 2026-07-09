import axios from 'axios';
import { getConfig } from './config';

const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

const normalizeBasePath = (apiBaseUrl: string) => {
  try {
    return new URL(apiBaseUrl).pathname.replace(/\/$/, '') || '/';
  } catch {
    return apiBaseUrl.replace(/\/$/, '');
  }
};

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      // Dynamically get the loaded configuration
      const appConfig = getConfig();
      
      // In dev, route requests through the Vite proxy so the browser sees same-origin calls.
      // In production, keep the configured absolute API URL.
      if (appConfig.API_BASE_URL && config.url && !config.url.startsWith('http')) {
        const base = import.meta.env.DEV
          ? normalizeBasePath(appConfig.API_BASE_URL)
          : appConfig.API_BASE_URL.replace(/\/$/, '');
        
        // Remove /Api/V1 from the start of the request URL if it was already included
        let path = config.url.replace(/^\//, '');
        if (path.toLowerCase().startsWith('api/v1/')) {
           path = path.substring(7);
        }
        
        config.url = `${base}/${path}`;
      }
      
      // Attach session info to headers if a user is logged in
      const sessionStr = sessionStorage.getItem('userSession');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session.cSessionId) {
          // You may need to adapt this header based on your backend's exact requirements
          // E.g., 'Authorization': `Bearer ${session.cSessionId}` or a custom header:
          config.headers['Authorization'] = `Bearer ${session.cSessionId}`;
        }
      }
    } catch (e) {
      console.warn('Config might not be loaded yet.');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
