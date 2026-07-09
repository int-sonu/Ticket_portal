import { useEffect, useMemo, useState } from "react";
import { Empty, Input, Spin } from "antd";
import { FilterOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import {
  useRepairItemActivityList,
  useRepairItemFinishedList,
} from "../../Hooks/Ticket/useTicketQueries";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import TicketModulePagination from "../Ticket/Common/TicketModulePagination";
import assign from "../../assets/icons/assign.svg";
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

const AssignedItemRepairPage = () => {
  const navigate = useNavigate();
  const sessionPayload = useMemo<Record<string, any>>(
    () => getRequestPayload() as Record<string, any>,
    [],
  );
  const payload = useMemo(
    () => ({
      ...sessionPayload,
      nCreatedBy:
        sessionPayload.id ??
        sessionPayload.nAgentId ??
        sessionPayload.nCreatedBy ??
        0,
    }),
    [sessionPayload],
  );

  const [activeTab, setActiveTab] = useState<"assigned" | "finished">("assigned");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const assignedQuery = useRepairItemActivityList(
    payload,
    !!payload?.nCreatedBy,
  );
  const finishedQuery = useRepairItemFinishedList(
    payload,
    !!payload?.nCreatedBy,
  );
  const rows = useMemo(
    () => extractList(activeTab === "finished" ? finishedQuery.data : assignedQuery.data),
    [activeTab, assignedQuery.data, finishedQuery.data],
  );
  const isLoading = activeTab === "finished" ? finishedQuery.isLoading : assignedQuery.isLoading;

  const isFinishedRow = (row: Record<string, any>) =>
    normalizeText(
      formatDisplayValue(getFieldValue(row, ["cStatusName", "cStatus", "Status", "RepairStatus"])),
    ).includes("finish") ||
    normalizeText(
      formatDisplayValue(getFieldValue(row, ["cStatusName", "cStatus", "Status", "RepairStatus"])),
    ).includes("complete");

  const visibleRows = useMemo(
    () =>
      rows.filter((row) =>
        activeTab === "finished" ? isFinishedRow(row) : !isFinishedRow(row),
      ),
    [activeTab, rows],
  );

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

  const assignedCount = extractList(assignedQuery.data).filter((row) => !isFinishedRow(row)).length;
  const finishedCount = extractList(finishedQuery.data).filter((row) => isFinishedRow(row)).length;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

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
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            aria-label="Filter"
          >
            <FilterOutlined />
          </button>
          <button
            type="button"
            onClick={() =>
              navigate("/item-repair/pending", {
                state: {
                  sessionPayload,
                },
              })
            }
            className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            <PlusOutlined className="mr-2 text-[12px]" />
            Add New
          </button>
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
        <div className="grid grid-cols-[70px_90px_1.2fr_1.3fr_100px_100px_160px] gap-2 border-b border-slate-200 px-3 py-3 text-[12px] font-medium text-slate-900">
          <div>Srl No</div>
          <div>Ticket No</div>
          <div>Customer Name</div>
          <div>Item Name</div>
          <div>Assign to</div>
          <div>Assigned on</div>
          <div>Status</div>
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
                    className="grid grid-cols-[70px_90px_1.2fr_1.3fr_100px_100px_160px] gap-2 border-b border-slate-100 px-3 py-3 text-[12px] text-slate-700"
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
