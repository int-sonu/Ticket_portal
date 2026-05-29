import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  message,
} from "antd";

import { useTicketActions } from "../../../Hooks/Ticket/useTicketActions";

const { TextArea } = Input;

interface TransferTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: number;
}

const TransferTicketModal = ({
  open,
  onClose,
  ticketId,
}: TransferTicketModalProps) => {
  const [form] = Form.useForm();

  const { transferTicket } =
    useTicketActions();

  const handleSubmit = (
    values: any
  ) => {
    transferTicket.mutate(
      {
        TicketId: ticketId,
        AgentId: values.AgentId,
        TransferReason:
          values.TransferReason,
        Remarks: values.Remarks,
      },
      {
        onSuccess: () => {
          message.success(
            "Ticket Transferred Successfully"
          );

          form.resetFields();

          onClose();
        },
      }
    );
  };

  return (
    <Modal
      title="Transfer Ticket"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Agent"
          name="AgentId"
          rules={[
            {
              required: true,
              message:
                "Please Select Agent",
            },
          ]}
        >
          <Select
            placeholder="Select Agent"
          />
        </Form.Item>

        <Form.Item
          label="Transfer Reason"
          name="TransferReason"
          rules={[
            {
              required: true,
              message:
                "Please Enter Transfer Reason",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Remarks"
          name="Remarks"
        >
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={
              transferTicket.isPending
            }
            block
          >
            Transfer Ticket
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TransferTicketModal;