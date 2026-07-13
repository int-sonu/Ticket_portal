import { CloseOutlined, DeleteOutlined, EditOutlined, LeftOutlined, RightOutlined, SearchOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, DatePicker, Drawer, Empty, Form, Image, Input, Modal, Radio, Spin, Upload, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";

import deleteImage from "../../../assets/icons/delete-white.svg";
import editImage from "../../../assets/icons/edit-black.svg";
import { getApiImageBaseUrl } from "../../../Axios/config";
import { getRequestPayload } from "../../../Utils/requestPayload";
import { extractList } from "../../Master/Common/SimpleMasterUtils";
import TicketModulePagination from "../../Ticket/Common/TicketModulePagination";
import {
  useAgentwiseLeaveList,
  useLeaveDetailsView,
  useDeleteLeaveAttachments,
  useDeleteLeave,
  useSaveLeave,
  useUpdateLeave,
  useUploadLeaveAttachments,
} from "./Hooks";

type LeaveRecord = Record<string, unknown>;
type LeaveApplicationValues = {
  name: string;
  reason: string;
  period: "full" | "forenoon" | "afternoon";
  leaveFrom: dayjs.Dayjs;
  leaveTo: dayjs.Dayjs;
};

const getValue = (record: unknown, keys: string[]) => {
  if (!record || typeof record !== "object") return "";
  const source = record as LeaveRecord;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") return source[key];
  }
  const matched = Object.keys(source).find((key) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
  );
  return matched ? source[matched] : "";
};

const text = (value: unknown, fallback = "N/A") => String(value ?? "").trim() || fallback;

const resolveAttachmentUrl = (value: unknown) => {
  const path = text(value, "");
  if (!path || /^(https?:|data:|blob:)/i.test(path)) return path;
  try {
    const base = getApiImageBaseUrl().replace(/\/+$/, "");
    return `${base}/${path.replace(/\\/g, "/").replace(/^\/+/, "")}`;
  } catch {
    return path.replace(/\\/g, "/");
  }
};

const formatDateTime = (value: unknown) => {
  const source = text(value, "");
  if (!source) return "N/A";
  const date = new Date(source);
  return Number.isNaN(date.getTime())
    ? source
    : date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).replace(",", "");
};

const toDateValue = (value: unknown) => {
  const source = text(value, "");
  if (!source) return undefined;
  const dayFirst = source.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  const parsed = dayFirst
    ? dayjs(`${dayFirst[3]}-${dayFirst[2]}-${dayFirst[1]}`)
    : dayjs(source);
  return parsed.isValid() ? parsed : undefined;
};

const extractRows = (response: unknown) => {
  const direct = extractList(response);
  if (direct.length) return direct as LeaveRecord[];
  if (!response || typeof response !== "object") return [];
  const source = response as LeaveRecord;
  for (const value of [
    source.LeaveList,
    source.leaveList,
    source.AgentwiseLeaveList,
    source.leaveApplicationList,
    source.LeaveApplicationList,
  ]) {
    const rows = extractList(value);
    if (rows.length) return rows as LeaveRecord[];
  }
  return [];
};

const extractDetails = (response: unknown, fallback: LeaveRecord): LeaveRecord => {
  const rows = extractRows(response);
  if (rows.length) return rows[0];
  if (!response || typeof response !== "object") return fallback;
  const source = response as LeaveRecord;
  for (const nested of [source.data, source.result, source.message, source.leaveDetails, source.LeaveDetails]) {
    if (nested && typeof nested === "object" && !Array.isArray(nested)) return nested as LeaveRecord;
  }
  return source;
};

