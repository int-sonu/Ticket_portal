import {
  useEffect,
  useState,
} from "react";

import {
  Checkbox,
  Form,
  Input,
  InputNumber,
  Tabs,
  Upload,
} from "antd";

import {
  DeleteOutlined,
  InboxOutlined,
} from "@ant-design/icons";

import TaxSettingsTable from "./TaxSettingsTable";

const { TextArea } = Input;

const PartsDrawer = () => {
  const form = Form.useFormInstance();
  const watchedImage = Form.useWatch(
    "partImage",
    form
  );
  const [
    previewImage,
    setPreviewImage,
  ] = useState<string>("");

  useEffect(() => {
    setPreviewImage(
      watchedImage || ""
    );
  }, [watchedImage]);

  return (
    <Tabs
      className="part-drawer-tabs"
      defaultActiveKey="1"
      items={[
        {
          key: "1",
          label: "Part Creation",
          children: (
            <div className="part-compact-form">
              <div className="grid grid-cols-[1fr_106px] items-start gap-6">
                <div>
                  <Form.Item
                    name="name"
                    label="Name"
                    className="!mb-2"
                    rules={[
                      {
                        required: true,
                        message:
                          "Please enter name",
                      },
                    ]}
                  >
                    <Input autoFocus />
                  </Form.Item>

                  <div className="grid grid-cols-[1fr_120px] gap-4">
                    <Form.Item
                      name="shortName"
                      label="Short Name"
                      className="!mb-2"
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          message:
                            "Please enter short name",
                        },
                      ]}
                    >
                      <Input />
                    </Form.Item>

                    <Form.Item
                      name="amount"
                      label="Amount"
                      className="!mb-2"
                      rules={[
                        {
                          required: true,
                          message:
                            "Please enter amount",
                        },
                      ]}
                    >
                      <InputNumber className="w-full" />
                    </Form.Item>
                  </div>
                </div>

                <div className="pt-7">
                  <Upload.Dragger
                    multiple={false}
                    showUploadList={false}
                    className="part-image-uploader"
                    accept="image/png,image/jpeg"
                    beforeUpload={(file) => {
                      const reader =
                        new FileReader();

                      reader.onload = () => {
                        const imageUrl = String(
                          reader.result ?? ""
                        );

                        setPreviewImage(
                          imageUrl
                        );
                        form.setFieldValue(
                          "partImage",
                          imageUrl
                        );
                      };

                      reader.readAsDataURL(
                        file
                      );

                      return false;
                    }}
                  >
                    {previewImage ? (
                      <div className="relative h-full w-full">
                        <img
                          src={previewImage}
                          alt="Part"
                          className="h-full w-full rounded object-cover"
                        />

                        <button
                          type="button"
                          className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded bg-red-500 text-xs text-white hover:bg-red-600"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setPreviewImage("");
                            form.setFieldValue(
                              "partImage",
                              ""
                            );
                          }}
                        >
                          <DeleteOutlined />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="mb-1 text-lg">
                          <InboxOutlined />
                        </p>

                        <p className="text-xs font-medium">
                          Upload
                        </p>

                        <p className="text-[10px] text-slate-400">
                          Part Image
                        </p>

                        <p className="text-[10px] text-slate-400">
                          (JPG or PNG)
                        </p>
                      </>
                    )}
                  </Upload.Dragger>

                  <Form.Item
                    name="partImage"
                    hidden
                  >
                    <Input />
                  </Form.Item>
                </div>
              </div>

              <Form.Item
                name="description"
                label="Description"
                className="!mb-3"
              >
                <TextArea rows={3} />
              </Form.Item>

              <Form.Item
                name="serviceCharge"
                valuePropName="checked"
                className="!mb-0"
              >
                <Checkbox>
                  Service Charge
                </Checkbox>
              </Form.Item>
            </div>
          ),
        },
        {
          key: "2",
          label: "Tax Setting",
          children: <TaxSettingsTable />,
        },
      ]}
    />
  );
};

export default PartsDrawer;
