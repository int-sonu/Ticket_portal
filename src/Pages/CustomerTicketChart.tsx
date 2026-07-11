import { useState } from "react";

interface CustomerMode {
  key: string | number;
  name: string;
  count: number;
}

interface CustomerTicketChartProps {
  total: number;
  resolved: number;
  unresolved: number;
  modes: CustomerMode[];
}

const CustomerTicketChart = ({
  total,
  resolved,
  unresolved,
  modes,
}: CustomerTicketChartProps) => {
  const [activeSegment, setActiveSegment] = useState<"Resolved" | "Unresolved" | "Total" | null>(null);
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const resolvedRatio = total > 0 ? Math.min(resolved / total, 1) : 1;
  const unresolvedRatio = total > 0
    ? Math.min(unresolved / total, 1 - resolvedRatio)
    : 0;
  const activeCount = activeSegment === "Resolved"
    ? resolved
    : activeSegment === "Unresolved"
      ? unresolved
      : total;

  return (
    <section className="flex min-w-0 flex-col rounded-2xl border p-4">
      <h2 className="m-0 text-lg">Attended Tickets</h2>

      <div className="relative flex flex-1 items-center justify-center py-4">
        <svg
          width="270"
          height="270"
          viewBox="0 0 270 270"
          role="img"
          aria-label={`${total} attended tickets`}
          onMouseLeave={() => setActiveSegment(null)}
        >
          {total > 0 ? <g transform="rotate(-90 135 135)">
            <circle cx="135" cy="135" r={radius} fill="none" stroke="#e9e1d6" strokeWidth="30" />
            <circle cx="135" cy="135" r={radius} fill="none" stroke="#19c7a0" strokeWidth="30" strokeDasharray={`${circumference * resolvedRatio} ${circumference}`} className="cursor-pointer" onPointerEnter={() => setActiveSegment("Resolved")} onPointerDown={() => setActiveSegment("Resolved")} />
            {unresolvedRatio > 0 ? (
              <circle cx="135" cy="135" r={radius} fill="none" stroke="#f58a0a" strokeWidth="30" strokeDasharray={`${circumference * unresolvedRatio} ${circumference}`} strokeDashoffset={-circumference * resolvedRatio} className="cursor-pointer" onPointerEnter={() => setActiveSegment("Unresolved")} onPointerDown={() => setActiveSegment("Unresolved")} />
            ) : null}
            <circle cx="135" cy="135" r="61" fill="none" stroke="#e9e1d6" strokeWidth="24" />
          </g> : null}
          <text x="135" y="131" textAnchor="middle" fill="#2d6a8c" fontSize="14">Total</text>
          <text x="135" y="156" textAnchor="middle" fill="#2d6a8c" fontSize="23" fontWeight="700">{total}</text>
          <circle cx="135" cy="135" r="48" fill="transparent" className="cursor-pointer" onPointerEnter={() => setActiveSegment("Total")} onPointerDown={() => setActiveSegment("Total")} />
        </svg>
        {activeSegment ? (
          <div className="pointer-events-none absolute left-1/2 top-1/2 min-w-[120px] -translate-x-1/2 translate-y-7 rounded border border-slate-300 bg-white px-3 py-2 text-center text-sm shadow-md">
            <div>{activeSegment} : {activeCount}</div>
          </div>
        ) : null}
      </div>

      <div className="flex gap-4 border-b pb-4 text-sm text-[#2d6a8c]">
        <span className="flex items-center gap-1 rounded bg-slate-50 p-2 text-[#19a98a]"><i className="h-3 w-3 rounded-full bg-[#19c7a0]" />Resolved : {String(resolved).padStart(2, "0")}</span>
        <span className="flex items-center gap-1 rounded bg-slate-50 p-2 text-[#f58a0a]"><i className="h-3 w-3 rounded-full bg-[#f58a0a]" />Unresolved : {String(unresolved).padStart(2, "0")}</span>
      </div>

      <div className="flex w-full overflow-x-auto border-b py-1 text-sm">
        {modes.map((mode, index) => (
          <div key={mode.key} className={`flex min-w-[145px] flex-none items-center gap-3 px-4 py-3 ${index ? "border-l" : ""}`}>
            <span className="text-[#2d6a8c]">▶</span>
            <span className="text-[#2d6a8c]">{mode.name}</span>
            <strong className="ml-auto">: {mode.count}</strong>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CustomerTicketChart;
