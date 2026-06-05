import {
  AutoComplete,
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Tabs,
} from "antd";

import type { FormInstance } from "antd";

import { EditOutlined, DeleteOutlined } from "@ant-design/icons";


import { useMemo, useEffect, useRef, useState } from "react";

import type { MouseEvent } from "react";

import { assetMasterApis } from "../../../Axios/MasterApis";

import {
  extractList,
  getApiMessage,
  getSessionPayload,
  isApiSuccess,
} from "../Common/SimpleMasterUtils";

import {
  useGetAssetMasterSuggest,
  useGetCustomerAssetDepartments,
  useGetCustomerBrandOptions,
  useGetCustomerWiseAssets,
} from "./Hooks";

const { TextArea, Search } = Input;

const defaultLocationQuery = "10.8505,76.2711";

type CustomerDrawerProps = {
  form: FormInstance;
  selectedRow?: any;
  viewMode?: boolean;
};

const getFirstValue = (item: any, keys: string[]) => {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== undefined && value !== null && String(value).trim())
      return String(value).trim();
  }

  return "";
};

const toUniqueOptions = (items: any[], keys: string[]) => {
  const values = new Set<string>();

  items.forEach((item) => {
    const value = getFirstValue(item, keys);

    if (value) values.add(value);
  });

  return Array.from(values).map((value) => ({
    value,
    label: value,
  }));
};

const extractAssetList = (response: any) => {
  const list = extractList(response);

  if (list.length) return list;

  return (
    [
      response?.AssetList,
      response?.assetList,
      response?.data?.AssetList,
      response?.data?.assetList,
      response?.message?.AssetList,
      response?.message?.assetList,
      response?.result?.AssetList,
      response?.result?.assetList,
    ].find(Array.isArray) ?? []
  );
};

const normalizeAssetForDisplay = (asset: any) => ({
  ...asset,
  name: asset?.name ?? asset?.cAssetName ?? "",
  shortName: asset?.shortName ?? asset?.cAssetShName ?? "",
  department:
    asset?.department ??
    asset?.cDepartment ??
    asset?.departmentLabel ??
    asset?.cDepartmentName ??
    asset?.Department ??
    asset?.DepartmentName ??
    asset?.departmentName ??
    "",
  departmentLabel:
    asset?.departmentLabel ??
    asset?.cDepartment ??
    asset?.cDepartmentName ??
    asset?.department ??
    asset?.Department ??
    asset?.DepartmentName ??
    asset?.departmentName ??
    "",
  departmentName:
    asset?.departmentName ??
    asset?.cDepartmentName ??
    asset?.DepartmentName ??
    asset?.departmentLabel ??
    asset?.department ??
    asset?.cDepartment ??
    "",
  brand:
    asset?.brand ??
    asset?.cBrand ??
    asset?.brandLabel ??
    asset?.cBrandName ??
    asset?.Brand ??
    asset?.BrandName ??
    asset?.brandName ??
    "",
  brandLabel:
    asset?.brandLabel ??
    asset?.cBrand ??
    asset?.cBrandName ??
    asset?.brand ??
    asset?.Brand ??
    asset?.BrandName ??
    asset?.brandName ??
    "",
  brandName:
    asset?.brandName ??
    asset?.cBrandName ??
    asset?.BrandName ??
    asset?.brandLabel ??
    asset?.brand ??
    asset?.cBrand ??
    "",
  serialNo: asset?.serialNo ?? asset?.cSerialNo ?? "",
  description: asset?.description ?? asset?.cAssetDescription ?? "",
});

const getAssetCompareKey = (asset: any) => {
  const id = getAssetId(asset);

  if (id !== undefined && id !== null && String(id).trim()) {
    return `id:${String(id).trim()}`;
  }

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

const mergeAssetLists = (primaryAssets: any[] = [], fallbackAssets: any[] = []) => {
  const merged = primaryAssets.map(normalizeAssetForDisplay);
  const indexByKey = new Map<string, number>();

  merged.forEach((asset, index) => {
    const key = getAssetCompareKey(asset);

    if (key) indexByKey.set(key, index);
  });

  fallbackAssets.map(normalizeAssetForDisplay).forEach((asset) => {
    const key = getAssetCompareKey(asset);

    if (key && indexByKey.has(key)) {
      const index = indexByKey.get(key)!;
      merged[index] = {
        ...merged[index],
        ...asset,
      };

      return;
    }

    merged.push(asset);

    if (key) indexByKey.set(key, merged.length - 1);
  });

  return merged;
};

const optionalText = (value: any) => {
  const text = String(value ?? "").trim();

  return text || null;
};

const formatDate = (value: any) =>
  {
    if (!value) return null;
    if (value?.format) return value.format("YYYY-MM-DD");

    const text = String(value).trim();
    const ddmmyyyy = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (ddmmyyyy) {
      return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
    }

    return text;
  };

const getAssetId = (asset: any) =>
  asset?.nAssetMasterId ??
  asset?.AssetMasterId ??
  asset?.assetMasterId ??
  asset?.nMasterAssetId ??
  asset?.nAssetId ??
  asset?.AssetId ??
  asset?.assetId ??
  asset?.id;

const getAssetMasterId = (asset: any) =>
  asset?.nAssetMasterId ??
  asset?.AssetMasterId ??
  asset?.assetMasterId ??
  asset?.nMasterAssetId ??
  asset?.AssetMasterID ??
  0;

const getResponseDataObjects = (response: any): any[] =>
  [
    response,
    response?.data,
    response?.result,
    response?.message,
    ...(Array.isArray(response?.data) ? response.data : []),
    ...(Array.isArray(response?.result) ? response.result : []),
    ...(Array.isArray(response?.message) ? response.message : []),
  ].filter(Boolean);

const getSavedAssetId = (response: any) => {
  for (const item of getResponseDataObjects(response)) {
    const id = getAssetId(item);

    if (id) return id;
  }

  return undefined;
};

const findMatchingItem = (
  items: any[],
  value: any,
  keys: string[],
) => {
  const lookup = String(value ?? "").trim().toLowerCase();

  if (!lookup) return undefined;

  return items.find((item) =>
    keys.some(
      (key) => String(item?.[key] ?? "").trim().toLowerCase() === lookup,
    ),
  );
};

const buildAssetMasterSavePayload = (
  asset: any,
  brandList: any[],
  departmentList: any[],
) => {
  const brand = findMatchingItem(brandList, asset.brand ?? asset.cBrandName, [
    "cBrandName",
    "BrandName",
    "brandName",
    "name",
  ]);
  const department = findMatchingItem(
    departmentList,
    asset.department ?? asset.cDepartmentName,
    ["cDepartmentName", "DepartmentName", "departmentName", "name"],
  );

  return {
    ...getSessionPayload(),
    cAssetName: asset.name ?? asset.cAssetName ?? "",
    cAssetShName: asset.shortName ?? asset.cAssetShName ?? "",
    cShortName: asset.shortName ?? asset.cAssetShName ?? "",
    nDepartmentId:
      asset.nDepartmentId ?? department?.nDepartmentId ?? department?.id,
    cDepartmentName: asset.department ?? asset.cDepartmentName ?? "",
    nBrandId: asset.nBrandId ?? brand?.nBrandId ?? brand?.id,
    cBrandName: asset.brand ?? asset.cBrandName ?? "",
    cBrand: asset.brand ?? asset.cBrandName ?? "",
    cSerialNo: optionalText(asset.serialNo ?? asset.cSerialNo),
    cAssetDescription: asset.description ?? asset.cAssetDescription ?? "",
    cDescription: asset.description ?? asset.cAssetDescription ?? "",
    bAMC: asset.amc ?? asset.bAMC ?? false,
    bUnderAmc: asset.amc ?? asset.bUnderAmc ?? false,
    bWarranty: asset.warranty ?? asset.bWarranty ?? false,
    bUnderWarranty: asset.warranty ?? asset.bUnderWarranty ?? false,
    dExpiryDate: asset.expiryDate
      ? formatDate(asset.expiryDate)
      : formatDate(asset.dExpiryDate),
    bActive: true,
  };
};

const parseCoordinates = (value: string) => {
  const match = value
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);

  return {
    latitude: match?.[1] ?? "",
    longitude: match?.[2] ?? "",
  };
};

