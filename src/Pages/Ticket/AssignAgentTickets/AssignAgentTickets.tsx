import { Button, Card, Empty, Input, Space, Typography } from "antd";
import { CloseOutlined, SearchOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useAssignAgentTicketList } from "../../../Hooks/Ticket/useTicketQueries";
import { getRequestPayload } from "../../../Utils/requestPayload";
import AntTable from "../../../ui/Table/AntTable";
import { extractList } from "../../Master/Common/SimpleMasterUtils";
import TicketModulePagination from "../Common/TicketModulePagination";
import "../TicketList/TicketList.css";

interface AssignAgentTicketsLocationState {
  returnTo?: string;
  draftValues?: Record<string, any>;
  agentName?: string;
  agentId?: string | number;
}

const getFieldValue = (record: any, keys: string[]) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null) {
      return record[key];
    }
  }

  return undefined;
};

const toText = (value: any) => {
  if (value === undefined || value === null) return "";
  return String(value);
};

const formatRequestDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
};

const AssignAgentTickets = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const locationState =
    (location.state as AssignAgentTicketsLocationState | null) ?? {};
  const returnTo = locationState.returnTo;

  const agentName =
    locationState.agentName ??
    searchParams.get("agentName") ??
    searchParams.get("name") ??
    "";

  const agentId =
    locationState.agentId ??
    searchParams.get("agentId") ??
    searchParams.get("id") ??
    searchParams.get("nAgentId") ??
    "";

  useEffect(() => {
    setSearchText(agentName);
  }, [agentName]);

  const payload = useMemo(
    () => ({
      ...getRequestPayload(),
      pageNumber: 1,
      pageSize: 1000,
      dDate: formatRequestDate(new Date()),
      agentId,
      nAgentId: agentId,
    }),
    [agentId]
  );

  const { data, isFetching, isError } = useAssignAgentTicketList(
    payload,
    !!agentId || !!locationState.agentId || !!searchParams.get("agentId")
  );

  const rows = useMemo(() => extractList(data), [data]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const agentPrefill = agentName.trim().toLowerCase();

    if (!query || query === agentPrefill) return rows;

    return rows.filter((record: any) => {
      const fields = [
        getFieldValue(record, [
          "cTicketNo",
          "TicketNo",
          "nTicketNo",
          "ticketNo",
          "ticketNumber",
        ]),
        getFieldValue(record, [
          "cCustomerName",
          "CustomerName",
          "customerName",
          "name",
        ]),
        getFieldValue(record, [
          "cTicketSummary",
          "TicketSummary",
          "ticketSummary",
          "summary",
        ]),
        getFieldValue(record, [
          "cPriority",
          "Priority",
          "priority",
        ]),
        getFieldValue(record, [
          "cStatusName",
          "StatusName",
          "statusName",
          "status",
        ]),
      ];

      return fields.some((value) =>
        toText(value).toLowerCase().includes(query)
      );
    });
  }, [rows, searchText]);

  const safeCurrentPage = Math.min(
    currentPage,
    Math.max(1, Math.ceil(filteredRows.length / pageSize))
  );

  const pagedRows = filteredRows.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const pageTitle = agentName
    ? `${agentName} Tickets`
    : "Tickets";

  const goBack = () => {
    if (returnTo) {
      navigate(returnTo, { replace: true });
      return;
    }

    navigate(-1);
  };

  const columns = useMemo(
    () => [
      {
        title: "Srl",
        width: 48,
        render: (_: any, __: any, index: number) =>
          (safeCurrentPage - 1) * pageSize + index + 1,
      },
      {
        title: "Scheduled on",
        width: 120,
        render: (record: any) =>
          getFieldValue(record, [
            "dScheduleDate",
            "scheduleDate",
            "scheduledOn",
            "FollowupDate",
            "dDate",
          ]) ?? "-",
      },
      {
        title: "Ticket No.",
        width: 120,
        render: (record: any) =>
          getFieldValue(record, [
            "cTicketNo",
            "TicketNo",
            "nTicketNo",
            "ticketNo",
          ]) ?? "-",
      },
      {
        title: "Customer Name",
        width: 160,
        render: (record: any) =>
          getFieldValue(record, [
            "cCustomerName",
            "CustomerName",
            "customerName",
            "name",
          ]) ?? "-",
      },
      {
        title: "Ticket Summary",
        render: (record: any) =>
          getFieldValue(record, [
            "cTicketSummary",
            "TicketSummary",
            "ticketSummary",
            "summary",
          ]) ?? "-",
      },
      {
        title: "Priority",
        width: 100,
        render: (record: any) =>
          getFieldValue(record, [
            "cPriority",
            "Priority",
            "priority",
          ]) ?? "-",
      },
      {
        title: "Status",
        width: 100,
        render: (record: any) =>
          getFieldValue(record, [
            "cStatusName",
            "StatusName",
            "statusName",
            "status",
          ]) ?? "-",
      },
    ],
    [pageSize, safeCurrentPage]
  );

  return (
    <>
    <Card
      bordered={false}
      bodyStyle={{
        background: "#ffffff",
        borderRadius: 8,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 0,
      }}
      style={{
        height: "100%",
        borderRadius: 0,
        boxShadow: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        <Typography.Title
          level={3}
          style={{
            margin: 0,
            color: "#1f2a37",
            fontSize: 18,
          }}
        >
          {pageTitle}
        </Typography.Title>

        <Space size={10} wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            style={{
              width: 280,
              height: 28,
              borderRadius: 8,
            }}
            styles={{
              input: {
                fontSize: 10,
              },
            }}
          />

          <Button type="text" icon={<CloseOutlined />} onClick={goBack} />
        </Space>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <AntTable
          className="ticket-list-table"
          rowKey={(record) =>
            getFieldValue(record, [
              "TicketId",
              "nTicketId",
              "TicketNo",
              "nTicketNo",
              "id",
            ]) || getFieldValue(record, ["id", "ID"])
          }
          columns={columns as any}
          dataSource={pagedRows}
          loading={isFetching}
          size="small"
          disableHorizontalScroll
          scroll={{ y: "100%" }}
          onRow={(record) => ({
            onClick: () => {
              const ticketId = getFieldValue(record, [
                "TicketId",
                "nTicketId",
                "TicketNo",
                "nTicketNo",
                "id",
              ]);
              if (ticketId) {
                navigate(`/tickets/view/${ticketId}`, {
                  state: {
                    selectedRow: record,
                  },
                });
              }
            },
            style: { cursor: "pointer" },
          })}
          locale={{
            emptyText: isError ? (
              <Empty description="Unable to load tickets" />
            ) : (
              <Empty description="No tickets found" />
            ),
          }}
          showPagination={false}
        />
      </div>

    </Card>
    <TicketModulePagination
      className="mt-3"
      current={safeCurrentPage}
      pageSize={pageSize}
      total={filteredRows.length}
      onChange={(page, size) => {
        setCurrentPage(page);
        setPageSize(size);
      }}
      onShowSizeChange={(page, size) => {
        setCurrentPage(page);
        setPageSize(size);
      }}
      showSizeChanger
    />
    </>
  );
};

export default AssignAgentTickets;
