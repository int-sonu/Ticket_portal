import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  message,
} from "antd";

import { useTicketMutations } from "../../../Hooks/Ticket/useTicketMutations";

const { TextArea } = Input;

interface QuickCallReportModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: number;
}

const QuickCallReportModal = ({
  open,
  onClose,
  ticketId,
}: QuickCallReportModalProps) => {
  const [form] = Form.useForm();

  const { quickCallReportSave } =
    useTicketMutations();

  const handleSubmit = (
    values: any
  ) => {
    quickCallReportSave.mutate(
      {
        TicketId: ticketId,
        CallStatus:
          values.CallStatus,
        CallDuration:
          values.CallDuration,
        Remarks: values.Remarks,
      },
      {
        onSuccess: () => {
          message.success(
            "Call Report Saved Successfully"
          );

          form.resetFields();

          onClose();
        },
      }
    );
  };

  return (
    <Modal
      title="Quick Call Report"
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
          label="Call Status"
          name="CallStatus"
          rules={[
            {
              required: true,
              message:
                "Please Select Call Status",
            },
          ]}
        >
          <Select
            options={[
              {
                label:
                  "Connected",
                value:
                  "Connected",
              },
              {
                label:
                  "Not Connected",
                value:
                  "NotConnected",
              },
              {
                label:
                  "Busy",
                value: "Busy",
              },
              {
                label:
                  "Switched Off",
                value:
                  "SwitchedOff",
              },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Call Duration (Minutes)"
          name="CallDuration"
        >
          <InputNumber
            min={0}
            style={{
              width: "100%",
            }}
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
              quickCallReportSave.isPending
            }
            block
          >
            Save Report
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QuickCallReportModal;