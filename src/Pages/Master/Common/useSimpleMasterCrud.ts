import type React from 'react';
import { Modal, message } from 'antd';
import type { UseMutateFunction } from '@tanstack/react-query';
import type { SimpleMasterRow } from './SimpleMasterUtils';
import { getSessionPayload } from './SimpleMasterUtils';

type UseSimpleMasterCrudParams = {
  selectedRow: SimpleMasterRow | null;
  entityName: string;
  idKey: string;
  saveMutation: UseMutateFunction<any, Error, any, unknown>;
  updateMutation?: UseMutateFunction<any, Error, any, unknown>;
  deleteMutation: UseMutateFunction<any, Error, any, unknown>;
  buildPayload: (values: any, selectedRow: SimpleMasterRow | null) => any;
  closeDrawer: () => void;
};

export const useSimpleMasterCrud = ({
  selectedRow,
  entityName,
  idKey,
  saveMutation,
  updateMutation,
  deleteMutation,
  buildPayload,
  closeDrawer,
}: UseSimpleMasterCrudParams) => {
  const handleDelete = (event: React.MouseEvent, record: SimpleMasterRow) => {
    event.stopPropagation();
    Modal.confirm({
      title: `Are you sure you want to delete this ${entityName.toLowerCase()}?`,
      onOk: () => {
        deleteMutation({ ...getSessionPayload(), [idKey]: record.id }, {
          onSuccess: () => {
            message.success(`${entityName} deleted successfully`);
            if (selectedRow?.id === record.id) closeDrawer();
          },
          onError: () => message.error(`Failed to delete ${entityName.toLowerCase()}`),
        });
      },
    });
  };

  const handleSave = (values: any) => {
    const mutation = selectedRow && updateMutation ? updateMutation : saveMutation;

    mutation({ ...getSessionPayload(), ...buildPayload(values, selectedRow) }, {
      onSuccess: () => {
        message.success(`${entityName} ${selectedRow ? 'updated' : 'saved'} successfully`);
        closeDrawer();
      },
      onError: () => message.error(`Failed to save ${entityName.toLowerCase()}`),
    });
  };

  return {
    handleDelete,
    handleSave,
  };
};
