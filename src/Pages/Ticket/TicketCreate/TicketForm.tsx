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
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useTicketAttachments } from "../../../Hooks/Ticket/useTicketAttachments";
import { useTicketMutations } from "../../../Hooks/Ticket/useTicketMutations";
import { useGetGroupDropdown } from "../../Master/AgentGroup/Hooks";
import { useSaveAssetMaster } from "../../Master/AssetMaster/Hooks";
import CustomerDrawer from "../../Master/CustomerMaster/CustomerDrawer";
import {
  useGetCustomerAssetDepartments,
  useGetCustomerBrandOptions,
  useGetCustomerWiseAssets,
  useGetCustomers,
  useSaveCustomer,
} from "../../Master/CustomerMaster/Hooks";
import SimpleMasterDrawer from "../../Master/Common/SimpleMasterDrawer";
import {
  extractList,
  getSessionPayload,
} from "../../Master/Common/SimpleMasterUtils";
import { useGetServiceTypeDropdown } from "../../Master/ServiceType/Hooks";
import { useGetTicketSourceDropdown } from "../../Master/TicketSource/Hooks";

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

const optionalText = (value: any) => {
  const text = String(value ?? "").trim();

  return text || null;
};

const formatApiDate = (value: any) =>
  value?.format?.("YYYY-MM-DD") ?? value ?? null;

const hasAssetName = (asset: any) =>
  Boolean(String(asset?.name ?? asset?.cAssetName ?? "").trim());

const getCustomerModalAssets = (assets: any[] = [], draft: any) => {
  const currentAssets = Array.isArray(assets) ? assets : [];

  if (!hasAssetName(draft)) return currentAssets;

  const editingIndex = Number(draft.editingIndex);
  const draftAsset = {
    ...draft,
    name: String(draft.name ?? draft.cAssetName ?? "").trim(),
    shortName: String(draft.shortName ?? draft.cAssetShName ?? "").trim(),
    department: String(draft.department ?? draft.cDepartmentName ?? "").trim(),
    brand: String(draft.brand ?? draft.cBrandName ?? "").trim(),
    serialNo: String(draft.serialNo ?? draft.cSerialNo ?? "").trim(),
    description: String(draft.description ?? draft.cAssetDescription ?? "").trim(),
  };

  delete draftAsset.editingIndex;

  if (Number.isInteger(editingIndex) && editingIndex >= 0) {
    return currentAssets.map((asset, index) =>
      index === editingIndex ? { ...asset, ...draftAsset } : asset,
    );
  }

  return [...currentAssets, draftAsset];
};

const buildCustomerModalAssetPayload = (assets: any[] = []) =>
  assets.map((asset) => ({
    cAssetName: asset?.name ?? asset?.cAssetName ?? "",
    cAssetShName: asset?.shortName ?? asset?.cAssetShName ?? "",
    cAssetDescription: asset?.description ?? asset?.cAssetDescription ?? "",
    nBrandId: asset?.nBrandId ?? asset?.brandId ?? asset?.BrandId,
    nDepartmentId:
      asset?.nDepartmentId ?? asset?.departmentId ?? asset?.DepartmentId,
    cSerialNo: optionalText(asset?.serialNo ?? asset?.cSerialNo),
    bUnderAmc: asset?.amc ?? asset?.bUnderAmc ?? asset?.bAMC ?? false,
    bUnderWarranty:
      asset?.warranty ?? asset?.bUnderWarranty ?? asset?.bWarranty ?? false,
    dExpiryDate: formatApiDate(asset?.expiryDate ?? asset?.dExpiryDate),
  }));

