import { useMemo } from "react";

import SimpleMasterList from "../Common/SimpleMasterList";

import type { SimpleMasterRow } from "../Common/SimpleMasterUtils";

import {
  useDeleteTax,
  useGetTaxes,
  useSaveTax,
  useUpdateTax,
} from "./Hooks";



// TABLE DATA MAPPING

const mapTaxRow = (
  item: any,
  index: number
): SimpleMasterRow => ({
  id:
    item?.nTaxId ??
    index + 1,

  key:
    item?.nTaxId ??
    index + 1,

  srl:
    index + 1,

  name:
    item?.cTaxName ??
    "N/A",

  shortName:
    item?.cShName ??
    "",

  active:
    item?.bActive !== false &&
    item?.bCancelled !== true,

  raw: item,
});




// SAVE / UPDATE PAYLOAD

const buildTaxPayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => ({
  nTaxId:
    selectedRow?.id,

  cTaxName:
    values.name,

  cShName:
    values.shortName,

  bActive:
    values.active ?? true,
});





const Tax = () => {

  // SAVE

  const {
    mutate: saveTax,

    isPending: isSaving,
  } = useSaveTax();




  // UPDATE

  const {
    mutate: updateTax,

    isPending: isUpdating,
  } = useUpdateTax();




  // DELETE

  const {
    mutate: deleteTax,
  } = useDeleteTax();





  // MASTER LIST CONFIG

  const listProps = useMemo(
    () => ({
      title:
        "Tax Master",

      entityName:
        "Tax",

      nameColumnTitle:
        "Tax Name",

      drawerDescription:
        "This section allows you to manage Taxes, which includes adding, editing, and viewing.",

      idKey:
        "nTaxId",

      useListQuery:
        useGetTaxes,

      saveMutation:
        saveTax,

      updateMutation:
        updateTax,

      deleteMutation:
        deleteTax,

      isSaving:
        isSaving || isUpdating,

      mapRow:
        mapTaxRow,

      buildPayload:
        buildTaxPayload,



      // EXTRA CONFIG

      hasShortName:
        true,
    }),

    [
      deleteTax,
      isSaving,
      isUpdating,
      saveTax,
      updateTax,
    ]
  );




  return (
    <SimpleMasterList
      {...listProps}
    />
  );
};

export default Tax;