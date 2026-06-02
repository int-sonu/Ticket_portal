import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
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

export const useSaveCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerApis.customerSaveWithAssets,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customer-list"],
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

    queryFn: () => customerApis.assetMasterSuggest(payload),
  });
};

export const useGetCustomerAssetDepartments = (payload: any) => {
  return useQuery({
    queryKey: ["customer-asset-departments", payload],

    queryFn: () => departmentApis.departmentDropDown(payload),
  });
};

export const useGetCustomerBrandOptions = (payload: any) => {
  return useQuery({
    queryKey: ["customer-brand-options", payload],

    queryFn: () => brandApis.brandListAll(payload),
  });
};
