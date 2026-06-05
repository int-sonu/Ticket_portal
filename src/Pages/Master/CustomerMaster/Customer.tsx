import { useMemo } from "react";
import dayjs from "dayjs";

import SimpleMasterList from "../Common/SimpleMasterList";

import type {
  SimpleMasterRow,
} from "../Common/SimpleMasterUtils";
import {
  getSessionPayload,
} from "../Common/SimpleMasterUtils";
import { customerApis } from "../../../Axios/MasterApis";

import CustomerDrawer from "./CustomerDrawer";

import {
  useDeleteCustomer,
  useGetCustomers,
  useSaveCustomer,
  useUpdateCustomer,
} from "./Hooks";



// TABLE DATA

const mapCustomerRow = (
  item: any,
  index: number
): SimpleMasterRow => ({
  id:
    item?.nCustomerId ??
    item?.nCustomerID ??
    item?.CustomerId ??
    item?.customerId ??
    item?.nCustId ??
    item?.nCustID ??
    index + 1,

  key:
    item?.nCustomerId ??
    item?.nCustomerID ??
    item?.CustomerId ??
    item?.customerId ??
    item?.nCustId ??
    item?.nCustID ??
    index + 1,

  srl:
    index + 1,

  name:
    item?.cCustomerName ??
    "N/A",

  shortName:
    item?.cCustomerShName ??
    "",

  customerCode:
    item?.cCustomerShName ??
    "",

  mobile:
    item?.cPhoneNo ??
    item?.cMobile ??
    "",

  active:
    item?.bActive !== false &&
    item?.bCancelled !== true,

  raw: item,
});

const parseAssetArray = (candidate: any): any[] | null => {
  if (Array.isArray(candidate)) return candidate;

  if (typeof candidate === "string" && candidate.trim()) {
    try {
      const parsed = JSON.parse(candidate);
      return Array.isArray(parsed) ? parsed : findFirstArrayDeep(parsed);
    } catch {
      return null;
    }
  }

  return null;
};

const getFirstArrayByKeys = (raw: any, keys: string[]) => {
  const containers = [
    raw,
    raw?.data,
    raw?.data?.data,
    raw?.data?.message,
    raw?.message,
    raw?.result,
  ];

  for (const container of containers) {
    for (const key of keys) {
      const parsed = parseAssetArray(container?.[key]);
      if (parsed?.length) return parsed;
    }
  }

  return [];
};

const customerAssetKeys = [
  "customerAssetList",
  "CustomerAssetList",
  "customerAssets",
  "CustomerAssets",
  "customerAssetDetails",
  "CustomerAssetDetails",
  "lstCustomerAsset",
  "lstCustomerAssets",
  "customerAsset",
  "CustomerAsset",
];

const isAssetLike = (item: any) =>
  item &&
  typeof item === "object" &&
  [
    "name",
    "assetName",
    "AssetName",
    "Name",
    "cName",
    "cAsset",
    "Asset",
    "cAssetName",
    "cAssetMasterName",
    "nAssetId",
    "nAssetMasterId",
    "cAssetShName",
    "cSerialNo",
  ].some((key) => item?.[key] !== undefined && item?.[key] !== null);

const findAssetArrayDeep = (
  value: any,
  visited = new Set<any>()
): any[] => {
  if (!value || typeof value !== "object" || visited.has(value)) return [];

  visited.add(value);

  if (Array.isArray(value)) {
    return value.some(isAssetLike) ? value : [];
  }

  const preferredKeys = [
    "assets",
    "Assets",
    "assetList",
    "AssetList",
    "customerAssetList",
    "CustomerAssetList",
    "customerAssets",
    "CustomerAssets",
    "assetDetails",
    "AssetDetails",
    "customerAssetDetails",
    "CustomerAssetDetails",
    "lstAsset",
    "lstAssets",
    "lstCustomerAsset",
    "lstCustomerAssets",
    "customerAsset",
    "CustomerAsset",
  ];

  for (const key of preferredKeys) {
    const parsed = parseAssetArray(value?.[key]);
    if (parsed?.some(isAssetLike)) return parsed;
  }

  for (const nested of Object.values(value)) {
    const assets = findAssetArrayDeep(nested, visited);
    if (assets.length) return assets;
  }

  return [];
};

