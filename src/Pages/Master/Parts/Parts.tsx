import { useMemo } from "react";

import SimpleMasterList from "../Common/SimpleMasterList";

import type {
  SimpleMasterRow,
} from "../Common/SimpleMasterUtils";

import {
  getSessionPayload,
  isMasterRecordActive,
} from "../Common/SimpleMasterUtils";

import {
  getApiImageBaseUrl,
} from "../../../Axios/config";

import {
  partsApis,
} from "../../../Axios/MasterApis";

import PartsDrawer from "./PartsDrawer";

import {
  useDeleteParts,
  useGetParts,
  useSaveParts,
  useUpdateParts,
} from "./Hooks";

const partImageKeys = [
  "cPartImage",
  "cImageUrl",
  "cImage",
  "cPartImageUrl",
  "cPartImagePath",
  "cImagePath",
  "cPartPhoto",
  "cPhoto",
  "cPhotoUrl",
  "cFilePath",
  "cFileName",
  "cPartImg",
  "partImage",
  "imageUrl",
  "imagePath",
];

const getFirstPartImage = (item: any) =>
  {
    if (!item || typeof item !== "object") return "";

    const normalizedKeys = partImageKeys.map((key) =>
      key.toLowerCase()
    );
    const directImage = partImageKeys
      .map((key) => item?.[key])
      .find(
        (value) =>
          value !== undefined &&
          value !== null &&
          String(value).trim()
      );

    if (directImage) return directImage;

    return (
      Object.entries(item).find(
        ([key, value]) =>
          normalizedKeys.includes(key.toLowerCase()) &&
          value !== undefined &&
          value !== null &&
          String(value).trim()
      )?.[1] ?? ""
    );
  };

const normalizePartImage = (value: any) => {
  const rawImage =
    value && typeof value === "object"
      ? value.url ??
        value.path ??
        value.filePath ??
        value.fileName ??
        value.cFilePath ??
        value.cFileName ??
        value.imageUrl ??
        value.imagePath ??
        ""
      : value;
  const image = String(rawImage ?? "").trim();

  if (!image) return "";

  if (
    image.startsWith("data:image") ||
    image.startsWith("http") ||
    image.startsWith("blob:")
  )
    return image;

  if (/^[A-Za-z0-9+/=\s]+$/.test(image) && image.length > 100) {
    return `data:image/png;base64,${image.replace(/\s/g, "")}`;
  }

  try {
    const baseUrl = getApiImageBaseUrl().replace(/\/$/, "");

    return `${baseUrl}/${image.replace(/^\//, "")}`;
  } catch {
    return image;
  }
};

const getPartTaxList = (item: any) => {
  const candidates = [
    item?.taxDetails,
    item?.taxes,
    item?.partTaxes,
    item?.taxSettings,
    item?.PartTaxSettings,
    item?.lPartTaxSettings,
  ];

  for (const candidate of candidates) {
    const extracted = extractFirstArrayDeep(candidate);
    if (extracted.length) {
      return extracted;
    }
  }

  for (const candidate of candidates) {
    const extracted = extractFirstArrayDeep(candidate);
    if (Array.isArray(candidate) || extracted.length) {
      return extracted;
    }
  }

  return [];
};

const extractFirstArrayDeep = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  const candidates = [
    value.data,
    value.result,
    value.message,
    value.taxDetails,
    value.taxes,
    value.partTaxes,
    value.taxSettings,
    value.PartTaxSettings,
    value.lPartTaxSettings,
  ];

  for (const candidate of candidates) {
    const extracted = extractFirstArrayDeep(candidate);
    if (extracted.length) return extracted;
  }

  return [];
};

const getPartViewRecord = (response: any) => {
  const candidates = [
    response?.data?.data,
    response?.data?.message,
    response?.data,
    response?.message,
    response?.result,
    response?.part,
    response?.Part,
    response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate[0];
    if (Array.isArray(candidate?.data)) return candidate.data[0];
    if (Array.isArray(candidate?.result)) return candidate.result[0];
    if (candidate && typeof candidate === "object") return candidate;
  }

  return null;
};

const normalizePartTaxes = (
  taxes: any[]
) =>
  (Array.isArray(taxes) ? taxes : [])
    .map((tax) => ({
      nTaxId:
        tax?.nTaxId ??
        tax?.taxId ??
        tax?.id ??
        tax?.nPartTaxId,

      taxName:
        tax?.taxName ??
        tax?.cTaxName ??
        tax?.name ??
        tax?.cName ??
        "",

      taxRate:
        tax?.taxRate ??
        tax?.nTaxRate ??
        tax?.nRate ??
        tax?.rate ??
        0,

      applyAfterDisc:
        tax?.applyAfterDisc ??
        tax?.bApplyAfterDisc ??
        tax?.bAfterDiscount ??
        false,
    }))
    .filter(
      (tax) =>
        tax.nTaxId !== undefined ||
        String(tax.taxName).trim()
    );

