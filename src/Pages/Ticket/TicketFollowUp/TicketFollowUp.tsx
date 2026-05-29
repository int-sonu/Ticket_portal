import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  message,
} from "antd";

import { useTicketMutations } from "../../../Hooks/Ticket/useTicketMutations";

const { TextArea } = Input;

interface Props {
  ticketId: number;
}

const TicketFollowUp = ({
  ticketId,
}: Props) => {
  const [form] = Form.useForm();

  const { followupSave } =
    useTicketMutations();

  const handleSubmit = (
    values: any
  ) => {
    followupSave.mutate(
      {
        TicketId: ticketId,
        FollowupDate:
          values.FollowupDate,
        Remarks: values.Remarks,
      },
      {
        onSuccess: () => {
          message.success(
            "Followup Saved Successfully"
          );

          form.resetFields();
        },
      }
    );
  };

  return (
    <Card title="Ticket Follow Up">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Follow Up Date"
          name="FollowupDate"
          rules={[
            {
              required: true,
              message:
                "Select Follow Up Date",
            },
          ]}
        >
          <DatePicker
            style={{
              width: "100%",
            }}
          />
        </Form.Item>

        <Form.Item
          label="Remarks"
          name="Remarks"
          rules={[
            {
              required: true,
              message:
                "Enter Remarks",
            },
          ]}
        >
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={
              followupSave.isPending
            }
          >
            Save Follow Up
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TicketFollowUp;