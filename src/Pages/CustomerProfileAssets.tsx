import { SearchOutlined } from "@ant-design/icons";
import { Button, Empty, Form, Input, Spin, message } from "antd";
import { useMemo, useState } from "react";

import { getRequestPayload } from "../Utils/requestPayload";
import { extractList } from "./Master/Common/SimpleMasterUtils";
import CustomerAssetDrawer from "./Master/CustomerMaster/CustomerAssetDrawer";
import type { CustomerAssetDrawerMode, CustomerAssetFormValues } from "./Master/CustomerMaster/CustomerAssetDrawer";
import {
  useGetCustomerAssetDepartments,
  useGetCustomerBrandOptions,
  useGetCustomerWiseAssets,
} from "./Master/CustomerMaster/Hooks";
import { useDeleteAssetMaster, useSaveAssetMaster, useUpdateAssetMaster } from "./Master/AssetMaster/Hooks";
import TicketModulePagination from "./Ticket/Common/TicketModulePagination";

interface CustomerProfileAssetsProps {
  customerId: string | number;
}

type AssetRecord = Record<string, unknown>;
const getValue = (record: unknown, keys: string[]) => {
  if (!record || typeof record !== "object") return "";
  const source = record as AssetRecord;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") return source[key];
  }
  const matchedKey = Object.keys(source).find((key) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
  );
  return matchedKey ? source[matchedKey] : "";
};

const display = (value: unknown, fallback = "N/A") =>
  String(value ?? "").trim() || fallback;

const toBoolean = (value: unknown) =>
  value === true || value === 1 || ["true", "1", "yes", "y", "t"].includes(String(value ?? "").trim().toLowerCase());

const getAssetValue = (record: unknown, keys: string[]) => {
  const directValue = getValue(record, keys);
  if (directValue !== "") return directValue;
  if (!record || typeof record !== "object") return "";
  const source = record as AssetRecord;
  for (const nested of [source.raw, source.asset, source.Asset, source.data]) {
    const nestedValue = getValue(nested, keys);
    if (nestedValue !== "") return nestedValue;
  }
  return "";
};

const toDateInputValue = (value: unknown) => {
  const source = display(value, "");
  if (!source) return "";
  const match = source.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (match) return `${match[1].padStart(2, "0")}/${match[2].padStart(2, "0")}/${match[3]}`;
  const isoMatch = source.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) return `${isoMatch[3].padStart(2, "0")}/${isoMatch[2].padStart(2, "0")}/${isoMatch[1]}`;
  return source;
};

