import { useMemo } from "react";
import { Form, Input } from "antd";

import SimpleMasterList from "../Common/SimpleMasterList";

import type {
  SimpleMasterRow,
} from "../Common/SimpleMasterUtils";

import {
  useDeleteCurrency,
  useGetCurrencies,
  useSaveCurrency,
  useUpdateCurrency,
} from "./Hooks";

const mapCurrencyRow = (
  item: any,
  index: number
): SimpleMasterRow => ({
  id:
    item?.nCurrencyid ??
    item?.nCurrencyId ??
    index + 1,

  key:
    item?.nCurrencyid ??
    item?.nCurrencyId ??
    index + 1,

  srl:
    index + 1,

  name:
    item?.cCurrencyName ??
    item?.cCurrName ??
    item?.cName ??
    "N/A",

  shortName:
    item?.cCurrencyCode ??
    "",

  symbol:
    item?.cSymbol ??
    item?.cCurrencySymbol ??
    item?.cCurrSymbol ??
    "",

  active:
    item?.bActive !== false &&
    item?.bCancelled !== true,

  raw: item,
});

const buildCurrencyFormValues = (
  row?: SimpleMasterRow | null
) => ({
  name:
    row?.name ?? "",

  shortName:
    row?.shortName ?? "",

  symbol:
    row?.symbol ?? "",

  active:
    row?.active ?? true,
});

const buildCurrencyPayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => ({
  nCurrencyid:
    selectedRow?.id,

  nCurrencyId:
    selectedRow?.id,

  cCurrencyName:
    values.name,

  cCurrencyCode:
    values.shortName,

  cSymbol:
    values.symbol,

  bActive:
    values.active ?? true,
});

const buildCurrencyDeletePayload = (
  record: SimpleMasterRow
) =>
  buildCurrencyPayload(
    {
      name: record.name,
      shortName: record.shortName,
      symbol: record.symbol,
      active: false,
    },
    record
  );

const renderCurrencyFields = () => (
  <>
    <Form.Item
      name="name"
      label="Name"
      rules={[
        {
          required: true,
          whitespace: true,
          message: "Please enter name",
        },
      ]}
    >
      <Input />
    </Form.Item>

    <div className="grid grid-cols-2 gap-4">
      <Form.Item
        name="shortName"
        label="Short Name"
        rules={[
          {
            required: true,
            whitespace: true,
            message: "Please enter short name",
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="symbol"
        label="Symbol"
        rules={[
          {
            required: true,
            whitespace: true,
            message: "Please enter symbol",
          },
        ]}
      >
        <Input />
      </Form.Item>
    </div>
  </>
);

const CurrencyMasterList = () => {
  const {
    mutate: saveCurrency,
    isPending: isSaving,
  } = useSaveCurrency();

  const {
    mutate: updateCurrency,
    isPending: isUpdating,
  } = useUpdateCurrency();

  const {
    mutate: deleteCurrency,
  } = useDeleteCurrency();

  const listProps = useMemo(
    () => ({
      title:
        "Currency Master",

      entityName:
        "Currency",

      nameColumnTitle:
        "Currency Name",

      drawerDescription:
        "This section allows you to manage Currencys, which includes adding, editing, and viewing.",

      idKey:
        "nCurrencyid",

      useListQuery:
        useGetCurrencies,

      saveMutation:
        saveCurrency,

      updateMutation:
        updateCurrency,

      deleteMutation:
        deleteCurrency,

      isSaving:
        isSaving || isUpdating,

      mapRow:
        mapCurrencyRow,

      buildPayload:
        buildCurrencyPayload,

      buildDeletePayload:
        buildCurrencyDeletePayload,

      buildFormValues:
        buildCurrencyFormValues,

      renderExtraFields:
        renderCurrencyFields,

      showNameField:
        false,

      hasShortName:
        true,

      extraColumns: [
        {
          title: "Symbol",

          dataIndex: "symbol",

          key: "symbol",
        },
      ],
    }),
    [
      deleteCurrency,
      isSaving,
      isUpdating,
      saveCurrency,
      updateCurrency,
    ]
  );

  return (
    <SimpleMasterList
      {...listProps}
    />
  );
};

export default CurrencyMasterList;
