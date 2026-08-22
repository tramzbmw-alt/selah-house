"use client";

import { useStays } from "@/context/StaysContext";
import { useMaintenance, deriveStatus } from "@/context/MaintenanceContext";
import { getUpcomingStays, formatShortDate } from "@/lib/stayUtils";

const DOT: Record<string, string> = {
  travis: "#c08040",
  briana: "#3b9e95",
  both:   "#7FA882",
  paid:   "#C9A84C",
  red:    "#b93228",
  gray:   "#9e9b93",
};

function stayDot(s: ReturnType<typeof getUpcomingStays>[number] | undefined) {
  if (!s) return "gray";
  if (s.cost > 0) return "paid";
  if (s.person === "Travis") return "travis";
  if (s.person === "Briana") return "briana";
  if (s.person === "Both")   return "both";
  return "gray";
}

function staySub(s: ReturnType<typeof getUpcomingStays>[number] | undefined, empty: string) {
  if (!s) return empty;
  if (s.cost > 0)            return `${s.guest || "Paid guest"} · $${s.cost}`;
  if (s.person === "Both")   return `${s.guest || "Shared"} · ${s.nights}n`;
  return `${s.person} · ${s.nights} night${s.nights !== 1 ? "s" : ""}`;
}

export default function StatsRow() {
  const { stays }  = useStays();
  const { tasks }  = useMaintenance();
  const upcoming   = getUpcomingStays(stays);
  const next       = upcoming[0];
  const after      = upcoming[1];

  const openTasks    = tasks.filter(t => deriveStatus(t) !== "Done").length;
  const overdueTasks = tasks.filter(t => deriveStatus(t) === "Overdue").length;
  const taskSub      = overdueTasks > 0 ? `${overdueTasks} overdue` : openTasks === 0 ? "All clear" : "all on track";

  const STATS = [
    {
      label: "Next Stay",
      value: next  ? formatShortDate(next.startDate)  : "—",
      sub:   staySub(next,  "None scheduled"),
      dot:   stayDot(next),
    },
    {
      label: "After That",
      value: after ? formatShortDate(after.startDate) : "—",
      sub:   staySub(after, "Nothing yet"),
      dot:   stayDot(after),
    },
    {
      label: "Open Tasks",
      value: String(openTasks),
      sub:   taskSub,
      dot:   overdueTasks > 0 ? "red" : openTasks === 0 ? "briana" : "gray",
    },
    { label: "Aug Expenses", value: "$3,190", sub: "mortgage + utilities", dot: "gray" },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {STATS.map(({ label, value, sub, dot }) => (
        <div
          key={label}
          className="bg-white border border-[#e4e2dc] rounded-xl flex flex-col items-center text-center"
          style={{ padding: "20px" }}
        >
          <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] mb-3" style={{ color: "#9e9b93" }}>
            {label}
          </div>
          <div className="text-[28px] font-semibold leading-none mb-3" style={{ color: "#1c1c1a" }}>
            {value}
          </div>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#6b6960" }}>
            <span className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, background: DOT[dot] }} />
            {sub}
          </div>
        </div>
      ))}
    </div>
  );
}
