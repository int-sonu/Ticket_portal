import { useCallback, useMemo, useState } from "react";
import { Button, Form, Input, Modal } from "antd";

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
  const [
    suggestionOpen,
    setSuggestionOpen,
  ] = useState(false);

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
        className="!mb-3 w-[460px]"
        rules={[
          {
            required: true,
            whitespace: true,
            message: "Please enter issue summary",
          },
        ]}
      >
        <Input className="h-[30px]" />
      </Form.Item>

      <div className="border-t border-slate-200 pt-3">
        <p className="mb-3 text-sm text-black font-medium">
          "Choose an issue summary to include in the Issue Summary Master. Your commonly used summaries are available here."
        </p>

        <Button
          block
          htmlType="button"
          className="border-blue-500 text-blue-500"
          onClick={() =>
            setSuggestionOpen(true)
          }
        >
          Select Issue Summary
        </Button>

        <Modal
          open={suggestionOpen}
          footer={null}
          title="Commonly Used Summaries"
          onCancel={() =>
            setSuggestionOpen(false)
          }
          width={480}
          zIndex={1700}
        >
          <p className="mb-3 text-sm text-slate-500">
            Your commonly used summaries are available here.
          </p>

          <div className="space-y-2">
            {suggestionOptions.length ? (
              suggestionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="block w-full rounded bg-sky-100 px-3 py-2 text-left text-sm text-slate-600 hover:bg-sky-200"
                  onClick={() => {
                    form.setFieldsValue({
                      name: option.value,
                    });
                    setSuggestionOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No suggestions
              </p>
            )}
          </div>
        </Modal>
      </div>
    </>
  ), [suggestionOpen, suggestionOptions]);

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
