import { Button, Modal, Radio, message } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";

import { ticketApis } from "../../../Axios/TicketsApi";
import { getApiImageBaseUrl } from "../../../Axios/config";
import { getRequestPayload } from "../../../Utils/requestPayload";

interface ShareInfoModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: number;
  ticketNo?: string;
  customerEmail?: string;
  attachments?: any[];
}

type ShareType = "summary" | "detailed";

const ShareInfoModal = ({
  open,
  onClose,
  ticketId,
  ticketNo,
  customerEmail,
  attachments = [],
}: ShareInfoModalProps) => {
  const [selectedType, setSelectedType] = useState<ShareType>("summary");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sessionPayload = useMemo(() => getRequestPayload(), []);

  const resolveAttachmentUrl = (file: any) => {
    const rawUrl =
      file?.cUrl ??
      file?.cFilePath ??
      file?.url ??
      file?.thumbUrl ??
      file?.path ??
      file?.FilePath ??
      file?.AttachmentPath ??
      "";

    if (!rawUrl) return "";

    if (/^https?:\/\//i.test(rawUrl)) {
      return rawUrl;
    }

    const base = getApiImageBaseUrl().replace(/\/$/, "");
    return `${base}/${String(rawUrl).replace(/^\//, "")}`;
  };

  useEffect(() => {
    if (open) {
      setSelectedType("summary");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    try {
      const attachmentUrl = resolveAttachmentUrl(attachments[0]);

      if (!customerEmail) {
        message.error("Customer email is missing");
        return;
      }

      if (!attachmentUrl) {
        message.error("Attachment URL is missing");
        return;
      }

      setIsSubmitting(true);

      await ticketApis.sendEstimateMail({
        ...sessionPayload,
        nTicketId: ticketId,
        TicketId: ticketId,
        Subject: `${selectedType === "summary" ? "Summary information" : "Detailed Information"} - Ticket No : ${ticketNo || ticketId}`,
        ToEmail: customerEmail,
        AttachmentUrl: attachmentUrl,
        cMailType: selectedType,
        MailType: selectedType,
        cType: selectedType,
        Type: selectedType,
        cSendType: selectedType,
        SendType: selectedType,
        cInfoType:
          selectedType === "summary"
            ? "Summary information"
            : "Detailed Information",
        InfoType:
          selectedType === "summary"
            ? "Summary information"
            : "Detailed Information",
      });

      message.success(
        selectedType === "summary"
          ? "Summary email sent successfully"
          : "Detailed email sent successfully"
      );
      onClose();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to send email"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={400}
      height={500}
      destroyOnClose
      title={null}
      closeIcon={<CloseOutlined className="text-xl text-black" />}
      className="ticket-share-modal"
      styles={{
        body: {
          padding: "14px 16px 16px",
        },
        header: {
          marginBottom: 0,
          padding: 0,
          borderBottom: "none",
        },
        content: {
          borderRadius: 10,
        },
      }}
    >
      <div className="space-y-4">
        <div className="text-[18px] font-medium text-slate-900">
          Choose a type of information
        </div>

        <div className="h-px w-full bg-slate-200" />

        <div className="text-sm text-slate-700 -pt-7">
          Please choose a type of ticket information to share
        </div>

        <Radio.Group
          value={selectedType}
          onChange={(event) => setSelectedType(event.target.value)}
          className="flex flex-col gap-6 pt-1"
        >
          <Radio value="summary" className="text-slate-400">
            Summary information
          </Radio>
          <Radio value="detailed" className="text-slate-400">
            Detailed Information
          </Radio>
        </Radio.Group>

        <div className="flex justify-end gap-3 pt-7">
          <Button
            onClick={onClose}
            className="!border-emerald-500 !text-emerald-500 hover:!border-emerald-600 hover:!text-emerald-600"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            className="!bg-emerald-500 !border-emerald-500 hover:!bg-emerald-600 hover:!border-emerald-600"
          >
            Ok
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ShareInfoModal;
