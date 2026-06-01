import {
  AutoComplete,
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  message,
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
  useGetCustomerAssetDepartments,
  useGetCustomerBrandOptions,
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

const parseCoordinates = (value: string) => {
  const match = value.trim().match(
    /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/
  );

  return {
    latitude: match?.[1] ?? "",
    longitude: match?.[2] ?? "",
  };
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

  const {
    data: departmentData,
  } = useGetCustomerAssetDepartments(
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
  } = useGetCustomerBrandOptions(
    brandPayload
  );

  const assetSuggestList = useMemo(
    () => extractList(assetSuggestData),
    [assetSuggestData]
  );

  const departmentList = useMemo(
    () => extractList(departmentData),
    [departmentData]
  );

  const brandList = useMemo(
    () => extractList(brandData),
    [brandData]
  );

  const departmentOptions = useMemo(
    () =>
      toUniqueOptions(
        departmentList.length
          ? departmentList
          : assetSuggestList,
        [
          "cDepartmentName",
          "cDepartment",
          "department",
          "departmentName",
        ]
      ),
    [assetSuggestList, departmentList]
  );

  const brandOptions = useMemo(
    () =>
      toUniqueOptions(
        brandList.length
          ? brandList
          : assetSuggestList,
        [
          "cBrandName",
          "cBrand",
          "brand",
          "brandName",
        ]
      ),
    [brandList, assetSuggestList]
  );

  // LOCATION SECTION

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
    activeTab,
    setActiveTab,
  ] = useState("1");

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

  const watchedLocation =
    Form.useWatch(
      "cLocation",
      form
    );

  const watchedLatitude =
    Form.useWatch(
      "cLattitude",
      form
    );

  const watchedLongitude =
    Form.useWatch(
      "cLongitude",
      form
    );

  useEffect(() => {
    setAssetList(
      Array.isArray(watchedAssets)
        ? watchedAssets
        : []
    );
  }, [watchedAssets]);

  useEffect(() => {
    const coordinateQuery =
      watchedLatitude && watchedLongitude
        ? `${watchedLatitude},${watchedLongitude}`
        : "";
    const nextQuery =
      coordinateQuery ||
      watchedLocation ||
      defaultLocationQuery;

    setMapQuery(nextQuery);
    setLocationQuery(
      watchedLocation || coordinateQuery
    );
  }, [
    watchedLatitude,
    watchedLocation,
    watchedLongitude,
  ]);

  useEffect(() => {
    const className =
      "customer-asset-tab-active";

    document.body.classList.toggle(
      className,
      activeTab === "2"
    );

    document.documentElement.classList.toggle(
      className,
      activeTab === "2"
    );

    return () => {
      document.body.classList.remove(
        className
      );
      document.documentElement.classList.remove(
        className
      );
    };
  }, [activeTab]);

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
        className="customer-drawer-tabs"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[

          // CUSTOMER TAB

          {
            key: "1",

            label:
              "Customer Master",

            children: (
              <div className="customer-compact-form w-full pt-0">

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

                  <Form.Item
                    name="shortName"
                    label="Short Name"
                  >
                    <Input />
                  </Form.Item>

                </div>





                {/* ROW 2 */}

                <div className="grid grid-cols-[1.1fr_1.1fr] gap-2">

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

                <div className="grid grid-cols-[1.1fr_1.1fr] gap-2">

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
                    className="!mb-0"
                  >
                    <DatePicker
                      className="w-full"
                      format="DD/MM/YYYY"
                    />
                  </Form.Item>

                </div>





                {/* LOCATION */}

                <Button
                  htmlType="button"
                  block
                  className="h-9 border-blue-400 text-blue-500 rounded"
                  onClick={() =>
                    setLocationOpen(
                      (current) => !current
                    )
                  }
                >
                  + Add Location
                </Button>

                {locationOpen && (
                  <div className="mt-2 space-y-2">
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

                    <div className="h-[180px] overflow-hidden rounded border border-slate-200">
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
                      className="h-8"
                      onClick={() => {
                        const selectedLocation =
                          locationQuery.trim() ||
                          mapQuery;
                        const coordinates =
                          parseCoordinates(
                            selectedLocation
                          );

                        form.setFieldsValue({
                          cLocation:
                            selectedLocation,
                          cLattitude:
                            coordinates.latitude,
                          cLongitude:
                            coordinates.longitude,
                        });

                        setLocationOpen(false);
                      }}
                    >
                      Save Location
                    </Button>
                  </div>
                )}

              </div>
            ),
          },





          // ASSET TAB

          {
            key: "2",

            label:
              "Asset",

            children: (
              <div className="asset-tab-content w-full min-w-full space-y-3">

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

                <Button
                  htmlType="button"
                  block
                  className="h-9 w-full border-blue-400 text-blue-500 rounded"
                  onClick={() =>
                    setShowAssetForm(true)
                  }
                >
                  + Link Asset
                </Button>






                {/* FORM */}

                {showAssetForm && (

                  <div className="mt-20 bg-slate-100 px-5 py-4">

                    {/* HEADER */}

                    <div className="mb-2 flex items-center justify-between">

                      <h2 className="text-lg font-semibold">
                        Asset
                      </h2>

                      <button
                        type="button"
                        className="text-2xl leading-none"
                        onClick={() =>
                          setShowAssetForm(false)
                        }
                      >
                        ×
                      </button>

                    </div>





                    <div className="asset-compact-form">

                      {/* NAME */}

                      <Form.Item
                        label="Name"
                        className="!mb-1"
                      >
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

                      <div className="grid grid-cols-2 gap-2">

                        <Form.Item
                          label="Short Name"
                          className="!mb-1"
                        >
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

                        <Form.Item
                          label="Department"
                          className="!mb-1"
                        >
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
                            <Input
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

                        <Form.Item
                          label="Brand"
                          className="!mb-1"
                        >
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
                            <Input
                              suffix={
                                <span className="text-lg leading-none text-slate-600">
                                  &gt;
                                </span>
                              }
                            />
                          </AutoComplete>
                        </Form.Item>

                        <Form.Item
                          label="Serial No"
                          className="!mb-1"
                        >
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

                      <Form.Item
                        label="Description"
                        className="!mb-2"
                      >
                        <Input.TextArea
                          rows={3}
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

                      <div className="grid grid-cols-[66px_88px_180px] items-end gap-3">

                        <Checkbox
                          checked={
                            assetValues.amc
                          }
                          onChange={(event) =>
                            setAssetValues(
                              (current: any) => ({
                                ...current,
                                amc:
                                  event.target.checked,
                                warranty:
                                  event.target.checked
                                    ? false
                                    : current.warranty,
                              })
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
                            setAssetValues(
                              (current: any) => ({
                                ...current,
                                warranty:
                                  event.target.checked,
                                amc:
                                  event.target.checked
                                    ? false
                                    : current.amc,
                              })
                            )
                          }
                        >
                          Warranty
                        </Checkbox>

                        <Form.Item
                          label="Expiry Date"
                          className="!mb-0"
                        >
                          <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY"
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
                        className="mt-4 h-8 bg-black px-5 text-white border-black hover:!bg-black hover:!text-white"
                        onClick={handleAssetSave}
                      >
                        Save
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
    </>
  );
};

export default CustomerDrawer;
