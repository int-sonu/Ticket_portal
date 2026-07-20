import { useMemo, useState } from "react";
import { Input, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { agentApis } from "../../Axios/MasterApis";
import { reportApis } from "../../Axios/ReportsApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import TicketModulePagination from "../Ticket/Common/TicketModulePagination";
import AntTable from "../../ui/Table/AntTable";

const normalizeText = (value: any) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getFieldValue = (record: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null && record?.[key] !== "") {
      return record[key];
    }
  }

  const recordKey = Object.keys(record || {}).find((item) =>
    keys.some((key) => key.toLowerCase() === item.toLowerCase()),
  );

  return recordKey ? record?.[recordKey] : "";
};

const formatDateTime = (_value: any) => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours24 = now.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const meridian = hours24 >= 12 ? "PM" : "AM";

  return `${day}/${month}/${year} ${String(hours12).padStart(2, "0")}:${minutes} ${meridian}`;
};

const getTicketIdValue = (record: any) =>
  Number(
    getFieldValue(record, [
      "nTicketId",
      "TicketId",
      "ticketId",
      "nTicketNo",
      "TicketNo",
    ]) || 0,
  );

const ReviewClosedTicketsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const sessionPayload = useMemo(() => getRequestPayload() as Record<string, any>, []);
  const payload = useMemo(
    () => ({
      ...sessionPayload,
      pageNumber: 1,
      pageSize: 10,
      cSearch: search.trim(),
      cFromDate: sessionPayload?.cFromDate ?? sessionPayload?.dFromDate,
      cToDate: sessionPayload?.cToDate ?? sessionPayload?.dToDate,
      dFromDate: sessionPayload?.dFromDate ?? sessionPayload?.cFromDate,
      dToDate: sessionPayload?.dToDate ?? sessionPayload?.cToDate,
      cCreatedBy: String(
        sessionPayload?.nCreatedBy ??
          sessionPayload?.nAgentId ??
          sessionPayload?.id ??
          0,
      ),
      cCustomerId: String(sessionPayload?.nCustomerId ?? sessionPayload?.customerId ?? 0),
      cAssignAgentId: String(
        sessionPayload?.nAssignAgentId ??
          sessionPayload?.nAgentId ??
          sessionPayload?.id ??
          0,
      ),
      nCreatedBy:
        Number(
          sessionPayload?.nCreatedBy ??
            sessionPayload?.nAgentId ??
            sessionPayload?.id ??
            0,
        ) || 0,
      nCustomerId: Number(sessionPayload?.nCustomerId ?? sessionPayload?.customerId ?? 0) || 0,
      nAssignAgentId:
        Number(
          sessionPayload?.nAssignAgentId ??
            sessionPayload?.nAgentId ??
            sessionPayload?.id ??
            0,
        ) || 0,
    }),
    [sessionPayload, search],
  );

  const agentListQuery = useQuery({
    queryKey: ["ticket-review-agent-list", sessionPayload],
    queryFn: () => agentApis.agentListAll(sessionPayload),
    enabled: Boolean(sessionPayload?.nCompanyId),
  });

  const query = useQuery({
    queryKey: ["ticket-list-report", payload],
    queryFn: () => reportApis.ticketListReport(payload),
    enabled: Boolean(sessionPayload?.nCompanyId),
  });
  const rows = useMemo(() => extractList(query.data), [query.data]);

  const filteredRows = useMemo(() => {
    const keyword = normalizeText(search);

    return rows.filter((row: Record<string, any>) => {
      const rowText = [
        getFieldValue(row, ["nTicketNo", "TicketNo", "nTicketId", "TicketId"]),
        getFieldValue(row, ["cCustomerName", "CustomerName", "Customer"]),
        getFieldValue(row, ["cTicketSummary", "TicketSummary", "cDescription", "Description"]),
        getFieldValue(row, ["cPriority", "Priority", "PriorityName"]),
        getFieldValue(row, ["cTicketStatus"]),
        getFieldValue(row, ["dCallReportDate", "CallReportDate", "dCreatedDate", "CreatedDate", "CreatedOn"]),
      ]
        .map((item) => normalizeText(item))
        .join(" ");

      return !keyword || rowText.includes(keyword);
    });
  }, [rows, search]);

  const totalRows = filteredRows.length;
  const safeCurrentPage = Math.min(
    currentPage,
    Math.max(1, Math.ceil(totalRows / pageSize)),
  );
  const pagedRows = filteredRows.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  const openTicketView = (record: Record<string, any>) => {
    const ticketId = getTicketIdValue(record);
    if (!ticketId) return;

    navigate(`/tickets/view/${ticketId}`, {
      state: {
        selectedRow: record,
        isFrom: "review-closed-tickets",
        activeTab: "details",
      },
    });
  };

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white p-4">
      <header className="mb-3 flex flex-none items-center justify-between gap-3">
        <h1 className="m-0 text-[18px] font-medium text-slate-950">
          Review Closed Tickets
        </h1>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Agents loaded: {extractList(agentListQuery.data).length}
          </span>
          <Input
            className="w-[300px]"
            allowClear
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        <Spin spinning={query.isLoading || query.isFetching}>
          <AntTable
            elevated={false}
            className="review-closed-ticket-table h-full"
            showPagination={false}
            disableHorizontalScroll
            loading={query.isLoading || query.isFetching}
            dataSource={pagedRows}
            rowKey={(record: any) =>
              String(
                getTicketIdValue(record) ||
                  getFieldValue(record, ["nSrlNo", "SrlNo", "id"]) ||
                  getFieldValue(record, ["nTicketNo", "TicketNo"]) ||
                  "",
              )
            }
            scroll={{ y: "calc(100vh - 230px)" }}
            columns={[
              {
                title: "Srl",
                width: 60,
                render: (_: any, __: any, index: number) =>
                  (safeCurrentPage - 1) * pageSize + index + 1,
              },
              {
                title: "Call Report Date",
                width: 170,
                render: (_: any, record: any) =>
                  formatDateTime(
                    getFieldValue(record, [
                      "dCallReportDate",
                      "CallReportDate",
                      "dCreatedDate",
                      "CreatedDate",
                      "CreatedOn",
                    ]),
                  ),
              },
              {
                title: "Ticket No.",
                width: 100,
                render: (_: any, record: any) =>
                  getFieldValue(record, ["nTicketNo", "TicketNo", "nTicketId", "TicketId"]) ||
                  "-",
              },
              {
                title: "Customer Name",
                width: 150,
                render: (_: any, record: any) =>
                  getFieldValue(record, ["cCustomerName", "CustomerName", "Customer"]) ||
                  "-",
              },
              {
                title: "Ticket Summary",
                render: (_: any, record: any) =>
                  getFieldValue(record, [
                    "cTicketSummary",
                    "TicketSummary",
                    "cDescription",
                    "Description",
                  ]) || "-",
              },
              {
                title: "Priority",
                width: 90,
                render: (_: any, record: any) =>
                  getFieldValue(record, ["cPriority", "Priority", "PriorityName"]) || "-",
              },
              {
                title: "Status",
                width: 120,
                render: (_: any, record: any) =>
                  getFieldValue(record, ["cTicketStatus"]) || "-",
              },
            ]}
            onRow={(record) => ({
              onClick: () => openTicketView(record),
              style: { cursor: "pointer" },
            })}
          />
        </Spin>
      </div>

      {totalRows > 0 ? (
        <div className="mt-3 flex-none">
          <TicketModulePagination
            current={safeCurrentPage}
            pageSize={pageSize}
            total={totalRows}
            onChange={(page, nextPageSize) => {
              setCurrentPage(page);
              setPageSize(nextPageSize);
            }}
            onShowSizeChange={(page, nextPageSize) => {
              setCurrentPage(page);
              setPageSize(nextPageSize);
            }}
            showSizeChanger
          />
        </div>
      ) : null}
    </section>
  );
};

export default ReviewClosedTicketsPage;
