import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {customerApis,} from  "../../../Axios/AgentApis";

export const useGetCustomers = (
  payload: any
) => {
  return useQuery({
    queryKey: [
      "customer-list",
      payload,
    ],

    queryFn: () =>
      customerApis.customerList(
        payload
      ),
  });
};

export const useSaveCustomer =
  () => {

    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        customerApis.customerSave,

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "customer-list",
          ],
        });
      },
    });
  };

export const useUpdateCustomer =
  () => {

    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        customerApis.customerUpdate,

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "customer-list",
          ],
        });
      },
    });
  };

export const useDeleteCustomer =
  () => {

    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        customerApis.customerDelete,

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            "customer-list",
          ],
        });
      },
    });
  };

export const useGetAssetMasterSuggest = (
  payload: any
) => {
  return useQuery({
    queryKey: [
      "asset-master-suggest",
      payload,
    ],

    queryFn: () =>
      customerApis.assetMasterSuggest(
        payload
      ),
  });
};
