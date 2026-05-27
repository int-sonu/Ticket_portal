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

import type {
  FormInstance,
} from "antd";

import {
  useMemo,
  useEffect,
  useState,
} from "react";

import {
  extractList,
  getSessionPayload,
} from "../Common/SimpleMasterUtils";

import {
  useGetAssetMasterSuggest,
} from "./Hooks";

const {
  TextArea,
  Search,
} = Input;

const defaultLocationQuery =
  "10.8505,76.2711";

type CustomerDrawerProps = {
  form: FormInstance;
};

const getFirstValue = (
  item: any,
  keys: string[]
) => {
  for (const key of keys) {
    const value = item?.[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim()
    )
      return String(value).trim();
  }

  return "";
};

const toUniqueOptions = (
  items: any[],
  keys: string[]
) => {
  const values = new Set<string>();

  items.forEach((item) => {
    const value = getFirstValue(
      item,
      keys
    );

    if (value)
      values.add(value);
  });

  return Array.from(values).map((value) => ({
    value,
  }));
};

const CustomerDrawer = ({
  form,
}: CustomerDrawerProps) => {
  const suggestPayload = useMemo(
    () => getSessionPayload(),
    []
  );

  const {
    data: assetSuggestData,
  } = useGetAssetMasterSuggest(
    suggestPayload
  );

  const assetSuggestList = useMemo(
    () => extractList(assetSuggestData),
    [assetSuggestData]
  );

  const departmentOptions = useMemo(
    () =>
      toUniqueOptions(
        assetSuggestList,
        [
          "cDepartmentName",
          "cDepartment",
          "department",
          "departmentName",
        ]
      ),
    [assetSuggestList]
  );

  const brandOptions = useMemo(
    () =>
      toUniqueOptions(
        assetSuggestList,
        [
          "cBrandName",
          "cBrand",
          "brand",
          "brandName",
        ]
      ),
    [assetSuggestList]
  );

  // LOCATION MODAL

  const [
    locationOpen,
    setLocationOpen,
  ] = useState(false);




  // ASSET FORM SHOW

  const [
    showAssetForm,
    setShowAssetForm,
  ] = useState(false);

  const [
    assetList,
    setAssetList,
  ] = useState<any[]>([]);

  const [
    assetValues,
    setAssetValues,
  ] = useState<any>({
    name: "",
    shortName: "",
    department: "",
    brand: "",
    serialNo: "",
    description: "",
    amc: false,
    warranty: false,
    expiryDate: undefined,
  });




  const [
    locationQuery,
    setLocationQuery,
  ] = useState("");

  const [
    mapQuery,
    setMapQuery,
  ] = useState(defaultLocationQuery);

  const mapUrl =
    `https://maps.google.com/maps?q=${encodeURIComponent(
      mapQuery
    )}&z=14&output=embed`;

  const watchedAssets =
    Form.useWatch(
      "assets",
      form
    );

  useEffect(() => {
    setAssetList(
      Array.isArray(watchedAssets)
        ? watchedAssets
        : []
    );
  }, [watchedAssets]);

  const handleAssetValueChange = (
    key: string,
    value: any
  ) => {
    setAssetValues(
      (current: any) => ({
        ...current,
        [key]: value,
      })
    );
  };

  const resetAssetForm = () => {
    setAssetValues({
      name: "",
      shortName: "",
      department: "",
      brand: "",
      serialNo: "",
      description: "",
      amc: false,
      warranty: false,
      expiryDate: undefined,
    });
  };

  const handleAssetSave = () => {
    const name =
      assetValues.name?.trim();

    if (!name) {
      message.error(
        "Asset name is required"
      );

      return;
    }

    const nextAssets = [
      ...assetList,
      {
        ...assetValues,
        name,
        shortName:
          assetValues.shortName?.trim() ?? "",
        department:
          assetValues.department?.trim() ?? "",
        brand:
          assetValues.brand?.trim() ?? "",
        serialNo:
          assetValues.serialNo?.trim() ?? "",
        description:
          assetValues.description?.trim() ?? "",
      },
    ];

    form.setFieldsValue({
      assets: nextAssets,
    });

    setAssetList(nextAssets);

    message.success(
      "Asset added"
    );

    resetAssetForm();
    setShowAssetForm(false);
  };





  return (
    <>

      <Tabs
        defaultActiveKey="1"
        items={[

          // CUSTOMER TAB

          {
            key: "1",

            label:
              "Customer Master",

            children: (
              <div className="pt-2 space-y-5">

                {/* ROW 1 */}

                <div className="grid grid-cols-2 gap-4">

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

                  <Form.Item
                    name="shortName"
                    label="Short Name"
                  >
                    <Input />
                  </Form.Item>

                </div>





                {/* ROW 2 */}

                <div className="grid grid-cols-2 gap-4">

                  <Form.Item
                    name="contactPerson"
                    label="Contact Person Name"
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="mobile"
                    label="Mobile"
                  >
                    <Input />
                  </Form.Item>

                </div>





                {/* ROW 3 */}

                <div className="grid grid-cols-2 gap-4">

                  <Form.Item
                    name="email"
                    label="Email"
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="gstNo"
                    label="GST Number"
                  >
                    <Input />
                  </Form.Item>

                </div>





                {/* ADDRESS */}

                <Form.Item
                  name="address"
                  label="Address"
                >
                  <TextArea rows={5} />
                </Form.Item>





                {/* AMC */}

                <div className="grid grid-cols-3 gap-4 items-end">

                  <div className="flex gap-4">

                    <Form.Item
                      name="amc"
                      valuePropName="checked"
                    >
                      <Checkbox>
                        AMC
                      </Checkbox>
                    </Form.Item>

                    <Form.Item
                      name="warranty"
                      valuePropName="checked"
                    >
                      <Checkbox>
                        Warranty
                      </Checkbox>
                    </Form.Item>

                  </div>





                  <Form.Item
                    name="expiryDate"
                    label="Expiry Date"
                  >
                    <DatePicker className="w-full" />
                  </Form.Item>

                </div>





                {/* LOCATION */}

                <Button
                  htmlType="button"
                  block
                  className="h-11 border-blue-400 text-blue-500 rounded"
                  onClick={() =>
                    setLocationOpen(true)
                  }
                >
                  + Add Location
                </Button>

              </div>
            ),
          },





          // ASSET TAB

          {
            key: "2",

            label:
              "Asset",

            children: (
              <div className="space-y-4">

                {assetList.map(
                  (
                    asset: any,
                    index: number
                  ) => (
                    <div
                      key={`${asset.name}-${index}`}
                      className="rounded border border-slate-200 px-3 py-2 text-xs text-slate-600"
                    >
                      <p className="mb-1 text-sm font-medium text-slate-900">
                        {asset.name}
                      </p>

                      <p>
                        Srl No : {asset.serialNo || "-"}
                      </p>

                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <p>
                          Department : {asset.department || "-"}
                        </p>

                        <p className="text-right">
                          Brand : {asset.brand || "-"}
                        </p>
                      </div>
                    </div>
                  )
                )}

                {/* BUTTON */}

                {!showAssetForm && (

                  <Button
                    htmlType="button"
                    block
                    className="h-11 border-blue-400 text-blue-500 rounded"
                    onClick={() =>
                      setShowAssetForm(true)
                    }
                  >
                    + Link Asset
                  </Button>

                )}






                {/* FORM */}

                {showAssetForm && (

                  <div className="rounded-lg border border-transparent p-4">

                    {/* HEADER */}

                    <div className="flex items-center justify-between mb-4">

                      <h2 className="text-2xl font-semibold">
                        Asset
                      </h2>

                      <button
                        type="button"
                        className="text-3xl leading-none"
                        onClick={() =>
                          setShowAssetForm(false)
                        }
                      >
                        ×
                      </button>

                    </div>





                    <div>

                      {/* NAME */}

                      <Form.Item label="Name">
                        <Input
                          value={
                            assetValues.name
                          }
                          onChange={(event) =>
                            handleAssetValueChange(
                              "name",
                              event.target.value
                            )
                          }
                        />
                      </Form.Item>





                      {/* ROW */}

                      <div className="grid grid-cols-2 gap-4">

                        <Form.Item label="Short Name">
                          <Input
                            value={
                              assetValues.shortName
                            }
                            onChange={(event) =>
                              handleAssetValueChange(
                                "shortName",
                                event.target.value
                              )
                            }
                          />
                        </Form.Item>

                        <Form.Item label="Department">
                          <AutoComplete
                            value={
                              assetValues.department
                            }
                            options={
                              departmentOptions
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
                            onChange={(value) =>
                              handleAssetValueChange(
                                "department",
                                value
                              )
                            }
                          >
                            <Input />
                          </AutoComplete>
                        </Form.Item>

                      </div>





                      {/* ROW */}

                      <div className="grid grid-cols-2 gap-4">

                        <Form.Item label="Brand">
                          <AutoComplete
                            value={
                              assetValues.brand
                            }
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
                            onChange={(value) =>
                              handleAssetValueChange(
                                "brand",
                                value
                              )
                            }
                          >
                            <Input />
                          </AutoComplete>
                        </Form.Item>

                        <Form.Item label="Serial No">
                          <Input
                            value={
                              assetValues.serialNo
                            }
                            onChange={(event) =>
                              handleAssetValueChange(
                                "serialNo",
                                event.target.value
                              )
                            }
                          />
                        </Form.Item>

                      </div>





                      {/* DESCRIPTION */}

                      <Form.Item label="Description">
                        <Input.TextArea
                          rows={4}
                          value={
                            assetValues.description
                          }
                          onChange={(event) =>
                            handleAssetValueChange(
                              "description",
                              event.target.value
                            )
                          }
                        />
                      </Form.Item>





                      {/* AMC */}

                      <div className="grid grid-cols-3 gap-4 items-end">

                        <div className="flex gap-4">

                          <Checkbox
                            checked={
                              assetValues.amc
                            }
                            onChange={(event) =>
                              handleAssetValueChange(
                                "amc",
                                event.target.checked
                              )
                            }
                          >
                            AMC
                          </Checkbox>

                          <Checkbox
                            checked={
                              assetValues.warranty
                            }
                            onChange={(event) =>
                              handleAssetValueChange(
                                "warranty",
                                event.target.checked
                              )
                            }
                          >
                            Warranty
                          </Checkbox>

                        </div>





                        <Form.Item label="Expiry Date">
                          <DatePicker
                            className="w-full"
                            value={
                              assetValues.expiryDate
                            }
                            onChange={(value) =>
                              handleAssetValueChange(
                                "expiryDate",
                                value
                              )
                            }
                          />
                        </Form.Item>

                      </div>





                      <Button
                        htmlType="button"
                        type="primary"
                        className="bg-blue-600 border-blue-600"
                        onClick={handleAssetSave}
                      >
                        Save Asset
                      </Button>

                    </div>

                  </div>

                )}

              </div>
            ),
          },
        ]}
      />

      <Form.Item
        name="customerCode"
        hidden
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="cLocation"
        hidden
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="cLattitude"
        hidden
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="cLongitude"
        hidden
      >
        <Input />
      </Form.Item>





      {/* LOCATION MODAL */}

      <Modal
        open={locationOpen}
        footer={null}
        zIndex={1600}
        onCancel={() =>
          setLocationOpen(false)
        }
        title="Location"
        width={800}
      >

        <div className="space-y-4">

          <Search
            allowClear
            value={locationQuery}
            placeholder="Search Location"
            enterButton="Search"
            onChange={(event) =>
              setLocationQuery(
                event.target.value
              )
            }
            onSearch={(value) =>
              setMapQuery(
                value.trim() ||
                  defaultLocationQuery
              )
            }
          />

          <div className="h-[360px] overflow-hidden rounded border border-slate-200">
            <iframe
              title="Customer Location Map"
              src={mapUrl}
              className="h-full w-full border-0"
              loading="lazy"
            />
          </div>





          <Button
            htmlType="button"
            type="primary"
            onClick={() => {
              const selectedLocation =
                locationQuery.trim() ||
                mapQuery;

              form.setFieldsValue({
                cLocation:
                  selectedLocation,
                cLattitude: "",
                cLongitude: "",
              });

              setLocationOpen(false);
            }}
          >
            Save Location
          </Button>

        </div>

      </Modal>

    </>
  );
};

export default CustomerDrawer;
