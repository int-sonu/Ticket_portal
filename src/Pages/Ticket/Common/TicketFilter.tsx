import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Space,
} from "antd";

const { RangePicker } = DatePicker;

interface TicketFilterProps {
  onSearch: (values: any) => void;
}

const TicketFilter = ({
  onSearch,
}: TicketFilterProps) => {
  const [form] = Form.useForm();

  const handleSearch = (
    values: any
  ) => {
    onSearch(values);
  };

  const handleReset = () => {
    form.resetFields();

    onSearch({
      PageNo: 1,
      PageSize: 20,
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSearch}
    >
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item
            label="Ticket No"
            name="TicketNo"
          >
            <Input
              placeholder="Ticket No"
            />
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item
            label="Customer"
            name="CustomerName"
          >
            <Input
              placeholder="Customer Name"
            />
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item
            label="Status"
            name="Status"
          >
            <Select
              allowClear
              placeholder="Select Status"
              options={[
                {
                  label: "Open",
                  value: "Open",
                },
                {
                  label: "Assigned",
                  value: "Assigned",
                },
                {
                  label: "Ongoing",
                  value: "Ongoing",
                },
                {
                  label: "Closed",
                  value: "Closed",
                },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Date Range"
            name="DateRange"
          >
            <RangePicker
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </Col>

        <Col span={16}>
          <Space
            style={{
              marginTop: 30,
            }}
          >
            <Button
              type="primary"
              htmlType="submit"
            >
              Search
            </Button>

            <Button
              onClick={
                handleReset
              }
            >
              Reset
            </Button>
          </Space>
        </Col>
      </Row>
    </Form>
  );
};

export default TicketFilter;
