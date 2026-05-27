import type React from 'react';
import { Button, Drawer, Form, Input, Switch } from 'antd';
import type { FormInstance } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { SimpleMasterRow } from './SimpleMasterUtils';

type SimpleMasterDrawerProps = {
  open: boolean;
  title: string;
  description: string;
  viewMode: boolean;
  form: FormInstance;
  activeValue?: boolean;
  selectedRow: SimpleMasterRow | null;
  isSaving: boolean;
  nameLabel?: string;
  shortNameLabel?: string;
  hasShortName?: boolean;
  showNameField?: boolean;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
  activeDisabled?: boolean;
  renderExtraFields?: (options: { viewMode: boolean; form: FormInstance }) => React.ReactNode;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (event: React.MouseEvent, record: SimpleMasterRow) => void;
  onSave: (values: any) => void;
};

const SimpleMasterDrawer = ({
  open,
  title,
  description,
  viewMode,
  form,
  activeValue,
  selectedRow,
  isSaving,
  nameLabel = 'Name',
  shortNameLabel = 'Short Name',
  hasShortName = true,
  showNameField = true,
  editDisabled = false,
  deleteDisabled = false,
  activeDisabled = false,
  renderExtraFields,
  onClose,
  onEdit,
  onDelete,
  onSave,
}: SimpleMasterDrawerProps) => (
 <Drawer
  open={open}
  onClose={onClose}
  title={title}
  placement="right"
  width={
    title === "Part Master"
      ? 700
      : 500
  }
  destroyOnClose
    footer={
      <div className="flex items-center justify-end gap-4">
        <span className="text-sm font-medium text-slate-700">
          Active / Inactive
        </span>

        <Switch
          checked={activeValue ?? true}
          disabled={viewMode || activeDisabled}
          size="small"
          onChange={(checked) =>
            form.setFieldsValue({ active: checked })
          }
        />

        {viewMode ? (
          <>
            <Button
              icon={<EditOutlined />}
              disabled={editDisabled}
              onClick={onEdit}
            />

            {selectedRow && (
              <Button
                danger
                type="primary"
                disabled={deleteDisabled}
                icon={<DeleteOutlined />}
                onClick={(event) =>
                  onDelete(event, selectedRow)
                }
              />
            )}
          </>
        ) : (
          <Button
            type="primary"
            htmlType="submit"
            form="simple-master-form"
            loading={isSaving}
            className="bg-emerald-500 border-emerald-500 px-6 hover:!bg-emerald-600"
          >
            Save
          </Button>
        )}
      </div>
    }
  >
    <Form
      id="simple-master-form"
      form={form}
      layout="vertical"
      onFinish={onSave}
      initialValues={{ active: true }}
      disabled={viewMode}
      scrollToFirstError={{ focus: true }}
    >
      <Form.Item name="active" hidden>
        <Input />
      </Form.Item>

      {!viewMode && (
        <div className="-mx-6 mb-4 border-y border-slate-100 bg-slate-50 px-6 py-3">
          <p className="mb-2 font-medium text-slate-800">
            Description
          </p>

          <p className="text-sm text-slate-500">
            {description}
          </p>
        </div>
      )}

      {showNameField && (
        <>
          <Form.Item
            name="name"
            label={nameLabel}
            rules={[
              {
                required: true,
                whitespace: true,
                message: `Please enter ${nameLabel.toLowerCase()}`,
              },
            ]}
          >
            <Input />
          </Form.Item>

          {hasShortName && (
            <Form.Item
              name="shortName"
              label={shortNameLabel}
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: `Please enter ${shortNameLabel.toLowerCase()}`,
                },
              ]}
            >
              <Input className="max-w-[230px]" />
            </Form.Item>
          )}
        </>
      )}

      {renderExtraFields?.({ viewMode, form })}
    </Form>
  </Drawer>
);

export default SimpleMasterDrawer;
