import {
  CloseOutlined,
  DeleteOutlined,
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
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EmailIcon from "../../../assets/icons/email-icon.svg";
import mobileIcon from "../../../assets/icons/mobileicon.svg";
import { ticketApis } from "../../../Axios/TicketsApi";

import { useTicketAttachments } from "../../../Hooks/Ticket/useTicketAttachments";
import { useTicketMutations } from "../../../Hooks/Ticket/useTicketMutations";
import { useGetGroupDropdown } from "../../Master/AgentGroup/Hooks";
import { useSaveAssetMaster } from "../../Master/AssetMaster/Hooks";
import CustomerDrawer from "../../Master/CustomerMaster/CustomerDrawer";
import {
  useGetCustomerAssetDepartments,
  useGetCustomerBrandOptions,
  useGetCustomerWiseAssets,
  useGetCustomerDropDown,
  useSaveCustomer,
} from "../../Master/CustomerMaster/Hooks";
import { useGetParts } from "../../Master/Parts/Hooks";
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
  const location = useLocation();
  const [form] = Form.useForm();
  const [customerForm] = Form.useForm();
  const [assetForm] = Form.useForm();
  const [customerOpen, setCustomerOpen] =
    useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] =
    useState(false);
  const [customerDropdownOpen, setCustomerDropdownOpen] =
    useState(false);
  const [customerSearch, setCustomerSearch] =
    useState("");
  const [assetPickerOpen, setAssetPickerOpen] =
    useState(false);
  const [assetDropdownOpen, setAssetDropdownOpen] =
    useState(false);
  const [assetSearch, setAssetSearch] =
    useState("");
  const [partsSearch, setPartsSearch] =
    useState("");
  const [assetDepartment, setAssetDepartment] =
    useState("All");
  const [assetBrand, setAssetBrand] =
    useState("All");
  const [carryOpen, setCarryOpen] =
    useState(false);
  const [carryActiveTab, setCarryActiveTab] =
    useState<"asset" | "parts">("asset");
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
  const [editorMode, setEditorMode] = useState<
    "free" | "square"
  >("free");
  const editorCanvasRef =
    useRef<HTMLCanvasElement | null>(null);
  const editorSourceUrlRef = useRef("");
  const editorDrawingRef = useRef(false);
  const editorStartRef = useRef<{
    x: number;
    y: number;
  } | null>(null);
  const editorSnapshotRef = useRef<ImageData | null>(
    null
  );
  const editorPointerIdRef = useRef<number | null>(null);

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

  const partsPayload = useMemo(
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
    useGetCustomerDropDown(sessionPayload);
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
  const {
    data: partsData,
    isFetching: isFetchingParts,
  } = useGetParts(partsPayload, carryOpen && !!selectedCustomerId);

  const customers = useMemo(
    () => extractList(customerData),
    [customerData]
  );
  const customerOptions = useMemo(
    () =>
      customers.map((customer: any, index: number) => {
        const name =
          getFirstValue(customer, [
            "cCustomerName",
            "CustomerName",
            "name",
          ]) || `Customer ${index + 1}`;
        const id =
          getFirstValue(customer, [
            "nCustomerId",
            "id",
          ]) || index + 1;

        return {
          label: name,
          value: id,
          customer,
        };
      }),
    [customers]
  );
  const customerLookup = useMemo(
    () =>
      new Map(
        customerOptions.map((option) => [
          String(option.value),
          option.customer,
        ])
      ),
    [customerOptions]
  );
  const selectedCustomerName = useMemo(() => {
    if (!selectedCustomerId) return "";

    const customer = customerLookup.get(
      String(selectedCustomerId)
    );

    return (
      getFirstValue(customer, [
        "cCustomerName",
        "CustomerName",
        "name",
      ]) || ""
    );
  }, [customerLookup, selectedCustomerId]);
  const filteredCustomers = useMemo(() => {
    const search = customerSearch.trim().toLowerCase();
    if (!search) return customers;

    return customers.filter((customer: any, index: number) => {
      const name =
        getFirstValue(customer, [
          "cCustomerName",
          "CustomerName",
          "name",
        ]) || `Customer ${index + 1}`;
      const id =
        getFirstValue(customer, [
          "nCustomerId",
          "id",
        ]) || index + 1;
      const email = getFirstValue(customer, [
        "cEmail",
        "email",
      ]);
      const phone = getFirstValue(customer, [
        "cMobileNo",
        "cPhoneNo",
        "mobile",
        "phone",
      ]);

      return [name, id, email, phone]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(search)
        );
    });
  }, [customerSearch, customers]);

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

  useEffect(() => {
    if (groupOptions.length > 0 && !form.getFieldValue("Group")) {
      form.setFieldValue("Group", groupOptions[0].value);
    }
  }, [form, groupOptions]);

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
  const partsList = useMemo(
    () => extractList(partsData),
    [partsData]
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

  const filteredParts = useMemo(() => {
    const search = partsSearch.trim().toLowerCase();

    if (!search) return partsList;

    return partsList.filter((part: any) => {
      const partName = getFirstValue(part, [
        "cPartName",
        "PartName",
        "name",
        "partName",
      ]);
      const description = getFirstValue(part, [
        "cPartDescription",
        "PartDescription",
        "description",
      ]);
      const shortName = getFirstValue(part, [
        "cPartShName",
        "nPartShName",
        "shortName",
      ]);

      return [partName, description, shortName]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [partsList, partsSearch]);

  const assetNameValue = Form.useWatch("AssetName", form);
  const filteredAssetDropdownItems = useMemo(() => {
    const query = String(assetNameValue ?? "")
      .trim()
      .toLowerCase();

    if (!selectedCustomerId) {
      return [];
    }

    if (!query) {
      return customerAssets;
    }

    return customerAssets.filter((asset: any) => {
      const assetName = getFirstValue(asset, [
        "cAssetName",
        "cAssetMasterName",
        "AssetName",
        "assetName",
        "name",
      ]);
      const serialNo = getFirstValue(asset, [
        "cSerialNo",
        "SerialNo",
        "serialNo",
      ]);
      const department = getFirstValue(asset, [
        "nDepartmentId",
        "cDepartmentName",
        "DepartmentName",
        "department",
      ]);
      const brand = getFirstValue(asset, [
        "nBrandId",
        "cBrandName",
        "BrandName",
        "brand",
      ]);

      return [assetName, serialNo, department, brand]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [assetNameValue, customerAssets, selectedCustomerId]);

  const handleAssetSelect = (
    assetId: any,
    assetName: string
  ) => {
    form.setFieldsValue({
      AssetId: assetId,
      AssetName: assetName,
    });
    setAssetDropdownOpen(false);
  };

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
        bUnderAmc: values.amc,
        bWarranty: values.warranty,
        bUnderWarranty: values.warranty,
        dExpiryDate:
          values.expiryDate?.format?.(
            "YYYY-MM-DD"
          ) ?? values.expiryDate,
        bActive: true,
      } as any,
      {
        onSuccess: (response: any) => {
          const savedAssetId = getFirstValue(response, [
            "nAssetId",
            "AssetId",
            "id",
            "assetId",
          ]);

          message.success("Asset saved");
          form.setFieldsValue({
            AssetId: savedAssetId,
            AssetName: values.assetName,
          });
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

  const handleCustomerSelect = (value: any) => {
    if (!value) {
      form.setFieldsValue({
        CustomerId: undefined,
        ContactPerson: undefined,
        ContactNo: undefined,
        Email: undefined,
      });
      return;
    }

    const customer = customerLookup.get(String(value));
    if (!customer) {
      form.setFieldsValue({
        CustomerId: value,
      });
      return;
    }

    const email = getFirstValue(customer, [
      "cEmail",
      "email",
    ]);
    const phone = getFirstValue(customer, [
      "cMobileNo",
      "cPhoneNo",
      "mobile",
      "phone",
    ]);

    form.setFieldsValue({
      CustomerId: value,
      ContactPerson: getFirstValue(customer, [
        "cContactPerson",
        "contactPerson",
      ]),
      ContactNo: phone,
      Email: email,
    });
  };

  const openCustomerTickets = async (
    customerId: any,
    customerName?: string
  ) => {
    try {
      const response = await ticketApis.customerWiseActiveTicketList({
        ...sessionPayload,
        CustomerId: customerId,
        customerId,
        nCustomerId: customerId,
        CustomerName: customerName ?? selectedCustomerName,
        cCustomerName: customerName ?? selectedCustomerName,
        pageNumber: 1,
        pageSize: 1000,
      });

      const rows = extractList(response);

      if (!rows.length) {
        message.info("No active tickets found for this customer");
        return;
      }

      navigate("/tickets/customertickets", {
        state: {
          customerId,
          customerName: customerName ?? selectedCustomerName,
          ticketRows: rows,
          draftValues: form.getFieldsValue(true),
          returnTo: `${location.pathname}${location.search}`,
        },
      });
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load customer tickets"
      );
    }
  };

  return (
    <div className="ticket-create-shell flex-1 bg-white">
      <div className="ticket-create-header text-[18px] font-semibold leading-none">
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
          CustomerId: initialValues?.CustomerId,
          ...initialValues,
          OnsiteRequired: initialValues?.OnsiteRequired ?? false,
        }}
        className="ticket-create-form"
        onFinish={handleSubmit}
      >
        <div className="ticket-create-grid min-h-0 overflow-hidden bg-white">
          <section
            className="flex h-full min-h-0 flex-col overflow-visible border-r border-slate-200 bg-white px-4 pb-2"
          >
            <div className="-mx-4 mt-0 mb-1 w-[calc(100%+2rem)] bg-sky-50 px-4 pt-0 pb-0">
              <Form.Item
                label={
                  <span className="text-[18px] font-semibold leading-none text-slate-900">
                    Source
                  </span>
                }
                name="Source"
                className="!mt-0 !mb-0"
              >
                <Radio.Group className="source-radio-group flex flex-wrap gap-x-2 gap-y-0.5  text-[12px]">
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
            >
              <div className="relative">
                <Input
                  value={selectedCustomerName}
                  readOnly
                  placeholder="Select customer"
                  onClick={() =>
                    setCustomerDropdownOpen(true)
                  }
                  onFocus={() =>
                    setCustomerDropdownOpen(true)
                  }
                  addonAfter={
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      className="ticket-search-button !h-7 !w-9 !rounded-l-none !rounded-r-md"
                      onClick={() => {
                        setCustomerDropdownOpen(false);
                        setCustomerPickerOpen(true);
                      }}
                    />
                  }
                />

                {customerDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded border border-slate-200 bg-white shadow-lg">
                    {filteredCustomers.map(
                      (customer: any, index: number) => {
                        const name =
                          getFirstValue(customer, [
                            "cCustomerName",
                            "CustomerName",
                            "name",
                          ]) || `Customer ${index + 1}`;
                        const id =
                          getFirstValue(customer, [
                            "nCustomerId",
                            "id",
                          ]) || index + 1;

                        return (
                          <button
                            type="button"
                            key={`${id}-${index}`}
                            className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-sky-50"
                            onClick={() => {
                              handleCustomerSelect(id);
                              setCustomerDropdownOpen(false);
                              openCustomerTickets(id, name);
                            }}
                          >
                            <span className="font-medium text-slate-900">
                              {name}
                            </span>
                            
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </Form.Item>
            <Form.Item name="CustomerId" hidden>
              <Input />
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
              label={
                <div className="flex w-full items-center justify-between gap-2">
                  <span>Asset Name</span>
                  <button
                    type="button"
                    className="text-sm font-medium text-blue-600"
                    onClick={() => {
                      setAssetDropdownOpen(false);
                      setAssetPickerOpen(true);
                    }}
                  >
                    Link Asset +
                  </button>
                </div>
              }
              name="AssetName"
            >
              <div className="relative">
                <Input
                  addonAfter={
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      className="ticket-search-button !h-7 !w-9 !rounded-l-none !rounded-r-md"
                      onClick={() => {
                        setAssetDropdownOpen(false);
                        setAssetPickerOpen(true);
                      }}
                    />
                  }
                  onFocus={() => setAssetDropdownOpen(true)}
                  onClick={() => setAssetDropdownOpen(true)}
                  onChange={() => setAssetDropdownOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setAssetDropdownOpen(false);
                    }, 120);
                  }}
                />

                {assetDropdownOpen ? (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded border border-slate-200 bg-white shadow-lg">
                    {!selectedCustomerId ? (
                      <div className="px-4 py-3 text-center text-sm text-slate-500">
                        Select a customer to view assets
                      </div>
                    ) : filteredAssetDropdownItems.length ? (
                      filteredAssetDropdownItems.map(
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

                          return (
                            <button
                              type="button"
                              key={`${assetId}-${index}`}
                            className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-sky-50"
                              onMouseDown={(event) =>
                                event.preventDefault()
                              }
                              onClick={() =>
                                handleAssetSelect(assetId, assetName)
                              }
                            >
                              <span className="font-medium text-slate-900">
                                {assetName}
                              </span>
                            </button>
                          );
                        }
                      )
                    ) : (
                      <div className="px-4 py-3 text-center text-sm text-slate-500">
                        No data found
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </Form.Item>

            <Form.Item name="AssetId" hidden>
              <Input />
            </Form.Item>

            <div className="flex justify-end mb-[-4px] font-normal text-xs text-slate-500">
              <Checkbox
                checked={Boolean(form.getFieldValue("ItemTakenForRepair"))}
                onChange={(e) => {
                  form.setFieldValue(
                    "ItemTakenForRepair",
                    e.target.checked
                  );
                }}
              />
              <button
                type="button"
                className="ml-2 text-xs text-slate-600"
                onClick={() => setCarryOpen(true)}
              >
                Item Taken For Repair
              </button>
            </div>

            <Form.Item
              label="Service Type"
              name="ServiceType"
              className="!mt-[-4px]"
            >
              <Select
                suffixIcon=">"
                options={serviceTypeOptions}
              />
            </Form.Item>

            <div className="-mx-4 mt-2 mb-1 border-y border-slate-200 bg-sky-50 px-5 text-[13px]">
              <Form.Item
                label="Priority"
                name="Priority"
                className="!mb-0"
              >
                <Radio.Group className="flex flex-wrap gap-x-2 gap-y-1 ">
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

          <section className="flex h-full min-h-0 flex-col overflow-visible bg-white px-4 pb-3">
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
        onCancel={() => setCustomerPickerOpen(false)}
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search"
          className="mb-3"
          value={customerSearch}
          onChange={(event) =>
            setCustomerSearch(event.target.value)
          }
        />

        <div className="space-y-3">
          {filteredCustomers.map(
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
                    setCustomerPickerOpen(false);
                    openCustomerTickets(id, name);
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
                      <img
                        src={EmailIcon}
                        alt="Mail"
                        className="mr-2 inline-block h-4 w-4 align-middle"
                      />
                      {email}
                    </span>
                    <span>
                      <img
                        src={mobileIcon}
                        alt="Mobile"
                        className="mr-2 inline-block h-4 w-4 align-middle"
                      />
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
        footer={
          <div className="flex justify-end">
            <Button
              type="primary"
              className="bg-emerald-500 border-emerald-500 px-8 hover:!bg-emerald-600"
              onClick={() => {
                setAssetPickerOpen(false);
                setAssetOpen(true);
              }}
            >
              Add New Asset
            </Button>
          </div>
        }
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

          <div className="grid grid-cols-1 gap-3 ">
           
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
                          AssetName: assetName,
                        });
                        setAssetPickerOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                        <span className="font-medium text-slate-900">
                          {assetName}
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
          carryActiveTab === "asset" ? (
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
          ) : null
        }
        title="Carry In Service"
        width={600}
        className="carry-service-modal"
        closeIcon={<CloseOutlined />}
        onCancel={() => setCarryOpen(false)}
      >
        <Tabs
          activeKey={carryActiveTab}
          onChange={(key) =>
            setCarryActiveTab(
              key === "parts" ? "parts" : "asset"
            )
          }
          items={[
            {
              key: "asset",
              label: "Asset",
              children: (
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
                    <Select
                      placeholder="Department"
                      showSearch
                      optionFilterProp="label"
                      suffixIcon=">"
                      options={departmentOptions}
                      value={assetDepartment}
                      onChange={setAssetDepartment}
                    />

                    <Select
                      placeholder="Brand"
                      showSearch
                      optionFilterProp="label"
                      suffixIcon=">"
                      options={brandOptions}
                      value={assetBrand}
                      onChange={setAssetBrand}
                    />
                  </div>

                  {!selectedCustomerId ? (
                    <div className="py-6 text-center text-slate-500">
                      Select a customer to view assets
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
                          const brand = getFirstValue(asset, [
                            "cBrandName",
                            "BrandName",
                            "brand",
                          ]) || "-";

                          return (
                            <button
                              type="button"
                              key={`${assetId}-${index}`}
                              className="w-full rounded border border-sky-100 bg-white px-3 py-2 text-left text-sm hover:border-sky-300 hover:bg-sky-50"
                              onClick={() => {
                                handleAssetSelect(assetId, assetName);
                                setCarryOpen(false);
                              }}
                            >
                              <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                                <span className="font-medium text-slate-900">
                                  {assetName}
                                </span>
                              </div>

                              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-600">
                                <span>Department : {department}</span>
                                <span>Brand : {brand}</span>
                              </div>
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
              ),
            },
            {
              key: "parts",
              label: "Parts",
              children: (
                <div className="space-y-3">
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search"
                    value={partsSearch}
                    onChange={(event) =>
                      setPartsSearch(event.target.value)
                    }
                  />

                  {!selectedCustomerId ? (
                    <div className="py-6 text-center text-slate-500">
                      Select a customer to view parts
                    </div>
                  ) : isFetchingParts ? (
                    <div className="py-6 text-center text-slate-500">
                      Loading parts...
                    </div>
                  ) : filteredParts.length ? (
                    <div className="space-y-2">
                      {filteredParts.map(
                        (part: any, index: number) => {
                          const partName =
                            getFirstValue(part, [
                              "cPartName",
                              "PartName",
                              "name",
                              "partName",
                            ]) || "Part";
                          const description =
                            getFirstValue(part, [
                              "cPartDescription",
                              "PartDescription",
                              "description",
                            ]) || "-";

                          return (
                            <button
                              type="button"
                              key={`${partName}-${index}`}
                              className="w-full rounded border border-sky-100 bg-white px-3 py-2 text-left text-sm hover:border-sky-300 hover:bg-sky-50"
                            >
                              <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                                <span className="font-medium text-slate-900">
                                  {partName}
                                </span>
                              </div>

                              <div className="mt-2 text-xs text-slate-600">
                                <span className="font-medium text-slate-500">
                                  Description :
                                </span>{" "}
                                {description}
                              </div>
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
              ),
            },
          ]}
        />
      </Modal>

      <Modal
        open={assetOpen}
        footer={
          <div className="flex justify-end">
            <Button
              type="primary"
              loading={isSavingAsset}
              className="ticket-asset-save-btn px-8"
              onClick={saveAssetMaster}
            >
              Save
            </Button>
          </div>
        }
        title="Add Asset"
        width={500}
        className="ticket-asset-modal"
        closeIcon={<CloseOutlined />}
        onCancel={() => setAssetOpen(false)}
      >
        <Form
          form={assetForm}
          layout="vertical"
          requiredMark={false}
          initialValues={{
            amc: true,
            warranty: false,
          }}
        >
          <div className="mb-2 text-xs text-slate-600">
            Customer : {selectedCustomerName || "-"}
          </div>

          <Form.Item
            name="assetName"
            label="Name"
            className="mb-2"
          >
            <Input />
          </Form.Item>

          <div className="grid grid-cols-2 gap-2">
            <Form.Item
              name="shortName"
              label="Short Name"
              className="mb-2"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="serialNo"
              label="Serial No"
              className="mb-2"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="department"
              label="Department"
              className="mb-2"
            >
              <Select
                showSearch
                optionFilterProp="label"
                suffixIcon=">"
                options={departmentOptions}
                popupClassName="ticket-asset-select-dropdown"
              />
            </Form.Item>

            <Form.Item
              name="brand"
              label="Brand"
              className="mb-2"
            >
              <Select
                showSearch
                optionFilterProp="label"
                suffixIcon=">"
                options={brandOptions}
                popupClassName="ticket-asset-select-dropdown"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Description"
            className="mb-2"
          >
            <TextArea rows={3} />
          </Form.Item>

          <div className="grid grid-cols-[auto_auto_1fr] items-end gap-3">
            <Form.Item
              name="amc"
              valuePropName="checked"
              className="mb-0"
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
              className="mb-0"
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
              className="mb-0"
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
