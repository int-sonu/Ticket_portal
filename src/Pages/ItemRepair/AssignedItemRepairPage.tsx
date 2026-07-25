import { useEffect, useMemo, useState } from "react";
import { Empty, Input, Popover, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import {
  useRepairItemActivityList,
  useRepairItemFinishedList,
} from "../../Hooks/Ticket/useTicketQueries";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import TicketModulePagination from "../Ticket/Common/TicketModulePagination";
import filterIcon from "../../assets/icons/filterdetails.svg";
import { agentApis } from "../../Axios/MasterApis";
import { useGetVendorDropdown } from "../Master/VendorMaster/Hooks";

type AssigneeType = "all" | "agent" | "vendor";

type AssigneeOption = {
  label: string;
  value: string;
  type: Exclude<AssigneeType, "all">;
};

const getCurrentAgentName = () => {
  try {
    const storedSession = JSON.parse(sessionStorage.getItem("userSession") || "{}");
    const session = storedSession?.data ?? storedSession;

    return String(
      session?.cAgentName ??
        session?.cUserName ??
        session?.cEmployeeName ??
        session?.name ??
        "Self",
    );
  } catch {
    return "Self";
  }
};

const normalizeText = (value: any) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const formatDisplayValue = (value: any) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    return (
      value?.name ??
      value?.label ??
      value?.title ??
      value?.text ??
      value?.value ??
      value?.cName ??
      value?.cTitle ??
      value?.cDescription ??
      ""
    );
  }

  return String(value);
};

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

const isAssetRow = (record: Record<string, any>) =>
  Boolean(
    record?.isasset ||
      record?.isAsset ||
      record?.bIsAsset ||
      record?.bAsset ||
      record?.is_asset,
  );

const repairStatusOptions = [
  { label: "All", value: 0 },
  { label: "Assigned", value: 1 },
  { label: "On Progress", value: 2 },
];

