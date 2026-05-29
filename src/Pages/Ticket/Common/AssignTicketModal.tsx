import {
  Button,
  Form,
  Modal,
  Select,
  Input,
  message,
} from "antd";

import { useTicketActions } from "../../../Hooks/Ticket/useTicketActions";

const { TextArea } = Input;

interface AssignTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: number;
}

const AssignTicketModal = ({
  open,
  onClose,
  ticketId,
}: AssignTicketModalProps) => {
  const [form] = Form.useForm();

  const { assignTicket } =
    useTicketActions();

  const handleSubmit = (
    values: any
  ) => {
    assignTicket.mutate(
      {
        TicketId: ticketId,
        AgentId: values.AgentId,
        Remarks: values.Remarks,
      },
      {
        onSuccess: () => {
          message.success(
            "Ticket Assigned Successfully"
          );

          form.resetFields();

          onClose();
        },
      }
    );
  };

  return (
    <Modal
      title="Assign Ticket"
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
              assignTicket.isPending
            }
            block
          >
            Assign Ticket
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AssignTicketModal;