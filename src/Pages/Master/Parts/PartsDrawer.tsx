import {
  Checkbox,
  Form,
  Input,
  InputNumber,
  Tabs,
  Upload,
} from "antd";

import {
  InboxOutlined,
} from "@ant-design/icons";

import TaxSettingsTable from "./TaxSettingsTable";

const { TextArea } = Input;

const PartsDrawer = () => {
  return (
    <Tabs
      defaultActiveKey="1"
      items={[
        {
          key: "1",

          label: "Part Creation",

          children: (
            <div className="space-y-4">

              {/* NAME */}

              <Form.Item
                name="name"
                label="Name"
                rules={[
                  {
                    required: true,
                    message: "Please enter name",
                  },
                ]}
              >
                <Input autoFocus />
              </Form.Item>





              <div className="grid grid-cols-3 gap-4 items-start">

                {/* LEFT */}

                <div className="col-span-2 space-y-4">

                  <div className="grid grid-cols-2 gap-4">

                    {/* SHORT NAME */}

                    <Form.Item
                      name="shortName"
                      label="Short Name"
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          message: "Please enter short name",
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>



                    {/* AMOUNT */}

                    <Form.Item
                      name="amount"
                      label="Amount"
                      rules={[
                        {
                          required: true,
                          message: "Please enter amount",
                        },
                      ]}
                    >
                      <InputNumber
                        className="w-full"
                      />
                    </Form.Item>

                  </div>





                  {/* DESCRIPTION */}

                  <Form.Item
                    name="description"
                    label="Description"
                  >
                    <TextArea rows={4} />
                  </Form.Item>





                  {/* SERVICE CHARGE */}

                  <Form.Item
                    name="serviceCharge"
                    valuePropName="checked"
                  >
                    <Checkbox>
                      Service Charge
                    </Checkbox>
                  </Form.Item>

                </div>





                {/* IMAGE */}

                <div>

                  <Upload.Dragger
                    multiple={false}
                    showUploadList={false}
                    className="p-4"
                  >
                    <p className="text-xl mb-2">
                      <InboxOutlined />
                    </p>

                    <p className="font-medium">
                      Upload
                    </p>

                    <p className="text-xs text-slate-400">
                      Part Image
                    </p>

                    <p className="text-xs text-slate-400">
                      (JPG or PNG)
                    </p>

                  </Upload.Dragger>

                </div>

              </div>

            </div>
          ),
        },





        {
          key: "2",

          label: "Tax Setting",

          children:
            <TaxSettingsTable />,
        },
      ]}
    />
  );
};

export default PartsDrawer;
