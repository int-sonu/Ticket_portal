import { useMemo } from "react";

import SimpleMasterList from "../Common/SimpleMasterList";

import type {
  SimpleMasterRow,
} from "../Common/SimpleMasterUtils";

import PartsDrawer from "./PartsDrawer";

import {
  useDeleteParts,
  useGetParts,
  useSaveParts,
  useUpdateParts,
} from "./Hooks";



// TABLE DATA MAPPING

const mapPartsRow = (
  item: any,
  index: number
): SimpleMasterRow => ({
  id:
    item?.nPartId ??
    index + 1,

  key:
    item?.nPartId ??
    index + 1,

  srl:
    index + 1,

  name:
    item?.cPartName ??
    "N/A",



  // API FIELD

  shortName:
    item?.nPartShName ??
    item?.cPartShName ??
    "",



  // EXTRA COLUMN

  amount:
    item?.nPartRate ??
    0,



  active:
    item?.bActive !== false &&
    item?.bCancelled !== true,

  raw: item,
});

const buildPartsFormValues = (row?: SimpleMasterRow | null) => ({
  name:
    row?.name ?? "",

  shortName:
    row?.shortName ?? "",

  amount:
    row?.amount ?? row?.raw?.nPartRate ?? 0,

  description:
    row?.raw?.cPartDescription ?? "",

  serviceCharge:
    row?.raw?.bServiceCharge ?? false,

  taxes:
    row?.raw?.taxes ?? [],

  active:
    row?.active ?? true,
});




// SAVE / UPDATE PAYLOAD

const buildPartsPayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => ({
  nPartId:
    selectedRow?.id,

  cPartName:
    values.name,



  // API FIELD

  nPartShName:
    values.shortName,



  // API FIELD

  nPartRate:
    Number(values.amount ?? 0),



  // API FIELD

  cPartDescription:
    values.description,



  bServiceCharge:
    values.serviceCharge ?? false,

  taxes:
    values.taxes ?? [],

  bActive:
    values.active ?? true,
});





const Parts = () => {

  const {
    mutate: saveParts,

    isPending: isSaving,
  } = useSaveParts();




  const {
    mutate: updateParts,

    isPending: isUpdating,
  } = useUpdateParts();




  const {
    mutate: deleteParts,
  } = useDeleteParts();





  const listProps = useMemo(
    () => ({
      title:
        "Part Master",

      entityName:
        "Part",

      nameColumnTitle:
        "Part Name",

        

      drawerDescription:
        "This section allows you to manage Parts, which includes adding, editing, and viewing.",

      idKey:
        "nPartId",

      useListQuery:
        useGetParts,

      saveMutation:
        saveParts,

      updateMutation:
        updateParts,

      deleteMutation:
        deleteParts,

      isSaving:
        isSaving || isUpdating,

      mapRow:
        mapPartsRow,

      buildPayload:
        buildPartsPayload,

      buildFormValues:
        buildPartsFormValues,



      // CUSTOM DRAWER

      renderExtraFields:
        () => <PartsDrawer />, 



      // REMOVE COMMON SHORT NAME

      showNameField:
        false,

      hasShortName:
        false,

      validateShortName:
        true,



      // EXTRA TABLE COLUMN

      extraColumns: [
        {
          title: "Amount",

          dataIndex: "amount",

          key: "amount",
        },
      ],
    }),

    [
      deleteParts,
      isSaving,
      isUpdating,
      saveParts,
      updateParts,
    ]
  );




  return (
    <SimpleMasterList
      {...listProps}
    />
  );
};

export default Parts;
