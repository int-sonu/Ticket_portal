import {
  useEffect,
  useMemo,
  useState,
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
    ? "36px minmax(0, 1fr) 92px 112px"
    : "36px minmax(0, 1fr) 84px 102px 42px 42px",

  alignItems: "center",

  gap: "8px",
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
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
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

  const getTaxOptionsForField = (fieldKey: number) => {
    const term = String(searchTerms[fieldKey] ?? "").trim().toLowerCase();

    if (!term) return taxOptions;

    return taxOptions.filter((option) =>
      String(option.label).toLowerCase().includes(term) ||
      String(option.taxName).toLowerCase().includes(term)
    );
  };

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

    const hasChanges = nextTaxes.some((tax, index) => {
      const currentTax = currentTaxes[index] ?? {};

      return (
        String(currentTax?.nTaxId ?? "") !== String(tax?.nTaxId ?? "") ||
        String(currentTax?.taxName ?? "") !== String(tax?.taxName ?? "") ||
        String(currentTax?.taxRate ?? "") !== String(tax?.taxRate ?? "")
      );
    });

    if (hasChanges) {
      form.setFieldValue(
        "taxes",
        nextTaxes
      );
    }
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
        <div className="w-full">
            <div
              style={getColumnStyle(viewMode)}
              className="border-b border-slate-300 pb-3 mb-4 text-xs font-medium text-slate-700"
            >
              <div className="border-r border-slate-200 pr-2">Srl</div>

              <div className="border-r border-slate-200 pr-2">Tax Name</div>

              <div className="border-r border-slate-200 pr-2 text-center">Tax Rate</div>

              <div className="border-r border-slate-200 pr-2 text-center">Apply After Disc</div>

              {!viewMode && <div className="border-r border-slate-200 pr-2 text-center">Del</div>}

              {!viewMode && <div className="text-center">Add</div>}
            </div>

            {fields.map((field, index) => {
              const { key, ...fieldProps } = field as any;

              return (
                <div
                  key={key}
                  style={getColumnStyle(viewMode)}
                  className="mb-3"
                >
                  <div className="text-xs text-slate-600">{index + 1}</div>

                  <Form.Item
                    {...fieldProps}
                    name={[
                      field.name,
                      "nTaxId",
                    ]}
                    className="mb-0 min-w-0"
                  >
                  <Select
                    className="w-full min-w-0"
                    placement="bottomLeft"
                    popupMatchSelectWidth={false}
                    dropdownMatchSelectWidth={false}
                    showSearch={false}
                    optionFilterProp="label"
                    dropdownStyle={{ minWidth: 240, maxHeight: 280 }}
                    getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
                    dropdownRender={(menu) => (
                      <div
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        <div className="px-2 pt-2">
                          <Input.Search
                            allowClear
                            size="small"
                            placeholder="Search"
                            value={searchTerms[field.key] ?? ""}
                            onChange={(event) =>
                              setSearchTerms((current) => ({
                                ...current,
                                [field.key]: event.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="max-h-56 overflow-y-auto py-2">
                          {menu}
                        </div>
                      </div>
                    )}
                    options={getTaxOptionsForField(field.key)}
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
                      setSearchTerms((current) => ({
                        ...current,
                        [field.key]: "",
                      }));
                    }}
                  />
                  </Form.Item>

                  <Form.Item
                    {...fieldProps}
                    name={[
                      field.name,
                      "taxName",
                    ]}
                    hidden
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    {...fieldProps}
                    name={[
                      field.name,
                      "taxRate",
                    ]}
                    className="mb-0"
                  >
                    <Input
                      className="w-full min-w-0"
                      min={0}
                      disabled={viewMode}
                    />
                  </Form.Item>

                  <Form.Item
                    {...fieldProps}
                    name={[
                      field.name,
                      "applyAfterDisc",
                    ]}
                    valuePropName="checked"
                    className=" flex items-center justify-center mt-[-80%]"
                  >
                    <Checkbox disabled={viewMode} />
                  </Form.Item>

                  {!viewMode && (
                    <div className="flex items-center justify-center mt-[-80%]">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    </div>
                  )}

                  {!viewMode && (
                    <div className="flex items-center justify-center mt-[-80%]">
                      <Button
                        type="primary"
                        size="small"
                        shape="circle"
                        icon={<PlusOutlined />}
                        onClick={() =>
                          add({
                            taxRate: 0,
                            applyAfterDisc: false,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}

          {fields.length === 0 && !viewMode && (
            <div className="mt-2 flex justify-start">
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                disabled={!taxOptions.length}
                onClick={() =>
                  add({
                    taxRate: 0,
                    applyAfterDisc: false,
                  })
                }
              />
            </div>
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
