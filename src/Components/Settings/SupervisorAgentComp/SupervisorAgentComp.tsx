/* eslint-disable @typescript-eslint/no-explicit-any -- Supervisor API shapes vary between tenant versions. */
import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Checkbox,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Select,
  Spin,
  message,
} from "antd";
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import { settingsApis } from "../../../Axios/SettingsApi";
import { getRequestPayload } from "../../../Utils/requestPayload";
import {
  getApiMessage,
  isApiSuccess,
  toBooleanValue,
} from "../../../Pages/Master/Common/SimpleMasterUtils";
import TicketModulePagination from "../../../Pages/Ticket/Common/TicketModulePagination";

type ApiRow = Record<string, any>;

type SupervisorRow = {
  id: number;
  linkId: number;
  name: string;
  linkedCount: number;
  raw: ApiRow;
};

type AgentRow = {
  id: number;
  name: string;
  department: string;
  selected: boolean;
  raw: ApiRow;
};

const firstValue = (record: ApiRow, keys: string[], fallback: any = undefined) => {
  const key = Object.keys(record || {}).find((item) =>
    keys.some((candidate) => candidate.toLowerCase() === item.toLowerCase()),
  );
  return key ? record[key] : fallback;
};

const extractApiList = (response: any): ApiRow[] => {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
    response?.result,
    response?.items,
    response?.list,
    response?.message,
    response?.supervisorList,
    response?.supervisorLinkedList,
    response?.linkingAgentList,
    response?.agentList,
    response?.linkedAgentList,
    response?.supervisorAgentList,
    response?.data?.result,
    response?.data?.items,
    response?.data?.list,
    response?.data?.message,
    response?.data?.supervisorList,
    response?.data?.supervisorLinkedList,
    response?.data?.linkingAgentList,
    response?.data?.agentList,
    response?.data?.linkedAgentList,
    response?.data?.supervisorAgentList,
  ];
  const directList = candidates.find(Array.isArray);
  if (directList) return directList;

  const queue: Array<{ value: unknown; depth: number }> = [{ value: response, depth: 0 }];
  const visited = new Set<unknown>();
  while (queue.length) {
    const current = queue.shift();
    if (!current || current.depth > 4 || !current.value || typeof current.value !== "object") continue;
    if (visited.has(current.value)) continue;
    visited.add(current.value);
    for (const value of Object.values(current.value as Record<string, unknown>)) {
      if (Array.isArray(value)) return value as ApiRow[];
      if (value && typeof value === "object") {
        queue.push({ value, depth: current.depth + 1 });
      }
    }
  }
  return [];
};

const getLinkedAgentCount = (item: ApiRow) => {
  const value = firstValue(item, [
    "nLinkedAgentCount",
    "nLinkedAgentsCount",
    "nLinkedCount",
    "nLinkCount",
    "linkedAgentCount",
    "linkedCount",
    "nAgentCount",
    "agentCount",
    "nCount",
    "count",
  ]);
  if (value !== undefined && value !== null && value !== "") return Number(value) || 0;

  const linkedAgents = firstValue(item, [
    "lAgentList",
    "agentList",
    "linkedAgentList",
    "supervisorAgentList",
    "lSupervisorLinking",
  ]);
  if (Array.isArray(linkedAgents)) return linkedAgents.length;

  const agentIds = firstValue(item, ["cAgentIds", "agentIds"]);
  if (typeof agentIds === "string") {
    return agentIds.split(",").filter((id) => id.trim()).length;
  }
  return 0;
};

const mapSupervisor = (item: ApiRow): SupervisorRow => ({
  id: Number(firstValue(item, ["nSupervisorId", "nSupervisorid", "supervisorId", "nSupervisor", "nAgentId", "id"], 0)),
  linkId: Number(firstValue(item, ["nLinkedId", "nLinkId", "linkedId", "linkId"], 0)),
  name: String(firstValue(item, ["cSupervisorName", "supervisorName", "cAgentName", "agentName", "cName", "name"], "")),
  linkedCount: getLinkedAgentCount(item),
  raw: item,
});

const mapAgent = (item: ApiRow): AgentRow => ({
  id: Number(firstValue(item, ["nAgentId", "nAgentid", "nLinkedAgentId", "agentId", "id"], 0)),
  name: String(firstValue(item, ["cAgentName", "agentName", "cName", "name"], "")),
  department: String(firstValue(item, ["cDepartmentName", "departmentName", "cDepartment", "department", "cGroupName"], "")),
  selected: toBooleanValue(firstValue(item, ["bLinked", "bSelected", "bChecked", "isLinked", "selected"], false)),
  raw: item,
});

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || "A";

