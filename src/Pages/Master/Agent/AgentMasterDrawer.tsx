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
      title="Agent Master"
      placement="right"
      size="large"
      destroyOnClose
      className="agent-master-drawer"
      footer={
        <div className="flex items-center justify-end gap-4">

          <span className="text-sm font-medium text-slate-700">
            Active / Inactive
          </span>

          <Switch
            checked={activeValue ?? true}
            disabled={viewMode || !selectedAgent}
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
        scrollToFirstError={{ focus: true }}
      >

        <Form.Item
          name="active"
          hidden
        >
          <Input />
        </Form.Item>





        {/* DESCRIPTION */}

        <div className="-mx-6 mb-4 border-y border-slate-100 bg-slate-50 px-6 py-3">

          <p className="mb-2 font-medium text-slate-800">
            Description
          </p>

          <p className="text-sm text-slate-500">
            This section allows you to manage agents,
            which includes adding, editing,
            and viewing.
          </p>

        </div>





        {/* NAME */}

        <Form.Item
          name="agentName"
          label="Name"
          rules={[
            {
              required: true,
              whitespace: true,
              message:
                'Please enter agent name',
            },
          ]}
        >
          <Input />
        </Form.Item>





        <div className="grid grid-cols-2 gap-3">

          {/* SHORT NAME */}

          <Form.Item
            name="agentShortName"
            label="Short Name"
            rules={[
              {
                required: true,
                whitespace: true,
                message:
                  'Please enter short name',
              },
            ]}
          >
            <Input />
          </Form.Item>





          {/* USER TYPE */}

          <Form.Item
            name="nUserType"
            label="User Type"
            rules={[
              {
                required: true,
                message:
                  'Please select user type',
              },
            ]}
          >
            <Select
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
        >
          <Select
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
          rules={[
            {
              required: true,
              message:
                'Please select agent group',
            },
          ]}
        >
          <Select
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
          className="mb-2"
        >
          <Checkbox>
            Support Agent
          </Checkbox>
        </Form.Item>





        <div className="grid grid-cols-[0.8fr_1.6fr] gap-3 border-b border-slate-100 pb-3">

          {/* MOBILE */}

          <Form.Item
            name="cMobileNo"
            label="Mobile Number"
            rules={[
              {
                required: true,
                message:
                  'Please enter mobile number',
              },
            ]}
          >
            <Input />
          </Form.Item>





          {/* EMAIL */}

          <Form.Item
            name="cEmail"
            label="Email"
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
            <Input />
          </Form.Item>

        </div>





        <h2 className="mt-3 mb-3 text-base font-medium text-slate-900">
          Create a username and password
          for the created agent.
        </h2>





        {/* USERNAME */}

        <Form.Item
          name="username"
          label="User Name"
          rules={[
            {
              required: true,
              whitespace: true,
              message:
                'Please enter user name',
            },
          ]}
        >
          <Input />
        </Form.Item>





        {/* PASSWORD */}

        <Form.Item
          name="password"
          label="Password"
          rules={[
            {
              required: !selectedAgent,
              message:
                'Please enter password',
            },
          ]}
        >
          <Input.Password />
        </Form.Item>

      </Form>
    </Drawer>
  );
};

export default AgentMasterDrawer;
