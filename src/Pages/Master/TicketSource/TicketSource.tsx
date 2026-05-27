import { useMemo } from "react";

import SimpleMasterList from "../Common/SimpleMasterList";

import type {
  SimpleMasterRow,
} from "../Common/SimpleMasterUtils";

import {
  useDeleteTicketSource,
  useGetTicketSources,
  useSaveTicketSource,
  useUpdateTicketSource,
} from "./Hooks";

const mapTicketSourceRow = (
  item: any,
  index: number
): SimpleMasterRow => ({
  id:
    item?.nTicketSourceId ??
    index + 1,

  key:
    item?.nTicketSourceId ??
    index + 1,

  srl:
    index + 1,

  name:
    item?.cTicketSourceName ??
    "N/A",

  shortName:
    item?.cShName ??
    "",

  active:
    item?.bActive !== false &&
    item?.bCancelled !== true,

  raw: item,
});

const buildTicketSourcePayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => ({
  nTicketSourceId:
    selectedRow?.id,

  cTicketSourceName:
    values.name,

  cShName:
    values.shortName,

  bActive:
    values.active ?? true,
});

const TicketSource = () => {

  const {
    mutate: saveTicketSource,

    isPending: isSaving,
  } = useSaveTicketSource();

  const {
    mutate: updateTicketSource,

    isPending: isUpdating,
  } = useUpdateTicketSource();

  const {
    mutate: deleteTicketSource,
  } = useDeleteTicketSource();

  const listProps = useMemo(
    () => ({
      title:
        "Ticket Source Master",

      entityName:
        "Ticket Source",

      nameColumnTitle:
        "Ticket Source Name",

      drawerDescription:
        "This section allows you to manage ticket source details including add, edit, delete and view.",

      idKey:
        "nTicketSourceId",

      useListQuery:
        useGetTicketSources,

      saveMutation:
        saveTicketSource,

      updateMutation:
        updateTicketSource,

      deleteMutation:
        deleteTicketSource,

      isSaving:
        isSaving || isUpdating,

      mapRow:
        mapTicketSourceRow,

      buildPayload:
        buildTicketSourcePayload,

      hasShortName:
        true,
    }),

    [
      deleteTicketSource,
      isSaving,
      isUpdating,
      saveTicketSource,
      updateTicketSource,
    ]
  );

  return (
    <SimpleMasterList
      {...listProps}
    />
  );
};

export default TicketSource;