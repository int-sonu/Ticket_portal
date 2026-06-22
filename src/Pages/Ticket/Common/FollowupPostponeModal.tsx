import { Button, Input, Modal, message } from "antd";
import { useEffect, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useTicketMutations } from "../../../Hooks/Ticket/useTicketMutations";
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

    postponeTicket.mutate(
      {
        TicketId: ticketId,
        nTicketId: ticketId,
        dDate: followupDate.format("DD/MM/YYYY hh:mm A"),
        FollowupDate: followupDate.format("DD/MM/YYYY hh:mm A"),
        Remarks: remarks,
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
      width={690}
      styles={{
        body: {
          padding: "0px 0px 0px",
          background: "#f8fafc",
        },
      }}
    >
      <div className="flex flex-col gap-4">
        <InlineFollowupDateTimePickerV2 value={followupDate} onChange={setFollowupDate} />

        <div className="grid grid-cols-[340px_285px] gap-5 scroll">
          <div />
          <div className="flex flex-col gap-2 -mt-[190px]">
            <div className="text-sm font-medium text-slate-700">Comments</div>
            <TextArea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter comments..."
              className=""
            />
          </div>
        </div>

        <div className="flex justify-end gap-2  -mt-[65px]">
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
