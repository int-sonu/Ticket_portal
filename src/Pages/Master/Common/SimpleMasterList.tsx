import { useMemo, useState } from 'react';
import type React from 'react';

import {
  Button,
  Empty,
  Form,
  Input,
  Switch,
  message,
} from 'antd';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import type { UseMutateFunction } from '@tanstack/react-query';

import AntTable from '../../../ui/Table/AntTable';

import SimpleMasterDrawer from './SimpleMasterDrawer';

import { useSimpleMasterCrud } from './useSimpleMasterCrud';

import {
  buildSimpleMasterFormValues,
  extractList,
  filterSimpleMasterRows,
  getApiMessage,
  getSessionPayload,
  getTotalCount,
  isApiSuccess,
  isCancelled,
  normalizeCompareText,
  trimFormValues,
} from './SimpleMasterUtils';

import type { SimpleMasterRow } from './SimpleMasterUtils';

type SimpleMasterListProps = {
  title: string;

  entityName: string;

  nameColumnTitle: string;

  drawerDescription: string;

  idKey: string;

  useListQuery: (
    payload: any
  ) => {
    data?: any;

    isLoading: boolean;

    isError: boolean;
  };

  saveMutation: UseMutateFunction<
    any,
    Error,
    any,
    unknown
  >;

  updateMutation?: UseMutateFunction<
    any,
    Error,
    any,
    unknown
  >;

  deleteMutation: UseMutateFunction<
    any,
    Error,
    any,
    unknown
  >;

  isSaving?: boolean;

  mapRow: (
    item: any,
    index: number
  ) => SimpleMasterRow;

  buildPayload: (
    values: any,
    selectedRow: SimpleMasterRow | null
  ) => any;

  buildDeletePayload?: (
    record: SimpleMasterRow
  ) => any;

  filterRawItem?: (
    item: any
  ) => boolean;

  buildFormValues?: (
    row?: SimpleMasterRow | null
  ) => any;

  renderExtraFields?: (
    options: {
      viewMode: boolean;

      form: ReturnType<
        typeof Form.useForm
      >[0];
    }
  ) => React.ReactNode;



  // NEW PROPS

  hasShortName?: boolean;

  showNameField?: boolean;
  showDescription?: boolean;

  requiredFields?: {
    name?: string;
    shortName?: string;
  };

  extraColumns?: any[];

  validateShortName?: boolean;

  disableEdit?: (
    row: any
  ) => boolean;

  disableDelete?: (
    row: any
  ) => boolean;

  disableToggle?: (
    row: any
  ) => boolean;

  restrictedMessage?: string;
};