const findFirstArrayDeep = (
  value: any,
  visited = new Set<any>()
): any[] => {
  if (!value || typeof value !== "object" || visited.has(value)) return [];

  visited.add(value);

  if (Array.isArray(value)) return value;

  for (const nested of Object.values(value)) {
    const items = findFirstArrayDeep(nested, visited);
    if (items.length) return items;
  }

  return [];
};

const getCustomerAssets = (raw: any) => {
  const assetCandidates = [
    raw?.assets,
    raw?.Assets,
    raw?.assetList,
    raw?.AssetList,
    raw?.customerAssetList,
    raw?.CustomerAssetList,
    raw?.customerAssets,
    raw?.CustomerAssets,
    raw?.assetDetails,
    raw?.AssetDetails,
    raw?.customerAssetDetails,
    raw?.CustomerAssetDetails,
    raw?.lstAsset,
    raw?.lstAssets,
    raw?.lstCustomerAsset,
    raw?.lstCustomerAssets,
    raw?.data?.assets,
    raw?.data?.AssetList,
    raw?.data?.assetList,
    raw?.data?.message?.assets,
    raw?.data?.message?.AssetList,
    raw?.data?.message?.assetList,
    raw?.message?.assets,
    raw?.message?.AssetList,
    raw?.message?.assetList,
    raw?.result?.assets,
    raw?.result?.AssetList,
    raw?.result?.assetList,
  ];

  const assets =
    assetCandidates.map(parseAssetArray).find((items) => items?.length) ??
    findAssetArrayDeep(raw);

  return assets.map((asset: any) => ({
    ...asset,
    name:
      asset?.name ??
      asset?.assetName ??
      asset?.AssetName ??
      asset?.Name ??
      asset?.cName ??
      asset?.cAsset ??
      asset?.Asset ??
      asset?.cAssetName ??
      asset?.cAssetMasterName ??
      "",
    shortName:
      asset?.shortName ??
      asset?.shName ??
      asset?.short_name ??
      asset?.ShortName ??
      asset?.cShortName ??
      asset?.cShName ??
      asset?.cAssetShName ??
      asset?.cAssetMasterShName ??
      asset?.AssetShortName ??
      "",
    department:
      asset?.department ??
      asset?.departmentName ??
      asset?.Department ??
      asset?.cDepartmentName ??
      asset?.cDepartment ??
      asset?.DepartmentName ??
      "",
    departmentLabel:
      asset?.departmentLabel ??
      asset?.cDepartmentName ??
      asset?.department ??
      asset?.departmentName ??
      "",
    brand:
      asset?.brand ??
      asset?.brandName ??
      asset?.Brand ??
      asset?.cBrandName ??
      asset?.cBrand ??
      asset?.BrandName ??
      "",
    brandLabel:
      asset?.brandLabel ??
      asset?.cBrandName ??
      asset?.brand ??
      asset?.brandName ??
      "",
    serialNo:
      asset?.serialNo ??
      asset?.serialNumber ??
      asset?.srlNo ??
      asset?.SrlNo ??
      asset?.SrlNo ??
      asset?.SrNo ??
      asset?.SerialNumber ??
      asset?.cSerialNo ??
      asset?.cSerialNumber ??
      asset?.SerialNo ??
      "",
    description:
      asset?.description ??
      asset?.cAssetDescription ??
      asset?.cDescription ??
      asset?.Description ??
      "",
    amc:
      asset?.amc ??
      asset?.bAMC ??
      asset?.bUnderAmc ??
      false,
    warranty:
      asset?.warranty ??
      asset?.bWarranty ??
      asset?.bUnderWarranty ??
      false,
    expiryDate:
      asset?.expiryDate
        ? dayjs(asset.expiryDate)
        : asset?.dExpiryDate
          ? dayjs(asset.dExpiryDate)
          : undefined,
  }));
};

const getCustomerWiseAssets = (raw: any) => {
  const assets = getCustomerAssets(raw);

  if (assets.length) return assets;

  return getCustomerAssets({
    AssetList: findFirstArrayDeep(raw),
  });
};

