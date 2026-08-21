"use client";

import { IconTool, IconWind, IconDroplet, IconBug, IconFlame, IconPlus } from "@tabler/icons-react";

type Status = "overdue" | "pending" | "done" | "upcoming";

const STATUS_STYLE: Record<Status, { badge: [string, string]; icon: [string, string] }> = {
  overdue:  { badge: ["rgba(185,50,40,0.1)",   "#b93228"], icon: ["rgba(185,50,40,0.1)",   "#b93228"] },
  pending:  { badge: ["rgba(192,128,64,0.13)",  "#7a4e10"], icon: ["rgba(192,128,64,0.13)",  "#7a4e10"] },
  done:     { badge: ["rgba(59,158,149,0.1)",   "#16645d"], icon: ["rgba(59,158,149,0.1)",   "#16645d"] },
  upcoming: { badge: ["#f0ede8",                "#9e9b93"], icon: ["#f0ede8",                "#9e9b93"] },
};

const LABEL: Record<Status, string> = {
  overdue: "Overdue", pending: "Pending", done: "Done", upcoming: "Upcoming",
};

const ITEMS = [
  { Icon: IconWind,    title: "HVAC filter replacement", meta: "Due Jul 28 · Quarterly",       status: "overdue"  as Status },
  { Icon: IconDroplet, title: "Outdoor shower caulk",   meta: "Added Aug 3 · Unassigned",     status: "pending"  as Status },
  { Icon: IconBug,     title: "Pest control visit",     meta: "Completed Aug 2 · $85",         status: "done"     as Status },
  { Icon: IconFlame,   title: "Fire pit inspection",    meta: "Scheduled Sep 1 · Before fall", status: "upcoming" as Status },
];

export default function MaintenanceCard() {
  return (
    <div className="bg-white border border-[#e4e2dc] rounded-xl p-5 flex flex-col">
      {/* Card head */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: "#1c1c1a" }}>
          <IconTool size={15} style={{ color: "#3b9e95" }} strokeWidth={2} />
          Maintenance
        </div>
        <button
          className="text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors duration-150"
          style={{ color: "#3b9e95", background: "rgba(59,158,149,0.1)", border: "none", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.2)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(59,158,149,0.1)")}
        >
          View all
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col flex-1">
        {ITEMS.map(({ Icon, title, meta, status }, idx) => {
          const { badge, icon } = STATUS_STYLE[status];
          return (
            <div
              key={title}
              className="flex items-center gap-3 py-3 pr-1"
              style={{ borderBottom: idx < ITEMS.length - 1 ? "1px solid #e4e2dc" : "none" }}
            >
              <div
                className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{ width: 32, height: 32, background: icon[0], color: icon[1] }}
              >
                <Icon size={14} strokeWidth={2} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate" style={{ color: "#1c1c1a" }}>{title}</div>
                <div className="text-[11px] mt-0.5 truncate" style={{ color: "#9e9b93" }}>{meta}</div>
              </div>

              {/* Badge — flex-shrink-0 + whitespace-nowrap prevents clipping */}
              <span
                className="flex-shrink-0 whitespace-nowrap text-[10.5px] font-medium px-2.5 py-1 rounded-full"
                style={{ background: badge[0], color: badge[1] }}
              >
                {LABEL[status]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Add task */}
      <button
        className="flex items-center justify-center gap-1.5 w-full mt-4 py-2 text-[12.5px] rounded-lg transition-colors duration-150"
        style={{
          color: "#3b9e95",
          border: "1.5px dashed rgba(59,158,149,0.35)",
          background: "none",
          cursor: "pointer",
          fontFamily: "var(--font-inter), sans-serif",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.06)")}
        onMouseLeave={e => (e.currentTarget.style.background = "none")}
      >
        <IconPlus size={13} strokeWidth={2} />
        Log a task
      </button>
    </div>
  );
}