const getLeaveAttachments = (record: LeaveRecord) => {
  let source = getValue(record, [
    "attachments", "Attachments", "attachmentList", "AttachmentList", "leaveAttachments", "LeaveAttachments",
  ]);
  if (typeof source === "string") {
    const sourceText = source;
    try {
      source = JSON.parse(sourceText);
    } catch {
      source = sourceText.trim() ? [sourceText] : [];
    }
  }
  const files = Array.isArray(source) ? source : source && typeof source === "object" ? extractList(source) : [];
  return files.map((file, index) => {
    const item = typeof file === "string" ? { url: file } : file as LeaveRecord;
    return {
      id: String(getValue(item, ["nLeaveAttachmentId", "nAttachmentId", "AttachmentId", "id", "uid"]) || index),
      name: text(getValue(item, ["cFileName", "FileName", "fileName", "name"]), `Attachment ${index + 1}`),
      url: text(getValue(item, [
        "cUrl", "Url", "url", "cFileUrl", "FileUrl", "fileUrl",
        "cFilePath", "FilePath", "filePath", "cAttachment", "Attachment",
        "cAttachmentPath", "AttachmentPath", "attachmentPath", "cDocumentPath",
        "cPath", "path", "Location", "location",
      ]), ""),
    };
  }).map((file) => ({ ...file, url: resolveAttachmentUrl(file.url) }))
    .filter((file) => file.url);
};

const findLeaveId = (value: unknown, visited = new Set<unknown>()): number => {
  if (!value || typeof value !== "object" || visited.has(value)) return 0;
  visited.add(value);
  const source = value as LeaveRecord;
  const idKey = Object.keys(source).find((key) =>
    ["nleaveid", "leaveid"].includes(key.toLowerCase()),
  );
  for (const key of [idKey, "nLeaveId", "LeaveId", "leaveId", "id"]) {
    if (!key) continue;
    const id = Number(source[key]);
    if (Number.isFinite(id) && id > 0) return id;
  }
  for (const nested of Object.values(source)) {
    const id = findLeaveId(nested, visited);
    if (id) return id;
  }
  return 0;
};

const getAgentName = () => {
  try {
    const session = JSON.parse(sessionStorage.getItem("userSession") || "{}");
    const source = session?.data ?? session;
    return text(
      source?.cAgentName ?? source?.AgentName ?? source?.agentName ??
      source?.cUserName ?? source?.UserName ?? source?.name,
      "Testing Team",
    );
  } catch {
    return "Testing Team";
  }
};

const getSaveErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") return "Unable to save leave application";
  const response = (error as { response?: { data?: LeaveRecord } }).response;
  const data = response?.data;
  const errors = data?.errors;
  if (errors && typeof errors === "object") {
    const firstMessage = Object.values(errors as Record<string, unknown>)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .find((value) => typeof value === "string");
    if (firstMessage) return firstMessage;
  }
  return text(data?.title ?? data?.message, "Unable to save leave application");
};

const canModifyLeave = (record: LeaveRecord) => {
  const statusNumber = getValue(record, ["nStatus", "StatusId", "nLeaveStatus"]);
  if (statusNumber !== "") return Number(statusNumber) !== 1;
  const status = text(getValue(record, ["cStatus", "Status", "cLeaveStatus"]), "Pending").toLowerCase();
  return !status.includes("approv");
};

