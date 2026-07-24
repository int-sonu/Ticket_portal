/* eslint-disable @typescript-eslint/no-explicit-any -- menu-right response fields differ between tenant versions. */
import { useEffect, useMemo, useState, type Key } from "react";
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  Empty,
  Input,
  Modal,
  Select,
  Spin,
  Tree,
  message,
  type TreeDataNode,
} from "antd";
import { CopyOutlined, SearchOutlined } from "@ant-design/icons";

import { settingsApis } from "../../Axios/SettingsApi";
import arrowIcon from "../../assets/icons/arrow.svg";
import { getRequestPayload } from "../../Utils/requestPayload";
import { getApiMessage } from "../Master/Common/SimpleMasterUtils";

type ApiRecord = Record<string, any>;
type AgentOption = { value: number; label: string; department: string };

const roleNode = (
  key: string,
  title: string,
  children: TreeDataNode[] = [],
): TreeDataNode => ({ key, title, children });

const defaultMenuTree: TreeDataNode[] = [
  roleNode("dashboard", "Dashboard", [
    roleNode("dashboard.dashboard", "Dashboard"),
    roleNode("dashboard.collection-summary", "Collection Summary"),
    roleNode("dashboard.agent-activity-graph", "Agent Activity Graph"),
  ]),
  roleNode("master", "Master", [
    roleNode("master.agent-group", "Agent Group"),
    roleNode("master.agent", "Agent"),
    roleNode("master.trip-mode", "Trip Mode"),
    roleNode("master.financial-year", "Financial Year"),
    roleNode("master.tax", "Tax"),
    roleNode("master.ticket-status", "Ticket Status"),
    roleNode("master.parts", "Parts"),
    roleNode("master.customer", "Customer"),
    roleNode("master.service-type", "Service Type"),
    roleNode("master.currency", "Currency"),
    roleNode("master.department", "Department"),
    roleNode("master.brand", "Brand"),
    roleNode("master.issue-summary", "Issue Summary"),
    roleNode("master.follow-up-mode", "Follow Up Mode"),
    roleNode("master.ticket-source", "Ticket Source"),
    roleNode("master.vendor-master", "Vendor Master"),
  ]),
  roleNode("ticket", "Ticket", [
    roleNode("ticket.create", "Create"),
    roleNode("ticket.edit", "Edit"),
    roleNode("ticket.delete", "Delete"),
    roleNode("ticket.view", "View"),
    roleNode("ticket.share", "Share"),
    roleNode("ticket.share-summary", "Share Summary"),
    roleNode("ticket.estimate", "Estimate"),
    roleNode("ticket.transfer", "Transfer"),
    roleNode("ticket.postpone", "Postpone"),
    roleNode("ticket.merge", "Merge"),
    roleNode("ticket.assign", "Assign"),
    roleNode("ticket.accept", "Accept"),
  ]),
  roleNode("call-report", "Call Report", [
    roleNode("call-report.view", "View"),
    roleNode("call-report.edit", "Edit"),
    roleNode("call-report.bill-now", "Bill Now"),
    roleNode("call-report.share-summary", "Share Summary"),
    roleNode("call-report.start", "Call Report Start"),
  ]),
  roleNode("unbilled-call-report", "Unbilled Call Report", [
    roleNode("unbilled-call-report.view", "View"),
  ]),
  roleNode("bills-and-receipts", "Bills & Receipts", [
    roleNode("bills-and-receipts.bills", "Bills"),
    roleNode("bills-and-receipts.receipts", "Receipts"),
  ]),
  roleNode("item-repair", "Item Repair", [
    roleNode("item-repair.assign", "Assign Item for Repair"),
    roleNode("item-repair.assigned", "Assigned Items"),
  ]),
  roleNode("more", "More", [
    roleNode("more.customer-details", "Customer Details"),
    roleNode("more.collection-summary", "Collection Summary"),
    roleNode("more.punch-in-out", "Punch In & Punch Out"),
    roleNode("more.leave-application", "Leave Application"),
    roleNode("more.leave-approval", "Leave Approval"),
    roleNode("more.traveling-expense", "Traveling Expense"),
    roleNode("more.travel-log", "Travel Log"),
    roleNode("more.work-summary", "Work Summary"),
    roleNode("more.task-calendar", "Task Calendar"),
    roleNode("more.agent-analysis", "Agent Analysis"),
    roleNode("more.review-closed-tickets", "Review Closed Tickets"),
    roleNode("more.expense-approval", "Expense Approval"),
    roleNode("more.agent-availability", "Agent Availability"),
  ]),
  roleNode("reports", "Reports", [
    roleNode("reports.customer-details", "Customer Details"),
    roleNode("reports.ticket-list", "Ticket List"),
    roleNode("reports.call-report", "Call Report"),
    roleNode("reports.travel-log", "Travel Log"),
    roleNode("reports.expense", "Expense"),
    roleNode("reports.bill", "Bill"),
    roleNode("reports.item-wise-sales", "Item Wise Sales"),
    roleNode("reports.outstanding", "Outstanding"),
    roleNode("reports.part-taken-for-repair", "Part Taken for Repair"),
    roleNode("reports.replace-part", "Replace Part"),
    roleNode("reports.receipt", "Receipt"),
    roleNode("reports.attendance-summary", "Attendance Summary"),
    roleNode("reports.leave-application", "Leave Application"),
    roleNode("reports.leave-approval", "Leave Approval Report"),
    roleNode("reports.agent-list", "Agent List Report"),
    roleNode("reports.income-vs-expense", "Income vs Expense on Ticket"),
    roleNode("reports.ticket-history", "Ticket History Report"),
    roleNode("reports.daily-service", "Daily Service Report"),
  ]),
  roleNode("settings", "Settings", [
    roleNode("settings.features", "Features"),
    roleNode("settings.user-roles", "User Roles"),
    roleNode("settings.notification-settings", "Notification Settings"),
    roleNode("settings.supervisor-agent-linking", "Supervisor Agent Linking"),
    roleNode("settings.configurations", "Configurations"),
    roleNode("settings.company-details", "Company Details"),
  ]),
];

