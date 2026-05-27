import { useMemo } from "react";

import SimpleMasterList from "../Common/SimpleMasterList";

import type { SimpleMasterRow } from "../Common/SimpleMasterUtils";

import {
  useDeleteStatus,
  useGetStatuses,
  useSaveStatus,
  useUpdateStatus,
} from "./Hooks";

const getUserCreds = () => {
  try {
    return JSON.parse(sessionStorage.getItem("userSession") || "{}");
  } catch {
    return {};
  }
};

const isDefaultStatus = (row: any) =>
  Number(row?.raw?.nParentId ?? row?.nParentId) === 0;



// TABLE DATA MAPPING

const mapStatusRow = (
  item: any,
  index: number
): SimpleMasterRow => ({
  id:
    item?.nStatusId ??
    index + 1,

  key:
    item?.nStatusId ??
    index + 1,

  srl:
    index + 1,

  name:
    item?.cStatusName ??
    "N/A",

  shortName:
    "",

  active:
    item?.bActive !== false &&
    item?.bCancelled !== true,

  // DEFAULT STATUS

  isDefault:
    Number(item?.nParentId) === 0,

  nParentId:
    item?.nParentId,

  raw: item,
});




// SAVE / UPDATE PAYLOAD

const buildStatusPayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => {
  const userCreds = getUserCreds();
  const basePayload = {
    cStatusName:
      values.name,

    bActive:
      values.active ?? true,

    nCompanyId:
      userCreds?.nCompanyId,

    cSchemaName:
      userCreds?.cSchemaName,

    cDbName:
      userCreds?.dbName,
  };

  if (selectedRow) {
    return {
      ...basePayload,

      nStatusId:
        selectedRow.id,

      nModifiedBy:
        userCreds?.id || 0,
    };
  }

  return {
    ...basePayload,

    nCreatedBy:
      userCreds?.id || 0,
  };
};
const Status = () => {

  // SAVE

  const {
    mutate: saveStatus,

    isPending: isSaving,
  } = useSaveStatus();




  // UPDATE

  const {
    mutate: updateStatus,

    isPending: isUpdating,
  } = useUpdateStatus();




  // DELETE

  const {
    mutate: deleteStatus,
  } = useDeleteStatus();





  // MASTER LIST CONFIG

  const listProps = useMemo(
    () => ({
      title:
        "Status Master",

      entityName:
        "Status",

      nameColumnTitle:
        "Status Name",

      drawerDescription:
        "This section allows you to manage Statuses, which includes adding, editing, and viewing.",

      idKey:
        "nStatusId",

      useListQuery:
        useGetStatuses,

      saveMutation:
        saveStatus,

      updateMutation:
        updateStatus,

      deleteMutation:
        deleteStatus,

      isSaving:
        isSaving || isUpdating,

      mapRow:
        mapStatusRow,

      buildPayload:
        buildStatusPayload,



      // CONFIG

      hasShortName:
        false,



      // RESTRICT DEFAULT STATUS

      disableEdit:
        isDefaultStatus,

      disableDelete:
        isDefaultStatus,

      disableToggle:
        isDefaultStatus,



      restrictedMessage:
        "Default Status cannot be modified !",
    }),

    [
      deleteStatus,
      isSaving,
      isUpdating,
      saveStatus,
      updateStatus,
    ]
  );




  return (
    <SimpleMasterList
      {...listProps}
    />
  );
};

export default Status;
