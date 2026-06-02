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

const sortStatusRows = (
  rows: SimpleMasterRow[]
) =>
  [...rows].sort((first, second) => {
    const firstParent =
      Number(first?.raw?.nParentId ?? first?.nParentId);
    const secondParent =
      Number(second?.raw?.nParentId ?? second?.nParentId);
    const firstIsCustom =
      firstParent !== 0;
    const secondIsCustom =
      secondParent !== 0;

    if (firstIsCustom !== secondIsCustom) {
      return firstIsCustom ? -1 : 1;
    }

    if (firstIsCustom && secondIsCustom) {
      return Number(second.id) - Number(first.id);
    }

    return first.srl - second.srl;
  });



// TABLE DATA MAPPING

const mapStatusRow = (
  item: any,
  index: number
): SimpleMasterRow => ({
  id:
    item?.nStatusId ??
    item?.nTicketStatusId ??
    item?.nTicketstatusId ??
    item?.nTicketStatusid ??
    index + 1,

  key:
    item?.nStatusId ??
    item?.nTicketStatusId ??
    item?.nTicketstatusId ??
    item?.nTicketStatusid ??
    index + 1,

  srl:
    index + 1,

  name:
    item?.cStatusName ??
    item?.cTicketStatusName ??
    item?.cTicketstatusName ??
    item?.cTicketStatus ??
    item?.cStatus ??
    "N/A",

  shortName:
    "",

  active:
    item?.bActive !== false,

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
      userCreds?.cDbName ?? userCreds?.dbName,
  };

  if (selectedRow) {
    return {
      ...basePayload,

      nStatusId:
        selectedRow.id,

      nTicketStatusId:
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

      filterRawItem:
        () => true,

      sortRows:
        sortStatusRows,



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
        "Default Status cannot be modified",

      keepRestrictedActionsEnabled:
        true,

      useNeutralMessages:
        true,

      tableClassName:
        "status-master-table",

      tableScroll:
        { y: "calc(100vh - 300px)" },

      disableRowHover:
        true,

      fetchAllRows:
        true,

      listPageSize:
        1000,

      paginateFetchedRows:
        false,
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
