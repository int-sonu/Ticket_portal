import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  departmentApis,
} from "../../../Axios/AgentApis";



// ============================
// GET
// ============================

export const useGetDepartments = (
  payload: any
) => {
  return useQuery({
    queryKey: [
      "department-list",
      payload,
    ],

    queryFn: () =>
      departmentApis.departmentListAll(
        payload
      ),
  });
};




// ============================
// SAVE
// ============================

export const useSaveDepartment =
  () => {

    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        departmentApis.departmentSave,

      onSuccess: () => {

        queryClient.invalidateQueries({
          queryKey: [
            "department-list",
          ],
        });
      },
    });
  };






// ============================
// UPDATE
// ============================

export const useUpdateDepartment =
  () => {

    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        departmentApis.departmentUpdate,

      onSuccess: () => {

        queryClient.invalidateQueries({
          queryKey: [
            "department-list",
          ],
        });
      },
    });
  };






// ============================
// DELETE
// ============================

export const useDeleteDepartment =
  () => {

    const queryClient =
      useQueryClient();

    return useMutation({
      mutationFn:
        departmentApis.departmentDelete,

      onSuccess: () => {

        queryClient.invalidateQueries({
          queryKey: [
            "department-list",
          ],
        });
      },
    });
  };