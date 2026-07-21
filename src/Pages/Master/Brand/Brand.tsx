import { useMemo } from "react";

import SimpleMasterList from "../Common/SimpleMasterList";

import type {
  SimpleMasterRow,
} from "../Common/SimpleMasterUtils";

import {
  useDeleteBrand,
  useGetBrands,
  useSaveBrand,
  useUpdateBrand,
} from "./Hooks";



// ============================
// TABLE DATA
// ============================

const mapBrandRow = (
  item: any,
  index: number
): SimpleMasterRow => ({
  id:
    item?.nBrandid ??
    item?.nBrandId ??
    item?.nBrandID ??
    index + 1,

  key:
    item?.nBrandid ??
    item?.nBrandId ??
    item?.nBrandID ??
    index + 1,

  srl:
    index + 1,

  name:
    item?.cBrandName ??
    item?.brandName ??
    item?.brand ??
    item?.name ??
    "N/A",

  shortName:
    item?.cBrandShName ??
    item?.cBrandShname ??
    item?.cShName ??
    "",

  raw: item,
});





// ============================
// SAVE / UPDATE
// ============================

const buildBrandPayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => ({
  nBrandId:
    selectedRow?.id,

  nBrandid:
    selectedRow?.id,

  nBrandID:
    selectedRow?.id,

  cBrandName:
    values.name,

  cShName:
    values.shortName,

  cBrandShName:
    values.shortName,

  cBrandShname:
    values.shortName,

  bActive:
    values.active ?? true,
});

const buildBrandDeletePayload = (
  record: SimpleMasterRow
) =>
  buildBrandPayload(
    {
      name: record.name,
      shortName: record.shortName,
      active: false,
    },
    record
  );







const Brand = () => {

  const {
    mutate: saveBrand,

    isPending: isSaving,
  } = useSaveBrand();




  const {
    mutate: updateBrand,

    isPending: isUpdating,
  } = useUpdateBrand();




  const {
    mutate: deleteBrand,
  } = useDeleteBrand();







  const listProps = useMemo(
    () => ({
      title:
        "Brand Master",

      entityName:
        "Brand",

      nameColumnTitle:
        "Brand Name",

      drawerDescription:
        "This section allows you to manage brand details including add, edit, delete and view.",

      idKey:
        "nBrandId",

      useListQuery:
        useGetBrands,

      saveMutation:
        saveBrand,

      updateMutation:
        updateBrand,

      deleteMutation:
        deleteBrand,

      isSaving:
        isSaving || isUpdating,

       addButtonClassName:
        "h-9 !border-emerald-500 !bg-emerald-500 px-5 font-medium hover:!border-emerald-600 hover:!bg-emerald-600 ",

        showAddButtonIcon: false,



      mapRow:
        mapBrandRow,

      buildPayload:
        buildBrandPayload,

      buildDeletePayload:
        buildBrandDeletePayload,

      hasShortName:
        true,
    }),

    [
      deleteBrand,
      isSaving,
      isUpdating,
      saveBrand,
      updateBrand,
    ]
  );






  return (
    <SimpleMasterList
      {...listProps}
    />
  );
};

export default Brand;
