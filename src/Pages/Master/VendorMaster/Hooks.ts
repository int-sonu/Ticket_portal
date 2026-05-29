import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { vendorApis } from "../../../Axios/MasterApis";

// ============================
// GET
// ============================

export const useGetVendors = (payload: any) => {
  return useQuery({
    queryKey: ["vendor-list", payload],

    queryFn: () => vendorApis.vendorListAll(payload),
  });
};

// ============================
// SAVE
// ============================

export const useSaveVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorApis.vendorSave,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["vendor-list"],
      });
    },
  });
};

// ============================
// UPDATE
// ============================

export const useUpdateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorApis.vendorUpdate,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["vendor-list"],
      });
    },
  });
};

// ============================
// DELETE
// ============================

export const useDeleteVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vendorApis.vendorDelete,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["vendor-list"],
      });
    },
  });
};
