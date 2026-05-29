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
    item?.nTicketsourceId ??
    item?.nTicketsourceid ??
    item?.nTicketSourceid ??
    item?.nSourceId ??
    item?.nSourceid ??
    index + 1,

  key:
    item?.nTicketSourceId ??
    item?.nTicketsourceId ??
    item?.nTicketsourceid ??
    item?.nTicketSourceid ??
    item?.nSourceId ??
    item?.nSourceid ??
    index + 1,

  srl:
    index + 1,

  name:
    item?.cTicketSourceName ??
    item?.cTicketsourceName ??
    item?.cSourceName ??
    "N/A",

  shortName:
    item?.cTicketSourceShName ??
    item?.cTicketsourceShName ??
    item?.cTicketSourceShname ??
    item?.cTicketsourceShname ??
    item?.cTicketSourceCode ??
    item?.cSourceShName ??
    item?.cSourceShname ??
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

  nTicketsourceId:
    selectedRow?.id,

  nTicketsourceid:
    selectedRow?.id,

  nTicketSourceid:
    selectedRow?.id,

  nSourceId:
    selectedRow?.id,

  nSourceid:
    selectedRow?.id,

  cTicketSourceName:
    values.name,

  cTicketsourceName:
    values.name,

  cSourceName:
    values.name,

  cShName:
    values.shortName,

  cTicketSourceShName:
    values.shortName,

  cTicketsourceShName:
    values.shortName,

  cTicketSourceShname:
    values.shortName,

  cTicketsourceShname:
    values.shortName,

  cTicketSourceCode:
    values.shortName,

  cSourceShName:
    values.shortName,

  bActive:
    values.active ?? true,
});

const buildTicketSourceDeletePayload = (
  record: SimpleMasterRow
) =>
  buildTicketSourcePayload(
    {
      name: record.name,
      shortName: record.shortName,
      active: false,
    },
    record
  );

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

      buildDeletePayload:
        buildTicketSourceDeletePayload,

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
