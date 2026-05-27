import { useCallback, useMemo } from "react";
import { Button, Form, Input, Select } from "antd";

import SimpleMasterList from "../Common/SimpleMasterList";

import {
  extractList,
  getSessionPayload,
} from "../Common/SimpleMasterUtils";

import type {
  SimpleMasterRow,
} from "../Common/SimpleMasterUtils";

import {
  useDeleteIssueSummary,
  useGetIssueSummaries,
  useGetIssueSuggestions,
  useSaveIssueSummary,
  useUpdateIssueSummary,
} from "./Hooks";

const getIssueName = (item: any) =>
  item?.cIssueSummary ??
  item?.cIssueName ??
  item?.cIssue ??
  item?.cName ??
  "";

const mapIssueSummaryRow = (
  item: any,
  index: number
): SimpleMasterRow => ({
  id:
    item?.nIssueId ??
    item?.nIssueSummaryId ??
    index + 1,

  key:
    item?.nIssueId ??
    item?.nIssueSummaryId ??
    index + 1,

  srl:
    index + 1,

  name:
    getIssueName(item) ||
    "N/A",

  shortName:
    "",

  active:
    item?.bActive !== false &&
    item?.bCancelled !== true,

  raw: item,
});

const buildIssuePayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => ({
  nIssueId:
    selectedRow?.id,

  nIssueSummaryId:
    selectedRow?.id,

  cIssueSummary:
    values.name,

  cIssueName:
    values.name,

  bActive:
    values.active ?? true,
});

const IssueSummary = () => {
  const {
    mutate: saveIssue,
    isPending: isSaving,
  } = useSaveIssueSummary();

  const {
    mutate: updateIssue,
    isPending: isUpdating,
  } = useUpdateIssueSummary();

  const {
    mutate: deleteIssue,
  } = useDeleteIssueSummary();

  const suggestPayload = useMemo(
    () => getSessionPayload(),
    []
  );

  const {
    data: suggestionData,
  } = useGetIssueSuggestions(
    suggestPayload
  );

  const suggestionOptions = useMemo(
    () =>
      extractList(suggestionData)
        .map((item) => getIssueName(item))
        .filter(Boolean)
        .map((value) => ({
          label: value,
          value,
        })),
    [suggestionData]
  );

  const renderIssueFields = useCallback(({
    form,
  }: any) => (
    <>
      <Form.Item
        name="name"
        label="Name"
        rules={[
          {
            required: true,
            whitespace: true,
            message: "Please enter issue summary",
          },
        ]}
      >
        <Input />
      </Form.Item>

      <div className="border-t border-slate-200 pt-3">
        <p className="mb-3 text-sm text-slate-600">
          "Choose an issue summary to include in the Issue Summary Master. Your commonly used summaries are available here."
        </p>

        <Select
          className="w-full"
          placeholder="Select Issue Summary"
          options={suggestionOptions}
          onChange={(value) =>
            form.setFieldsValue({
              name: value,
            })
          }
          dropdownRender={(menu) => (
            <>
              {menu}
              {!suggestionOptions.length && (
                <Button
                  type="link"
                  block
                  disabled
                >
                  No suggestions
                </Button>
              )}
            </>
          )}
        />
      </div>
    </>
  ), [suggestionOptions]);

  const listProps = useMemo(
    () => ({
      title:
        "Issue Summary Master",

      entityName:
        "Issue Summary",

      nameColumnTitle:
        "Issue Summary",

      drawerDescription:
        "This section allows you to manage Issue Summary, which includes adding, editing, and viewing.",

      idKey:
        "nIssueId",

      useListQuery:
        useGetIssueSummaries,

      saveMutation:
        saveIssue,

      updateMutation:
        updateIssue,

      deleteMutation:
        deleteIssue,

      isSaving:
        isSaving || isUpdating,

      mapRow:
        mapIssueSummaryRow,

      buildPayload:
        buildIssuePayload,

      renderExtraFields:
        renderIssueFields,

      showNameField:
        false,

      hasShortName:
        false,

      validateShortName:
        false,
    }),
    [
      deleteIssue,
      isSaving,
      isUpdating,
      renderIssueFields,
      saveIssue,
      updateIssue,
    ]
  );

  return (
    <SimpleMasterList
      {...listProps}
    />
  );
};

export default IssueSummary;
