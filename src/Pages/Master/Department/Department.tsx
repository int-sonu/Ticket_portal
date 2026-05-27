import { useMemo } from "react";

import SimpleMasterList from "../Common/SimpleMasterList";

import type {
  SimpleMasterRow,
} from "../Common/SimpleMasterUtils";

import {
  useDeleteDepartment,
  useGetDepartments,
  useSaveDepartment,
  useUpdateDepartment,
} from "./Hooks";



// ============================
// TABLE DATA
// ============================

const mapDepartmentRow = (
  item: any,
  index: number
): SimpleMasterRow => ({
  id:
    item?.nDepartmentid ??
    item?.nDepartmentId ??
    index + 1,

  key:
    item?.nDepartmentid ??
    item?.nDepartmentId ??
    index + 1,

  srl:
    index + 1,

  name:
    item?.cDepartmentName ??
    item?.cDeptName ??
    "N/A",



  // API FIELD

  shortName:
    item?.cDepartmentShName ??
    item?.cDeptShName ??
    item?.cShName ??
    "",



  active:
    item?.bActive !== false &&
    item?.bCancelled !== true,

  raw: item,
});





// ============================
// SAVE / UPDATE PAYLOAD
// ============================

const buildDepartmentPayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => ({
  nDepartmentId:
    selectedRow?.id,

  nDepartmentid:
    selectedRow?.id,



  // API FIELD

  cDepartmentName:
    values.name,

  cDeptName:
    values.name,



  // API FIELD

  cShName:
    values.shortName,

  cDepartmentShName:
    values.shortName,



  bActive:
    values.active ?? true,
});

const buildDepartmentDeletePayload = (
  record: SimpleMasterRow
) =>
  buildDepartmentPayload(
    {
      name: record.name,
      shortName: record.shortName,
      active: false,
    },
    record
  );







const Department = () => {

  // SAVE

  const {
    mutate: saveDepartment,

    isPending: isSaving,
  } = useSaveDepartment();




  // UPDATE

  const {
    mutate: updateDepartment,

    isPending: isUpdating,
  } = useUpdateDepartment();




  // DELETE

  const {
    mutate: deleteDepartment,
  } = useDeleteDepartment();







  // MASTER CONFIG

  const listProps = useMemo(
    () => ({
      title:
        "Department Master",

      entityName:
        "Department",

      nameColumnTitle:
        "Department Name",

      drawerDescription:
        "This section allows you to manage department details including add, edit, delete and view.",

      idKey:
        "nDepartmentId",

      useListQuery:
        useGetDepartments,

      saveMutation:
        saveDepartment,

      updateMutation:
        updateDepartment,

      deleteMutation:
        deleteDepartment,

      isSaving:
        isSaving || isUpdating,

      mapRow:
        mapDepartmentRow,

      buildPayload:
        buildDepartmentPayload,

      buildDeletePayload:
        buildDepartmentDeletePayload,



      // COMMON FIELDS

      hasShortName:
        true,
    }),

    [
      deleteDepartment,
      isSaving,
      isUpdating,
      saveDepartment,
      updateDepartment,
    ]
  );






  return (
    <SimpleMasterList
      {...listProps}
    />
  );
};

export default Department;
