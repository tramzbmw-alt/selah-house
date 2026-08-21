"use client";

import { IconCalendarEvent, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

const DOW        = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const LEAD_EMPTY = 6; // Aug 2026 starts on Saturday
const TOTAL_DAYS = 31;
const TODAY      = 21;
const TRAVIS     = new Set([18, 19, 20, 21, 22, 23]);
const BRIANA     = new Set<number>([]);

type DayStyle = { bg: string; color: string; border?: string; fontWeight?: number };

function getDayStyle(day: number): DayStyle {
  if (TRAVIS.has(day))
    return { bg: "rgba(59,158,149,0.13)", color: "#16645d", border: "1px solid rgba(59,158,149,0.22)", fontWeight: 600 };
  if (BRIANA.has(day))
    return { bg: "rgba(192,128,64,0.15)", color: "#7a4e10", border: "1px solid rgba(192,128,64,0.22)", fontWeight: 600 };
  return { bg: "#f4f3f0", color: "#6b6960" };
}

export default function OccupancyCalendar() {
  const empties = Array(LEAD_EMPTY).fill(null);
  const days    = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);

  return (
    <div
      className="flex flex-col rounded-xl"
      style={{ background: "#fff", border: "1px solid #e6e4de" }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid #f0efe9", flexShrink: 0 }}
      >
        <div className="flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: "#1c1c1a" }}>
          <IconCalendarEvent size={15} style={{ color: "#3b9e95" }} strokeWidth={2} />
          Occupancy
        </div>
        <button
          className="text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors duration-150"
          style={{ color: "#3b9e95", background: "rgba(59,158,149,0.1)", border: "none", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.2)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(59,158,149,0.1)")}
        >
          + Add stay
        </button>
      </div>

      {/* Calendar body — fills remaining card space, no centering constraint */}
      <div className="flex flex-col flex-1 px-5 py-5">
        {/* Month nav — full width */}
        <div className="flex items-center justify-between w-full mb-4">
          <span className="text-[13px] font-medium" style={{ color: "#1c1c1a" }}>August 2026</span>
          <div className="flex gap-1">
            {[IconChevronLeft, IconChevronRight].map((Icon, i) => (
              <button
                key={i}
                className="flex items-center justify-center rounded transition-colors duration-150"
                style={{
                  width: 24, height: 24,
                  border: "1px solid #e6e4de",
                  background: "none",
                  cursor: "pointer",
                  color: "#6b6960",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f4f3f0")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <Icon size={13} strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>

        {/* Grid — 1fr columns fill the full card width, 44px cell height */}
        <div
          className="w-full"
          style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}
        >
          {/* Day-of-week headers */}
          {DOW.map(d => (
            <div
              key={d}
              className="flex items-center justify-center text-[10px] font-medium uppercase tracking-[0.05em]"
              style={{ height: 28, color: "#9e9b93" }}
            >
              {d}
            </div>
          ))}

          {/* Empty leading cells */}
          {empties.map((_, i) => (
            <div key={`e${i}`} style={{ height: 44 }} />
          ))}

          {/* Day cells */}
          {days.map(day => {
            const s       = getDayStyle(day);
            const isToday = day === TODAY;
            return (
              <div
                key={day}
                className="flex items-center justify-center rounded-md text-[12px] cursor-pointer transition-opacity duration-100 hover:opacity-75"
                style={{
                  height:     44,
                  background: s.bg,
                  color:      s.color,
                  border:     isToday ? "2px solid #3b9e95" : (s.border ?? "none"),
                  fontWeight: isToday ? 600 : (s.fontWeight ?? 400),
                }}
              >
                {day}
              </div>
            );
          })}
        </div>

        {/* Legend — full width */}
        <div
          className="flex items-center gap-4 w-full mt-4 pt-4"
          style={{ borderTop: "1px solid #f0efe9" }}
        >
          {[
            { label: "Travis", bg: "rgba(59,158,149,0.13)", border: "1px solid rgba(59,158,149,0.22)" },
            { label: "Briana", bg: "rgba(192,128,64,0.15)", border: "1px solid rgba(192,128,64,0.22)" },
          ].map(({ label, bg, border }) => (
            <div key={label} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "#6b6960" }}>
              <span className="rounded" style={{ width: 10, height: 10, background: bg, border, display: "inline-block" }} />
              {label}
            </div>
          ))}
          <span className="ml-auto text-[10.5px]" style={{ color: "#9e9b93" }}>
            Click a day to claim it
          </span>
        </div>
      </div>
    </div>
  );
}
