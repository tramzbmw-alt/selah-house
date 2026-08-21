"use client";

import { useState } from "react";
import { IconCalendarEvent, IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";
import { useStays, type Person, type Stay } from "@/context/StaysContext";
import { getOccupied, MONTHS, DOW } from "@/lib/stayUtils";

function dayStyle(stay: Stay | undefined, isToday: boolean) {
  let bg = "#f4f3f0", color = "#6b6960", border = "none", fontWeight = 400;
  if (stay?.person === "Travis") {
    bg = "rgba(59,158,149,0.13)"; color = "#16645d";
    border = "1px solid rgba(59,158,149,0.22)"; fontWeight = 600;
  } else if (stay?.person === "Briana") {
    bg = "rgba(192,128,64,0.15)"; color = "#7a4e10";
    border = "1px solid rgba(192,128,64,0.22)"; fontWeight = 600;
  }
  if (isToday) border = "2px solid #3b9e95";
  return { bg, color, border, fontWeight };
}

export default function OccupancyCalendar() {
  const { stays, addStay, removeStay } = useStays();

  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  // Modal
  const [modal,   setModal]   = useState<{ day: number; existing?: Stay } | null>(null);
  const [person,  setPerson]  = useState<Person>("Travis");
  const [nights,  setNights]  = useState(1);

  const firstDow  = new Date(viewYear, viewMonth - 1, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth, 0).getDate();
  const todayDay  = now.getFullYear() === viewYear && now.getMonth() + 1 === viewMonth ? now.getDate() : -1;
  const occupied  = getOccupied(stays, viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  }

  function openModal(day: number) {
    const existing = occupied.get(day);
    setPerson(existing?.person ?? "Travis");
    setNights(1);
    setModal({ day, existing });
  }

  function handleConfirm() {
    if (!modal) return;
    const mm = String(viewMonth).padStart(2, "0");
    const dd = String(modal.day).padStart(2, "0");
    addStay({ person, startDate: `${viewYear}-${mm}-${dd}`, nights });
    setModal(null);
  }

  function handleRemove() {
    if (modal?.existing) { removeStay(modal.existing.id); setModal(null); }
  }

  const modalDateLabel = modal
    ? `${MONTHS[viewMonth - 1]} ${modal.day}, ${viewYear}`
    : "";

  return (
    <div className="bg-white border border-[#e4e2dc] rounded-xl flex flex-col" style={{ padding: "20px" }}>
      {/* Head */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: "#1c1c1a" }}>
          <IconCalendarEvent size={15} style={{ color: "#3b9e95" }} strokeWidth={2} />
          Occupancy
        </div>
        <button
          className="text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors duration-150"
          style={{ color: "#3b9e95", background: "rgba(59,158,149,0.1)", border: "none", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.2)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(59,158,149,0.1)")}
          onClick={() => openModal(now.getDate())}
        >
          + Add stay
        </button>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-medium" style={{ color: "#1c1c1a" }}>
          {MONTHS[viewMonth - 1]} {viewYear}
        </span>
        <div className="flex gap-1">
          {([IconChevronLeft, IconChevronRight] as const).map((Icon, i) => (
            <button
              key={i}
              className="flex items-center justify-center rounded transition-colors duration-150"
              style={{ width: 24, height: 24, border: "1px solid #e4e2dc", background: "none", cursor: "pointer", color: "#6b6960" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f4f3f0")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
              onClick={i === 0 ? prevMonth : nextMonth}
            >
              <Icon size={13} strokeWidth={2} />
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="w-full" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {DOW.map(d => (
          <div
            key={d}
            className="flex items-center justify-center text-[10px] font-medium uppercase tracking-[0.05em]"
            style={{ height: 26, color: "#9e9b93" }}
          >
            {d}
          </div>
        ))}
        {Array(firstDow).fill(null).map((_, i) => <div key={`e${i}`} style={{ height: 44 }} />)}
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
          const stay = occupied.get(day);
          const s = dayStyle(stay, day === todayDay);
          return (
            <div
              key={day}
              className="flex items-center justify-center rounded-md text-[12px] cursor-pointer hover:opacity-75 transition-opacity duration-100"
              style={{ height: 44, background: s.bg, color: s.color, border: s.border, fontWeight: s.fontWeight }}
              onClick={() => openModal(day)}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: "1px solid #e4e2dc" }}>
        {[
          { label: "Travis", bg: "rgba(59,158,149,0.13)", border: "1px solid rgba(59,158,149,0.22)" },
          { label: "Briana", bg: "rgba(192,128,64,0.15)", border: "1px solid rgba(192,128,64,0.22)" },
        ].map(({ label, bg, border }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "#6b6960" }}>
            <span className="rounded" style={{ width: 10, height: 10, background: bg, border, display: "inline-block" }} />
            {label}
          </div>
        ))}
        <span className="ml-auto text-[10.5px]" style={{ color: "#9e9b93" }}>Click a day to claim it</span>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.38)", zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="bg-white rounded-2xl" style={{ width: 340, padding: "28px", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}>
            {/* Modal header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-[15px] font-semibold" style={{ color: "#1c1c1a" }}>
                  {modal.existing ? "Stay details" : "Claim this day"}
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: "#9e9b93" }}>{modalDateLabel}</div>
              </div>
              <button
                onClick={() => setModal(null)}
                className="flex items-center justify-center rounded-full"
                style={{ width: 28, height: 28, background: "#f4f3f0", border: "none", cursor: "pointer", color: "#6b6960" }}
              >
                <IconX size={14} strokeWidth={2} />
              </button>
            </div>

            {modal.existing ? (
              <>
                {/* Existing stay info */}
                <div
                  className="rounded-xl flex items-center gap-3 mb-5"
                  style={{
                    padding: "14px 16px",
                    background: modal.existing.person === "Travis" ? "rgba(59,158,149,0.1)" : "rgba(192,128,64,0.1)",
                  }}
                >
                  <span
                    className="rounded-full flex-shrink-0"
                    style={{ width: 8, height: 8, background: modal.existing.person === "Travis" ? "#3b9e95" : "#c08040" }}
                  />
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: "#1c1c1a" }}>{modal.existing.person}</div>
                    <div className="text-[11.5px] mt-0.5" style={{ color: "#6b6960" }}>
                      {modal.existing.nights} night{modal.existing.nights !== 1 ? "s" : ""} · starting {MONTHS[new Date(modal.existing.startDate + "T12:00:00").getMonth()]} {new Date(modal.existing.startDate + "T12:00:00").getDate()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                    style={{ background: "#f4f3f0", color: "#6b6960", border: "none", cursor: "pointer" }}
                    onClick={() => setModal(null)}
                  >
                    Close
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                    style={{ background: "rgba(185,50,40,0.1)", color: "#b93228", border: "none", cursor: "pointer" }}
                    onClick={handleRemove}
                  >
                    Remove stay
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Who */}
                <div className="mb-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-2" style={{ color: "#9e9b93" }}>Who</div>
                  <div className="flex gap-2">
                    {(["Travis", "Briana"] as Person[]).map(p => (
                      <button
                        key={p}
                        className="flex-1 py-2 rounded-xl text-[13px] font-medium transition-all duration-150"
                        style={{
                          border: "none", cursor: "pointer",
                          background: person === p
                            ? (p === "Travis" ? "rgba(59,158,149,0.15)" : "rgba(192,128,64,0.15)")
                            : "#f4f3f0",
                          color: person === p
                            ? (p === "Travis" ? "#16645d" : "#7a4e10")
                            : "#6b6960",
                        }}
                        onClick={() => setPerson(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nights */}
                <div className="mb-5">
                  <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-2" style={{ color: "#9e9b93" }}>Nights</div>
                  <div className="flex items-center gap-3">
                    <button
                      className="flex items-center justify-center rounded-xl text-[18px] font-medium"
                      style={{ width: 36, height: 36, background: "#f4f3f0", border: "none", cursor: "pointer", color: "#6b6960" }}
                      onClick={() => setNights(n => Math.max(1, n - 1))}
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-[22px] font-semibold" style={{ color: "#1c1c1a" }}>
                      {nights}
                    </span>
                    <button
                      className="flex items-center justify-center rounded-xl text-[18px] font-medium"
                      style={{ width: 36, height: 36, background: "#f4f3f0", border: "none", cursor: "pointer", color: "#6b6960" }}
                      onClick={() => setNights(n => n + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                    style={{ background: "#f4f3f0", color: "#6b6960", border: "none", cursor: "pointer" }}
                    onClick={() => setModal(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                    style={{
                      border: "none", cursor: "pointer",
                      background: person === "Travis" ? "#3b9e95" : "#c08040",
                      color: "#fff",
                    }}
                    onClick={handleConfirm}
                  >
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
