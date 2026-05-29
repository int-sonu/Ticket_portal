import type React from "react";
import { Modal, message } from "antd";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { AgentPayload } from "../../../Axios/MasterApis";
import type { AgentRow } from "./Utils";
import {
  buildAgentFormValues,
  buildAgentPayload,
  getApiMessage,
  isApiSuccess,
} from "./Utils";

type UseAgentCrudParams = {
  selectedAgent: AgentRow | null;
  saveAgent: UseMutateFunction<any, Error, AgentPayload, unknown>;
  updateAgent: UseMutateFunction<any, Error, AgentPayload, unknown>;
  deleteAgent: UseMutateFunction<any, Error, AgentPayload, unknown>;
  closeDrawer: () => void;
  onDeleted?: (record: AgentRow) => void;
};

export const useAgentCrud = ({
  selectedAgent,
  saveAgent,
  updateAgent,
  deleteAgent,
  closeDrawer,
  onDeleted,
}: UseAgentCrudParams) => {
  const handleDelete = (event: React.MouseEvent, record: AgentRow) => {
    event.stopPropagation();
    Modal.confirm({
      title: "Are you sure you want to delete this agent?",
      onOk: () => {
        deleteAgent(
          {
            ...buildAgentPayload(
              {
                ...buildAgentFormValues(record),
                active: false,
              },
              record,
            ),
            nAgentId: record.id,
            id: record.id,
            bActive: false,
            bCancelled: true,
            bCancel: true,
            bDeleted: true,
          },
          {
            onSuccess: (response) => {
              if (!isApiSuccess(response)) {
                message.error(
                  getApiMessage(response, "Failed to delete agent"),
                );
                return;
              }

              message.success("Agent deleted successfully");
              onDeleted?.(record);
              if (selectedAgent?.id === record.id) closeDrawer();
            },
            onError: (error) =>
              message.error(getApiMessage(error, "Failed to delete agent")),
          },
        );
      },
    });
  };

  const handleSave = (values: any) => {
    const mutation = selectedAgent ? updateAgent : saveAgent;

    mutation(buildAgentPayload(values, selectedAgent), {
      onSuccess: (response) => {
        if (!isApiSuccess(response)) {
          message.error(getApiMessage(response, "Failed to save agent"));
          return;
        }

        message.success(
          `Agent ${selectedAgent ? "updated" : "saved"} successfully`,
        );
        closeDrawer();
      },
      onError: (error) =>
        message.error(getApiMessage(error, "Failed to save agent")),
    });
  };

  return {
    handleDelete,
    handleSave,
  };
};
