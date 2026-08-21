"use client";

import { IconWind, IconDroplet, IconBug, IconFlame, IconPlus } from "@tabler/icons-react";

type Status = "overdue" | "pending" | "done" | "upcoming";

const statusStyles: Record<Status, { badge: { bg: string; color: string }; icon: { bg: string; color: string } }> = {
  overdue:  { badge: { bg: "rgba(185,50,40,0.12)",   color: "#b93228" }, icon: { bg: "rgba(185,50,40,0.12)",   color: "#b93228" } },
  pending:  { badge: { bg: "rgba(192,128,64,0.18)",  color: "#7a4e10" }, icon: { bg: "rgba(192,128,64,0.18)",  color: "#7a4e10" } },
  done:     { badge: { bg: "rgba(59,158,149,0.14)",  color: "#1a6b64" }, icon: { bg: "rgba(59,158,149,0.14)",  color: "#1a6b64" } },
  upcoming: { badge: { bg: "#f0ede8",                color: "#9e9b93" }, icon: { bg: "#f0ede8",                color: "#9e9b93" } },
};

const statusLabels: Record<Status, string> = {
  overdue: "Overdue", pending: "Pending", done: "Done", upcoming: "Upcoming",
};

const items = [
  { icon: IconWind,   title: "HVAC filter replacement", meta: "Due Jul 28 · Quarterly",       status: "overdue"  as Status },
  { icon: IconDroplet,title: "Outdoor shower caulk",    meta: "Added Aug 3 · Unassigned",     status: "pending"  as Status },
  { icon: IconBug,    title: "Pest control visit",      meta: "Completed Aug 2 · $85",         status: "done"     as Status },
  { icon: IconFlame,  title: "Fire pit inspection",     meta: "Scheduled Sep 1 · Before fall", status: "upcoming" as Status },
];

export default function MaintenanceCard() {
  return (
    <div className="rounded-xl p-[1.1rem_1.25rem]" style={{ background: "#fff", border: "1px solid #eae8e2" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-[0.875rem]">
        <div className="flex items-center gap-1.5 text-[13.5px] font-semibold" style={{ color: "#1c1c1a" }}>
          <IconWind size={16} style={{ color: "#3b9e95" }} /> Maintenance
        </div>
        <button
          className="text-[12px] font-medium px-[10px] py-1 rounded-full transition-colors duration-150"
          style={{ color: "#3b9e95", background: "rgba(59,158,149,0.14)", border: "none", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.28)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(59,158,149,0.14)")}
        >
          View all
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col">
        {items.map(({ icon: Icon, title, meta, status }, idx) => {
          const s = statusStyles[status];
          return (
            <div
              key={title}
              className="flex items-center gap-2.5 py-[9px]"
              style={{ borderBottom: idx < items.length - 1 ? "1px solid #eae8e2" : "none" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: s.icon.bg, color: s.icon.color }}
              >
                <Icon size={15} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium" style={{ color: "#1c1c1a" }}>{title}</div>
                <div className="text-[11px] mt-px" style={{ color: "#9e9b93" }}>{meta}</div>
              </div>
              <span
                className="text-[10.5px] font-medium px-[9px] py-[3px] rounded-full whitespace-nowrap"
                style={{ background: s.badge.bg, color: s.badge.color }}
              >
                {statusLabels[status]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Add button */}
      <button
        className="flex items-center justify-center gap-[5px] w-full mt-[10px] py-2 text-[12.5px] rounded-lg transition-colors duration-150"
        style={{
          color: "#3b9e95",
          border: "1.5px dashed rgba(59,158,149,0.4)",
          background: "none",
          cursor: "pointer",
          fontFamily: "var(--font-inter), sans-serif",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.14)")}
        onMouseLeave={e => (e.currentTarget.style.background = "none")}
      >
        <IconPlus size={13} /> Log a task
      </button>
    </div>
  );
}
