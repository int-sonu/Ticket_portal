import { useMemo } from "react";

import SimpleMasterList from "../Common/SimpleMasterList";

import type {
  SimpleMasterRow,
} from "../Common/SimpleMasterUtils";

import {
  getApiImageBaseUrl,
} from "../../../Axios/config";

import PartsDrawer from "./PartsDrawer";

import {
  useDeleteParts,
  useGetParts,
  useSaveParts,
  useUpdateParts,
} from "./Hooks";

const PART_TAX_CACHE_KEY =
  "partsTaxSettingsCache";
const PART_IMAGE_CACHE_KEY =
  "partsImageCache";

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

const getPartTaxList = (item: any) =>
  item?.taxes ??
  item?.partTaxes ??
  item?.taxSettings ??
  item?.PartTaxSettings ??
  item?.lPartTaxSettings ??
  [];

const readPartTaxCache = () => {
  try {
    return JSON.parse(
      localStorage.getItem(PART_TAX_CACHE_KEY) ?? "{}"
    );
  } catch {
    return {};
  }
};

const readPartImageCache = () => {
  try {
    return JSON.parse(
      localStorage.getItem(PART_IMAGE_CACHE_KEY) ?? "{}"
    );
  } catch {
    return {};
  }
};

const getPartTaxCacheKeys = (
  part: any
) => {
  const id =
    part?.id ??
    part?.nPartId ??
    part?.raw?.nPartId;
  const name =
    part?.name ??
    part?.cPartName ??
    part?.raw?.cPartName;

  return [
    id !== undefined && id !== null
      ? `id:${id}`
      : "",
    name
      ? `name:${String(name).trim().toLowerCase()}`
      : "",
  ].filter(Boolean);
};

const getCachedPartTaxes = (
  part: any
) => {
  const cache = readPartTaxCache();

  for (const key of getPartTaxCacheKeys(part)) {
    if (Array.isArray(cache[key])) {
      return cache[key];
    }
  }

  return [];
};

const getCachedPartImage = (
  part: any
) => {
  const cache = readPartImageCache();

  for (const key of getPartTaxCacheKeys(part)) {
    if (cache[key]) {
      return cache[key];
    }
  }

  return "";
};

const writePartTaxCache = (
  part: any,
  taxes: any[]
) => {
  const keys = getPartTaxCacheKeys(part);

  if (!keys.length) return;

  const cache = readPartTaxCache();

  keys.forEach((key) => {
    cache[key] = taxes;
  });

  try {
    localStorage.setItem(
      PART_TAX_CACHE_KEY,
      JSON.stringify(cache)
    );
  } catch (error) {
    console.warn("Failed to write part tax cache:", error);
    try {
      localStorage.removeItem(PART_TAX_CACHE_KEY);
    } catch {
      // Ignore
    }
  }
};

const writePartImageCache = (
  part: any,
  image: string
) => {
  if (!image) return;

  const keys = getPartTaxCacheKeys(part);

  if (!keys.length) return;

  const cache = readPartImageCache();

  keys.forEach((key) => {
    cache[key] = image;
  });

  try {
    localStorage.setItem(
      PART_IMAGE_CACHE_KEY,
      JSON.stringify(cache)
    );
  } catch (error) {
    console.warn("Failed to write part image cache (quota exceeded):", error);
    try {
      localStorage.removeItem(PART_IMAGE_CACHE_KEY);
      localStorage.setItem(
        PART_IMAGE_CACHE_KEY,
        JSON.stringify({ [keys[0]]: image })
      );
    } catch {
      // Ignore
    }
  }
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

  partImage:
    (() => {
      const apiImage =
        normalizePartImage(
          getFirstPartImage(row?.raw)
        );

      return apiImage ||
        normalizePartImage(
          getCachedPartImage(row)
        );
    })(),

  taxes:
    (() => {
      const apiTaxes =
        normalizePartTaxes(
          getPartTaxList(row?.raw)
        );

      return apiTaxes.length
        ? apiTaxes
        : normalizePartTaxes(
            getCachedPartTaxes(row)
          );
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
  writePartTaxCache(
    {
      ...selectedRow,
      name: values.name,
      nPartId: selectedRow?.id,
    },
    taxPayload
  );
  writePartImageCache(
    {
      ...selectedRow,
      name: values.name,
      nPartId: selectedRow?.id,
    },
    values.partImage
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
