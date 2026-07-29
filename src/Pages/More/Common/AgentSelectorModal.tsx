import { Empty, Input, Modal, Spin } from "antd";
import {
  DownOutlined,
  RightOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";

export type SharedAgentOption = {
  label: string;
  value: string;
  role?: string;
  nType?: number;
  isSelf?: boolean;
  avatarText?: string;
  detail?: string;
  queryAgentId?: string;
};

type AgentSelectorModalProps = {
  open: boolean;
  loading?: boolean;
  options: SharedAgentOption[];
  selectedValue?: string;
  search: string;
  expandedAgentId?: string | null;
  selfOption?: SharedAgentOption;
  viewAllOption?: SharedAgentOption;
  showOverviewOptions?: boolean;
  supervisorOptions?: SharedAgentOption[];
  supervisorLoading?: boolean;
  onSearch: (value: string) => void;
  onSelect: (agent: SharedAgentOption) => void;
  onExpandedChange?: (value: string | null) => void;
  onClose: () => void;
};

const AgentSelectorModal = ({
  open,
  loading = false,
  options,
  selectedValue,
  search,
  expandedAgentId,
  selfOption,
  viewAllOption,
  showOverviewOptions = false,
  supervisorOptions = [],
  supervisorLoading = false,
  onSearch,
  onSelect,
  onExpandedChange,
  onClose,
}: AgentSelectorModalProps) => (
  <Modal
    title="Select Agent"
    open={open}
    onCancel={onClose}
    footer={null}
    centered
    width={520}
    destroyOnClose
    styles={{
      body: { paddingTop: 4, paddingBottom: 8 },
      header: { paddingBottom: 8, borderBottom: "none" },
    }}
  >
    <div className="space-y-3">
      <Input
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        prefix={<SearchOutlined className="text-slate-400" />}
        placeholder="Search"
        allowClear
      />

      <Spin spinning={loading}>
        <div
          className="max-h-[300px] space-y-2 overflow-x-hidden overflow-y-scroll pr-2"
          style={{ scrollbarGutter: "stable", scrollbarWidth: "thin"  }}
        >
          {showOverviewOptions && viewAllOption ? (
            <button
              type="button"
              onClick={() => onSelect(viewAllOption)}
              className={`flex w-full items-center gap-3 rounded-sm border bg-slate-50 px-3 py-2 text-left transition hover:border-sky-200 ${
                String(viewAllOption.value) === String(selectedValue ?? "")
                  ? "border-sky-300"
                  : "border-slate-200"
              }`}
            >
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sky-300 text-sm font-medium text-slate-800">
                {viewAllOption.avatarText || viewAllOption.label[0] || "V"}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-700">
                  {viewAllOption.label}
                </span>
                <span className="block text-xs text-slate-500">
                  {viewAllOption.role}
                </span>
              </span>
            </button>
          ) : null}

          {showOverviewOptions && selfOption ? (
            <button
              type="button"
              onClick={() => onSelect(selfOption)}
              className={`flex w-full items-center gap-3 rounded-sm border bg-slate-50 px-3 py-2 text-left transition hover:border-sky-200 ${
                String(selfOption.value) === String(selectedValue ?? "")
                  ? "border-sky-300"
                  : "border-slate-200"
              }`}
            >
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sky-300 text-sm font-medium text-slate-800">
                {(selfOption.label[0] || "S").toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-700">
                  {selfOption.label}
                </span>
                <span className="block text-xs text-slate-500">
                  {selfOption.role}
                </span>
              </span>
            </button>
          ) : null}

          {options.length ? options.map((agent) => {
            const selected = String(agent.value) === String(selectedValue ?? "");
            const supervisor =
              Number(agent.nType) === 2 ||
              String(agent.role ?? "").trim().toLowerCase() === "supervisor";
            const expanded = expandedAgentId === agent.value;
            const initial = (agent.label[0] || "A").toUpperCase();

            if (!supervisor) {
              return (
                <button
                  key={`${agent.value}-${agent.label}`}
                  type="button"
                  onClick={() => onSelect(agent)}
                  className={`flex w-full items-center gap-3 rounded-sm border bg-slate-50 px-3 py-2 text-left transition hover:border-sky-200 ${selected ? "border-sky-300" : "border-slate-200"}`}
                >
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sky-300 text-sm font-medium text-slate-800">{initial}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-700">{agent.label}</span>
                    <span className="block text-xs text-slate-500">{agent.role || "Agent"}</span>
                  </span>
                </button>
              );
            }

            return (
              <div key={`${agent.value}-${agent.label}`} className={`overflow-hidden rounded-sm border ${selected ? "border-sky-300" : "border-slate-200"}`}>
                <button
                  type="button"
                  onClick={() =>
                    onExpandedChange?.(expanded ? null : agent.value)
                  }
                  className="flex w-full items-center justify-between bg-slate-50 px-3 py-2 text-left"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-sky-300 text-sm font-medium text-slate-800">{initial}</span>
                    <span><span className="block text-sm font-medium text-slate-700">{agent.label}</span><span className="block text-xs text-slate-500">{agent.role}</span></span>
                  </span>
                  {showOverviewOptions && !expanded ? (
                    <RightOutlined className="text-xs text-slate-700" />
                  ) : (
                    <DownOutlined className={`text-[10px] transition-transform ${expanded ? "rotate-180" : ""}`} />
                  )}
                </button>
                {showOverviewOptions && expanded ? (
                  <>
                    <div className="border-t border-slate-200 bg-white py-1">
                      <button
                        type="button"
                        onClick={() => onSelect(agent)}
                        className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-slate-50"
                      >
                        <span className="flex h-5 w-5 items-center justify-center text-sky-500">
                          <UserOutlined className="text-xs" />
                        </span>
                        <span className="text-sm text-slate-600">Self</span>
                      </button>
                      <button
                        type="button"
                        disabled={supervisorLoading}
                        onClick={() =>
                          onSelect({
                            ...agent,
                            label: "View All",
                            role: "Supervisor",
                            detail: `Agents: ${supervisorOptions.length}`,
                            avatarText: "S",
                            queryAgentId: [
                              agent.value,
                              ...supervisorOptions.map((child) => child.value),
                            ]
                              .filter(Boolean)
                              .join(","),
                          })
                        }
                        className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                      >
                        <span className="flex h-5 w-5 items-center justify-center text-sky-500">
                          <UserOutlined className="text-xs" />
                        </span>
                        <span className="text-sm text-slate-600">View All</span>
                      </button>
                    </div>
                  </>
                ) : null}
                {!showOverviewOptions && expanded && selfOption ? (
                  <div className="border-t border-slate-200 bg-white">
                    <button type="button" onClick={() => onSelect(agent)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50">
                      <span className="flex h-5 w-5 items-center justify-center text-sky-500"><UserOutlined className="text-xs" /></span>
                      <span className="text-sm font-medium text-slate-700">Self</span>
                    </button>
                    <button type="button" onClick={() => onSelect(agent)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50">
                      <span className="flex h-5 w-5 items-center justify-center text-sky-500"><UserOutlined className="text-xs" /></span>
                      <span className="text-sm font-medium text-slate-700">View All</span>
                    </button>
                  </div>
                ) : null}
              </div>
            );
          }) : !showOverviewOptions ? <Empty description="No agent found" /> : null}
        </div>
      </Spin>
    </div>
  </Modal>
);

export default AgentSelectorModal;
