import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  assetMasterApis,
} from "../../../Axios/AgentApis";

import type {
  AssetMasterPayload,
} from "../../../Axios/AgentApis";

export const ASSET_MASTER_KEYS = {
  all: ["asset-master"] as const,

  lists: () =>
    [
      ...ASSET_MASTER_KEYS.all,
      "list",
    ] as const,

  list: (filters: string) =>
    [
      ...ASSET_MASTER_KEYS.lists(),
      { filters },
    ] as const,
};

export const useGetAssetMasters = (
  payload: AssetMasterPayload
) =>
  useQuery({
    queryKey:
      ASSET_MASTER_KEYS.list(
        JSON.stringify(payload)
      ),

    queryFn: () =>
      assetMasterApis.assetMasterList(
        payload
      ),

    enabled: !!payload,
  });

export const useGetAssetMasterSuggest = (
  payload: AssetMasterPayload
) =>
  useQuery({
    queryKey: [
      ...ASSET_MASTER_KEYS.all,
      "suggest",
      payload,
    ],

    queryFn: () =>
      assetMasterApis.assetMasterSuggest(
        payload
      ),

    enabled: !!payload,
  });

export const useSaveAssetMaster = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload: AssetMasterPayload
    ) =>
      assetMasterApis.assetMasterSave(
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          ASSET_MASTER_KEYS.lists(),
      });
    },
  });
};

export const useUpdateAssetMaster = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload: AssetMasterPayload
    ) =>
      assetMasterApis.assetMasterUpdate(
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          ASSET_MASTER_KEYS.lists(),
      });
    },
  });
};

export const useDeleteAssetMaster = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (
      payload: AssetMasterPayload
    ) =>
      assetMasterApis.assetMasterDelete(
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          ASSET_MASTER_KEYS.lists(),
      });
    },
  });
};
