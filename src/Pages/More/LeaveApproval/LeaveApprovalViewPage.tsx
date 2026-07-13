import { CloseOutlined } from "@ant-design/icons";
import { Button, Spin, message } from "antd";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { getRequestPayload } from "../../../Utils/requestPayload";
import { useApproveOrRejectLeave, useLeaveApprovalDetails } from "./Hooks";
import { extractDetails, formatDate, getValue, statusText, text } from "./utils";
import type { LeaveApprovalRecord } from "./utils";

type LocationState = { leaveId?: number; leave?: LeaveApprovalRecord } | null;

const LeaveApprovalViewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const fallback = state?.leave ?? {};
  const leaveId = Number(state?.leaveId ?? getValue(fallback, ["nLeaveId", "LeaveId", "id"])) || 0;
  const [actionStatus, setActionStatus] = useState<number | null>(null);
  const payload = useMemo(() => {
    const { nCompanyId, cSchemaName, cDbName } = getRequestPayload();
    return { nLeaveId: leaveId, nCompanyId, cSchemaName, cDbName };
  }, [leaveId]);
  const detailsQuery = useLeaveApprovalDetails(payload, leaveId > 0);
  const approvalMutation = useApproveOrRejectLeave();
  const details = extractDetails(detailsQuery.data, fallback);
  const value = (keys: string[]) => getValue(details, keys) || getValue(fallback, keys);
  const backendStatusNumber = Number(value(["nStatus", "StatusId", "nLeaveStatus"]));
  const backendStatusText = statusText(details).toLowerCase();
  const effectiveStatus = actionStatus ?? (Number.isFinite(backendStatusNumber) ? backendStatusNumber : 0);
  const isPending = actionStatus === null
    ? effectiveStatus === 0 && !backendStatusText.includes("approv") && !backendStatusText.includes("reject")
    : actionStatus === 0;
  const displayStatus = effectiveStatus === 1
    ? "Approved"
    : effectiveStatus === 2
      ? "Rejected"
      : statusText(details);
  const agentName = text(value(["cName", "Name", "cAgentName", "AgentName"]));
  const initials = agentName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const updateApproval = async (status: 1 | 2) => {
    const requestPayload = getRequestPayload();
    try {
      await approvalMutation.mutateAsync({
        nLeaveId: leaveId,
        nStatus: status,
        cComment: "",
        nAgentId: requestPayload.nAgentId,
        nCompanyId: requestPayload.nCompanyId,
        cSchemaName: requestPayload.cSchemaName,
        cDbName: requestPayload.cDbName,
      });
      setActionStatus(status);
      message.success(status === 1 ? "Leave approved successfully" : "Leave rejected successfully");
      navigate("/more/leaveapproval");
    } catch (error) {
      const data = (error as { response?: { data?: { message?: string; title?: string } } })?.response?.data;
      message.error(data?.message || data?.title || "Unable to update leave approval");
    }
  };

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white px-4 py-2">
      <header className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h1 className="m-0 text-xl font-medium text-slate-950">Leave Approval</h1>
        <Button type="text" icon={<CloseOutlined className="text-xl" />} onClick={() => navigate("/more/leaveapproval")} />
      </header>

      {detailsQuery.isFetching && !detailsQuery.data ? (
        <div className="flex flex-1 items-center justify-center"><Spin /></div>
      ) : (
        <div className="min-h-0 flex-1 px-4 pt-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-medium text-slate-600">{initials}</div>
            <div>
              <div className="text-base font-medium text-slate-950">{agentName}</div>
              <div className="text-sm text-slate-500">({text(value(["cService", "Service", "cDepartmentName", "DepartmentName", "cGroupName"]), "Service")})</div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-y border-slate-200 py-3 text-sm">
            <div>Total Leaves Taken : <strong className="ml-2 text-lg">{text(value(["nTotalLeavesTaken", "nTotalLeaveTaken", "TotalLeavesTaken"]), "0")}</strong></div>
            <div>Last Leave Taken : <strong className="ml-2 text-lg">{formatDate(value(["dLastLeaveTaken", "LastLeaveTaken", "dLastLeaveDate"]))}</strong></div>
          </div>

          <div className="mt-3 text-lg font-medium text-sky-800">Application Details</div>
          <div className="mt-3 space-y-2 text-sm">
            <div><strong>Ref No :</strong><span className="ml-2">{text(value(["nLeaveRefNo", "cRefNo", "RefNo", "nLeaveId"]))}</span></div>
            <div><strong>Reason :</strong><span className="ml-2 text-slate-600">{text(value(["cReason", "Reason"]))}</span></div>
            <div><strong>Leave On :</strong><span className="ml-2 text-slate-600">{formatDate(value(["dLeaveFrom", "FromDate"]))} to {formatDate(value(["dLeaveTo", "ToDate"]))}</span></div>
            {!isPending ? (
              <div><strong>Status :</strong><span className={`ml-2 font-medium ${effectiveStatus === 1 ? "text-emerald-600" : "text-red-500"}`}>{displayStatus}</span></div>
            ) : null}
          </div>
        </div>
      )}

      {isPending ? (
        <footer className="flex flex-none justify-end gap-3 px-4 pb-3">
          <Button
            danger
            type="primary"
            className="min-w-[82px]"
            style={{ backgroundColor: "#ff0000", borderColor: "#ff0000" }}
            loading={approvalMutation.isPending}
            onClick={() => updateApproval(2)}
          >
            Reject
          </Button>
          <Button
            type="primary"
            className="min-w-[98px]"
            style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
            loading={approvalMutation.isPending}
            onClick={() => updateApproval(1)}
          >
            Approve
          </Button>
        </footer>
      ) : null}
    </section>
  );
};

export default LeaveApprovalViewPage;