const SimpleMasterList = ({
  title,
  entityName,
  nameColumnTitle,
  drawerDescription,
  idKey,
  useListQuery,
  saveMutation,
  updateMutation,
  deleteMutation,
  isSaving = false,
  mapRow,
  buildPayload,
  buildDeletePayload,
  filterRawItem = (item) =>
    !isCancelled(item),
  buildFormValues =
    buildSimpleMasterFormValues,
  renderExtraFields,



  // NEW

  hasShortName = true,

  showNameField = true,
  showDescription = true,
  requiredFields,

  extraColumns = [],

  validateShortName = hasShortName,

  disableEdit,

  disableDelete,

  disableToggle,

  restrictedMessage,
}: SimpleMasterListProps) => {

  const [currentPage, setCurrentPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(10);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [viewMode, setViewMode] =
    useState(false);

  const [selectedRow, setSelectedRow] =
    useState<SimpleMasterRow | null>(
      null
    );

  const [deletedRowIds, setDeletedRowIds] =
    useState<Array<string | number>>(
      []
    );

  const [activeOverrides, setActiveOverrides] =
    useState<Record<string, boolean>>(
      {}
    );

  const [form] = Form.useForm();

  const activeValue = Form.useWatch(
    'active',
    form
  );



  // API PAYLOAD

  const payload = useMemo(
    () => ({
      ...getSessionPayload(),

      pageNumber: currentPage,

      pageSize,
    }),
    [currentPage, pageSize]
  );



  // API CALL

  const {
    data,
    isLoading,
    isError,
  } = useListQuery(payload);




  // TABLE DATA

  const allRows = useMemo(
    () =>
      extractList(data)
        .filter(filterRawItem)
        .map(mapRow)
        .map((row) => ({
          ...row,
          active:
            activeOverrides[String(row.id)] ??
            row.active,
        }))
        .filter(
          (row) =>
            !deletedRowIds.includes(
              row.id
            )
        ),

    [
      data,
      deletedRowIds,
      activeOverrides,
      filterRawItem,
      mapRow,
    ]
  );

  const dataSource = useMemo(
    () =>
      filterSimpleMasterRows(
        allRows,
        searchTerm
      ),
    [allRows, searchTerm]
  );




  // CLOSE DRAWER

  const closeDrawer = () => {
    setDrawerOpen(false);

    setSelectedRow(null);

    setViewMode(false);

    form.resetFields();
  };




  // CRUD

  const {
    handleDelete,
    handleSave: saveMaster,
  } = useSimpleMasterCrud({
    selectedRow,
    entityName,
    idKey,
    saveMutation,
    updateMutation,
    deleteMutation,
    buildPayload,
    buildFormValues,
    buildDeletePayload,
    closeDrawer,

    onDeleted: (record) =>
      setDeletedRowIds(
        (current) => [
          ...current,
          record.id,
        ]
      ),
  });

  const handleSave = (values: any) => {
    const trimmedValues = trimFormValues(values);

    const duplicateName = allRows.find((row) =>
      normalizeCompareText(row.id) !== normalizeCompareText(selectedRow?.id) &&
      normalizeCompareText(row.name) === normalizeCompareText(trimmedValues.name)
    );

    const duplicateShortName = validateShortName
      ? allRows.find((row) =>
          normalizeCompareText(row.id) !== normalizeCompareText(selectedRow?.id) &&
          normalizeCompareText(row.shortName) === normalizeCompareText(trimmedValues.shortName)
        )
      : undefined;

    if (duplicateName) {
      form.setFields([{ name: 'name', errors: [`${nameColumnTitle} already exists`] }]);

      form.scrollToField('name', { focus: true });

      message.error(`${nameColumnTitle} already exists`);

      return;
    }

    if (duplicateShortName) {
      form.setFields([{ name: 'shortName', errors: ['Short Name already exists'] }]);

      form.scrollToField('shortName', { focus: true });

      message.error('Short Name already exists');

      return;
    }

    form.setFieldsValue(trimmedValues);

    saveMaster(trimmedValues);
  };




  // OPEN DRAWER

  const openDrawer = (
    row?: SimpleMasterRow,
    readonly = false
  ) => {
    if (
      row &&
      deletedRowIds.includes(row.id)
    )
      return;

    setSelectedRow(row ?? null);

    setViewMode(readonly);

    form.setFieldsValue(
      buildFormValues(row)
    );

    setDrawerOpen(true);
  };

  const showRestrictedMessage = () => {
    if (restrictedMessage) {
      message.error(restrictedMessage);
    }
  };

  const handleTableChange = (
    page: number,
    size: number
  ) => {
    setCurrentPage(page);
    setPageSize(size);
  };




  // TABLE COLUMNS

  const columns = [

    {
      title: 'Srl',

      dataIndex: 'srl',

      key: 'srl',

      width: 60,
    },



    {
      title: nameColumnTitle,

      dataIndex: 'name',

      key: 'name',
    },



    ...(hasShortName
      ? [
          {
            title: 'Short Name',

            dataIndex: 'shortName',

            key: 'shortName',
          },
        ]
      : []),



    // EXTRA COLUMNS

    ...extraColumns,




    {
      title: 'Active',

      dataIndex: 'active',

      key: 'active',

      width: 90,

      render: (
        active: boolean,
        record: SimpleMasterRow
      ) => (
        <Switch
          checked={active}

          size="small"

          disabled={disableToggle?.(record)}

          onClick={(
            _,
            event
          ) =>
            event.stopPropagation()
          }

          onChange={(
            checked,
            event
          ) => {

            event.stopPropagation();

            if (disableToggle?.(record)) {
              showRestrictedMessage();

              return;
            }

            handleActiveChange(
              checked,
              record
            );
          }}
        />
      ),
    },



    {
      title: 'Edit',

      key: 'edit',

      width: 80,

      render: (
        _: unknown,
        record: SimpleMasterRow
      ) => (
        <Button
          type="text"

          icon={<EditOutlined />}

          disabled={disableEdit?.(record)}

          onClick={(event) => {

            event.stopPropagation();

            if (disableEdit?.(record)) {
              showRestrictedMessage();

              return;
            }

            openDrawer(
              record,
              false
            );
          }}
        />
      ),
    },



    {
      title: 'Delete',

      key: 'delete',

      width: 90,

      render: (
        _: unknown,
        record: SimpleMasterRow
      ) => (
        <Button
          type="text"

          danger

          icon={<DeleteOutlined />}

          disabled={disableDelete?.(record)}

          onClick={(event) => {

            event.stopPropagation();

            if (disableDelete?.(record)) {
              showRestrictedMessage();

              return;
            }

            handleDelete(
              event,
              record
            );
          }}
        />
      ),
    },
  ];



  const handleActiveChange = (
    checked: boolean,
    record: SimpleMasterRow
  ) => {

    if (!updateMutation) return;

    const overrideKey = String(record.id);
    const previousActive = record.active;

    setActiveOverrides((current) => ({
      ...current,
      [overrideKey]: checked,
    }));

    updateMutation(
      {
        ...getSessionPayload(),

        ...buildPayload(
          {
            ...buildFormValues(record),

            active: checked,
          },
          record
        ),
      },

      {
        onSuccess: (
          response
        ) => {
          if (
            !isApiSuccess(response)
          ) {
            setActiveOverrides((current) => ({
              ...current,
              [overrideKey]: previousActive,
            }));

            message.error(
              getApiMessage(
                response,
                `Failed to update ${entityName.toLowerCase()}`
              )
            );

            return;
          }

          message.success(
            `${entityName} updated successfully`
          );
        },

        onError: (error) => {
          setActiveOverrides((current) => ({
            ...current,
            [overrideKey]: previousActive,
          }));

          message.error(
            getApiMessage(
              error,
              `Failed to update ${entityName.toLowerCase()}`
            )
          );
        },
      }
    );
  };




  return (
    <div className="h-full min-h-0 bg-white p-6 flex flex-col">

      {/* HEADER */}

      <div className="flex items-start justify-between gap-4 mb-4 shrink-0">

        <h1 className="text-xl font-semibold text-slate-900">
          {title}
        </h1>

        <div className="flex items-center gap-2">

          <Input
            allowClear
            prefix={
              <SearchOutlined className="text-slate-400" />
            }
            placeholder="Search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            className="w-72"
          />



          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="h-9 bg-emerald-500 border-emerald-500 px-5 font-medium hover:!bg-emerald-600"
            onClick={() =>
              openDrawer(
                undefined,
                false
              )
            }
          >
            Add New
          </Button>

        </div>
      </div>





      {/* TABLE */}

      <div className="flex-1 min-h-0 overflow-hidden">

        <AntTable
          columns={columns}
          dataSource={dataSource}
          loading={isLoading}
          locale={{
            emptyText: isError ? (
              <Empty
                description={`Unable to fetch ${entityName.toLowerCase()} from API`}
              />
            ) : (
              <Empty
                description={`No ${entityName.toLowerCase()} found`}
              />
            ),
          }}
          onRow={(record) => ({
            onClick: () =>
              openDrawer(
                record,
                true
              ),

            className:
              'cursor-pointer hover:bg-slate-50 transition-colors',
          })}
          paginationProps={{
            current: currentPage,

            pageSize,

            total: getTotalCount(
              data,
              dataSource.length
            ),

            onChange:
              handleTableChange,

            onShowSizeChange:
              handleTableChange,
          }}
        />

      </div>





      {/* DRAWER */}

      <SimpleMasterDrawer
        open={drawerOpen}
        title={title}
        description={drawerDescription}
        viewMode={viewMode}
        form={form}
        activeValue={activeValue}
        selectedRow={selectedRow}
        isSaving={isSaving}
        onClose={closeDrawer}
        onEdit={() => setViewMode(false)}
        onDelete={handleDelete}
        onSave={handleSave}
        hasShortName={hasShortName}
        showNameField={showNameField}
        showDescription={showDescription}
        requiredFields={requiredFields}
        editDisabled={
          selectedRow
            ? disableEdit?.(selectedRow)
            : false
        }
        deleteDisabled={
          selectedRow
            ? disableDelete?.(selectedRow)
            : false
        }
        activeDisabled={
          selectedRow
            ? disableToggle?.(selectedRow)
            : false
        }
        renderExtraFields={
          renderExtraFields
        }
      />
    </div>
  );
};

export default SimpleMasterList;
