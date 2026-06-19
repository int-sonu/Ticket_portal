import {
  Button,
  Form,
  Input,
  Modal,
  Avatar,
  Select,
  message,
} from "antd";
import { useMemo } from "react";

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
          nextValues
            .filter(Boolean)
            .map((item) => String(item))
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
    "Unable to transfer ticket"
  );
};

interface TransferTicketModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: number;
}

const TransferTicketModal = ({
  open,
  onClose,
  ticketId,
}: TransferTicketModalProps) => {
  const [form] = Form.useForm();

  const sessionPayload = useMemo(() => getRequestPayload(), []);
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
  const agentOptions = useMemo(
    () =>
      extractList(agentData).map((agent: any) => ({
        value: String(
          agent?.nAgentId ??
            agent?.agentId ??
            agent?.id ??
            agent?.value ??
            ""
        ),
        label: (
          <div className="flex items-center gap-2">
            <Avatar
              size={24}
              style={{
                backgroundColor: getAvatarColor(
                  Number(
                    agent?.nAgentId ??
                      agent?.agentId ??
                      agent?.id ??
                      0
                  ) || 0
                ),
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {String(
                agent?.cAgentName ??
                  agent?.agentName ??
                  agent?.name ??
                  agent?.cName ??
                  "A"
              )
                .replace(/[^a-z0-9]/gi, "")
                .slice(0, 2)
                .toUpperCase() || "A"}
            </Avatar>
            <span>
              {agent?.cAgentName ??
                agent?.agentName ??
                agent?.name ??
                agent?.cName ??
                `Agent ${agent?.nAgentId ?? agent?.agentId ?? ""}`}
            </span>
          </div>
        ),
        searchLabel:
          agent?.cAgentName ??
          agent?.agentName ??
          agent?.name ??
          agent?.cName ??
          "",
      })),
    [agentData]
  );

  const { transferTicket } =
    useTicketActions();

  const handleSubmit = (
    values: any
  ) => {
    transferTicket.mutate(
      {
        ...sessionPayload,
        TicketId: ticketId,
        nTicketId: ticketId,
        AgentId: values.AgentId,
        nAgentId: values.AgentId,
        TransferReason: values.TransferReason,
        cTransferReason: values.TransferReason,
      },
      {
        onSuccess: () => {
          message.success(
            "Ticket Transferred Successfully"
          );

          form.resetFields();

          onClose();
        },
        onError: (error: any) => {
          message.error(getErrorMessage(error));
        },
      }
    );
  };

  return (
    <Modal
      title="Transfer Ticket"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={transferTicket.isPending}
          onClick={() => form.submit()}
        >
          Save
        </Button>,
      ]}
      destroyOnClose
      width={400}
      height={300}

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
              message:
                "Please Select Agent",
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
          label="Reason for Transfer"
          name="TransferReason"
          rules={[
            {
              message:
                "Please Enter Transfer Reason",
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

export default TransferTicketModal;
