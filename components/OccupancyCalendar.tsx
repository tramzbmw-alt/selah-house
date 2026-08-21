"use client";

// Aug 2026 starts on Saturday (day index 6)
const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_START_DOW = 6; // Saturday
const MONTH_DAYS = 31;
const TODAY = 21; // Aug 21 2026

// Travis stays: Aug 18–23
const TRAVIS_DAYS = new Set([18, 19, 20, 21, 22, 23]);
// Briana stays: (none in Aug shown on calendar, she's Sep 4)
const BRIANA_DAYS = new Set<number>([]);

function dayClass(day: number): { bg: string; color: string; border: string; fontWeight: string } {
  if (TRAVIS_DAYS.has(day)) return { bg: "rgba(59,158,149,0.14)", color: "#1a6b64", border: "1px solid rgba(59,158,149,0.25)", fontWeight: "600" };
  if (BRIANA_DAYS.has(day)) return { bg: "rgba(192,128,64,0.18)", color: "#7a4e10", border: "1px solid rgba(192,128,64,0.25)", fontWeight: "600" };
  return { bg: "#f5f4f1", color: "#6b6960", border: "none", fontWeight: "400" };
}

export default function OccupancyCalendar() {
  const emptyCells = Array(MONTH_START_DOW).fill(null);
  const days = Array.from({ length: MONTH_DAYS }, (_, i) => i + 1);

  return (
    <div className="rounded-xl p-[1.1rem_1.25rem]" style={{ background: "#fff", border: "1px solid #eae8e2" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-[0.875rem]">
        <div className="flex items-center gap-1.5 text-[13.5px] font-semibold" style={{ color: "#1c1c1a" }}>
          <span style={{ color: "#3b9e95", fontSize: 16 }}>📅</span> Occupancy
        </div>
        <button
          className="text-[12px] font-medium px-[10px] py-1 rounded-full transition-colors duration-150"
          style={{ color: "#3b9e95", background: "rgba(59,158,149,0.14)", border: "none", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.28)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(59,158,149,0.14)")}
        >
          + Add stay
        </button>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12.5px] font-medium" style={{ color: "#1c1c1a" }}>August 2026</span>
        <div className="flex gap-1">
          {["‹", "›"].map(ch => (
            <button
              key={ch}
              className="w-6 h-6 flex items-center justify-center rounded text-[13px] transition-colors duration-150"
              style={{ border: "1px solid #e4e2dc", background: "none", cursor: "pointer", color: "#6b6960" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f5f4f1")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Grid — max-width caps cell size at ~34px square */}
      <div className="grid grid-cols-7 gap-[3px]" style={{ maxWidth: 252 }}>
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-[10px] text-center py-[3px] font-medium uppercase tracking-[0.04em]" style={{ color: "#9e9b93" }}>
            {d}
          </div>
        ))}
        {emptyCells.map((_, i) => <div key={`e${i}`} />)}
        {days.map(day => {
          const style = dayClass(day);
          const isToday = day === TODAY;
          return (
            <div
              key={day}
              className="aspect-square flex items-center justify-center text-[11px] rounded cursor-pointer transition-opacity duration-100 hover:opacity-80 relative"
              style={{
                background: style.bg,
                color: style.color,
                border: style.border,
                fontWeight: style.fontWeight,
                outline: isToday ? "2px solid #3b9e95" : undefined,
                outlineOffset: isToday ? "1px" : undefined,
              }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-[9px] pt-[9px]" style={{ borderTop: "1px solid #eae8e2" }}>
        <div className="flex items-center gap-[5px] text-[11.5px]" style={{ color: "#6b6960" }}>
          <span className="w-[10px] h-[10px] rounded-[3px] inline-block" style={{ background: "rgba(59,158,149,0.14)", border: "1px solid rgba(59,158,149,0.3)" }} />
          Travis
        </div>
        <div className="flex items-center gap-[5px] text-[11.5px]" style={{ color: "#6b6960" }}>
          <span className="w-[10px] h-[10px] rounded-[3px] inline-block" style={{ background: "rgba(192,128,64,0.18)", border: "1px solid rgba(192,128,64,0.3)" }} />
          Briana
        </div>
        <div className="ml-auto text-[11px]" style={{ color: "#9e9b93" }}>Click a day to claim it</div>
      </div>
    </div>
  );
}
