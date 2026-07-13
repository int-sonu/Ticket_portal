import axiosInstance from "./axios";

export interface ItemRepairPayload {
  [key: string]: any;
}

const normalizeAssignedItemRepairPayload = (payload: ItemRepairPayload = {}) => {
  const creatorId =
    payload?.nCreatedBy ??
    payload?.nCreatedby ??
    payload?.createdBy ??
    payload?.creatorId ??
    payload?.id ??
    payload?.nAgentId ??
    0;

  return {
    ...payload,
    nCreatedBy: Number(creatorId) || 0,
    nCreatedby: Number(creatorId) || 0,
    createdBy: Number(creatorId) || 0,
    creatorId: Number(creatorId) || 0,
  };
};

export const itemRepairApis = {
  repairItemActivityDropDown: async (payload: ItemRepairPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/ItemRepair/RepairItemActivityList",
      payload,
    );

    return response.data;
  },

  itemRepairAction: async (payload: ItemRepairPayload | FormData) => {
    const response = await axiosInstance.post(
      "/Api/V1/ItemRepair/ItemRepairAction",
      payload,
      payload instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined,
    );

    return response.data;
  },

  repairItemActivityList: async (payload: ItemRepairPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/ItemRepair/AssignedItemRepairListByCreator",
      normalizeAssignedItemRepairPayload(payload),
    );

    return response.data;
  },

  repairItemFinishedList: async (payload: ItemRepairPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/ItemRepair/AssignedItemRepairFinishedListByCreator",
      normalizeAssignedItemRepairPayload(payload),
    );

    return response.data;
  },

  unassignedItemRepairList: async (payload: ItemRepairPayload) => {
    const response = await axiosInstance.post(
      "http://postgresqlticketapi.ortezerp.in/Api/V1/ItemRepair/UnassignedItemRepairList",
      normalizeAssignedItemRepairPayload(payload),
    );

    return response.data;
  },
};
