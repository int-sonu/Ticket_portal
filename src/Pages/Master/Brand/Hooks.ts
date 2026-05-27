import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  brandApis,
} from "../../../Axios/AgentApis";



// ============================
// GET
// ============================

export const useGetBrands = (
  payload: any
) => {
  return useQuery({
    queryKey: [
      "brand-list",
      payload,
    ],

    queryFn: () =>
      brandApis.brandListAll(
        payload
      ),
  });
};





// ============================
// SAVE
// ============================

export const useSaveBrand =
  () => {

    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        brandApis.brandSave,

      onSuccess: () => {

        queryClient.invalidateQueries({
          queryKey: [
            "brand-list",
          ],
        });
      },
    });
  };






// ============================
// UPDATE
// ============================

export const useUpdateBrand =
  () => {

    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        brandApis.brandUpdate,

      onSuccess: () => {

        queryClient.invalidateQueries({
          queryKey: [
            "brand-list",
          ],
        });
      },
    });
  };






// ============================
// DELETE
// ============================

export const useDeleteBrand =
  () => {

    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        brandApis.brandDelete,

      onSuccess: () => {

        queryClient.invalidateQueries({
          queryKey: [
            "brand-list",
          ],
        });
      },
    });
  };