import { SearchOutlined } from "@ant-design/icons";
import { Empty, Input, Spin } from "antd";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getRequestPayload } from "../../../Utils/requestPayload";
import TicketModulePagination from "../../Ticket/Common/TicketModulePagination";
import { useLeaveApprovalList } from "./Hooks";
import { extractRows, formatDateTime, getValue, statusText, text } from "./utils";

const LeaveApprovalPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const payload = useMemo(() => {
    const { nCompanyId, cSchemaName, cDbName } = getRequestPayload();
    return { nCompanyId, cSchemaName, cDbName };
  }, []);
  const query = useLeaveApprovalList(payload);
  const rows = useMemo(() => {
    const responseData = query.data && typeof query.data === "object"
      ? (query.data as { data?: unknown }).data
      : undefined;
    return Array.isArray(responseData)
      ? responseData as Record<string, unknown>[]
      : extractRows(query.data);
  }, [query.data]);
  const pendingRows = useMemo(() => rows.filter((row) => {
    const statusNumber = getValue(row, ["nStatus", "StatusId", "nLeaveStatus"]);
    if (statusNumber !== "") return Number(statusNumber) === 0;
    return statusText(row).trim().toLowerCase() === "pending";
  }), [rows]);
  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return pendingRows;
    return pendingRows.filter((row) => [
      getValue(row, ["nLeaveRefNo", "cRefNo", "RefNo"]),
      getValue(row, ["cName", "Name", "cAgentName"]),
      getValue(row, ["cReason", "Reason"]),
      getValue(row, ["cLeaveType", "LeaveType"]),
      statusText(row),
    ].join(" ").toLowerCase().includes(keyword));
  }, [pendingRows, search]);
  const safePage = Math.min(page, Math.max(1, Math.ceil(filteredRows.length / pageSize)));
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openDetails = (row: Record<string, unknown>) => {
    const leaveId = Number(getValue(row, ["nLeaveId", "LeaveId", "leaveId", "id"])) || 0;
    navigate("/more/leaveapproval/view", { state: { leaveId, leave: row } });
  };

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white p-5">
      <header className="mb-3 flex flex-none items-center justify-between gap-3">
        <h1 className="m-0 text-xl font-medium text-slate-950">Leave Approval</h1>
        <Input
          className="w-[240px]"
          prefix={<SearchOutlined className="text-slate-500" />}
          placeholder="Search"
          allowClear
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
        />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="sticky top-0 z-10 grid grid-cols-[42px_70px_100px_130px_minmax(170px,1fr)_96px_90px] border-y border-slate-200 bg-white px-2 py-3 text-xs font-medium">
          <span>Srl</span><span>Ref No</span><span>Name</span><span>Applied On</span><span>Reason</span><span>Leave Type</span><span>Leave Status</span>
        </div>
        {query.isFetching ? (
          <div className="flex h-52 items-center justify-center"><Spin /></div>
        ) : query.isError ? (
          <div className="flex h-52 items-center justify-center text-sm text-red-500">Unable to load leave approvals</div>
        ) : visibleRows.length ? visibleRows.map((row, index) => (
          <button
            type="button"
            key={String(getValue(row, ["nLeaveId", "LeaveId", "id"]) || index)}
            className="grid min-h-[62px] w-full grid-cols-[42px_70px_100px_130px_minmax(170px,1fr)_96px_90px] items-center border-b border-slate-100 bg-white px-2 text-left text-xs hover:bg-slate-50"
            onClick={() => openDetails(row)}
          >
            <span>{(safePage - 1) * pageSize + index + 1}</span>
            <span>{text(getValue(row, ["nLeaveRefNo", "cRefNo", "RefNo", "nLeaveId"]))}</span>
            <span>{text(getValue(row, ["cName", "Name", "cAgentName"]))}</span>
            <span>{formatDateTime(getValue(row, ["dAppliedOn", "dCreatedDate", "CreatedDate"]))}</span>
            <span className="pr-2">{text(getValue(row, ["cReason", "Reason"]))}</span>
            <span>{text(getValue(row, ["cLeaveType", "LeaveType"]))}</span>
            <span className="text-orange-600">{statusText(row)}</span>
          </button>
        )) : <div className="flex h-48 items-center justify-center"><Empty description="No data" /></div>}
      </div>

      {filteredRows.length ? (
        <TicketModulePagination
          className="mt-3 w-full flex-none"
          elevated={false}
          current={safePage}
          pageSize={pageSize}
          total={filteredRows.length}
          onChange={(nextPage, size) => { setPage(nextPage); setPageSize(size); }}
          onShowSizeChange={(_, size) => { setPage(1); setPageSize(size); }}
        />
      ) : null}
    </section>
  );
};

export default LeaveApprovalPage;
