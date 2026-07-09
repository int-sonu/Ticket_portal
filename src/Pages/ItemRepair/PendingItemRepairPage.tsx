import { useEffect, useMemo, useState } from "react";
import { Empty, Input, Spin } from "antd";
import { CloseOutlined, SearchOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

import { itemRepairApis } from "../../Axios/ItemRepairApis";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import TicketModulePagination from "../Ticket/Common/TicketModulePagination";

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

const PendingItemRepairPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state ?? {}) as Record<string, any>;
  const payload = useMemo(
    () => ({
      ...getRequestPayload(),
      ...(routeState?.sessionPayload ?? {}),
      nCreatedBy:
        routeState?.sessionPayload?.nCreatedBy ??
        routeState?.sessionPayload?.nCreatedby ??
        routeState?.sessionPayload?.id ??
        routeState?.sessionPayload?.nAgentId ??
        getRequestPayload().id ??
        getRequestPayload().nAgentId ??
        0,
    }),
    [routeState?.sessionPayload],
  );

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    const loadRows = async () => {
      if (!payload?.nCreatedBy) return;

      setIsLoading(true);
      try {
        const response = await itemRepairApis.unassignedItemRepairList(payload);
        if (!alive) return;
        setRows(extractList(response));
      } catch (error) {
        console.error("Failed to load pending item repairs", error);
        if (alive) setRows([]);
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    void loadRows();

    return () => {
      alive = false;
    };
  }, [payload]);

  const filteredRows = useMemo(() => {
    const term = normalizeText(search);
    return rows.filter((row) => {
      const rowText = [
        getFieldValue(row, ["nSrlNo", "SrlNo", "srlNo", "srlno", "id", "Id"]),
        getFieldValue(row, ["nTicketId", "TicketId", "TicketNo", "ticketNo"]),
        getFieldValue(row, ["cCustomerName", "CustomerName", "Customer"]),
        getFieldValue(row, ["cPartName", "PartName", "ItemName", "cItemName"]),
        getFieldValue(row, ["dCreatedDate", "CreatedDate", "dItemTakenOn", "ItemTakenOn"]),
      ]
        .map((item) => normalizeText(item))
        .join(" ");

      return !term || rowText.includes(term);
    });
  }, [rows, search]);

  const totalRows = filteredRows.length;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleClose = () => navigate(-1);
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-medium text-slate-900">Pending</h1>
          <div className="mt-1 text-[12px] italic text-sky-500">
            Parts taken for repair are waiting to be assigned.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-full max-w-[340px]">
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
            onClick={handleClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-50"
            aria-label="Close"
          >
            <CloseOutlined />
          </button>
        </div>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="grid grid-cols-[70px_90px_1.2fr_1.3fr_1fr] gap-2 border-b border-slate-200 px-3 py-3 text-[12px] font-medium text-slate-900">
          <div>Srl</div>
          <div>Ticket No</div>
          <div>Customer Name</div>
          <div>Item Name</div>
          <div>Item Taken on</div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-3">
          <Spin spinning={isLoading}>
            {paginatedRows.length > 0 ? (
              <div className="max-h-[calc(100vh-250px)] overflow-y-auto overflow-x-auto pr-2">
                {paginatedRows.map((row: any, index: number) => (
                  <div
                    key={String(
                      getFieldValue(row, ["nSrlNo", "SrlNo", "srlNo", "srlno", "id", "Id"]) || index,
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
                    className="grid grid-cols-[70px_90px_1.2fr_1.3fr_1fr] gap-2 border-b border-slate-100 px-3 py-3 text-[12px] text-slate-700"
                  >
                    <div>{getFieldValue(row, ["nSrlNo", "SrlNo", "srlNo", "srlno", "id", "Id"]) || index + 1}</div>
                    <div>{formatDisplayValue(getFieldValue(row, ["nTicketId", "TicketId", "TicketNo", "ticketNo"])) || "-"}</div>
                    <div>{formatDisplayValue(getFieldValue(row, ["cCustomerName", "CustomerName", "Customer"])) || "-"}</div>
                    <div>
                      {formatDisplayValue(
                        getFieldValue(row, ["cPartName", "PartName", "ItemName", "cItemName"]),
                      ) || "-"}
                    </div>
                    <div>{formatDisplayValue(getFieldValue(row, ["dCreatedDate", "CreatedDate", "dItemTakenOn", "ItemTakenOn"])) || "-"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-slate-200 bg-white">
                <Empty description="No data" />
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

export default PendingItemRepairPage;
