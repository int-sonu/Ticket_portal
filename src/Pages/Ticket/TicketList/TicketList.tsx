import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Input,
  Space,
  Typography,
} from "antd";

import { SearchOutlined } from "@ant-design/icons";

import { useLocation, useNavigate } from "react-router-dom";

import { getRequestPayload } from "../../../Utils/requestPayload";
import tabIcon from "../../../assets/icons/tabIcon.svg";
import tabIconActive from "../../../assets/icons/tabIconActive.svg";
import searchFilterIcon from "../../../assets/icons/searchFilterIcon.svg";
import AntTable from "../../../ui/Table/AntTable";
import QuickCallReportModal from "../Common/QuickCallReportModal";
import TicketModulePagination from "../Common/TicketModulePagination";
import "./TicketList.css";

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
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
};

const PRIORITY_FILTERS = ["Very Low", "Low", "Medium", "High", "Very High"];
const PRIORITY_BY_ID: Record<string, string> = {
  "0": "very low",
  "1": "low",
  "2": "medium",
  "3": "high",
  "4": "very high",
};
const STAGE_FILTERS = [
  "All Tickets",
  "On Hold",
  "Transferred",
  "On Site",
  "Shared",
  "Pending",
];

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

const getSavedTicketRows = (response: any) => {
  const directRows = getRows(response);

  if (directRows.length) {
    return directRows;
  }

  const candidates = [
    response?.result,
    response?.Result,
    response?.message,
    response?.Message,
    response?.data?.result,
    response?.data?.Result,
    response?.data?.message,
    response?.data?.Message,
    response,
  ];

  for (const candidate of candidates) {
    if (!candidate || Array.isArray(candidate)) {
      continue;
    }

    const ticketId =
      candidate?.nTicketId ??
      candidate?.TicketId ??
      candidate?.ticketId ??
      candidate?.nTicketNo ??
      candidate?.TicketNo;

    if (ticketId !== undefined && ticketId !== null && ticketId !== "") {
      return [candidate];
    }
  }

  return [];
};

const mergeSavedRows = (
  rows: any[],
  savedResponse: any,
  savedRecord?: any
) => {
  const savedRows = savedRecord
    ? [savedRecord]
    : getSavedTicketRows(savedResponse);

  if (!savedRows.length) {
    return rows;
  }

  const getRowId = (record: any) =>
    String(
      getFieldValue(record, [
        "TicketId",
        "nTicketId",
        "ticketId",
        "TicketNo",
        "nTicketNo",
      ])
    );

  const rowsById = new Map(rows.map((record: any) => [getRowId(record), record]));

  for (const savedRow of savedRows) {
    const savedRowId = getRowId(savedRow);
    const existingRow = rowsById.get(savedRowId);

    if (existingRow) {
      rowsById.set(savedRowId, {
        ...existingRow,
        ...savedRow,
      });
      continue;
    }

    rowsById.set(savedRowId, savedRow);
  }

  const mergedRows = rows.map((record: any) => {
    const rowId = getRowId(record);
    return rowsById.get(rowId) ?? record;
  });

  const missingSavedRows = savedRows.filter(
    (record: any) => !rows.some((row: any) => getRowId(row) === getRowId(record))
  );

  return [...missingSavedRows, ...mergedRows];
};

