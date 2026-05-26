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
    width={500}
    destroyOnClose
    footer={
      <div className="flex items-center justify-end gap-4">
        <span className="text-sm font-medium text-slate-700">Active / Inactive</span>
        <Switch
          checked={activeValue ?? true}
          disabled={viewMode}
          size="small"
          onChange={(checked) => form.setFieldValue('active', checked)}
        />
        {viewMode ? (
          <>
            <Button icon={<EditOutlined />} onClick={onEdit} />
            {selectedRow && (
              <Button danger type="primary" icon={<DeleteOutlined />} onClick={(event) => onDelete(event, selectedRow)} />
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
    >
      {!viewMode && (
        <div className="-mx-6 mb-4 border-y border-slate-100 bg-slate-50 px-6 py-3">
          <p className="mb-2 font-medium text-slate-800">Description</p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      )}

      <Form.Item name="name" label={nameLabel} rules={[{ required: true, message: `Please enter ${nameLabel.toLowerCase()}` }]}>
        <Input />
      </Form.Item>

      <Form.Item name="shortName" label={shortNameLabel}>
        <Input className="max-w-[230px]" />
      </Form.Item>

      {renderExtraFields?.({ viewMode, form })}
    </Form>
  </Drawer>
);

export default SimpleMasterDrawer;
