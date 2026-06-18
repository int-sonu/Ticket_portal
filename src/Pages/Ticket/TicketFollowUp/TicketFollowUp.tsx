import { Button, Card, DatePicker, Form, Input, message } from "antd";
import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useTicketMutations } from "../../../Hooks/Ticket/useTicketMutations";

const { TextArea } = Input;

interface Props {
  ticketId?: number;
}

const TicketFollowUp = ({ ticketId }: Props) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const resolvedTicketId = Number(ticketId ?? params.id ?? 0);
  const { followupSave } = useTicketMutations();

  useEffect(() => {
    const state = (location.state as Record<string, any> | null) ?? {};

    form.setFieldsValue({
      FollowupDate:
        state.FollowupDate ??
        state.dFollowupDate ??
        state.followupDate ??
        null,
      Remarks:
        state.Remarks ??
        state.remark ??
        state.cCallSummary ??
        state.summary ??
        "",
    });
  }, [form, location.state]);

  const handleSubmit = (values: any) => {
    followupSave.mutate(
      {
        TicketId: resolvedTicketId,
        dDate: values.FollowupDate,
        FollowupDate: values.FollowupDate,
        Remarks: values.Remarks,
      } as any,
      {
        onSuccess: () => {
          message.success("Followup Saved Successfully");
          form.resetFields();
          navigate(-1);
        },
      },
    );
  };

  return (
    <Card title="Ticket Follow Up">
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Follow Up Date"
          name="FollowupDate"
          rules={[
            {
              required: true,
              message: "Select Follow Up Date",
            },
          ]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Remarks"
          name="Remarks"
          rules={[
            {
              required: true,
              message: "Enter Remarks",
            },
          ]}
        >
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={followupSave.isPending}
          >
            Save Follow Up
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TicketFollowUp;
