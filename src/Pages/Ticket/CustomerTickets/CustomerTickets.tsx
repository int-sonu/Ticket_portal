import { Avatar, Button, Empty, Input, Space, Typography } from "antd";
import { CloseOutlined, SearchOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useCustomerWiseActiveTicketList } from "../../../Hooks/Ticket/useTicketQueries";
import { getRequestPayload } from "../../../Utils/requestPayload";
import AntTable from "../../../ui/Table/AntTable";
import { extractList } from "../../Master/Common/SimpleMasterUtils";
import TicketModulePagination from "../Common/TicketModulePagination";
import "../TicketList/TicketList.css";

interface CustomerTicketsLocationState {
  customerId?: string | number;
  customerName?: string;
  returnTo?: string;
  ticketRows?: any[];
  draftValues?: Record<string, any>;
  hideSkipButton?: boolean;
}

const getFieldValue = (record: any, keys: string[]) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null) {
      return record[key];
    }
  }

  const recordKey = Object.keys(record || {}).find((item) =>
    keys.some((key) => key.toLowerCase() === item.toLowerCase()),
  );

  if (!recordKey) return "";
  return record[recordKey] ?? "";
};

const parseTicketDate = (value: any) => {
  if (!value) return null;

  const text = String(value);
  const direct = new Date(text);

  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const match = text.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (!match) return null;

  const [, day, month, year] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatTicketDateTime = (value: any) => {
  if (!value) {
    return { primary: "-", secondary: "" };
  }

  const parsed = parseTicketDate(value);
  if (!parsed) {
    return { primary: String(value), secondary: "" };
  }

  const dateLabel = parsed
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replaceAll("-", "/");

  const timeLabel = parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return {
    primary: `${dateLabel} ${timeLabel}`,
    secondary: "",
  };
};

const getTicketIdValue = (record: any) =>
  Number(
    getFieldValue(record, [
      "nTicketId",
      "TicketId",
      "nTicketid",
      "TicketNo",
      "nTicketNo",
    ]) || 0,
  );

const CustomerTickets = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isPreviousTicketsRoute = location.pathname.includes("previoustickets");
  const isCustomerTicketsRoute = location.pathname.includes("customertickets");
  const [searchParams] = useSearchParams();

  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const locationState =
    (location.state as CustomerTicketsLocationState | null) ?? {};
  const prefetchedRows = locationState.ticketRows ?? [];
  const returnTo = locationState.returnTo ?? "/tickets/create";
  const hideSkipButton = locationState.hideSkipButton ?? false;
  const shouldHideSkipButton = isPreviousTicketsRoute || hideSkipButton;

  const customerName =
    locationState.customerName ??
    searchParams.get("customerName") ??
    searchParams.get("name") ??
    searchParams.get("customer") ??
    "";

  const customerId =
    locationState.customerId ??
    searchParams.get("customerId") ??
    searchParams.get("id") ??
    searchParams.get("nCustomerId") ??
    "";

  const resolvedCustomerName =
    String(customerName || locationState.customerName || "").trim() || "-";

  const customerInitial = resolvedCustomerName
    .replace(/[^a-z0-9]/gi, "")
    .charAt(0)
    .toUpperCase();

  const basePayload = useMemo(
    () => ({
      ...getRequestPayload(),
      pageNumber: 1,
      pageSize: 1000,
    }),
    [],
  );

  const payload = useMemo(
    () => ({
      ...basePayload,
      CustomerId: customerId,
      customerId,
      nCustomerId: customerId,
      CustomerName: customerName,
      cCustomerName: customerName,
      pageNumber: 1,
      pageSize: 1000,
    }),
    [basePayload, customerId, customerName],
  );

  const enabled = Boolean(customerId || customerName) && prefetchedRows.length === 0;

  const { data, isFetching, isError } = useCustomerWiseActiveTicketList(
    payload,
    enabled,
  );

  const rows = useMemo(() => {
    if (prefetchedRows.length > 0) {
      return prefetchedRows;
    }

    return extractList(data);
  }, [data, prefetchedRows]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((record: any) => {
      const ticketNo = getFieldValue(record, [
        "TicketNo",
        "cTicketNo",
        "cTicketNumber",
        "nTicketNo",
      ]);
      const summary = getFieldValue(record, [
        "TicketSummary",
        "cTicketSummary",
        "cSummary",
        "cDescription",
        "TicketDescription",
      ]);
      const priority = getFieldValue(record, [
        "Priority",
        "PriorityName",
        "cPriority",
        "cPriorityName",
      ]);
      const status = getFieldValue(record, [
        "cTicketStatus",
      ]);

      return [ticketNo, summary, priority, status]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [rows, searchText]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, customerId, customerName]);

  const totalRows = filteredRows.length;
  const safeCurrentPage = Math.min(
    currentPage,
    Math.max(1, Math.ceil(totalRows / pageSize)),
  );

  const pagedRows = filteredRows.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const goBackWithDraft = () => {
    if (returnTo) {
      navigate(returnTo, {
        state: {
          ...(location.state as Record<string, any> | null),
          draftValues: locationState.draftValues,
        },
        replace: true,
      });
      return;
    }

    navigate(-1);
  };

  const openTicketView = (record: any) => {
    const ticketId = getTicketIdValue(record);

    if (!ticketId) return;

    navigate(`/tickets/view/${ticketId}`, {
      state: {
        selectedRow: record,
        isFrom: "followup",
      },
    });
  };

  const openFollowUpForm = (record: any) => {
    const ticketId = getTicketIdValue(record);

    if (!ticketId) return;

    const customerIdValue =
      getFieldValue(record, ["nCustomerId", "CustomerId", "customerId"]) ||
      customerId;
    const customerNameValue =
      getFieldValue(record, ["CustomerName", "cCustomerName", "Customer"]) ||
      resolvedCustomerName;
    const contactPersonValue = getFieldValue(record, [
      "ContactPerson",
      "cContactPerson",
    ]);
    const contactNoValue = getFieldValue(record, [
      "ContactNo",
      "cContactNumber",
      "ContactNumber",
    ]);
    const emailValue = getFieldValue(record, ["Email", "cEmail"]);
    const summaryValue =
      getFieldValue(record, [
        "TicketSummary",
        "cTicketSummary",
        "cSummary",
        "cDescription",
      ]) || "";
    const descriptionValue =
      getFieldValue(record, [
        "Description",
        "cDescription",
        "TicketDescription",
      ]) || summaryValue;
    const priorityValue = getFieldValue(record, [
      "Priority",
      "PriorityName",
      "cPriority",
      "cPriorityName",
    ]);
    const groupValue = getFieldValue(record, ["nGroupId", "GroupId", "Group"]);
    const serviceTypeValue = getFieldValue(record, [
      "nServiceType",
      "ServiceType",
      "ServiceTypeId",
      "nServiceTypeId",
    ]);
    const sourceValue = getFieldValue(record, [
      "nSourceId",
      "Source",
      "SourceId",
      "TicketSourceId",
    ]);
    const assetIdValue = getFieldValue(record, [
      "nAssetId",
      "AssetId",
      "assetId",
    ]);
    const assetNameValue = getFieldValue(record, [
      "AssetName",
      "cAssetName",
      "assetName",
    ]);

    navigate("/tickets/create", {
      state: {
        selectedRow: record,
        followupSourceTicket: {
          nTicketId: ticketId,
          cViewSummary: summaryValue || "Follow up ticket",
          summary: summaryValue,
          description: descriptionValue,
        },
        draftValues: {
          CustomerId: customerIdValue,
          CustomerName: customerNameValue,
          ContactPerson: contactPersonValue,
          ContactNo: contactNoValue,
          Email: emailValue,
          IssueSummary: summaryValue || "Follow up ticket",
          Description: descriptionValue,
          Priority: priorityValue || "Low",
          Group: groupValue,
          ServiceType: serviceTypeValue,
          Source: sourceValue,
          AssetId: assetIdValue,
          AssetName: assetNameValue,
        },
        isFrom: "followup",
      },
    });
  };

  const openPreviousCall = (record: any) => {
    const ticketId = getTicketIdValue(record);

    if (!ticketId) return;

    navigate(`/tickets/view/${ticketId}`, {
      state: {
        selectedRow: record,
        isFrom: "history",
        activeTab: "history",
      },
    });
  };

  const columns = useMemo(
    () => {
      const baseColumns = [
        {
          title: "Srl",
          width: 48,
          render: (_: any, __: any, index: number) =>
            (safeCurrentPage - 1) * pageSize + index + 1,
        },
        {
          title: "Creation Date & Time",
          width: 210,
          render: (_: any, record: any) => {
            const formatted = formatTicketDateTime(
              getFieldValue(record, [
                "CreatedDate",
                "CreatedDateTime",
                "CreatedOn",
                "dCreatedDate",
                "dCreatedOn",
                "cDate",
                "FollowupDate",
                "dFollowupDate",
              ]),
            );

            return (
              <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                <div>{formatted.primary}</div>
                {formatted.secondary ? (
                  <div style={{ color: "#2563eb", fontSize: 10 }}>
                    {formatted.secondary}
                  </div>
                ) : null}
              </div>
            );
          },
        },
        {
          title: "Ticket No.",
          width: 96,
          render: (_: any, record: any) =>
            String(
              getFieldValue(record, [
                "TicketNo",
                "cTicketNo",
                "cTicketNumber",
                "nTicketNo",
              ]) || "-",
            ),
        },
        
        {
          title: "Ticket Summary",
          width: 280,
          render: (_: any, record: any) => {
            const summary =
              getFieldValue(record, [
                "TicketSummary",
                "cTicketSummary",
                "cSummary",
                "cDescription",
                "TicketDescription",
              ]) || "-";

            return (
              <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                {summary}
              </div>
            );
          },
        },
        {
          title: "Priority",
          width: 88,
          render: (_: any, record: any) =>
            getFieldValue(record, [
              "Priority",
              "PriorityName",
              "cPriority",
              "cPriorityName",
            ]) || "-",
        },
        {
          title: "Status",
          width: 140,
          render: (_: any, record: any) =>
            getFieldValue(record, [
              
              "cTicketStatus",
            ]) || "-",
        },
      ];

      if (isCustomerTicketsRoute) {
        baseColumns.push({
          title: "Action",
          width: 124,
          render: (_: any, record: any) => (
            <Button
              type="primary"
              size="small"
              style={{
                minWidth: 98,
                background: "#22c55e",
                borderColor: "#22c55e",
              }}
              onClick={(event) => {
                event.stopPropagation();
                openFollowUpForm(record);
              }}
            >
              FollowUp
            </Button>
          ),
        });
      }

      return baseColumns;
    },
    [isCustomerTicketsRoute, openTicketView, pageSize, resolvedCustomerName, safeCurrentPage],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        height: "calc(100vh - 96px)",
        minHeight: "calc(100vh - 96px)",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          width: "100%",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minHeight: 0,
            height: "100%",
            background: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Typography.Title
              level={3}
              style={{
                margin: 0,
                color: "#111827",
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              {isPreviousTicketsRoute
                ? "Previous Tickets"
                : `${resolvedCustomerName} Tickets`}
            </Typography.Title>

            <Space size={8} wrap>
              <Input
                prefix={<SearchOutlined style={{ color: "#6b7280" }} />}
                placeholder="Search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                allowClear
                style={{
                  width: 280,
                  height: 30,
                  borderRadius: 8,
                }}
                styles={{
                  input: {
                    fontSize: 12,
                  },
                }}
              />

              <Button
                type="text"
                icon={<CloseOutlined />}
                aria-label="Close previous tickets"
                onClick={goBackWithDraft}
                style={{
                  color: "#111827",
                  fontSize: 16,
                  width: 32,
                  height: 32,
                }}
              />
            </Space>
          </div>

          <div
           
          >
           
            
          </div>

          <div>
            <AntTable
              elevated={false}
              height={300}
              className="ticket-list-table"
              rowKey={(record) =>
                getFieldValue(record, [
                  "TicketId",
                  "nTicketId",
                  "nTicketid",
                  "TicketNo",
                  "nTicketNo",
                ]) || getFieldValue(record, ["id", "ID"])
              }
              columns={columns as any}
              dataSource={pagedRows}
              loading={isFetching}
              size="small"
              disableHorizontalScroll
              tableLayout="fixed"
              scroll={{ y: "calc(100vh - 270px)" }}
              onRow={(record) => ({
                onClick: () =>
                  isCustomerTicketsRoute
                    ? openTicketView(record)
                    : openPreviousCall(record),
                style: { cursor: "pointer" },
              })}
              locale={{
                emptyText: isError ? (
                  <Empty description="Unable to load customer tickets" />
                ) : (
                  <Empty description="No tickets found" />
                ),
              }}
              showPagination={false}
            />
          </div>

          {!shouldHideSkipButton ? (
            <div className="flex justify-end -pt-50 z-10">
              <Button
                type="primary"
                style={{
                  minWidth: 100,
                  height: 38,
                  background: "#009966",
                  borderColor: "#009966",
                }}
                onClick={goBackWithDraft}
              >
                Skip
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="w-full -mt-20 -mb-15">
        <TicketModulePagination
          elevated={false}
          current={safeCurrentPage}
          pageSize={pageSize}
          total={totalRows}
          onChange={handlePageChange}
          onShowSizeChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default CustomerTickets;
