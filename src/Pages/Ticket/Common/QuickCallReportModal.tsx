import { AudioOutlined, UploadOutlined } from "@ant-design/icons";
import { Checkbox, Form, Input, Modal, Radio, Select, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useTicketMutations } from "../../../Hooks/Ticket/useTicketMutations";
import { useGetActiveFollowupModes } from "../../Master/FollowUpMode/Hooks";
import { useGetStatuses } from "../../Master/StatusMaster/Hooks";
import { useCheckAmcExpiry } from "../../Master/CustomerMaster/Hooks";
import { extractList } from "../../Master/Common/SimpleMasterUtils";
import FollowupDateTimePicker from "./FollowupDateTimePicker";
import RightSideDrawer from "../../../ui/Drawer/RightSideDrawer";
import type { FormInstance } from "antd";

const { TextArea } = Input;

const requiredTicketFields = [
  { names: ["CustomerId", "nCustomerId", "cCustomerName", "CustomerName"], label: "Customer" },
  {
    names: ["ContactPerson", "cContactPerson", "ContactName", "cContactName"],
    label: "Contact Person",
  },
  {
    names: ["ContactNo", "ContactNumber", "cContactNumber", "PhoneNo", "cPhoneNo"],
    label: "Contact Number",
  },
  { names: ["Email", "cEmail"], label: "Email" },
  { names: ["IssueSummary", "TicketSummary", "cTicketSummary"], label: "Issue Summary" },
  { names: ["Description", "cDescription"], label: "Description" },
];

const requiredQuickCallFields = [
  { name: "Summary", label: "Summary" },
  { name: "Comment", label: "Comment" },
];

const isEmptyValue = (value: any) =>
  value === undefined ||
  value === null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

const getTextValue = (...values: any[]) => {
  const value = values.find(
    (item) => item !== undefined && item !== null && String(item).trim() !== "",
  );

  return value === undefined || value === null ? "" : String(value);
};

