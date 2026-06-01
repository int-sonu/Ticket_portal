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
  useOverdueTicketList,
  usePostponedTicketList,
  useCreatedTicketList,
} from "../../../Hooks/Ticket/useTicketQueries";

const formatApiDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}/${month}/${day}`;
};

const getRows = (response: any) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.Data)) {
    return response.Data;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.data?.Data)) {
    return response.data.Data;
  }

  return [];
};

const getFieldValue = (
  record: any,
  keys: string[]
) => {
  for (const key of keys) {
    if (
      record?.[key] !== undefined &&
      record?.[key] !== null
    ) {
      return record[key];
    }
  }

  const recordKey = Object.keys(
    record || {}
  ).find((item) =>
    keys.some(
      (key) =>
        key.toLowerCase() ===
        item.toLowerCase()
    )
  );

  if (!recordKey) {
    return "";
  }

  return record[recordKey] ?? "";
};

const parseTicketDate = (value: any) => {
  if (!value) return null;

  const text = String(value);
  const direct = new Date(text);

  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const match = text.match(
    /(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/
  );

  if (!match) return null;

  const [, day, month, year] = match;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
};

const isOverdueTicket = (record: any) => {
  const status = String(
    getFieldValue(record, [
          "Status",
          "StatusName",
          "cStatus",
          "cStatusName",
          "cTicketStatusName",
          "TicketStatus",
          "TicketStatusName",
          "cCurrentStatus",
          "cCurrentStatusName",
          "cCallStatus",
          "cCallStatusName",
          "cTicketStatus",
          "nStatus",
          "nTicketStatus",
        ])
  ).toLowerCase();

  if (
    status.includes("closed") ||
    status.includes("completed")
  ) {
    return false;
  }

  const ticketDate = parseTicketDate(
    getFieldValue(record, [
      "DueDate",
      "dDueDate",
      "FollowupDate",
      "dFollowupDate",
      "CreatedDate",
      "CreatedDateTime",
      "CreatedOn",
      "dCreatedDate",
      "dCreatedOn",
      "cDate",
    ])
  );

  if (!ticketDate) return false;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  ticketDate.setHours(0, 0, 0, 0);

  return ticketDate < todayStart;
};

const TicketList = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] =
    useState("ONGOING");

  const basePayload =
    getRequestPayload();

  const today = new Date();
  const currentYear =
    today.getFullYear();

  const payload = {
    ...basePayload,
    pageNumber: 1,
    pageSize: 10,
  };

  const dashboardPayload = {
    ...payload,
    cAgentId:
      basePayload.nType === 1
        ? "0"
        : String(
            basePayload.nAgentId ??
              basePayload.id ??
              0
          ),
    nMode: 0,
    dFromDate: `${currentYear}/01/01`,
    dToDate: `${currentYear}/12/31`,
  };

  const upcomingPayload = {
    ...payload,
    cDate: formatApiDate(today),
  };

  const closedPayload = {
    ...payload,
    dFromDate: `${currentYear}/01/01`,
    dToDate: `${currentYear}/12/31`,
  };

  const ongoing =
    useTicketOngoing(
      payload,
      activeTab === "ONGOING"
    );

  const upcoming =
    useTicketUpcoming(
      upcomingPayload,
      activeTab === "UPCOMING"
    );

  const unassigned =
    useTicketUnAssigned(
      payload,
      activeTab === "UNASSIGNED"
    );

  const closed =
    useClosedTicketList(
      closedPayload,
      activeTab === "CLOSED"
    );

  const overdue =
    useOverdueTicketList(
      dashboardPayload,
      activeTab === "OVERDUE"
    );

  const postponed =
    usePostponedTicketList(
      dashboardPayload,
      activeTab === "POSTPONED"
    );

  const created =
    useCreatedTicketList(
      dashboardPayload,
      activeTab === "CREATED"
    );

  const getTableData = () => {
    switch (activeTab) {
      case "ONGOING":
        return getRows(ongoing.data);

      case "UPCOMING":
        return getRows(upcoming.data);

      case "UNASSIGNED":
        return getRows(unassigned.data);

      case "CLOSED":
        return getRows(closed.data);

      case "OVERDUE":
        {
          const overdueRows =
            getRows(overdue.data);

          if (overdueRows.length) {
            return overdueRows;
          }

          return getRows(ongoing.data).filter(
            isOverdueTicket
          );
        }

      case "POSTPONED":
        return getRows(postponed.data);

      case "CREATED":
        return getRows(created.data);

      default:
        return [];
    }
  };

  const getTableLoading = () => {
    switch (activeTab) {
      case "ONGOING":
        return ongoing.isLoading;

      case "UPCOMING":
        return upcoming.isLoading;

      case "UNASSIGNED":
        return unassigned.isLoading;

      case "CLOSED":
        return closed.isLoading;

      case "OVERDUE":
        return overdue.isLoading;

      case "POSTPONED":
        return postponed.isLoading;

      case "CREATED":
        return created.isLoading;

      default:
        return false;
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
      render: (_: any, record: any) =>
        getFieldValue(record, [
          "CreatedDate",
          "CreatedDateTime",
          "CreatedOn",
          "dCreatedDate",
          "dCreatedOn",
          "cDate",
        ]),
    },
    {
      title: "Ticket No.",
      render: (_: any, record: any) =>
        getFieldValue(record, [
          "TicketNo",
          "cTicketNo",
          "cTicketNumber",
          "nTicketNo",
        ]),
    },
    {
      title: "Customer Name",
      render: (_: any, record: any) =>
        getFieldValue(record, [
          "CustomerName",
          "cCustomerName",
          "cCustName",
          "Customer",
        ]),
    },
    {
      title: "Ticket Summary",
      render: (_: any, record: any) =>
        getFieldValue(record, [
          "TicketSummary",
          "cTicketSummary",
          "cSummary",
          "cDescription",
          "cComplaint",
        ]),
    },
    {
      title: "Priority",
      render: (_: any, record: any) =>
        getFieldValue(record, [
          "Priority",
          "PriorityName",
          "cPriority",
          "cPriorityName",
        ]),
    },
    {
      title: "Status",
      render: (_: any, record: any) =>
        getFieldValue(record, [
          "Status",
          "StatusName",
          "cStatus",
          "cStatusName",
          "cTicketStatusName",
          "TicketStatus",
          "TicketStatusName",
          "cCurrentStatus",
          "cCurrentStatusName",
          "cCallStatus",
          "cCallStatusName",
          "cTicketStatus",
          "nStatus",
          "nTicketStatus",
        ]),
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
        rowKey={(record) =>
          getFieldValue(record, [
            "TicketId",
            "nTicketId",
            "nTicketid",
          ])
        }
        columns={columns}
        dataSource={getTableData()}
        loading={getTableLoading()}
        pagination={{
          pageSize: 10,
        }}
      />
    </Card>
  );
};

export default TicketList;
