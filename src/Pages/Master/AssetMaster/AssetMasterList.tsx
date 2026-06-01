import { useCallback, useMemo } from "react";
import { AutoComplete, Form, Input } from "antd";

import SimpleMasterList from "../Common/SimpleMasterList";

import {
  extractList,
  getSessionPayload,
} from "../Common/SimpleMasterUtils";

import type {
  SimpleMasterRow,
} from "../Common/SimpleMasterUtils";

import {
  useDeleteAssetMaster,
  useGetAssetBrandOptions,
  useGetAssetMasters,
  useGetAssetMasterSuggest,
  useSaveAssetMaster,
  useUpdateAssetMaster,
} from "./Hooks";

const getFirstValue = (
  item: any,
  keys: string[]
) =>
  keys
    .map((key) => item?.[key])
    .find(
      (value) =>
        value !== undefined &&
        value !== null &&
        String(value).trim()
    ) ?? "";

const toOptions = (
  items: any[],
  keys: string[]
) =>
  Array.from(
    new Set(
      items
        .map((item) =>
          String(
            getFirstValue(
              item,
              keys
            )
          ).trim()
        )
        .filter(Boolean)
    )
  ).map((value) => ({
    value,
  }));

const mapAssetMasterRow = (
  item: any,
  index: number
): SimpleMasterRow => ({
  id:
    item?.nAssetId ??
    item?.nAssetMasterId ??
    index + 1,

  key:
    item?.nAssetId ??
    item?.nAssetMasterId ??
    index + 1,

  srl:
    index + 1,

  name:
    item?.cAssetName ??
    item?.cAssetMasterName ??
    item?.cName ??
    "N/A",

  shortName:
    item?.cAssetShName ??
    item?.cAssetMasterShName ??
    item?.cShName ??
    "",

  brand:
    item?.cBrandName ??
    item?.cBrand ??
    item?.brandName ??
    item?.brand ??
    "",

  description:
    item?.cDescription ??
    item?.cAssetDescription ??
    "",

  active:
    item?.bActive !== false &&
    item?.bCancelled !== true,

  raw: item,
});

const buildAssetMasterFormValues = (
  row?: SimpleMasterRow | null
) => ({
  name:
    row?.name ?? "",

  shortName:
    row?.shortName ?? "",

  brand:
    row?.brand ?? "",

  description:
    row?.description ?? "",

  active:
    row?.active ?? true,
});

const buildAssetMasterPayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => ({
  nAssetId:
    selectedRow?.id,

  nAssetMasterId:
    selectedRow?.id,

  cAssetName:
    values.name,

  cAssetShName:
    values.shortName,

  cBrandName:
    values.brand,

  cBrand:
    values.brand,

  cDescription:
    values.description,

  bActive:
    values.active ?? true,
});

const AssetMasterList = () => {
  const {
    mutate: saveAssetMaster,
    isPending: isSaving,
  } = useSaveAssetMaster();

  const {
    mutate: updateAssetMaster,
    isPending: isUpdating,
  } = useUpdateAssetMaster();

  const {
    mutate: deleteAssetMaster,
  } = useDeleteAssetMaster();

  const suggestPayload = useMemo(
    () => getSessionPayload(),
    []
  );

  const {
    data: suggestData,
  } = useGetAssetMasterSuggest(
    suggestPayload
  );

  const brandPayload = useMemo(
    () => ({
      ...getSessionPayload(),
      pageNumber: 1,
      pageSize: 1000,
    }),
    []
  );

  const {
    data: brandData,
  } = useGetAssetBrandOptions(
    brandPayload
  );

  const brandOptions = useMemo(
    () =>
      toOptions(
        extractList(brandData).length
          ? extractList(brandData)
          : extractList(suggestData),
        [
          "cBrandName",
          "cBrand",
          "brandName",
          "brand",
          "name",
        ]
      ),
    [brandData, suggestData]
  );

  const renderAssetFields = useCallback(() => (
    <>
      <Form.Item
        name="name"
        label="Name"
        className="!mb-3 w-[460px]"
        rules={[
          {
            required: true,
            whitespace: true,
            message: "Please enter name",
          },
        ]}
      >
        <Input className="h-[30px]" />
      </Form.Item>

      <div className="grid grid-cols-2 gap-2">
        <Form.Item
          name="shortName"
          label="Short Name"
          className="!mb-3"
          rules={[
            {
              required: true,
              whitespace: true,
              message: "Please enter short name",
            },
          ]}
        >
          <Input className="h-[30px]" />
        </Form.Item>

        <Form.Item
          name="brand"
          label="Brand"
          className="!mb-3"
        >
          <AutoComplete
            options={
              brandOptions
            }
            filterOption={(
              inputValue,
              option
            ) =>
              String(
                option?.value ?? ""
              )
                .toLowerCase()
                .includes(
                  inputValue.toLowerCase()
                )
            }
          >
            <Input />
          </AutoComplete>
        </Form.Item>
      </div>

      <Form.Item
        name="description"
        label="Description"
        className="!mb-3"
      >
        <Input.TextArea rows={3} />
      </Form.Item>
    </>
  ), [brandOptions]);

  const listProps = useMemo(
    () => ({
      title:
        "Asset Master",

      entityName:
        "Asset",

      nameColumnTitle:
        "Asset Name",

      drawerDescription:
        "Manage shared asset catalogue entries: adding, editing, and viewing. These entries are linked to customers from the ticket flow.",

      idKey:
        "nAssetId",

      useListQuery:
        useGetAssetMasters,

      saveMutation:
        saveAssetMaster,

      updateMutation:
        updateAssetMaster,

      deleteMutation:
        deleteAssetMaster,

      isSaving:
        isSaving || isUpdating,

      mapRow:
        mapAssetMasterRow,

      buildPayload:
        buildAssetMasterPayload,

      buildFormValues:
        buildAssetMasterFormValues,

      renderExtraFields:
        renderAssetFields,

      showNameField:
        false,

      hasShortName:
        true,

      extraColumns: [
        {
          title: "Brand",

          dataIndex: "brand",

          key: "brand",
        },
      ],
    }),
    [
      deleteAssetMaster,
      isSaving,
      isUpdating,
      renderAssetFields,
      saveAssetMaster,
      updateAssetMaster,
    ]
  );

  return (
    <SimpleMasterList
      {...listProps}
    />
  );
};

export default AssetMasterList;
