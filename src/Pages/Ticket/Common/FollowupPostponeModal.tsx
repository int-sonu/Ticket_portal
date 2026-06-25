import { Button, Input, Modal, message } from "antd";
import { AudioOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useTicketMutations } from "../../../Hooks/Ticket/useTicketMutations";
import { getRequestPayload } from "../../../Utils/requestPayload";
import InlineFollowupDateTimePickerV2 from "./InlineFollowupDateTimePickerV2";

const { TextArea } = Input;

interface FollowupModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: number;
}

const FollowupPostponeModal = ({
  open,
  onClose,
  ticketId,
}: FollowupModalProps) => {
  const { postponeTicket } = useTicketMutations();
  const [followupDate, setFollowupDate] = useState<Dayjs | null>(dayjs());
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (open) {
      setFollowupDate(dayjs());
      setRemarks("");
    }
  }, [open]);

  const handleCancel = () => {
    onClose();
  };

  const handleSave = () => {
    if (!followupDate) {
      message.error("Select follow up date and time");
      return;
    }

    const note = remarks.trim();
    if (!note) {
      message.error("Enter postpone comments");
      return;
    }

    const requestPayload = getRequestPayload();
    const postponeDate = followupDate.format("YYYY-MM-DD HH:mm:ss");

    postponeTicket.mutate(
      {
        nCompanyId: Number(requestPayload.nCompanyId ?? 0),
        cSchemaName: requestPayload.cSchemaName ?? "",
        cDbName: requestPayload.cDbName ?? "",
        nAgentId: Number(requestPayload.nAgentId ?? requestPayload.id ?? 0),
        nTicketId: ticketId,
        dPostponeDate: postponeDate,
        cPostponeNote: note,
      } as any,
      {
        onSuccess: () => {
          message.success("Postponed Successfully");
          onClose();
        },
      }
    );
  };

  return (
    <Modal
      open={open}
      title="Postpone"
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      width={712}
      styles={{
        body: {
          padding: "8px 12px 12px",
          background: "#ffffff",
        },
      }}
    >
      <div className="grid grid-cols-[347px_285px] items-start gap-x-4 gap-y-3">
        <div className="col-span-2">
          <InlineFollowupDateTimePickerV2 value={followupDate} onChange={setFollowupDate} />
        </div>

        <div className="col-start-2 flex flex-col gap-2 pt-0">
          <div className="text-sm font-medium text-slate-700 -mt-[175px]">
            Comments
          </div>
          <div className="relative">
            <TextArea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter comments..."
              className="min-h-[98px] 
               pr-10"
            />
            <button
              type="button"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Voice input"
            >
              <AudioOutlined />
            </button>
          </div>
        </div>

        <div className="col-start-2 flex justify-end gap-2 -mt-[20px]">
          <Button onClick={handleCancel}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleSave}
            loading={postponeTicket.isPending}
            style={{ backgroundColor: "#10b981" }}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FollowupPostponeModal;
