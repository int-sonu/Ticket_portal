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

interface ShareTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: number;
}

const ShareTicketModal = ({
  open,
  onClose,
  ticketId,
}: ShareTicketModalProps) => {
  const [form] = Form.useForm();

  const { shareTicket } =
    useTicketActions();

  const handleSubmit = (
    values: any
  ) => {
    shareTicket.mutate(
      {
        TicketId: ticketId,
        AgentId: values.AgentId,
      },
      {
        onSuccess: () => {
          message.success(
            "Ticket Shared Successfully"
          );

          form.resetFields();

          onClose();
        },
      }
    );
  };

  return (
    <Modal
      title="Share Ticket"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={400}
      height={400}
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
              shareTicket.isPending
            }
            block
          >
          Save
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ShareTicketModal;