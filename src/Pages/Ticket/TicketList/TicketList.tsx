import { useState } from "react";
import {
  Button,
  Card,
  Input,
  Space,
  Table,
  Typography,
} from "antd";

import {
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import { useNavigate } from "react-router-dom";

import { getRequestPayload } from "../../../Utils/requestPayload";

import {
  useTicketOngoing,
  useTicketUpcoming,
  useTicketUnAssigned,
  useClosedTicketList,
  useTicketListAll,
} from "../../../Hooks/Ticket/useTicketQueries";

const TicketList = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState("ONGOING");

 const payload = {
  ...getRequestPayload(),
  pageNumber: 1,
  pageSize: 10,
};

const closedPayload = {
  ...getRequestPayload(),
  dFromDate: "01/01/2026",
  dToDate: "31/12/2026",
  pageNumber: 1,
  pageSize: 10,
};

console.log(
  "Ticket Payload",
  payload
);

console.log(
  "Closed Payload",
  closedPayload
);

  const ongoing =
    useTicketOngoing(payload);

  const upcoming =
    useTicketUpcoming(payload);

  const unassigned =
    useTicketUnAssigned(payload);

  const closed =
    useClosedTicketList(payload);

  const allTickets =
    useTicketListAll(payload);

  const getTableData = () => {
    const allData =
      allTickets.data?.Data || [];

    switch (activeTab) {
      case "ONGOING":
        return ongoing.data?.Data || [];

      case "UPCOMING":
        return upcoming.data?.Data || [];

      case "UNASSIGNED":
        return (
          unassigned.data?.Data || []
        );

      case "CLOSED":
        return closed.data?.Data || [];

      case "OVERDUE":
        return allData.filter(
          (item: any) =>
            item.Status
              ?.toLowerCase?.() ===
            "overdue"
        );

      case "POSTPONED":
        return allData.filter(
          (item: any) =>
            item.Status
              ?.toLowerCase?.() ===
            "postponed"
        );

      case "CREATED":
        return allData;

      default:
        return [];
    }
  };

  const columns = [
    {
      title: "Srl",
      render: (
        _: any,
        __: any,
        index: number
      ) => index + 1,
      width: 80,
    },
    {
      title:
        "Created Date & Time",
      dataIndex: "CreatedDate",
    },
    {
      title: "Ticket No.",
      dataIndex: "TicketNo",
    },
    {
      title: "Customer Name",
      dataIndex:
        "CustomerName",
    },
    {
      title: "Ticket Summary",
      dataIndex:
        "TicketSummary",
    },
    {
      title: "Priority",
      dataIndex: "Priority",
    },
    {
      title: "Status",
      dataIndex: "Status",
    },
  ];

  return (
    <Card bordered={false}>
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Typography.Title
          level={3}
          style={{ margin: 0 }}
        >
          Tickets
        </Typography.Title>

        <Space>
          <Input
            prefix={
              <SearchOutlined />
            }
            placeholder="Search"
            style={{
              width: 300,
            }}
          />

          <Button
            icon={
              <FilterOutlined />
            }
          />

          <Button
            type="primary"
            onClick={() =>
              navigate(
                "/tickets/create"
              )
            }
          >
            Create New Ticket
          </Button>
        </Space>
      </div>

      <Space
        wrap
        style={{
          marginBottom: 20,
        }}
      >
        <Button
          type={
            activeTab ===
            "ONGOING"
              ? "primary"
              : "default"
          }
          onClick={() =>
            setActiveTab(
              "ONGOING"
            )
          }
        >
          Ongoing
        </Button>

        <Button
          type={
            activeTab ===
            "UPCOMING"
              ? "primary"
              : "default"
          }
          onClick={() =>
            setActiveTab(
              "UPCOMING"
            )
          }
        >
          Upcoming
        </Button>

        <Button
          type={
            activeTab ===
            "UNASSIGNED"
              ? "primary"
              : "default"
          }
          onClick={() =>
            setActiveTab(
              "UNASSIGNED"
            )
          }
        >
          Unassigned
        </Button>

        <Button
          type={
            activeTab ===
            "CLOSED"
              ? "primary"
              : "default"
          }
          onClick={() =>
            setActiveTab(
              "CLOSED"
            )
          }
        >
          Closed
        </Button>

        <Button
          type={
            activeTab ===
            "OVERDUE"
              ? "primary"
              : "default"
          }
          onClick={() =>
            setActiveTab(
              "OVERDUE"
            )
          }
        >
          Overdue
        </Button>

        <Button
          type={
            activeTab ===
            "POSTPONED"
              ? "primary"
              : "default"
          }
          onClick={() =>
            setActiveTab(
              "POSTPONED"
            )
          }
        >
          Postponed
        </Button>

        <Button
          type={
            activeTab ===
            "CREATED"
              ? "primary"
              : "default"
          }
          onClick={() =>
            setActiveTab(
              "CREATED"
            )
          }
        >
          Created Tickets
        </Button>
      </Space>

      <Table
        rowKey="TicketId"
        columns={columns}
        dataSource={getTableData()}
        loading={
          ongoing.isLoading ||
          upcoming.isLoading ||
          unassigned.isLoading ||
          closed.isLoading ||
          allTickets.isLoading
        }
        pagination={{
          pageSize: 10,
        }}
      />
    </Card>
  );
};

export default TicketList;