import {
  Table,
  Space,
  Button,
  Popconfirm,
} from "antd";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
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

  const getTicketId = (record: any) =>
    record?.TicketId ?? record?.nTicketId ?? record?.ticketId ?? 0;

  const isOngoingTicket = (record: any) =>
    String(
      record?.Status ??
        record?.StatusName ??
        record?.cStatus ??
        record?.cStatusName ??
        record?.TicketStatus ??
        record?.TicketStatusName ??
        record?.cCurrentStatus ??
        record?.cCurrentStatusName ??
        ""
    )
      .toLowerCase()
      .includes("ongoing");

  const getViewSource = (record: any) => {
    if (isOngoingTicket(record)) return "ongoing";

    const status = String(
      record?.Status ??
        record?.StatusName ??
        record?.TicketStatus ??
        record?.TicketStatusName ??
        ""
    ).toLowerCase();

    if (status.includes("unassigned")) return "unassigned";
    if (status.includes("upcoming")) return "upcoming";
    if (status.includes("overdue")) return "overdue";
    if (status.includes("postponed")) return "postponed";
    if (status.includes("created")) return "created";

    return "ticket";
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
      ) => {
        const ticketId = getTicketId(record);

        return (
          <Space>
            <Button
              size="small"
              disabled={!ticketId}
              onClick={() =>
                navigate(`/tickets/view/${ticketId}`, {
                  state: {
                    selectedRow: record,
                    isFrom: getViewSource(record),
                  },
                })
              }
            >
              View
            </Button>

            <Button
              size="small"
              disabled={!ticketId}
              onClick={() =>
                navigate(`/tickets/view/${ticketId}`, {
                  state: {
                    selectedRow: record,
                    isFrom: getViewSource(record),
                    openQuickCall: true,
                    quickCallTicketValues: record,
                  },
                })
              }
            >
              Quick Call
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
                handleDelete(record)
              }
            >
              <Button danger size="small">
                Delete
              </Button>
            </Popconfirm>
          </Space>
        );
      },
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
