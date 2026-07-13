import { CalendarOutlined, CloseOutlined } from "@ant-design/icons";
import { Button, Checkbox, Drawer, Form, Input, Select } from "antd";

import deleteIcon from "../../../assets/icons/delete-white.svg";
import editIcon from "../../../assets/icons/edit-black.svg";

import type { FormInstance } from "antd";

export type CustomerAssetFormValues = {
  name: string;
  shortName: string;
  department?: string;
  brand?: string;
  description?: string;
  amc?: boolean;
  warranty?: boolean;
  expiryDate?: string;
};

export type CustomerAssetDrawerMode = "add" | "view" | "edit";

type AssetOption = {
  value: string;
  label: string;
};

type CustomerAssetDrawerProps = {
  open: boolean;
  mode: CustomerAssetDrawerMode;
  form: FormInstance<CustomerAssetFormValues>;
  departmentOptions: AssetOption[];
  brandOptions: AssetOption[];
  saving?: boolean;
  deleting?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
};

const CustomerAssetDrawer = ({
  open,
  mode,
  form,
  departmentOptions,
  brandOptions,
  saving = false,
  deleting = false,
  onClose,
  onEdit,
  onDelete,
  onSave,
}: CustomerAssetDrawerProps) => {
  const viewMode = mode === "view";

  return (
    <Drawer
      open={open}
      forceRender
      placement="right"
      width={500}
      closable={false}
      onClose={onClose}
      styles={{
        header: { minHeight: 64, padding: "16px 23px" },
        body: { position: "relative", padding: "20px 23px 76px" },
      }}
      title={(
        <div className="flex items-center justify-between">
          <span>{mode === "add" ? "Add Asset" : "Asset"}</span>
          <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
        </div>
      )}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className="asset-details-form"
      >
        <Form.Item
          className="mb-3"
          name="name"
          label="Name"
          rules={[{ required: true, whitespace: true, message: "Please enter name" }]}
        >
          <Input readOnly={viewMode} />
        </Form.Item>

        <div className="grid grid-cols-2 gap-[10px]">
          <Form.Item
            className="mb-3"
            name="shortName"
            label="Short Name"
            rules={[{ required: true, whitespace: true, message: "Please enter short name" }]}
          >
            <Input readOnly={viewMode} />
          </Form.Item>

          <Form.Item className="mb-3" name="department" label="Department">
            <Select
              className={viewMode ? "pointer-events-none" : ""}
              showSearch={!viewMode}
              optionFilterProp="label"
              allowClear={!viewMode}
              options={departmentOptions}
            />
          </Form.Item>

          <Form.Item className="mb-3" name="brand" label="Brand">
            <Select
              className={viewMode ? "pointer-events-none" : ""}
              showSearch={!viewMode}
              optionFilterProp="label"
              allowClear={!viewMode}
              options={brandOptions}
            />
          </Form.Item>
        </div>

        <Form.Item className="mb-3" name="description" label="Description">
          <Input.TextArea readOnly={viewMode} rows={3} style={{ minHeight: 85 }} />
        </Form.Item>

        <div className="grid grid-cols-[168px_minmax(0,1fr)] items-end gap-[10px]">
          <div className={`flex items-center gap-5 pb-[7px] ${viewMode ? "pointer-events-none" : ""}`}>
            <Form.Item name="amc" valuePropName="checked" className="mb-0">
              <Checkbox onChange={(event) => event.target.checked && form.setFieldValue("warranty", false)}>
                AMC
              </Checkbox>
            </Form.Item>
            <Form.Item name="warranty" valuePropName="checked" className="mb-0">
              <Checkbox onChange={(event) => event.target.checked && form.setFieldValue("amc", false)}>
                Warranty
              </Checkbox>
            </Form.Item>
          </div>

          <Form.Item name="expiryDate" label="Expiry Date" className="mb-0">
            <Input readOnly={viewMode} placeholder="dd-mm-yyyy" suffix={<CalendarOutlined />} />
          </Form.Item>
        </div>
      </Form>

      <div className="absolute bottom-5 right-[23px] flex justify-end gap-2">
        {viewMode ? (
          <>
            <Button
              aria-label="Edit asset"
              className="h-9 w-9 p-0"
              icon={<img src={editIcon} alt="" className="h-4 w-4" />}
              onClick={onEdit}
            />
            <Button
              danger
              type="primary"
              aria-label="Delete asset"
              loading={deleting}
              className="h-9 w-9 p-0"
              style={{ backgroundColor: "#ff3333", borderColor: "#ff3333" }}
              icon={<img src={deleteIcon} alt="" className="h-4 w-4" />}
              onClick={onDelete}
            />
          </>
        ) : (
          <Button
            type="primary"
            loading={saving}
            className="min-w-[90px]"
            style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
            onClick={onSave}
          >
            {mode === "edit" ? "Save" : "Save"}
          </Button>
        )}
      </div>
    </Drawer>
  );
};

export default CustomerAssetDrawer;
