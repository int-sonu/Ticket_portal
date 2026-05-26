import { useMemo, useState } from 'react';
import type React from 'react';
import { Button, Empty, Form, Input, Switch } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import AntTable from '../../../ui/Table/AntTable';
import { useDeleteAgent, useGetAgents, useSaveAgent } from './Hooks';
import AgentMasterDrawer from './AgentMasterDrawer';
import { useAgentCrud } from './useAgentCrud';
import {
  buildAgentFormValues,
  extractAgentList,
  filterAgents,
  getSessionPayload,
  getTotalCount,
  mapAgentRow,
} from './Utils';
import type { AgentRow } from './Utils';

const AgentMasterList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentRow | null>(null);
  const [form] = Form.useForm();
  const activeValue = Form.useWatch('active', form);

  const payload = useMemo(() => ({
    ...getSessionPayload(),
    pageNumber: currentPage,
    pageSize,
  }), [currentPage, pageSize]);

  const { data: agentsData, isLoading, isError } = useGetAgents(payload);
  const { mutate: saveAgent, isPending: isSaving } = useSaveAgent();
  const { mutate: deleteAgent } = useDeleteAgent();

  const dataSource = useMemo(
    () => filterAgents(extractAgentList(agentsData).map(mapAgentRow), searchTerm),
    [agentsData, searchTerm],
  );

  const userTypeOptions = useMemo(
    () => Array.from(new Set(dataSource.map((agent) => agent.userType).filter(Boolean))).map((type) => ({
      label: type,
      value: type,
    })),
    [dataSource],
  );

  const groupOptions = useMemo(
    () => Array.from(new Set(dataSource.map((agent) => agent.groupName).filter(Boolean))).map((group) => ({
      label: group,
      value: group,
    })),
    [dataSource],
  );

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedAgent(null);
    setViewMode(false);
    form.resetFields();
  };

  const { handleDelete, handleSave } = useAgentCrud({
    selectedAgent,
    saveAgent,
    deleteAgent,
    closeDrawer,
  });

  const openDrawer = (agent?: AgentRow, readonly = false) => {
    setSelectedAgent(agent ?? null);
    setViewMode(readonly);
    form.setFieldsValue(buildAgentFormValues(agent));
    setDrawerOpen(true);
  };

  const handleTableChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const columns = [
    { title: 'Srl', dataIndex: 'srl', key: 'srl', width: 60 },
    { title: 'Agent Name', dataIndex: 'name', key: 'name' },
    { title: 'Short Name', dataIndex: 'shortName', key: 'shortName' },
    { title: 'User Type', dataIndex: 'userType', key: 'userType' },
    { title: 'Agent Group', dataIndex: 'groupName', key: 'groupName' },
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
      render: (_: unknown, record: AgentRow) => (
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
      render: (_: unknown, record: AgentRow) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={(event) => handleDelete(event, record)} />
      ),
    },
  ];

  return (
    <div className="h-full min-h-0 bg-white p-6 flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-4 shrink-0">
        <h1 className="text-xl font-semibold text-slate-900">Agent Master</h1>
        <div className="flex items-center gap-2">
          <Input allowClear prefix={<SearchOutlined className="text-slate-400" />} placeholder="Search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-72" />
          <Button type="primary" icon={<PlusOutlined />} className="h-9 bg-emerald-500 border-emerald-500 px-5 font-medium hover:!bg-emerald-600" onClick={() => openDrawer(undefined, false)}>
            Add New
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <AntTable
          columns={columns}
          dataSource={dataSource}
          loading={isLoading}
          locale={{ emptyText: isError ? <Empty description="Unable to fetch agents from API" /> : <Empty description="No agents found" /> }}
          onRow={(record) => ({ onClick: () => openDrawer(record, true), className: 'cursor-pointer hover:bg-slate-50 transition-colors' })}
          paginationProps={{ current: currentPage, pageSize, total: getTotalCount(agentsData, dataSource.length), onChange: handleTableChange, onShowSizeChange: handleTableChange }}
        />
      </div>

      <AgentMasterDrawer
        open={drawerOpen}
        viewMode={viewMode}
        form={form}
        activeValue={activeValue}
        selectedAgent={selectedAgent}
        isSaving={isSaving}
        agents={dataSource}
        userTypeOptions={userTypeOptions}
        groupOptions={groupOptions}
        onClose={closeDrawer}
        onEdit={() => setViewMode(false)}
        onDelete={handleDelete}
        onSave={handleSave}
      />
    </div>
  );
};

export default AgentMasterList;