const findValue = (record: ApiRecord, aliases: string[]) => {
  const key = Object.keys(record || {}).find((item) =>
    aliases.some((alias) => alias.toLowerCase() === item.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const parseJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const findList = (response: unknown, preferredKeys: string[]): ApiRecord[] => {
  const queue: Array<{ value: unknown; depth: number }> = [{ value: parseJson(response), depth: 0 }];
  const fallback: ApiRecord[][] = [];
  const visited = new Set<unknown>();

  while (queue.length) {
    const current = queue.shift();
    if (!current || current.depth > 5 || current.value == null) continue;
    const parsed = parseJson(current.value);
    if (Array.isArray(parsed)) {
      const records = parsed.filter((item) => item && typeof item === "object") as ApiRecord[];
      if (records.length) fallback.push(records);
      continue;
    }
    if (typeof parsed !== "object" || visited.has(parsed)) continue;
    visited.add(parsed);
    const record = parsed as ApiRecord;
    for (const key of preferredKeys) {
      const actual = Object.keys(record).find((item) => item.toLowerCase() === key.toLowerCase());
      if (!actual) continue;
      const candidate = parseJson(record[actual]);
      if (Array.isArray(candidate)) return candidate as ApiRecord[];
      if (candidate && typeof candidate === "object") {
        queue.unshift({ value: candidate, depth: current.depth + 1 });
      }
    }
    Object.values(record).forEach((value) =>
      queue.push({ value, depth: current.depth + 1 }),
    );
  }
  return fallback.sort((a, b) => b.length - a.length)[0] ?? [];
};

const mapAgents = (response: unknown): AgentOption[] =>
  findList(response, ["agentList", "agents", "data", "result", "message"])
    .map((item) => ({
      value: Number(findValue(item, ["nAgentId", "agentId", "id", "nId"])),
      label: String(
        findValue(item, ["cAgentName", "agentName", "cName", "name", "label"]) ?? "",
      ),
      department: String(
        findValue(item, [
          "cDepartmentName",
          "departmentName",
          "cDepartment",
          "department",
          "cDeptName",
        ]) ?? "",
      ),
    }))
    .filter((item) => Number.isFinite(item.value) && item.value > 0 && item.label);

const menuId = (item: ApiRecord, fallback: string) =>
  String(
    findValue(item, ["nMenuId", "menuId", "nId", "id", "cMenuId", "key", "value"]) ??
      fallback,
  );

const menuName = (item: ApiRecord, fallback: string) =>
  String(
    findValue(item, [
      "cMenuName",
      "menuName",
      "cDisplayName",
      "displayName",
      "cName",
      "name",
      "title",
      "label",
    ]) ?? fallback,
  );

const isChecked = (item: ApiRecord) => {
  const value = findValue(item, [
    "bChecked",
    "checked",
    "isChecked",
    "bSelected",
    "selected",
    "isSelected",
    "bRight",
    "hasRight",
    "bMenuRight",
    "bActive",
  ]);
  return value === true || value === 1 || String(value).toLowerCase() === "true";
};

const extractMenusString = (response: unknown): string => {
  const queue: unknown[] = [response];
  const visited = new Set<unknown>();
  while (queue.length) {
    const value = queue.shift();
    if (!value || typeof value !== "object" || visited.has(value)) continue;
    visited.add(value);
    const record = value as ApiRecord;
    const menus = findValue(record, ["cMenus", "menus", "menuIds", "cMenuIds"]);
    if (typeof menus === "string") return menus;
    Object.values(record).forEach((item) => queue.push(item));
  }
  return "";
};

const selectedFromMenusString = (value: string): Key[] => {
  if (!value.trim()) return [];
  const parsed = parseJson(value);
  const values = Array.isArray(parsed) ? parsed : value.split(",");
  return values
    .map((item) =>
      typeof item === "object"
        ? findValue(item as ApiRecord, ["nMenuId", "menuId", "id", "key"])
        : item,
    )
    .filter((item) => item !== undefined && item !== null && String(item).trim())
    .map((item) => String(item).trim());
};

const buildMenuTree = (response: unknown) => {
  const menusString = extractMenusString(response);
  const parsedMenus = parseJson(menusString);
  const menusFromString = Array.isArray(parsedMenus)
    ? (parsedMenus as ApiRecord[])
    : parsedMenus && typeof parsedMenus === "object"
      ? findList(parsedMenus, ["menuRights", "menuList", "menus", "rights", "children", "items"])
      : [];
  const responseRows = findList(response, [
    "menuRights",
    "menuList",
    "menus",
    "rights",
    "data",
    "result",
  ]);
  const rows = menusFromString.length ? menusFromString : responseRows;
  const nodes = new Map<string, TreeDataNode>();
  const parents = new Map<string, string>();
  const checked: Key[] = [];

  const addRows = (items: ApiRecord[], prefix = "menu", parentKey?: string) => {
    items.forEach((item, index) => {
      const key = menuId(item, `${prefix}-${index}`);
      const title = menuName(item, `Menu ${index + 1}`);
      if (!nodes.has(key)) nodes.set(key, { key, title, children: [] });
      if (parentKey) parents.set(key, parentKey);
      const explicitParent = findValue(item, [
        "nParentMenuId",
        "parentMenuId",
        "nParentId",
        "parentId",
      ]);
      if (explicitParent != null && Number(explicitParent) !== 0) {
        parents.set(key, String(explicitParent));
      }
      if (isChecked(item)) checked.push(key);
      const children = findValue(item, ["children", "childMenus", "subMenus", "items", "lMenu"]);
      const parsedChildren = parseJson(children);
      if (Array.isArray(parsedChildren)) addRows(parsedChildren, key, key);
    });
  };
  addRows(rows);

  const roots: TreeDataNode[] = [];
  nodes.forEach((node, key) => {
    const parent = parents.get(key);
    if (parent && nodes.has(parent)) {
      (nodes.get(parent)!.children as TreeDataNode[]).push(node);
    } else {
      roots.push(node);
    }
  });

  if (!roots.length) {
    const savedKeys = selectedFromMenusString(menusString);
    return {
      tree: defaultMenuTree,
      selected: savedKeys.length ? savedKeys : flattenKeys(defaultMenuTree),
    };
  }

  const selected = checked.length ? checked : selectedFromMenusString(menusString);
  return { tree: roots, selected };
};

const findNumber = (response: unknown, aliases: string[]) => {
  const queue: unknown[] = [response];
  const visited = new Set<unknown>();
  while (queue.length) {
    const value = queue.shift();
    if (!value || typeof value !== "object" || visited.has(value)) continue;
    visited.add(value);
    const record = value as ApiRecord;
    const found = findValue(record, aliases);
    if (found !== undefined && Number.isFinite(Number(found))) return Number(found);
    Object.values(record).forEach((item) => queue.push(item));
  }
  return 0;
};

const flattenKeys = (nodes: TreeDataNode[]): Key[] =>
  nodes.flatMap((node) => [node.key, ...flattenKeys(node.children ?? [])]);

const UserRolesPage = () => {
  const requestPayload = useMemo(() => getRequestPayload(), []);
  const loggedInAgentId = Number(requestPayload.nAgentId ?? requestPayload.id ?? 0);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [agentId, setAgentId] = useState<number | undefined>(
    loggedInAgentId > 0 ? loggedInAgentId : undefined,
  );
  const [treeData, setTreeData] = useState<TreeDataNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<Key[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([]);
  const [rightId, setRightId] = useState(0);
  const [menusFormat, setMenusFormat] = useState<"json" | "csv">("csv");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copyOpen, setCopyOpen] = useState(false);
  const [copySearch, setCopySearch] = useState("");
  const [copying, setCopying] = useState(false);

  const applyRightsResponse = (response: unknown) => {
    const { tree, selected } = buildMenuTree(response);
    const menus = extractMenusString(response);
    setTreeData(tree);
    setCheckedKeys(selected);
    setExpandedKeys([]);
    setRightId(findNumber(response, ["nRightId", "rightId"]));
    setMenusFormat(menus.trim().startsWith("[") ? "json" : "csv");
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const agentResponse = await settingsApis.agentDropDown(requestPayload);
        if (!active) return;
        const options = mapAgents(agentResponse);
        setAgents(options);
        const selectedId =
          options.some((option) => option.value === loggedInAgentId)
            ? loggedInAgentId
            : options[0]?.value;
        setAgentId(selectedId);
        if (selectedId) {
          const rightsResponse = await settingsApis.getMenuRights({
            ...requestPayload,
            nAgentId: selectedId,
          });
          if (active) applyRightsResponse(rightsResponse);
        } else {
          setTreeData([]);
        }
      } catch (loadError) {
        if (active) setError(getApiMessage(loadError, "Unable to load user roles."));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [loggedInAgentId, requestPayload]);

  const loadRights = async (nextAgentId: number) => {
    setAgentId(nextAgentId);
    setLoading(true);
    setError("");
    try {
      const response = await settingsApis.getMenuRights({
        ...requestPayload,
        nAgentId: nextAgentId,
      });
      applyRightsResponse(response);
    } catch (loadError) {
      setError(getApiMessage(loadError, "Unable to load menu rights."));
      setTreeData([]);
      setCheckedKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const allKeys = useMemo(() => flattenKeys(treeData), [treeData]);
  const allSelected = allKeys.length > 0 && allKeys.every((key) => checkedKeys.includes(key));
  const allExpanded = allKeys.length > 0 && allKeys.every((key) => expandedKeys.includes(key));

  const save = async () => {
    if (!agentId) return;
    setSaving(true);
    try {
      const menuIds = checkedKeys.map(String);
      await settingsApis.menuRightsSave({
        nRightId: rightId,
        nAgentId: agentId,
        cMenus: menusFormat === "json" ? JSON.stringify(menuIds) : menuIds.join(","),
        nCreatedBy: loggedInAgentId,
        nCompanyId: requestPayload.nCompanyId,
        cSchemaName: requestPayload.cSchemaName,
        cDbName: requestPayload.cDbName,
      });
      message.success("User roles saved successfully.");
      await loadRights(agentId);
    } catch (saveError) {
      message.error(getApiMessage(saveError, "Unable to save user roles."));
    } finally {
      setSaving(false);
    }
  };

  const copyRoles = async (sourceAgentId: number) => {
    setCopying(true);
    try {
      const response = await settingsApis.getMenuRights({
        ...requestPayload,
        nAgentId: sourceAgentId,
      });
      const { selected } = buildMenuTree(response);
      setCheckedKeys(selected);
      setCopyOpen(false);
      setCopySearch("");
      message.success("Roles copied. Click Save to apply them.");
    } catch (copyError) {
      message.error(getApiMessage(copyError, "Unable to copy user roles."));
    } finally {
      setCopying(false);
      }
  };

  const filteredCopyAgents = agents.filter((agent) => {
    const search = copySearch.trim().toLowerCase();
    return (
      !search ||
      agent.label.toLowerCase().includes(search) ||
      agent.department.toLowerCase().includes(search)
    );
  });

  return (
    <div className="flex h-[calc(100vh-92px)] min-h-0 flex-col py-4">
      <h1 className="text-[20px] font-semibold text-slate-950">User Roles</h1>
      <Select
        className="mb-5 w-[260px]"
        showSearch
        optionFilterProp="label"
        loading={loading && !agents.length}
        value={agentId}
        options={agents}
        placeholder="Select user"
        onChange={(value) => void loadRights(value)}
      />

      <section className="flex min-h-0 flex-1 flex-col pt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="m-0 text-[16px] font-semibold text-slate-950">Select Roles</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Checkbox
              checked={allExpanded}
              disabled={!allKeys.length}
              onChange={(event) => setExpandedKeys(event.target.checked ? allKeys : [])}
            >
              Expand All
            </Checkbox>
            <Checkbox
              checked={allSelected}
              disabled={!allKeys.length}
              onChange={(event) => setCheckedKeys(event.target.checked ? allKeys : [])}
            >
              Select All Rights
            </Checkbox>
            <Button type="primary"   icon={<CopyOutlined />} onClick={() => setCopyOpen(true)} >
              Copy User Roles
            </Button>
          </div>
        </div>

        {error ? <Alert className="mb-3" showIcon type="error" message={error} /> : null}
        <Spin spinning={loading}>
          <div className="min-h-[280px] flex-1 overflow-y-auto py-1">
            {treeData.length ? (
              <Tree
                className="user-roles-tree"
                checkable
                blockNode
                showLine={{ showLeafIcon: false }}
                treeData={treeData}
                checkedKeys={checkedKeys}
                expandedKeys={expandedKeys}
                switcherIcon={({ expanded, isLeaf }) =>
                  isLeaf ? null : (
                    <img
                      src={arrowIcon}
                      alt=""
                      aria-hidden="true"
                      className={`h-[15px] w-5 transition-transform ${
                        expanded ? "rotate-90" : "rotate-0"
                      }`}
                    />
                  )
                }
                onCheck={(keys) => setCheckedKeys(keys as Key[])}
                onExpand={(keys) => setExpandedKeys(keys)}
              />
            ) : !loading ? (
              <Empty description="No menu rights found" />
            ) : null}
          </div>
        </Spin>

        <div className="mt-4 flex justify-end">
          <Button
            type="primary"
            className="min-w-[80px] !bg-emerald-500  hover:!bg-emerald-600"
            loading={saving}
            disabled={!agentId || loading}
            onClick={() => void save()}
          >
            Save
          </Button>
        </div>
      </section>

      <Modal
        title="Copy User Roles From"
        open={copyOpen}
        width={520}
        footer={null}
        destroyOnHidden
        onCancel={() => {
          setCopyOpen(false);
          setCopySearch("");
        }}
      >
        <Input
          className="mb-3"
          allowClear
          prefix={<SearchOutlined className="text-slate-500" />}
          placeholder="Search"
          value={copySearch}
          onChange={(event) => setCopySearch(event.target.value)}
        />
        <Spin spinning={copying}>
          <div className="max-h-[320px] min-h-[260px] overflow-y-auto pr-1">
            {filteredCopyAgents.length ? (
              filteredCopyAgents.map((agent) => (
                <button
                  key={agent.value}
                  type="button"
                  disabled={copying}
                  className="flex w-full items-center gap-3 border-0 border-b border-solid border-slate-100 bg-white px-2 py-2.5 text-left transition-colors hover:bg-sky-50 disabled:cursor-wait"
                  onClick={() => void copyRoles(agent.value)}
                >
                  <Avatar
                    size={40}
                    className="shrink-0 text-[14px] text-white"
                    style={{ backgroundColor: "#87CEFA" }}
                  >
                    {agent.label.trim().charAt(0).toUpperCase()}
                  </Avatar>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-slate-800">
                      {agent.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-slate-400">
                      {agent.department || "Service"}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <Empty className="mt-12" image={Empty.PRESENTED_IMAGE_SIMPLE} description="No users found" />
            )}
          </div>
        </Spin>
      </Modal>
    </div>
  );
};

export default UserRolesPage;
