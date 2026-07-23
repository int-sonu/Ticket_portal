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
import assign from "../../assets/icons/assign.svg";
import filterIcon from "../../assets/icons/filterdetails.svg";
import { agentApis } from "../../Axios/MasterApis";
import AgentSelectorModal, { type SharedAgentOption } from "../More/AgentSelectorModal";
import profileSwitch from "../../assets/icons/profile-switch.svg";
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
  { label: "Waiting For Customer Approval", value: 3 },
  { label: "OnHold", value: 4 },
  { label: "Parts Need External Repair", value: 5 },
  { label: "Waiting Spare", value: 6 },
  { label: "Transferred", value: 7 },
  { label: "Customer Approved", value: 8 },
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
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<SharedAgentOption>({
    label: String(
      sessionPayload.cAgentName ??
        sessionPayload.cUserName ??
        sessionPayload.cEmployeeName ??
        "Self",
    ),
    value: String(
      sessionPayload.id ?? sessionPayload.nAgentId ?? sessionPayload.nCreatedBy ?? "",
    ),
    role: "Self",
    isSelf: true,
  });

  const currentAgentId = String(
    sessionPayload.id ?? sessionPayload.nAgentId ?? sessionPayload.nCreatedBy ?? "",
  );
  const currentAgentName = String(
    sessionPayload.cAgentName ??
      sessionPayload.cUserName ??
      sessionPayload.cEmployeeName ??
      "Self",
  );
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
    queryKey: ["assigned-item-repair-linked-agents", linkedAgentPayload],
    queryFn: () => agentApis.agentUnderSupervisorList(linkedAgentPayload),
    enabled: !!linkedAgentPayload.nCompanyId && !!linkedAgentPayload.nAgentId,
  });
  const linkedAgents = useMemo<SharedAgentOption[]>(() => {
    const options = extractList(linkedAgentQuery.data)
      .map((row: Record<string, any>) => ({
        label:
          formatDisplayValue(
            getFieldValue(row, ["cAgentName", "AgentName", "cUserName", "Name"]),
          ) || "Agent",
        value: String(getFieldValue(row, ["nAgentId", "AgentId", "id"]) || ""),
        role:
          formatDisplayValue(
            getFieldValue(row, ["cRoleName", "RoleName", "cDesignation", "Designation"]),
          ) || "Agent",
      }))
      .filter((agent) => agent.value);
    const self: SharedAgentOption = {
      label: currentAgentName,
      value: currentAgentId,
      role: "Self",
      isSelf: true,
    };
    const seen = new Set<string>();
    return [self, ...options].filter((agent) => {
      if (!agent.value || seen.has(agent.value)) return false;
      seen.add(agent.value);
      return true;
    });
  }, [currentAgentId, currentAgentName, linkedAgentQuery.data]);
  const visibleLinkedAgents = useMemo(() => {
    const term = normalizeText(agentSearch);
    return term
      ? linkedAgents.filter((agent) =>
          normalizeText(`${agent.label} ${agent.role ?? ""}`).includes(term),
        )
      : linkedAgents;
  }, [agentSearch, linkedAgents]);
  const assignedListPayload = useMemo(
    () => ({
      nCompanyId: sessionPayload.nCompanyId,
      nAgentId: Number(selectedAgent.value) || Number(currentAgentId) || 0,
      nStatus: statusFilter || null,
      cSchemaName: sessionPayload.cSchemaName,
      cDbName: sessionPayload.cDbName,
    }),
    [currentAgentId, selectedAgent.value, sessionPayload, statusFilter],
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
      const rowText = [
        getFieldValue(row, ["nRepairId", "RepairId", "id", "Id", "nItemRepairId"]),
        getFieldValue(row, ["nTicketId", "TicketId", "ticketId", "TicketNo"]),
        getFieldValue(row, ["cItemName", "ItemName", "cRepairItemName", "RepairItemName"]),
        getFieldValue(row, ["cCustomerName", "CustomerName"]),
        getFieldValue(row, ["cStatusName"]),
        getFieldValue(row, ["dCreatedDate", "CreatedDate", "dRepairDate", "dAssignedOn", "AssignedOn"]),
      ]
        .map((item) => normalizeText(item))
        .join(" ");

      return !term || rowText.includes(term);
    });
  }, [search, visibleRows]);

  const totalRows = filteredRows.length;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  const assignedCount = extractList(assignedQuery.data).length;
  const finishedCount = extractList(finishedQuery.data).length;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, statusFilter, selectedAgent.value]);

  const openTicketView = (row: Record<string, any>) => {
    const ticketId =
      Number(
        getFieldValue(row, ["nTicketId", "TicketId", "ticketId", "TicketNo", "nTicketNo"]),
      ) || 0;

    if (!ticketId) return;

    navigate(`/itemrepair/assignitemforrepair/itemforrepairview/${ticketId}`, {
      state: {
        selectedRow: row,
        isFrom: "item-repair",
        activeTab: "details",
      },
    });
  };


  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[18px] font-medium text-slate-900">Assign Item For Repair</h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAgentModalOpen(true)}
            className="inline-flex h-[34px] max-w-[210px] items-center gap-2 rounded-md border border-sky-300 bg-sky-50 px-3 text-sm text-slate-700 hover:bg-sky-100"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-300 text-xs font-semibold text-slate-800">
              {(selectedAgent.label[0] || "A").toUpperCase()}
            </span>
            <span className="truncate">
              {selectedAgent.label}
              {selectedAgent.role ? ` (${selectedAgent.role})` : ""}
            </span>
            <img src={profileSwitch} alt="" className="ml-auto h-4 w-4" />
          </button>
          <div className="w-full max-w-[220px]">
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
              setDraftStatus(statusFilter);
              setFilterOpen(open);
            }}
            content={
              <div className="w-[330px]">
                <div className="border-b border-slate-100 px-2 pb-3 text-base font-medium">
                  Status
                </div>
                <div className="max-h-[390px] overflow-y-auto py-2">
                  {repairStatusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDraftStatus(option.value)}
                      className={`block w-full border-b border-slate-100 px-3 py-3 text-left text-sm ${
                        draftStatus === option.value
                          ? "bg-sky-500 text-white"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="rounded-md border border-emerald-500 px-5 py-2 text-sm text-emerald-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter(draftStatus);
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
              aria-label="Filter assigned repair items by status"
              className={`flex h-[34px] w-[34px] items-center justify-center rounded-md border ${
                statusFilter ? "border-sky-400 bg-sky-50" : "border-slate-300 bg-white"
              }`}
            >
              <img src={filterIcon} alt="" className="h-4 w-4" />
            </button>
          </Popover>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("assigned")}
          className={`rounded-md px-4 py-1.5 text-[13px] font-medium ${
            activeTab === "assigned"
            ? "bg-sky-500 text-white"
              : "border border-sky-300 bg-white text-slate-600 hover:bg-sky-50"
          }`}
        >
          Assigned {assignedCount ? `(${assignedCount})` : ""}
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

      <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="grid min-w-[880px] grid-cols-[60px_80px_1.1fr_1.2fr_90px_110px_100px_100px] gap-2 border-b border-slate-200 px-3 py-3 text-[12px] font-medium text-slate-900">
          <div>Srl No</div>
          <div>Ticket No</div>
          <div>Customer Name</div>
          <div>Item Name</div>
          <div>Assign to</div>
          <div>Assigned on</div>
          <div>Status</div>
          <div>Service Cost</div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-3">
          <Spin spinning={isLoading}>
            {paginatedRows.length > 0 ? (
              <div className="max-h-[calc(100vh-260px)] overflow-y-auto overflow-x-auto pr-2">
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
                    className="grid min-w-[880px] grid-cols-[60px_80px_1.1fr_1.2fr_90px_110px_100px_100px] items-center gap-2 border-b border-slate-100 px-3 py-3 text-[12px] text-slate-700"
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
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openTicketView(row);
                        }}
                        className="inline-flex items-center gap-2 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                      >
                        <img src={assign} alt="Assign" className="h-5 w-5" />
                      </button>
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
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          normalizeText(
                            formatDisplayValue(
                              getFieldValue(row, ["cStatusName", "cStatus", "Status", "RepairStatus"]),
                            ),
                          ).includes("complete") ||
                          normalizeText(
                            formatDisplayValue(
                              getFieldValue(row, ["cStatusName", "cStatus", "Status", "RepairStatus"]),
                            ),
                          ).includes("finish")
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-sky-50 text-sky-600"
                        }`}
                      >
                        {formatDisplayValue(
                          getFieldValue(row, ["cStatusName", "cStatus", "Status", "RepairStatus"]),
                        ) || "-"}
                      </span>
                    </div>
                    <div>
                      ₹{Number(
                        getFieldValue(row, [
                          "nServiceCost",
                          "ServiceCost",
                          "nVendorCharge",
                          "VendorCharge",
                          "nRepairCost",
                        ]) || 0,
                      ).toFixed(2)}
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

      <AgentSelectorModal
        open={agentModalOpen}
        loading={linkedAgentQuery.isLoading || linkedAgentQuery.isFetching}
        options={visibleLinkedAgents}
        selectedValue={selectedAgent.value}
        search={agentSearch}
        expandedAgentId={expandedAgentId}
        selfOption={{
          label: currentAgentName,
          value: currentAgentId,
          role: "Self",
          isSelf: true,
        }}
        onSearch={setAgentSearch}
        onSelect={(agent) => {
          setSelectedAgent(agent);
          setAgentModalOpen(false);
          setAgentSearch("");
          setExpandedAgentId(null);
        }}
        onExpandedChange={setExpandedAgentId}
        onClose={() => {
          setAgentModalOpen(false);
          setAgentSearch("");
          setExpandedAgentId(null);
        }}
      />
    </div>
  );
};

export default AssignedItemRepairPage;
