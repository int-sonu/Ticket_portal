import { Form, Input, message } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import { useTicketMutations } from "../../../Hooks/Ticket/useTicketMutations";
import RightSideDrawer from "../../../ui/Drawer/RightSideDrawer";
import type { FormInstance } from "antd";

const { TextArea } = Input;

const requiredTicketFields = [
  { name: "CustomerId", label: "Customer" },
  { name: "ContactPerson", label: "Contact Person" },
  { name: "ContactNo", label: "Contact Number" },
  { name: "Email", label: "Email" },
  { name: "IssueSummary", label: "Issue Summary" },
  { name: "Description", label: "Description" },
];

const requiredQuickCallFields = [
  { name: "Summary", label: "Summary" },
  { name: "Comment", label: "Comment" },
];

const isEmptyValue = (value: any) =>
  value === undefined ||
  value === null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

interface QuickCallReportModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: number;
  ticketForm?: FormInstance;
  ticketValues?: Record<string, any>;
  selectedCustomerName?: string;
  sessionPayload: Record<string, any>;
  assignedAgentDetails?: any[];
}

const QuickCallReportModal = ({
  open,
  onClose,
  ticketId,
  ticketForm,
  ticketValues: ticketValuesProp,
  selectedCustomerName,
  sessionPayload,
  assignedAgentDetails = [],
}: QuickCallReportModalProps) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { quickCallReportSave } = useTicketMutations();

  const priorityValueMap: Record<string, number> = {
    "Very Low": 1,
    Low: 1,
    Medium: 2,
    High: 3,
    "Very High": 4,
  };

  const normalizedAssignedAgents = assignedAgentDetails
    .map((agent: any) => ({
      nAgentId: Number(
        agent?.nAgentId ??
          agent?.agentId ??
          agent?.id ??
          agent?.value ??
          0
      ),
      nRole: Number(agent?.nRole ?? 0),
    }))
    .filter((agent: any) => agent.nAgentId > 0);

  const normalizeAssignedAgentsFromTicket = (ticket: Record<string, any>) => {
    const raw = [
      ticket?.cAssignedId,
      ticket?.assignedAgentDetails,
      ticket?.AssignedAgentDetails,
      ticket?.assignedAgents,
      ticket?.AssignedAgents,
      ticket?.AssignToAgent,
      ticket?.assignToAgent,
      ticket?.AgentId,
      ticket?.agentId,
      ticket?.nAgentId,
    ].find(
      (value) => value !== undefined && value !== null && value !== ""
    );

    if (Array.isArray(raw)) {
      return raw
        .map((agent: any) => ({
          nAgentId: Number(
            agent?.nAgentId ??
              agent?.agentId ??
              agent?.id ??
              agent?.value ??
              agent ??
              0
          ),
          nRole: Number(agent?.nRole ?? 0),
        }))
        .filter((agent: any) => agent.nAgentId > 0);
    }

    const parsed = typeof raw === "string" ? Number(raw) : Number(raw ?? 0);
    return parsed > 0 ? [{ nAgentId: parsed, nRole: 0 }] : [];
  };

  const resolvedTicketId = Number(
    ticketId ??
      ticketValuesProp?.nTicketId ??
      ticketValuesProp?.TicketId ??
      ticketValuesProp?.ticketId ??
      0
  ) || 0;

  const handleSubmit = async (values: any) => {
    const modalValues = form.getFieldsValue(true);
    const ticketValues =
      ticketForm?.getFieldsValue(true) ?? ticketValuesProp ?? {};

    const missingFields = [
      ...requiredTicketFields.filter(
        ({ name }) => isEmptyValue(ticketValues?.[name])
      ),
      ...requiredQuickCallFields.filter(
        ({ name }) => isEmptyValue(modalValues?.[name])
      ),
    ];

    const allMissingFields = [
      ...missingFields.map((field) => field.label),
    ];

    if (allMissingFields.length > 0) {
      message.error(
        `Please fill the required fields before saving: ${allMissingFields.join(", ")}`
      );
      return;
    }

    if (ticketForm) {
      await ticketForm.validateFields(
        requiredTicketFields.map((field) => field.name)
      );
    }

    const followupValue = ticketValues.FollowupDate;
    const normalizedFollowupDate = dayjs.isDayjs(followupValue)
      ? followupValue.format("YYYY-MM-DD HH:mm:ss")
      : followupValue;

    try {
      await quickCallReportSave.mutateAsync(
        {
          nCustomerId:
            Number(
              ticketValues.CustomerId ??
                ticketValues.nCustomerId ??
                sessionPayload.nCustomerId ??
                0
            ) || 0,
          cCustomerName:
            selectedCustomerName ??
            ticketValues.CustomerName ??
            ticketValues.cCustomerName ??
            "",
          nSourceId:
            Number(
              ticketValues.Source ??
                ticketValues.SourceId ??
                ticketValues.nSourceId ??
                sessionPayload.nSourceId ??
                0
            ) || 0,
          cContactPerson: ticketValues.ContactPerson ?? "",
          cContactNumber:
            ticketValues.ContactNo ?? ticketValues.ContactNumber ?? "",
          cEmail: ticketValues.Email ?? "",
          cTicketSummary:
            ticketValues.IssueSummary ?? ticketValues.TicketSummary ?? "",
          cDescription: ticketValues.Description ?? "",
          cAssignedId:
            normalizedAssignedAgents.length > 0
              ? normalizedAssignedAgents
              : normalizeAssignedAgentsFromTicket(ticketValues),
          nTicketStatus:
            Number(
              ticketValues.TicketStatus ??
                ticketValues.nTicketStatus ??
                sessionPayload.nTicketStatus ??
                5
            ) || 5,
          nAssetId:
            Number(
              ticketValues.AssetId ??
                ticketValues.nAssetId ??
                sessionPayload.nAssetId ??
                0
            ) || 0,
          nPriority:
            Number(
              ticketValues.nPriority ??
                sessionPayload.nPriority ??
                priorityValueMap[String(ticketValues.Priority ?? "")] ??
                1
            ) || 1,
          nGroupId:
            Number(
              ticketValues.Group ??
                ticketValues.GroupId ??
                ticketValues.nGroupId ??
                sessionPayload.nGroupId ??
                0
            ) || 0,
          bOnSite: Boolean(ticketValues.OnsiteRequired ?? ticketValues.bOnSite),
          dFollowupDate: normalizedFollowupDate ?? "",
          nTicketId: resolvedTicketId,
          cCallSummary: values.Summary ?? "",
          cCallComment: values.Comment ?? "",
          nCreatedBy:
            Number(
              sessionPayload.nCreatedBy ??
                sessionPayload.nModifiedBy ??
                sessionPayload.nUserId ??
                0
            ) ||
            0,
          nCompanyId: Number(sessionPayload.nCompanyId ?? 0) || 0,
          cSchemaName: sessionPayload.cSchemaName ?? "",
          cDbName: sessionPayload.cDbName ?? sessionPayload.dbName ?? "",
        } as any
      );

      message.success("Call Report Saved Successfully");
      form.resetFields();
      onClose();
      navigate("/tickets");
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.response?.data?.title ||
          error?.message ||
          "Unable to save quick call report"
      );
    }
  };

  const handleSaveClick = () => {
    form.submit();
  };

  return (
    <RightSideDrawer
      title="Quick Call Report"
      open={open}
      onClose={onClose}
      width={500}
      className="quick-call-drawer"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
          type="button"
          onClick={handleSaveClick}
          disabled={quickCallReportSave.isPending}
          className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-70"
        >
            {quickCallReportSave.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFinishFailed={() => {
          message.error("Please enter Summary and Comment before saving.");
        }}
        className="quick-call-report-form"
      >
        <div className="quick-call-report-body">
          <div className="quick-call-report-note">
            Add a <strong>Summary</strong> and <strong>Comment</strong>, then click the <strong>Save</strong> button to close the ticket.
          </div>

          <Form.Item
            label="Summary"
            name="Summary"
            rules={[
              {
                required: true,
                message: "Please enter Summary",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Comment"
            name="Comment"
            rules={[
              {
                required: true,
                message: "Please enter Comment",
              },
            ]}
          >
            <TextArea rows={4} />
          </Form.Item>
        </div>
      </Form>
    </RightSideDrawer>
  );
};

export default QuickCallReportModal;
