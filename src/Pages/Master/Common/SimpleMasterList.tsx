import { useMemo, useState } from 'react';
import type React from 'react';
import { Button, Empty, Form, Input, Switch } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { UseMutateFunction } from '@tanstack/react-query';
import AntTable from '../../../ui/Table/AntTable';
import SimpleMasterDrawer from './SimpleMasterDrawer';
import { useSimpleMasterCrud } from './useSimpleMasterCrud';
import {
  buildSimpleMasterFormValues,
  extractList,
  filterSimpleMasterRows,
  getSessionPayload,
  getTotalCount,
} from './SimpleMasterUtils';
import type { SimpleMasterRow } from './SimpleMasterUtils';

type SimpleMasterListProps = {
  title: string;
  entityName: string;
  nameColumnTitle: string;
  drawerDescription: string;
  idKey: string;
  useListQuery: (payload: any) => { data?: any; isLoading: boolean; isError: boolean };
  saveMutation: UseMutateFunction<any, Error, any, unknown>;
  updateMutation?: UseMutateFunction<any, Error, any, unknown>;
  deleteMutation: UseMutateFunction<any, Error, any, unknown>;
  isSaving?: boolean;
  mapRow: (item: any, index: number) => SimpleMasterRow;
  buildPayload: (values: any, selectedRow: SimpleMasterRow | null) => any;
  filterRawItem?: (item: any) => boolean;
  buildFormValues?: (row?: SimpleMasterRow | null) => any;
  renderExtraFields?: (options: { viewMode: boolean; form: ReturnType<typeof Form.useForm>[0] }) => React.ReactNode;
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
  filterRawItem = (item) => item?.bCancelled !== true,
  buildFormValues = buildSimpleMasterFormValues,
  renderExtraFields,
}: SimpleMasterListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [selectedRow, setSelectedRow] = useState<SimpleMasterRow | null>(null);
  const [form] = Form.useForm();
  const activeValue = Form.useWatch('active', form);

  const payload = useMemo(() => ({
    ...getSessionPayload(),
    pageNumber: currentPage,
    pageSize,
  }), [currentPage, pageSize]);

  const { data, isLoading, isError } = useListQuery(payload);

  const dataSource = useMemo(
    () => filterSimpleMasterRows(
      extractList(data)
        .filter(filterRawItem)
        .map(mapRow),
      searchTerm,
    ),
    [data, filterRawItem, mapRow, searchTerm],
  );

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedRow(null);
    setViewMode(false);
    form.resetFields();
  };

  const { handleDelete, handleSave } = useSimpleMasterCrud({
    selectedRow,
    entityName,
    idKey,
    saveMutation,
    updateMutation,
    deleteMutation,
    buildPayload,
    closeDrawer,
  });

  const openDrawer = (row?: SimpleMasterRow, readonly = false) => {
    setSelectedRow(row ?? null);
    setViewMode(readonly);
    form.setFieldsValue(buildFormValues(row));
    setDrawerOpen(true);
  };

  const handleTableChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const columns = [
    { title: 'Srl', dataIndex: 'srl', key: 'srl', width: 60 },
    { title: nameColumnTitle, dataIndex: 'name', key: 'name' },
    { title: 'Short Name', dataIndex: 'shortName', key: 'shortName' },
    {
      title: 'Active',
      dataIndex: 'active',
      key: 'active',
      width: 90,
      render: (active: boolean) => <Switch checked={active} size="small" className="pointer-events-none" />,
    },
    {
      title: 'Edit',
      key: 'edit',
      width: 80,
      render: (_: unknown, record: SimpleMasterRow) => (
        <Button type="text" icon={<EditOutlined />} onClick={(event) => {
          event.stopPropagation();
          openDrawer(record, false);
        }} />
      ),
    },
    {
      title: 'Delete',
      key: 'delete',
      width: 90,
      render: (_: unknown, record: SimpleMasterRow) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={(event) => handleDelete(event, record)} />
      ),
    },
  ];

  return (
    <div className="h-full min-h-0 bg-white p-6 flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-4 shrink-0">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <div className="flex items-center gap-2">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-72"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="h-9 bg-emerald-500 border-emerald-500 px-5 font-medium hover:!bg-emerald-600"
            onClick={() => openDrawer(undefined, false)}
          >
            Add New
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <AntTable
          columns={columns}
          dataSource={dataSource}
          loading={isLoading}
          locale={{ emptyText: isError ? <Empty description={`Unable to fetch ${entityName.toLowerCase()} from API`} /> : <Empty description={`No ${entityName.toLowerCase()} found`} /> }}
          onRow={(record) => ({ onClick: () => openDrawer(record, true), className: 'cursor-pointer hover:bg-slate-50 transition-colors' })}
          paginationProps={{ current: currentPage, pageSize, total: getTotalCount(data, dataSource.length), onChange: handleTableChange, onShowSizeChange: handleTableChange }}
        />
      </div>

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
        renderExtraFields={renderExtraFields}
      />
    </div>
  );
};

export default SimpleMasterList;