const coordinateText = (latitude: string, longitude: string) =>
  latitude && longitude ? `${latitude},${longitude}` : "";

const roundCoordinate = (value: number) => value.toFixed(6);

const CustomerDrawer = ({ form, selectedRow, viewMode = false }: CustomerDrawerProps) => {
  const [assetSearch, setAssetSearch] = useState("");

  const suggestPayload = useMemo(
    () => ({
      ...getSessionPayload(),
      cSearch: assetSearch,
    }),
    [assetSearch],
  );

  const customerWiseAssetPayload = useMemo(
    () => ({
      ...getSessionPayload(),
      nCustomerId: selectedRow?.id,
      CustomerId: selectedRow?.id,
      customerId: selectedRow?.id,
      nCustId: selectedRow?.id,
      pageNumber: 1,
      pageSize: 1000,
    }),
    [selectedRow?.id],
  );

  const { data: assetSuggestData } = useGetAssetMasterSuggest(suggestPayload);

  const { data: departmentData } =
    useGetCustomerAssetDepartments(suggestPayload);

  const brandPayload = useMemo(
    () => ({
      ...getSessionPayload(),
      pageNumber: 1,
      pageSize: 1000,
    }),
    [],
  );

  const { data: brandData } = useGetCustomerBrandOptions(brandPayload);

  const {
    data: customerWiseAssetData,
    isFetching: isFetchingCustomerWiseAssets,
    refetch: refetchCustomerWiseAssets,
  } = useGetCustomerWiseAssets(
    customerWiseAssetPayload,
    !!selectedRow?.id,
  );
  const [savingAssetToDb, setSavingAssetToDb] = useState(false);

  const assetSuggestList = useMemo(
    () => extractList(assetSuggestData),
    [assetSuggestData],
  );

  const departmentList = useMemo(
    () => extractList(departmentData),
    [departmentData],
  );

  const brandList = useMemo(() => extractList(brandData), [brandData]);

  const departmentOptions = useMemo(
    () =>
      toUniqueOptions(
        departmentList.length ? departmentList : assetSuggestList,
        ["cDepartmentName", "cDepartment", "department", "departmentName"],
      ),
    [assetSuggestList, departmentList],
  );

  const brandOptions = useMemo(
    () =>
      toUniqueOptions(brandList.length ? brandList : assetSuggestList, [
        "cBrandName",
        "cBrand",
        "brand",
        "brandName",
      ]),
    [brandList, assetSuggestList],
  );

  const resolveDepartmentLabel = (asset: any) => {
    const direct = String(
      asset?.department ??
        asset?.cDepartment ??
        asset?.departmentLabel ??
        asset?.departmentName ??
        asset?.cDepartmentName ??
        asset?.Department ??
        asset?.DepartmentName ??
        asset?.departmentName ??
        "",
    ).trim();

    if (direct) return direct;

    const byId = findMatchingItem(
      departmentList,
      asset?.nDepartmentId ?? asset?.DepartmentId ?? asset?.departmentId,
      ["nDepartmentId", "DepartmentId", "departmentId", "id"],
    );

    return String(
      byId?.cDepartmentName ??
        byId?.cDepartment ??
        byId?.DepartmentName ??
        byId?.departmentName ??
        byId?.name ??
        "",
    ).trim();
  };

  const resolveBrandLabel = (asset: any) => {
    const direct = String(
      asset?.brand ??
        asset?.cBrand ??
        asset?.brandLabel ??
        asset?.brandName ??
        asset?.cBrandName ??
        asset?.Brand ??
        asset?.BrandName ??
        asset?.brandName ??
        "",
    ).trim();

    if (direct) return direct;

    const byId = findMatchingItem(
      brandList,
      asset?.nBrandId ?? asset?.BrandId ?? asset?.brandId,
      ["nBrandId", "BrandId", "brandId", "id"],
    );

    return String(
      byId?.cBrandName ??
        byId?.cBrand ??
        byId?.BrandName ??
        byId?.brandName ??
        byId?.name ??
        "",
    ).trim();
  };

  // LOCATION SECTION

  const [locationOpen, setLocationOpen] = useState(false);

  // ASSET FORM SHOW

  const [showAssetForm, setShowAssetForm] = useState(false);

  // true = asset form fields are read-only, showing edit/delete buttons
  const [assetViewMode, setAssetViewMode] = useState(false);

  // -1 = adding new; >= 0 = editing existing at that index
  const [editingIndex, setEditingIndex] = useState(-1);

  const [activeTab, setActiveTab] = useState("customer_details");

  const [assetList, setAssetList] = useState<any[]>([]);

  const recentlySavedAssetsRef = useRef<any[]>([]);

  const [assetValues, setAssetValues] = useState<any>({
    name: "",
    shortName: "",
    department: "",
    departmentLabel: "",
    brand: "",
    brandLabel: "",
    serialNo: "",
    description: "",
    amc: false,
    warranty: false,
    expiryDate: undefined,
  });

  const [locationQuery, setLocationQuery] = useState("");

  const [selectedCoordinates, setSelectedCoordinates] = useState({
    latitude: "",
    longitude: "",
  });

  const [mapQuery, setMapQuery] = useState(defaultLocationQuery);

  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    mapQuery,
  )}&z=14&output=embed`;

  const watchedAssets = Form.useWatch("assets", form);

  const watchedLocation = Form.useWatch("cLocation", form);

  const watchedLatitude = Form.useWatch("cLattitude", form);

  const watchedLongitude = Form.useWatch("cLongitude", form);

  const syncAssetDraft = (
    nextAssetValues: any,
    nextEditingIndex = editingIndex,
  ) => {
    const name = String(nextAssetValues.name ?? "").trim();

    if (!name) {
      form.setFieldsValue({ assetDraft: undefined });

      return;
    }

    const department = findMatchingItem(
      departmentList,
      nextAssetValues.department,
      ["cDepartmentName", "DepartmentName", "departmentName", "name"],
    );
    const brand = findMatchingItem(brandList, nextAssetValues.brand, [
      "cBrandName",
      "BrandName",
      "brandName",
      "name",
    ]);

    form.setFieldsValue({
      assetDraft: {
      ...nextAssetValues,
      name,
      shortName: nextAssetValues.shortName?.trim() ?? "",
      department: nextAssetValues.department?.trim() ?? "",
      departmentLabel:
        nextAssetValues.departmentLabel?.trim() ??
        nextAssetValues.department?.trim() ??
        "",
      brand: nextAssetValues.brand?.trim() ?? "",
      brandLabel:
        nextAssetValues.brandLabel?.trim() ??
        nextAssetValues.brand?.trim() ??
        "",
      serialNo: nextAssetValues.serialNo?.trim() ?? "",
      description: nextAssetValues.description?.trim() ?? "",
      nDepartmentId:
        nextAssetValues.nDepartmentId ??
        department?.nDepartmentId ??
        department?.id,
      nBrandId: nextAssetValues.nBrandId ?? brand?.nBrandId ?? brand?.id,
      editingIndex: nextEditingIndex,
      },
    });
  };

  const getCurrentAssetDraft = () => {
    const name = String(assetValues.name ?? "").trim();

    if (!name) return form.getFieldValue("assetDraft");

    const department = findMatchingItem(departmentList, assetValues.department, [
      "cDepartmentName",
      "DepartmentName",
      "departmentName",
      "name",
    ]);
    const brand = findMatchingItem(brandList, assetValues.brand, [
      "cBrandName",
      "BrandName",
      "brandName",
      "name",
    ]);

    return {
      ...assetValues,
      name,
      shortName: assetValues.shortName?.trim() ?? "",
      department: assetValues.department?.trim() ?? "",
      departmentLabel:
        assetValues.departmentLabel?.trim() ??
        assetValues.department?.trim() ??
        "",
      brand: assetValues.brand?.trim() ?? "",
      brandLabel:
        assetValues.brandLabel?.trim() ??
        assetValues.brand?.trim() ??
        "",
      serialNo: assetValues.serialNo?.trim() ?? "",
      description: assetValues.description?.trim() ?? "",
      nDepartmentId:
        assetValues.nDepartmentId ?? department?.nDepartmentId ?? department?.id,
      nBrandId: assetValues.nBrandId ?? brand?.nBrandId ?? brand?.id,
      editingIndex,
    };
  };

  useEffect(() => {
    (form as any).__getCustomerAssetDraft = getCurrentAssetDraft;

    return () => {
      delete (form as any).__getCustomerAssetDraft;
    };
  }, [assetValues, brandList, departmentList, editingIndex, form]);

  useEffect(() => {
    syncAssetDraft(assetValues);
  }, [assetValues, brandList, departmentList, editingIndex]);

  useEffect(() => {
    if (Array.isArray(watchedAssets)) {
      const savedAssets = recentlySavedAssetsRef.current;

      if (savedAssets.length) {
        setAssetList(mergeAssetLists(savedAssets, watchedAssets));

        return;
      }

      setAssetList(watchedAssets.map(normalizeAssetForDisplay));
    }
  }, [watchedAssets]);

  useEffect(() => {
    if (!selectedRow?.id) return;

    recentlySavedAssetsRef.current = [];
    form.setFieldsValue({
      assets: [],
      assetList: [],
      AssetList: [],
      CustomerAssetList: [],
      customerAssetList: [],
    });
    setAssetList([]);

    const selectedRowAssets = extractAssetList(selectedRow?.raw ?? selectedRow);

    if (!selectedRowAssets.length) return;

    const nextAssets = selectedRowAssets.map(normalizeAssetForDisplay);

    form.setFieldsValue({
      assets: nextAssets,
      assetList: nextAssets,
      AssetList: nextAssets,
      CustomerAssetList: nextAssets,
      customerAssetList: nextAssets,
    });
    setAssetList(nextAssets);
  }, [form, selectedRow]);

  useEffect(() => {
    if (!selectedRow?.id) return;
    if (customerWiseAssetData === undefined) return;

    const fetchedAssets = extractAssetList(customerWiseAssetData);
    const savedAssets = recentlySavedAssetsRef.current;

    if (!fetchedAssets.length) {
      const currentAssets = form.getFieldValue("assets");

      if (Array.isArray(currentAssets) && currentAssets.length) {
        const nextAssets = mergeAssetLists(currentAssets, savedAssets);

        form.setFieldsValue({
          assets: nextAssets,
          assetList: nextAssets,
          AssetList: nextAssets,
          CustomerAssetList: nextAssets,
          customerAssetList: nextAssets,
        });
        setAssetList(nextAssets);

        return;
      }

      if (!savedAssets.length) return;

      const nextAssets = savedAssets.map(normalizeAssetForDisplay);

      form.setFieldsValue({
        assets: nextAssets,
        assetList: nextAssets,
        AssetList: nextAssets,
        CustomerAssetList: nextAssets,
        customerAssetList: nextAssets,
      });
      setAssetList(nextAssets);

      return;
    }

    const nextAssets = mergeAssetLists(fetchedAssets, savedAssets);

    form.setFieldsValue({
      assets: nextAssets,
      assetList: nextAssets,
      AssetList: nextAssets,
      CustomerAssetList: nextAssets,
      customerAssetList: nextAssets,
    });
    setAssetList(nextAssets);
  }, [customerWiseAssetData, form, selectedRow?.id]);

  useEffect(() => {
    // Filter out API placeholder values ("NIL", "0") that are not real user data
    const cleanLocation =
      watchedLocation && watchedLocation !== "NIL" ? watchedLocation : "";
    const cleanLat =
      watchedLatitude && watchedLatitude !== "NIL" && watchedLatitude !== "0"
        ? watchedLatitude
        : "";
    const cleanLng =
      watchedLongitude && watchedLongitude !== "NIL" && watchedLongitude !== "0"
        ? watchedLongitude
        : "";

    const coordinateQuery = coordinateText(cleanLat, cleanLng);
    const nextQuery = coordinateQuery || cleanLocation || defaultLocationQuery;

    setMapQuery(nextQuery);
    setLocationQuery(cleanLocation || coordinateQuery);
    setSelectedCoordinates({
      latitude: cleanLat,
      longitude: cleanLng,
    });
  }, [watchedLatitude, watchedLocation, watchedLongitude]);

  const handleLocationSearch = (value: string) => {
    const nextQuery = value.trim() || defaultLocationQuery;
    const coordinates = parseCoordinates(nextQuery);

    setMapQuery(nextQuery);

    if (coordinates.latitude && coordinates.longitude) {
      setSelectedCoordinates(coordinates);
    }
  };

  const handleMapPoint = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerCoordinates = parseCoordinates(mapQuery);
    const centerLatitude = Number(
      centerCoordinates.latitude || defaultLocationQuery.split(",")[0],
    );
    const centerLongitude = Number(
      centerCoordinates.longitude || defaultLocationQuery.split(",")[1],
    );
    const xRatio = event.nativeEvent.offsetX / rect.width;
    const yRatio = event.nativeEvent.offsetY / rect.height;
    const latitude = roundCoordinate(centerLatitude + (0.5 - yRatio) * 0.08);
    const longitude = roundCoordinate(centerLongitude + (xRatio - 0.5) * 0.08);
    const nextCoordinates = {
      latitude,
      longitude,
    };

    setSelectedCoordinates(nextCoordinates);
    setLocationQuery(coordinateText(latitude, longitude));
    setMapQuery(coordinateText(latitude, longitude));
  };

  const handleLocationSave = () => {
    const selectedLocation = locationQuery.trim() || mapQuery;
    const parsedCoordinates = parseCoordinates(selectedLocation);
    const latitude = selectedCoordinates.latitude || parsedCoordinates.latitude;
    const longitude =
      selectedCoordinates.longitude || parsedCoordinates.longitude;

    form.setFieldsValue({
      cLocation: selectedLocation,
      cLattitude: latitude,
      cLatitude: latitude,
      cLongitude: longitude,
    });

    setLocationOpen(false);
  };

  useEffect(() => {
    const className = "customer-asset-tab-active";

    // document.body.classList.toggle(
    //   className,
    //   activeTab === "2"
    // );

    document.documentElement.classList.toggle(
      className,
      activeTab === "customer_assets",
    );

    return () => {
      // document.body.classList.remove(
      //   className
      // );
      document.documentElement.classList.remove(className);
    };
  }, [activeTab]);

  useEffect(() => {
    syncAssetDraft(assetValues, editingIndex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetValues, editingIndex, departmentList, brandList]);

  const handleAssetValueChange = (key: string, value: any) => {
    if (key === "name") {
      setAssetSearch(String(value ?? ""));
    }

    setAssetValues((current: any) => {
      const nextValues = {
        ...current,
        [key]: value,
      };

      if (key === "department") {
        nextValues.departmentLabel = String(value ?? "").trim();
      }

      if (key === "brand") {
        nextValues.brandLabel = String(value ?? "").trim();
      }

      return nextValues;
    });
  };

  const resetAssetForm = () => {
    setAssetSearch("");
    form.setFieldsValue({ assetDraft: undefined });

    setAssetValues({
      name: "",
      shortName: "",
      department: "",
      departmentLabel: "",
      brand: "",
      brandLabel: "",
      serialNo: "",
      description: "",
      amc: false,
      warranty: false,
      expiryDate: undefined,
    });
    setEditingIndex(-1);
    setAssetViewMode(false);
  };

  const getExistingAssetMaster = (asset: any) => {
    const assetName = String(asset.name ?? asset.cAssetName ?? "")
      .trim()
      .toLowerCase();
    const shortName = String(asset.shortName ?? asset.cAssetShName ?? "")
      .trim()
      .toLowerCase();

    return assetSuggestList.find((item: any) => {
      const itemName = String(item.cAssetName ?? item.name ?? "")
        .trim()
        .toLowerCase();
      const itemShortName = String(item.cAssetShName ?? item.shortName ?? "")
        .trim()
        .toLowerCase();

      return (
        (!!assetName && itemName === assetName) ||
        (!!shortName && itemShortName === shortName)
      );
    });
  };

  const ensureAssetMasterSaved = async (asset: any) => {
    const assetId = getAssetMasterId(asset) || getAssetId(asset);
    const existingAsset = !assetId ? getExistingAssetMaster(asset) : null;
    const existingAssetId = assetId || getAssetMasterId(existingAsset) || getAssetId(existingAsset);

    if (existingAssetId) {
      const response = await assetMasterApis.assetMasterUpdate({
        ...buildAssetMasterSavePayload(asset, brandList, departmentList),
        nAssetMasterId: existingAssetId,
        AssetMasterId: existingAssetId,
        assetMasterId: existingAssetId,
      });

      if (!isApiSuccess(response)) {
        throw new Error(getApiMessage(response, "Unable to update asset master"));
      }

      return {
        ...asset,
        ...(existingAsset || {}),
        nAssetMasterId: existingAssetId,
        AssetMasterId: existingAssetId,
        assetMasterId: existingAssetId,
        nAssetId: asset.nAssetId ?? 0,
        name: asset.name,
        shortName: asset.shortName,
        department: asset.department,
        brand: asset.brand,
        serialNo: asset.serialNo,
        description: asset.description,
      };
    }

    const response = await assetMasterApis.assetMasterSave(
      buildAssetMasterSavePayload(asset, brandList, departmentList),
    );

    if (!isApiSuccess(response)) {
      throw new Error(getApiMessage(response, "Unable to save asset master"));
    }

    const savedAssetId = getSavedAssetId(response);

    if (savedAssetId) {
      return {
        ...asset,
        nAssetMasterId: savedAssetId,
        AssetMasterId: savedAssetId,
        assetMasterId: savedAssetId,
        nAssetId: asset.nAssetId ?? 0,
      };
    }

    const refreshedAssets = extractList(
      await assetMasterApis.assetMasterSuggest({
        ...getSessionPayload(),
        cSearch: asset.name ?? asset.cAssetName ?? "",
      }),
    );
    const savedAsset = findMatchingItem(
      refreshedAssets,
      asset.name ?? asset.cAssetName,
      ["cAssetName", "cAssetMasterName", "name"],
    );
    const refreshedAssetId = getAssetId(savedAsset);

    if (!refreshedAssetId) {
      throw new Error("Asset saved, but asset id was not returned");
    }

    return {
      ...asset,
      ...savedAsset,
      nAssetMasterId: refreshedAssetId,
      AssetMasterId: refreshedAssetId,
      assetMasterId: refreshedAssetId,
      nAssetId: asset.nAssetId ?? 0,
      name: asset.name,
      shortName: asset.shortName,
      department: asset.department,
      brand: asset.brand,
      serialNo: asset.serialNo,
      description: asset.description,
    };
  };

  const getAssetsWithCurrentDraft = () => {
    const currentAssets = Array.isArray(form.getFieldValue("assets"))
      ? form.getFieldValue("assets")
      : assetList;
    const draft = getCurrentAssetDraft();
    const draftName = String(draft?.name ?? draft?.cAssetName ?? "").trim();

    if (!draftName) return currentAssets;

    const editingAssetIndex = Number(draft.editingIndex);
    const draftAsset = {
      ...draft,
      name: draftName,
      shortName: String(draft.shortName ?? draft.cAssetShName ?? "").trim(),
      department: String(draft.department ?? draft.cDepartmentName ?? "").trim(),
      brand: String(draft.brand ?? draft.cBrandName ?? "").trim(),
      serialNo: String(draft.serialNo ?? draft.cSerialNo ?? "").trim(),
      description: String(
        draft.description ?? draft.cAssetDescription ?? "",
      ).trim(),
    };

    delete draftAsset.editingIndex;

    if (Number.isInteger(editingAssetIndex) && editingAssetIndex >= 0) {
      return currentAssets.map((asset: any, index: number) =>
        index === editingAssetIndex ? { ...asset, ...draftAsset } : asset,
      );
    }

    return [...currentAssets, draftAsset];
  };

  const prepareCustomerAssetsForSave = async () => {
    const nextAssets = getAssetsWithCurrentDraft();

    if (!nextAssets.length) {
      return {
        assets: [],
        assetDraft: undefined,
      };
    }

    const normalizedAssets = nextAssets.map(normalizeAssetForDisplay);

    form.setFieldsValue({
      assets: normalizedAssets,
      assetList: normalizedAssets,
      AssetList: normalizedAssets,
      CustomerAssetList: normalizedAssets,
      customerAssetList: normalizedAssets,
      assetDraft: undefined,
    });
    setAssetList(normalizedAssets);
    recentlySavedAssetsRef.current = normalizedAssets;

    return {
      assets: normalizedAssets,
      assetDraft: undefined,
    };
  };

  useEffect(() => {
    (form as any).__prepareCustomerAssetsForSave = prepareCustomerAssetsForSave;

    return () => {
      delete (form as any).__prepareCustomerAssetsForSave;
    };
  }, [assetList, assetValues, brandList, departmentList, editingIndex, form]);

  const handleAssetSave = () => {
    const name = assetValues.name?.trim();

    if (!name) {
      message.error("Asset name is required");

      return;
    }

    const updatedAsset = {
      ...assetValues,
      name,
      shortName: assetValues.shortName?.trim() ?? "",
      department:
        String(assetValues.department ?? "").trim() ||
        resolveDepartmentLabel(assetValues),
      departmentLabel:
        String(assetValues.departmentLabel ?? "").trim() ||
        String(assetValues.department ?? "").trim() ||
        resolveDepartmentLabel(assetValues),
      brand:
        String(assetValues.brand ?? "").trim() ||
        resolveBrandLabel(assetValues),
      brandLabel:
        String(assetValues.brandLabel ?? "").trim() ||
        String(assetValues.brand ?? "").trim() ||
        resolveBrandLabel(assetValues),
      serialNo: assetValues.serialNo?.trim() ?? "",
      description: assetValues.description?.trim() ?? "",
    };

    let nextAssets: any[];

    if (editingIndex >= 0) {
      nextAssets = assetList.map((item, idx) =>
        idx === editingIndex
          ? normalizeAssetForDisplay({ ...item, ...updatedAsset })
          : item
      );
    } else {
      nextAssets = [
        ...assetList,
        normalizeAssetForDisplay(updatedAsset),
      ];
    }

    form.setFieldsValue({
      assets: nextAssets,
      assetList: nextAssets,
      AssetList: nextAssets,
      CustomerAssetList: nextAssets,
      customerAssetList: nextAssets,
    });
    setAssetList(nextAssets);
    recentlySavedAssetsRef.current = nextAssets;
    resetAssetForm();
    setShowAssetForm(false);
    if (selectedRow?.id) {
      void refetchCustomerWiseAssets();
    }
    message.success(
      editingIndex >= 0
        ? "Asset updated. Click Save to update customer"
        : "Asset added. Click Save to store customer asset"
    );
  };

  const handleAssetEdit = (index: number) => {
    const asset = assetList[index];
    const nextAssetValues = {
      ...asset,
      name: asset.name || asset.cAssetName || "",
      shortName: asset.shortName || asset.cAssetShName || "",
      department: resolveDepartmentLabel(asset),
      departmentLabel: resolveDepartmentLabel(asset),
      brand: resolveBrandLabel(asset),
      brandLabel: resolveBrandLabel(asset),
      serialNo: asset.serialNo || asset.cSerialNo || "",
      description: asset.description || asset.cAssetDescription || "",
      amc: asset.amc ?? asset.bUnderAmc ?? asset.bAMC ?? false,
      warranty: asset.warranty ?? asset.bUnderWarranty ?? asset.bWarranty ?? false,
      expiryDate: asset.expiryDate || undefined,
    };

    setAssetSearch(asset.name || asset.cAssetName || "");
    syncAssetDraft(nextAssetValues, index);
    setAssetValues(nextAssetValues);
    setEditingIndex(index);
    setAssetViewMode(true);
    setShowAssetForm(true);
  };

  const handleAssetDelete = (index: number) => {
    const nextAssets = assetList.filter((_, idx) => idx !== index);

    form.setFieldsValue({
      assets: nextAssets,
      assetList: nextAssets,
      AssetList: nextAssets,
      CustomerAssetList: nextAssets,
      customerAssetList: nextAssets,
    });
    setAssetList(nextAssets);
    recentlySavedAssetsRef.current = nextAssets;
    resetAssetForm();
    setShowAssetForm(false);
    if (selectedRow?.id) {
      void refetchCustomerWiseAssets();
    }
    message.success("Asset removed. Click Save to update customer");
  };

  return (
    <>
      <Tabs
        className="customer-drawer-tabs"
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);

          if (key === "customer_assets") {
            setShowAssetForm(false);

            if (selectedRow?.id) {
              refetchCustomerWiseAssets();
            }
          }
        }}
        items={[
          // CUSTOMER TAB

          {
            key: "customer_details",

            label: "Customer Master",

            children: (
              <div className="customer-compact-form w-full">
                {/* ROW 1 */}

                <div className="grid grid-cols-[1.6fr_0.95fr] gap-2">
                  <Form.Item
                    name="name"
                    label="Customer Name"
                    rules={[
                      {
                        required: true,
                        whitespace: true,
                        message: "Please enter customer name",
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item name="shortName" label="Short Name">
                    <Input />
                  </Form.Item>
                </div>

                {/* ROW 2 */}

                <div className="grid grid-cols-[1.1fr_1.1fr] gap-2">
                  <Form.Item name="contactPerson" label="Contact Person Name">
                    <Input />
                  </Form.Item>

                  <Form.Item name="mobile" label="Mobile">
                    <Input />
                  </Form.Item>
                </div>

                {/* ROW 3 */}

                <div className="grid grid-cols-[1.1fr_1.1fr] gap-2">
                  <Form.Item name="email" label="Email">
                    <Input />
                  </Form.Item>

                  <Form.Item name="gstNo" label="GST Number">
                    <Input />
                  </Form.Item>
                </div>

                {/* ADDRESS */}

                <Form.Item name="address" label="Address">
                  <TextArea rows={3} />
                </Form.Item>

                {/* AMC */}

                <div className="grid grid-cols-[66px_86px_180px] items-end gap-3">
                  <Form.Item
                    name="amc"
                    valuePropName="checked"
                    className="!mb-0"
                  >
                    <Checkbox
                      onChange={(event) => {
                        if (event.target.checked) {
                          form.setFieldsValue({
                            warranty: false,
                          });
                        }
                      }}
                    >
                      AMC
                    </Checkbox>
                  </Form.Item>

                  <Form.Item
                    name="warranty"
                    valuePropName="checked"
                    className="!mb-0"
                  >
                    <Checkbox
                      onChange={(event) => {
                        if (event.target.checked) {
                          form.setFieldsValue({
                            amc: false,
                          });
                        }
                      }}
                    >
                      Warranty
                    </Checkbox>
                  </Form.Item>

                  <Form.Item
                    name="expiryDate"
                    label="Expiry Date"
                    className="!mb-2 "
                  >
                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                  </Form.Item>
                </div>

                {/* LOCATION */}

                {(() => {
                  const realLocation =
                    watchedLocation && watchedLocation !== "NIL"
                      ? watchedLocation
                      : "";
                  const realLat =
                    watchedLatitude &&
                    watchedLatitude !== "NIL" &&
                    watchedLatitude !== "0"
                      ? watchedLatitude
                      : "";
                  const realLng =
                    watchedLongitude &&
                    watchedLongitude !== "NIL" &&
                    watchedLongitude !== "0"
                      ? watchedLongitude
                      : "";
                  const hasLocation = !!(
                    realLocation || (realLat && realLng)
                  );
                  const displayText =
                    realLocation ||
                    (realLat && realLng ? `${realLat}, ${realLng}` : "");
                  return hasLocation ? (
                    <div className="space-y-2 mt-4">
                      <p className="text-xs font-semibold text-slate-700 mb-1">
                        Location Saved
                      </p>
                      <div
                        className="relative h-[200px] overflow-hidden rounded border border-slate-200 cursor-pointer group"
                        onClick={() => setLocationOpen(true)}
                        title="Click to edit location"
                      >
                        <iframe
                          title="Customer Saved Location Map"
                          src={mapUrl}
                          className="pointer-events-none h-full w-full border-0"
                          loading="lazy"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-slate-700 text-xs font-medium px-3 py-1 rounded shadow">
                            Click to edit location
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-xs text-slate-500 truncate block">
                          {displayText}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Button
                      htmlType="button"
                      block
                      className="h-9 border-blue-400 text-blue-500 rounded mt-4"
                      onClick={() => setLocationOpen(true)}
                    >
                      + Add Location
                    </Button>
                  );
                })()}

              </div>
            ),
          },

          // ASSET TAB

          {
            key: "customer_assets",

            label: "Asset",

            children: (
              <div className="asset-tab-content">
                {!assetList.length && !showAssetForm && (
                  <Button
                    htmlType="button"
                    block
                    disabled={viewMode}
                    className="asset-link-button h-9 border-blue-400 text-blue-500 rounded"
                    onClick={() => {
                      resetAssetForm();
                      setShowAssetForm(true);
                    }}
                  >
                    + Link Asset
                  </Button>
                )}

                {isFetchingCustomerWiseAssets && !assetList.length ? (
                  <div className="py-6 text-center text-sm text-slate-500">
                    Loading assets...
                  </div>
                ) : assetList.length > 0 ? (
                  <div className="flex flex-col gap-2 mt-2">
                    {assetList.map((asset: any, index: number) => {
                      const displayName =
                        asset.name || asset.cAssetName || "";
                      const normalizeCardValue = (value: any) => {
                        const text = String(value ?? "").trim();

                        if (!text) return "";

                        const blocked = ["NIL", "NULL", "NONE", "0", "-"];

                        return blocked.includes(text.toUpperCase()) ? "" : text;
                      };

                      const displayDept =
                        normalizeCardValue(
                          asset.departmentName ||
                          resolveDepartmentLabel(asset) ||
                          asset.departmentLabel ||
                          asset.cDepartment ||
                          asset.cDepartmentName ||
                          asset.department ||
                            asset.Department ||
                            asset.DepartmentName ||
                            asset.departmentName ||
                            asset.nDepartmentId,
                        ) || "-";
                      const displayBrand =
                        normalizeCardValue(
                          asset.brandName ||
                          resolveBrandLabel(asset) ||
                          asset.brandLabel ||
                          asset.cBrand ||
                          asset.cBrandName ||
                            asset.brand ||
                            asset.Brand ||
                            asset.BrandName ||
                            asset.brandName ||
                            asset.nBrandId,
                        ) || "-";

                      return (
                        <button
                          type="button"
                          key={`asset-${index}`}
                          className={`w-full rounded border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600${
                            viewMode ? ' cursor-default opacity-80' : ' hover:border-blue-300 cursor-pointer'
                          }`}
                          title={viewMode ? undefined : "Click to edit asset"}
                          onClick={() => !viewMode && handleAssetEdit(index)}
                          disabled={viewMode}
                        >
                          <p className="mb-2 text-sm font-semibold text-slate-900">
                            {displayName}
                          </p>

                          <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-500 sm:grid-cols-2 sm:gap-3">
                            <p className="break-words">
                              <span className="font-medium text-slate-600">
                                Department :
                              </span>{" "}
                              {displayDept}
                            </p>
                            <p className="break-words sm:text-right">
                              <span className="font-medium text-slate-600">
                                Brand :
                              </span>{" "}
                              {displayBrand}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {assetList.length > 0 && !showAssetForm && (
                  <Button
                    htmlType="button"
                    block
                    disabled={viewMode}
                    className="asset-link-button mt-2 h-9 border-blue-400 text-blue-500 rounded"
                    onClick={() => {
                      resetAssetForm();
                      setShowAssetForm(true);
                    }}
                  >
                    + Link Asset
                  </Button>
                )}

                {/* ASSET FORM */}

                {showAssetForm && (
                  <div className="asset-form-panel">
                    {/* HEADER */}

                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="m-0 text-lg font-medium leading-6 text-slate-900">
                        Asset
                      </h2>

                      <button
                        type="button"
                        className="text-2xl leading-none text-black"
                        onClick={() => {
                          resetAssetForm();
                          setShowAssetForm(false);
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="asset-compact-form">
                      {/* NAME */}

                      <Form.Item label="Name" className="!mb-1">
                        <Input
                          value={assetValues.name}
                          disabled={assetViewMode}
                          onChange={(event) =>
                            handleAssetValueChange("name", event.target.value)
                          }
                        />
                      </Form.Item>

                      {/* ROW */}

                      <div className="grid grid-cols-2 gap-2">
                        <Form.Item label="Short Name" className="!mb-1">
                          <Input
                            value={assetValues.shortName}
                            disabled={assetViewMode}
                            onChange={(event) =>
                              handleAssetValueChange(
                                "shortName",
                                event.target.value,
                              )
                            }
                          />
                        </Form.Item>

                        <Form.Item label="Department" className="!mb-1">
                          <AutoComplete
                            value={assetValues.department}
                            options={departmentOptions}
                            disabled={assetViewMode}
                            filterOption={(inputValue, option) =>
                              String(option?.value ?? "")
                                .toLowerCase()
                                .includes(inputValue.toLowerCase())
                            }
                            onChange={(value) =>
                              handleAssetValueChange("department", value)
                            }
                          >
                            <Input
                              disabled={assetViewMode}
                              suffix={
                                <span className="text-lg leading-none text-slate-600">
                                  &gt;
                                </span>
                              }
                            />
                          </AutoComplete>
                        </Form.Item>
                      </div>

                      {/* ROW */}

                      <div className="grid grid-cols-2 gap-2">
                        <Form.Item label="Brand" className="!mb-1">
                          <AutoComplete
                            value={assetValues.brand}
                            options={brandOptions}
                            disabled={assetViewMode}
                            filterOption={(inputValue, option) =>
                              String(option?.value ?? "")
                                .toLowerCase()
                                .includes(inputValue.toLowerCase())
                            }
                            onChange={(value) =>
                              handleAssetValueChange("brand", value)
                            }
                          >
                            <Input
                              disabled={assetViewMode}
                              suffix={
                                <span className="text-lg leading-none text-slate-600">
                                  &gt;
                                </span>
                              }
                            />
                          </AutoComplete>
                        </Form.Item>

                        <Form.Item label="Serial No" className="!mb-1">
                          <Input
                            value={assetValues.serialNo}
                            disabled={assetViewMode}
                            onChange={(event) =>
                              handleAssetValueChange(
                                "serialNo",
                                event.target.value,
                              )
                            }
                          />
                        </Form.Item>
                      </div>

                      {/* DESCRIPTION */}

                      <Form.Item label="Description" className="!mb-2">
                        <Input.TextArea
                          rows={3}
                          value={assetValues.description}
                          disabled={assetViewMode}
                          onChange={(event) =>
                            handleAssetValueChange(
                              "description",
                              event.target.value,
                            )
                          }
                        />
                      </Form.Item>

                      {/* AMC */}

                      <div className="grid grid-cols-[64px_86px_176px] items-end gap-3">
                        <Checkbox
                          checked={assetValues.amc}
                          disabled={assetViewMode}
                          onChange={(event) =>
                            setAssetValues((current: any) => {
                              const nextValues = {
                                ...current,
                                amc: event.target.checked,
                                warranty: event.target.checked
                                  ? false
                                  : current.warranty,
                              };

                              syncAssetDraft(nextValues);

                              return nextValues;
                            })
                          }
                        >
                          AMC
                        </Checkbox>

                        <Checkbox
                          checked={assetValues.warranty}
                          disabled={assetViewMode}
                          onChange={(event) =>
                            setAssetValues((current: any) => {
                              const nextValues = {
                                ...current,
                                warranty: event.target.checked,
                                amc: event.target.checked ? false : current.amc,
                              };

                              syncAssetDraft(nextValues);

                              return nextValues;
                            })
                          }
                        >
                          Warranty
                        </Checkbox>

                        <Form.Item label="Expiry Date" className="!mb-0">
                          <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY"
                            disabled={assetViewMode}
                            value={assetValues.expiryDate}
                            onChange={(value) =>
                              handleAssetValueChange("expiryDate", value)
                            }
                          />
                        </Form.Item>
                      </div>

                      <div className="flex gap-2 mt-4">
                        {editingIndex >= 0 && (
                          <>
                            <Button
                              htmlType="button"
                              icon={<EditOutlined />}
                              style={{ height: 32 }}
                              onClick={() => setAssetViewMode(false)}
                            />

                            <Button
                              htmlType="button"
                              danger
                              type="primary"
                              icon={<DeleteOutlined />}
                              style={{ height: 32 }}
                              onClick={() => handleAssetDelete(editingIndex)}
                            />
                          </>
                        )}
                        {!assetViewMode && (
                          <Button
                            htmlType="button"
                            style={{ height: 32, background: '#000', color: '#fff', borderColor: '#000', paddingInline: 20 }}
                            className="hover:!bg-black hover:!text-white hover:!border-black"
                            loading={savingAssetToDb}
                            onClick={handleAssetSave}
                          >
                            Save
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ),
          },
        ]}
      />

      <Modal
        open={locationOpen}
        title="Customer Location"
        onCancel={() => setLocationOpen(false)}
        onOk={handleLocationSave}
        okText="Save Location"
        centered={false}
        style={{ top: 0, margin: 0, padding: 0, maxWidth: "100vw" }}
        styles={{
          body: {
            height: "calc(100vh - 108px)",
            overflowY: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "12px 16px",
          },
          header: { padding: "12px 16px 8px", marginBottom: 0 },
          footer: { padding: "8px 16px" },
        }}
        width="100vw"
      >
        <Search
          allowClear
          value={locationQuery}
          placeholder="Search location or enter latitude,longitude"
          enterButton="Search"
          onChange={(event) => setLocationQuery(event.target.value)}
          onSearch={handleLocationSearch}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            value={selectedCoordinates.latitude}
            placeholder="Latitude"
            onChange={(event) =>
              setSelectedCoordinates((current) => ({
                ...current,
                latitude: event.target.value,
              }))
            }
          />

          <Input
            value={selectedCoordinates.longitude}
            placeholder="Longitude"
            onChange={(event) =>
              setSelectedCoordinates((current) => ({
                ...current,
                longitude: event.target.value,
              }))
            }
          />
        </div>

        <div
          className="relative overflow-hidden rounded border border-slate-200"
          style={{ flex: 1, minHeight: 0 }}
          onClick={handleMapPoint}
        >
          <iframe
            title="Customer Location Map"
            src={mapUrl}
            style={{ width: "100%", height: "100%", border: 0, display: "block", pointerEvents: "none" }}
            loading="lazy"
          />

          <div className="pointer-events-none absolute inset-0 bg-transparent">
            <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-full rounded-full border-2 border-red-500 bg-white shadow" />
          </div>
        </div>
      </Modal>


      <Form.Item name="customerCode" hidden>
        <Input />
      </Form.Item>

      <Form.List name="assets">{() => null}</Form.List>

      <Form.Item name={["assetDraft", "name"]} hidden>
        <Input />
      </Form.Item>

      <Form.Item name={["assetDraft", "shortName"]} hidden>
        <Input />
      </Form.Item>

      <Form.Item name={["assetDraft", "department"]} hidden>
        <Input />
      </Form.Item>

      <Form.Item name={["assetDraft", "brand"]} hidden>
        <Input />
      </Form.Item>

      <Form.Item name={["assetDraft", "serialNo"]} hidden>
        <Input />
      </Form.Item>

      <Form.Item name={["assetDraft", "description"]} hidden>
        <Input />
      </Form.Item>

      <Form.Item name={["assetDraft", "amc"]} hidden>
        <Input />
      </Form.Item>

      <Form.Item name={["assetDraft", "warranty"]} hidden>
        <Input />
      </Form.Item>

      <Form.Item name={["assetDraft", "expiryDate"]} hidden>
        <Input />
      </Form.Item>

      <Form.Item name={["assetDraft", "nDepartmentId"]} hidden>
        <Input />
      </Form.Item>

      <Form.Item name={["assetDraft", "nBrandId"]} hidden>
        <Input />
      </Form.Item>

      <Form.Item name={["assetDraft", "editingIndex"]} hidden>
        <Input />
      </Form.Item>

      <Form.Item name="cLocation" hidden>
        <Input />
      </Form.Item>

      <Form.Item name="cLattitude" hidden>
        <Input />
      </Form.Item>

      <Form.Item name="cLatitude" hidden>
        <Input />
      </Form.Item>

      <Form.Item name="cLongitude" hidden>
        <Input />
      </Form.Item>
    </>
  );
};

export default CustomerDrawer;
