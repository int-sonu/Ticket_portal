import type React from 'react';
import { Modal, message } from 'antd';
import type { UseMutateFunction } from '@tanstack/react-query';
import type { AgentPayload } from '../../../Axios/AgentApis';
import type { AgentRow } from './Utils';
import { getSessionPayload } from './Utils';

type UseAgentCrudParams = {
  selectedAgent: AgentRow | null;
  saveAgent: UseMutateFunction<any, Error, AgentPayload, unknown>;
  deleteAgent: UseMutateFunction<any, Error, AgentPayload, unknown>;
  closeDrawer: () => void;
};

export const useAgentCrud = ({
  selectedAgent,
  saveAgent,
  deleteAgent,
  closeDrawer,
}: UseAgentCrudParams) => {
  const handleDelete = (event: React.MouseEvent, record: AgentRow) => {
    event.stopPropagation();
    Modal.confirm({
      title: 'Are you sure you want to delete this agent?',
      onOk: () => {
        deleteAgent({ ...getSessionPayload(), nAgentId: record.id, id: record.id }, {
          onSuccess: () => {
            message.success('Agent deleted successfully');
            if (selectedAgent?.id === record.id) closeDrawer();
          },
          onError: () => message.error('Failed to delete agent'),
        });
      },
    });
  };

  const handleSave = (values: any) => {
    saveAgent({ ...getSessionPayload(), ...values, nAgentId: selectedAgent?.id }, {
      onSuccess: () => {
        message.success('Agent saved successfully');
        closeDrawer();
      },
      onError: () => message.error('Failed to save agent'),
    });
  };

  return {
    handleDelete,
    handleSave,
  };
};
