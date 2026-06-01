import type React from 'react';

import {
  Button,
  Checkbox,
  Drawer,
  Form,
  Input,
  Select,
  Switch,
} from 'antd';

import type { FormInstance } from 'antd';

import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';

import type { AgentRow } from './Utils';

type Option = {
  label: string;
  value: string | number;
  raw?: any;
};

type AgentMasterDrawerProps = {
  open: boolean;
  viewMode: boolean;
  form: FormInstance;
  activeValue?: boolean;
  selectedAgent: AgentRow | null;
  isSaving: boolean;
  reportToOptions: Option[];
  userTypeOptions: Option[];
  groupOptions: Option[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: (
    event: React.MouseEvent,
    record: AgentRow
  ) => void;
  onSave: (values: any) => void;
};

const AgentMasterDrawer = ({
  open,
  viewMode,
  form,
  activeValue,
  selectedAgent,
  isSaving,
  reportToOptions,
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
      closable={false}
      title={
        <div className="flex items-center justify-between">
          <span>Agent Master</span>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
          />
        </div>
      }
      placement="right"
      zIndex={1500}
      width={490}
      destroyOnClose
      className="agent-master-drawer simple-master-drawer"
      footer={
        <div className="flex items-center justify-end gap-4">

          <span className="text-sm font-medium text-slate-700">
            Active / Inactive
          </span>

          <Switch
            className="agent-green-switch"
            checked={activeValue ?? true}
            disabled={viewMode}
            size="small"
            onChange={(checked) =>
              form.setFieldsValue({
                active: checked,
              })
            }
          />

          {viewMode ? (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={onEdit}
              />

              {selectedAgent && (
                <Button
                  danger
                  type="primary"
                  icon={<DeleteOutlined />}
                  onClick={(event) =>
                    onDelete(
                      event,
                      selectedAgent
                    )
                  }
                />
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
        initialValues={{
          active: true,
          bSupportAgent: false,
        }}
        disabled={viewMode}
        requiredMark={false}
        scrollToFirstError={{ focus: true }}
        className="flex h-full min-h-0 flex-col"
      >

        <Form.Item
          name="active"
          hidden
        >
          <Input />
        </Form.Item>





        {/* DESCRIPTION */}

        <div className="-mx-6 -mt-6 mb-4 bg-slate-100 px-6 py-3">

          <p className="mb-2 text-sm font-medium text-slate-900">
            Description
          </p>

          <p className="text-sm leading-5 text-slate-500">
            This section allows you to manage agents,
            which includes adding, editing,
            and viewing.
          </p>

        </div>





        <div className="simple-master-drawer-scroll min-h-0 w-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">

        {/* NAME */}

        <Form.Item
          name="agentName"
          label="Name"
          className="!mb-3"
          rules={[
            {
              required: true,
              whitespace: true,
              message:
                'Please enter agent name',
            },
          ]}
        >
          <Input className="h-[30px]" />
        </Form.Item>





        <div className="grid grid-cols-2 gap-3">

          {/* SHORT NAME */}

          <Form.Item
            name="agentShortName"
            label="Short Name"
            className="!mb-3"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  'Please enter short name',
              },
            ]}
          >
            <Input className="h-[30px]" />
          </Form.Item>





          {/* USER TYPE */}

          <Form.Item
            name="nUserType"
            label="User Type"
            className="!mb-3"
            rules={[
              {
                required: true,
                message:
                  'Please select user type',
              },
            ]}
          >
            <Select
              className="agent-compact-select"
              options={userTypeOptions}
              suffixIcon={
                <span className="text-lg leading-none">
                  &gt;
                </span>
              }
            />
          </Form.Item>

        </div>





        {/* REPORTING TO */}

        <Form.Item
          name="nReportTo"
          label="Reporting to"
          className="!mb-3"
        >
          <Select
            className="agent-compact-select"
            allowClear
            options={reportToOptions.filter(
              (agent) =>
                agent.value !==
                selectedAgent?.id
            )}
            suffixIcon={
              <span className="text-lg leading-none">
                &gt;
              </span>
            }
          />
        </Form.Item>





        {/* AGENT GROUP */}

        <Form.Item
          name="nAgentGroupId"
          label="Agent Group"
          className="!mb-3"
          rules={[
            {
              required: true,
              message:
                'Please select agent group',
            },
          ]}
        >
          <Select
            className="agent-compact-select"
            options={groupOptions}
            suffixIcon={
              <span className="text-lg leading-none">
                &gt;
              </span>
            }
            onChange={(_, option) => {
              const selectedOption =
                Array.isArray(option)
                  ? option[0]
                  : option;

              form.setFieldValue(
                'cAgentGroupName',
                selectedOption?.label
              );
            }}
          />
        </Form.Item>





        <Form.Item
          name="cAgentGroupName"
          hidden
        >
          <Input />
        </Form.Item>





        {/* SUPPORT AGENT */}

        <Form.Item
          name="bSupportAgent"
          valuePropName="checked"
          className="!mb-3"
        >
          <Checkbox>
            Support Agent
          </Checkbox>
        </Form.Item>





        <div className="grid grid-cols-[0.8fr_1.6fr] gap-3 border-b border-slate-100 pb-2">

          {/* MOBILE */}

          <Form.Item
            name="cMobileNo"
            label="Mobile Number"
            className="!mb-3"
            rules={[
              {
                required: true,
                message:
                  'Please enter mobile number',
              },
            ]}
          >
            <Input className="h-[30px]" />
          </Form.Item>





          {/* EMAIL */}

          <Form.Item
            name="cEmail"
            label="Email"
            className="!mb-3"
            rules={[
              {
                required: true,
                message:
                  'Please enter email',
              },
              {
                type: 'email',
                message:
                  'Please enter valid email',
              },
            ]}
          >
            <Input className="h-[30px]" />
          </Form.Item>

        </div>





        <h2 className="mt-2 mb-2 text-sm font-medium text-slate-900">
          Create a username and password
          for the created agent.
        </h2>





        {/* USERNAME */}

        <Form.Item
          name="username"
          label="User Name"
          className="!mb-3"
          rules={[
            {
              required: true,
              whitespace: true,
              message:
                'Please enter user name',
            },
          ]}
        >
          <Input className="h-[30px]" />
        </Form.Item>





        {/* PASSWORD */}

        <Form.Item
          name="password"
          label="Password"
          className="!mb-3"
          rules={[
            {
              required: !selectedAgent,
              message:
                'Please enter password',
            },
          ]}
        >
          <Input.Password className="h-[30px]" />
        </Form.Item>

        </div>

      </Form>
    </Drawer>
  );
};

export default AgentMasterDrawer;
