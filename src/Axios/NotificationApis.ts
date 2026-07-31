import axiosInstance from "./axios";

export type NotificationPayload = Record<string, unknown>;

export const notificationApis = {
  notificationList: async (payload: NotificationPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Notification/NotificationList",
      payload,
    );
    return response.data;
  },

  clearNotificationList: async (payload: NotificationPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Notification/ClearNotificationList",
      payload,
    );
    return response.data;
  },

  getNotificationSettings: async (payload: NotificationPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Notification/GetNotificationSettings",
      payload,
    );
    return response.data;
  },

  clearAllNotifications: async (payload: NotificationPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Notification/ClearAllNotifications",
      payload,
    );
    return response.data;
  },

  registerDeviceToken: async (payload: NotificationPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Notification/RegisterDeviceToken",
      payload,
    );
    return response.data;
  },

  notificationSettingsSave: async (payload: NotificationPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Notification/NotificationSettingsSave",
      payload,
    );
    return response.data;
  },
};
