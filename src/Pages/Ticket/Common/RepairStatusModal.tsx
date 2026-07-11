import { useState } from "react";
import { Button, Form, Input, Modal, Upload, message } from "antd";
import type { UploadFile } from "antd";
import { CloseOutlined, DeleteOutlined, InboxOutlined } from "@ant-design/icons";

import { itemRepairApis } from "../../../Axios/ItemRepairApis";

const ALREADY_TRANSFERRED_MESSAGE =
  "This item has been transferred to another agent. Only the current assignee can update the status.";

interface RepairStatusModalProps {
  open: boolean;
  onClose: () => void;
  statusId: number;
  statusName: string;
  repairPayload: Record<string, any>;
  onUpdated?: () => void;
}

const RepairStatusModal = ({
  open,
  onClose,
  statusId,
  statusName,
  repairPayload,
  onUpdated,
}: RepairStatusModalProps) => {
  const [form] = Form.useForm();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [saving, setSaving] = useState(false);
  const clearFiles = () => {
    files.forEach((file) => {
      if (file.thumbUrl?.startsWith("blob:")) URL.revokeObjectURL(file.thumbUrl);
    });
    setFiles([]);
  };

  const resetAndClose = () => {
    form.resetFields();
    clearFiles();
    onClose();
  };

  const handleSubmit = async (values: any) => {
    const callPartId = Number(repairPayload?.nCallPartId || repairPayload?.CallPartId || 0);
    if (!callPartId) {
      message.error("Unable to update status: repair part reference is missing.");
      return;
    }

    const formData = new FormData();
    const attachments = files.map((file) => {
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
    const payload = {
      ...repairPayload,
      nCallPartId: callPartId,
      CallPartId: callPartId,
      nStatusId: statusId,
      StatusId: statusId,
      nItemRepairStatusId: statusId,
      cStatusName: statusName,
      StatusName: statusName,
      cAction: "Update Status",
      Action: "Update Status",
      cComment: String(values.Comment || "").trim(),
      Comment: String(values.Comment || "").trim(),
      attachments,
      cFileMappings: JSON.stringify(attachments),
    };

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
      }
    });
    files.forEach((file) => {
      if (file.originFileObj) formData.append("files", file.originFileObj, file.name);
    });

    try {
      setSaving(true);
      const response = await itemRepairApis.itemRepairAction(formData);
      const responseStatus = Number(response?.statusCode ?? response?.status ?? 200);
      if (responseStatus >= 400 || response?.success === false) {
        throw new Error(response?.message || response?.data?.message || "Unable to update item status");
      }
      message.success("Item status updated successfully");
      form.resetFields();
      clearFiles();
      onUpdated?.();
      onClose();
    } catch (error: any) {
      const responseData = error?.response?.data;
      const errorText = String(
        responseData?.message || responseData?.data?.message || responseData?.data || error?.message || "",
      );
      message.error(
        /transferred|current\s+assignee/i.test(errorText)
          ? ALREADY_TRANSFERRED_MESSAGE
          : errorText || "Unable to update item status",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={statusName}
      onCancel={resetAndClose}
      closeIcon={<CloseOutlined className="text-xl text-black" />}
      width={600}
      destroyOnClose
      footer={[
        <Button key="skip" onClick={resetAndClose}>Skip</Button>,
        <Button
          key="ok"
          type="primary"
          loading={saving}
          onClick={() => form.submit()}
          style={{ backgroundColor: "#20c77a", borderColor: "#20c77a" }}
        >
          Ok
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" requiredMark={false} onFinish={handleSubmit}>
        <Form.Item label="Comment" name="Comment">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Upload.Dragger
          accept=".jpg,.jpeg,.png"
          multiple
          fileList={files}
          showUploadList={false}
          beforeUpload={(file) => {
            if (!["image/jpeg", "image/png"].includes(file.type)) {
              message.error("Only JPEG and PNG files are allowed");
              return Upload.LIST_IGNORE;
            }
            if (file.size / 1024 / 1024 > 10) {
              message.error("Each file must be 10MB or smaller");
              return Upload.LIST_IGNORE;
            }
            setFiles((current) => [
              ...current,
              { ...file, originFileObj: file, thumbUrl: URL.createObjectURL(file) },
            ]);
            return false;
          }}
        >
          <InboxOutlined className="mb-2 text-2xl text-black" />
          <div>Choose files or drag &amp; drop it here <span className="text-xs text-slate-400">(JPEG, PNG, format, up to 10MB)</span></div>
          <Button type="primary" className="mt-3" style={{ backgroundColor: "black", borderColor: "black" }}>Choose</Button>
        </Upload.Dragger>

        {files.length > 0 ? (
          <div className="mt-2 space-y-2">
            {files.map((file) => (
              <div
                key={file.uid}
                className="flex min-h-[66px] items-center gap-3 rounded-lg border border-slate-300 bg-white px-2 py-2"
              >
                <img
                  src={file.thumbUrl}
                  alt=""
                  className="h-8 w-12 shrink-0 object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                  {file.name}
                </span>
                <Button
                  type="text"
                  aria-label={`Remove ${file.name}`}
                  icon={<DeleteOutlined />}
                  className="shrink-0 text-red-500 hover:!bg-red-50 hover:!text-red-600"
                  onClick={() => {
                    if (file.thumbUrl?.startsWith("blob:")) {
                      URL.revokeObjectURL(file.thumbUrl);
                    }
                    setFiles((current) => current.filter((item) => item.uid !== file.uid));
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

export default RepairStatusModal;
