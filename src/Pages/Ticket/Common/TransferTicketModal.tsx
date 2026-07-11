import {
  Button,
  Form,
  Input,
  Modal,
  Avatar,
  Select,
  Upload,
  message,
} from "antd";
import type { UploadFile } from "antd";
import { CloseOutlined, DeleteOutlined, InboxOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";

import { useGetAgentDropdown } from "../../Master/Agent/Hooks";
import { useGetVendorDropdown } from "../../Master/VendorMaster/Hooks";
import { extractList } from "../../Master/Common/SimpleMasterUtils";
import { getRequestPayload } from "../../../Utils/requestPayload";
import { useTicketActions } from "../../../Hooks/Ticket/useTicketActions";
import { itemRepairApis } from "../../../Axios/ItemRepairApis";

const { TextArea } = Input;
const ALREADY_TRANSFERRED_MESSAGE =
  "This item has been transferred to another agent. Only the current assignee can update the status.";

const avatarColors = [
  "#22c55e",
  "#4ade80",
  "#86efac",
  "#16a34a",
  "#bbf7d0",
  "#15803d",
];

const getAvatarColor = (index: number) =>
  avatarColors[index % avatarColors.length];

const getErrorMessage = (error: any) => {
  const responseData = error?.response?.data;
  const validationErrors = responseData?.errors;

  if (validationErrors && typeof validationErrors === "object") {
    const messages = Object.values(validationErrors).reduce<string[]>(
      (allMessages, value) => {
        const nextValues = Array.isArray(value) ? value : [value];

        return allMessages.concat(
          nextValues
            .filter(Boolean)
            .map((item) => String(item))
        );
      },
      []
    );

    if (messages.length > 0) {
      return messages.join(" | ");
    }
  }

  return (
    responseData?.data?.message ||
    (typeof responseData?.data === "string" ? responseData.data : "") ||
    responseData?.message ||
    responseData?.title ||
    error?.message ||
    "Unable to transfer ticket"
  );
};

interface TransferTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: number;
  transferType?: "agent" | "vendor";
  transferContext?: "ticket" | "repair";
  repairPayload?: Record<string, any>;
  onTransferred?: () => void;
}