const TicketForm = ({
  initialValues,
  isEdit = false,
  ticketId,
}: TicketFormProps) => {
  const navigate = useNavigate();
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
  const [assetSearch, setAssetSearch] =
    useState("");
  const [assetDepartment, setAssetDepartment] =
    useState("All");
  const [assetBrand, setAssetBrand] =
    useState("All");
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
  const [followupPickerOpen, setFollowupPickerOpen] =
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

  const selectedCustomerId =
    Form.useWatch("CustomerId", form);

  const customerWiseAssetPayload = useMemo(
    () => ({
      ...sessionPayload,
      nCustomerId: selectedCustomerId,
      CustomerId: selectedCustomerId,
      customerId: selectedCustomerId,
      nCustId: selectedCustomerId,
      pageNumber: 1,
      pageSize: 1000,
    }),
    [selectedCustomerId, sessionPayload]
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
  const { data: ticketSourceData } =
    useGetTicketSourceDropdown(sessionPayload);
  const { data: departmentData } =
    useGetCustomerAssetDepartments(
      sessionPayload
    );
  const { data: brandData } =
    useGetCustomerBrandOptions(sessionPayload);
  const {
    data: customerWiseAssetData,
    isFetching: isFetchingCustomerAssets,
  } = useGetCustomerWiseAssets(
    customerWiseAssetPayload,
    !!selectedCustomerId
  );

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

  const ticketSourceOptions = useMemo(() => {
    const list = extractList(ticketSourceData);
    return list.map((item: any, index: number) => {
      const label =
        item?.label ??
        item?.Label ??
        item?.cTicketSourceName ??
        item?.cTicketsourceName ??
        item?.cSourceName ??
        item?.cName ??
        item?.name ??
        `Source ${index + 1}`;
      const value =
        item?.value ??
        item?.Value ??
        item?.nTicketSourceId ??
        item?.nTicketsourceId ??
        item?.nTicketsourceid ??
        item?.nTicketSourceid ??
        item?.nSourceId ??
        item?.nSourceid ??
        item?.id ??
        label;
      return { label, value };
    });
  }, [ticketSourceData]);

  const defaultSource = useMemo(() => {
    if (ticketSourceOptions.length > 0) {
      const direct = ticketSourceOptions.find(
        (opt) => String(opt.label).toLowerCase() === "direct"
      );
      return direct ? direct.value : ticketSourceOptions[0].value;
    }
    return "Direct";
  }, [ticketSourceOptions]);

  useEffect(() => {
    if (
      ticketSourceOptions.length > 0 &&
      !form.getFieldValue("Source")
    ) {
      form.setFieldValue("Source", defaultSource);
    }
  }, [defaultSource, form, ticketSourceOptions]);

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

  const customerAssets = useMemo(
    () => extractAssetList(customerWiseAssetData),
    [customerWiseAssetData]
  );

  const filteredCustomerAssets = useMemo(() => {
    const search = assetSearch.trim().toLowerCase();
    const department = String(assetDepartment ?? "");
    const brand = String(assetBrand ?? "");

    return customerAssets.filter((asset: any) => {
      const assetName = getFirstValue(asset, [
        "cAssetName",
        "cAssetMasterName",
        "AssetName",
        "assetName",
        "name",
      ]);
      const assetDepartmentText = getFirstValue(asset, [
        "nDepartmentId",
        "cDepartmentName",
        "DepartmentName",
        "department",
      ]);
      const assetBrandText = getFirstValue(asset, [
        "nBrandId",
        "cBrandName",
        "BrandName",
        "brand",
      ]);
      const serialNo = getFirstValue(asset, [
        "cSerialNo",
        "SerialNo",
        "serialNo",
      ]);
      const matchesSearch =
        !search ||
        [assetName, assetDepartmentText, assetBrandText, serialNo]
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesDepartment =
        department === "All" ||
        assetDepartmentText === department;
      const matchesBrand =
        brand === "All" || assetBrandText === brand;

      return matchesSearch && matchesDepartment && matchesBrand;
    });
  }, [
    assetBrand,
    assetDepartment,
    assetSearch,
    customerAssets,
  ]);

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
    await customerForm.validateFields();

    const values = customerForm.getFieldsValue(true);
    const assetDraft =
      (customerForm as any).__getCustomerAssetDraft?.() ??
      customerForm.getFieldValue("assetDraft");
    const assets = getCustomerModalAssets(values.assets ?? [], assetDraft);
    const assetPayload = buildCustomerModalAssetPayload(assets);

    saveCustomer(
      {
        ...sessionPayload,
        cCustomerName: values.customerName ?? values.name,
        cCustomerShName: values.shortName,
        cShortName: values.shortName,
        cCustomerCode: values.shortName,
        cContactPerson:
          values.contactPersonName ?? values.contactPerson,
        cMobile: values.mobile,
        cMobileNo: values.mobile,
        cPhoneNo: values.mobile,
        CPhoneNo: values.mobile,
        cEmail: values.email,
        cGSTNo: values.gstNumber ?? values.gstNo,
        cGstnNummber: values.gstNumber ?? values.gstNo,
        cAddress: values.address,
        bAMC: values.amc,
        bUnderAmc: values.amc,
        bWarranty: values.warranty,
        bUnderWarranty: values.warranty,
        dExpiryDate:
          values.expiryDate?.format?.(
            "YYYY-MM-DD"
          ) ?? values.expiryDate,
        AssetList: assetPayload,
        assetList: assetPayload,
        CustomerAssetList: assetPayload,
        customerAssetList: assetPayload,
        lstAsset: assetPayload,
        lstAssets: assetPayload,
        lstCustomerAsset: assetPayload,
        lstCustomerAssets: assetPayload,
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
<div className="min-h-screen bg-white">
        <div className="ticket-create-header">
        <h2>Create New Ticket</h2>
        <Button
          type="text"
          icon={<CloseOutlined className="text-lg text-slate-500" />}
          onClick={() => navigate("/tickets")}
        />
      </div>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{
          Source: initialValues?.Source ?? defaultSource,
          Priority: "Low",
          ...initialValues,
        }}
        className="ticket-create-form"
        onFinish={handleSubmit}
      >
        <div className="ticket-create-grid h-auto min-h-0 overflow-hidden bg-white">
          <section
            className="min-h-0 border-r border-slate-200 bg-white overflow-y-auto h-full px-4 pb-3 [scrollbar-width:thin] [scrollbar-color:#94a3b8_#e2e8f0] [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-[#e2e8f0] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-[#e2e8f0] [&::-webkit-scrollbar-thumb]:bg-slate-400"
          >
            <div className="-mx-4 mt-1 mb-1 border-y border-slate-200 bg-sky-50 px-4 py-2">
              <Form.Item
                label={<span className="text-[14px] font-medium text-slate-900">Source</span>}
                name="Source"
                className="!mb-0"
              >
                <Radio.Group className="flex flex-wrap gap-x-2 gap-y-0.5">
                  {ticketSourceOptions.map((opt) => (
                    <Radio key={opt.value} value={opt.value}>
                      {opt.label}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            </div>

            <Form.Item
              label={
                <div className="flex w-full items-center justify-between">
                  <span>Customer</span>
                  <button
                    type="button"
                    className="text-sm font-medium text-sky-700 cursor-pointer"
                    onClick={() =>
                      setCustomerOpen(true)
                    }
                  >
                    Add New Customer +
                  </button>
                </div>
              }
              name="CustomerId"
            >
              <Input
                onClick={() => setCustomerPickerOpen(true)}
                onFocus={() => setCustomerPickerOpen(true)}
                addonAfter={
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    className="ticket-search-button !h-7 !w-9 !rounded-l-none !rounded-r-md"
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
            >
              <Input />
            </Form.Item>

            <div className="grid grid-cols-[1fr_1.5fr] gap-4">
              <Form.Item
                label="Phone Number"
                name="ContactNo"
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Email"
                name="Email"
              >
                <Input />
              </Form.Item>
            </div>

            <Form.Item
              label="Ticket Summary"
              name="IssueSummary"
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Description"
              name="Description"
            >
              <TextArea rows={2} />
            </Form.Item>

            <Form.Item
              label="Asset Name"
              name="AssetName"
            >
              <Input
                addonAfter={
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    className="ticket-search-button !h-7 !w-9 !rounded-l-none !rounded-r-md"
                    onClick={() =>
                      setAssetPickerOpen(true)
                    }
                  />
                }
              />
            </Form.Item>

            <div className="flex justify-end mb-2">
              <Checkbox
                checked={form.getFieldValue("ItemTakenForRepair")}
                onChange={(e) => {
                  form.setFieldValue("ItemTakenForRepair", e.target.checked);
                  if (e.target.checked) {
                    setCarryOpen(true);
                  }
                }}
              >
                Item Taken For Repair
              </Checkbox>
            </div>

            <Form.Item
              label="Service Type"
              name="ServiceType"
            >
              <Select
                suffixIcon=">"
                options={serviceTypeOptions}
              />
            </Form.Item>

            <div className="-mx-4 mt-2 mb-2 border-y border-slate-200 bg-sky-50 px-4 py-2 text-[13px]">
              <Form.Item
                label="Priority"
                name="Priority"
                className="!mb-0"
              >
                <Radio.Group className="flex flex-wrap gap-x-2 gap-y-1">
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

          <section className="flex h-full flex-col overflow-y-auto bg-white px-4 pb-3">
            <div className="grid grid-cols-[minmax(190px,1fr)_auto] items-end gap-1.5">
              <Form.Item
                label="Follow up Date & Time"
                name="FollowupDate"
              >
                <DatePicker
                  showTime
                  needConfirm
                  inputReadOnly
                  open={followupPickerOpen}
                  onOpenChange={setFollowupPickerOpen}
                  placement="bottomLeft"
                  className="w-full"
                  format="DD/MM/YYYY hh:mm A"
                  popupClassName="modern-ticket-calendar"
                  panelRender={(panelNode) => (
                    <div className="ticket-followup-calendar-shell">
                      <div className="ticket-followup-calendar-title">
                        <span>Follow up Date & Time</span>
                        <button
                          type="button"
                          onClick={() => setFollowupPickerOpen(false)}
                          aria-label="Close calendar"
                        >
                          <CloseOutlined />
                        </button>
                      </div>
                      {panelNode}
                    </div>
                  )}
                />
              </Form.Item>

              <Form.Item
                name="OnsiteRequired"
                valuePropName="checked"
                className="m-0 min-h-7 self-end"
              >
                <Checkbox className="inline-flex items-center whitespace-nowrap">
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

            <Form.Item>
              <Upload
                beforeUpload={handleUpload as any}
                fileList={fileList}
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
                className="w-full"
              >
                <Button className="ticket-upload-btn flex items-center justify-center gap-2" icon={<UploadOutlined />}>
                  Upload Files
                </Button>
              </Upload>

              <p className="text-right text-xs text-slate-500 mt-1">
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
            value={assetSearch}
            onChange={(event) =>
              setAssetSearch(event.target.value)
            }
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
                value={assetDepartment}
                onChange={setAssetDepartment}
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
                value={assetBrand}
                onChange={setAssetBrand}
              />
            </div>
          </div>

          {!selectedCustomerId ? (
            <div className="py-6 text-center text-slate-500">
              Select a customer to view assets
            </div>
          ) : isFetchingCustomerAssets ? (
            <div className="py-6 text-center text-slate-500">
              Loading assets...
            </div>
          ) : filteredCustomerAssets.length ? (
            <div className="space-y-2">
              {filteredCustomerAssets.map(
                (asset: any, index: number) => {
                  const assetName =
                    getFirstValue(asset, [
                      "cAssetName",
                      "cAssetMasterName",
                      "AssetName",
                      "assetName",
                      "name",
                    ]) || "Asset";
                  const assetId =
                    getFirstValue(asset, [
                      "nAssetId",
                      "nAssetMasterId",
                      "AssetId",
                      "assetId",
                      "id",
                    ]) || assetName;
                  const department =
                    getFirstValue(asset, [
                      "cDepartmentName",
                      "DepartmentName",
                      "department",
                    ]) || "-";
                  const brand =
                    getFirstValue(asset, [
                      "cBrandName",
                      "BrandName",
                      "brand",
                    ]) || "-";
                  const serialNo = getFirstValue(asset, [
                    "cSerialNo",
                    "SerialNo",
                    "serialNo",
                  ]);

                  return (
                    <button
                      type="button"
                      key={`${assetId}-${index}`}
                      className="w-full rounded border border-sky-100 bg-white px-3 py-2 text-left text-sm hover:border-sky-300 hover:bg-sky-50"
                      onClick={() => {
                        form.setFieldsValue({
                          AssetId: assetId,
                          AssetName: assetName,
                        });
                        setAssetPickerOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                        <span className="font-medium text-slate-900">
                          {assetName}
                        </span>
                        <span className="text-xs text-slate-500">
                          ID :{assetId}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-600">
                        <span>Department : {department}</span>
                        <span>Brand : {brand}</span>
                      </div>

                      {serialNo ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Srl No : {serialNo}
                        </p>
                      ) : null}
                    </button>
                  );
                }
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-500">
              No data found
            </div>
          )}
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
