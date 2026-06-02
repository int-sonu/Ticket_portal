import {
  useEffect,
  useMemo,
} from "react";

import {
  Button,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
} from "antd";

import {
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import {
  useGetTaxes,
} from "../Tax/Hooks";

import {
  extractList,
  getSessionPayload,
} from "../Common/SimpleMasterUtils";

const getColumnStyle = (viewMode: boolean) => ({
  display: "grid",

  gridTemplateColumns: viewMode
    ? "32px minmax(128px, 1fr) 90px 112px"
    : "32px minmax(128px, 1fr) 90px 112px 52px 40px",

  alignItems: "center",

  gap: "4px",
});

const getTaxId = (
  tax: any,
  index: number
) =>
  tax?.nTaxId ??
  tax?.taxId ??
  tax?.id ??
  index + 1;

const getTaxName = (
  tax: any
) =>
  tax?.cTaxName ??
  tax?.taxName ??
  tax?.name ??
  "";

const getTaxRate = (
  tax: any
) =>
  tax?.nTaxRate ??
  tax?.taxRate ??
  tax?.nRate ??
  tax?.rate ??
  0;

interface TaxSettingsTableProps {
  viewMode?: boolean;
}

const TaxSettingsTable = ({ viewMode = false }: TaxSettingsTableProps) => {
  const form = Form.useFormInstance();
  const payload = useMemo(
    () => ({
      ...getSessionPayload(),

      pageNumber: 1,

      pageSize: 1000,
    }),
    []
  );
  const {
    data,
    isLoading,
    isError,
  } = useGetTaxes(payload);

  const taxOptions = useMemo(
    () =>
      extractList(data)
        .filter(
          (tax) =>
            tax?.bActive !== false &&
            tax?.bCancelled !== true
        )
        .map((tax, index) => {
          const taxId = getTaxId(
            tax,
            index
          );
          const taxName =
            getTaxName(tax);

          return {
            label: taxName,
            value: taxId,
            taxName,
            taxRate:
              getTaxRate(tax),
          };
        })
        .filter((tax) =>
          String(tax.label).trim()
        ),
    [data]
  );

  useEffect(() => {
    if (!taxOptions.length) return;

    const currentTaxes =
      form.getFieldValue("taxes") ?? [];

    if (!Array.isArray(currentTaxes) || !currentTaxes.length) return;

    const nextTaxes = currentTaxes.map(
      (tax: any) => {
        const matchedTax =
          taxOptions.find(
            (option) =>
              String(option.value) ===
              String(tax?.nTaxId)
          ) ??
          taxOptions.find(
            (option) =>
              String(option.taxName)
                .trim()
                .toLowerCase() ===
              String(tax?.taxName)
                .trim()
                .toLowerCase()
          );

        if (!matchedTax) return tax;

        return {
          ...tax,
          nTaxId:
            tax?.nTaxId ??
            matchedTax.value,
          taxName:
            tax?.taxName ??
            matchedTax.taxName,
          taxRate:
            tax?.taxRate ??
            matchedTax.taxRate,
        };
      }
    );

    form.setFieldValue(
      "taxes",
      nextTaxes
    );
  }, [form, taxOptions]);

  if (isLoading) {
    return (
      <div className="flex min-h-32 items-center justify-center">
        <Spin />
      </div>
    );
  }

  if (isError) {
    return (
      <Empty description="Unable to fetch taxes from Tax Master" />
    );
  }

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
          <div
            style={getColumnStyle(viewMode)}
            className="border-b border-slate-300 pb-3 mb-4 text-sm font-medium text-slate-700"
          >
            <div>Srl</div>

            <div>Tax Name</div>

            <div>Tax Rate</div>

            <div>Apply After Disc</div>

            {!viewMode && <div>Delete</div>}

            {!viewMode && <div></div>}
          </div>

          {fields.map(
            (
              field,
              index
            ) => (
              <div
                key={field.key}
                style={getColumnStyle(viewMode)}
                className="mb-4"
              >
                <div>
                  {index + 1}
                </div>

                <Form.Item
                  {...field}
                  name={[
                    field.name,
                    "nTaxId",
                  ]}
                  className="mb-0"
                >
                  <Select
                    className="w-full"
                    popupMatchSelectWidth={180}
                    showSearch
                    optionFilterProp="label"
                    options={taxOptions}
                    disabled={viewMode}
                    onChange={(
                      value,
                      option
                    ) => {
                      const selectedOption =
                        Array.isArray(option)
                          ? option[0]
                          : option;

                      form.setFieldValue(
                        [
                          "taxes",
                          field.name,
                          "taxName",
                        ],
                        selectedOption?.taxName ??
                          selectedOption?.label ??
                          ""
                      );
                      form.setFieldValue(
                        [
                          "taxes",
                          field.name,
                          "taxRate",
                        ],
                        selectedOption?.taxRate ??
                          0
                      );
                      form.setFieldValue(
                        [
                          "taxes",
                          field.name,
                          "nTaxId",
                        ],
                        value
                      );
                    }}
                  />
                </Form.Item>

                <Form.Item
                  {...field}
                  name={[
                    field.name,
                    "taxName",
                  ]}
                  hidden
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  {...field}
                  name={[
                    field.name,
                    "taxRate",
                  ]}
                  className="mb-0"
                >
                  <Input
                    className="w-full"
                    min={0}
                    disabled={viewMode}
                  />
                </Form.Item>

                <Form.Item
                  {...field}
                  name={[
                    field.name,
                    "applyAfterDisc",
                  ]}
                  valuePropName="checked"
                  className="mb-0"
                >
                  <Checkbox disabled={viewMode} />
                </Form.Item>

                {!viewMode && (
                  <Button
                    type="text"
                    danger
                    className="mb-0 mt-[-10px] mr-122px"
                    icon={
                      <DeleteOutlined />
                    }
                    onClick={() =>
                      remove(
                        field.name
                      )
                    }
                  />
                )}

                {!viewMode && (
                  <Button
                    type="primary"
                    className="mb-0 mt-[-10px] mr-122px"
                    icon={
                      <PlusOutlined />
                    }
                    onClick={() =>
                      add({
                        taxRate: 0,
                        applyAfterDisc: false,
                      })
                    }
                  />
                )}
              </div>
            )
          )}

          {fields.length === 0 && !viewMode && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!taxOptions.length}
              onClick={() =>
                add({
                  taxRate: 0,
                  applyAfterDisc: false,
                })
              }
            />
          )}

          {!taxOptions.length && (
            <Empty description="No taxes found in Tax Master" />
          )}
        </div>
      )}
    </Form.List>
  );
};

export default TaxSettingsTable;