const buildPartTaxPayload = (
  taxes: any[]
) =>
  normalizePartTaxes(taxes).map((tax) => ({
    nTaxId:
      tax.nTaxId,
    cTaxName:
      tax.taxName,
    taxName:
      tax.taxName,
    nTaxRate:
      Number(tax.taxRate ?? 0),
    taxRate:
      Number(tax.taxRate ?? 0),
    bApplyAfterDisc:
      tax.applyAfterDisc ?? false,
    applyAfterDisc:
      tax.applyAfterDisc ?? false,
  }));



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



  active: isMasterRecordActive(item),

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

  partImage:
    (() => {
      const apiImage =
        normalizePartImage(
          getFirstPartImage(row?.raw)
        );

      return apiImage;
    })(),

  taxes:
    (() => {
      const apiTaxes =
        normalizePartTaxes(
          getPartTaxList(row?.raw)
        );

      return apiTaxes;
    })(),

  active:
    row?.active ?? true,
});




const cleanPartImageForPayload = (image: string) => {
  const imageUrl = String(image ?? "").trim();
  if (!imageUrl) return "";

  if (imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")) {
    return imageUrl;
  }

  try {
    const baseUrl = getApiImageBaseUrl().replace(/\/$/, "");
    if (imageUrl.startsWith(baseUrl)) {
      return imageUrl.slice(baseUrl.length).replace(/^\//, "");
    }
  } catch {
    // Ignore error
  }

  return imageUrl;
};

// SAVE / UPDATE PAYLOAD

const buildPartsPayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => {
  const taxPayload =
    buildPartTaxPayload(
      values.taxes ?? []
    );

  const cleanedImage = cleanPartImageForPayload(values.partImage);

  return {
    nPartId:
      selectedRow?.id,

    cPartName:
      values.name,



    // API FIELD

    nPartShName:
      values.shortName,

    cPartShName:
      values.shortName,



    // API FIELD

    nPartRate:
      Number(values.amount ?? 0),



    // API FIELD

    cPartDescription:
      values.description,



    bServiceCharge:
      values.serviceCharge ?? false,

    cPartImage:
      cleanedImage,

    cImageUrl:
      cleanedImage,

    taxDetails:
      taxPayload,

    taxes:
      taxPayload,

    partTaxes:
      taxPayload,

    taxSettings:
      taxPayload,

    bActive:
      values.active ?? true,
  };
};





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

  const loadRowDetails = async (row: SimpleMasterRow) => {
    const detailPayload = {
      ...getSessionPayload(),
      nPartId: row.id,
    };

    const [detailResponse, taxResponse] = await Promise.all([
      partsApis.partsView(detailPayload),
      partsApis.partsViewWithTax(detailPayload).catch(() => null),
    ]);

    const detailRecord = getPartViewRecord(detailResponse);
    const taxDetailRecord = taxResponse
      ? getPartViewRecord(taxResponse)
      : null;
    const fallbackTaxes = getPartTaxList(row.raw);
    const detailTaxes = detailRecord
      ? getPartTaxList(detailRecord)
      : [];
    const taxEndpointTaxes = taxDetailRecord
      ? getPartTaxList(taxDetailRecord)
      : [];
    const resolvedTaxes = taxEndpointTaxes.length
      ? taxEndpointTaxes
      : detailTaxes.length
        ? detailTaxes
        : fallbackTaxes;
    const mergedRecord = detailRecord
      ? {
          ...row.raw,
          ...detailRecord,
          taxDetails: resolvedTaxes,
          taxes: resolvedTaxes,
          partTaxes: resolvedTaxes,
          taxSettings: resolvedTaxes,
          cPartImage:
            getFirstPartImage(detailRecord) ||
            getFirstPartImage(row.raw),
        }
      : row.raw;

    return detailRecord
      ? mapPartsRow(mergedRecord, Math.max((row.srl ?? 1) - 1, 0))
      : row;
  };





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

      loadRowDetails,


       addButtonClassName:
        "h-9 !border-emerald-500 !bg-emerald-500 px-5 font-medium hover:!border-emerald-600 hover:!bg-emerald-600 ",

        showAddButtonIcon: false,


      // CUSTOM DRAWER

      renderExtraFields:
        ({ viewMode }: { viewMode: boolean }) => <PartsDrawer viewMode={viewMode} />, 



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
      loadRowDetails,
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
