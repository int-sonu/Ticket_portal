import {
  CloseOutlined,
  DeleteOutlined,
  BorderOutlined,
  EditOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  DatePicker as AntDatePicker,
  Drawer,
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
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

import closedTicketIcon from "../../../assets/icons/closedTicketIcon.svg";
import { ticketApis } from "../../../Axios/TicketsApi";
import { useTicketAttachments } from "../../../Hooks/Ticket/useTicketAttachments";
import { useTicketMutations } from "../../../Hooks/Ticket/useTicketMutations";
import {
  useGetGroupDropdown,
} from "../../Master/AgentGroup/Hooks";
import { useGetAssignAgentList } from "../../Master/Agent/Hooks";
import { useSaveAssetMaster } from "../../Master/AssetMaster/Hooks";
import CustomerDrawer from "../../Master/CustomerMaster/CustomerDrawer";
import FollowupDateTimePicker from "../Common/FollowupDateTimePicker";
import {
  useGetCustomerAssetDepartments,
  useGetCustomerBrandOptions,
  useCheckAmcExpiry,
  useGetCustomerWiseAssets,
  useGetCustomerDropDown,
  useSaveCustomer,
} from "../../Master/CustomerMaster/Hooks";
import { useGetAssetMasterSuggest } from "../../Master/AssetMaster/Hooks";
import { useGetParts } from "../../Master/Parts/Hooks";
import SimpleMasterDrawer from "../../Master/Common/SimpleMasterDrawer";
import {
  extractList,
  getSessionPayload,
} from "../../Master/Common/SimpleMasterUtils";
import QuickCallReportSimpleModal from "../Common/QuickCallReportSimpleModal";
import { useGetServiceTypeDropdown } from "../../Master/ServiceType/Hooks";
import { useGetTicketSourceDropdown } from "../../Master/TicketSource/Hooks";
import CustomerPickerModal from "./CustomerPickerModal";
import shareIcon from "../../../assets/icons/shareIcon.svg"

dayjs.extend(customParseFormat);

const { TextArea } = Input;
type TicketFormProps = {
  initialValues?: Record<string, any>;
  isEdit?: boolean;
  ticketId?: string | number;
  followupSourceTicket?: any;
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

const isEmptySelectionValue = (value: any) => {
  const text = String(value ?? "")
    .trim()
    .toLowerCase();

  return (
    text === "" ||
    text === "nil" ||
    text === "null" ||
    text === "undefined" ||
    text === "0"
  );
};

const normalizeSelectionValue = (value: any) =>
  isEmptySelectionValue(value) ? "" : String(value).trim();

const ticketRequiredFields = [
  {
    name: "CustomerId",
    label: "Customer",
    isMissing: (value: any) =>
      !String(value ?? "").trim() || Number(value) <= 0,
  },
  {
    name: "ContactPerson",
    label: "Contact Person Name",
    isMissing: (value: any) => !String(value ?? "").trim(),
  },
  {
    name: "ContactNo",
    label: "Phone Number",
    isMissing: (value: any) => !String(value ?? "").trim(),
  },
  {
    name: "Email",
    label: "Email",
    isMissing: (value: any) => !String(value ?? "").trim(),
  },
  {
    name: "IssueSummary",
    label: "Ticket Summary",
    isMissing: (value: any) => !String(value ?? "").trim(),
  },
  {
    name: "Description",
    label: "Description",
    isMissing: (value: any) => !String(value ?? "").trim(),
  },
] as const;

const formatApiDate = (value: any) =>
  value?.format?.("YYYY-MM-DD") ?? value ?? null;

const formatRequestDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
};

const FOLLOWUP_PARSE_FORMATS = [
  "YYYY-MM-DD HH:mm:ss",
  "YYYY-MM-DD HH:mm",
  "YYYY-MM-DD",
  "DD/MM/YYYY hh:mm A",
  "DD/MM/YYYY h:mm A",
  "DD/MM/YYYY",
];

const formatFollowupDateForApi = (value: any) => {
  if (!value) {
    return "";
  }

  if (dayjs.isDayjs(value)) {
    return value.format("YYYY-MM-DD HH:mm:ss");
  }

  if (value instanceof Date) {
    return dayjs(value).format("YYYY-MM-DD HH:mm:ss");
  }

  if (typeof value === "string") {
    for (const format of FOLLOWUP_PARSE_FORMATS) {
      const parsed = dayjs(value, format, true);
      if (parsed.isValid()) {
        return parsed.format("YYYY-MM-DD HH:mm:ss");
      }
    }

    const fallback = dayjs(value);
    if (fallback.isValid()) {
      return fallback.format("YYYY-MM-DD HH:mm:ss");
    }
  }

  return String(value);
};

const PRIORITY_VALUE_MAP: Record<string, number> = {
  "Very Low": 1,
  Low: 1,
  Medium: 2,
  High: 3,
  "Very High": 4,
};

const normalizeAssignedAgentPayload = (agents: any[] = []) =>
  agents
    .map((agent: any) => ({
      nAgentId: Number(
        agent?.nAgentId ??
          agent?.agentId ??
          agent?.id ??
          agent?.value ??
          agent ??
          0
      ),
      nRole: Number(agent?.nRole ?? 0),
    }))
    .filter((agent) => agent.nAgentId > 0);

const normalizeSourceId = (
  value: any,
  options: Array<{ label: string; value: any }>
) => {
  const text = String(value ?? "").trim();

  if (!text) return 0;

  const numericValue = Number(text);
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return numericValue;
  }

  const matchedOption = options.find(
    (option) =>
      String(option.value ?? "").trim() === text ||
      String(option.label ?? "").trim().toLowerCase() ===
        text.toLowerCase()
  );

  const matchedValue = Number(matchedOption?.value ?? 0);

  return Number.isFinite(matchedValue) && matchedValue > 0
    ? matchedValue
    : 0;
};

const getOptionLabelByValue = (
  value: any,
  options: Array<{ label: string; value: any }>
) => {
  const normalizedValue = String(value ?? "").trim();

  const match = options.find(
    (option) => String(option.value ?? "").trim() === normalizedValue
  );

  return match?.label ?? normalizedValue;
};

const normalizeServiceTypeId = (
  value: any
) => {
  const numericValue = Number(
    value?.value ?? value?.id ?? value?.nServiceTypeId ?? value ?? 0
  );

  return Number.isFinite(numericValue) && numericValue > 0
    ? numericValue
    : 0;
};

const hasFutureFollowup = (value: any) => {
  if (!value) return false;

  const text = String(value).trim();
  if (!text) return false;

  const parsed = new Date(text.replace(" ", "T"));

  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.getTime() > Date.now();
};

const serializeFileMappings = (files: any[]) =>
  JSON.stringify(
    (Array.isArray(files) ? files : []).map((file, index) => ({
      uid: file?.uid ?? `file-${index}`,
      name: file?.name ?? `attachment-${index + 1}`,
      cFileName: file?.name ?? `attachment-${index + 1}`,
      cFilePath: file?.url ?? file?.thumbUrl ?? "",
      cUrl: file?.url ?? file?.thumbUrl ?? "",
      url: file?.url ?? file?.thumbUrl ?? "",
      thumbUrl: file?.thumbUrl ?? file?.url ?? "",
    }))
  );

const serializeRepairPartList = (repairParts: any[]) =>
  JSON.stringify(
    (Array.isArray(repairParts) ? repairParts : []).map((item, index) => ({
      key: item?.key ?? item?.assetId ?? item?.assetName ?? index,
      assetId: Number(item?.assetId ?? 0) || 0,
      assetName: item?.assetName ?? "",
      amc: Boolean(item?.amc),
      warranty: Boolean(item?.warranty),
      comment: item?.comment ?? "",
      files: Array.isArray(item?.files)
        ? item.files.map((file: any, fileIndex: number) => ({
            uid: file?.uid ?? `repair-${index}-file-${fileIndex}`,
            name: file?.name ?? `repair-${index + 1}-attachment-${fileIndex + 1}`,
            cFileName:
              file?.name ?? `repair-${index + 1}-attachment-${fileIndex + 1}`,
            cFilePath: file?.url ?? file?.thumbUrl ?? "",
            cUrl: file?.url ?? file?.thumbUrl ?? "",
            url: file?.url ?? file?.thumbUrl ?? "",
            thumbUrl: file?.thumbUrl ?? file?.url ?? "",
          }))
        : [],
    }))
  );

const normalizeAttachmentList = (files: any[]) =>
  (Array.isArray(files) ? files : []).map((file, index) => {
    const resolvedUrl =
      file?.cUrl ??
      file?.cFilePath ??
      file?.url ??
      file?.thumbUrl ??
      file?.FilePath ??
      file?.AttachmentPath ??
      "";

    return {
      uid: file?.uid ?? file?.nAttachementId ?? file?.AttachmentId ?? `file-${index}`,
      name: file?.name ?? file?.FileName ?? `attachment-${index + 1}`,
      cFileName: file?.cFileName ?? file?.name ?? file?.FileName ?? `attachment-${index + 1}`,
      cUrl: resolvedUrl,
      cFilePath: resolvedUrl,
      url: resolvedUrl,
      thumbUrl: resolvedUrl,
    };
  });

const pickAttachmentList = (value: any) => {
  const candidates = [
    value?.attachments,
    value?.Attachments,
    value?.TicketAttachments,
    value?.ticketAttachments,
    value?.data?.attachments,
    value?.data?.Attachments,
    value?.data?.TicketAttachments,
    value?.data?.ticketAttachments,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }

  return [];
};

