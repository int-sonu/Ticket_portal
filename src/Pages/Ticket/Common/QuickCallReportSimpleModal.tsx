import { Form, Input, message } from "antd";
import type { FormInstance } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";

import { useTicketMutations } from "../../../Hooks/Ticket/useTicketMutations";
import RightSideDrawer from "../../../ui/Drawer/RightSideDrawer";

const { TextArea } = Input;

type QuickCallReportSimpleModalProps = {
  open: boolean;
  onClose: () => void;
  ticketForm: FormInstance;
  selectedCustomerName?: string;
  sessionPayload: Record<string, any>;
  onSaved?: (response: any) => void;
};

const getValue = (record: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const formatFollowupDate = (value: any) => {
  if (!value) return "";
  if (typeof value?.format === "function") {
    return value.format("YYYY-MM-DD HH:mm:ss");
  }
  if (value?.$d) {
    const restored = dayjs(value.$d);
    return restored.isValid() ? restored.format("YYYY-MM-DD HH:mm:ss") : "";
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : String(value);
};

const normalizeAssignedAgents = (ticketValues: Record<string, any>) => {
  const existing = getValue(ticketValues, [
    "cAssignedId",
    "AssignedAgents",
    "assignedAgents",
  ]);
  if (Array.isArray(existing) && existing.length) return existing;

  const selected = getValue(ticketValues, [
    "AssignToAgent",
    "nAgentId",
    "AgentId",
  ]);
  const agentId = Number(Array.isArray(selected) ? selected[0] : selected ?? 0);
  return agentId > 0 ? [{ nAgentId: agentId, nType: 0 }] : [];
};

const PRIORITY_IDS: Record<string, number> = {
  "very low": 0,
  low: 1,
  medium: 2,
  high: 3,
  "very high": 4,
};

const QuickCallReportSimpleModal = ({
  open,
  onClose,
  ticketForm,
  selectedCustomerName,
  sessionPayload,
  onSaved,
}: QuickCallReportSimpleModalProps) => {
  const [form] = Form.useForm();
  const { quickCallReportSave } = useTicketMutations();

  useEffect(() => {
    if (open) form.resetFields();
  }, [form, open]);

  const handleSubmit = async (modalValues: {
    Summary: string;
    Description: string;
  }) => {
    const ticketValues = ticketForm.getFieldsValue(true);
    const priorityValue = getValue(ticketValues, ["nPriority", "Priority"]);
    const priorityId =
      typeof priorityValue === "number"
        ? priorityValue
        : PRIORITY_IDS[String(priorityValue ?? "low").trim().toLowerCase()] ?? 1;

    const payload = {
      nCustomerId:
        Number(getValue(ticketValues, ["CustomerId", "nCustomerId"]) ?? 0) || 0,
      cCustomerName:
        selectedCustomerName ??
        String(getValue(ticketValues, ["CustomerName", "cCustomerName"]) ?? ""),
      nSourceId:
        Number(getValue(ticketValues, ["Source", "SourceId", "nSourceId"]) ?? 0) || 0,
      cContactPerson: String(
        getValue(ticketValues, ["ContactPerson", "cContactPerson"]) ?? "",
      ),
      cContactNumber: String(
        getValue(ticketValues, [
          "ContactNo",
          "ContactNumber",
          "cContactNumber",
        ]) ?? "",
      ),
      cEmail: String(getValue(ticketValues, ["Email", "cEmail"]) ?? ""),
      cTicketSummary: String(
        getValue(ticketValues, [
          "IssueSummary",
          "TicketSummary",
          "cTicketSummary",
        ]) ?? "",
      ),
      cDescription: String(
        getValue(ticketValues, ["Description", "cDescription"]) ?? "",
      ),
      cAssignedId: normalizeAssignedAgents(ticketValues),
      nTicketStatus:
        Number(
          getValue(ticketValues, [
            "nTicketStatus",
            "TicketStatusId",
            "StatusId",
          ]) ?? 1,
        ) || 1,
      nAssetId:
        Number(getValue(ticketValues, ["AssetId", "nAssetId"]) ?? 0) || 0,
      nPriority: priorityId,
      nGroupId:
        Number(getValue(ticketValues, ["Group", "GroupId", "nGroupId"]) ?? 0) || 0,
      bOnSite: Boolean(
        getValue(ticketValues, ["OnsiteRequired", "bOnSite", "bOnsiteRequired"]),
      ),
      dFollowupDate: formatFollowupDate(
        getValue(ticketValues, ["FollowupDate", "dFollowupDate"]),
      ),
      cCallSummary: modalValues.Summary.trim(),
      cCallDescription: modalValues.Description.trim(),
      cCallComment: modalValues.Description.trim(),
      nCreatedBy:
        Number(
          sessionPayload.nCreatedBy ??
            sessionPayload.nAgentId ??
            sessionPayload.id ??
            sessionPayload.nModifiedBy ??
            0,
        ) || 0,
      nCompanyId: Number(sessionPayload.nCompanyId ?? 0) || 0,
      cSchemaName: String(sessionPayload.cSchemaName ?? ""),
      cDbName: String(sessionPayload.cDbName ?? ""),
    };

    try {
      const response = await quickCallReportSave.mutateAsync(payload);
      message.success("Quick Call Report saved successfully");
      onSaved?.(response);
      onClose();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save Quick Call Report",
      );
    }
  };

  return (
    <RightSideDrawer
      open={open}
      onClose={onClose}
      title={<span className="text-[18px] font-medium">Quick Call Report</span>}
      width={500}
      className="quick-call-simple-drawer"
      bodyStyle={{ padding: "16px 24px" }}
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => form.submit()}
            disabled={quickCallReportSave.isPending}
            className="rounded-md bg-emerald-500 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {quickCallReportSave.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      }
    >
      <div className="mb-4 rounded-md border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-slate-600">
        Add a <strong className="text-slate-900">Summary</strong> and{" "}
        <strong className="text-slate-900">Description</strong>, then click the{" "}
        <strong className="text-slate-900">Save</strong> button to close the ticket.
      </div>

      <Form form={form} layout="vertical" requiredMark={false} onFinish={handleSubmit}>
        <Form.Item
          label="Summary"
          name="Summary"
          rules={[{ required: true, message: "Please enter Summary" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Description"
          name="Description"
          rules={[{ required: true, message: "Please enter Description" }]}
        >
          <TextArea rows={4} />
        </Form.Item>
      </Form>
    </RightSideDrawer>
  );
};

export default QuickCallReportSimpleModal;