const TransferTicketModal = ({
  open,
  onClose,
  ticketId,
  transferType = "agent",
  transferContext = "ticket",
  repairPayload,
  onTransferred,
}: TransferTicketModalProps) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isRepairSaving, setIsRepairSaving] = useState(false);
  const isRepairTransfer = transferContext === "repair";
  const clearFiles = () => {
    fileList.forEach((file) => {
      if (file.thumbUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(file.thumbUrl);
      }
    });
    setFileList([]);
  };

  const sessionPayload = useMemo(() => getRequestPayload(), []);
  const agentPayload = useMemo(
    () => ({
      ...sessionPayload,
      pageNumber: 1,
      pageSize: 1000,
    }),
    [sessionPayload]
  );

  const { data: agentData, isFetching: isFetchingAgents } = useGetAgentDropdown(
    agentPayload,
    open && transferType === "agent"
  );
  const { data: vendorData, isFetching: isFetchingVendors } = useGetVendorDropdown(
    agentPayload,
    open && transferType === "vendor"
  );
  const agentOptions = useMemo(
    () =>
      extractList(agentData).map((agent: any) => ({
        value: String(
          agent?.nAgentId ??
            agent?.agentId ??
            agent?.id ??
            agent?.value ??
            ""
        ),
        label: (
          <div className="flex items-center gap-2">
            <Avatar
              size={24}
              style={{
                backgroundColor: getAvatarColor(
                  Number(
                    agent?.nAgentId ??
                      agent?.agentId ??
                      agent?.id ??
                      0
                  ) || 0
                ),
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {String(
                agent?.cAgentName ??
                  agent?.agentName ??
                  agent?.name ??
                  agent?.cName ??
                  "A"
              )
                .replace(/[^a-z0-9]/gi, "")
                .slice(0, 2)
                .toUpperCase() || "A"}
            </Avatar>
            <span>
              {agent?.cAgentName ??
                agent?.agentName ??
                agent?.name ??
                agent?.cName ??
                `Agent ${agent?.nAgentId ?? agent?.agentId ?? ""}`}
            </span>
          </div>
        ),
        searchLabel:
          agent?.cAgentName ??
          agent?.agentName ??
          agent?.name ??
          agent?.cName ??
          "",
      })),
    [agentData]
  );
  const vendorOptions = useMemo(
    () =>
      extractList(vendorData).map((vendor: any) => ({
        value: String(
          vendor?.nVendorId ?? vendor?.nVendorid ?? vendor?.vendorId ?? vendor?.id ?? vendor?.value ?? ""
        ),
        label:
          vendor?.cVendorName ?? vendor?.vendorName ?? vendor?.name ?? vendor?.cName ??
          `Vendor ${vendor?.nVendorId ?? vendor?.nVendorid ?? ""}`,
        searchLabel:
          vendor?.cVendorName ?? vendor?.vendorName ?? vendor?.name ?? vendor?.cName ?? "",
      })),
    [vendorData]
  );

  const { transferTicket } =
    useTicketActions();

  const handleSubmit = async (
    values: any
  ) => {
    const isVendorTransfer = transferType === "vendor";
    const agentId = Number(values.AgentId || 0);
    const vendorId = Number(values.VendorId || 0);
    const reason = String(values.TransferReason ?? "").trim();
    const transferringAgentId = Number(
      sessionPayload.nAgentId ?? sessionPayload.id ?? (sessionPayload as any).nUserId ?? 0
    );
    const attachments = fileList.map((file) => {
      const pathName =
        (file.originFileObj as any)?.webkitRelativePath ||
        (file as any)?.path ||
        file.name;

      return {
        cFileName: file.name,
        FileName: file.name,
        cFilePath: pathName,
        FilePath: pathName,
        pathName,
      };
    });

    if (isRepairTransfer) {
      if (!Number(repairPayload?.nCallPartId || repairPayload?.CallPartId || 0)) {
        message.error("Unable to transfer: repair part reference is missing.");
        return;
      }

      try {
        setIsRepairSaving(true);
        const actionPayload = {
          ...sessionPayload,
          ...repairPayload,
          nTicketId: ticketId,
          TicketId: ticketId,
          nAgentId: agentId,
          AgentId: agentId,
          nVendorId: vendorId,
          VendorId: vendorId,
          nTransferToAgentId: agentId,
          nTransferToVendorId: vendorId,
          bVendor: isVendorTransfer,
          bExternalVendor: isVendorTransfer,
          cAction: "Transfer",
          Action: "Transfer",
          cActionType: isVendorTransfer ? "Vendor" : "Agent",
          ActionType: isVendorTransfer ? "Vendor" : "Agent",
          cComment: reason,
          Comment: reason,
          cRemarks: reason,
          Remarks: reason,
          attachments,
          cFileMappings: JSON.stringify(attachments),
        };
        const formData = new FormData();

        Object.entries(actionPayload).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          formData.append(
            key,
            typeof value === "object" ? JSON.stringify(value) : String(value),
          );
        });
        fileList.forEach((file) => {
          const rawFile = file.originFileObj;
          if (rawFile) {
            formData.append("files", rawFile, file.name);
          }
        });

        const response = await itemRepairApis.itemRepairAction(formData);

        const responseStatus = Number(response?.statusCode ?? response?.status ?? 200);
        if (responseStatus >= 400 || response?.success === false) {
          throw new Error(
            response?.message ||
            response?.data?.message ||
            "Unable to transfer item",
          );
        }

        message.success("Item transferred successfully");
        form.resetFields();
        clearFiles();
        onTransferred?.();
        onClose();
      } catch (error: any) {
        const errorText = getErrorMessage(error);
        const isAlreadyTransferred =
          /already\s+transferred|has\s+been\s+transferred|current\s+assignee/i.test(errorText);
        message.error(isAlreadyTransferred ? ALREADY_TRANSFERRED_MESSAGE : errorText);
      } finally {
        setIsRepairSaving(false);
      }
      return;
    }

    transferTicket.mutate(
      {
        ...sessionPayload,
        TicketId: ticketId,
        nTicketId: ticketId,
        AgentId: agentId,
        nAgentId: transferringAgentId,
        nTransferringAgentId: transferringAgentId,
        TransferringAgentId: transferringAgentId,
        nTransferredByAgentId: transferringAgentId,
        TransferredByAgentId: transferringAgentId,
        nTransferToAgentId: agentId,
        TransferToAgentId: agentId,
        nTransferredToAgentId: agentId,
        TransferredToAgentId: agentId,
        nVendorId: vendorId,
        VendorId: vendorId,
        nTransferToVendorId: vendorId,
        TransferToVendorId: vendorId,
        cTransferType: isVendorTransfer ? "Vendor" : "Agent",
        TransferType: isVendorTransfer ? "Vendor" : "Agent",
        TransferReason: reason,
        cTransferReason: reason,
        Remarks: reason,
        cRemarks: reason,
        attachments,
        cFileMappings: JSON.stringify(attachments),
      },
      {
        onSuccess: () => {
          message.success(
            "Ticket Transferred Successfully"
          );

          form.resetFields();
          clearFiles();
          onTransferred?.();
          onClose();
        },
        onError: (error: any) => {
          message.error(getErrorMessage(error));
        },
      }
    );
  };

  return (
    <Modal
      title={
        isRepairTransfer
          ? transferType === "vendor" ? "Transferred Vendor" : "Transferred Agent"
          : "Transfer Ticket"
      }
      open={open}
      onCancel={onClose}
      footer={isRepairTransfer
        ? [
            <Button
              key="ok"
              type="primary"
              loading={isRepairSaving}
              onClick={() => form.submit()}
              className="min-w-[52px]"
              style={{ backgroundColor: "#20c77a", borderColor: "#20c77a" }}
            >
              Ok
            </Button>,
          ]
        : [
            <Button key="cancel" onClick={onClose}>Cancel</Button>,
            <Button key="save" type="primary" loading={transferTicket.isPending} onClick={() => form.submit()}>
              Save
            </Button>,
          ]}
      destroyOnClose
      afterClose={() => {
        form.resetFields();
        clearFiles();
      }}
      width={isRepairTransfer ? 600 : 400}
      closeIcon={<CloseOutlined className="text-xl text-black" />}

    >
      <Form
        form={form}
        layout="vertical" 
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <Form.Item
          label={transferType === "vendor" ? "Vendor" : isRepairTransfer ? "Assign to" : "Agent"}
          name={transferType === "vendor" ? "VendorId" : "AgentId"}
          rules={[
            {  
              required: true,
              message:
                transferType === "vendor" ? "Please Select Vendor" : "Please Select Agent",
            },
          ]}
        >
          <Select
            placeholder={transferType === "vendor" ? "Select Vendor" : "Select Agent"}
            options={transferType === "vendor" ? vendorOptions : agentOptions}
            loading={transferType === "vendor" ? isFetchingVendors : isFetchingAgents}
            showSearch
            optionFilterProp="searchLabel"
            filterOption={(input, option) =>
              String((option as any)?.searchLabel ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label={isRepairTransfer ? "Comment" : "Reason for Transfer"}
          name="TransferReason"
          rules={isRepairTransfer
            ? []
            : [{ required: true, message: "Please Enter Transfer Reason" }]}
        >
           <TextArea rows={isRepairTransfer ? 4 : 6} />
        </Form.Item>

        {isRepairTransfer ? <Upload.Dragger
          accept=".jpg,.jpeg,.png"
          multiple
          fileList={fileList}
          beforeUpload={(file) => {
            const isValidType = ["image/jpeg", "image/png"].includes(file.type);
            if (!isValidType) {
              message.error("Only JPEG and PNG files are allowed");
              return Upload.LIST_IGNORE;
            }
            if (file.size / 1024 / 1024 > 10) {
              message.error("Each file must be 10MB or smaller");
              return Upload.LIST_IGNORE;
            }
            setFileList((current) => [
              ...current,
              { ...file, originFileObj: file, thumbUrl: URL.createObjectURL(file) },
            ]);
            return false;
          }}
          onRemove={(file) => {
            if (file.thumbUrl?.startsWith("blob:")) {
              URL.revokeObjectURL(file.thumbUrl);
            }
            setFileList((current) => current.filter((item) => item.uid !== file.uid));
          }}
          showUploadList={false}
          className="block"
        >
          <InboxOutlined className="mb-2 text-2xl text-black" />
          <div className="text-sm text-slate-800">
            Choose files or drag &amp; drop it here
            <span className="ml-1 text-xs text-slate-400">(JPEG, PNG, format, up to 10MB)</span>
          </div>
          <Button
            type="primary"
            className="mt-3 bg-black"
            style={{ backgroundColor: "black", borderColor: "black" }}
          >
            Choose
          </Button>
        </Upload.Dragger> : null}

        {isRepairTransfer && fileList.length > 0 ? (
          <div className="mt-3 space-y-2">
            {fileList.map((file) => (
              <div
                key={file.uid}
                className="flex min-h-[64px] items-center justify-between rounded-lg border border-slate-300 bg-white px-2 py-2"
              >
                <img
                  src={file.thumbUrl}
                  alt=""
                  className="h-8 w-11 shrink-0 object-cover"
                />
                <Button
                  type="text"
                  aria-label={`Remove ${file.name}`}
                  icon={<DeleteOutlined />}
                  className="shrink-0 text-red-500 hover:!bg-red-50 hover:!text-red-600"
                  onClick={() => {
                    if (file.thumbUrl?.startsWith("blob:")) {
                      URL.revokeObjectURL(file.thumbUrl);
                    }
                    setFileList((current) => current.filter((item) => item.uid !== file.uid));
                  }}
                />
              </div>
            ))}
          </div>
        ) : null}
      </Form>
    </Modal>
  );
};

export default TransferTicketModal;
