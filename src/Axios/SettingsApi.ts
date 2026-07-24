import axiosInstance from "./axios";

export type SettingsPayload = Record<string, unknown>;

export const settingsApis = {
  getConfiguration: async (payload: SettingsPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Configuration/GetConfiguration",
      payload,
    );
    return response.data;
  },

  configurationSave: async (payload: FormData) => {
    const response = await axiosInstance.post(
      "/Api/V1/Configuration/ConfigurationSave",
      payload,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  getNotificationSettings: async (payload: SettingsPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Notification/GetNotificationSettings",
      payload,
    );
    return response.data;
  },

  notificationSettingsSave: async (payload: SettingsPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Notification/NotificationSettingsSave",
      payload,
    );
    return response.data;
  },

  getCompanyDetails: async (payload: SettingsPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Configuration/GetCompanyDetails",
      payload,
    );
    return response.data;
  },

  updateCompanyDetails: async (payload: FormData) => {
    const response = await axiosInstance.put(
      "/Api/V1/Configuration/UpdateCompanyDetails",
      payload,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },


  itemRepairListCount: async (payload: SettingsPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/ItemRepair/ItemRepairListCount",
      payload,
    );
    return response.data;
  },

  getCompanyFeatures: async (payload: SettingsPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/CompanyFeature/GetCompanyFeatures",
      payload,
    );
    return response.data;
  },

  currencyDropDown: async (payload: SettingsPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Currency/CurrencyDropDown",
      payload,
    );
    return response.data;
  },

  featuresSave: async (payload: SettingsPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/CompanyFeature/FeaturesSave",
      payload,
    );
    return response.data;
  },

  supervisorList: async (payload: SettingsPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Supervisor/SupervisorList",
      payload,
    );
    return response.data;
  },

  supervisorLinkedList: async (payload: SettingsPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Supervisor/SupervisorLinkedList",
      payload,
    );
    return response.data;
  },

  linkingAgentList: async (payload: SettingsPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Supervisor/LinkingAgentList",
      payload,
    );
    return response.data;
  },

  supervisorLinkingSave: async (payload: SettingsPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Supervisor/SupervisorLinkingSave",
      payload,
    );
    return response.data;
  },

  supervisorLinkedListDelete: async (payload: SettingsPayload) => {
    const response = await axiosInstance.delete(
      "/Api/V1/Supervisor/SupervisorLinkedListDelete",
      { data: payload },
    );
    return response.data;
  },

  agentDropDown: async (payload: SettingsPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/Agent/AgentDropDown",
      payload,
    );
    return response.data;
  },

  getMenuRights: async (payload: SettingsPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/MenuRights/GetMenuRights",
      payload,
    );
    return response.data;
  },

  menuRightsSave: async (payload: SettingsPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/MenuRights/MenuRightsSave",
      payload,
    );
    return response.data;
  },
};
