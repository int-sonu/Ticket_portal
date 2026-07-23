import { Fragment, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Popover, Radio, Spin, Empty } from "antd";
import dayjs from "dayjs";
import { useAgentAvailability } from "./AgentAvailabilityHooks";
import { getRequestPayload } from "../../Utils/requestPayload";
import { getValue, text } from "./ExpenseApprovalUtils"; // reuse some util functions
import filterIcon from "../../assets/icons/filterdetails.svg";

const AgentAvailabilityPage = () => {
  const [filterGroup, setFilterGroup] = useState<string>("");
  const [draftGroup, setDraftGroup] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const payload = useMemo(() => {
    const { nCompanyId, nAgentId, id, cSchemaName, cDbName } = getRequestPayload();
    // Default to next 7 days for the view (or as provided by API)
    const dFromDate = dayjs().format("YYYY/MM/DD");
    const dToDate = dayjs().add(6, "day").format("YYYY/MM/DD");

    return {
      nCompanyId,
      nAgentId: Number(nAgentId ?? id) || 0,
      cSchemaName,
      cDbName,
      bDateRange: true,
      dFromDate,
      dToDate,
    };
  }, [filterGroup]);

  const { data, isFetching } = useAgentAvailability(payload);

  // Extract agent list from response
  const agentList = useMemo(() => {
    const src = data as any;
    const items = src?.data?.data ?? src?.data ?? src ?? [];
    return Array.isArray(items) ? items : [];
  }, [data]);

  // Extract dynamic groups for the filter popover
  const availableGroups = useMemo(() => {
    const groups = new Set<string>();
    agentList.forEach((agent) => {
      const g = text(getValue(agent, ["cGroupName", "GroupName", "cGroup", "Group", "cService", "Service"]), "");
      if (g) groups.add(g);
    });
    return Array.from(groups).sort();
  }, [agentList]);
  const displayedAgents = useMemo(
    () =>
      filterGroup
        ? agentList.filter(
            (agent) =>
              text(
                getValue(agent, [
                  "cGroupName",
                  "GroupName",
                  "cGroup",
                  "Group",
                  "cService",
                  "Service",
                ]),
              ).toLowerCase() === filterGroup.toLowerCase(),
          )
        : agentList,
    [agentList, filterGroup],
  );

  // Determine dynamic date columns from data, or fallback to generated dates
  const dateColumns = useMemo(() => {
    // If API returns dates dynamically in a row's 'availability' array, we'd extract them.
    // For now, let's assume we display 7 days from today.
    const cols = [];
    for (let i = 0; i < 7; i++) {
      const d = dayjs().add(i, "day");
      cols.push({
        date: d.format("DD/MM/YYYY"),
        dayName: d.format("dddd"),
        key: d.format("YYYY-MM-DD"),
      });
    }
    return cols;
  }, []);

  const handleApplyFilter = () => {
    setFilterGroup(draftGroup);
    setFilterOpen(false);
  };

  const handleCancelFilter = () => {
    setDraftGroup(filterGroup);
    setFilterOpen(false);
  };

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(event.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    event.preventDefault();
    const x = event.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const filterContent = (
    <div className="flex min-h-[320px] w-[280px] flex-col rounded-xl bg-white">
      <div className="border-b border-slate-100 px-5 py-4 text-base font-medium text-slate-800">
        Apply Filter
      </div>
      <div className="px-5 pb-4 pt-4">
        <div className="mb-3 text-sm font-medium text-slate-700">Group</div>
        <div className="max-h-[170px] overflow-y-auto pr-1">
          <Radio.Group
            value={draftGroup}
            onChange={(event) => setDraftGroup(event.target.value)}
            className="flex flex-col gap-3"
          >
            <Radio value="" className="text-sm text-slate-600">All Groups</Radio>
            {availableGroups.map((group) => (
              <Radio key={group} value={group} className="text-sm text-slate-600">
                {group}
              </Radio>
            ))}
          </Radio.Group>
        </div>
      </div>
      <div className="mt-auto flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
        <button
          className="rounded-md border border-emerald-500 px-4 py-1.5 text-sm font-medium text-emerald-500 transition-colors hover:bg-emerald-50"
          onClick={handleCancelFilter}
        >
          Cancel
        </button>
        <button
          className="rounded-md bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
          onClick={handleApplyFilter}
        >
          Apply
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-white px-5 py-4">
      {/* Header */}
      <header className="mb-4 flex flex-none items-center justify-between">
        <h1 className="m-0 text-xl font-medium text-slate-900">Agent Availability</h1>
        <Popover
          content={filterContent}
          trigger="click"
          placement="bottomRight"
          open={filterOpen}
          onOpenChange={(open) => {
            if (open) setDraftGroup(filterGroup);
            setFilterOpen(open);
          }}
        >
          <button className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50">
            <img src={filterIcon} alt="" className="h-5 w-5" />
          </button>
        </Popover>
      </header>

      {/* Table Container */}
      <div className="relative min-h-0 flex-none overflow-hidden rounded-md border border-slate-200">
        <div
          ref={scrollRef}
          className={`paymode-scrollbar max-h-[calc(100vh-170px)] w-full overflow-x-auto overflow-y-hidden select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{ WebkitOverflowScrolling: "touch" }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <div
            className="grid min-w-max"
            style={{
              gridTemplateColumns: `240px repeat(${dateColumns.length}, minmax(170px, 1fr))`,
            }}
          >
            {/* Table Header */}
            <div className="sticky left-0 top-0 z-30 border-b border-r border-slate-200 bg-slate-100 p-4 text-sm font-semibold text-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
              Name
            </div>
            {dateColumns.map((col) => (
              <div
                key={col.key}
                className="sticky top-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-2 py-3 text-center last:border-r-0"
              >
                <div className="text-sm font-medium text-slate-800">{col.date}</div>
                <div className="text-xs text-slate-500">{col.dayName}</div>
              </div>
            ))}

            {/* Table Body */}
            {isFetching && displayedAgents.length === 0 ? (
              <div className="col-span-full flex h-40 items-center justify-center">
                <Spin />
              </div>
            ) : displayedAgents.length === 0 ? (
              <div className="col-span-full flex h-40 items-center justify-center">
                <Empty description="No agents found" />
              </div>
            ) : (
              displayedAgents.map((agent, index) => {
                const name = text(
                  getValue(agent, ["cAgentName", "AgentName", "cName", "Name"]),
                  `Agent ${index + 1}`,
                );
                const initials = name.slice(0, 2).toUpperCase();
                const group = text(
                  getValue(agent, ["cGroupName", "GroupName", "cGroup", "Group", "cService", "Service"]),
                  "Development",
                );

                const colors = ["bg-sky-400", "bg-amber-300", "bg-rose-400", "bg-emerald-400"];
                const avatarColor = colors[index % colors.length];

                return (
                  <Fragment key={index}>
                    <div className="sticky left-0 z-20 flex min-w-0 items-center gap-3 border-b border-r border-slate-200 bg-slate-50 p-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor}`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-800">{name}</div>
                        <div className="truncate text-xs text-slate-500">{group}</div>
                      </div>
                    </div>

                    {dateColumns.map((col) => {
                      const statusText = text(
                        getValue(agent, [`status_${col.key}`, "cStatus", "Status"]),
                        "No Ticket assigned",
                      );
                      const isFree = statusText.toLowerCase().includes("no ticket");

                      return (
                        <div
                          key={`${index}-${col.key}`}
                          className="flex min-w-0 items-center justify-center border-b border-r border-slate-200 bg-white px-2 py-3 text-center last:border-r-0"
                        >
                          <span
                            className={`max-w-full truncate text-sm ${
                              isFree ? "text-emerald-500" : "text-slate-600"
                            }`}
                          >
                            {statusText}
                          </span>
                        </div>
                      );
                    })}
                  </Fragment>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentAvailabilityPage;
