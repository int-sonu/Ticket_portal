import axiosInstance from "./axios";

export interface ItemRepairPayload {
  [key: string]: any;
}

export const itemRepairApis = {
  repairItemActivityList: async (payload: ItemRepairPayload) => {
    const response = await axiosInstance.post(
      "/Api/V1/ItemRepair/RepairItemActivityList",
      payload
    );

    return response.data;
  },
};
