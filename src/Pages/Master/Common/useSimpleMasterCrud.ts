import type React from 'react';
import { Modal, message } from 'antd';
import type { UseMutateFunction } from '@tanstack/react-query';
import type { SimpleMasterRow } from './SimpleMasterUtils';
import { getApiMessage, getSessionPayload, isApiSuccess, trimFormValues } from './SimpleMasterUtils';

type UseSimpleMasterCrudParams = {
  selectedRow: SimpleMasterRow | null;
  entityName: string;
  idKey: string;
  saveMutation: UseMutateFunction<any, Error, any, unknown>;
  updateMutation?: UseMutateFunction<any, Error, any, unknown>;
  deleteMutation: UseMutateFunction<any, Error, any, unknown>;
  buildPayload: (values: any, selectedRow: SimpleMasterRow | null) => any;
  buildFormValues: (row?: SimpleMasterRow | null) => any;
  buildDeletePayload?: (record: SimpleMasterRow) => any;
  closeDrawer: () => void;
  onDeleted?: (record: SimpleMasterRow) => void;
  onSaved?: (
    values: any,
    response: any,
    selectedRow: SimpleMasterRow | null
  ) => void;
  formatSaveError?: (message: string, error: unknown) => string;
};

export const useSimpleMasterCrud = ({
  selectedRow,
  entityName,
  idKey,
  saveMutation,
  updateMutation,
  deleteMutation,
  buildPayload,
  buildFormValues,
  buildDeletePayload,
  closeDrawer,
  onDeleted,
  onSaved,
  formatSaveError,
}: UseSimpleMasterCrudParams) => {
  const getSaveErrorMessage = (error: unknown, fallback: string) => {
    const apiMessage = getApiMessage(error, fallback);
    return formatSaveError?.(apiMessage, error) ?? apiMessage;
  };

  const handleDelete = (event: React.MouseEvent, record: SimpleMasterRow) => {
    event.stopPropagation();
    Modal.confirm({
      title: `Are you sure you want to delete this ${entityName.toLowerCase()}?`,
      onOk: () => {
        deleteMutation({
          ...getSessionPayload(),
          ...(buildDeletePayload
            ? buildDeletePayload(record)
            : buildPayload(
                {
                  ...buildFormValues(record),
                  active: false,
                },
                record,
              )),
          bActive: false,
          bCancelled: true,
          bCancel: true,
          bDeleted: true,
          [idKey]: record.id,
        }, {
          onSuccess: (response) => {
            if (!isApiSuccess(response)) {
              message.error(getApiMessage(response, `Failed to delete ${entityName.toLowerCase()}`));
              return;
            }

            message.success(`${entityName} deleted successfully`);
            onDeleted?.(record);
            if (selectedRow?.id === record.id) closeDrawer();
          },
          onError: (error) => message.error(getApiMessage(error, `Failed to delete ${entityName.toLowerCase()}`)),
        });
      },
    });
  };


  const handleSave = (values: any) => {
    const mutation = selectedRow && updateMutation ? updateMutation : saveMutation;
    const trimmedValues = trimFormValues(values);

    mutation({ ...getSessionPayload(), ...buildPayload(trimmedValues, selectedRow) }, {
      onSuccess: (response) => {
        if (!isApiSuccess(response)) {
          message.error(getSaveErrorMessage(response, `Failed to save ${entityName.toLowerCase()}`));
          return;
        }

        message.success(`${entityName} ${selectedRow ? 'updated' : 'saved'} successfully`);
        onSaved?.(trimmedValues, response, selectedRow);
        closeDrawer();
      },
      onError: (error) => message.error(getSaveErrorMessage(error, `Failed to save ${entityName.toLowerCase()}`)),
    });
  };

  return {
    handleDelete,
    handleSave,
  };
};
