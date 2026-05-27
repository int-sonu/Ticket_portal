import {
  Button,
  Checkbox,
  Form,
  InputNumber,
  Select,
} from "antd";

import {
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";

const columnStyle = {
  display: "grid",

  gridTemplateColumns:
    "60px 1.5fr 120px 140px 80px 80px",

  alignItems: "center",

  gap: "16px",
};

const TaxSettingsTable = () => {
  return (
    <Form.List name="taxes">

      {(
        fields,
        {
          add,
          remove,
        }
      ) => (
        <div>

          {/* HEADER */}

          <div
            style={columnStyle}
            className="border-b pb-3 mb-4 text-sm font-medium text-slate-700"
          >

            <div>Srl</div>

            <div>Tax Name</div>

            <div>Tax Rate</div>

            <div>Apply After Disc</div>

            <div>Delete</div>

            <div></div>

          </div>





          {/* ROWS */}

          {fields.map(
            (
              field,
              index
            ) => (
              <div
                key={field.key}
                style={columnStyle}
                className="mb-4"
              >

                {/* SRL */}

                <div>
                  {index + 1}
                </div>





                {/* TAX NAME */}

                <Form.Item
                  {...field}
                  name={[
                    field.name,
                    "taxName",
                  ]}
                  className="mb-0"
                >
                  <Select
                    placeholder=""
                    options={[
                      {
                        label: "GST",
                        value: "GST",
                      },

                      {
                        label: "CGST",
                        value: "CGST",
                      },

                      {
                        label: "SGST",
                        value: "SGST",
                      },
                    ]}
                  />
                </Form.Item>





                {/* TAX RATE */}

                <Form.Item
                  {...field}
                  name={[
                    field.name,
                    "taxRate",
                  ]}
                  className="mb-0"
                >
                  <InputNumber
                    className="w-full"
                    min={0}
                  />
                </Form.Item>





                {/* APPLY AFTER DISC */}

                <Form.Item
                  {...field}
                  name={[
                    field.name,
                    "applyAfterDisc",
                  ]}
                  valuePropName="checked"
                  className="mb-0"
                >
                  <Checkbox />
                </Form.Item>





                {/* DELETE */}

                <Button
                  type="text"
                  danger
                  icon={
                    <DeleteOutlined />
                  }
                  onClick={() =>
                    remove(
                      field.name
                    )
                  }
                />





                {/* ADD */}

                <Button
                  type="primary"
                  icon={
                    <PlusOutlined />
                  }
                  onClick={() =>
                    add()
                  }
                />

              </div>
            )
          )}





          {/* INITIAL BUTTON */}

          {fields.length === 0 && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                add()
              }
            />
          )}

        </div>
      )}

    </Form.List>
  );
};

export default TaxSettingsTable;