const toApiDateValue = (value?: string) => {
  const source = value?.trim();
  if (!source) return null;
  const match = source.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  return match ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}` : source;
};

const extractAssetRows = (response: unknown) => {
  if (!response || typeof response !== "object") return extractList(response);
  const source = response as AssetRecord;
  const data = source.data as AssetRecord | undefined;
  const messageData = source.message as AssetRecord | undefined;
  const result = source.result as AssetRecord | undefined;
  const candidates = [
    response,
    source.AssetList,
    source.assetList,
    data?.AssetList,
    data?.assetList,
    messageData?.AssetList,
    messageData?.assetList,
    result?.AssetList,
    result?.assetList,
    data,
  ];

  for (const candidate of candidates) {
    const rows = extractList(candidate);
    if (rows.length) return rows;
  }
  return [];
};

const toOptions = (response: unknown, valueKeys: string[], labelKeys: string[]) =>
  extractList(response).map((item: unknown, index: number) => ({
    value: String(getValue(item, valueKeys) || index),
    label: display(getValue(item, labelKeys)),
  }));

const CustomerProfileAssets = ({ customerId }: CustomerProfileAssetsProps) => {
  const [form] = Form.useForm<CustomerAssetFormValues>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [assetOpen, setAssetOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetRecord | null>(null);
  const [drawerMode, setDrawerMode] = useState<CustomerAssetDrawerMode>("add");

  const payload = useMemo(() => ({
    ...getRequestPayload(),
    nCustomerId: customerId,
    CustomerId: customerId,
    customerId,
    pageNumber: 1,
    pageSize: 1000,
  }), [customerId]);

  const assetQuery = useGetCustomerWiseAssets(payload, Boolean(customerId));
  const departmentQuery = useGetCustomerAssetDepartments(payload);
  const brandQuery = useGetCustomerBrandOptions(payload);
  const saveAsset = useSaveAssetMaster();
  const updateAsset = useUpdateAssetMaster();
  const deleteAsset = useDeleteAssetMaster();

  const departmentOptions = useMemo(() => toOptions(
    departmentQuery.data,
    ["nDepartmentId", "DepartmentId", "id"],
    ["cDepartmentName", "DepartmentName", "name"],
  ), [departmentQuery.data]);
  const brandOptions = useMemo(() => toOptions(
    brandQuery.data,
    ["nBrandId", "BrandId", "id"],
    ["cBrandName", "BrandName", "name"],
  ), [brandQuery.data]);

  const rows = useMemo(() => extractAssetRows(assetQuery.data), [assetQuery.data]);
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row: unknown) => [
      getValue(row, ["cAssetName", "cAssetMasterName", "AssetName", "name"]),
      getValue(row, ["cAssetShName", "cAssetMasterShName", "ShortName", "shortName"]),
      getValue(row, ["cDescription", "cAssetDescription", "Description"]),
    ].join(" ").toLowerCase().includes(term));
  }, [rows, search]);

  const total = filteredRows.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openAssetMaster = () => {
    setEditingAsset(null);
    setDrawerMode("add");
    form.resetFields();
    form.setFieldsValue({ amc: false, warranty: false });
    setAssetOpen(true);
  };

  const openEditAsset = (row: unknown) => {
    const asset = row as AssetRecord;
    const departmentId = String(getValue(asset, ["nDepartmentId", "DepartmentId", "departmentId"]) || "");
    const departmentName = display(getValue(asset, ["cDepartmentName", "DepartmentName", "department"]), "");
    const brandId = String(getValue(asset, ["nBrandId", "BrandId", "brandId"]) || "");
    const brandName = display(getValue(asset, ["cBrandName", "BrandName", "brand"]), "");
    setEditingAsset(asset);
    setDrawerMode("view");
    form.setFieldsValue({
      name: display(getValue(asset, ["cAssetName", "cAssetMasterName", "AssetName", "name"]), ""),
      shortName: display(getValue(asset, ["cAssetShName", "cAssetMasterShName", "ShortName", "shortName"]), ""),
      department: departmentId || departmentOptions.find((option) => option.label === departmentName)?.value,
      brand: brandId || brandOptions.find((option) => option.label === brandName)?.value,
      description: display(getValue(asset, ["cDescription", "cAssetDescription", "Description"]), ""),
      amc: toBoolean(getAssetValue(asset, ["bAMC", "bUnderAmc", "bIsAMC", "isAMC", "underAmc", "AMC", "amc"])),
      warranty: toBoolean(getAssetValue(asset, ["bWarranty", "bUnderWarranty", "bIsWarranty", "isWarranty", "underWarranty", "Warranty", "warranty"])),
      expiryDate: toDateInputValue(getAssetValue(asset, ["dExpiryDate", "dtExpiryDate", "dAssetExpiryDate", "dAMCExpiryDate", "dWarrantyExpiryDate", "ExpiryDate", "expiryDate", "expiry_date"])),
    });
    setAssetOpen(true);
  };

  const saveAssetMaster = async () => {
    const values = await form.validateFields();
    const department = departmentOptions.find((option) => option.value === values.department);
    const brand = brandOptions.find((option) => option.value === values.brand);
    const assetId = editingAsset
      ? Number(getValue(editingAsset, ["nAssetId", "nAssetMasterId", "AssetId", "AssetMasterId", "id"])) || 0
      : 0;
    const mutation = editingAsset ? updateAsset : saveAsset;

    mutation.mutate({
      ...payload,
      nAssetId: assetId,
      nAssetMasterId: assetId,
      nCustomerId: customerId,
      CustomerId: customerId,
      nDepartmentId: Number(values.department) || 0,
      cDepartmentName: department?.label ?? "",
      nBrandId: Number(values.brand) || 0,
      cBrandName: brand?.label ?? "",
      cBrand: brand?.label ?? "",
      cAssetName: values.name.trim(),
      cAssetMasterName: values.name.trim(),
      cAssetShName: values.shortName.trim(),
      cAssetMasterShName: values.shortName.trim(),
      cDescription: values.description?.trim() ?? "",
      cAssetDescription: values.description?.trim() ?? "",
      bAMC: values.amc ?? false,
      bUnderAmc: values.amc ?? false,
      bWarranty: values.warranty ?? false,
      bUnderWarranty: values.warranty ?? false,
      dExpiryDate: toApiDateValue(values.expiryDate),
      bActive: true,
    }, {
      onSuccess: async () => {
        message.success(editingAsset ? "Asset updated successfully" : "Asset saved successfully");
        setAssetOpen(false);
        setEditingAsset(null);
        form.resetFields();
        await assetQuery.refetch();
      },
      onError: () => message.error(editingAsset ? "Unable to update asset" : "Unable to save asset"),
    });
  };

  const deleteSelectedAsset = () => {
    if (!editingAsset) return;
    const assetId = Number(getValue(editingAsset, ["nAssetId", "nAssetMasterId", "AssetId", "AssetMasterId", "id"])) || 0;
    if (!assetId || !window.confirm("Delete this asset?")) return;

    deleteAsset.mutate({ ...payload, nAssetId: assetId, nAssetMasterId: assetId }, {
      onSuccess: async () => {
        message.success("Asset deleted successfully");
        setAssetOpen(false);
        setEditingAsset(null);
        await assetQuery.refetch();
      },
      onError: () => message.error("Unable to delete asset"),
    });
  };

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden p-5">
      <div className="flex flex-none items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-medium">Assets</h2>
        <Input
          className="w-[190px]"
          style={{ width: 190, flex: "0 0 190px" }}
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Search"
          allowClear
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto border-b">
        <div className="sticky top-0 z-10 grid min-w-[650px] grid-cols-[60px_150px_150px_minmax(250px,1fr)] border-y bg-white px-3 py-3 text-xs font-medium shadow-[0_1px_0_rgba(226,232,240,1)]">
          <span>Srl</span><span>Name</span><span>Short Name</span><span>Description</span>
        </div>
        {assetQuery.isFetching ? (
          <div className="flex h-72 items-center justify-center"><Spin /></div>
        ) : visibleRows.length ? visibleRows.map((row: unknown, index: number) => (
          <button
            type="button"
            key={String(getValue(row, ["nAssetId", "nAssetMasterId", "AssetId", "id"]) || `${safePage}-${index}`)}
            className="grid min-h-[46px] w-full min-w-[650px] grid-cols-[60px_150px_150px_minmax(250px,1fr)] items-center border-b px-3 text-left text-xs hover:bg-slate-50"
            onClick={() => openEditAsset(row)}
          >
            <span>{(safePage - 1) * pageSize + index + 1}</span>
            <span>{display(getValue(row, ["cAssetName", "cAssetMasterName", "AssetName", "name"]))}</span>
            <span>{display(getValue(row, ["cAssetShName", "cAssetMasterShName", "ShortName", "shortName"]))}</span>
            <span>{display(getValue(row, ["cDescription", "cAssetDescription", "Description"]))}</span>
          </button>
        )) : (
          <div className="flex h-72 items-center justify-center"><Empty description="No data" /></div>
        )}
      </div>

      <div className="flex flex-none justify-end">
        <Button type="primary" className="min-w-[104px]" style={{ backgroundColor: "#10b981", borderColor: "#10b981" }} onClick={openAssetMaster}>Add Asset</Button>
      </div>

      {total > 0 ? (
        <TicketModulePagination
          className="w-full flex-none"
          elevated={false}
          compact
          current={safePage}
          pageSize={pageSize}
          total={total}
          onChange={(nextPage, size) => { setPage(nextPage); setPageSize(size); }}
          onShowSizeChange={(nextPage, size) => { setPage(nextPage); setPageSize(size); }}
        />
      ) : null}

      <CustomerAssetDrawer
        open={assetOpen}
        mode={drawerMode}
        form={form}
        departmentOptions={departmentOptions}
        brandOptions={brandOptions}
        saving={saveAsset.isPending || updateAsset.isPending}
        deleting={deleteAsset.isPending}
        onClose={() => { setAssetOpen(false); setEditingAsset(null); }}
        onEdit={() => setDrawerMode("edit")}
        onDelete={deleteSelectedAsset}
        onSave={saveAssetMaster}
      />
    </section>
  );
};

export default CustomerProfileAssets;
