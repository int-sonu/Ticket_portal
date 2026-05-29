import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Upload,
  message,
} from "antd";

import { UploadOutlined } from "@ant-design/icons";

import { useTicketMutations } from "../../../Hooks/Ticket/useTicketMutations";
import { useTicketAttachments } from "../../../Hooks/Ticket/useTicketAttachments";

const { TextArea } = Input;

interface TicketFormProps {
  initialValues?: any;
  isEdit?: boolean;
}

const TicketForm = ({
  initialValues,
  isEdit = false,
}: TicketFormProps) => {
  const [form] = Form.useForm();

  const {
    createTicket,
    updateTicket,
  } = useTicketMutations();

  const {
    uploadTicketAttachment,
  } = useTicketAttachments();

  const handleSubmit = (
    values: any
  ) => {
    if (isEdit) {
      updateTicket.mutate(values, {
        onSuccess: () => {
          message.success(
            "Ticket Updated Successfully"
          );
        },
      });

      return;
    }

    createTicket.mutate(values, {
      onSuccess: () => {
        message.success(
          "Ticket Created Successfully"
        );

        form.resetFields();
      },
    });
  };

  const handleUpload = (
    file: File
  ) => {
    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    uploadTicketAttachment.mutate(
      formData
    );

    return false;
  };

  return (
    <Card title="Ticket Details">
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Customer"
              name="CustomerId"
              rules={[
                {
                  required: true,
                  message:
                    "Select Customer",
                },
              ]}
            >
              <Select
                placeholder="Select Customer"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Branch"
              name="BranchId"
            >
              <Select
                placeholder="Select Branch"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Contact Number"
              name="ContactNo"
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Priority"
              name="Priority"
            >
              <Select
                options={[
                  {
                    label: "Low",
                    value: "Low",
                  },
                  {
                    label: "Medium",
                    value: "Medium",
                  },
                  {
                    label: "High",
                    value: "High",
                  },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Product"
              name="ProductId"
            >
              <Select
                placeholder="Select Product"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Complaint Type"
              name="ComplaintTypeId"
            >
              <Select
                placeholder="Select Complaint"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Issue Summary"
          name="IssueSummary"
          rules={[
            {
              required: true,
              message:
                "Enter Issue Summary",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Description"
          name="Description"
        >
          <TextArea rows={5} />
        </Form.Item>

        <Form.Item
          label="Attachment"
        >
          <Upload
            beforeUpload={
              handleUpload
            }
            maxCount={5}
          >
            <Button
              icon={
                <UploadOutlined />
              }
            >
              Upload File
            </Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={
              createTicket.isPending ||
              updateTicket.isPending
            }
          >
            {isEdit
              ? "Update Ticket"
              : "Create Ticket"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TicketForm;