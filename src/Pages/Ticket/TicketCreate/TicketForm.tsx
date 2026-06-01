import {
  CloseOutlined,
  DeleteOutlined,
  MailFilled,
  PhoneFilled,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Tabs,
  Upload,
} from "antd";
import type { UploadFile } from "antd";
import { useMemo, useState } from "react";

import { useTicketAttachments } from "../../../Hooks/Ticket/useTicketAttachments";
import { useTicketMutations } from "../../../Hooks/Ticket/useTicketMutations";
import { useGetGroupDropdown } from "../../Master/AgentGroup/Hooks";
import { useSaveAssetMaster } from "../../Master/AssetMaster/Hooks";
import CustomerDrawer from "../../Master/CustomerMaster/CustomerDrawer";
import {
  useGetCustomerAssetDepartments,
  useGetCustomerBrandOptions,
  useGetCustomers,
  useSaveCustomer,
} from "../../Master/CustomerMaster/Hooks";
import SimpleMasterDrawer from "../../Master/Common/SimpleMasterDrawer";
import {
  extractList,
  getSessionPayload,
} from "../../Master/Common/SimpleMasterUtils";
import { useGetServiceTypeDropdown } from "../../Master/ServiceType/Hooks";

const { TextArea } = Input;

type TicketFormProps = {
  initialValues?: Record<string, any>;
  isEdit?: boolean;
  ticketId?: string | number;
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
    ) {
      return String(value).trim();
    }
  }

  return "";
};

const toSelectOptions = (
  items: any[],
  labelKeys: string[],
  valueKeys = labelKeys
) =>
  items.map((item, index) => {
    const label =
      getFirstValue(item, labelKeys) ||
      `Item ${index + 1}`;
    const value =
      getFirstValue(item, valueKeys) || label;

    return { label, value };
  });