const getNumberValue = (...values: any[]) => {
  const value = values.find(
    (item) => item !== undefined && item !== null && item !== "",
  );

  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeStatusLabel = (value: any) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

const CLOSED_STATUS_ACTIONS = [
  { key: "resolved", label: "Close Resolved", value: 1 },
  { key: "unresolved", label: "Close Unresolved", value: 2 },
  { key: "incorrect", label: "Customer Data Incorrect", value: 3 },
];

const resolveAttachmentUrl = (file: any) =>
  file?.cUrl ??
  file?.cFilePath ??
  file?.url ??
  file?.path ??
  file?.Location ??
  file?.location ??
  "";

const getFirstTicketValue = (record: Record<string, any>, keys: string[]) =>
  keys.reduce<any>(
    (found, key) =>
      found !== undefined && found !== null && found !== "" ? found : record?.[key],
    undefined,
  );

const parseDateValue = (value: any) => {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value;

  const parsed = dayjs(value);
  if (parsed.isValid()) return parsed;

  const alt = dayjs(String(value).replace(/\//g, "-"));
  return alt.isValid() ? alt : null;
};

interface QuickCallReportModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: number;
  ticketForm?: FormInstance;
  ticketValues?: Record<string, any>;
  selectedCustomerName?: string;
  assignedAgentDetails?: any[];
  sessionPayload: Record<string, any>;
  skipAmcWarningOnSave?: boolean;
  drawerWidth?: number;
  onSaved?: (result: {
    statusId: number;
    statusLabel: string;
    ticketId: number;
    nFollowupId?: number;
  }) => void;
}

const QuickCallReportModal = ({
  open,
  onClose,
  ticketId,
  ticketForm,
  ticketValues: ticketValuesProp,
  selectedCustomerName,
  sessionPayload,
  skipAmcWarningOnSave = false,
  drawerWidth = 430,
  onSaved,
}: QuickCallReportModalProps) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { quickCallReportSave } = useTicketMutations();
  const { mutateAsync: checkAmcExpiry } = useCheckAmcExpiry();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFilesCount, setSelectedFilesCount] = useState(0);
  const [closeAction, setCloseAction] = useState<string>("");

  const resolvedTicketId = Number(
    ticketId ??
      ticketValuesProp?.nTicketId ??
      ticketValuesProp?.TicketId ??
      ticketValuesProp?.ticketId ??
      0
  ) || 0;
  const attachmentFiles = useMemo(() => {
    const rawAttachments =
      ticketValuesProp?.attachments ??
      ticketValuesProp?.Attachments ??
      ticketValuesProp?.files ??
      [];

    return (Array.isArray(rawAttachments) ? rawAttachments : [])
      .map((file: any, index: number) => ({
        id:
          file?.uid ??
          file?.nAttachmentId ??
          file?.AttachmentId ??
          file?.id ??
          index,
        name:
          file?.name ??
          file?.cFileName ??
          file?.FileName ??
          file?.cDocumentName ??
          "File",
        url: resolveAttachmentUrl(file),
      }))
      .filter((file: any) => String(file.url ?? "").trim());
  }, [ticketValuesProp]);

  const statusPayload = useMemo(
    () => ({
      ...sessionPayload,
      pageNumber: 1,
      pageSize: 1000,
    }),
    [sessionPayload],
  );

  const { data: statusData } = useGetStatuses(statusPayload);
  const { data: followupModeData } = useGetActiveFollowupModes(statusPayload);

  const engagementOptions = useMemo(
    () =>
      extractList(followupModeData)
        .map((item: any) => {
          const value = getTextValue(
            item?.cCallModeName,
            item?.cCallModeShName,
            item?.cModeShName,
            item?.cCallreportModeShName,
            item?.name,
            item?.label,
          );

          const label = getTextValue(
            item?.cCallModeName,
            item?.cCallModeShName,
            item?.cModeShName,
            item?.cCallreportModeShName,
            item?.name,
            item?.label,
          );

          if (!value || !label) return null;

          return {
            value,
            label,
            id: getNumberValue(
              item?.nCallModeId,
              item?.nCallReportModeId,
              item?.nCallreportModeId,
              item?.id,
              item?.value,
            ),
            shortName: getTextValue(
              item?.cCallModeShName,
              item?.cModeShName,
              item?.cCallreportModeShName,
            ),
          };
        })
        .filter(
          (
            item,
          ): item is {
            value: string;
            label: string;
            id: number;
            shortName: string;
          } => Boolean(item),
        ),
    [followupModeData],
  );

  const statusOptions = useMemo(
    () =>
      extractList(statusData)
        .map((item: any) => {
          const value = getNumberValue(
            item?.nTicketStatusId,
            item?.nTicketStatusid,
            item?.TicketStatusId,
            item?.nStatusId,
            item?.StatusId,
            item?.id,
            item?.value,
          );

          const label = getTextValue(
            item?.cTicketStatusName,
            item?.cTicketStatus,
            item?.TicketStatusName,
            item?.TicketStatus,
            item?.cStatusName,
            item?.cStatus,
            item?.name,
            item?.label,
          );

          if (!value || !label) return null;

          return {
            value,
            label,
          };
        })
        .filter(
          (
            item,
          ): item is {
            value: number;
            label: string;
          } => Boolean(item),
        ),
    [statusData],
  );

  const selectedStatusId = Form.useWatch("UpdateStatus", form);
  const selectedStatusLabel = useMemo(
    () =>
      statusOptions.find(
        (item: any) => Number(item?.value) === Number(selectedStatusId ?? 0),
      )?.label ?? "",
    [selectedStatusId, statusOptions],
  );
  const normalizedStatusLabel = useMemo(
    () => normalizeStatusLabel(selectedStatusLabel),
    [selectedStatusLabel],
  );
  const isClosedStatus =
    normalizedStatusLabel.includes("closed") ||
    normalizedStatusLabel.includes("close");
  const hasFollowupData = useMemo(() => {
    const values = ticketForm?.getFieldsValue(true) ?? ticketValuesProp ?? {};

    return Boolean(
      values?.NextFollowupDate ||
        values?.dNextFollowupDate ||
        values?.FollowupDate ||
        values?.ToDo ||
        values?.cToDo ||
        values?.OnsiteRequired ||
        values?.bOnsiteRequired ||
        values?.bNeedOnsite,
    );
  }, [ticketForm, ticketValuesProp, open]);
  const needsFollowupFields =
    normalizedStatusLabel.includes("onhold") ||
    normalizedStatusLabel.includes("pending") ||
    normalizedStatusLabel.includes("processing") ||
    hasFollowupData;

  useEffect(() => {
    if (!open) return;

    const ticketValues = ticketForm?.getFieldsValue(true) ?? ticketValuesProp ?? {};
    const defaultStatusId = getNumberValue(
      ticketValues?.nTicketStatus,
      ticketValues?.TicketStatus,
      ticketValues?.nStatusId,
      ticketValues?.StatusId,
      sessionPayload.nTicketStatus,
      5,
    );
    const ticketStatusLabel = getTextValue(
      ticketValues?.cTicketStatus,
      ticketValues?.TicketStatus,
      ticketValues?.Status,
      ticketValues?.cStatus,
    );
    const matchedStatus = statusOptions.find(
      (item) =>
        normalizeStatusLabel(item.label) === normalizeStatusLabel(ticketStatusLabel),
    );
    const currentEngagementMode = getTextValue(
      ticketValues?.cCallMode,
      ticketValues?.CallMode,
      ticketValues?.cCallreportMode,
      ticketValues?.CallreportMode,
      ticketValues?.cCallModeName,
      ticketValues?.cCallModeShName,
      ticketValues?.cCallreportModeName,
      ticketValues?.cCallreportModeShName,
      ticketValues?.EngagementMode,
      ticketValues?.engagementMode,
    );
    const matchedEngagementMode = engagementOptions.find((item) => {
      const normalizedItem = normalizeStatusLabel(item.label);
      const normalizedValue = normalizeStatusLabel(currentEngagementMode);
      return normalizedItem === normalizedValue;
    });

    form.setFieldsValue({
      EngagementMode:
        matchedEngagementMode?.value ??
        currentEngagementMode ??
        engagementOptions[0]?.value ??
        "Mail",
      ContactPersonName: getTextValue(
        ticketValues?.ContactPerson,
        ticketValues?.cContactPerson,
      ),
      MobileNumber: getTextValue(
        ticketValues?.ContactNo,
        ticketValues?.ContactNumber,
        ticketValues?.cContactNumber,
      ),
      Email: getTextValue(ticketValues?.Email, ticketValues?.cEmail),
      Summary: getTextValue(
        ticketValues?.IssueSummary,
        ticketValues?.TicketSummary,
        ticketValues?.cTicketSummary,
        ticketValues?.Summary,
        ticketValues?.cSummary,
      ),
      Comment: getTextValue(
        ticketValues?.Comment,
        ticketValues?.Comments,
        ticketValues?.Description,
        ticketValues?.cDescription,
        ticketValues?.cComment,
        ticketValues?.cComments,
      ),
      UpdateStatus:
        matchedStatus?.value ??
        statusOptions.find((item) => Number(item?.value) === defaultStatusId)?.value ??
        undefined,
      ToDo: getTextValue(ticketValues?.ToDo, ticketValues?.cToDo, ticketValues?.Todo),
      NextFollowupDate: parseDateValue(
        ticketValues?.NextFollowupDate ??
          ticketValues?.dNextFollowupDate ??
          ticketValues?.FollowupDate ??
          undefined,
      ),
      OnsiteRequired: Boolean(
        ticketValues?.OnsiteRequired ??
          ticketValues?.bOnsiteRequired ??
          ticketValues?.bNeedOnsite ??
          false,
      ),
    });
    setSelectedFilesCount(0);
    setCloseAction("");
  }, [
    engagementOptions,
    form,
    open,
    sessionPayload.nTicketStatus,
    statusOptions,
    ticketForm,
      ticketValuesProp,
      open,
    ]);

  const validateBeforeSubmit = async (modalValues: any, ticketValues: any) => {
    const missingFields = [
      ...requiredTicketFields.filter(({ names }) =>
        isEmptyValue(getFirstTicketValue(ticketValues ?? {}, names)),
      ),
      ...requiredQuickCallFields.filter(({ name }) => isEmptyValue(modalValues?.[name])),
    ];

    if (needsFollowupFields) {
      if (isEmptyValue(modalValues?.ToDo)) {
        missingFields.push({ name: "ToDo", label: "To Do" });
      }
      if (isEmptyValue(modalValues?.NextFollowupDate)) {
        missingFields.push({
          name: "NextFollowupDate",
          label: "Next Follow up Date & Time",
        });
      }
    }

    const allMissingFields = [...missingFields.map((field) => field.label)];

    if (allMissingFields.length > 0) {
      message.error(
        `Please fill the required fields before saving: ${allMissingFields.join(", ")}`,
      );
      return false;
    }

    if (ticketForm) {
      await ticketForm.validateFields(
        requiredTicketFields
          .map((field) => field.names[0])
          .filter((name) => name in (ticketValues ?? {})),
      );
    }

    return true;
  };

  const isUnderAmcOrWarranty = (response: any) => {
    const data = response?.data ?? response ?? {};
    const messageText = String(
      data?.message ?? data?.title ?? "",
    ).toLowerCase();
    const amcFlag = Boolean(
      data?.bUnderAmc ??
        data?.bAMC ??
        data?.amc ??
        data?.underAmc ??
        data?.isUnderAmc,
    );
    const warrantyFlag = Boolean(
      data?.bUnderWarranty ??
        data?.bWarranty ??
        data?.warranty ??
        data?.underWarranty ??
        data?.isUnderWarranty,
    );
    const successFlag = data?.success ?? data?.isSuccess ?? data?.status;

    return (
      amcFlag ||
      warrantyFlag ||
      successFlag === true ||
      String(successFlag).toLowerCase() === "true" ||
      (!messageText.includes("not under") &&
        !messageText.includes("not available"))
    );
  };

  const showAmcWarning = () =>
    new Promise<void>((resolve) => {
      Modal.warning({
        title: "Warning",
        centered: true,
        content: "Asset is not under AMC or Warranty",
        okText: "Ok",
        onOk: () => resolve(),
      });
    });

  const handleSubmit = async (values: any, selectedCloseAction = closeAction) => {
    const modalValues = form.getFieldsValue(true);
    const ticketValues =
      ticketForm?.getFieldsValue(true) ?? ticketValuesProp ?? {};
    const canContinue = await validateBeforeSubmit(modalValues, ticketValues);
    if (!canContinue) return;

    const followupValue = ticketValues.FollowupDate;
    const normalizedFollowupDate = dayjs.isDayjs(followupValue)
      ? followupValue.format("YYYY-MM-DD HH:mm:ss")
      : followupValue;
    const nextFollowupDate = values.NextFollowupDate;
    const normalizedNextFollowupDate = dayjs.isDayjs(nextFollowupDate)
      ? nextFollowupDate.format("YYYY-MM-DD HH:mm:ss")
      : nextFollowupDate;
    const resolvedCloseAction = CLOSED_STATUS_ACTIONS.find(
      (item) => item.key === selectedCloseAction,
    );
    const selectedEngagementMode = engagementOptions.find(
      (item: any) => String(item?.value) === String(values.EngagementMode ?? ""),
    );
    const selectedStatusValue = Number(selectedStatusId ?? 0) || 0;
    const resolvedOnsiteRequired = Boolean(
      modalValues?.OnsiteRequired ??
        ticketValues?.OnsiteRequired ??
        ticketValues?.bOnsiteRequired ??
        ticketValues?.bNeedOnsite ??
        ticketValues?.bOnSite ??
        false,
    );
    const customerId = Number(
      getFirstTicketValue(ticketValues ?? {}, [
        "CustomerId",
        "nCustomerId",
        "customerId",
      ]) ?? sessionPayload.nCustomerId ?? 0,
    ) || 0;
    const assetId = Number(
      getFirstTicketValue(ticketValues ?? {}, [
        "AssetId",
        "nAssetId",
        "assetId",
      ]) ?? sessionPayload.nAssetId ?? 0,
    ) || 0;

    try {
      if (!skipAmcWarningOnSave) {
        if (assetId > 0) {
          const eligibility = await checkAmcExpiry({
            ...sessionPayload,
            CustomerId: customerId,
            customerId,
            nCustomerId: customerId,
            AssetId: assetId,
            assetId,
            nAssetId: assetId,
          });

          if (!isUnderAmcOrWarranty(eligibility)) {
            await showAmcWarning();
          }
        } else {
          await showAmcWarning();
        }
      }
    } catch {
      if (!skipAmcWarningOnSave) {
        await showAmcWarning();
      }
    }

    try {
      const savedResponse = await quickCallReportSave.mutateAsync(
        {
          nFollowupId: 0,
          nTicketId: resolvedTicketId,
          nCompanyId: Number(sessionPayload.nCompanyId ?? 0) || 0,
          nCustomerId: customerId,
          nCallMode: Number(selectedEngagementMode?.id ?? 0) || 0,
          cCustomerName:
            selectedCustomerName ??
            getFirstTicketValue(ticketValues ?? {}, [
              "CustomerName",
              "cCustomerName",
            ]) ??
            "",
          cContactPerson:
            getFirstTicketValue(ticketValues ?? {}, [
              "ContactPerson",
              "cContactPerson",
              "ContactName",
              "cContactName",
            ]) ?? "",
          cContactNumber:
            getFirstTicketValue(ticketValues ?? {}, [
              "ContactNo",
              "ContactNumber",
              "cContactNumber",
              "PhoneNo",
              "cPhoneNo",
            ]) ?? "",
          cEmail: getFirstTicketValue(ticketValues ?? {}, ["Email", "cEmail"]) ?? "",
          cSummary: values.Summary ?? "",
          cComments: values.Comment ?? "",
          cTodo: values.ToDo ?? "",
          dNextFollowupDate:
            normalizedNextFollowupDate ?? normalizedFollowupDate ?? "",
          dFollowupDate: normalizedNextFollowupDate ?? normalizedFollowupDate ?? "",
          bOnSite: resolvedOnsiteRequired,
          OnsiteRequired: resolvedOnsiteRequired,
          bOnsiteRequired: resolvedOnsiteRequired,
          bNeedOnsite: resolvedOnsiteRequired,
          nStatus: selectedStatusValue,
          nCloseStatus: resolvedCloseAction?.value ?? 5,
          bClosedTrip: false,
          cinLocation: "",
          ninLongitude: 0,
          ninlattitude: 0,
          partList: [],
          repairStatusList: [],
          cSchemaName: sessionPayload.cSchemaName ?? "",
          cDbName: sessionPayload.cDbName ?? sessionPayload.dbName ?? "",
          nCreatedBy:
            Number(
              sessionPayload.nCreatedBy ??
                sessionPayload.nAgentId ??
                sessionPayload.id ??
                sessionPayload.nModifiedBy ??
                sessionPayload.nUserId ??
                0,
            ) || 0,
        } as any
      );

      const savedStatusId =
        selectedStatusValue || Number(sessionPayload.nTicketStatus ?? 5) || 5;
      const savedStatusLabel =
        statusOptions.find(
          (item) => Number(item?.value) === Number(savedStatusId),
        )?.label ?? selectedStatusLabel ?? "";

      // Extract the followup ID from the API response so the bill page can use it directly
      const savedFollowupId = Number(
        savedResponse?.data?.nFollowupId ??
        savedResponse?.data?.nfollowupid ??
        savedResponse?.data?.nFollowUpId ??
        savedResponse?.data?.FollowupId ??
        savedResponse?.data?.nWorksheetId ??
        savedResponse?.data?.nworksheetid ??
        savedResponse?.data?.WorksheetId ??
        savedResponse?.nFollowupId ??
        savedResponse?.nfollowupid ??
        savedResponse?.nFollowUpId ??
        savedResponse?.FollowupId ??
        savedResponse?.nWorksheetId ??
        savedResponse?.nworksheetid ??
        savedResponse?.WorksheetId ??
        0,
      ) || 0;

      onSaved?.({
        statusId: savedStatusId,
        statusLabel: savedStatusLabel,
        ticketId: resolvedTicketId,
        nFollowupId: savedFollowupId || undefined,
      });

      message.success("Call Report Saved Successfully");
      form.resetFields();
      onClose();
      if (!onSaved) {
        navigate("/tickets");
      }
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.title ||
          error?.message ||
          "Unable to save quick call report"
      );
    }
  };

  const handleSaveClick = () => {
    form.submit();
  };

  const handleCloseAction = async (actionKey: string) => {
    setCloseAction(actionKey);
    const values = await form.validateFields(["Summary", "Comment"]);
    await handleSubmit({ ...form.getFieldsValue(true), ...values }, actionKey);
  };

  return (
    <RightSideDrawer
      title={
        <span className="text-[17px] font-medium text-slate-800">
          Call Report <span className="text-[12px] font-normal text-slate-500">(Work Sheet)</span>
        </span>
      }
      open={open}
      onClose={onClose}
      width={420}
      className="quick-call-drawer"
      bodyStyle={{
        padding: 0,
        overflow: "hidden",
      }}
      footer={
        isClosedStatus ? null :
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={quickCallReportSave.isPending}
            className="inline-flex h-8 items-center justify-center rounded-[4px] bg-emerald-500 px-5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {quickCallReportSave.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
        onFinishFailed={() => {
          message.error("Please fill the required call report fields before saving.");
        }}
        className="quick-call-report-form flex h-full min-h-0 flex-col"
      >
        <div className="simple-master-drawer-scroll flex-1 overflow-y-auto overflow-x-hidden bg-white pb-16">
          <div className="px-4 pb-4 pt-3">
            <Form.Item label="Mode of Engagement" name="EngagementMode" className="mb-4">
              <Radio.Group className="flex flex-wrap gap-x-6 gap-y-2">
                {(engagementOptions.length
                  ? engagementOptions
                  : []
                ).map((option: any) => (
                  <Radio key={String(option.value)} value={option.value}>
                    {option.label}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="Contact Person Name"
              name="ContactPersonName"
              className="mb-4"
              rules={[
                {
                  required: true,
                  message: "Please enter Contact Person Name",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr]">
              <Form.Item
                label="Mobile Number"
                name="MobileNumber"
                className="mb-4"
                rules={[
                  {
                    required: true,
                    message: "Please enter Mobile Number",
                  },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Email"
                name="Email"
                className="mb-4"
                rules={[
                  {
                    required: true,
                    message: "Please enter Email",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </div>

            <Form.Item
              label="Summary"
              name="Summary"
              className="mb-4"
              rules={[
                {
                  required: true,
                  message: "Please enter Summary",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Comments"
              name="Comment"
              className="mb-4"
              rules={[
                {
                  required: true,
                  message: "Please enter Comments",
                },
              ]}
            >
              <TextArea rows={4} className="!resize-none" />
            </Form.Item>

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between text-sky-600">
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-medium"
                >
                  <UploadOutlined />
                  Upload Files
                  {selectedFilesCount > 0 ? ` (${selectedFilesCount})` : ""}
                </button>

                <button
                  type="button"
                  onClick={() => message.info("Voice note is not configured yet")}
                  className="inline-flex items-center gap-1.5 text-xs font-medium"
                >
                  <AudioOutlined />
                  Voice note
                </button>
              </div>

              <input
                ref={uploadInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  setSelectedFilesCount(event.target.files?.length ?? 0);
                }}
              />

              {attachmentFiles.length > 0 ? (
                <div className="pb-2 pt-1">
                  <div className="mb-2 text-sm font-medium text-slate-700">Files</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-6 w-6 items-center justify-center text-lg leading-none text-slate-400"
                    >
                      &#8249;
                    </button>
                    <div className="flex flex-1 items-center gap-2 overflow-hidden">
                      {attachmentFiles.slice(0, 4).map((file: any) => (
                        <div
                          key={file.id}
                          className="h-16 w-16 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={file.url}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="flex h-6 w-6 items-center justify-center text-lg leading-none text-slate-400"
                    >
                      &#8250;
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-2 bg-[#eaf5ff] px-4 pb-6 pt-3">
            <Form.Item label="Update Status" name="UpdateStatus" className="mb-3">
              <Select
                allowClear
                placeholder="Select Status"
                options={statusOptions}
                suffixIcon={<span className="text-slate-500">{">"}</span>}
              />
            </Form.Item>

            {needsFollowupFields ? (
              <div className="mt-3 space-y-3">
                <Form.Item
                  label="To Do"
                  name="ToDo"
                  rules={[
                    {
                      required: true,
                      message: "Please enter To Do",
                    },
                  ]}
                  className="mb-0"
                >
                  <TextArea rows={4} className="!resize-none" />
                </Form.Item>

                <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                  <Form.Item
                    label="Next Follow up Date & Time"
                    name="NextFollowupDate"
                    rules={[
                      {
                        required: true,
                        message: "Please select follow up date and time",
                      },
                    ]}
                    className="mb-0"
                  >
                    <FollowupDateTimePicker />
                  </Form.Item>

                  <Form.Item
                    name="OnsiteRequired"
                    valuePropName="checked"
                    className="mb-1"
                  >
                    <Checkbox>Onsite Required</Checkbox>
                  </Form.Item>
                </div>
              </div>
            ) : null}

            {isClosedStatus ? (
              <div className="mt-3 space-y-2">
                {CLOSED_STATUS_ACTIONS.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    disabled={quickCallReportSave.isPending}
                    onClick={() => void handleCloseAction(action.key)}
                    className="flex h-8 w-full items-center justify-center rounded-[3px] border border-sky-400 bg-white text-sm font-medium text-sky-600 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Form>

    </RightSideDrawer>
  );
};

export default QuickCallReportModal;