const AssignedItemRepairPage = () => {
  const navigate = useNavigate();
  const sessionPayload = useMemo<Record<string, any>>(
    () => getRequestPayload() as Record<string, any>,
    [],
  );
  const [activeTab, setActiveTab] = useState<"assigned" | "finished">("assigned");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(0);
  const [draftStatus, setDraftStatus] = useState(0);
  const [assigneeType, setAssigneeType] = useState<AssigneeType>("all");
  const [draftAssigneeType, setDraftAssigneeType] = useState<AssigneeType>("all");
  const [selectedAssignee, setSelectedAssignee] = useState<AssigneeOption | null>(null);
  const [draftAssignee, setDraftAssignee] = useState<AssigneeOption | null>(null);
  const [filterSearch, setFilterSearch] = useState("");

  const currentAgentId = String(
    sessionPayload.id ?? sessionPayload.nAgentId ?? sessionPayload.nCreatedBy ?? "",
  );
  const currentAgentName = useMemo(getCurrentAgentName, []);
  const linkedAgentPayload = useMemo(
    () => ({
      nCompanyId: sessionPayload.nCompanyId,
      nAgentId: Number(currentAgentId) || 0,
      cSchemaName: sessionPayload.cSchemaName,
      cDbName: sessionPayload.cDbName,
    }),
    [currentAgentId, sessionPayload],
  );
  const linkedAgentQuery = useQuery({
    queryKey: ["assigned-item-repair-agent-dropdown", linkedAgentPayload],
    queryFn: () => agentApis.agentDropDown(linkedAgentPayload),
    enabled: !!linkedAgentPayload.nCompanyId && !!linkedAgentPayload.nAgentId,
  });
  const vendorQuery = useGetVendorDropdown(
    {
      nCompanyId: sessionPayload.nCompanyId,
      cSchemaName: sessionPayload.cSchemaName,
      cDbName: sessionPayload.cDbName,
    },
    !!sessionPayload.nCompanyId,
  );
  const linkedAgents = useMemo<AssigneeOption[]>(() => {
    const options = extractList(linkedAgentQuery.data)
      .map((row: Record<string, any>) => ({
        label:
          formatDisplayValue(
            getFieldValue(row, ["cAgentName", "AgentName", "cUserName", "Name"]),
          ) || "Agent",
        value: String(getFieldValue(row, ["nAgentId", "AgentId", "id"]) || ""),
        type: "agent" as const,
      }))
      .filter((agent) => agent.value);
    const self: AssigneeOption = {
      label: currentAgentName,
      value: currentAgentId,
      type: "agent",
    };
    const seen = new Set<string>();
    return [...options, self].filter((agent) => {
      if (!agent.value || seen.has(agent.value)) return false;
      seen.add(agent.value);
      return true;
    });
  }, [currentAgentId, currentAgentName, linkedAgentQuery.data]);
  const vendorOptions = useMemo<AssigneeOption[]>(
    () =>
      extractList(vendorQuery.data)
        .map((row: Record<string, any>) => ({
          label:
            formatDisplayValue(
              getFieldValue(row, ["cVendorName", "VendorName", "cName", "Name"]),
            ) || "Vendor",
          value: String(getFieldValue(row, ["nVendorId", "VendorId", "id"]) || ""),
          type: "vendor" as const,
        }))
        .filter((vendor) => vendor.value),
    [vendorQuery.data],
  );
  const visibleAssigneeOptions = useMemo(() => {
    const term = normalizeText(filterSearch);
    const matches = (option: AssigneeOption) =>
      !term || normalizeText(option.label).includes(term);

    return {
      agents:
        draftAssigneeType === "vendor" ? [] : linkedAgents.filter(matches),
      vendors:
        draftAssigneeType === "agent" ? [] : vendorOptions.filter(matches),
    };
  }, [draftAssigneeType, filterSearch, linkedAgents, vendorOptions]);
  const assignedListPayload = useMemo(
    () => ({
      nCompanyId: sessionPayload.nCompanyId,
      nAgentId: Number(currentAgentId) || 0,
      nStatus: statusFilter || null,
      cSchemaName: sessionPayload.cSchemaName,
      cDbName: sessionPayload.cDbName,
    }),
    [currentAgentId, sessionPayload, statusFilter],
  );

  const assignedQuery = useRepairItemActivityList(
    assignedListPayload,
    !!assignedListPayload?.nAgentId,
  );
  const finishedQuery = useRepairItemFinishedList(
    assignedListPayload,
    !!assignedListPayload?.nAgentId,
  );
  const rows = useMemo(
    () => extractList(activeTab === "finished" ? finishedQuery.data : assignedQuery.data),
    [activeTab, assignedQuery.data, finishedQuery.data],
  );
  const isLoading = activeTab === "finished" ? finishedQuery.isLoading : assignedQuery.isLoading;

  const visibleRows = rows;

  const filteredRows = useMemo(() => {
    const term = normalizeText(search);
    return visibleRows.filter((row) => {
      const assignedAgentId = String(
        getFieldValue(row, [
          "nAssignedAgentId",
          "nAssignedToAgentId",
          "nAssignToAgentId",
          "nAgentId",
        ]) || "",
      );
      const vendorId = String(
        getFieldValue(row, ["nVendorId", "VendorId", "nAssignedVendorId"]) || "",
      );
      const assignedAgentName = formatDisplayValue(
        getFieldValue(row, [
          "cAssignedAgentName",
          "cAssignedTo",
          "cAssignTo",
          "cAgentName",
          "AgentName",
        ]),
      );
      const vendorName = formatDisplayValue(
        getFieldValue(row, ["cVendorName", "VendorName"]),
      );
      const selectedAssigneeMatches =
        !selectedAssignee ||
        (selectedAssignee.type === "agent"
          ? (assignedAgentId && assignedAgentId === selectedAssignee.value) ||
            normalizeText(assignedAgentName) === normalizeText(selectedAssignee.label)
          : (vendorId && vendorId === selectedAssignee.value) ||
            normalizeText(vendorName) === normalizeText(selectedAssignee.label));
      const assigneeTypeMatches =
        assigneeType === "all" ||
        (assigneeType === "vendor"
          ? Boolean(vendorId || vendorName)
          : !vendorId && !vendorName);
      const rowText = [
        getFieldValue(row, ["nRepairId", "RepairId", "id", "Id", "nItemRepairId"]),
        getFieldValue(row, ["nTicketId", "TicketId", "ticketId", "TicketNo"]),
        getFieldValue(row, ["cItemName", "ItemName", "cRepairItemName", "RepairItemName"]),
        getFieldValue(row, ["cCustomerName", "CustomerName"]),
        getFieldValue(row, ["cStatusName"]),
        assignedAgentName,
        vendorName,
        getFieldValue(row, ["dCreatedDate", "CreatedDate", "dRepairDate", "dAssignedOn", "AssignedOn"]),
      ]
        .map((item) => normalizeText(item))
        .join(" ");

      return selectedAssigneeMatches && assigneeTypeMatches && (!term || rowText.includes(term));
    });
  }, [assigneeType, search, selectedAssignee, visibleRows]);

  const totalRows = filteredRows.length;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  const assignedCount = extractList(assignedQuery.data).length;
  const finishedCount = extractList(finishedQuery.data).length;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, assigneeType, search, selectedAssignee, statusFilter]);

  const openTicketView = (row: Record<string, any>) => {
    const ticketId =
      Number(
        getFieldValue(row, ["nTicketId", "TicketId", "ticketId", "TicketNo", "nTicketNo"]),
      ) || 0;

    if (!ticketId) return;

    navigate("/itemrepair/assignitemforrepair/itemforrepairview", {
      state: {
        selectedRow: row,
        isFrom: "item-repair",
        activeTab: "details",
      },
    });
  };


  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-white px-2 py-3 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <h1 className="text-[18px] font-medium text-slate-900">Assign Item For Repair</h1>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <div className="min-w-[180px] flex-1 sm:w-[220px] sm:flex-none">
            <Input
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="h-[34px]"
            />
          </div>
          <Popover
            trigger="click"
            placement="bottomRight"
            open={filterOpen}
            onOpenChange={(open) => {
              if (open) {
                setDraftStatus(statusFilter);
                setDraftAssigneeType(assigneeType);
                setDraftAssignee(selectedAssignee);
                setFilterSearch("");
              }
              setFilterOpen(open);
            }}
            content={
              <div className="flex max-h-[min(66vh,510px)] w-[min(350px,calc(100vw-32px))] flex-col">
                <div className="px-1 pb-1 text-base font-medium text-slate-900">
                  Status
                </div>
                <div className="shrink-0">
                  {repairStatusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDraftStatus(option.value)}
                      className={`block w-full border-b border-slate-100 px-3 py-2.5 text-left text-sm ${
                        draftStatus === option.value
                          ? "bg-sky-50 text-sky-700"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="px-1 pb-2 pt-3 text-base font-medium text-slate-900">
                  Assign to
                </div>
                <Input
                  allowClear
                  prefix={<SearchOutlined className="text-slate-400" />}
                  value={filterSearch}
                  onChange={(event) => setFilterSearch(event.target.value)}
                  placeholder="Search"
                  className="h-[31px]"
                />
                <div className="flex gap-3 border-b border-slate-100 py-2">
                  {(["all", "agent", "vendor"] as AssigneeType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setDraftAssigneeType(type);
                        setDraftAssignee(null);
                      }}
                      className={`rounded-md border px-3 py-1 text-xs ${
                        draftAssigneeType === type
                          ? "border-sky-500 bg-sky-500 text-white"
                          : "border-sky-400 bg-white text-sky-600"
                      }`}
                    >
                      {type === "all" ? "All" : type === "agent" ? "Agents" : "Vendors"}
                    </button>
                  ))}
                </div>

                <div className="min-h-[120px] flex-1 overflow-y-auto pr-1 pt-2">
                  {visibleAssigneeOptions.agents.map((option) => (
                    <button
                      key={`agent-${option.value}`}
                      type="button"
                      onClick={() => setDraftAssignee(option)}
                      className={`block w-full border-b border-slate-100 px-3 py-2.5 text-left text-sm ${
                        draftAssignee?.type === option.type &&
                        draftAssignee?.value === option.value
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                  {visibleAssigneeOptions.vendors.length ? (
                    <>
                      {draftAssigneeType === "all" ? (
                        <div className="px-1 pb-1 pt-3 text-xs text-slate-500">Vendors</div>
                      ) : null}
                      {visibleAssigneeOptions.vendors.map((option) => (
                        <button
                          key={`vendor-${option.value}`}
                          type="button"
                          onClick={() => setDraftAssignee(option)}
                          className={`block w-full border-b border-slate-100 px-3 py-2.5 text-left text-sm ${
                            draftAssignee?.type === option.type &&
                            draftAssignee?.value === option.value
                              ? "bg-slate-100 text-slate-900"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </>
                  ) : null}
                  {!visibleAssigneeOptions.agents.length &&
                  !visibleAssigneeOptions.vendors.length ? (
                    <div className="py-6 text-center text-sm text-slate-400">
                      No assignee found
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-white pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftStatus(statusFilter);
                      setDraftAssigneeType(assigneeType);
                      setDraftAssignee(selectedAssignee);
                      setFilterOpen(false);
                    }}
                    className="rounded-md border border-emerald-500 px-5 py-2 text-sm text-emerald-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter(draftStatus);
                      setAssigneeType(draftAssignee?.type ?? draftAssigneeType);
                      setSelectedAssignee(draftAssignee);
                      setFilterOpen(false);
                    }}
                    className="rounded-md bg-emerald-500 px-5 py-2 text-sm text-white"
                  >
                    Apply
                  </button>
                </div>
              </div>
            }
          >
            <button
              type="button"
              aria-label="Filter assigned repair items"
              className={`flex h-[34px] w-[34px] items-center justify-center rounded-md border ${
                statusFilter || assigneeType !== "all" || selectedAssignee
                  ? "border-sky-400 bg-sky-50"
                  : "border-slate-300 bg-white"
              }`}
            >
              <img src={filterIcon} alt="" className="h-4 w-4" />
            </button>
          </Popover>
          <button
            type="button"
            onClick={() =>
              navigate("/item-repair/pending", {
                state: { sessionPayload: assignedListPayload },
              })
            }
            className="inline-flex h-[34px] items-center justify-center rounded-md bg-emerald-500 px-5 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Add New
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("assigned")}
          className={`rounded-md px-4 py-1.5 text-[13px] font-medium ${
            activeTab === "assigned"
            ? "bg-sky-500 text-white"
              : "border border-sky-300 bg-white text-slate-600 hover:bg-sky-50"
          }`}
        >
          Assigned
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("finished")}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-[13px] font-medium ${
            activeTab === "finished"
              ? "bg-sky-500 text-white"
              : "border border-sky-300 bg-white text-slate-600 hover:bg-sky-50"
          }`}
        >
          Finished
          <span
            className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] ${
              activeTab === "finished" ? "bg-white text-sky-600" : "bg-red-500 text-white"
            }`}
          >
            {finishedCount}
          </span>
        </button>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-x-auto border border-slate-100 bg-white">
        <div className="grid min-w-[760px] grid-cols-[55px_80px_1.2fr_1.2fr_100px_145px] gap-2 border-b border-slate-200 px-3 py-3 text-[12px] font-medium text-slate-900">
          <div>Srl</div>
          <div>Ticket No</div>
          <div>Customer Name</div>
          <div>Item Name</div>
          <div>Assign to</div>
          <div>Assigned on</div>
        </div>

        <div className="min-h-0 min-w-[760px] flex-1 overflow-hidden">
          <Spin spinning={isLoading}>
            {paginatedRows.length > 0 ? (
              <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
                {paginatedRows.map((row: any, index: number) => (
                  <div
                    key={String(
                      getFieldValue(row, ["nRepairId", "RepairId", "id", "Id", "nItemRepairId", "nSrlNo", "SrlNo"]) || index,
                    )}
                    role="button"
                    tabIndex={0}
                    onClick={() => openTicketView(row)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openTicketView(row);
                      }
                    }}
                    className="grid grid-cols-[55px_80px_1.2fr_1.2fr_100px_145px] items-center gap-2 border-b border-slate-100 px-3 py-3 text-[12px] text-slate-700 hover:bg-slate-50"
                  >
                    <div>
                      {currentPage > 0 ? (currentPage - 1) * pageSize + index + 1 : index + 1}
                    </div>
                    <div>
                      {formatDisplayValue(
                        getFieldValue(row, ["nTicketId", "TicketId", "ticketId", "TicketNo"]),
                      ) || "-"}
                    </div>
                    <div>
                      {formatDisplayValue(getFieldValue(row, ["cCustomerName", "CustomerName"])) ||
                        "-"}
                    </div>
                    <div>
                      <span className="flex items-center gap-2">
                        {formatDisplayValue(
                          getFieldValue(row, [
                            "cPartName",
                            "PartName",
                            "cItemName",
                            "ItemName",
                            "cRepairItemName",
                            "RepairItemName",
                          ]),
                        ) }
                        {isAssetRow(row) ? (
                          <span className="text-[12px] text-[#5C5C5C]">(Asset)</span>
                        ) : null}
                      </span>
                    </div>
                    <div>
                      {formatDisplayValue(
                        getFieldValue(row, [
                          "cAssignedAgentName",
                          "cAssignedTo",
                          "cAssignTo",
                          "cAgentName",
                          "AgentName",
                          "cVendorName",
                          "VendorName",
                        ]),
                      ) || "-"}
                    </div>
                    <div>
                      {formatDisplayValue(
                        getFieldValue(row, [
                          "dCreatedDate",
                          "CreatedDate",
                          "dRepairDate",
                          "dAssignedOn",
                          "AssignedOn",
                        ]),
                      ) || "-"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-slate-200 bg-white">
                <Empty description="No repair items found" />
              </div>
            )}
          </Spin>
        </div>
      </div>

      {totalRows > 0 ? (
        <div className="mt-3 bg-white">
          <TicketModulePagination
            elevated={false}
            current={currentPage}
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
          />
        </div>
      ) : null}

    </div>
  );
};

export default AssignedItemRepairPage;