const getFieldValue = (record: any, keys: string[]) => {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null) {
      return record[key];
    }
  }

  const recordKey = Object.keys(record || {}).find((item) =>
    keys.some((key) => key.toLowerCase() === item.toLowerCase())
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

  const match = text.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);

  if (!match) return null;

  const [, day, month, year] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatTicketDateTime = (value: any) => {
  if (!value) {
    return {
      primary: "-",
      secondary: "",
    };
  }

  const parsed = parseTicketDate(value);

  if (!parsed) {
    return {
      primary: String(value),
      secondary: "",
    };
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

const formatPeriodValue = (value: any) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return String(value);
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

  if (status.includes("closed") || status.includes("completed")) {
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

const ticketTabs = [
  { key: "ONGOING", label: "Ongoing" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "UNASSIGNED", label: "Unassigned" },
  { key: "CLOSED", label: "Closed" },
  { key: "OVERDUE", label: "Overdue" },
  { key: "POSTPONED", label: "Postponed" },
  { key: "CREATED", label: "Created Tickets" },
];

const isValidTicketTab = (value: unknown): value is string =>
  ticketTabs.some((tab) => tab.key === value);

const tabToViewSource = (tab: string) => {
  switch (tab) {
    case "ONGOING":
      return "ongoing";
    case "UPCOMING":
      return "upcoming";
    case "UNASSIGNED":
      return "unassigned";
    case "OVERDUE":
      return "overdue";
    case "CREATED":
      return "created";
    case "POSTPONED":
      return "postponed";
    case "CLOSED":
      return "closed";
    default:
      return "ticket";
  }
};

const getTicketIdValue = (record: any) =>
  Number(
    getFieldValue(record, [
      "nTicketId",
      "TicketId",
      "nTicketid",
      "TicketNo",
      "nTicketNo",
    ]) || 0
  );

const TicketList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as Record<string, any> | null) ?? {};
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [quickCallOpen, setQuickCallOpen] = useState(
    Boolean(locationState.openQuickCall)
  );

  const [activeTab, setActiveTab] = useState(
    isValidTicketTab(locationState.activeTab)
      ? locationState.activeTab
      : "ONGOING"
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [priorityFilters, setPriorityFilters] =
    useState<string[]>(PRIORITY_FILTERS);
  const [stageFilters, setStageFilters] = useState<string[]>([]);
  const [draftPriorityFilters, setDraftPriorityFilters] =
    useState<string[]>(PRIORITY_FILTERS);
  const [draftStageFilters, setDraftStageFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");

  const basePayload = getRequestPayload();
  const quickCallTicketValues =
    locationState.quickCallTicketValues ?? locationState.selectedRow ?? {};
  const quickCallTicketId = Number(
    locationState.savedTicketId ??
      quickCallTicketValues.nTicketId ??
      quickCallTicketValues.TicketId ??
      quickCallTicketValues.ticketId ??
      0
  );

  useEffect(() => {
    if (locationState.openQuickCall) {
      setQuickCallOpen(true);
    }
  }, [locationState.openQuickCall, quickCallTicketId]);

  useEffect(() => {
    if (isValidTicketTab(locationState.activeTab)) {
      setActiveTab(locationState.activeTab);
    }
  }, [locationState.activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target as Node)
      ) {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const today = new Date();
  const currentYear = today.getFullYear();

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
        : String(basePayload.nAgentId ?? basePayload.id ?? 0),
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

  const ongoing = useTicketOngoing(payload, activeTab === "ONGOING");
  const upcoming = useTicketUpcoming(upcomingPayload, activeTab === "UPCOMING");
  const unassigned = useTicketUnAssigned(payload, activeTab === "UNASSIGNED");
  const closed = useClosedTicketList(closedPayload, activeTab === "CLOSED");
  const overdue = useOverdueTicketList(dashboardPayload, activeTab === "OVERDUE");
  const postponed = usePostponedTicketList(dashboardPayload, activeTab === "POSTPONED");
  const created = useCreatedTicketList(dashboardPayload, activeTab === "CREATED");

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, priorityFilters, stageFilters, pageSize, searchText]);

  const getTableData = () => {
    switch (activeTab) {
      case "ONGOING":
        return mergeSavedRows(
          getRows(ongoing.data),
          locationState.savedTicketResponse,
          locationState.savedTicketRecord
        );
      case "UPCOMING":
        return mergeSavedRows(
          getRows(upcoming.data),
          locationState.savedTicketResponse,
          locationState.savedTicketRecord
        );
      case "UNASSIGNED":
        return getRows(unassigned.data);
      case "CLOSED":
        return getRows(closed.data);
      case "OVERDUE": {
        const overdueRows = getRows(overdue.data);

        if (overdueRows.length) {
          return overdueRows;
        }

        return getRows(ongoing.data).filter(isOverdueTicket);
      }
      case "POSTPONED":
        return getRows(postponed.data);
      case "CREATED":
        return mergeSavedRows(
          getRows(created.data),
          locationState.savedTicketResponse,
          locationState.savedTicketRecord
        );
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

  const getPriorityValue = (record: any) =>
    getFieldValue(record, [
      "Priority",
      "PriorityName",
      "cPriority",
      "cPriorityName",
      "cPriorityLevel",
      "nPriority",
      "nPriorityId",
    ]);

  const getStageValue = (record: any) =>
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
    ]);

  const filteredRows = getTableData().filter((record: any) => {
    const query = searchText.trim().toLowerCase();
    const priorityValue = getPriorityValue(record);
    const ticketNo = getFieldValue(record, [
      "TicketNo",
      "cTicketNo",
      "cTicketNumber",
      "nTicketNo",
    ]);
    const customerName = getFieldValue(record, [
      "CustomerName",
      "cCustomerName",
      "cCustName",
      "Customer",
    ]);
    const summary = getFieldValue(record, [
      "TicketSummary",
      "cTicketSummary",
      "cSummary",
      "cDescription",
      "cComplaint",
    ]);
    const statusText = getStageValue(record);

    const searchMatches =
      !query ||
      [ticketNo, customerName, summary, priorityValue, statusText]
        .join(" ")
        .toLowerCase()
        .includes(query);

    const rawPriority = String(priorityValue ?? "")
      .trim()
      .toLowerCase();
    const normalizedPriority = PRIORITY_BY_ID[rawPriority] ?? rawPriority;
    const priorityMatches =
      priorityFilters.length === PRIORITY_FILTERS.length ||
      priorityFilters.some(
        (item) => item.toLowerCase() === normalizedPriority,
      );

    const normalizedStage = String(statusText ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    const flagEnabled = (keys: string[]) => {
      const value = getFieldValue(record, keys);
      return (
        value === true ||
        value === 1 ||
        ["true", "1", "yes", "y"].includes(
          String(value ?? "").trim().toLowerCase(),
        )
      );
    };
    const stageMatches =
      stageFilters.length === 0 ||
      stageFilters.some((stage) => {
        switch (stage) {
          case "On Hold":
            return normalizedStage.includes("hold");
          case "Transferred":
            return (
              normalizedStage.includes("transfer") ||
              flagEnabled(["bTransferred", "IsTransferred", "Transferred"])
            );
          case "On Site":
            return (
              normalizedStage.includes("on site") ||
              normalizedStage.includes("onsite") ||
              flagEnabled(["bOnSite", "bOnsite", "OnsiteRequired"])
            );
          case "Shared":
            return (
              normalizedStage.includes("shared") ||
              flagEnabled(["bShared", "IsShared", "Shared"])
            );
          case "Pending":
            return normalizedStage.includes("pending");
          default:
            return true;
        }
      });

    return searchMatches && priorityMatches && stageMatches;
  }).sort((a: any, b: any) => getTicketIdValue(b) - getTicketIdValue(a));

  const totalRows = filteredRows.length;
  const safeCurrentPage = Math.min(
    currentPage,
    Math.max(1, Math.ceil(totalRows / pageSize))
  );
  const pagedRows = filteredRows.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const handleOpenChange = (open: boolean) => {
    setFilterOpen(open);

    if (open) {
      setDraftPriorityFilters(priorityFilters);
      setDraftStageFilters(stageFilters);
    }
  };

  const handleResetFilters = () => {
    setDraftPriorityFilters(priorityFilters);
    setDraftStageFilters(stageFilters);
    setFilterOpen(false);
  };

  const handleApplyFilters = () => {
    setPriorityFilters(draftPriorityFilters);
    setStageFilters(draftStageFilters);
    setCurrentPage(1);
    setFilterOpen(false);
  };

  const handlePageChange = (page: number, nextPageSize: number) => {
    setCurrentPage(page);
    setPageSize(nextPageSize);
  };

  const columns = [
    {
      title: "Srl",
      render: (_: any, __: any, index: number) => index + 1,
      width: 48,
    },
    {
      title: "Created Date & Time",
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
          ])
        );

        const periodText = formatPeriodValue(
          getFieldValue(record, [
            "cPeriod",
            "Period",
            "PeriodValue",
          ])
        );

        const viewSummary = getFieldValue(record, [
          "cViewSummary",
          "ViewSummary",
          "cSummary",
        ]);

        const createdFrom = getFieldValue(record, [
          "CreatedFrom",
          "cCreatedFrom",
          "SourceName",
        ]);

        const summaryText =
          viewSummary ||
          (createdFrom
            ? `Created From ${createdFrom} on ${formatted.primary}`
            : "");

        return (
          <div
            className="cursor-pointer"
            style={{
              margin: 0,
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            <span style={{ whiteSpace: "nowrap" }}>
              {formatted.primary}
            </span>{" "}
            {periodText ? (
              <span
                style={{
                  color: "#838383",
                  whiteSpace: "nowrap",
                }}
              >
                ( {periodText} )
              </span>
            ) : null}
            {summaryText ? (
              <div
                style={{
                  color: "#1664F8",
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                {summaryText}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Ticket No.",
      width: 92,
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
      width: 130,
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
      render: (_: any, record: any) => {
        const summary = getFieldValue(record, [
          "TicketSummary",
          "cTicketSummary",
          "cSummary",
          "cDescription",
          "cComplaint",
        ]);

        return (
          <div
            style={{
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            {summary}
          </div>
        );
      },
    },
    {
      title: "Priority",
      width: 86,
      render: (_: any, record: any) => {
        const priority = getPriorityValue(record);

        return (
          <span
            style={{
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            {priority || "-"}
          </span>
        );
      },
    },
    {
      title: "Status",
      width: 86,
      render: (_: any, record: any) => getStageValue(record),
    },
  ];

  const renderTabButton = (key: string, label: string) => {
    const isActive = activeTab === key;

    return (
      <Button
        key={key}
        type="text"
        onClick={() => setActiveTab(key)}
        icon={
          <img
            src={isActive ? tabIconActive : tabIcon}
            alt=""
            aria-hidden="true"
            style={{
              width: 14,
              height: 14,
              display: "block",
            }}
          />
        }
        style={{
          height: 28,
          padding: "0 10px",
          borderRadius: 4,
          border: "1px solid",
          borderColor: isActive ? "#2f80ed" : "#cbd5e1",
          backgroundColor: isActive ? "#2f80ed" : "#f8fafc",
          color: isActive ? "#ffffff" : "#475569",
          fontSize: 10,
          fontWeight: 600,
          boxShadow: "none",
        }}
      >
        {label}
      </Button>
    );
  };

  return (
    <>
    <Card
      bordered={false}
      bodyStyle={{
        background: "#ffffff",
        borderRadius: 8,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
      style={{
        borderRadius: 8,
        height: "calc(100vh - 96px)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
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
            Tickets
          </Typography.Title>

          <Space size={10} wrap>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              allowClear
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

            <div ref={filterPanelRef} className="relative">
              <button
                type="button"
                aria-label="Filter tickets"
                onClick={() => handleOpenChange(!filterOpen)}
                className={`flex h-8 w-9 items-center justify-center rounded-md border ${
                  filterOpen || stageFilters.length > 0 ||
                  priorityFilters.length !== PRIORITY_FILTERS.length
                    ? "border-sky-500 bg-sky-50"
                    : "border-slate-300 bg-white"
                }`}
              >
                <img src={searchFilterIcon} alt="" className="h-4 w-4" />
              </button>

              {filterOpen ? (
                <div className="absolute right-0 top-10 z-[1000] w-[375px] max-w-[calc(100vw-32px)] rounded-xl bg-white p-5 shadow-[0_12px_38px_rgba(15,23,42,0.18)]">
                  <div className="text-sm font-medium text-slate-800">
                    Priority Level
                  </div>
                  <div className="relative mt-5 grid grid-cols-5">
                    <div className="absolute left-[10%] right-[10%] top-2.5 h-1 bg-sky-200" />
                    {PRIORITY_FILTERS.map((priority) => {
                      const selected = draftPriorityFilters.includes(priority);
                      return (
                        <button
                          key={priority}
                          type="button"
                          onClick={() =>
                            setDraftPriorityFilters((current) => {
                              if (current.length === PRIORITY_FILTERS.length) {
                                return [priority];
                              }

                              if (!current.includes(priority)) {
                                return [...current, priority];
                              }

                              const remaining = current.filter(
                                (item) => item !== priority,
                              );
                              return remaining.length
                                ? remaining
                                : PRIORITY_FILTERS;
                            })
                          }
                          className="relative z-10 flex flex-col items-center gap-2 text-[11px] text-slate-600"
                        >
                          <span
                            className={`h-5 w-5 rounded-full border-2 ${
                              selected
                                ? "border-sky-300 bg-sky-300"
                                : "border-slate-300 bg-white"
                            }`}
                          />
                          <span className="whitespace-nowrap">{priority}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="my-6 border-t border-slate-200" />

                  <div className="text-sm font-medium text-slate-800">
                    Ticket Stages
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {STAGE_FILTERS.map((stage) => {
                      const selected =
                        stage === "All Tickets"
                          ? draftStageFilters.length === 0
                          : draftStageFilters.includes(stage);
                      return (
                        <button
                          key={stage}
                          type="button"
                          onClick={() => {
                            if (stage === "All Tickets") {
                              setDraftStageFilters([]);
                              return;
                            }
                            setDraftStageFilters((current) =>
                              current.includes(stage)
                                ? current.filter((item) => item !== stage)
                                : [...current, stage],
                            );
                          }}
                          className={`rounded-full border px-4 py-1.5 text-xs ${
                            selected
                              ? "border-sky-500 bg-sky-50 text-sky-700"
                              : "border-slate-400 bg-white text-slate-700"
                          }`}
                        >
                          {stage}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-12 flex justify-end gap-3">
                    <Button onClick={handleResetFilters}>Cancel</Button>
                    <Button
                      type="primary"
                      onClick={handleApplyFilters}
                      className="!border-emerald-500 !bg-emerald-500"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

         <Button
  type="primary"
  className="!bg-emerald-500 !border-emerald-500 hover:!bg-emerald-600"
  onClick={() => navigate("/tickets/create")}
>
  Create New Ticket
</Button>
          </Space>
        </div>

        <Space wrap style={{ gap: 8, marginBottom: 12 }}>
          {ticketTabs.map((tab) => renderTabButton(tab.key, tab.label))}
        </Space>

        <div style={{ width: "100%", flex: 1, minHeight: 0 }}>
          <AntTable
            className="ticket-list-table"
            rowKey={(record) =>
              getFieldValue(record, ["TicketId", "nTicketId", "nTicketid"])
            }
            columns={columns}
            dataSource={pagedRows}
            loading={getTableLoading()}
            size="small"
            disableHorizontalScroll
            scroll={{ y: "calc(100vh - 230px)" }}
            showPagination={false}
            onRow={(record) => ({
              onClick: () => {
                const ticketId = getTicketIdValue(record);
                if (ticketId) {
                  navigate(`/tickets/view/${ticketId}`, {
                    state: {
                      selectedRow: record,
                      isFrom: tabToViewSource(activeTab),
                    },
                  });
                }
              },
              style: { cursor: "pointer" },
            })}
          />
        </div>
      </div>
    </Card>

    <div className="w-full mt-2">
      <TicketModulePagination
        current={safeCurrentPage}
        pageSize={pageSize}
        total={totalRows}
        onChange={handlePageChange}
        onShowSizeChange={handlePageChange}
        showSizeChanger
      />
    </div>

    <QuickCallReportModal
      open={quickCallOpen}
      onClose={() => {
        setQuickCallOpen(false);
        navigate("/tickets", { replace: true, state: {} });
      }}
      ticketId={quickCallTicketId}
      ticketValues={quickCallTicketValues}
      sessionPayload={basePayload}
      assignedAgentDetails={quickCallTicketValues.cAssignedId ?? []}
    />
    </>
  );
};

export default TicketList;
