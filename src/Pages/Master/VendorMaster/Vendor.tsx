import { useMemo } from "react";

import SimpleMasterList from "../Common/SimpleMasterList";

import type {
  SimpleMasterRow,
} from "../Common/SimpleMasterUtils";

import {
  useDeleteVendor,
  useGetVendors,
  useSaveVendor,
  useUpdateVendor,
} from "./Hooks";



// ============================
// TABLE DATA
// ============================

const mapVendorRow = (
  item: any,
  index: number
): SimpleMasterRow => ({
  id:
    item?.nVendorId ??
    index + 1,

  key:
    item?.nVendorId ??
    index + 1,

  srl:
    index + 1,

  name:
    item?.cVendorName ??
    "N/A",

  shortName:
    item?.cShName ??
    "",

  active:
    item?.bActive !== false &&
    item?.bCancelled !== true,

  raw: item,
});





// ============================
// SAVE / UPDATE
// ============================

const buildVendorPayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => ({
  nVendorId:
    selectedRow?.id,

  cVendorName:
    values.name,

  cShName:
    values.shortName,

  bActive:
    values.active ?? true,
});







const Vendor = () => {

  const {
    mutate: saveVendor,

    isPending: isSaving,
  } = useSaveVendor();




  const {
    mutate: updateVendor,

    isPending: isUpdating,
  } = useUpdateVendor();




  const {
    mutate: deleteVendor,
  } = useDeleteVendor();







  const listProps = useMemo(
    () => ({
      title:
        "Vendor Master",

      entityName:
        "Vendor",

      nameColumnTitle:
        "Vendor Name",

      drawerDescription:
        "This section allows you to manage vendor details including add, edit, delete and view.",

      idKey:
        "nVendorId",

      useListQuery:
        useGetVendors,

      saveMutation:
        saveVendor,

      updateMutation:
        updateVendor,

      deleteMutation:
        deleteVendor,

      isSaving:
        isSaving || isUpdating,

      mapRow:
        mapVendorRow,

      buildPayload:
        buildVendorPayload,

      hasShortName:
        true,
    }),

    [
      deleteVendor,
      isSaving,
      isUpdating,
      saveVendor,
      updateVendor,
    ]
  );






  return (
    <SimpleMasterList
      {...listProps}
    />
  );
};

export default Vendor;