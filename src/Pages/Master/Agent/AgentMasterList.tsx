import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { Button, Empty, Form, Input, Switch, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import AntTable from '../../../ui/Table/AntTable';
import { useDeleteAgent, useGetAgentDetails, useGetAgentDropdown, useGetAgents, useGetReportToAgents, useSaveAgent, useUpdateAgent } from './Hooks';
import AgentMasterDrawer from './AgentMasterDrawer';
import { useAgentCrud } from './useAgentCrud';
import { useGetGroupDropdown } from '../AgentGroup/Hooks';
import {
  buildAgentFormValues,
  buildAgentPayload,
  extractFirstRecord,
  extractAgentList,
  extractGenericList,
  extractNamedList,
  filterAgents,
  getApiMessage,
  getSessionPayload,
  getTotalCount,
  isCancelledAgent,
  isApiSuccess,
  makeOption,
  makeUserTypeOption,
  mapAgentRow,
  normalizeCompareText,
  uniqueOptions,
} from './Utils';
import type { AgentRow } from './Utils';

const AgentMasterList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentRow | null>(null);
  const [deletedAgentIds, setDeletedAgentIds] = useState<Array<string | number>>([]);
  const [activeOverrides, setActiveOverrides] = useState<Record<string, boolean>>({});
  const [form] = Form.useForm();
  const activeValue = Form.useWatch('active', form);

  const payload = useMemo(() => ({
    ...getSessionPayload(),
    pageNumber: currentPage,
    pageSize,
  }), [currentPage, pageSize]);

  const { data: agentsData, isLoading, isError } = useGetAgents(payload);
  const { data: agentDropdownData } = useGetAgentDropdown(payload);
  const { data: reportToAgentsData } = useGetReportToAgents(payload);
  const { data: groupsData } = useGetGroupDropdown(payload);
  const { data: agentDetailsData } = useGetAgentDetails({
    ...payload,
    nAgentId: selectedAgent?.id,
  });
  const { mutate: saveAgent, isPending: isSaving } = useSaveAgent();
  const { mutate: updateAgent, isPending: isUpdating } = useUpdateAgent();
  const { mutate: deleteAgent } = useDeleteAgent();

  const dataSource = useMemo(
    () => filterAgents(
      extractAgentList(agentsData)
        .filter((agent) => !isCancelledAgent(agent))
        .map(mapAgentRow)
        .map((agent) => ({
          ...agent,
          active: activeOverrides[String(agent.id)] ?? agent.active,
        }))
        .filter((agent) => !deletedAgentIds.includes(agent.id)),
      searchTerm,
    ),
    [activeOverrides, agentsData, deletedAgentIds, searchTerm],
  );

  const allAgentRows = useMemo(
    () => extractAgentList(agentsData).filter((agent) => !isCancelledAgent(agent)).map(mapAgentRow),
    [agentsData],
  );

  const userTypeOptions = useMemo(() => {
    const backendTypes = extractNamedList(agentDropdownData, [
      'userTypeList',
      'userTypes',
      'typeList',
      'agentTypeList',
      'agentTypes',
      'userRoleList',
      'roleList',
    ]);
    const typeSource = backendTypes.length ? backendTypes : extractAgentList(agentsData);

    return uniqueOptions(typeSource.map(makeUserTypeOption));
  }, [agentDropdownData, agentsData]);

  const reportToOptions = useMemo(
    () => uniqueOptions(extractGenericList(reportToAgentsData).map((agent) => makeOption(
      agent,
      ['nAgentId', 'agentId', 'id', 'nUserId'],
      ['cAgentName', 'agentName', 'cName', 'name'],
    ))),
    [reportToAgentsData],
  );

  const groupOptions = useMemo(() => {
    const groupSource = [
      ...extractGenericList(groupsData),
      ...extractNamedList(agentDropdownData, [
        'groupList',
        'groups',
        'agentGroupList',
        'agentGroups',
        'agentGroupDropDown',
        'agentGroupDropdown',
        'groupDropDown',
        'groupDropdown',
      ]),
    ];

    return uniqueOptions(groupSource.map((group) => makeOption(
      group,
      ['nGroupId', 'nAgentGroupId', 'id', 'value'],
      ['cGroupName', 'cAgentGroupName', 'groupName', 'agentGroupName', 'name', 'label'],
    )));
  }, [agentDropdownData, groupsData]);

  useEffect(() => {
    if (!drawerOpen || !selectedAgent || !agentDetailsData) return;

    const details = extractFirstRecord(agentDetailsData);
    form.setFieldsValue(buildAgentFormValues(mapAgentRow(details, selectedAgent.srl - 1)));
  }, [agentDetailsData, drawerOpen, form, selectedAgent]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedAgent(null);
    setViewMode(false);
    form.resetFields();
  };

  const { handleDelete, handleSave } = useAgentCrud({
    selectedAgent,
    saveAgent,
    updateAgent,
    deleteAgent,
    closeDrawer,
    onDeleted: (record) => setDeletedAgentIds((current) => [...current, record.id]),
  });

  const openDrawer = (agent?: AgentRow, readonly = false) => {
    if (agent && deletedAgentIds.includes(agent.id)) return;

    setSelectedAgent(agent ?? null);
    setViewMode(readonly);
    form.setFieldsValue(buildAgentFormValues(agent));
    setDrawerOpen(true);
  };

  const handleTableChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  const handleActiveChange = (checked: boolean, record: AgentRow) => {
    const overrideKey = String(record.id);
    const previousActive = record.active;

    setActiveOverrides((current) => ({
      ...current,
      [overrideKey]: checked,
    }));

    updateAgent(buildAgentPayload({ ...buildAgentFormValues(record), active: checked }, record), {
      onSuccess: (response) => {
        if (!isApiSuccess(response)) {
          setActiveOverrides((current) => ({
            ...current,
            [overrideKey]: previousActive,
          }));

          message.error(getApiMessage(response, 'Failed to update agent'));
          return;
        }

        message.success('Agent updated successfully');
      },
      onError: (error) => {
        setActiveOverrides((current) => ({
          ...current,
          [overrideKey]: previousActive,
        }));

        message.error(getApiMessage(error, 'Failed to update agent'));
      },
    });
  };

  const handleAgentSave = (values: any) => {
    const duplicateShortName = allAgentRows.find((agent) =>
      normalizeCompareText(agent.id) !== normalizeCompareText(selectedAgent?.id) &&
      normalizeCompareText(agent.shortName) === normalizeCompareText(values.agentShortName),
    );
    const duplicateUsername = allAgentRows.find((agent) =>
      normalizeCompareText(agent.id) !== normalizeCompareText(selectedAgent?.id) &&
      normalizeCompareText(agent.username) === normalizeCompareText(values.username),
    );
    const usernameChanged =
      selectedAgent &&
      normalizeCompareText(selectedAgent.username) !== normalizeCompareText(values.username);

    if (duplicateShortName) {
      form.setFields([{ name: 'agentShortName', errors: ['Short Name already exists'] }]);
      form.scrollToField('agentShortName', { focus: true });
      message.error('Short Name already exists');
      return;
    }

    if (duplicateUsername) {
      form.setFields([{ name: 'username', errors: ['Username already exists'] }]);
      form.scrollToField('username', { focus: true });
      message.error('Username already exists');
      return;
    }

    if (usernameChanged && !String(values.password ?? '').trim()) {
      form.setFields([{ name: 'password', errors: ['Password is required when changing username'] }]);
      form.scrollToField('password', { focus: true });
      message.error('Password is required when changing username');
      return;
    }

    handleSave(values);
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
      render: (active: boolean, record: AgentRow) => (
        <Switch
          checked={active}
          size="small"
          onClick={(_, event) => event.stopPropagation()}
          onChange={(checked, event) => {
            event.stopPropagation();
            handleActiveChange(checked, record);
          }}
        />
      ),
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
        isSaving={isSaving || isUpdating}
        reportToOptions={reportToOptions}
        userTypeOptions={userTypeOptions}
        groupOptions={groupOptions}
        onClose={closeDrawer}
        onEdit={() => setViewMode(false)}
        onDelete={handleDelete}
        onSave={handleAgentSave}
      />
    </div>
  );
};

export default AgentMasterList;