const getTicketIdFromResponse = (response: any) => {
  const candidates = [
    response?.nTicketId,
    response?.TicketId,
    response?.ticketId,
    response?.ticketid,
    response?.nticketid,
    response?.nTicketNo,
    response?.TicketNo,
    response?.data?.nTicketId,
    response?.data?.TicketId,
    response?.data?.ticketId,
    response?.data?.ticketid,
    response?.data?.nticketid,
    response?.data?.nTicketNo,
    response?.data?.TicketNo,
    response?.data?.data?.nTicketId,
    response?.data?.data?.TicketId,
    response?.data?.data?.ticketId,
    response?.data?.data?.ticketid,
    response?.data?.data?.nticketid,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate ?? 0);
    if (value > 0) return value;
  }

  return undefined;
};

const resolveAttachmentBlob = async (file: UploadFile) => {
  const directBlob = file?.originFileObj;
  if (directBlob instanceof Blob) {
    return directBlob;
  }

  if (directBlob) {
    return directBlob as Blob;
  }

  const preview = String(file?.url ?? file?.thumbUrl ?? "").trim();
  if (!preview) return null;

  try {
    const response = await fetch(preview);
    if (!response.ok) return null;
    return await response.blob();
  } catch {
    return null;
  }
};

const searchOptions = (
  options: Array<{ label: string; value: any }>,
  search: string
) => {
  const term = search.trim().toLowerCase();
  if (!term) return options;
  return options.filter((option) =>
    String(option?.label ?? "")
      .toLowerCase()
      .includes(term)
  );
};

const avatarColors = [
  "#93c5fd",
  "#fde68a",
  "#fdba74",
  "#86efac",
  "#c4b5fd",
  "#f9a8d4",
];

const getAvatarColor = (_name: string, index: number) =>
  avatarColors[index % avatarColors.length];

