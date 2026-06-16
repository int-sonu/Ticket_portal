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
        AgentId: values.nAgentId,
        TransferReason:
          values.TransferReason,
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
          label="Reason for Transfer"
          name="TransferReason" className="w-100 h-"
          rules={[
            {
            
              message:
                "Please Enter Transfer Reason",
            },
          ]}
        >
           <TextArea rows={6} />
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
           Save
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TransferTicketModal;