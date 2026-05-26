import { useMemo } from "react";
import { DatePicker, Form } from "antd";
import dayjs from "dayjs";

import SimpleMasterList from "../Common/SimpleMasterList";

import type { SimpleMasterRow } from "../Common/SimpleMasterUtils";

import {
  useDeleteFinancialYear,
  useGetFinancialYears,
  useSaveFinancialYear,
  useUpdateFinancialYear,
} from "./Hooks";



// TABLE DATA MAPPING

const mapFinancialYearRow = (
  item: any,
  index: number
): SimpleMasterRow => ({
  id:
    item?.nFinId ??
    index + 1,

  key:
    item?.nFinId ??
    index + 1,

  srl: index + 1,

  name:
    item?.cFinName ??
    "N/A",

  shortName:
    item?.cFinShName ?? "",

  fromDate:
    item?.dFromDate ?? "",

  toDate:
    item?.dTodate ?? "",

  active:
    item?.bActive !== false &&
    item?.bCancelled !== true,

  raw: item,
});



// SAVE / UPDATE PAYLOAD

const buildFinancialYearPayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => ({
  nFinId:
    selectedRow?.id,

  cFinName:
    values.name,

  cFinShName:
    values.shortName,

  dFromDate:
    values.fromDate ? dayjs(values.fromDate).format("YYYY-MM-DD") : null,

  dTodate:
    values.toDate ? dayjs(values.toDate).format("YYYY-MM-DD") : null,

  bActive:
    values.active ?? true,
});

const buildFinancialYearFormValues = (row?: SimpleMasterRow | null) => ({
  name: row?.name ?? "",
  shortName: row?.shortName ?? "",
  fromDate: row?.raw?.dFromDate ? dayjs(row.raw.dFromDate) : null,
  toDate: row?.raw?.dTodate ? dayjs(row.raw.dTodate) : null,
  active: row?.active ?? true,
});

const renderFinancialYearExtraFields = () => (
  <div className="mt-4 border-t border-slate-100 pt-3">
    <p className="mb-2 text-sm text-slate-500">
      Set the financial year start date and end date.
    </p>
    <div className="grid grid-cols-2 gap-3">
      <Form.Item name="fromDate" label="From Date">
        <DatePicker className="w-full" format="DD/MM/YYYY" />
      </Form.Item>
      <Form.Item name="toDate" label="To Date">
        <DatePicker className="w-full" format="DD/MM/YYYY" />
      </Form.Item>
    </div>
  </div>
);



const FinancialYear = () => {
  // SAVE

  const {
    mutate: saveFinancialYear,

    isPending: isSaving,
  } = useSaveFinancialYear();



  // UPDATE

  const {
    mutate: updateFinancialYear,

    isPending: isUpdating,
  } = useUpdateFinancialYear();



  // DELETE

  const {
    mutate: deleteFinancialYear,
  } = useDeleteFinancialYear();




  // MASTER LIST CONFIG

  const listProps = useMemo(
    () => ({
      title:
        "Financial Year Master",

      entityName:
        "Financial Year",

      nameColumnTitle:
        "Financial Year Name",

      drawerDescription:
        "This section allows you to manage Financial Year details including add, edit, delete and view.",

      idKey:
        "nFinId",

      useListQuery:
        useGetFinancialYears,

      saveMutation:
        saveFinancialYear,

      updateMutation:
        updateFinancialYear,

      deleteMutation:
        deleteFinancialYear,

      isSaving:
        isSaving || isUpdating,

      mapRow:
        mapFinancialYearRow,

      buildPayload:
        buildFinancialYearPayload,
      buildFormValues:
        buildFinancialYearFormValues,
      renderExtraFields:
        renderFinancialYearExtraFields,
    }),

    [
      deleteFinancialYear,
      isSaving,
      isUpdating,
      saveFinancialYear,
      updateFinancialYear,
    ]
  );



  return (
    <SimpleMasterList
      {...listProps}
    />
  );
};

export default FinancialYear;
