import { Button, DatePicker, Form, Input, Modal, Select, Spin, message } from "antd";
import { useMemo } from "react";
import { useTicketMutations } from "../../../Hooks/Ticket/useTicketMutations";
import { useCustomerWiseActiveTicketList } from "../../../Hooks/Ticket/useTicketQueries";
import { getRequestPayload } from "../../../Utils/requestPayload";

const { TextArea } = Input;

interface FollowupModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: number;
  customerId?: number;
  /** Pre-selected ticket id (defaults to ticketId) */
  defaultTicketId?: number;
}

const FollowupModal = ({
  open,
  onClose,
  ticketId,
  customerId,
  defaultTicketId,
}: FollowupModalProps) => {
  const [form] = Form.useForm();
  const { followupSave } = useTicketMutations();

  // Fetch active tickets for the customer so user can pick which ticket to follow-up
  const payload = useMemo(
    () => ({
      ...getRequestPayload(),
      nCustomerId: customerId ?? 0,
      CustomerId: customerId ?? 0,
    }),
    [customerId]
  );

  const { data: customerTicketsData, isLoading: ticketsLoading } =
    useCustomerWiseActiveTicketList(payload, open && !!customerId);

  const ticketOptions = useMemo(() => {
    const list: any[] =
      customerTicketsData?.data ??
      customerTicketsData?.Data ??
      (Array.isArray(customerTicketsData) ? customerTicketsData : []);
    return list.map((t: any) => ({
      value: t.nTicketId ?? t.TicketId,
      label: `#${t.nTicketNo ?? t.nTicketId} — ${t.cTicketSummary ?? t.cViewSummary ?? "Ticket"}`,
    }));
  }, [customerTicketsData]);

  const handleSubmit = (values: any) => {
    const resolvedTicketId = values.TicketId ?? ticketId;
    followupSave.mutate(
      {
        TicketId: resolvedTicketId,
        nTicketId: resolvedTicketId,
        dDate: values.FollowupDate,
        FollowupDate: values.FollowupDate,
        Remarks: values.Remarks,
      } as any,
      {
        onSuccess: () => {
          message.success("Followup Saved Successfully");
          form.resetFields();
          onClose();
        },
      }
    );
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Ticket Follow Up"
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      width={480}
    >
      <Spin spinning={ticketsLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ TicketId: defaultTicketId ?? ticketId }}
        >
          {/* Ticket selector — shown when customer has multiple active tickets */}
          {ticketOptions.length > 0 && (
            <Form.Item
              label="Select Ticket"
              name="TicketId"
              rules={[{ required: true, message: "Select a ticket" }]}
            >
              <Select
                options={ticketOptions}
                placeholder="Select ticket"
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          )}

          <Form.Item
            label="Follow Up Date"
            name="FollowupDate"
            rules={[{ required: true, message: "Select Follow Up Date" }]}
          >
            <DatePicker style={{ width: "100%" }} showTime format="DD/MM/YYYY hh:mm A" />
          </Form.Item>

          <Form.Item
            label="Remarks"
            name="Remarks"
            rules={[{ required: true, message: "Enter Remarks" }]}
          >
            <TextArea rows={4} placeholder="Enter follow up remarks..." />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={handleCancel}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={followupSave.isPending}
                style={{ backgroundColor: "#10b981" }}
              >
                Save Follow Up
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default FollowupModal;
