import { useMemo } from "react";

import SimpleMasterList from "../Common/SimpleMasterList";

import type {
  SimpleMasterRow,
} from "../Common/SimpleMasterUtils";
import { isMasterRecordActive } from "../Common/SimpleMasterUtils";

import {
  useDeleteServiceType,
  useGetServiceTypes,
  useSaveServiceType,
  useUpdateServiceType,
} from "./Hooks";

const mapServiceTypeRow = (
  item: any,
  index: number
): SimpleMasterRow => ({
  id:
    item?.nServiceId ??
    item?.nServiceTypeId ??
    index + 1,

  key:
    item?.nServiceId ??
    item?.nServiceTypeId ??
    index + 1,

  srl:
    index + 1,

  name:
    item?.cServiceName ??
    item?.cServiceTypeName ??
    "N/A",

  shortName:
    item?.cServiceShName ??
    item?.cServiceTypeShName ??
    "",

  active: isMasterRecordActive(item),

  raw: item,
});

const buildServiceTypePayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => ({
  nServiceTypeId:
    selectedRow?.id,

  nServiceId:
    selectedRow?.id,

  cServiceName:
    values.name,

  cServiceShName:
    values.shortName,

  bActive:
    values.active ?? true,
});

const buildServiceTypeDeletePayload = (
  record: SimpleMasterRow
) =>
  buildServiceTypePayload(
    {
      name: record.name,
      shortName: record.shortName,
      active: false,
    },
    record
  );

const ServiceTypeList = () => {
  const {
    mutate: saveServiceType,
    isPending: isSaving,
  } = useSaveServiceType();

  const {
    mutate: updateServiceType,
    isPending: isUpdating,
  } = useUpdateServiceType();

  const {
    mutate: deleteServiceType,
  } = useDeleteServiceType();

  const listProps = useMemo(
    () => ({
      title:
        "Service Type Master",

      entityName:
        "Service Type",

      nameColumnTitle:
        "Service Type Name",

      drawerDescription:
        "This section allows you to manage Service Types, which includes adding, editing, and viewing.",

      idKey:
        "nServiceId",

      useListQuery:
        useGetServiceTypes,

      saveMutation:
        saveServiceType,

      updateMutation:
        updateServiceType,

      deleteMutation:
        deleteServiceType,

      isSaving:
        isSaving || isUpdating,

         addButtonClassName:
        "h-9 !border-emerald-500 !bg-emerald-500 px-5 font-medium hover:!border-emerald-600 hover:!bg-emerald-600 ",

        showAddButtonIcon: false,

      mapRow:
        mapServiceTypeRow,

      buildPayload:
        buildServiceTypePayload,

      buildDeletePayload:
        buildServiceTypeDeletePayload,

      hasShortName:
        true,
    }),
    [
      deleteServiceType,
      isSaving,
      isUpdating,
      saveServiceType,
      updateServiceType,
    ]
  );

  return (
    <SimpleMasterList
      {...listProps}
    />
  );
};

export default ServiceTypeList;