const normalizeAgentText = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();

const deduplicateAgents = (agents: AgentRow[]) => {
  const uniqueAgents = new Map<string, AgentRow>();
  agents.forEach((agent) => {
    const nameKey = normalizeAgentText(agent.name);
    const departmentKey = normalizeAgentText(agent.department);
    const key = nameKey ? `${nameKey}|${departmentKey}` : `id:${agent.id}`;
    const existing = uniqueAgents.get(key);
    if (!existing || (agent.selected && !existing.selected)) {
      uniqueAgents.set(key, agent);
      return;
    }
    if (existing.selected !== agent.selected) {
      uniqueAgents.set(key, { ...existing, selected: true });
    }
  });
  return [...uniqueAgents.values()];
};

const fetchSupervisorPage = async (payload: ApiRow) => {
  const [supervisorResponse, linkedResponse] = await Promise.all([
    settingsApis.supervisorList(payload),
    settingsApis.supervisorLinkedList(payload),
  ]);
  return {
    supervisors: extractApiList(supervisorResponse).map(mapSupervisor).filter((item) => item.id),
    linkedRows: extractApiList(linkedResponse).map(mapSupervisor).filter((item) => item.id),
  };
};

const SupervisorAgentComp = () => {
  const basePayload = useMemo(() => getRequestPayload(), []);
  const [supervisors, setSupervisors] = useState<SupervisorRow[]>([]);
  const [linkedRows, setLinkedRows] = useState<SupervisorRow[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<number | undefined>();
  const [selectedRow, setSelectedRow] = useState<SupervisorRow | null>(null);
  const [search, setSearch] = useState("");
  const [agentSearch, setAgentSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAgentsLoading, setIsAgentsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadPage = async () => {
    setIsLoading(true);
    try {
      const result = await fetchSupervisorPage(basePayload);
      setSupervisors(result.supervisors);
      setLinkedRows(result.linkedRows);
    } catch (error) {
      message.error(getApiMessage(error, "Unable to load supervisor linking details."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void fetchSupervisorPage(basePayload)
      .then((result) => {
        if (!active) return;
        setSupervisors(result.supervisors);
        setLinkedRows(result.linkedRows);
      })
      .catch((error) => {
        if (active) message.error(getApiMessage(error, "Unable to load supervisor linking details."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [basePayload]);

  const loadAgents = async (supervisorId: number) => {
    setIsAgentsLoading(true);
    try {
      const detailPayload = {
        ...basePayload,
        nSupervisorId: supervisorId,
      };
      const [agentResponse, linkedResponse] = await Promise.all([
        settingsApis.linkingAgentList(detailPayload),
        settingsApis.supervisorLinkedList(detailPayload),
      ]);
      const nextAgents = extractApiList(agentResponse).map(mapAgent).filter((item) => item.id);
      const linkedAgents = extractApiList(linkedResponse).map(mapAgent).filter((item) => item.id);
      const uniqueAgents = deduplicateAgents(nextAgents);
      const linkedIdsFromFlags = uniqueAgents.filter((item) => item.selected).map((item) => item.id);
      const linkedIdsFromDetails = linkedAgents
        .map((item) => item.id)
        .filter((id) => uniqueAgents.some((agent) => agent.id === id));
      const nextSelectedIds = linkedIdsFromFlags.length
        ? linkedIdsFromFlags
        : linkedIdsFromDetails;

      setAgents(uniqueAgents);
      setSelectedAgentIds(nextSelectedIds);
    } catch (error) {
      setAgents([]);
      setSelectedAgentIds([]);
      message.error(getApiMessage(error, "Unable to load agents."));
    } finally {
      setIsAgentsLoading(false);
    }
  };

  const openDrawer = (row?: SupervisorRow, readonly = false) => {
    const matchingSupervisor = row
      ? supervisors.find((supervisor) => supervisor.id === row.id) ??
        supervisors.find(
          (supervisor) => normalizeAgentText(supervisor.name) === normalizeAgentText(row.name),
        )
      : undefined;
    const supervisorId = matchingSupervisor?.id ?? row?.id;
    setSelectedRow(row ?? null);
    setSelectedSupervisorId(supervisorId);
    setAgents([]);
    setSelectedAgentIds([]);
    setAgentSearch("");
    setViewMode(readonly);
    setDrawerOpen(true);
    if (supervisorId) void loadAgents(supervisorId);
  };

  const handleSupervisorChange = (supervisorId: number) => {
    setSelectedSupervisorId(supervisorId);
    setSelectedAgentIds([]);
    void loadAgents(supervisorId);
  };

  const buildSavePayload = (cancelled = false) => {
    const agentIds = cancelled ? [] : selectedAgentIds;
    return {
      cSchemaName: basePayload.cSchemaName,
      cDbName: basePayload.cDbName,
      nCompanyId: basePayload.nCompanyId,
      cAgentIds: [...new Set(agentIds)].join(","),
      nCreatedBy: basePayload.id ?? basePayload.nAgentId ?? 0,
      nSupervisorId: selectedSupervisorId ?? selectedRow?.id ?? 0,
      nLinkId:
        selectedRow?.linkId ??
        Number(firstValue(agents[0]?.raw ?? {}, ["nLinkId", "nLinkedId"], 0)),
    };
  };

  const saveLinking = async () => {
    if (!selectedSupervisorId) {
      message.warning("Please select a supervisor.");
      return;
    }
    if (!selectedAgentIds.length) {
      message.warning("Please select at least one agent.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await settingsApis.supervisorLinkingSave(buildSavePayload());
      if (!isApiSuccess(response)) throw new Error(getApiMessage(response, "Unable to save supervisor linking."));
      message.success("Supervisor linking saved successfully.");
      setDrawerOpen(false);
      await loadPage();
    } catch (error) {
      message.error(getApiMessage(error, "Unable to save supervisor linking."));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLinking = async (row: SupervisorRow) => {
    setSelectedRow(row);
    setSelectedSupervisorId(row.id);
    setIsSaving(true);
    try {
      const response = await settingsApis.supervisorLinkedListDelete({
        cSchemaName: basePayload.cSchemaName,
        cDbName: basePayload.cDbName,
        nCompanyId: basePayload.nCompanyId,
        nLinkId: row.linkId,
        nModifiedBy: basePayload.id ?? basePayload.nAgentId ?? 0,
      });
      if (!isApiSuccess(response)) throw new Error(getApiMessage(response, "Unable to delete supervisor linking."));
      message.success("Supervisor linking deleted successfully.");
      setDrawerOpen(false);
      await loadPage();
    } catch (error) {
      message.error(getApiMessage(error, "Unable to delete supervisor linking."));
    } finally {
      setIsSaving(false);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredRows = linkedRows.filter((row) =>
    !normalizedSearch || row.name.toLowerCase().includes(normalizedSearch),
  );
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const normalizedAgentSearch = agentSearch.trim().toLowerCase();
  const selectedSupervisorName =
    supervisors.find((supervisor) => supervisor.id === selectedSupervisorId)?.name ??
    selectedRow?.name ??
    "";
  const filteredAgents = agents.filter((agent) => {
    if (
      agent.id === selectedSupervisorId ||
      (selectedSupervisorName &&
        normalizeAgentText(agent.name) === normalizeAgentText(selectedSupervisorName))
    ) {
      return false;
    }
    if (viewMode && !selectedAgentIds.includes(agent.id)) return false;
    return !normalizedAgentSearch || `${agent.name} ${agent.department}`.toLowerCase().includes(normalizedAgentSearch);
  });
  const supervisorOptions = supervisors.map((item) => ({ value: item.id, label: item.name }));
  if (
    selectedSupervisorId &&
    selectedRow?.name &&
    !supervisorOptions.some((option) => option.value === selectedSupervisorId)
  ) {
    supervisorOptions.unshift({ value: selectedSupervisorId, label: selectedRow.name });
  }

  return (
    <div className="flex h-[calc(100vh-92px)] min-h-0 flex-col bg-white py-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <h1 className="m-0 text-[20px] font-medium text-slate-950">Supervisor Agent Linking</h1>
        <div className="flex items-center gap-2">
          <Input allowClear prefix={<SearchOutlined />} placeholder="Search" value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} className="w-[225px]" />
          <Button type="primary" className="bg-emerald-500" onClick={() => openDrawer()}>Add New</Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid min-w-[650px] grid-cols-[48px_1fr_1fr_48px_60px] border-b border-slate-200 px-2 py-3 text-[12px] font-medium text-slate-900">
          <span>Srl</span><span>Supervisor</span><span>Linked Agent Count</span><span>Edit</span><span>Delete</span>
        </div>
        <Spin spinning={isLoading}>
          {pageRows.length ? pageRows.map((row, index) => (
            <div key={row.id} role="button" tabIndex={0} onClick={() => openDrawer(row, true)} onKeyDown={(event) => { if (event.key === "Enter") openDrawer(row, true); }} className="grid min-w-[650px] grid-cols-[48px_1fr_1fr_48px_60px] items-center border-b border-slate-100 px-2 py-4 text-[12px] text-slate-800 hover:bg-slate-50">
              <span>{(currentPage - 1) * pageSize + index + 1}</span>
              <span>{row.name || "-"}</span>
              <span>{row.linkedCount}</span>
              <Button type="text" size="small" aria-label={`Edit ${row.name}`} icon={<EditOutlined />} onClick={(event) => { event.stopPropagation(); openDrawer(row); }} />
              <Popconfirm title="Delete this supervisor linking?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => void deleteLinking(row)}>
                <Button danger type="text" size="small" aria-label={`Delete ${row.name}`} icon={<DeleteOutlined />} onClick={(event) => event.stopPropagation()} />
              </Popconfirm>
            </div>
          )) : !isLoading ? <Empty className="mt-20" description="No supervisor linking found" /> : null}
        </Spin>
      </div>

      <TicketModulePagination elevated={false} current={currentPage} pageSize={pageSize} total={filteredRows.length} onChange={(page, size) => { setCurrentPage(page); setPageSize(size); }} onShowSizeChange={(page, size) => { setCurrentPage(page); setPageSize(size); }} />

      <Modal open={drawerOpen} width={450} centered closable={false} footer={null} onCancel={() => setDrawerOpen(false)} styles={{ body: { padding: 0 } }}>
        <div className="flex min-h-[320px] max-h-[80vh] flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="m-0 text-[16px] font-medium text-slate-800">Supervisor Agent Linking</h2>
            <Button type="text" icon={<CloseOutlined className="text-xl" />} onClick={() => setDrawerOpen(false)} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <label className="mb-2 block text-[13px] font-semibold text-slate-700">Supervisor</label>
            <Select showSearch optionFilterProp="label" placeholder="Select supervisor" value={selectedSupervisorId} disabled={viewMode} options={supervisorOptions} onChange={handleSupervisorChange} className="w-full" />

            <label className="mb-2 mt-5 block text-[14px] font-medium text-slate-700">Choose Agents To Link</label>
            <Input allowClear prefix={<SearchOutlined />} placeholder="Search" value={agentSearch} onChange={(event) => setAgentSearch(event.target.value)} />

            <Spin spinning={isAgentsLoading}>
              <div className="mt-5 space-y-3">
                {filteredAgents.length ? filteredAgents.map((agent) => (
                  <label key={agent.id} className={`flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 shadow-sm ${viewMode ? "cursor-default" : "cursor-pointer"}`}>
                    {!viewMode ? <Checkbox checked={selectedAgentIds.includes(agent.id)} onChange={(event) => setSelectedAgentIds((current) => event.target.checked ? [...new Set([...current, agent.id])] : current.filter((id) => id !== agent.id))} /> : null}
                    <Avatar className="shrink-0 bg-blue-500">{initial(agent.name)}</Avatar>
                    <span className="min-w-0"><span className="block text-[14px] text-slate-700">{agent.name}</span><span className="block text-[12px] text-slate-500">{agent.department}</span></span>
                  </label>
                )) : !isAgentsLoading ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No agents found" /> : null}
              </div>
            </Spin>
          </div>

          <div className="flex shrink-0 justify-end gap-2 px-4 py-4">
            {viewMode && selectedRow ? (
              <>
                <Button icon={<EditOutlined />} onClick={() => setViewMode(false)} />
                <Popconfirm title="Delete this supervisor linking?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => void deleteLinking(selectedRow)}>
                  <Button danger type="primary" icon={<DeleteOutlined />} />
                </Popconfirm>
              </>
            ) : <Button type="primary" loading={isSaving} className="min-w-[72px] bg-emerald-500" onClick={() => void saveLinking()}>Save</Button>}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SupervisorAgentComp;