const LeaveApplicationPage = () => {
  const [applyForm] = Form.useForm<LeaveApplicationValues>();
  const [editForm] = Form.useForm<LeaveApplicationValues>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [appliedAt, setAppliedAt] = useState(dayjs());
  const [attachmentPreviews, setAttachmentPreviews] = useState<Array<{ id: string; url: string; file: File }>>([]);
  const [editAttachmentPreviews, setEditAttachmentPreviews] = useState<Array<{ id: string; url: string; file: File }>>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<LeaveRecord | null>(null);
  const attachmentStripRef = useRef<HTMLDivElement>(null);
  const detailAttachmentStripRef = useRef<HTMLDivElement>(null);

  const listPayload = useMemo(() => ({
    ...getRequestPayload(),
    pageNumber: 1,
    pageSize: 1000,
  }), []);
  const leaveListQuery = useAgentwiseLeaveList(listPayload);
  const saveLeave = useSaveLeave();
  const updateLeave = useUpdateLeave();
  const deleteLeaveAttachments = useDeleteLeaveAttachments();
  const deleteLeave = useDeleteLeave();
  const uploadAttachments = useUploadLeaveAttachments();
  const leaveId = Number(getValue(selectedLeave, ["nLeaveId", "LeaveId", "leaveId", "id"])) || 0;
  const detailsPayload = useMemo(() => {
    const { nCompanyId, cDbName, cSchemaName } = getRequestPayload();
    return {
      nLeaveId: leaveId,
      nCompanyId,
      cDbName,
      cSchemaName,
    };
  }, [leaveId]);
  const leaveDetailsQuery = useLeaveDetailsView(detailsPayload, leaveId > 0);

  const rows = useMemo(() => extractRows(leaveListQuery.data), [leaveListQuery.data]);
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => [
      getValue(row, ["cLeaveRefNo", "cRefNo", "RefNo", "ReferenceNo"]),
      getValue(row, ["cReason", "Reason", "cLeaveReason"]),
      getValue(row, ["cStatus", "Status", "cLeaveStatus"]),
    ].join(" ").toLowerCase().includes(term));
  }, [rows, search]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(filteredRows.length / pageSize)));
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const details = extractDetails(leaveDetailsQuery.data, selectedLeave ?? {});
  const detailAttachments = getLeaveAttachments(details);
  const detailValue = (keys: string[]) =>
    getValue(details, keys) || getValue(selectedLeave, keys);
  const detailLeaveType = text(detailValue(["cLeaveType", "LeaveType"]), "").toLowerCase();
  const detailPeriod = detailLeaveType.includes("fore")
    ? "forenoon"
    : detailLeaveType.includes("after")
      ? "afternoon"
      : "full";
  const visibleDetailAttachments = detailAttachments.filter(
    (attachment) => !deletedAttachmentIds.includes(attachment.id),
  );
  const canModifySelectedLeave = canModifyLeave(details);

  useEffect(() => {
    if (!selectedLeave) return;
    editForm.setFieldsValue({
      name: text(detailValue(["cName", "Name", "cAgentName", "AgentName"]), ""),
      reason: text(detailValue(["cReason", "Reason", "cLeaveReason"]), ""),
      period: detailPeriod,
      leaveFrom: toDateValue(detailValue(["dLeaveFrom", "dFromDate", "FromDate", "dLeaveFromDate"])) ?? dayjs(),
      leaveTo: toDateValue(detailValue(["dLeaveTo", "dToDate", "ToDate", "dLeaveToDate"])) ?? dayjs(),
    });
    // detailValue reads the details response and selected row covered below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailPeriod, editForm, leaveDetailsQuery.data, selectedLeave]);

  const closeDetails = () => {
    setSelectedLeave(null);
    setEditMode(false);
    setEditAttachmentPreviews([]);
    setDeletedAttachmentIds([]);
    editForm.resetFields();
  };

  const openLeaveDetails = (row: LeaveRecord, editing = false) => {
    setSelectedLeave(row);
    setEditMode(editing);
    setAppliedAt(dayjs());
    setEditAttachmentPreviews([]);
    setDeletedAttachmentIds([]);
  };

  const saveEditedLeave = async () => {
    const values = await editForm.validateFields();
    const requestPayload = getRequestPayload();
    const periodNumber = values.period === "full" ? 1 : values.period === "forenoon" ? 2 : 3;

    try {
      await updateLeave.mutateAsync({
        nLeaveId: leaveId,
        cName: values.name.trim(),
        cReason: values.reason.trim(),
        dLeaveFrom: values.leaveFrom.format("YYYY-MM-DD"),
        dLeaveTo: values.leaveTo.format("YYYY-MM-DD"),
        nLeaveType: periodNumber,
        nAgentId: requestPayload.nAgentId,
        nCompanyId: requestPayload.nCompanyId,
        cSchemaName: requestPayload.cSchemaName,
        cDbName: requestPayload.cDbName,
      });

      const numericDeleteIds = deletedAttachmentIds
        .map(Number)
        .filter((id) => Number.isFinite(id) && id > 0);
      if (numericDeleteIds.length) {
        await deleteLeaveAttachments.mutateAsync({
          nAttachmentIds: numericDeleteIds,
          nLeaveId: leaveId,
          cSchemaName: requestPayload.cSchemaName,
          cDbName: requestPayload.cDbName,
        });
      }

      if (editAttachmentPreviews.length) {
        const formData = new FormData();
        editAttachmentPreviews.forEach((attachment) => {
          formData.append("files", attachment.file, attachment.file.name);
        });
        formData.append("deleteIds", "");
        formData.append("nCompanyId", String(requestPayload.nCompanyId ?? 0));
        formData.append("nLeaveId", String(leaveId));
        formData.append("cDbName", String(requestPayload.cDbName ?? ""));
        formData.append("cSchemaName", String(requestPayload.cSchemaName ?? ""));
        await uploadAttachments.mutateAsync(formData);
      }

      message.success("Leave application updated successfully");
      setEditMode(false);
      setEditAttachmentPreviews([]);
      setDeletedAttachmentIds([]);
      await Promise.all([leaveDetailsQuery.refetch(), leaveListQuery.refetch()]);
    } catch (error) {
      message.error(getSaveErrorMessage(error));
    }
  };

  const confirmDeleteLeave = async () => {
    if (!deleteTarget) return;
    const targetLeaveId = Number(getValue(deleteTarget, ["nLeaveId", "LeaveId", "leaveId", "id"])) || 0;
    const requestPayload = getRequestPayload();
    try {
      await deleteLeave.mutateAsync({
        nLeaveId: targetLeaveId,
        nAgentId: requestPayload.nAgentId,
        nCompanyId: requestPayload.nCompanyId,
        cSchemaName: requestPayload.cSchemaName,
        cDbName: requestPayload.cDbName,
      });
      message.success("Leave application deleted successfully");
      if (Number(getValue(selectedLeave, ["nLeaveId", "LeaveId", "leaveId", "id"])) === targetLeaveId) {
        closeDetails();
      }
      setDeleteTarget(null);
      await leaveListQuery.refetch();
    } catch (error) {
      message.error(getSaveErrorMessage(error));
    }
  };

  const openApplyLeave = () => {
    const today = dayjs();
    setAppliedAt(today);
    setAttachmentPreviews([]);
    applyForm.resetFields();
    applyForm.setFieldsValue({
      name: getAgentName(),
      reason: "",
      period: "full",
      leaveFrom: today,
      leaveTo: today,
    });
    setApplyOpen(true);
  };

  const submitLeave = async () => {
    const values = await applyForm.validateFields();
    const requestPayload = getRequestPayload();
    const periodNumber = values.period === "full" ? 1 : values.period === "forenoon" ? 2 : 3;
    const periodName = values.period === "full" ? "Full Day" : values.period === "forenoon" ? "Forenoon" : "Afternoon";

    try {
      const response = await saveLeave.mutateAsync({
        ...requestPayload,
        nLeaveId: 0,
        nAgentId: requestPayload.nAgentId,
        nModifiedBy: requestPayload.id,
        cName: values.name.trim(),
        cReason: values.reason.trim(),
        cLeaveReason: values.reason.trim(),
        nLeaveType: periodNumber,
        nLeaveDayType: periodNumber,
        cLeaveType: periodName,
        cLeaveDayType: periodName,
        bFullDay: values.period === "full",
        bForenoon: values.period === "forenoon",
        bAfternoon: values.period === "afternoon",
        dAppliedOn: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
        dLeaveFrom: values.leaveFrom.format("YYYY-MM-DD"),
        dFromDate: values.leaveFrom.format("YYYY-MM-DD"),
        dLeaveTo: values.leaveTo.format("YYYY-MM-DD"),
        dToDate: values.leaveTo.format("YYYY-MM-DD"),
        bActive: true,
      });
      const savedLeaveId = findLeaveId(response);
      if (!savedLeaveId) throw new Error("Leave ID was not returned by the save API");

      if (attachmentPreviews.length) {
        const formData = new FormData();
        attachmentPreviews.forEach((attachment) => {
          formData.append("files", attachment.file, attachment.file.name);
        });
        formData.append("deleteIds", "");
        formData.append("nCompanyId", String(requestPayload.nCompanyId ?? 0));
        formData.append("nLeaveId", String(savedLeaveId));
        formData.append("cDbName", String(requestPayload.cDbName ?? ""));
        formData.append("cSchemaName", String(requestPayload.cSchemaName ?? ""));
        formData.append("nModifiedBy", String(requestPayload.id ?? 0));
        await uploadAttachments.mutateAsync(formData);
      }

      message.success("Leave application saved successfully");
      setApplyOpen(false);
      setAttachmentPreviews([]);
      applyForm.resetFields();
      await leaveListQuery.refetch();
    } catch (error) {
      message.error(getSaveErrorMessage(error));
    }
  };

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white p-5">
      <header className="mb-3 flex flex-none flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-xl font-medium text-slate-950">Leave Application</h1>
        <div className="flex items-center gap-2">
          <Input
            className="w-[210px]"
            prefix={<SearchOutlined className="text-slate-500" />}
            placeholder="Search"
            allowClear
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          />
          <Button
            type="primary"
            className="min-w-[116px]"
            style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
            onClick={openApplyLeave}
          >
            Apply Leave
          </Button>
        </div>
      </header>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-white">
        <div className="sticky top-0 z-10 grid grid-cols-[40px_90px_130px_minmax(180px,1fr)_80px_42px_42px] border-y border-slate-200 bg-white px-2 py-3 text-xs font-medium">
          <span>Srl</span><span>Ref No</span><span>Applied On</span><span>Reason</span><span>Status</span><span>Edit</span><span>Delete</span>
        </div>
        {leaveListQuery.isFetching ? (
          <div className="flex h-52 items-center justify-center"><Spin /></div>
        ) : leaveListQuery.isError ? (
          <div className="flex h-52 items-center justify-center text-sm text-red-500">Unable to load leave applications</div>
        ) : visibleRows.length ? visibleRows.map((row, index) => (
          <div
            key={String(getValue(row, ["nLeaveId", "LeaveId", "leaveId", "id"]) || `${safePage}-${index}`)}
            className="grid min-h-[52px] w-full grid-cols-[40px_90px_130px_minmax(180px,1fr)_80px_42px_42px] items-center border-b border-slate-100 bg-white px-2 text-left text-xs hover:bg-slate-50"
            role="button"
            tabIndex={0}
            onClick={() => openLeaveDetails(row)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") openLeaveDetails(row);
            }}
          >
            <span>{(safePage - 1) * pageSize + index + 1}</span>
            <span>{text(getValue(row, ["nLeaveRefNo", "cLeaveRefNo", "cRefNo", "RefNo", "ReferenceNo", "nLeaveId", "LeaveId"]))}</span>
            <span>{formatDateTime(getValue(row, ["dAppliedOn", "AppliedOn", "dAppliedDate", "dLeaveAppliedDate", "dCreatedDate", "dCreatedDateTime", "CreatedDate"]))}</span>
            <span className="pr-2">{text(getValue(row, ["cReason", "Reason", "cLeaveReason"]))}</span>
            <span className={(() => {
              const status = text(getValue(row, ["cStatus", "Status", "cLeaveStatus", "LeaveStatus"])).toLowerCase();
              return status.includes("approv") ? "text-green-600" : status.includes("reject") ? "text-red-500" : "text-orange-600";
            })()}>{text(getValue(row, ["cStatus", "Status", "cLeaveStatus", "LeaveStatus"]))}</span>
            <button
              type="button"
              aria-label="Edit leave"
              className="flex h-8 w-8 items-center justify-center bg-transparent"
              onClick={(event) => {
                event.stopPropagation();
                openLeaveDetails(row, canModifyLeave(row));
              }}
            >
              <EditOutlined />
            </button>
            <button
              type="button"
              aria-label="Delete leave"
              className="flex h-8 w-8 items-center justify-center bg-transparent text-red-500"
              onClick={(event) => {
                event.stopPropagation();
                setDeleteTarget(row);
              }}
            >
              <DeleteOutlined />
            </button>
          </div>
        )) : (
          <div className="flex h-44 items-center justify-center bg-white"><Empty description="No data" /></div>
        )}
      </div>

      {filteredRows.length ? (
        <TicketModulePagination
          className="mt-3 w-full flex-none"
          elevated={false}
          current={safePage}
          pageSize={pageSize}
          total={filteredRows.length}
          onChange={(nextPage, size) => { setPage(nextPage); setPageSize(size); }}
          onShowSizeChange={(_, size) => { setPageSize(size); setPage(1); }}
        />
      ) : null}

      <Drawer
        open={Boolean(selectedLeave)}
        placement="right"
        width={500}
        closable={false}
        onClose={closeDetails}
        styles={{
          header: { minHeight: 64, padding: "16px 20px" },
          body: { padding: "18px 20px" },
          footer: { padding: "14px 20px" },
        }}
        title={(
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Leave Application</span>
            <Button type="text" icon={<CloseOutlined />} onClick={closeDetails} />
          </div>
        )}
        footer={canModifySelectedLeave ? (
          <div className="flex items-center justify-end gap-2">
            {editMode ? (
              <>
                <Upload
                  accept="image/png,image/jpeg"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const reader = new FileReader();
                    reader.onload = () => setEditAttachmentPreviews((current) => [
                      ...current,
                      { id: `new-${file.uid}-${file.name}`, url: String(reader.result ?? ""), file },
                    ]);
                    reader.readAsDataURL(file);
                    return false;
                  }}
                >
                  <Button type="link" icon={<UploadOutlined />} className="mr-auto font-medium">
                    Upload Files <span className="ml-1 text-[10px]">(JPG or PNG)</span>
                  </Button>
                </Upload>
                <Button
                  type="primary"
                  className="ml-2 min-w-[74px]"
                  style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
                  loading={updateLeave.isPending || deleteLeaveAttachments.isPending || uploadAttachments.isPending}
                  onClick={saveEditedLeave}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button type="link" icon={<UploadOutlined />} className="mr-auto font-medium">
                  Upload Files <span className="ml-1 text-[10px]">(JPG or PNG)</span>
                </Button>
                <Button
                  className="h-9 w-9 p-0"
                  aria-label="Edit leave"
                  icon={<img src={editImage} alt="" className="h-4 w-4" />}
                  onClick={() => {
                    setAppliedAt(dayjs());
                    setEditMode(true);
                  }}
                />
                <Button
                  danger
                  type="primary"
                  className="h-9 w-9 p-0"
                  style={{ backgroundColor: "#ff3333", borderColor: "#ff3333" }}
                  aria-label="Delete leave"
                  icon={<img src={deleteImage} alt="" className="h-4 w-4" />}
                  onClick={() => setDeleteTarget(selectedLeave)}
                />
              </>
            )}
          </div>
        ) : null}
      >
        {leaveDetailsQuery.isFetching ? (
          <div className="flex h-52 items-center justify-center"><Spin /></div>
        ) : (
          <div>
            <div className="mb-3 text-right text-sm text-slate-600">
              {editMode
                ? appliedAt.format("DD/MM/YYYY hh : mm A")
                : formatDateTime(detailValue(["dAppliedOn", "AppliedOn", "dAppliedDate", "dLeaveAppliedDate", "dCreatedDate", "dCreatedDateTime", "CreatedDate"]))}
            </div>
            <Form form={editForm} layout="vertical" disabled={!editMode} requiredMark={false}>
              <Form.Item name="name" label="Name" className="mb-3">
                <Input readOnly />
              </Form.Item>
              <Form.Item
                name="reason"
                label="Reason"
                className="mb-2"
                rules={[{ required: true, whitespace: true, message: "Please enter reason" }]}
              >
                <Input.TextArea
                  rows={3}
                  style={{ minHeight: 86 }}
                />
              </Form.Item>
              <Form.Item name="period" className="mb-4">
                <Radio.Group>
                  <Radio value="full">Full Day</Radio>
                  <Radio value="forenoon">Forenoon</Radio>
                  <Radio value="afternoon">Afternoon</Radio>
                </Radio.Group>
              </Form.Item>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="leaveFrom" label="Leave From" className="mb-3" rules={[{ required: true }]}>
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item name="leaveTo" label="Leave To" className="mb-3" rules={[{ required: true }]}>
                  <DatePicker className="w-full" format="DD/MM/YYYY" />
                </Form.Item>
              </div>
            </Form>
            {(visibleDetailAttachments.length || editAttachmentPreviews.length) ? (
              <div className="mt-1 flex w-full items-center gap-2">
                <Button
                  type="text"
                  aria-label="Previous attachments"
                  icon={<LeftOutlined />}
                  onClick={() => detailAttachmentStripRef.current?.scrollBy({ left: -160, behavior: "smooth" })}
                />
                <div ref={detailAttachmentStripRef} className="flex max-w-[390px] gap-2 overflow-hidden scroll-smooth py-1">
                  <Image.PreviewGroup>
                    {visibleDetailAttachments.map((attachment) => (
                      <div key={attachment.id} className="relative h-[76px] w-[76px] flex-none rounded border bg-black shadow">
                        <Image
                          src={attachment.url}
                          alt={attachment.name}
                          width={74}
                          height={74}
                          className="rounded object-cover"
                          preview={{ mask: "Preview" }}
                        />
                        {editMode ? (
                          <button
                            type="button"
                            aria-label="Remove attachment"
                            className="absolute bottom-1 right-1 z-10 flex h-7 w-7 items-center justify-center rounded border border-red-500 bg-red-500"
                            onClick={() => setDeletedAttachmentIds((current) => [...current, attachment.id])}
                          >
                            <img src={deleteImage} alt="" className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))}
                    {editAttachmentPreviews.map((attachment) => (
                      <div key={attachment.id} className="relative h-[76px] w-[76px] flex-none rounded border bg-black shadow">
                        <Image src={attachment.url} alt="New leave attachment" width={74} height={74} className="rounded object-cover" preview={{ mask: "Preview" }} />
                        <button
                          type="button"
                          aria-label="Remove new attachment"
                          className="absolute bottom-1 right-1 z-10 flex h-7 w-7 items-center justify-center rounded border border-red-500 bg-red-500"
                          onClick={() => setEditAttachmentPreviews((current) => current.filter((item) => item.id !== attachment.id))}
                        >
                          <img src={deleteImage} alt="" className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </Image.PreviewGroup>
                </div>
                <Button
                  type="text"
                  aria-label="Next attachments"
                  icon={<RightOutlined />}
                  onClick={() => detailAttachmentStripRef.current?.scrollBy({ left: 160, behavior: "smooth" })}
                />
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-400">No attachments</div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        open={Boolean(deleteTarget)}
        title={<span className="text-lg font-medium">Are you sure?</span>}
        width={400}
        centered
        closable={false}
        maskClosable={!deleteLeave.isPending}
        onCancel={() => setDeleteTarget(null)}
        footer={(
          <div className="flex justify-end gap-2 pt-3">
            <Button
              className="min-w-[96px]"
              style={{ color: "#10b981", borderColor: "#10b981" }}
              disabled={deleteLeave.isPending}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              className="min-w-[92px]"
              style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
              loading={deleteLeave.isPending}
              onClick={confirmDeleteLeave}
            >
              Delete
            </Button>
          </div>
        )}
      >
        <p className="mb-2 text-sm text-slate-500">
          Do you want to delete these records? This process cannot be undone.
        </p>
      </Modal>

      <Drawer
        open={applyOpen}
        placement="right"
        width={500}
        closable={false}
        onClose={() => setApplyOpen(false)}
        styles={{
          header: { minHeight: 64, padding: "16px 20px" },
          body: { padding: "18px 20px" },
          footer: { padding: "14px 20px" },
        }}
        title={(
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Leave Application</span>
            <Button type="text" icon={<CloseOutlined />} onClick={() => setApplyOpen(false)} />
          </div>
        )}
        footer={(
          <div className="flex items-center justify-end gap-5">
            <Upload
              accept="image/png,image/jpeg"
              showUploadList={false}
              beforeUpload={(file) => {
                const reader = new FileReader();
                reader.onload = () => setAttachmentPreviews((current) => [
                  ...current,
                  { id: `${file.uid}-${file.name}`, url: String(reader.result ?? ""), file },
                ]);
                reader.readAsDataURL(file);
                return false;
              }}
            >
              <Button type="link" icon={<UploadOutlined />} className="font-medium">
                Upload Files <span className="ml-1 text-[10px]">(JPG or PNG)</span>
              </Button>
            </Upload>
            <Button
              type="primary"
              className="min-w-[74px]"
              style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
              loading={saveLeave.isPending || uploadAttachments.isPending}
              onClick={submitLeave}
            >
              Save
            </Button>
          </div>
        )}
      >
        <div className="mb-2 text-right text-sm text-slate-600">
          {appliedAt.format("DD/MM/YYYY hh : mm A")}
        </div>
        <Form form={applyForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="name"
            label="Name"
            className="mb-3"
            rules={[{ required: true, whitespace: true, message: "Please enter name" }]}
          >
            <Input readOnly />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Reason"
            className="mb-2"
            rules={[{ required: true, whitespace: true, message: "Please enter reason" }]}
          >
            <Input.TextArea rows={3} style={{ minHeight: 86 }} />
          </Form.Item>
          <Form.Item name="period" className="mb-3">
            <Radio.Group>
              <Radio value="full">Full Day</Radio>
              <Radio value="forenoon">Forenoon</Radio>
              <Radio value="afternoon">Afternoon</Radio>
            </Radio.Group>
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="leaveFrom"
              label="Leave From"
              rules={[{ required: true, message: "Please select leave from date" }]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item
              name="leaveTo"
              label="Leave To"
              dependencies={["leaveFrom"]}
              rules={[
                { required: true, message: "Please select leave to date" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const from = getFieldValue("leaveFrom") as dayjs.Dayjs | undefined;
                    return !value || !from || !value.isBefore(from, "day")
                      ? Promise.resolve()
                      : Promise.reject(new Error("Leave To cannot be before Leave From"));
                  },
                }),
              ]}
            >
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          {attachmentPreviews.length ? (
            <div className="mt-1 flex w-full items-center gap-2">
              <Button
                type="text"
                aria-label="Previous attachments"
                icon={<LeftOutlined />}
                onClick={() => attachmentStripRef.current?.scrollBy({ left: -160, behavior: "smooth" })}
              />
              <div ref={attachmentStripRef} className="flex max-w-[390px] gap-2 scroll-smooth py-1">
                <Image.PreviewGroup>
                  {attachmentPreviews.map((attachment) => (
                    <div key={attachment.id} className="relative h-[76px] w-[76px] flex-none rounded border bg-black shadow">
                      <Image
                        src={attachment.url}
                        alt="Leave attachment"
                        width={74}
                        height={74}
                        className="rounded object-cover"
                        preview={{ mask: "Preview" }}
                      />
                      <button
                        type="button"
                        aria-label="Remove attachment"
                        className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded border border-red-500 bg-red-500"
                        onClick={(event) => {
                          event.stopPropagation();
                          setAttachmentPreviews((current) => current.filter((item) => item.id !== attachment.id));
                        }}
                      >
                        <img src={deleteImage} alt="" className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </Image.PreviewGroup>
              </div>
              <Button
                type="text"
                aria-label="Next attachments"
                icon={<RightOutlined />}
                onClick={() => attachmentStripRef.current?.scrollBy({ left: 160, behavior: "smooth" })}
              />
            </div>
          ) : null}
        </Form>
      </Drawer>
    </section>
  );
};

export default LeaveApplicationPage;
