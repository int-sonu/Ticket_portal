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

import { DeleteOutlined } from "@ant-design/icons";

import { useMemo, useEffect, useState } from "react";

import type { MouseEvent } from "react";

import { extractList, getSessionPayload } from "../Common/SimpleMasterUtils";

import {
  useGetAssetMasterSuggest,
  useGetCustomerAssetDepartments,
  useGetCustomerBrandOptions,
} from "./Hooks";

const { TextArea, Search } = Input;

const defaultLocationQuery = "10.8505,76.2711";

type CustomerDrawerProps = {
  form: FormInstance;
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
  }));
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

const CustomerDrawer = ({ form }: CustomerDrawerProps) => {
  const suggestPayload = useMemo(() => getSessionPayload(), []);

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

  // LOCATION SECTION

  const [locationOpen, setLocationOpen] = useState(false);

  // ASSET FORM SHOW

  const [showAssetForm, setShowAssetForm] = useState(false);

  const [activeTab, setActiveTab] = useState("customer_details");

  const [assetList, setAssetList] = useState<any[]>([]);

  const [assetValues, setAssetValues] = useState<any>({
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

  useEffect(() => {
    setAssetList(Array.isArray(watchedAssets) ? watchedAssets : []);
  }, [watchedAssets]);

  useEffect(() => {
    const coordinateQuery = coordinateText(watchedLatitude, watchedLongitude);
    const nextQuery =
      coordinateQuery || watchedLocation || defaultLocationQuery;

    setMapQuery(nextQuery);
    setLocationQuery(watchedLocation || coordinateQuery);
    setSelectedCoordinates({
      latitude: watchedLatitude || "",
      longitude: watchedLongitude || "",
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

  const handleAssetValueChange = (key: string, value: any) => {
    setAssetValues((current: any) => ({
      ...current,
      [key]: value,
    }));
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
    const name = assetValues.name?.trim();

    if (!name) {
      message.error("Asset name is required");

      return;
    }

    const nextAssets = [
      ...assetList,
      {
        ...assetValues,
        name,
        shortName: assetValues.shortName?.trim() ?? "",
        department: assetValues.department?.trim() ?? "",
        brand: assetValues.brand?.trim() ?? "",
        serialNo: assetValues.serialNo?.trim() ?? "",
        description: assetValues.description?.trim() ?? "",
      },
    ];

    form.setFieldsValue({
      assets: nextAssets,
    });

    setAssetList(nextAssets);

    message.success("Asset added");

    resetAssetForm();
    setShowAssetForm(false);
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
                  const hasLocation = !!(
                    watchedLocation ||
                    (watchedLatitude && watchedLongitude)
                  );
                  return hasLocation ? (
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-slate-700">
                          Location Saved
                        </p>
                        <Button
                          type="primary"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            form.setFieldsValue({
                              cLocation: "",
                              cLattitude: "",
                              cLatitude: "",
                              cLongitude: "",
                            });
                            message.success("Location cleared");
                          }}
                          className="flex items-center justify-center"
                        />
                      </div>
                      <div className="relative h-[200px] overflow-hidden rounded border border-slate-200">
                        <iframe
                          title="Customer Saved Location Map"
                          src={mapUrl}
                          className="pointer-events-none h-full w-full border-0"
                          loading="lazy"
                        />
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-xs text-slate-500 truncate block">
                          {watchedLocation ||
                            `${watchedLatitude}, ${watchedLongitude}`}
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
                <Button
                  htmlType="button"
                  block
                  className="asset-link-button h-9 border-blue-400 text-blue-500 rounded"
                  onClick={() => setShowAssetForm(true)}
                >
                  + Link Asset
                </Button>

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
                        onClick={() => setShowAssetForm(false)}
                      >
                        ✕
                      </button>
                    </div>

                    <div className="asset-compact-form">
                      {/* NAME */}

                      <Form.Item label="Name" className="!mb-1">
                        <Input
                          value={assetValues.name}
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
                          onChange={(event) =>
                            setAssetValues((current: any) => ({
                              ...current,
                              amc: event.target.checked,
                              warranty: event.target.checked
                                ? false
                                : current.warranty,
                            }))
                          }
                        >
                          AMC
                        </Checkbox>

                        <Checkbox
                          checked={assetValues.warranty}
                          onChange={(event) =>
                            setAssetValues((current: any) => ({
                              ...current,
                              warranty: event.target.checked,
                              amc: event.target.checked ? false : current.amc,
                            }))
                          }
                        >
                          Warranty
                        </Checkbox>

                        <Form.Item label="Expiry Date" className="!mb-0">
                          <DatePicker
                            className="w-full"
                            format="DD/MM/YYYY"
                            value={assetValues.expiryDate}
                            onChange={(value) =>
                              handleAssetValueChange("expiryDate", value)
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

                {assetList.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {assetList.map((asset: any, index: number) => (
                      <div
                        key={`asset-${index}`}
                        className="rounded border border-slate-200 px-3 py-2 text-xs text-slate-600"
                      >
                        <p className="mb-1 text-sm font-medium text-slate-900">
                          {asset.name}
                        </p>

                        <p>Srl No : {asset.serialNo || "-"}</p>

                        <div className="mt-2 grid grid-cols-2 gap-3">
                          <p>Department : {asset.department || "-"}</p>

                          <p className="text-right h-[27px]">
                            Brand : {asset.brand || "-"}
                          </p>
                        </div>
                      </div>
                    ))}
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
        width={620}
      >
        <div className="space-y-3">
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
            className="relative h-[300px] overflow-hidden rounded border border-slate-200"
            onClick={handleMapPoint}
          >
            <iframe
              title="Customer Location Map"
              src={mapUrl}
              className="pointer-events-none h-full w-full border-0"
              loading="lazy"
            />

            <div className="pointer-events-none absolute inset-0 bg-transparent">
              <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-full rounded-full border-2 border-red-500 bg-white shadow" />
            </div>
          </div>
        </div>
      </Modal>

      <Form.Item name="customerCode" hidden>
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