const getCustomerViewRecord = (response: any) => {
  const candidates = [
    response?.data?.data,
    response?.data?.message,
    response?.data,
    response?.message,
    response?.result,
    response?.customer,
    response?.Customer,
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

const isSameId = (left: any, right: any) =>
  String(left ?? "").trim() === String(right ?? "").trim();

const getAssetCustomerId = (asset: any) =>
  asset?.nCustomerId ??
  asset?.CustomerId ??
  asset?.customerId ??
  asset?.nCustId ??
  asset?.nClientId ??
  asset?.CustomerID ??
  asset?.nCustID;

const getAssetId = (asset: any) =>
  asset?.id ??
  asset?.assetId ??
  asset?.AssetId ??
  asset?.AssetID ??
  asset?.nAssetId ??
  asset?.nAssetID ??
  asset?.nAssetMasterId ??
  asset?.nAssetMasterID;

const getAssetMasterId = (asset: any) =>
  asset?.nAssetMasterId ??
  asset?.nAssetMasterID ??
  asset?.AssetMasterId ??
  asset?.AssetMasterID ??
  asset?.assetMasterId ??
  asset?.nMasterAssetId ??
  0;

const getCustomerAssetId = (asset: any) =>
  asset?.nCustomerAssetId ??
  asset?.CustomerAssetId ??
  asset?.CustomerAssetID ??
  asset?.customerAssetId ??
  asset?.nAssetCustMasterId ??
  asset?.nAssetCustomerId ??
  asset?.nAssetId ??
  0;

const getAssetPayloadKey = (asset: any) => {
  const id = getCustomerAssetId(asset) || getAssetMasterId(asset) || getAssetId(asset);

  if (id) return `id:${id}`;

  return [
    asset?.name,
    asset?.cAssetName,
    asset?.shortName,
    asset?.cAssetShName,
    asset?.serialNo,
    asset?.cSerialNo,
  ]
    .map((value) => String(value ?? "").trim().toLowerCase())
    .filter(Boolean)
    .join("|");
};

const uniqueAssetsForPayload = (assets: any[] = []) => {
  const seen = new Set<string>();

  return assets.filter((asset) => {
    const key = getAssetPayloadKey(asset);

    if (!key) return true;
    if (seen.has(key)) return false;

    seen.add(key);

    return true;
  });
};

const hasAssetDisplayName = (asset: any) =>
  [
    asset?.name,
    asset?.assetName,
    asset?.AssetName,
    asset?.cAssetName,
    asset?.cAssetMasterName,
  ].some((value) => value !== undefined && value !== null && String(value).trim());

const assetHasCustomerId = (asset: any) =>
  getAssetCustomerId(asset) !== undefined &&
  getAssetCustomerId(asset) !== null;

const filterAssetsForCustomer = (assets: any[] = [], row: SimpleMasterRow) => {
  const assetsWithCustomerId = assets.filter(assetHasCustomerId);

  return assetsWithCustomerId.filter((asset) =>
    isSameId(getAssetCustomerId(asset), row.id)
  );
};

const filterAssetsByCustomerAssetLinks = (
  assets: any[] = [],
  links: any[] = []
) => {
  const linkedAssetIds = new Set(
    links
      .map(getAssetId)
      .filter((id) => id !== undefined && id !== null)
      .map((id) => String(id).trim())
  );

  if (!linkedAssetIds.size) return [];

  return assets.filter((asset) =>
    linkedAssetIds.has(String(getAssetId(asset) ?? "").trim())
  );
};

const getCustomerAssetPayload = (row: SimpleMasterRow) => ({
  ...getSessionPayload(),
  nCustomerId: row.id,
  CustomerId: row.id,
  customerId: row.id,
  nCustId: row.id,
  cCustomerName: row.name,
  pageNumber: 1,
  pageSize: 1000,
});

const getAssetsForCustomerRecord = (
  assetSource: any,
  row: SimpleMasterRow
) => {
  const customerAssets = getCustomerAssets({
    AssetList: getFirstArrayByKeys(assetSource, customerAssetKeys),
  });
  const matchingCustomerAssets = filterAssetsForCustomer(customerAssets, row);

  if (matchingCustomerAssets.some(hasAssetDisplayName)) {
    return matchingCustomerAssets;
  }
  if (
    customerAssets.length &&
    customerAssets.some(hasAssetDisplayName) &&
    !customerAssets.some(assetHasCustomerId)
  ) {
    return customerAssets;
  }

  const assets = getCustomerAssets(assetSource);
  const matchingAssets = filterAssetsForCustomer(assets, row);

  if (matchingAssets.length) return matchingAssets;
  if (
    assets.length &&
    assets.some(hasAssetDisplayName) &&
    !assets.some(assetHasCustomerId)
  ) {
    return assets;
  }

  return filterAssetsByCustomerAssetLinks(assets, customerAssets);
};

const buildCustomerFormValues = (row?: SimpleMasterRow | null) => ({
  name:
    row?.name ?? "",

  shortName:
    row?.shortName ?? "",

  customerCode:
    row?.shortName ?? "",

  contactPerson:
    row?.raw?.cContactPerson ?? "",

  mobile:
    row?.mobile ??
    row?.raw?.cPhoneNo ??
    row?.raw?.cMobile ??
    "",

  email:
    row?.raw?.cEmail ?? "",

  gstNo:
    row?.raw?.cGstnNummber ??
    row?.raw?.cGSTNo ??
    "",

  address:
    row?.raw?.cAddress ?? "",

  amc:
    row?.raw?.bUnderAmc ??
    row?.raw?.bAMC ??
    false,

  warranty:
    row?.raw?.bUnderWarranty ??
    row?.raw?.bWarranty ??
    false,

  expiryDate:
    row?.raw?.dExpiryDate
      ? dayjs(row.raw.dExpiryDate)
      : null,

  assets:
    row ? getAssetsForCustomerRecord(row.raw, row) : [],

  cLocation:
    row?.raw?.cLocation ??
    row?.raw?.cAddressLocation ??
    "",

  cLattitude:
    row?.raw?.cLattitude ??
    row?.raw?.cLatitude ??
    row?.raw?.nLatitude ??
    "",

  cLongitude:
    row?.raw?.cLongitude ??
    row?.raw?.nLongitude ??
    "",

  active:
    row?.active ?? true,
});

const requiredText = (
  value: any,
  fallback = "NIL"
) => {
  const text = String(value ?? "").trim();

  return text || fallback;
};

const optionalText = (value: any) => {
  const text = String(value ?? "").trim();

  return text || null;
};

const toApiDate = (value: any) => {
  if (!value) return null;
  if (value?.format) return value.format("YYYY-MM-DD");

  const text = String(value).trim();
  const ddmmyyyy = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  }

  return text;
};

const buildCustomerAssetsPayload = (assets: any[] = [], customerId?: any) =>
  uniqueAssetsForPayload(assets).map((asset) => {
    const session = getSessionPayload();
    const customerAssetId = getCustomerAssetId(asset);
    const assetMasterId =
      getAssetMasterId(asset) ||
      asset?.AssetId ||
      asset?.assetId ||
      asset?.nAssetId ||
      0;
    const assetName =
      asset?.name ??
      asset?.cAssetName ??
      asset?.cAssetMasterName ??
      "";
    const shortName =
      asset?.shortName ??
      asset?.cAssetShName ??
      asset?.cAssetMasterShName ??
      "";
    const description =
      asset?.description ??
      asset?.cAssetDescription ??
      "";
    const amc = asset?.amc ?? asset?.bAMC ?? asset?.bUnderAmc ?? false;
    const warranty =
      asset?.warranty ?? asset?.bWarranty ?? asset?.bUnderWarranty ?? false;

    return {
      ...asset,
      ...session,
      nAssetMasterId: assetMasterId,
      AssetMasterId: assetMasterId,
      assetMasterId,
      AssetId: assetMasterId,
      assetId: assetMasterId,
      nAssetId: customerAssetId,
      nCustomerAssetId: customerAssetId,
      CustomerAssetId: customerAssetId,
      customerAssetId: customerAssetId,
      nDepartmentId:
        asset?.nDepartmentId ??
        asset?.DepartmentId ??
        asset?.departmentId ??
        0,
      DepartmentId:
        asset?.DepartmentId ??
        asset?.nDepartmentId ??
        asset?.departmentId ??
        0,
      departmentId:
        asset?.departmentId ??
        asset?.nDepartmentId ??
        asset?.DepartmentId ??
        0,
      nCustomerId: asset?.nCustomerId || customerId,
      CustomerId: asset?.CustomerId || customerId,
      customerId: asset?.customerId || customerId,
      nCustId: asset?.nCustId || customerId,
      cAssetName: assetName,
      cAssetMasterName: assetName,
      cAssetShName: shortName,
      cAssetMasterShName: shortName,
      cShortName: shortName,
      nBrandId:
        asset?.nBrandId ??
        asset?.BrandId ??
        asset?.brandId ??
        0,
      BrandId:
        asset?.BrandId ??
        asset?.nBrandId ??
        asset?.brandId ??
        0,
      brandId:
        asset?.brandId ??
        asset?.nBrandId ??
        asset?.BrandId ??
        0,
      cDepartmentName:
        asset?.departmentLabel ??
        asset?.department ??
        asset?.cDepartmentName ??
        "",
      cBrandName:
        asset?.brandLabel ??
        asset?.brand ??
        asset?.cBrandName ??
        "",
      cSerialNo: optionalText(asset?.serialNo ?? asset?.cSerialNo),
      cAssetDescription: description,
      cDescription: description,
      bAMC: amc,
      bUnderAmc: amc,
      bWarranty: warranty,
      bUnderWarranty: warranty,
      dExpiryDate:
        asset?.expiryDate
          ? toApiDate(asset.expiryDate)
          : toApiDate(asset?.dExpiryDate),
      bActive: asset?.bActive ?? true,
      bCancelled: asset?.bCancelled ?? false,
    };
  });

const hasAssetDraftName = (asset: any) =>
  Boolean(String(asset?.name ?? asset?.cAssetName ?? "").trim());

const getAssetsWithDraft = (assets: any[] = [], draft: any) => {
  const currentAssets = Array.isArray(assets) ? assets : [];

  if (!hasAssetDraftName(draft)) return currentAssets;

  const editingIndex = Number(draft.editingIndex);
  const draftAsset = {
    ...draft,
    name: String(draft.name ?? draft.cAssetName ?? "").trim(),
    shortName: String(draft.shortName ?? draft.cAssetShName ?? "").trim(),
    department: String(draft.department ?? draft.cDepartmentName ?? "").trim(),
    departmentLabel: String(
      draft.departmentLabel ?? draft.department ?? draft.cDepartmentName ?? "",
    ).trim(),
    brand: String(draft.brand ?? draft.cBrandName ?? "").trim(),
    brandLabel: String(draft.brandLabel ?? draft.brand ?? draft.cBrandName ?? "").trim(),
    serialNo: String(draft.serialNo ?? draft.cSerialNo ?? "").trim(),
    description: String(
      draft.description ?? draft.cAssetDescription ?? "",
    ).trim(),
  };

  delete draftAsset.editingIndex;

  if (Number.isInteger(editingIndex) && editingIndex >= 0) {
    return currentAssets.map((asset, index) =>
      index === editingIndex ? { ...asset, ...draftAsset } : asset,
    );
  }

  return [...currentAssets, draftAsset];
};

const getPayloadAssets = (values: any) =>
  [
    values?.assets,
    values?.assetList,
    values?.AssetList,
    values?.customerAssetList,
    values?.CustomerAssetList,
    values?.lstAsset,
    values?.lstAssets,
    values?.lstCustomerAsset,
    values?.lstCustomerAssets,
  ].find(Array.isArray) ?? [];



// SAVE / UPDATE PAYLOAD

const buildCustomerPayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => {
  const assets = getAssetsWithDraft(getPayloadAssets(values), values.assetDraft);
  const assetPayload = buildCustomerAssetsPayload(
    assets,
    selectedRow?.id ?? 0
  );

  return {
    nCustomerId:
      selectedRow?.id ?? 0,
    CustomerId:
      selectedRow?.id ?? 0,
    customerId:
      selectedRow?.id ?? 0,
    nCustId:
      selectedRow?.id ?? 0,

    cCustomerName:
      values.name,

    cCustomerShName:
      values.shortName,

    cCustomerCode:
      values.shortName,

    cContactPerson:
      values.contactPerson,

    cMobile:
      requiredText(values.mobile),

    cPhoneNo:
      requiredText(values.mobile),

    CPhoneNo:
      requiredText(values.mobile),

    cEmail:
      values.email,

    cGSTNo:
      requiredText(values.gstNo),

    cGstnNummber:
      requiredText(values.gstNo),

    cAddress:
      requiredText(values.address),

    cLocation:
      requiredText(
        values.cLocation ??
          values.address
      ),

    cLattitude:
      requiredText(
        values.cLattitude,
        "0"
      ),

    cLatitude:
      requiredText(
        values.cLattitude,
        "0"
      ),

    cLongitude:
      requiredText(
        values.cLongitude,
        "0"
      ),

    bAMC:
      values.amc ?? false,

    bUnderAmc:
      values.amc ?? false,

    bWarranty:
      values.warranty ?? false,

    bUnderWarranty:
      values.warranty ?? false,

    dExpiryDate:
      values.expiryDate
        ? toApiDate(values.expiryDate)
        : null,

    AssetList:
      assetPayload,

    bActive:
      values.active ?? true,
  };
};

const buildCustomerDeletePayload = (
  record: SimpleMasterRow
) =>
  buildCustomerPayload(
    {
      ...buildCustomerFormValues(record),
      active: false,
    },
    record
  );





const Customer = () => {

  const {
    mutate: saveCustomer,

    isPending: isSaving,
  } = useSaveCustomer();




  const {
    mutate: updateCustomer,

    isPending: isUpdating,
  } = useUpdateCustomer();




  const {
    mutate: deleteCustomer,
  } = useDeleteCustomer();





  const listProps = useMemo(
    () => ({
      title:
        "Customer Master",

      entityName:
        "Customer",

      nameColumnTitle:
        "Customer Name",

      drawerDescription:
        "This section allows you to manage customer details including add, edit, delete and view.",

      idKey:
        "nCustomerId",

      listPageSize:
        10,

      useLocalRows:
        false,

      useListQuery:
        useGetCustomers,

      saveMutation:
        saveCustomer,

      updateMutation:
        updateCustomer,

      deleteMutation:
        deleteCustomer,

      isSaving:
        isSaving || isUpdating,

      mapRow:
        mapCustomerRow,

      buildPayload:
        buildCustomerPayload,

      buildDeletePayload:
        buildCustomerDeletePayload,

      buildFormValues:
        buildCustomerFormValues,

      loadRowDetails:
        async (row: SimpleMasterRow) => {
          const detailPayload = getCustomerAssetPayload(row);
          const [response, assetResponse] = await Promise.all([
            customerApis.customerView(detailPayload),
            customerApis.customerWiseAssetList(detailPayload),
          ]);

          const customerWiseAssets = getCustomerWiseAssets(assetResponse);

          const responseAssets = filterAssetsForCustomer(
            getCustomerAssets(response),
            row
          );

          const detailRecord = getCustomerViewRecord(response);

          if (!detailRecord) {
            const fallbackAssets = customerWiseAssets.length
              ? customerWiseAssets
              : responseAssets;

            return mapCustomerRow(
              {
                ...row.raw,
                AssetList: fallbackAssets,
                assetList: fallbackAssets,
                CustomerAssetList: fallbackAssets,
                customerAssetList: fallbackAssets,
              },
              Math.max((row.srl ?? 1) - 1, 0)
            );
          }

          const detailAssets = getAssetsForCustomerRecord(detailRecord, row);
          const assetList = customerWiseAssets.length
            ? customerWiseAssets
            : detailAssets.length
              ? detailAssets
              : responseAssets.length
                ? responseAssets
                : [];

          return mapCustomerRow(
            {
              ...row.raw,
              ...detailRecord,
              AssetList: assetList,
              assetList,
              CustomerAssetList: assetList,
              customerAssetList: assetList,
            },
            Math.max((row.srl ?? 1) - 1, 0)
          );
        },



      // CUSTOM DRAWER

      renderExtraFields:
        ({ form, selectedRow, viewMode }: any) => (
          <CustomerDrawer form={form} selectedRow={selectedRow} viewMode={viewMode} />
        ), 



      // REMOVE COMMON FIELDS

      showNameField:
        false,

      showDescription:
        false,

      hasShortName:
        true,



      // EXTRA TABLE COLUMN

      extraColumns: [
        {
          title: "Customer Code",

          dataIndex: "customerCode",

          key: "customerCode",
        },

        {
          title: "Mobile",

          dataIndex: "mobile",

          key: "mobile",
        },
      ],
    }),

    [
      deleteCustomer,
      isSaving,
      isUpdating,
      saveCustomer,
      updateCustomer,
    ]
  );




  return (
    <SimpleMasterList
      {...listProps}
    />
  );
};

export default Customer;
