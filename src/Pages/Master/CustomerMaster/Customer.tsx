import { useMemo } from "react";
import dayjs from "dayjs";

import SimpleMasterList from "../Common/SimpleMasterList";

import type {
  SimpleMasterRow,
} from "../Common/SimpleMasterUtils";

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
    index + 1,

  key:
    item?.nCustomerId ??
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
    row?.raw?.assets ?? [],

  cLocation:
    row?.raw?.cLocation ?? "",

  cLattitude:
    row?.raw?.cLattitude ?? "",

  cLongitude:
    row?.raw?.cLongitude ?? "",

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




// SAVE / UPDATE PAYLOAD

const buildCustomerPayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => ({
  nCustomerId:
    selectedRow?.id,

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
      ? dayjs(values.expiryDate).format("YYYY-MM-DD")
      : null,

  assets:
    values.assets ?? [],

  bActive:
    values.active ?? true,
});

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



      // CUSTOM DRAWER

      renderExtraFields:
        ({ form }: any) => <CustomerDrawer form={form} />, 



      // REMOVE COMMON FIELDS

      showNameField:
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
