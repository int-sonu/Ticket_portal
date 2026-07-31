import {
  Avatar,
  Button,
  Form,
  Input,
  Modal,
  Select,
  message,
} from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useMemo, useRef } from "react";

import { useGetAgents } from "../../Master/Agent/Hooks";
import { extractList } from "../../Master/Common/SimpleMasterUtils";
import { getRequestPayload } from "../../../Utils/requestPayload";
import { useTicketActions } from "../../../Hooks/Ticket/useTicketActions";

const { TextArea } = Input;

const avatarColors = [
  "#22c55e",
  "#4ade80",
  "#86efac",
  "#16a34a",
  "#bbf7d0",
  "#15803d",
];

const getAvatarColor = (index: number) =>
  avatarColors[index % avatarColors.length];

const getErrorMessage = (error: any) => {
  const responseData = error?.response?.data;
  const validationErrors = responseData?.errors;

  if (validationErrors && typeof validationErrors === "object") {
    const messages = Object.values(validationErrors).reduce<string[]>(
      (allMessages, value) => {
        const nextValues = Array.isArray(value) ? value : [value];

        return allMessages.concat(
          nextValues.filter(Boolean).map((item) => String(item))
        );
      },
      []
    );

    if (messages.length > 0) {
      return messages.join(" | ");
    }
  }

  return (
    responseData?.message ||
    responseData?.title ||
    error?.message ||
    "Unable to share ticket"
  );
};

interface ShareTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: number;
  ticketNo?: string;
}

const ShareTicketModal = ({
  open,
  onClose,
  ticketId,
  ticketNo,
}: ShareTicketModalProps) => {
  const [form] = Form.useForm();
  const isSubmittingRef = useRef(false);

  const sessionPayload = useMemo(() => getRequestPayload(), []);
  const currentAgentId = Number(
    sessionPayload.nAgentId ??
      sessionPayload.id ??
      (sessionPayload as any).nUserId ??
      0
  );
  const agentPayload = useMemo(
    () => ({
      ...sessionPayload,
      pageNumber: 1,
      pageSize: 1000,
    }),
    [sessionPayload]
  );

  const { data: agentData, isFetching: isFetchingAgents } = useGetAgents(
    agentPayload,
    open
  );

  const agentOptions = useMemo(() => {
    const uniqueAgents = new Map<number, any>();

    extractList(agentData).forEach((agent: any) => {
      const agentId = Number(
        agent?.nAgentId ?? agent?.agentId ?? agent?.id ?? agent?.value ?? 0
      );

      if (agentId > 0 && agentId !== currentAgentId && !uniqueAgents.has(agentId)) {
        uniqueAgents.set(agentId, agent);
      }
    });

    return Array.from(uniqueAgents.entries()).map(([agentId, agent]) => {
      const agentName =
        agent?.cAgentName ??
        agent?.agentName ??
        agent?.name ??
        agent?.cName ??
        `Agent ${agentId || ""}`;

      return {
        value: String(agentId),
        label: (
          <div className="flex items-center gap-2">
            <Avatar
              size={24}
              style={{
                backgroundColor: getAvatarColor(agentId || 0),
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {agentName
                .replace(/[^a-z0-9]/gi, "")
                .slice(0, 2)
                .toUpperCase() || "A"}
            </Avatar>
            <span>{agentName}</span>
          </div>
        ),
        searchLabel: agentName,
      };
    });
  }, [agentData, currentAgentId]);

  const { shareTicket } = useTicketActions();

  const handleSubmit = (values: any) => {
    if (isSubmittingRef.current || shareTicket.isPending) return;

    const agentId = Number(values.AgentId || 0);
    const shareReason = String(values.ShareReason ?? "").trim();
    const sharedByAgentId = currentAgentId;

    if (!sessionPayload.nCompanyId || !sessionPayload.cSchemaName || !sessionPayload.cDbName) {
      message.error("Session details are missing. Please log in again.");
      return;
    }

    if (!ticketId || !sharedByAgentId || !agentId || agentId === sharedByAgentId) {
      message.error("Please select a valid different agent.");
      return;
    }

    isSubmittingRef.current = true;
    shareTicket.mutate(
      {
        nCompanyId: Number(sessionPayload.nCompanyId ?? 0),
        cSchemaName: sessionPayload.cSchemaName ?? "",
        cDbName: sessionPayload.cDbName ?? "",
        nTicketId: ticketId,
        nSharedByAgentId: sharedByAgentId,
        nSharedToAgentId: agentId,
        cShareReason: shareReason,
      },
      {
        onSuccess: () => {
          isSubmittingRef.current = false;
          message.success("Ticket Shared Successfully");
          form.resetFields();
          onClose();
        },
        onError: (error: any) => {
          isSubmittingRef.current = false;
          message.error(getErrorMessage(error));
        },
      }
    );
  };

  return (
    <Modal
      title="Share Ticket"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          className="app-save-button"
          loading={shareTicket.isPending}
          disabled={shareTicket.isPending}
          onClick={() => form.submit()}
        >
          Save
        </Button>,
      ]}
      destroyOnClose
      width={400}
      height={300}
      closeIcon={<CloseOutlined className="text-xl text-black" />}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Agent"
          name="AgentId"
          rules={[
            {
              required: true,
              message: "Please Select Agent",
            },
          ]}
        >
          <Select
            placeholder="Select Agent"
            options={agentOptions}
            loading={isFetchingAgents}
            showSearch
            optionFilterProp="searchLabel"
            filterOption={(input, option) =>
              String((option as any)?.searchLabel ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label="Reason for Share"
          name="ShareReason"
          rules={[
            {
              required: true,
              message: "Please Enter Share Reason",
            },
          ]}
        >
          <TextArea rows={6} />
        </Form.Item>

        <Form.Item>
          <div className="hidden" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ShareTicketModal;