const TicketForm = ({
  initialValues,
  isEdit = false,
  ticketId,
}: TicketFormProps) => {
  const [form] = Form.useForm();
  const [customerForm] = Form.useForm();
  const [assetForm] = Form.useForm();
  const [customerOpen, setCustomerOpen] =
    useState(false);
  const [
    customerPickerOpen,
    setCustomerPickerOpen,
  ] = useState(false);
  const [assetPickerOpen, setAssetPickerOpen] =
    useState(false);
  const [carryOpen, setCarryOpen] =
    useState(false);
  const [assetOpen, setAssetOpen] =
    useState(false);
  const [fileList, setFileList] = useState<
    UploadFile[]
  >([]);
  const [previewOpen, setPreviewOpen] =
    useState(false);
  const [previewImage, setPreviewImage] =
    useState("");
  const [imageEditorOpen, setImageEditorOpen] =
    useState(false);
  const [editorImage, setEditorImage] =
    useState("");
  const [editorFile, setEditorFile] =
    useState<any>(null);

  const sessionPayload = useMemo(
    () => ({
      ...getSessionPayload(),
      pageNumber: 1,
      pageSize: 1000,
    }),
    []
  );

  const {
    createTicket,
    updateTicket,
  } = useTicketMutations();
  const { uploadTicketAttachment } =
    useTicketAttachments();
  const {
    mutate: saveCustomer,
    isPending: isSavingCustomer,
  } = useSaveCustomer();
  const {
    mutate: saveAsset,
    isPending: isSavingAsset,
  } = useSaveAssetMaster();

  const { data: customerData } =
    useGetCustomers(sessionPayload);
  const { data: groupData } =
    useGetGroupDropdown(sessionPayload);
  const { data: serviceTypeData } =
    useGetServiceTypeDropdown(sessionPayload);
  const { data: departmentData } =
    useGetCustomerAssetDepartments(
      sessionPayload
    );
  const { data: brandData } =
    useGetCustomerBrandOptions(sessionPayload);

  const customers = useMemo(
    () => extractList(customerData),
    [customerData]
  );

  const groupOptions = useMemo(
    () =>
      toSelectOptions(
        extractList(groupData),
        [
          "cAgentGroupName",
          "cGroupName",
          "GroupName",
          "name",
        ],
        [
          "nAgentGroupId",
          "nGroupId",
          "id",
          "cAgentGroupName",
          "cGroupName",
        ]
      ),
    [groupData]
  );

  const serviceTypeOptions = useMemo(
    () =>
      toSelectOptions(
        extractList(serviceTypeData),
        [
          "cServiceTypeName",
          "cServiceType",
          "cServiceName",
          "ServiceTypeName",
          "ServiceType",
          "name",
        ],
        [
          "nServiceTypeId",
          "ServiceTypeId",
          "id",
          "value",
          "cServiceTypeName",
        ]
      ),
    [serviceTypeData]
  );

  const departmentOptions = useMemo(
    () => [
      { label: "All", value: "All" },
      ...toSelectOptions(
        extractList(departmentData),
        [
          "cDepartmentName",
          "DepartmentName",
          "name",
        ],
        [
          "nDepartmentId",
          "id",
          "cDepartmentName",
        ]
      ),
    ],
    [departmentData]
  );

  const brandOptions = useMemo(
    () => [
      { label: "All", value: "All" },
      ...toSelectOptions(
        extractList(brandData),
        ["cBrandName", "BrandName", "name"],
        ["nBrandId", "id", "cBrandName"]
      ),
    ],
    [brandData]
  );

  const handleUpload = (file: any) => {
    setEditorFile(file);
    setEditorImage(URL.createObjectURL(file));
    setImageEditorOpen(true);

    return Upload.LIST_IGNORE;
  };

  const handleEditorSave = () => {
    if (!editorFile) return;

    const uploadFile: UploadFile = {
      uid:
        editorFile.uid ||
        `${Date.now()}-${editorFile.name}`,
      name: editorFile.name,
      status: "done",
      url: editorImage,
      thumbUrl: editorImage,
      originFileObj: editorFile,
    } as UploadFile;

    setFileList((current) => [
      ...current,
      uploadFile,
    ]);

    uploadTicketAttachment.mutate({
      ...sessionPayload,
      file: editorFile,
    } as any);

    setImageEditorOpen(false);
    setEditorFile(null);
    setEditorImage("");
  };

  const handleEditorCancel = () => {
    setImageEditorOpen(false);
    setEditorFile(null);
    setEditorImage("");
  };

  const handlePreview = async (
    file: UploadFile
  ) => {
    const source =
      file.url ||
      file.thumbUrl ||
      (file.originFileObj
        ? URL.createObjectURL(
            file.originFileObj as Blob
          )
        : "");

    if (source) {
      setPreviewImage(source);
      setPreviewOpen(true);
    }
  };

  const handleSubmit = (values: any) => {
    const payload = {
      ...sessionPayload,
      ...values,
      TicketId: ticketId,
      FollowupDate:
        values.FollowupDate?.format?.(
          "DD/MM/YYYY hh:mm A"
        ) ?? values.FollowupDate,
    };

    const mutation = isEdit
      ? updateTicket
      : createTicket;

    mutation.mutate(payload as any, {
      onSuccess: () =>
        message.success(
          isEdit
            ? "Ticket updated"
            : "Ticket created"
        ),
      onError: (error: any) =>
        message.error(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to save ticket"
        ),
    });
  };

  const saveCustomerMaster = async () => {
    const values =
      await customerForm.validateFields();

    saveCustomer(
      {
        ...sessionPayload,
        cCustomerName: values.customerName,
        cShortName: values.shortName,
        cContactPerson:
          values.contactPersonName,
        cMobileNo: values.mobile,
        cEmail: values.email,
        cGSTNo: values.gstNumber,
        cAddress: values.address,
        bAMC: values.amc,
        bWarranty: values.warranty,
        dExpiryDate:
          values.expiryDate?.format?.(
            "DD/MM/YYYY"
          ) ?? values.expiryDate,
        bActive: values.active ?? true,
      } as any,
      {
        onSuccess: () => {
          message.success("Customer saved");
          setCustomerOpen(false);
          customerForm.resetFields();
        },
        onError: (error: any) =>
          message.error(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to save customer"
          ),
      }
    );
  };

  const saveAssetMaster = async () => {
    const values =
      await assetForm.validateFields();

    saveAsset(
      {
        ...sessionPayload,
        cAssetName: values.assetName,
        cShortName: values.shortName,
        nDepartmentId: values.department,
        nBrandId: values.brand,
        cSerialNo: values.serialNo,
        cDescription: values.description,
        bAMC: values.amc,
        bWarranty: values.warranty,
        dExpiryDate:
          values.expiryDate?.format?.(
            "DD/MM/YYYY"
          ) ?? values.expiryDate,
        bActive: true,
      } as any,
      {
        onSuccess: () => {
          message.success("Asset saved");
          setAssetOpen(false);
          assetForm.resetFields();
        },
        onError: (error: any) =>
          message.error(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to save asset"
          ),
      }
    );
  };

  return (
    <div className="ticket-create-shell">
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          Source: "Direct",
          Priority: "Low",
          ...initialValues,
        }}
        className="ticket-create-form"
        onFinish={handleSubmit}
      >
        <div className="ticket-create-grid">
          <section className="ticket-create-left">
            <h2 className="mb-1 text-lg font-semibold text-black">
              Create New Ticket
            </h2>

            <div className="ticket-band !mb-1">
              <Form.Item
                label="Source"
                name="Source"
                className="!mb-0"
              >
                <Radio.Group>
                  <Radio value="Direct">
                    Direct
                  </Radio>
                </Radio.Group>
              </Form.Item>
            </div>

            <Form.Item
              label={
                <div className="flex w-full items-center justify-between">
                  <span>Customer</span>
                  <button
                    type="button"
                    className="text-sm font-medium text-sky-700"
                    onClick={() =>
                      setCustomerOpen(true)
                    }
                  >
                    Add New Customer +
                  </button>
                </div>
              }
              name="CustomerId"
              className="!mb-1"
            >
              <Input
                addonAfter={
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    className="ticket-search-button"
                    onClick={() =>
                      setCustomerPickerOpen(true)
                    }
                  />
                }
              />
            </Form.Item>

            <Form.Item
              label="Contact Person Name"
              name="ContactPerson"
              className="!mb-1"
            >
              <Input />
            </Form.Item>

            <div className="grid grid-cols-[0.7fr_1.5fr] gap-4">
              <Form.Item
                label="Phone Number"
                name="ContactNo"
                className="!mb-1"
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Email"
                name="Email"
                className="!mb-1"
              >
                <Input />
              </Form.Item>
            </div>

            <Form.Item
              label="Ticket Summary"
              name="IssueSummary"
              className="!mb-1"
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Description"
              name="Description"
              className="!mb-1"
            >
              <TextArea rows={2} />
            </Form.Item>

            <Form.Item
              label="Asset Name"
              name="AssetName"
              className="!mb-1"
            >
              <Input
                addonAfter={
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    className="ticket-search-button"
                    onClick={() =>
                      setAssetPickerOpen(true)
                    }
                  />
                }
              />
            </Form.Item>

            <div className="flex justify-end">
              <Checkbox
                checked={false}
                className="!mb-1"
                onClick={() => {
                  form.setFieldValue(
                    "ItemTakenForRepair",
                    false
                  );
                  setCarryOpen(true);
                }}
              >
                Item Taken For Repair
              </Checkbox>
            </div>

            <Form.Item
              label="Service Type"
              name="ServiceType"
              className="!mb-1"
            >
              <Select
                suffixIcon=">"
                options={serviceTypeOptions}
              />
            </Form.Item>

            <div className="ticket-band">
              <Form.Item
                label="Priority"
                name="Priority"
                className="!mb-0"
              >
                <Radio.Group>
                  {[
                    "Very Low",
                    "Low",
                    "Medium",
                    "High",
                    "Very High",
                  ].map((item) => (
                    <Radio
                      key={item}
                      value={item}
                    >
                      {item}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            </div>
          </section>

          <section className="ticket-create-right">
            <div className="ticket-followup-row">
              <Form.Item
                label="Follow up Date & Time"
                name="FollowupDate"
                className="!mb-1"
              >
                <DatePicker
                  showTime
                  needConfirm
                  inputReadOnly
                  placement="bottomLeft"
                  className="ticket-followup-picker"
                  format="DD/MM/YYYY hh:mm A"
                  popupClassName="modern-ticket-calendar"
                />
              </Form.Item>

              <Form.Item
                name="OnsiteRequired"
                valuePropName="checked"
              >
                <Checkbox>
                  Onsite Required
                </Checkbox>
              </Form.Item>
            </div>

            <Form.Item label="Group" name="Group">
              <Select
                suffixIcon=">"
                options={groupOptions}
              />
            </Form.Item>

            <Form.Item
              label="Assign To Agent"
              name="AssignToAgent"
            >
              <Select
                suffixIcon=">"
                options={[]}
                dropdownRender={() => (
                  <div className="ticket-agent-dropdown">
                    <Input
                      prefix={<SearchOutlined />}
                      placeholder="Search"
                    />

                    <div className="ticket-agent-empty">
                      No data found
                    </div>

                    <div className="flex justify-end">
                      <Button className="ticket-agent-ok">
                        Ok
                      </Button>
                    </div>
                  </div>
                )}
              />
            </Form.Item>

            <Form.Item label="Upload Files">
              <Upload
                beforeUpload={handleUpload as any}
                fileList={fileList}
                listType="picture-card"
                accept=".jpg,.jpeg,.png"
                onPreview={handlePreview}
                onRemove={(file) => {
                  setFileList((current) =>
                    current.filter(
                      (item) => item.uid !== file.uid
                    )
                  );

                  return true;
                }}
                showUploadList={{
                  showPreviewIcon: true,
                  showRemoveIcon: true,
                  removeIcon: <DeleteOutlined />,
                }}
                maxCount={5}
              >
                {fileList.length >= 5 ? null : (
                  <button
                    type="button"
                    className="ticket-upload-card"
                  >
                    <UploadOutlined />
                    <span>Upload Files</span>
                  </button>
                )}
              </Upload>

              <p className="text-right text-xs text-slate-500">
                only accept jpeg,png,jpg upto 5MB
              </p>
            </Form.Item>

            <div className="ticket-quick-call">
              <p>
                If you want to close your ticket
                now, click{" "}
                <b>Quick Call Report</b> to
                proceed.
              </p>

              <Button type="primary" block>
                Quick Call Report
              </Button>
            </div>

            <div className="ticket-right-actions">
              <Button
                type="primary"
                htmlType="submit"
                loading={
                  createTicket.isPending ||
                  updateTicket.isPending
                }
                className="ticket-right-save bg-emerald-500 border-emerald-500 hover:!bg-emerald-600"
              >
                {isEdit ? "Update" : "Save"}
              </Button>
            </div>
          </section>
        </div>
      </Form>

      <Modal
        open={previewOpen}
        footer={null}
        title="Preview"
        onCancel={() => setPreviewOpen(false)}
      >
        <img
          src={previewImage}
          alt="Upload preview"
          className="w-full rounded"
        />
      </Modal>

      <Modal
        open={imageEditorOpen}
        title="Image Editor"
        width={820}
        className="ticket-image-editor-modal"
        closeIcon={<CloseOutlined />}
        onCancel={handleEditorCancel}
        footer={
          <div className="ticket-image-editor-footer">
            <div className="ticket-image-tools">
              <Button type="primary">✎</Button>
              <Button>□</Button>
              <Button
                onClick={() => {
                  if (editorFile) {
                    setEditorImage(
                      URL.createObjectURL(editorFile)
                    );
                  }
                }}
              >
                Reset
              </Button>
            </div>

            <div className="ticket-image-actions">
              <Button onClick={handleEditorCancel}>
                Cancel
              </Button>
              <Button
                type="primary"
                className="bg-sky-500 border-sky-500"
                onClick={handleEditorSave}
              >
                Save
              </Button>
            </div>
          </div>
        }
      >
        <div className="ticket-image-editor-canvas">
          {editorImage && (
            <img
              src={editorImage}
              alt="Image editor preview"
            />
          )}
        </div>
      </Modal>

      <Modal
        open={customerPickerOpen}
        title="Customer"
        footer={null}
        width={500}
        closeIcon={<CloseOutlined />}
        className="ticket-picker-modal"
        onCancel={() =>
          setCustomerPickerOpen(false)
        }
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search"
          className="mb-3"
        />

        <div className="space-y-3">
          {customers.map(
            (customer: any, index: number) => {
              const name =
                getFirstValue(customer, [
                  "cCustomerName",
                  "CustomerName",
                  "name",
                ]) || "Customer";
              const id =
                getFirstValue(customer, [
                  "nCustomerId",
                  "id",
                ]) || index + 1;
              const email =
                getFirstValue(customer, [
                  "cEmail",
                  "email",
                ]);
              const phone =
                getFirstValue(customer, [
                  "cMobileNo",
                  "cPhoneNo",
                  "mobile",
                  "phone",
                ]);

              return (
                <button
                  type="button"
                  key={`${id}-${index}`}
                  className="ticket-customer-card"
                  onClick={() => {
                    form.setFieldsValue({
                      CustomerId: id,
                      ContactPerson:
                        getFirstValue(
                          customer,
                          [
                            "cContactPerson",
                            "contactPerson",
                          ]
                        ),
                      ContactNo: phone,
                      Email: email,
                    });
                    setCustomerPickerOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                    <span className="font-medium">
                      {name}
                    </span>
                    <span>ID :{id}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                    <span>
                      <MailFilled className="mr-2 text-black" />
                      {email || "-"}
                    </span>
                    <span>
                      <PhoneFilled className="mr-2 text-black" />
                      {phone || "-"}
                    </span>
                  </div>
                </button>
              );
            }
          )}
        </div>
      </Modal>

      <SimpleMasterDrawer
        open={customerOpen}
        title="Customer Master"
        description="This section allows you to manage customer details including add, edit, delete and view."
        viewMode={false}
        form={customerForm}
        activeValue={true}
        selectedRow={null}
        isSaving={isSavingCustomer}
        showNameField={false}
        showDescription={false}
        onClose={() => setCustomerOpen(false)}
        onEdit={() => {}}
        onDelete={() => {}}
        onSave={saveCustomerMaster}
        renderExtraFields={() => (
          <CustomerDrawer form={customerForm} />
        )}
      />

      <Modal
        open={assetPickerOpen}
        footer={null}
        title="Assets"
        width={500}
        className="ticket-picker-modal"
        closeIcon={<CloseOutlined />}
        onCancel={() => setAssetPickerOpen(false)}
      >
        <div className="space-y-3">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-slate-600">
                Department
              </label>
              <Select
                className="w-full"
                suffixIcon=">"
                options={departmentOptions}
                defaultValue="All"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600">
                Brand
              </label>
              <Select
                className="w-full"
                suffixIcon=">"
                options={brandOptions}
                defaultValue="All"
              />
            </div>
          </div>

          <div className="py-6 text-center text-slate-500">
            No data found
          </div>
        </div>
      </Modal>

      <Modal
        open={carryOpen}
        footer={
          <Button
            type="primary"
            className="bg-emerald-500 border-emerald-500 px-8 hover:!bg-emerald-600"
            onClick={() => {
              setCarryOpen(false);
              setAssetOpen(true);
            }}
          >
            Add New
          </Button>
        }
        title="Carry In Service"
        width={600}
        className="carry-service-modal"
        closeIcon={<CloseOutlined />}
        onCancel={() => setCarryOpen(false)}
      >
        <Tabs
          defaultActiveKey="asset"
          items={[
            {
              key: "asset",
              label: "Asset",
              children: (
                <div className="space-y-3">
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      placeholder="Department"
                      suffixIcon=">"
                      options={departmentOptions}
                      defaultValue="All"
                    />

                    <Select
                      placeholder="Brand"
                      suffixIcon=">"
                      options={brandOptions}
                      defaultValue="All"
                    />
                  </div>

                  <div className="py-6 text-center text-slate-500">
                    No data found
                  </div>
                </div>
              ),
            },
            {
              key: "parts",
              label: "Parts",
              children: (
                <div className="py-6 text-center text-slate-500">
                  No data found
                </div>
              ),
            },
          ]}
        />
      </Modal>

      <Modal
        open={assetOpen}
        footer={
          <Button
            type="primary"
            loading={isSavingAsset}
            className="bg-emerald-500 border-emerald-500 px-8 hover:!bg-emerald-600"
            onClick={saveAssetMaster}
          >
            Save
          </Button>
        }
        title="Asset Master"
        width={500}
        closeIcon={<CloseOutlined />}
        onCancel={() => setAssetOpen(false)}
      >
        <Form
          form={assetForm}
          layout="vertical"
          requiredMark={false}
          initialValues={{
            amc: false,
            warranty: false,
          }}
        >
          <Form.Item
            name="assetName"
            label="Name"
          >
            <Input />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="shortName"
              label="Short Name"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="department"
              label="Department"
            >
              <Select
                suffixIcon=">"
                options={departmentOptions}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="brand" label="Brand">
              <Select
                suffixIcon=">"
                options={brandOptions}
              />
            </Form.Item>

            <Form.Item
              name="serialNo"
              label="Serial No"
            >
              <Input />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} />
          </Form.Item>

          <div className="grid grid-cols-[auto_auto_1fr] items-end gap-4">
            <Form.Item
              name="amc"
              valuePropName="checked"
            >
              <Checkbox
                onChange={(event) => {
                  if (event.target.checked) {
                    assetForm.setFieldValue(
                      "warranty",
                      false
                    );
                  }
                }}
              >
                AMC
              </Checkbox>
            </Form.Item>

            <Form.Item
              name="warranty"
              valuePropName="checked"
            >
              <Checkbox
                onChange={(event) => {
                  if (event.target.checked) {
                    assetForm.setFieldValue(
                      "amc",
                      false
                    );
                  }
                }}
              >
                Warranty
              </Checkbox>
            </Form.Item>

            <Form.Item
              name="expiryDate"
              label="Expiry Date"
            >
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                popupClassName="modern-ticket-calendar"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TicketForm;
