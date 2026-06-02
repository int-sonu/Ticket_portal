import type React from 'react';
import { Button, Drawer, Form, Input, Switch } from 'antd';
import type { FormInstance } from 'antd';
import { CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
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
  showDescription?: boolean;
  requiredFields?: {
    name?: string;
    shortName?: string;
  };
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
  showDescription = true,
  requiredFields,
  renderExtraFields,
  onClose,
  onEdit,
  onDelete,
  onSave,
}: SimpleMasterDrawerProps) => (
 <Drawer
  open={open}
  onClose={onClose}
  closable={false}
  title={
    <div className="flex items-center justify-between">
      {title !== "Customer Master" && <span>{title}</span>}
      <Button
        type="text"
        icon={<CloseOutlined />}
        onClick={onClose}
      />
    </div>
  }
 placement="right"
  zIndex={1500}
  className={`simple-master-drawer${
    title === "Customer Master" ? " customer-master-drawer" : ""
  }`}
  width={
  title === "Agent Group Master"
      ? 550
      :title === "Follow up Master"
      ? 700
      
      : title === "Customer Master"
        ? 500
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
      requiredMark={false}
      scrollToFirstError={{ focus: true }}
      className="flex h-full min-h-0 flex-col "
    >
      <Form.Item name="active" hidden>
        <Input />
      </Form.Item>

      {showDescription && (
        <div className="-mx-6 -mt-6 mb-4 bg-slate-100 px-6 py-3">
          <p className="mb-2 text-sm font-medium text-slate-900">
            Description
          </p>

          <p className="text-sm leading-5 text-slate-500">
            {description}
          </p>
        </div>
      )}

      <div className="simple-master-drawer-scroll min-h-0 w-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
        {showNameField && (
          <>
            <Form.Item
              name="name"
              label={nameLabel}
              className="!mb-1 w-[469px] mt[-48px]"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message:
                    requiredFields?.name ??
                    `Please enter ${nameLabel.toLowerCase()}`,
                },
              ]}
            >
              <Input className="h-[27px] w-[469px]" />
            </Form.Item>

            {hasShortName && (
              <Form.Item
                name="shortName"
                label={shortNameLabel}
                className="!mb-2 w-[150px]"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message:
                      requiredFields?.shortName ??
                      `Please enter ${shortNameLabel.toLowerCase()}`,
                  },
                ]}
              >
                <Input className="h-[27px] w-[150px]" />
              </Form.Item>
            )}
          </>
        )}

        {renderExtraFields?.({ viewMode, form })}
      </div>
    </Form>
  </Drawer>
);

export default SimpleMasterDrawer;