const renderSearchPopup = (
  search: string,
  setSearch: (value: string) => void,
  placeholder = "Search"
) => (menu: any) => (
  <div className="ticket-searchable-dropdown">
    <Input
      prefix={<SearchOutlined />}
      placeholder={placeholder}
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      onMouseDown={(event) => event.preventDefault()}
    />
    {menu}
  </div>
);

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
  followupSourceTicket,
}: TicketFormProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [quickCallOpen, setQuickCallOpen] = useState(false);
  const [showFollowupBanner, setShowFollowupBanner] = useState(!!followupSourceTicket);
  const showQuickCall = !followupSourceTicket;
  const [customerForm] = Form.useForm();
  const [assetForm] = Form.useForm();
  const [customerOpen, setCustomerOpen] =
    useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] =
    useState(false);
  const [assetPickerOpen, setAssetPickerOpen] =
    useState(false);
  const [assetDropdownOpen, setAssetDropdownOpen] =
    useState(false);
  const [assetSearch, setAssetSearch] =
    useState("");
  const [assetFormDropdownOpen, setAssetFormDropdownOpen] =
    useState(false);
  const [assetFormSearch, setAssetFormSearch] =
    useState("");
  const [assetPickerTarget, setAssetPickerTarget] =
    useState<"ticket" | "asset">("ticket");
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
  const [repairAssets, setRepairAssets] =
    useState<any[]>([]);
  const [repairDetailOpen, setRepairDetailOpen] =
    useState(false);
  const [repairDraft, setRepairDraft] =
    useState<{
      assetId: string;
      assetName: string;
      amc: boolean;
      warranty: boolean;
      comment: string;
      files: UploadFile[];
      editingIndex: number | null;
    }>({
      assetId: "",
      assetName: "",
      amc: false,
      warranty: false,
      comment: "",
      files: [],
      editingIndex: null,
    });
  const [assetOpen, setAssetOpen] =
    useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>(() => {
    if (!initialValues?.files || !Array.isArray(initialValues.files)) return [];
    return initialValues.files.map((file: any, index: number) => ({
      uid: file.uid || file.nAttachementId || `file-${index}`,
      name: file.name || file.FileName || file.cFileName || `attachment-${index}`,
      status: "done",
      url: file.url || file.cUrl || file.fileUrl || "",
      thumbUrl: file.thumbUrl || file.cUrl || file.fileUrl || "",
    })) as UploadFile[];
  });
  const [previewOpen, setPreviewOpen] =
    useState(false);
  const [previewImage, setPreviewImage] =
    useState("");
  const [imageEditorOpen, setImageEditorOpen] =
    useState(false);
  const [groupSearch, setGroupSearch] =
    useState("");
  const [serviceTypeSearch, setServiceTypeSearch] =
    useState("");
  const [brandSearch, setBrandSearch] =
    useState("");
  const [departmentSearch, setDepartmentSearch] =
    useState("");
  const [assignAgentSearch, setAssignAgentSearch] =
    useState("");
  const [assignAgentDropdownOpen, setAssignAgentDropdownOpen] =
    useState(false);
  const [pendingAssignAgentIds, setPendingAssignAgentIds] =
    useState<string[]>([]);
  const [pendingLeaderAssignAgentId, setPendingLeaderAssignAgentId] =
    useState<string>("");
  const [leaderPickerOpen, setLeaderPickerOpen] =
    useState(false);
  const [assignAgentDisplayName, setAssignAgentDisplayName] =
    useState("");
  const [editorImage, setEditorImage] =
    useState("");
  const [editorFile, setEditorFile] =
    useState<any>(null);
  const [editorMode, setEditorMode] = useState<
    "brush" | "square"
  >("brush");
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
  const editorBrushLastRef = useRef<{
    x: number;
    y: number;
  } | null>(null);
  const pageTitle = followupSourceTicket
    ? "Created Ticket"
    : isEdit
      ? "Edit Ticket"
      : "Create New Ticket";
  const pageSubtitle = followupSourceTicket
    ? `Ticket Id : ${followupSourceTicket.nTicketId}, ${followupSourceTicket.cViewSummary}`
    : "";
  const followupSummaryText =
    followupSourceTicket?.summary ??
    followupSourceTicket?.cViewSummary ??
    initialValues?.IssueSummary ??
    initialValues?.TicketSummary ??
    "";
  const followupDescriptionText =
    followupSourceTicket?.description ??
    initialValues?.Description ??
    initialValues?.cDescription ??
    "";

  useEffect(() => {
    if (followupSourceTicket) {
      form.setFieldsValue({
        IssueSummary: followupSummaryText,
        Description: followupDescriptionText,
      });
    }
  }, [
    form,
    followupDescriptionText,
    followupSourceTicket,
    followupSummaryText,
  ]);

  const paintEditorCanvas = (sourceUrl: string) => {
    const canvas = editorCanvasRef.current;

    if (!canvas || !sourceUrl) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const width = canvas.clientWidth || 760;
    const height = canvas.clientHeight || 365;

    canvas.width = width;
    canvas.height = height;

    const image = new Image();

    image.onload = () => {
      const scale = Math.min(
        width / image.width,
        height / image.height
      );
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const offsetX = (width - drawWidth) / 2;
      const offsetY = (height - drawHeight) / 2;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(
        image,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
      );
    };

    image.src = sourceUrl;
  };

  const getEditorPoint = (
    event: ReactPointerEvent<HTMLCanvasElement>
  ) => {
    const canvas = editorCanvasRef.current;
    const rect = canvas?.getBoundingClientRect();

    if (!canvas || !rect) return null;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const finishEditorDrawing = () => {
    editorDrawingRef.current = false;
    editorStartRef.current = null;
    editorSnapshotRef.current = null;
    editorPointerIdRef.current = null;
    editorBrushLastRef.current = null;
  };

  const handleEditorPointerDown = (
    event: ReactPointerEvent<HTMLCanvasElement>
  ) => {
    const canvas = editorCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = getEditorPoint(event);

    if (!canvas || !ctx || !point) return;

    canvas.setPointerCapture(event.pointerId);
    editorPointerIdRef.current = event.pointerId;
    editorDrawingRef.current = true;

    if (editorMode === "square") {
      editorStartRef.current = point;
      editorSnapshotRef.current = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
      return;
    }

    editorBrushLastRef.current = point;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const handleEditorPointerMove = (
    event: ReactPointerEvent<HTMLCanvasElement>
  ) => {
    if (
      !editorDrawingRef.current ||
      editorPointerIdRef.current !== event.pointerId
    ) {
      return;
    }

    const canvas = editorCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = getEditorPoint(event);

    if (!canvas || !ctx || !point) return;

    if (editorMode === "brush") {
      const last = editorBrushLastRef.current;

      if (!last) {
        editorBrushLastRef.current = point;
        return;
      }

      ctx.save();
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.restore();
      editorBrushLastRef.current = point;
      return;
    }

    const start = editorStartRef.current;
    const snapshot = editorSnapshotRef.current;

    if (!start || !snapshot) return;

    ctx.putImageData(snapshot, 0, 0);

    const deltaX = point.x - start.x;
    const deltaY = point.y - start.y;
    const side = Math.min(Math.abs(deltaX), Math.abs(deltaY));
    const endX = start.x + (deltaX >= 0 ? side : -side);
    const endY = start.y + (deltaY >= 0 ? side : -side);
    const squareX = Math.min(start.x, endX);
    const squareY = Math.min(start.y, endY);
    const squareSize = Math.max(
      Math.abs(endX - start.x),
      Math.abs(endY - start.y)
    );

    ctx.save();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;
    ctx.strokeRect(squareX, squareY, squareSize, squareSize);
    ctx.restore();
  };

  const handleEditorPointerEnd = (
    event: ReactPointerEvent<HTMLCanvasElement>
  ) => {
    const canvas = editorCanvasRef.current;

    if (canvas && editorPointerIdRef.current === event.pointerId) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore pointer capture cleanup failures.
      }
    }

    finishEditorDrawing();
  };

  const handleEditorReset = () => {
    if (!editorSourceUrlRef.current) return;

    paintEditorCanvas(editorSourceUrlRef.current);
  };

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
  const watchedContactPerson = Form.useWatch("ContactPerson", form);
  const watchedContactNo = Form.useWatch("ContactNo", form);
  const watchedEmail = Form.useWatch("Email", form);
  const watchedIssueSummary = Form.useWatch("IssueSummary", form);
  const watchedDescription = Form.useWatch("Description", form);
  const watchedFollowupDate = Form.useWatch("FollowupDate", form);

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
    followupSave,
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
  const { mutateAsync: checkAmcExpiry } =
    useCheckAmcExpiry();

  const { data: customerData } =
    useGetCustomerDropDown(sessionPayload);
  const { data: groupData } =
    useGetGroupDropdown(sessionPayload);
  const watchedGroup = Form.useWatch("Group", form);
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
  const { data: assetMasterSuggestData } =
    useGetAssetMasterSuggest({
      ...sessionPayload,
      cSearch: assetSearch,
    });
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
  const assignAgentPayload = useMemo(
    () => ({
      ...sessionPayload,
      nGroupId: watchedGroup,
      dDate: formatRequestDate(new Date()),
    }),
    [sessionPayload, watchedGroup]
  );
  const { data: assignAgentData } =
    useGetAssignAgentList(
      assignAgentPayload,
      !!watchedGroup
    );

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
  const filteredGroupOptions = useMemo(
    () => searchOptions(groupOptions, groupSearch),
    [groupOptions, groupSearch]
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
  const filteredServiceTypeOptions = useMemo(
    () => searchOptions(serviceTypeOptions, serviceTypeSearch),
    [serviceTypeOptions, serviceTypeSearch]
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
    return undefined;
  }, [ticketSourceOptions]);

  useEffect(() => {
    if (ticketSourceOptions.length === 0 || defaultSource === undefined) {
      return;
    }

    const currentSource = form.getFieldValue("Source");
    const currentSourceId = normalizeSourceId(
      currentSource,
      ticketSourceOptions
    );

    if (currentSourceId === 0) {
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
  const filteredDepartmentOptions = useMemo(
    () => searchOptions(departmentOptions, departmentSearch),
    [departmentOptions, departmentSearch]
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
  const filteredBrandOptions = useMemo(
    () => searchOptions(brandOptions, brandSearch),
    [brandOptions, brandSearch]
  );

  const customerAssets = useMemo(
    () => extractAssetList(customerWiseAssetData),
    [customerWiseAssetData]
  );
  const assetMasterSuggestions = useMemo(
    () => extractList(assetMasterSuggestData),
    [assetMasterSuggestData]
  );
  const partsList = useMemo(
    () => extractList(partsData),
    [partsData]
  );
  const assignAgents = useMemo(
    () => extractList(assignAgentData),
    [assignAgentData]
  );
  const selectedAssignAgentId = normalizeSelectionValue(
    Form.useWatch("AssignToAgent", form)
  );
  const canSaveTicket =
    Boolean(selectedCustomerId) &&
    Boolean(watchedContactPerson?.toString().trim()) &&
    Boolean(watchedContactNo?.toString().trim()) &&
    Boolean(watchedEmail?.toString().trim()) &&
    Boolean(watchedIssueSummary?.toString().trim()) &&
    Boolean(watchedDescription?.toString().trim()) &&
    Boolean(watchedFollowupDate) &&
    Boolean(watchedGroup) &&
    Boolean(selectedAssignAgentId);
  const selectedAssignAgentName = useMemo(() => {
    if (!selectedAssignAgentId) {
      return "";
    }

    const match = assignAgents.find((agent: any) => {
      const agentId = getFirstValue(agent, [
        "nAgentId",
        "agentId",
        "id",
        "value",
      ]);

      return (
        String(agentId ?? "") ===
        String(selectedAssignAgentId)
      );
    });

    return (
      getFirstValue(match, [
        "cAgentName",
        "agentName",
        "name",
      ]) ?? ""
    );
  }, [assignAgents, selectedAssignAgentId]);
  const selectedAssignAgentDetails = useMemo(() => {
    if (!selectedAssignAgentId) {
      return [];
    }

    const match = assignAgents.find((agent: any) => {
      const agentId = getFirstValue(agent, [
        "nAgentId",
        "agentId",
        "id",
        "value",
      ]);

      return String(agentId ?? "") === String(selectedAssignAgentId);
    });

    if (!match) {
      return [
        {
          nAgentId: Number(selectedAssignAgentId),
          cAgentName: selectedAssignAgentName,
          cAgentshName: "",
          nType: 0,
        },
      ];
    }

    return [
      {
        ...match,
        nAgentId:
          getFirstValue(match, ["nAgentId", "agentId", "id", "value"]) ??
          Number(selectedAssignAgentId),
        cAgentName:
          getFirstValue(match, [
            "cAgentName",
            "agentName",
            "name",
          ]) ?? selectedAssignAgentName,
        cAgentshName: getFirstValue(match, [
          "cAgentshName",
          "shortName",
        ]) ?? "",
      },
    ];
  }, [
    assignAgents,
    selectedAssignAgentId,
    selectedAssignAgentName,
  ]);
  const pendingAssignAgentNames = useMemo(
    () =>
      pendingAssignAgentIds
        .map((id) =>
          getFirstValue(
            assignAgents.find((agent: any) => {
              const agentId = getFirstValue(agent, [
                "nAgentId",
                "agentId",
                "id",
                "value",
              ]);

              return String(agentId ?? "") === String(id);
            }),
            ["cAgentName", "agentName", "name"]
          )
        )
        .filter(Boolean)
        .join(", "),
    [assignAgents, pendingAssignAgentIds]
  );
  const activeAssignAgentIds = useMemo(
    () =>
      pendingAssignAgentIds.length
        ? pendingAssignAgentIds
        : selectedAssignAgentId
        ? [String(selectedAssignAgentId)]
        : [],
    [pendingAssignAgentIds, selectedAssignAgentId]
  );
  const openAgentTickets = (
    agentId: string | number,
    agentName: string
  ) => {
    const params = new URLSearchParams({
      agentId: String(agentId),
      agentName,
    });

    navigate(`/tickets/agenttickets?${params.toString()}`, {
      state: {
        agentId,
        agentName,
        returnTo:
          window.location.pathname + window.location.search,
      },
    });
  };

  useEffect(() => {
    if (!selectedAssignAgentId) {
      if (!pendingAssignAgentIds.length) {
        setAssignAgentDisplayName("");
      }
      return;
    }

    if (!assignAgentDisplayName) {
      setAssignAgentDisplayName(selectedAssignAgentName);
    }
  }, [
    assignAgentDisplayName,
    pendingAssignAgentIds.length,
    selectedAssignAgentId,
    selectedAssignAgentName,
  ]);
  const filteredAssignAgents = useMemo(() => {
    const search = assignAgentSearch.trim().toLowerCase();

    if (!search) return assignAgents;

    return assignAgents.filter((agent: any) => {
      const name = getFirstValue(agent, [
        "cAgentName",
        "agentName",
        "name",
      ]);
      const shortName = getFirstValue(agent, [
        "cAgentshName",
        "shortName",
      ]);
      const groupName = getFirstValue(agent, [
        "cGroupName",
        "groupName",
      ]);
      const phone = getFirstValue(agent, [
        "cPhoneNo",
        "phoneNo",
      ]);

      return [name, shortName, groupName, phone]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(search)
        );
    });
  }, [assignAgentSearch, assignAgents]);
  const filteredAssetMasters = useMemo(() => {
    const search = assetSearch.trim().toLowerCase();

    if (!search) return assetMasterSuggestions;

    return assetMasterSuggestions.filter((asset: any) => {
      const assetName = getFirstValue(asset, [
        "cAssetName",
        "cAssetMasterName",
        "AssetName",
        "assetName",
        "name",
      ]);
      const shortName = getFirstValue(asset, [
        "cAssetShName",
        "cShortName",
        "shortName",
      ]);
      const brand = getFirstValue(asset, [
        "cBrandName",
        "cBrand",
        "BrandName",
        "brand",
      ]);
      const department = getFirstValue(asset, [
        "cDepartmentName",
        "cDepartment",
        "DepartmentName",
        "department",
      ]);

      return [assetName, shortName, brand, department]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [assetMasterSuggestions, assetSearch]);

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

  const filteredAssetFormAssets = useMemo(() => {
    const search = assetFormSearch.trim().toLowerCase();

    if (!search) return filteredCustomerAssets;

    return filteredCustomerAssets.filter((asset: any) => {
      const assetName = getFirstValue(asset, [
        "cAssetName",
        "cAssetMasterName",
        "AssetName",
        "assetName",
        "name",
      ]);
      const shortName = getFirstValue(asset, [
        "cAssetShName",
        "cShortName",
        "shortName",
      ]);
      const department = getFirstValue(asset, [
        "cDepartmentName",
        "DepartmentName",
        "department",
      ]);
      const brand = getFirstValue(asset, [
        "cBrandName",
        "BrandName",
        "brand",
      ]);
      const serialNo = getFirstValue(asset, [
        "cSerialNo",
        "SerialNo",
        "serialNo",
      ]);

      return [assetName, shortName, department, brand, serialNo]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [assetFormSearch, filteredCustomerAssets]);

  const assetPickerItems = useMemo(
    () =>
      assetPickerTarget === "asset"
        ? filteredAssetMasters
        : filteredAssetMasters,
    [assetPickerTarget, filteredAssetMasters]
  );

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

  const filteredAssetDropdownItems = useMemo(() => {
    const query = String(assetSearch ?? "")
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
  }, [assetSearch, customerAssets, selectedCustomerId]);

  const handleAssetSelect = (
    assetId: any,
    assetName: string
  ) => {
    form.setFieldsValue({
      AssetId: assetId,
      AssetName: assetName,
    });
    setAssetSearch("");
    setAssetDropdownOpen(false);
  };

  const fillAssetFormFromAsset = (asset: any) => {
    const assetName =
      getFirstValue(asset, [
        "cAssetName",
        "cAssetMasterName",
        "AssetName",
        "assetName",
        "name",
      ]) || "";
    const shortName = getFirstValue(asset, [
      "cAssetShName",
      "cShortName",
      "shortName",
      "assetShortName",
    ]);
    const department = getFirstValue(asset, [
      "cDepartmentName",
      "DepartmentName",
      "department",
      "departmentName",
    ]);
    const brand = getFirstValue(asset, [
      "cBrandName",
      "BrandName",
      "brand",
      "brandName",
    ]);
    const serialNo = getFirstValue(asset, [
      "cSerialNo",
      "SerialNo",
      "serialNo",
    ]);
    const description = getFirstValue(asset, [
      "cAssetDescription",
      "cDescription",
      "description",
    ]);

    assetForm.setFieldsValue({
      assetName,
      shortName,
      department:
        getFirstValue(asset, [
          "nDepartmentId",
          "DepartmentId",
          "departmentId",
          "department",
        ]) || department,
      brand:
        getFirstValue(asset, [
          "nBrandId",
          "BrandId",
          "brandId",
          "brand",
        ]) || brand,
      serialNo,
      description,
    });
    setAssetFormSearch(assetName);
  };

  const handlePickedCustomerAsset = (asset: any) => {
    if (assetPickerTarget === "asset") {
      fillAssetFormFromAsset(asset);
      return;
    }

    const assetName =
      getFirstValue(asset, [
        "cAssetName",
        "cAssetMasterName",
        "AssetName",
        "assetName",
        "name",
      ]) || "";

    form.setFieldsValue({
      AssetName: assetName,
      AssetId:
        getFirstValue(asset, [
          "nAssetId",
          "nAssetMasterId",
          "AssetId",
          "assetId",
          "id",
        ]) || assetName,
    });
    setAssetSearch(assetName);
  };

  const handleRepairAssetSelect = (asset: any) => {
    const assetName =
      getFirstValue(asset, [
        "cAssetName",
        "cAssetMasterName",
        "AssetName",
        "assetName",
        "name",
      ]) || "";
    const assetId =
      getFirstValue(asset, [
        "nAssetId",
        "nAssetMasterId",
        "AssetId",
        "assetId",
        "id",
      ]) || assetName;
    const amc = Boolean(
      getFirstValue(asset, [
        "bUnderAmc",
        "bAMC",
        "amc",
      ])
    );
    const warranty = Boolean(
      getFirstValue(asset, [
        "bUnderWarranty",
        "bWarranty",
        "warranty",
      ])
    );

    setRepairDraft({
      assetId: String(assetId),
      assetName: String(assetName),
      amc,
      warranty,
      comment: "",
      files: [],
      editingIndex: null,
    });
    setCarryOpen(false);
    setRepairDetailOpen(true);
  };

  const handleRepairDraftFileAdd = (file: any) => {
    const nextFile: UploadFile = {
      uid: file.uid || `${Date.now()}-${file.name}`,
      name: file.name,
      status: "done",
      url: file.url || URL.createObjectURL(file),
      thumbUrl: file.url || URL.createObjectURL(file),
      originFileObj: file,
    } as UploadFile;

    setRepairDraft((current) => ({
      ...current,
      files: [...current.files, nextFile],
    }));

    return false;
  };

  const handleRepairDraftRemove = (uid: string) => {
    setRepairDraft((current) => ({
      ...current,
      files: current.files.filter((file) => file.uid !== uid),
    }));
  };

  const handleRepairOk = () => {
    if (!repairDraft.assetName) return;

    const finalizeRepairSave = () => {
      setRepairAssets((current) => {
        const nextItem = {
          ...repairDraft,
          key: repairDraft.assetId || repairDraft.assetName,
        };

        if (repairDraft.editingIndex !== null) {
          return current.map((item, index) =>
            index === repairDraft.editingIndex ? nextItem : item
          );
        }

        return [...current, nextItem];
      });

      form.setFieldValue("ItemTakenForRepair", true);
      setRepairDetailOpen(false);
      setRepairDraft({
        assetId: "",
        assetName: "",
        amc: false,
        warranty: false,
        comment: "",
        files: [],
        editingIndex: null,
      });
    };

    checkAmcExpiry({
      ...sessionPayload,
      CustomerId: form.getFieldValue("CustomerId"),
      customerId: form.getFieldValue("CustomerId"),
      nCustomerId: form.getFieldValue("CustomerId"),
      AssetId: repairDraft.assetId,
      assetId: repairDraft.assetId,
      nAssetId: repairDraft.assetId,
    })
      .then((response: any) => {
        const data = response?.data ?? response ?? {};
        const messageText = String(
          data?.message ?? data?.title ?? ""
        ).toLowerCase();
        const amcFlag = Boolean(
          data?.bUnderAmc ??
            data?.bAMC ??
            data?.amc ??
            data?.underAmc ??
            data?.isUnderAmc
        );
        const warrantyFlag = Boolean(
          data?.bUnderWarranty ??
            data?.bWarranty ??
            data?.warranty ??
            data?.underWarranty ??
            data?.isUnderWarranty
        );
        const successFlag =
          data?.success ?? data?.isSuccess ?? data?.status;

        const isCovered =
          amcFlag ||
          warrantyFlag ||
          successFlag === true ||
          String(successFlag).toLowerCase() === "true" ||
          (!messageText.includes("not under") &&
            !messageText.includes("not available"));

        if (!isCovered) {
          Modal.warning({
            title: "Warning",
            content: "Asset is not under AMC or Warranty",
          });
          return;
        }

        finalizeRepairSave();
      })
      .catch(() => {
        Modal.warning({
          title: "Warning",
          content: "Asset is not under AMC or Warranty",
        });
      });
  };

  const handleRepairEdit = (index: number) => {
    const item = repairAssets[index];

    setRepairDraft({
      assetId: String(item?.assetId ?? ""),
      assetName: String(item?.assetName ?? ""),
      amc: Boolean(item?.amc),
      warranty: Boolean(item?.warranty),
      comment: String(item?.comment ?? ""),
      files: Array.isArray(item?.files) ? item.files : [],
      editingIndex: index,
    });
    setRepairDetailOpen(true);
  };

  const handleRepairDelete = (index: number) => {
    setRepairAssets((current) => {
      const next = current.filter(
        (_, itemIndex) => itemIndex !== index
      );

      form.setFieldValue("ItemTakenForRepair", next.length > 0);

      return next;
    });
  };

  const handleUpload = (file: any) => {
    if (editorSourceUrlRef.current) {
      URL.revokeObjectURL(editorSourceUrlRef.current);
    }

    setEditorFile(file);
    const sourceUrl = URL.createObjectURL(file);
    editorSourceUrlRef.current = sourceUrl;
    setEditorImage(sourceUrl);
    setEditorMode("square");
    setImageEditorOpen(true);

    return Upload.LIST_IGNORE;
  };

  const handleEditorSave = async () => {
    if (!editorFile) return;

    const canvas = editorCanvasRef.current;
    let fileToSave = editorFile;
    let previewUrl = editorImage;

    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      const blob = await (await fetch(dataUrl)).blob();

      if (blob.size) {
        fileToSave = new File(
          [blob],
          editorFile.name.replace(/\.[^.]+$/, "") + ".png",
          { type: "image/png" }
        );
        previewUrl = dataUrl;
      }
    }

    const uploadFile: UploadFile = {
      uid:
        editorFile.uid ||
        `${Date.now()}-${fileToSave.name}`,
      name: fileToSave.name,
      status: "done",
      url: previewUrl,
      thumbUrl: previewUrl,
      originFileObj: fileToSave,
    } as UploadFile;

    setFileList((current) => [
      ...current,
      uploadFile,
    ]);

    form.setFieldsValue({
      images: [...(form.getFieldValue("images") ?? []), previewUrl],
      imageFiles: [...(form.getFieldValue("imageFiles") ?? []), uploadFile],
    });

    setImageEditorOpen(false);
    setEditorFile(null);
    setEditorImage("");
    finishEditorDrawing();

    if (editorSourceUrlRef.current) {
      URL.revokeObjectURL(editorSourceUrlRef.current);
      editorSourceUrlRef.current = "";
    }
  };

  const handleEditorCancel = () => {
    setImageEditorOpen(false);
    setEditorFile(null);
    setEditorImage("");
    finishEditorDrawing();

    if (editorSourceUrlRef.current) {
      URL.revokeObjectURL(editorSourceUrlRef.current);
      editorSourceUrlRef.current = "";
    }
  };

  useEffect(() => {
    if (!imageEditorOpen || !editorImage) return;

    const frame = requestAnimationFrame(() => {
      paintEditorCanvas(editorImage);
    });

    return () => cancelAnimationFrame(frame);
  }, [imageEditorOpen, editorImage]);

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

  const handleSubmit = async (values: any) => {
    const missingFields = ticketRequiredFields.filter((field) =>
      field.isMissing(values[field.name])
    );

    form.setFields(
      ticketRequiredFields.map((field) => ({
        name: field.name,
        errors: missingFields.some(
          (missingField) => missingField.name === field.name
        )
          ? [`${field.label} is required`]
          : [],
      }))
    );

    if (missingFields.length) {
      form.scrollToField(missingFields[0].name, {
        block: "center",
      });
      message.error(
        `Please fill the required fields: ${missingFields
          .map((field) => field.label)
          .join(", ")}`
      );
      return;
    }

    const normalizedFollowupDate = formatFollowupDateForApi(
      values.FollowupDate
    );

    const normalizedPriority =
      typeof values.nPriority === "number"
        ? values.nPriority
        : PRIORITY_VALUE_MAP[String(values.Priority ?? "").trim()] ?? 1;
    const normalizedSourceId = normalizeSourceId(
      values.Source ?? values.SourceId,
      ticketSourceOptions
    );
    const normalizedServiceTypeId = normalizeServiceTypeId(
      values.ServiceType ?? values.nServiceType
    );
    const normalizedSourceLabel = getOptionLabelByValue(
      normalizedSourceId,
      ticketSourceOptions
    );
    const normalizedGroupId =
      Number(
        values.Group ??
          values.GroupId ??
          values.nGroupId ??
          0
      ) || 0;
    const normalizedAssignedAgents = normalizeAssignedAgentPayload(
      Array.isArray(selectedAssignAgentDetails)
        ? selectedAssignAgentDetails
        : []
    );
    const hasRepairItems = repairAssets.length > 0;
    const cRepairPartList = serializeRepairPartList(repairAssets);
    const attachmentSourceFiles = Array.isArray(values.imageFiles) &&
      values.imageFiles.length > 0
      ? values.imageFiles
      : fileList;
    const cFileMappings = "[]";

    const payload = {
      nCustomerId:
        Number(values.CustomerId ?? selectedCustomerId ?? 0) || 0,
      cCustomerName: selectedCustomerName ?? values.CustomerName ?? "",
      nSourceId: normalizedSourceId,
      nServiceType: normalizedServiceTypeId,
      cContactPerson: values.ContactPerson ?? "",
      cContactNumber: values.ContactNo ?? values.ContactNumber ?? "",
      cEmail: values.Email ?? "",
      cTicketSummary: values.IssueSummary ?? values.TicketSummary ?? "",
      cDescription: values.Description ?? "",
      cAssignedId: normalizedAssignedAgents,
      bOnSite: Boolean(values.OnsiteRequired ?? values.bOnSite),
      dFollowupDate: normalizedFollowupDate ?? "",
      nAssetId:
        Number(
          values.AssetId ?? values.nAssetId ?? sessionPayload.nAssetId ?? 0
        ) || 0,
      nPriority: normalizedPriority,
      nTicketStatus:
        Number(
          values.nTicketStatus ??
            values.TicketStatus ??
            values.Status ??
            sessionPayload.nTicketStatus ??
            1
        ) || 1,
      bAddItemRepair: hasRepairItems,
      cRepairPartList,
      cFileMappings,
      cDbName: sessionPayload.cDbName ?? "",
      cSchemaName: sessionPayload.cSchemaName ?? "",
      nCompanyId: Number(sessionPayload.nCompanyId ?? 0) || 0,
    };

    if (normalizedGroupId > 0) {
      payload.nGroupId = normalizedGroupId;
    }

    if (isEdit) {
      payload.TicketId = Number(ticketId ?? values.TicketId ?? 0) || 0;
      payload.nModifiedBy = Number(sessionPayload.nModifiedBy ?? 0) || 0;
    } else {
      payload.nCreatedBy = Number(sessionPayload.nModifiedBy ?? 0) || 0;
    }

    const followupPayload = followupSourceTicket
      ? {
          nTicketId:
            Number(
              followupSourceTicket?.nTicketId ??
                initialValues?.nTicketId ??
                initialValues?.TicketId ??
                0
            ) || 0,
          nTicketNo:
            Number(
              followupSourceTicket?.nTicketNo ??
                followupSourceTicket?.TicketNo ??
                initialValues?.nTicketNo ??
                initialValues?.TicketNo ??
                0
            ) || 0,
          nCustomerId: payload.nCustomerId,
          nTicketStatus: payload.nTicketStatus,
          nSourceId: payload.nSourceId,
          nServiceType: payload.nServiceType,
          cContactPerson: payload.cContactPerson,
          cContactNumber: payload.cContactNumber,
          cEmail: payload.cEmail,
          cDescription: payload.cDescription,
          cAssignedId: payload.cAssignedId,
          nAssetId: payload.nAssetId,
          nPriority: payload.nPriority,
          nGroupId: normalizedGroupId,
          bOnSite: payload.bOnSite,
          dFollowupDate: payload.dFollowupDate,
          nModifiedBy: Number(sessionPayload.nModifiedBy ?? 0) || 0,
          nCompanyId: payload.nCompanyId,
          cSchemaName: payload.cSchemaName,
          cDbName: payload.cDbName,
        }
      : null;
    const mutation = followupSourceTicket
      ? followupSave
      : isEdit
        ? updateTicket
        : createTicket;
    const savePayload = followupPayload ?? payload;
    const flowMessageKey = "ticket-create-flow";

    try {
      message.loading({
        content: "Saving ticket...",
        key: flowMessageKey,
        duration: 0,
      });

      const savedTicketResponse = await mutation.mutateAsync(savePayload as any);
      const savedTicketId =
        getTicketIdFromResponse(savedTicketResponse) ||
        Number(followupPayload?.nTicketId ?? 0);
      console.log("[TicketCreate] save response", {
        savedTicketResponse,
        savedTicketId,
        attachmentCount: attachmentSourceFiles.length,
      });

      const hasAssignedAgent = normalizedAssignedAgents.length > 0;
      const hasGroup = normalizedGroupId > 0;
      const targetTab = hasFutureFollowup(normalizedFollowupDate)
        ? "UPCOMING"
        : hasAssignedAgent || hasGroup
          ? "ONGOING"
          : "CREATED";

      if (savedTicketId && attachmentSourceFiles.length > 0) {
        message.loading({
          content: "Uploading image attachments...",
          key: flowMessageKey,
          duration: 0,
        });

        const uploadPromises = attachmentSourceFiles.map(async (file) => {
          console.log("[TicketCreate] uploading attachment", {
            savedTicketId,
            fileName: file?.name || file?.FileName,
          });
          const blob = await resolveAttachmentBlob(file);

          if (!blob) {
            return null;
          }

          const uploadName =
            file?.name || file?.FileName || `attachment-${savedTicketId}.png`;

          const formData = new FormData();
          formData.append("files", blob, uploadName);
          formData.append("TicketId", String(savedTicketId));
          formData.append("nTicketId", String(savedTicketId));
          formData.append("nCompanyId", String(sessionPayload.nCompanyId ?? 0));
          formData.append("cDbName", String(sessionPayload.cDbName ?? ""));
          formData.append("cSchemaName", String(sessionPayload.cSchemaName ?? ""));
          formData.append("nModifiedBy", String(sessionPayload.nModifiedBy ?? 0));

          return ticketApis.ticketAttachmentUpload(formData as any);
        });

        await Promise.allSettled(uploadPromises);
      }

      let backendAttachments = normalizeAttachmentList(
        pickAttachmentList(savedTicketResponse),
      );
      let ticketViewRecord: Record<string, any> | null = null;

      if (savedTicketId) {
        try {
          const ticketViewResponse = await ticketApis.ticketView({
            nCompanyId: sessionPayload.nCompanyId,
            cSchemaName: sessionPayload.cSchemaName,
            cDbName: sessionPayload.cDbName,
            nTicketId: savedTicketId,
          });

          ticketViewRecord =
            ticketViewResponse?.data?.data ??
            ticketViewResponse?.data ??
            ticketViewResponse ??
            null;

          const refreshedAttachments = normalizeAttachmentList(
            pickAttachmentList(ticketViewResponse),
          );

          if (refreshedAttachments.length > 0) {
            backendAttachments = refreshedAttachments;
          }
        } catch {
          // Keep the save response attachments if the refresh fails.
        }
      }

      const attachmentsForState = backendAttachments;

      const responseData =
        savedTicketResponse?.data?.data ??
        savedTicketResponse?.data ??
        savedTicketResponse;

      const createdDateFallback = (() => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = now.getFullYear();
        const hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const hour12 = hours % 12 || 12;
        const ampm = hours >= 12 ? "PM" : "AM";

        return `${day}/${month}/${year} ${String(hour12).padStart(2, "0")}:${minutes} ${ampm}`;
      })();

      const savedTicketRecord = {
        ...payload,
        ...responseData,
        ...ticketViewRecord,
        ...savedTicketResponse,
        nTicketId:
          savedTicketId ??
          payload.TicketId ??
          responseData?.nTicketId ??
          responseData?.ticketId,
        TicketNo:
          responseData?.TicketNo ??
          responseData?.nTicketNo ??
          responseData?.ticketNo ??
          savedTicketId,
        nTicketNo:
          responseData?.nTicketNo ??
          responseData?.TicketNo ??
          responseData?.ticketNo ??
          savedTicketId,
        CustomerName: selectedCustomerName ?? values.CustomerName ?? "",
        cCustomerName: selectedCustomerName ?? values.CustomerName ?? "",
        TicketSummary: values.IssueSummary ?? values.TicketSummary ?? "",
        cTicketSummary: values.IssueSummary ?? values.TicketSummary ?? "",
        Description: values.Description ?? "",
        cDescription: values.Description ?? "",
        ContactPerson: values.ContactPerson ?? "",
        cContactPerson: values.ContactPerson ?? "",
        ContactNo: values.ContactNo ?? values.ContactNumber ?? "",
        cContactNumber: values.ContactNo ?? values.ContactNumber ?? "",
        Email: values.Email ?? "",
        cEmail: values.Email ?? "",
        Priority: values.Priority ?? "Medium",
        nPriority: normalizedPriority,
        SourceName: normalizedSourceLabel,
        Source: normalizedSourceId,
        nSourceId: normalizedSourceId,
        FollowupDate: normalizedFollowupDate ?? "",
        dFollowupDate: normalizedFollowupDate ?? "",
        nGroupId: normalizedGroupId,
        cAssignedId: normalizedAssignedAgents,
        TicketStatus: values.TicketStatus ?? values.Status ?? "Open",
        Status: values.Status ?? values.TicketStatus ?? "Open",
        nTicketStatus:
          Number(values.nTicketStatus ?? payload.nTicketStatus ?? 1) || 1,
        dCreatedDate:
          ticketViewRecord?.dCreatedDate ??
          responseData?.dCreatedDate ??
          ticketViewRecord?.CreatedDate ??
          responseData?.CreatedDate ??
          createdDateFallback,
        CreatedDate:
          ticketViewRecord?.CreatedDate ??
          responseData?.CreatedDate ??
          ticketViewRecord?.dCreatedDate ??
          responseData?.dCreatedDate ??
          createdDateFallback,
        CreatedDateTime:
          ticketViewRecord?.CreatedDateTime ??
          responseData?.CreatedDateTime ??
          ticketViewRecord?.dCreatedDate ??
          responseData?.dCreatedDate ??
          createdDateFallback,
        CreatedOn:
          ticketViewRecord?.CreatedOn ??
          responseData?.CreatedOn ??
          ticketViewRecord?.dCreatedDate ??
          responseData?.dCreatedDate ??
          createdDateFallback,
        CreatedFrom:
          ticketViewRecord?.CreatedFrom ??
          responseData?.CreatedFrom ??
          ticketViewRecord?.cSourceName ??
          responseData?.cSourceName ??
          normalizedSourceLabel,
        cCreatedFrom:
          ticketViewRecord?.cCreatedFrom ??
          responseData?.cCreatedFrom ??
          ticketViewRecord?.cSourceName ??
          responseData?.cSourceName ??
          normalizedSourceLabel,
        attachments: attachmentsForState,
        files: attachmentsForState,
      };

      message.success({
        content:
          !isEdit && attachmentsForState.length > 0
            ? "Ticket saved, attachments uploaded, opening Ongoing list..."
            : isEdit
              ? "Ticket updated"
              : "Ticket saved",
        key: flowMessageKey,
        duration: 2,
      });

      window.setTimeout(() => {
        if (followupSourceTicket && savedTicketId) {
          navigate(`/tickets/view/${savedTicketId}`, {
            state: {
              selectedRow: savedTicketRecord,
              isFrom: "followup",
              activeTab: "details",
            },
          });
          return;
        }

        if (!isEdit && savedTicketId) {
          navigate("/tickets", {
            state: {
              savedTicketRecord,
              savedTicketResponse,
              isFrom: "created",
              activeTab: "ONGOING",
            },
          });
          return;
        }

        navigate("/tickets", {
          state: {
            activeTab: targetTab,
            savedTicketResponse,
            savedTicketRecord,
          },
        });
      }, 600);
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save ticket",
      );
    }
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
        AssetId: undefined,
        AssetName: "",
      });
      setAssetSearch("");
      setAssetDropdownOpen(false);
      setRepairAssets([]);
      setRepairDraft({
        assetId: "",
        assetName: "",
        comment: "",
        files: [],
        editingIndex: null,
      });
      return;
    }

    const customer = customerLookup.get(String(value));
    if (!customer) {
      form.setFieldsValue({
        CustomerId: value,
        AssetId: undefined,
        AssetName: "",
      });
      setAssetSearch("");
      setAssetDropdownOpen(false);
      setRepairAssets([]);
      setRepairDraft({
        assetId: "",
        assetName: "",
        comment: "",
        files: [],
        editingIndex: null,
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
      AssetId: undefined,
      AssetName: "",
    });
    const customerName = getFirstValue(customer, [
      "cCustomerName",
      "CustomerName",
      "name",
    ]);
    setAssetSearch("");
    setAssetDropdownOpen(false);
    setRepairAssets([]);
    setRepairDraft({
      assetId: "",
      assetName: "",
      comment: "",
      files: [],
      editingIndex: null,
    });

    if (!followupSourceTicket) {
      void openCustomerTickets(value, customerName);
    }
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
          isFrom: "created",
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
    <div className="ticket-create-shell flex-1">
      <div className="ticket-create-header">
        <div className="ticket-create-header__titleline">
          <h2>
            {pageTitle}
            {pageSubtitle ? (
              <span className="ticket-create-header__subtitle-inline">
                {` (${pageSubtitle})`}
              </span>
            ) : null}
          </h2>
        </div>
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
          FollowupDate:
            followupSourceTicket
              ? dayjs()
              : initialValues?.FollowupDate ??
                initialValues?.dFollowupDate ??
                dayjs(),
          OnsiteRequired: initialValues?.OnsiteRequired ?? false,
        }}
        className="ticket-create-form"
        onFinish={handleSubmit}
      >
        <div className="ticket-create-grid ticket-create-grid--ticket min-h-0 overflow-visible">
          <section
            className="ticket-create-left flex min-h-0 flex-col overflow-visible border-r border-slate-200 px-4 pb-2 lg:h-full"
          >
            <div className="-mx-4 mt-0 mb-1 w-[calc(100%+2rem)] bg-sky-50 px-4 pt-0 pb-0 sm:mx-0 sm:w-full">
              <Form.Item
                label={
                  <span className="text-[18px] font-semibold leading-none text-slate-900">
                    Source
                  </span>
                }
                name="Source"
                className="!mt-0 !mb-0"
              >
                <Radio.Group className="source-radio-group flex flex-wrap gap-x-2 gap-y-0.5 text-[12px]">
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
                  onClick={() => setCustomerPickerOpen(true)}
                addonAfter={
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    className="ticket-search-button !h-7 !w-9 border-0 !rounded-l-none !rounded-r-md m-0"
                    onClick={() => {
                      setCustomerPickerOpen(true);
                    }}
                  />
                }
                />
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

            {followupSourceTicket ? (
              <div className="mb-1 space-y-1 text-[12px] leading-5 text-slate-700">
                <div>
                  <span className="font-medium text-slate-900">
                    Ticket Summary:
                  </span>{" "}
                  {followupSummaryText || "-"}
                </div>
                <div>
                  <span className="font-medium text-slate-900">
                    Ticket Description:
                  </span>{" "}
                  {followupDescriptionText || "-"}
                </div>
              </div>
            ) : (
              <Form.Item
                label="Ticket Summary"
                name="IssueSummary"
              >
                <Input />
              </Form.Item>
            )}

            {followupSourceTicket ? (
              <>
                <Form.Item name="IssueSummary" hidden>
                  <Input />
                </Form.Item>
                <Form.Item name="Description" hidden>
                  <Input />
                </Form.Item>
              </>
            ) : null}

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
                      setAssetOpen(true);
                    }}>
                  Link Asset +
                  </button>
                </div>
              }
              name="AssetName"
            >
              <div className="relative">
                <Input
                  value={String(form.getFieldValue("AssetName") ?? "")}
                  addonAfter={
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      className="ticket-search-button !h-7 !w-10 border-0 !rounded-l-none !rounded-r-md m-0"
                      onClick={() => {
                        setAssetDropdownOpen(false);
                        setAssetPickerTarget("ticket");
                        setAssetSearch("");
                        setAssetPickerOpen(true);
                      }}
                    />
                  }
                  onFocus={() => setAssetDropdownOpen(true)}
                  onClick={() => setAssetDropdownOpen(true)}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    form.setFieldsValue({ AssetName: nextValue });
                    setAssetSearch(nextValue);
                    setAssetDropdownOpen(true);
                  }}
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
                        (asset: any, index: number) =>{
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

            {repairAssets.length ? (
              <div className="mt-2 space-y-2 rounded border border-slate-200 bg-slate-50 p-2">
                {repairAssets.map((item, index) => (
                  <div
                    key={`${item.assetId || item.assetName}-${index}`}
                    className="flex items-start justify-between gap-3 rounded bg-sky-50 px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        Asset Taken for Repair
                      </div>
                      <div className="text-sm text-slate-700">
                        {item.assetName}
                      </div>
                      {item.comment ? (
                        <div className="mt-1 text-xs text-slate-500">
                          {item.comment}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-slate-700 hover:text-slate-900"
                        onClick={() => handleRepairEdit(index)}
                      >
                        <EditOutlined />
                      </button>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleRepairDelete(index)}
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <Form.Item
              label="Service Type"
              name="ServiceType"
              className="!mt-[-4px]"
            >
              <Select
                placeholder="Select service type"
                options={filteredServiceTypeOptions}
                filterOption={false}
                popupRender={renderSearchPopup(
                  serviceTypeSearch,
                  setServiceTypeSearch
                )}
              />
            </Form.Item>

            <div className="-mx-4 mt-2 mb-1 border-y border-slate-200 bg-sky-50 px-5 text-[13px]">
              <Form.Item
                label="Priority"
                name="Priority"
                className="!mb-0"
              >
                <Radio.Group className="priority-radio-group flex flex-wrap gap-x-2 gap-y-1">
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

          <section className="ticket-create-right flex min-h-0 flex-col overflow-visible bg-white px-4 pb-2 lg:h-full">
            <div className="ticket-followup-row flex flex-row items-start gap-2">
              <Form.Item
                label="Follow up Date & Time"
                name="FollowupDate"
                className="flex-1 max-w-[380px]"
              >
                <FollowupDateTimePicker />
              </Form.Item>

              <Form.Item
                name="OnsiteRequired"
                valuePropName="checked"
                className="mb-0 self-start pt-8"
              >
                <Checkbox className="inline-flex items-center whitespace-nowrap">
                  Onsite Required
                </Checkbox>
              </Form.Item>
            </div>

            <Form.Item label="Group" name="Group">
              <Select
                suffixIcon=">"
                options={filteredGroupOptions}
                filterOption={false}
                popupRender={renderSearchPopup(
                  groupSearch,
                  setGroupSearch
                )}
                onChange={() => {
                  setAssignAgentSearch("");
                  form.setFieldValue("AssignToAgent", undefined);
                  setAssignAgentDisplayName("");
                  setPendingAssignAgentIds([]);
                  setPendingLeaderAssignAgentId("");
                }}
              />
            </Form.Item>

            <Form.Item label="Assign To Agent">
              <div className="relative z-20">
                <Input
                  readOnly
                  value={assignAgentDisplayName}
                  placeholder="Select agent"
                  onClick={() => {
                    const currentAgentId = normalizeSelectionValue(
                      form.getFieldValue("AssignToAgent")
                    );
                    setPendingAssignAgentIds(
                      currentAgentId ? [currentAgentId] : []
                    );
                    setPendingLeaderAssignAgentId(currentAgentId);
                    setAssignAgentDropdownOpen(true);
                  }}
                  onFocus={() => {
                    const currentAgentId = normalizeSelectionValue(
                      form.getFieldValue("AssignToAgent")
                    );
                    setPendingAssignAgentIds(
                      currentAgentId ? [currentAgentId] : []
                    );
                    setPendingLeaderAssignAgentId(currentAgentId);
                    setAssignAgentDropdownOpen(true);
                  }}
                  suffix={
                    <button
                      type="button"
                      className="ticket-agent-trigger"
                      onClick={() => {
                        const currentAgentId = normalizeSelectionValue(
                          form.getFieldValue("AssignToAgent")
                        );
                        setPendingAssignAgentIds(
                          currentAgentId ? [currentAgentId] : []
                        );
                        setPendingLeaderAssignAgentId(
                          currentAgentId
                        );
                        setAssignAgentDropdownOpen(true);
                      }}
                    >
                      &gt;
                    </button>
                  }
                />

                <Form.Item name="AssignToAgent" hidden>
                  <Input />
                </Form.Item>

                {assignAgentDropdownOpen && (
                  <div className="ticket-agent-dropdown absolute left-0 right-0 top-full z-50 mt-1">
                    <Input
                      prefix={<SearchOutlined />}
                      placeholder="Search"
                      value={assignAgentSearch}
                      onChange={(event) =>
                        setAssignAgentSearch(
                          event.target.value
                        )
                      }
                      onMouseDown={(event) =>
                        event.preventDefault()
                      }
                    />

                    <div className="ticket-agent-list">
                      {filteredAssignAgents.length ? (
                        filteredAssignAgents.map(
                          (agent: any, index: number) => {
                            const agentId =
                              getFirstValue(agent, [
                                "nAgentId",
                                "agentId",
                                "id",
                                "value",
                              ]) ?? index;
                            const agentName =
                              getFirstValue(agent, [
                                "cAgentName",
                                "agentName",
                                "name",
                              ]) ?? `Agent ${index + 1}`;
                            const shortName =
                              getFirstValue(agent, [
                                "cAgentshName",
                                "shortName",
                              ]) ??
                              String(agentName)
                                .slice(0, 2)
                                .toUpperCase();
                            const ticketCount =
                              getFirstValue(agent, [
                                "nAssignTicketCount",
                                "assignTicketCount",
                              ]) ?? 0;
                            const visitCount =
                              getFirstValue(agent, [
                                "nSiteVistCount",
                                "siteVisitCount",
                              ]) ?? 0;

                            return (
                              <button
                                key={String(agentId)}
                                type="button"
                                className={`ticket-agent-item${
                                  activeAssignAgentIds.includes(
                                    String(agentId)
                                  )
                                    ? " active"
                                    : ""
                                }`}
                                onClick={() => {
                                  setPendingAssignAgentIds(
                                    (current) => {
                                      const id = String(agentId);
                                      if (current.includes(id)) {
                                        return current.filter(
                                          (item) => item !== id
                                        );
                                      }
                                      return [...current, id];
                                    }
                                  );
                                  setPendingLeaderAssignAgentId(
                                    String(agentId)
                                  );
                                }}
                              >
                                <span
                                  className="ticket-agent-avatar"
                                  style={{
                                    backgroundColor: getAvatarColor(
                                      String(agentName),
                                      index
                                    ),
                                  }}
                                >
                                  {String(shortName)
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </span>

                                <span className="ticket-agent-name">
                                  {agentName}
                                </span>

                                <span className="ticket-agent-stats">
                                  <button
                                    type="button"
                                    className="px-0 text-blue-600"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openAgentTickets(
                                        agentId,
                                        String(agentName)
                                      );
                                    }}
                                  >
                                    {ticketCount} Tickets
                                  </button>
                                  <img
                                    src={closedTicketIcon}
                                    alt=""
                                    className="ticket-agent-house-icon h-4 w-4 shrink-0"
                                  />
                                  <span>{visitCount}</span>
                                </span>
                              </button>
                            );
                          }
                        )
                      ) : (
                        <div className="ticket-agent-empty">
                          No data found
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button
                        className="ticket-agent-ok"
                        onClick={() => {
                          if (pendingAssignAgentIds.length > 1) {
                            setPendingLeaderAssignAgentId(
                              pendingLeaderAssignAgentId ||
                                pendingAssignAgentIds[0]
                            );
                            setLeaderPickerOpen(true);
                            setAssignAgentDropdownOpen(false);
                            return;
                          }

                          const selectedId = normalizeSelectionValue(
                            pendingAssignAgentIds[0] ?? ""
                          );

                          if (selectedId) {
                            form.setFieldValue(
                              "AssignToAgent",
                              selectedId
                            );
                          }

                          setAssignAgentDisplayName(
                            pendingAssignAgentNames
                          );

                          setPendingAssignAgentIds([]);
                          setPendingLeaderAssignAgentId("");
                          setAssignAgentDropdownOpen(false);
                        }}
                        >
                        Ok
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Form.Item>

            <Form.Item>
  <Upload
    beforeUpload={handleUpload as any}
    showUploadList={false}
    accept=".jpg,.jpeg,.png"
    maxCount={5}
    className="w-full"
  >
    <Button
      className="ticket-upload-btn flex w-full items-center justify-center gap-3"
      icon={<UploadOutlined />}
    >
      Upload Files
    </Button>
  </Upload>

  {fileList.length > 0 && (
    <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
      {fileList.map((file) => (
        <div
          key={file.uid}
          className="relative h-[110px] w-[110px] shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <img
            src={file.url || file.thumbUrl}
            alt={file.name}
            className="h-full w-full cursor-pointer object-cover"
            onClick={() => handlePreview(file)}
          />

          <button
            type="button"
            className="absolute right-1 bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-500 shadow-md hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              setFileList((current) =>
                current.filter(
                  (item) => item.uid !== file.uid
                )
              );
              form.setFieldsValue({
                images: (form.getFieldValue("images") ?? []).filter(
                  (_: any, index: number) => index !== fileList.findIndex((item) => item.uid === file.uid),
                ),
                imageFiles: (form.getFieldValue("imageFiles") ?? []).filter(
                  (item: any) => item?.uid !== file.uid,
                ),
              });
            }}
          >
            <DeleteOutlined />
          </button>
        </div>
      ))}
    </div>
  )}

  <p className="mt-1 text-right text-xs text-slate-500">
    only accept jpeg,png,jpg upto 5MB
  </p>
</Form.Item>

            {showQuickCall && (
              <div className="ticket-quick-call mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
                <p className="mb-2 text-[12px] text-slate-600">
                  Quick Call Report will save the ticket and the call report together.
                </p>
                <Button
                  type="primary"
                  block
                    className="!bg-sky-400 !border-sky-400 hover:!bg-sky-400"

                  onClick={() => setQuickCallOpen(true)}
                >
                  Quick Call Report
                </Button>
              </div>
            )}

            <div className="ticket-right-actions">
              <Button
                type="primary"
                htmlType="submit"
              
                className="ticket-right-save bg-emerald-500 border-emerald-500 hover:!bg-emerald-600"
              >
                {isEdit ? "Update" : "Save"}
              </Button>
            </div>
          </section>
      </div>
      </Form>

      {showQuickCall && (
        <QuickCallReportSimpleModal
          open={quickCallOpen}
          onClose={() => setQuickCallOpen(false)}
          ticketForm={form}
          selectedCustomerName={selectedCustomerName}
          sessionPayload={sessionPayload}
          onSaved={(response) => {
            navigate("/tickets", {
              state: {
                savedTicketResponse: response,
                isFrom: "created",
                activeTab: "ONGOING",
              },
            });
          }}
        />
      )}

      <Modal
        open={leaderPickerOpen}
        title="Select One As The Leader"
        centered
        width={420}
        className="ticket-picker-modal"
        closeIcon={<CloseOutlined />}
        zIndex={1800}
        footer={
          <div className="flex justify-end">
            <Button
              className="ticket-agent-ok"
              onClick={() => {
                if (
                  normalizeSelectionValue(
                    pendingLeaderAssignAgentId
                  )
                ) {
                  form.setFieldValue(
                    "AssignToAgent",
                    normalizeSelectionValue(
                      pendingLeaderAssignAgentId
                    )
                  );
                }

                setAssignAgentDisplayName(
                  pendingAssignAgentNames
                );

                setLeaderPickerOpen(false);
                setPendingAssignAgentIds([]);
                setPendingLeaderAssignAgentId("");
              }}
            >
              Ok
            </Button>
          </div>
        }
        onCancel={() => {
          setLeaderPickerOpen(false);
          setPendingAssignAgentIds([]);
          setPendingLeaderAssignAgentId("");
        }}
      >
        <div className="space-y-3">
          {pendingAssignAgentIds.length ? (
            pendingAssignAgentIds
              .map((id) =>
                assignAgents.find((agent: any) => {
                  const agentId = getFirstValue(agent, [
                    "nAgentId",
                    "agentId",
                    "id",
                    "value",
                  ]);

                  return String(agentId ?? "") === String(id);
                })
              )
              .filter(Boolean)
              .map((agent: any, index: number) => {
                const agentId = getFirstValue(agent, [
                  "nAgentId",
                  "agentId",
                  "id",
                  "value",
                ]);
                const agentName = getFirstValue(agent, [
                  "cAgentName",
                  "agentName",
                  "name",
                ]) ?? `Agent ${index + 1}`;
                const shortName = getFirstValue(agent, [
                  "cAgentshName",
                  "shortName",
                ]) ?? String(agentName).slice(0, 2).toUpperCase();

                return (
                  <button
                    key={String(agentId)}
                    type="button"
                    className={`ticket-agent-item${
                      pendingLeaderAssignAgentId ===
                      String(agentId)
                        ? " active"
                        : ""
                    }`}
                    onClick={() =>
                      setPendingLeaderAssignAgentId(
                        String(agentId)
                      )
                    }
                  >
                    <span
                      className="ticket-agent-avatar"
                      style={{
                        backgroundColor: getAvatarColor(
                          String(agentName),
                          index
                        ),
                      }}
                    >
                      {String(shortName).slice(0, 2).toUpperCase()}
                    </span>
                    <span className="ticket-agent-name">
                      {agentName}
                    </span>
                  </button>
                );
              })
          ) : (
            <div className="ticket-agent-empty">
              No data found
            </div>
          )}
        </div>
      </Modal>

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
              <Button className="ticket-image-tool-btn" type={editorMode === "square" ? "primary" : "default"} onClick={() => setEditorMode("square")} icon={<BorderOutlined />} />
              <Button className="ticket-image-tool-btn" type={editorMode === "brush" ? "primary" : "default"} onClick={() => setEditorMode("brush")} icon={<EditOutlined />} />
              <Button className="ticket-image-reset-btn" onClick={handleEditorReset}>
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
          <canvas
            ref={editorCanvasRef}
            className={`ticket-image-editor-stage ${
              editorMode === "square"
                ? "is-square-mode"
                : ""
            }`}
            onPointerDown={handleEditorPointerDown}
            onPointerMove={handleEditorPointerMove}
            onPointerUp={handleEditorPointerEnd}
            onPointerCancel={handleEditorPointerEnd}
            onPointerLeave={handleEditorPointerEnd}
          />
        </div>
      </Modal>

      <CustomerPickerModal
        open={customerPickerOpen}
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        title="Select Customer"
        onCancel={() => setCustomerPickerOpen(false)}
        onSelect={(value) => handleCustomerSelect(value)}
      />

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
            
            
          </div>
        }
        title="Assets"
        width={500}
        className="ticket-picker-modal"
        closeIcon={<CloseOutlined />}
        onCancel={() => {
          setAssetPickerTarget("ticket");
          setAssetPickerOpen(false);
        }}
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
                options={filteredBrandOptions}
                filterOption={false}
                popupRender={renderSearchPopup(
                  brandSearch,
                  setBrandSearch
                )}
                value={assetBrand}
                onChange={setAssetBrand}
              />
            </div>
          </div>

          {assetPickerTarget === "asset" ? (
            assetPickerItems.length ? (
              <div className="space-y-2">
                {assetPickerItems.map((asset: any, index: number) => {
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
                      "cDepartment",
                      "DepartmentName",
                      "department",
                    ]) || "-";
                  const brand = getFirstValue(asset, [
                    "cBrandName",
                    "cBrand",
                    "BrandName",
                    "brand",
                  ]) || "-";

                  return (
                    <button
                      type="button"
                      key={`${assetId}-${index}`}
                      className="w-full rounded border border-sky-100 bg-white px-3 py-2 text-left text-sm hover:border-sky-300 hover:bg-sky-50"
                      onClick={() => {
                        handlePickedCustomerAsset(asset);
                        setAssetPickerTarget("ticket");
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
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500">
                No data found
              </div>
            )
          ) : !selectedCustomerId ? (
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
                        handlePickedCustomerAsset(asset);
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
                      suffixIcon=">"
                      options={filteredDepartmentOptions}
                      filterOption={false}
                      popupRender={renderSearchPopup(
                        departmentSearch,
                        setDepartmentSearch
                      )}
                      value={assetDepartment}
                      onChange={setAssetDepartment}
                    />

                    <Select
                      placeholder="Brand"
                      suffixIcon=">"
                      options={filteredBrandOptions}
                      filterOption={false}
                      popupRender={renderSearchPopup(
                        brandSearch,
                        setBrandSearch
                      )}
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
                                handleRepairAssetSelect(asset);
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
        open={repairDetailOpen}
        title="Asset"
        closeIcon={<CloseOutlined />}
        width={600}
        footer={null}
        onCancel={() => {
          setRepairDetailOpen(false);
          setRepairDraft({
            assetId: "",
            assetName: "",
            amc: false,
            warranty: false,
            comment: "",
            files: [],
            editingIndex: null,
          });
        }}
      >
        <div className="space-y-3">
          <div className="rounded bg-sky-50 px-3 py-2 text-sm text-slate-800">
            {repairDraft.assetName || "Select an asset"}
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">
              Comment
            </label>
            <Input.TextArea
              rows={4}
              value={repairDraft.comment}
              onChange={(event) =>
                setRepairDraft((current) => ({
                  ...current,
                  comment: event.target.value,
                }))
              }
            />
          </div>

          <Upload.Dragger
            multiple
            beforeUpload={handleRepairDraftFileAdd as any}
            fileList={repairDraft.files}
            onRemove={(file) => {
              handleRepairDraftRemove(file.uid);
              return true;
            }}
            showUploadList={false}
            accept=".jpg,.jpeg,.png"
            className="repair-upload-dragger"
          >
            <p className="text-sm text-slate-700">
              Choose files or drag & drop it here
              <span className="text-slate-500">
                {" "}
                (JPEG, PNG, format, up to 10MB)
              </span>
            </p>
            <Button type="primary" className="mt-8 bg-black hover:!bg-black">
              Choose
            </Button>
          </Upload.Dragger>

          {repairDraft.files.length ? (
            <div className="space-y-2">
              {repairDraft.files.map((file) => (
                <div
                  key={file.uid}
                  className="flex items-center justify-between rounded border border-slate-200 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-slate-100">
                      {file.thumbUrl || file.url ? (
                        <img
                          src={String(file.thumbUrl || file.url)}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <span className="text-sm text-slate-700">
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleRepairDraftRemove(file.uid)}
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="primary"
              className="bg-emerald-500 px-6 hover:!bg-emerald-600"
              onClick={handleRepairOk}
            >
              Ok
            </Button>
          </div>
        </div>
      </Modal>

      <Drawer
        open={assetOpen}
        placement="right"
        width={500}
        forceRender
        title={
          <div className="flex items-center justify-between">
            <span>Add Asset</span>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setAssetOpen(false)}
            />
          </div>
        }
        closable={false}
        className="ticket-asset-drawer"
        onClose={() => setAssetOpen(false)}
      >
        <Form
          form={assetForm}
          layout="vertical"
          requiredMark={false}
          className="ticket-asset-drawer-form"
          initialValues={{
            amc: true,
            warranty: false,
          }}
        >
          <Form.Item
            name="assetName"
            label={
              <div className="flex w-full items-center justify-between gap-1">
                <span>Name</span>
                
              </div>
            }
            className="mb-1"
          >
            <div className="relative">
              <Input
                value={String(assetForm.getFieldValue("assetName") ?? "")}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  assetForm.setFieldValue("assetName", nextValue);
                  setAssetFormSearch(nextValue);
                  setAssetFormDropdownOpen(true);
                }}
              />

              {assetFormDropdownOpen ? (
                <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded border border-slate-200 bg-white shadow-lg">
                  {filteredAssetFormAssets.length ? (
                    filteredAssetFormAssets.map(
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
                            className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-sky-50"
                            onMouseDown={(event) =>
                              event.preventDefault()
                            }
                            onClick={() => {
                              fillAssetFormFromAsset(asset);
                              setAssetFormDropdownOpen(false);
                            }}
                          >
                            <span className="font-medium text-slate-900">
                              {assetName}
                            </span>
                            <span className="text-xs text-slate-500">
                              {department}
                              {brand ? ` • ${brand}` : ""}
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

          <div className="grid grid-cols-2 gap-1">
            <Form.Item
              name="shortName"
              label="Short Name"
              className="mb-1"
            >
              <Input />
            </Form.Item>

            
            <Form.Item
              name="department"
              label="Department"
              className="mb-1"
            >
              <Select
                suffixIcon=">"
                options={filteredDepartmentOptions}
                filterOption={false}
                popupRender={renderSearchPopup(
                  departmentSearch,
                  setDepartmentSearch
                )}
                popupClassName="ticket-asset-select-dropdown"
              />
            </Form.Item>

            <Form.Item
              name="brand"
              label="Brand"
              className="mb-1"
            >
              <Select
                suffixIcon=">"
                options={filteredBrandOptions}
                filterOption={false}
                popupRender={renderSearchPopup(
                  brandSearch,
                  setBrandSearch
                )}
                popupClassName="ticket-asset-select-dropdown"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Description"
            className="mb-1"
          >
            <TextArea rows={3} />
          </Form.Item>

          <div className="grid grid-cols-[auto_auto_1fr] items-end gap-2">
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
              <AntDatePicker
                className="w-full"
                format="DD/MM/YYYY"
                popupClassName="modern-ticket-calendar"
              />
            </Form.Item>
          </div>
        </Form>

        <div className="mt-4 flex justify-end">
          <Button
            type="primary"
            loading={isSavingAsset}
            className="ticket-asset-save-btn px-8"
            onClick={saveAssetMaster}
          >
            Save
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default TicketForm;


