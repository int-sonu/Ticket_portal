import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  assetMasterApis,
  customerApis,
  departmentApis,
  brandApis,
} from "../../../Axios/MasterApis";

export const useGetCustomers = (payload: any) => {
  return useQuery({
    queryKey: ["customer-list", payload],

    queryFn: () => customerApis.customerList(payload),
  });
};

export const useGetCustomerDropDown = (payload: any) => {
  return useQuery({
    queryKey: ["customer-dropdown", payload],

    queryFn: () => customerApis.customerDropDown(payload),
  });
};

export const useSaveCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerApis.customerSaveWithAssets,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customer-list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["customer-wise-assets"],
      });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerApis.customerUpdateWithAssets,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customer-list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["customer-wise-assets"],
      });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerApis.customerDelete,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customer-list"],
      });
    },
  });
};

export const useGetAssetMasterSuggest = (payload: any) => {
  return useQuery({
    queryKey: ["asset-master-suggest", payload],

    queryFn: () => assetMasterApis.assetMasterSuggest(payload),
  });
};

export const useGetCustomerAssetDepartments = (payload: any) => {
  return useQuery({
    queryKey: ["customer-asset-departments", payload],

    queryFn: () => departmentApis.departmentDropDown(payload),
  });
};

export const useGetCustomerWiseAssets = (payload: any, enabled = true) => {
  return useQuery({
    queryKey: ["customer-wise-assets", payload],

    queryFn: () => customerApis.customerWiseAssetList(payload),

    enabled,
  });
};

export const useGetCustomerBrandOptions = (payload: any) => {
  return useQuery({
    queryKey: ["customer-brand-options", payload],

    queryFn: () => brandApis.brandDropDown(payload),
  });
};
