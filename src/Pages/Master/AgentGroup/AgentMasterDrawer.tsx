import type React from 'react';
import { Button, Checkbox, Drawer, Form, Input, Select, Switch } from 'antd';
import type { FormInstance } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { AgentRow } from './Utils';

type Option = {
  label: string;
  value: string;
};

type AgentMasterDrawerProps = {
  open: boolean;
  viewMode: boolean;
  form: FormInstance;
  activeValue?: boolean;
  selectedAgent: AgentRow | null;
  isSaving: boolean;
  agents: AgentRow[];
  userTypeOptions: Option[];
  groupOptions: Option[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: (event: React.MouseEvent, record: AgentRow) => void;
  onSave: (values: any) => void;
};

const AgentMasterDrawer = ({
  open,
  viewMode,
  form,
  activeValue,
  selectedAgent,
  isSaving,
  agents,
  userTypeOptions,
  groupOptions,
  onClose,
  onEdit,
  onDelete,
  onSave,
}: AgentMasterDrawerProps) => {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Agent Master"
      placement="right"
      width={500}
      destroyOnClose
      className="agent-master-drawer"
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
              {selectedAgent && (
                <Button danger type="primary" icon={<DeleteOutlined />} onClick={(event) => onDelete(event, selectedAgent)} />
              )}
            </>
          ) : (
            <Button
              type="primary"
              htmlType="submit"
              form="agent-master-form"
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
        id="agent-master-form"
        form={form}
        layout="vertical"
        onFinish={onSave}
        initialValues={{ active: true, isSupportAgent: false }}
        disabled={viewMode}
      >
        <div className="-mx-6 mb-4 border-y border-slate-100 bg-slate-50 px-6 py-3">
          <p className="mb-2 font-medium text-slate-800">Description</p>
          <p className="text-sm text-slate-500">
            This section allows you to manage agents, which includes adding, editing, and viewing.
          </p>
        </div>

        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter agent name' }]}>
          <Input />
        </Form.Item>

        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="shortName" label="Short Name">
            <Input />
          </Form.Item>
          <Form.Item name="userType" label="User Type">
            <Select options={userTypeOptions} suffixIcon={<span className="text-lg leading-none">&gt;</span>} />
          </Form.Item>
        </div>

        <Form.Item name="reportingTo" label="Reporting to">
          <Select
            options={agents
              .filter((agent) => agent.id !== selectedAgent?.id)
              .map((agent) => ({ label: agent.name, value: agent.name }))}
            suffixIcon={<span className="text-lg leading-none">&gt;</span>}
          />
        </Form.Item>

        <Form.Item name="agentGroup" label="Agent Group">
          <Select options={groupOptions} suffixIcon={<span className="text-lg leading-none">&gt;</span>} />
        </Form.Item>

        <Form.Item name="isSupportAgent" valuePropName="checked" className="mb-2">
          <Checkbox>Support Agent</Checkbox>
        </Form.Item>

        <div className="grid grid-cols-[0.8fr_1.6fr] gap-3 border-b border-slate-100 pb-3">
          <Form.Item name="phoneNo" label="Mobile Number">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Please enter a valid email' }]}>
            <Input />
          </Form.Item>
        </div>

        <h2 className="mt-3 mb-3 text-base font-medium text-slate-900">
          Create a username and password for the created agent.
        </h2>

        <Form.Item name="username" label="User Name">
          <Input />
        </Form.Item>
        <Form.Item name="password" label="Password">
          <Input.Password />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default AgentMasterDrawer;
