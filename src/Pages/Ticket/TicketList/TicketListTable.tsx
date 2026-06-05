import {
  Table,
  Space,
  Button,
  Popconfirm,
} from "antd";

import {
  useTicketMutations,
} from "../../../Hooks/Ticket/useTicketMutations";
interface Props {
  data: any[];
  loading: boolean;
  onRefresh: () => void;
}

const TicketListTable = ({
  data,
  loading,
}: Props) => {
  const { deleteTicket } =
    useTicketMutations();

  const handleDelete = (
    record: any
  ) => {
    deleteTicket.mutate({
      TicketId:
        record.TicketId,
    });
  };

  const columns = [
    {
      title: "Ticket No",
      dataIndex: "TicketNo",
    },
    {
      title: "Customer",
      dataIndex:
        "CustomerName",
    },
    {
      title: "Contact",
      dataIndex: "MobileNo",
    },
    {
      title: "Priority",
      dataIndex: "Priority",
    },
    {
      title: "Status",
      dataIndex: "Status",
    },
    {
      title: "Agent",
      dataIndex: "AgentName",
    },
    {
      title: "Created Date",
      dataIndex:
        "CreatedDate",
    },
    {
      title: "Action",
      render: (
        _: any,
        record: any
      ) => (
        <Space>
          <Button size="small">
            View
          </Button>

          <Button size="small">
            Edit
          </Button>

          <Button size="small">
            Assign
          </Button>

          <Button size="small">
            Share
          </Button>

          <Button size="small">
            Transfer
          </Button>

          <Popconfirm
            title="Delete Ticket?"
            onConfirm={() =>
              handleDelete(
                record
              )
            }
          >
            <Button
              danger
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="TicketId"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{
        pageSize: 20,
      }}
    />
  );
};

export default TicketListTable;