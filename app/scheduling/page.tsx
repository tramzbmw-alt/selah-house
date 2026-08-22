"use client";

import { useState } from "react";
import { IconCalendarEvent, IconChevronLeft, IconChevronRight, IconTrash, IconX } from "@tabler/icons-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useStays, type Person, type Stay } from "@/context/StaysContext";
import { usePeople } from "@/context/PeopleContext";
import { getOccupied, getUpcomingStays, MONTHS, DOW, TRAVIS, BRIANA, personColors, formatStayRange } from "@/lib/stayUtils";

function getDayStyle(stay: Stay | undefined, isToday: boolean) {
  let bg = "#f4f3f0", color = "#6b6960", border = "none" as string, fontWeight = 400;
  if (stay) {
    const c = personColors(stay.person);
    bg = c.bg; color = c.text; border = c.border; fontWeight = 600;
  }
  if (isToday) border = "2px solid #3b9e95";
  return { bg, color, border, fontWeight };
}

export default function SchedulingPage() {
  const { stays, addStay, removeStay } = useStays();
  const { people } = usePeople();

  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  const [modal,  setModal]  = useState<{ day: number; existing?: Stay } | null>(null);
  const [person, setPerson] = useState<Person>("Travis");
  const [nights, setNights] = useState(1);
  const [guest,  setGuest]  = useState("");

  const firstDow  = new Date(viewYear, viewMonth - 1, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth, 0).getDate();
  const todayDay  = now.getFullYear() === viewYear && now.getMonth() + 1 === viewMonth ? now.getDate() : -1;
  const occupied  = getOccupied(stays, viewYear, viewMonth);
  const numRows   = Math.ceil((firstDow + totalDays) / 7);

  const upcoming = getUpcomingStays(stays);
  const past     = stays
    .filter(s => !upcoming.find(u => u.id === s.id))
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

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
    setGuest("");
    setModal({ day, existing });
  }

  function handleConfirm() {
    if (!modal) return;
    const mm = String(viewMonth).padStart(2, "0");
    const dd = String(modal.day).padStart(2, "0");
    addStay({ person, startDate: `${viewYear}-${mm}-${dd}`, nights, guest: guest.trim() || undefined });
    setModal(null);
  }

  function handleRemove() {
    if (modal?.existing) { removeStay(modal.existing.id); setModal(null); }
  }

  const modalDateLabel = modal ? `${MONTHS[viewMonth - 1]} ${modal.day}, ${viewYear}` : "";

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: "#f5f4f1" }}>
        <div style={{ height: 3, background: "#3b9e95", flexShrink: 0 }} />
        <Topbar />

        <main
          className="flex-1 flex gap-5 min-h-0"
          style={{ padding: "24px", overflowY: "auto", background: "#f5f4f1", boxSizing: "border-box" }}
        >
          {/* Calendar panel */}
          <div className="flex-1 bg-white border border-[#e4e2dc] rounded-xl flex flex-col min-h-0" style={{ padding: "20px" }}>
            <div className="flex items-center justify-between mb-4" style={{ flexShrink: 0 }}>
              <div className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: "#1c1c1a" }}>
                <IconCalendarEvent size={16} style={{ color: "#3b9e95" }} strokeWidth={2} />
                Scheduling
              </div>
              <button
                className="text-[12px] font-medium px-3 py-1.5 rounded-full"
                style={{ color: "#3b9e95", background: "rgba(59,158,149,0.1)", border: "none", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(59,158,149,0.1)")}
                onClick={() => openModal(now.getDate())}
              >
                + Add stay
              </button>
            </div>

            <div className="flex items-center justify-between mb-4" style={{ flexShrink: 0 }}>
              <span className="text-[15px] font-semibold" style={{ color: "#1c1c1a" }}>
                {MONTHS[viewMonth - 1]} {viewYear}
              </span>
              <div className="flex gap-1">
                {([IconChevronLeft, IconChevronRight] as const).map((Icon, i) => (
                  <button
                    key={i}
                    className="flex items-center justify-center rounded transition-colors"
                    style={{ width: 28, height: 28, border: "1px solid #e4e2dc", background: "none", cursor: "pointer", color: "#6b6960" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f4f3f0")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    onClick={i === 0 ? prevMonth : nextMonth}
                  >
                    <Icon size={14} strokeWidth={2} />
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, flexShrink: 0 }}>
              {DOW.map(d => (
                <div
                  key={d}
                  className="flex items-center justify-center text-[10.5px] font-medium uppercase tracking-[0.06em]"
                  style={{ height: 28, color: "#9e9b93" }}
                >
                  {d}
                </div>
              ))}
            </div>

            <div
              className="flex-1 min-h-0"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gridTemplateRows: `repeat(${numRows}, 1fr)`,
                gap: 4,
                marginTop: 4,
              }}
            >
              {Array(firstDow).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
                const stay  = occupied.get(day);
                const s     = getDayStyle(stay, day === todayDay);
                const label = stay?.guest ? stay.guest.split(" ")[0] : null;
                return (
                  <div
                    key={day}
                    className="flex flex-col items-center justify-center rounded-lg cursor-pointer hover:opacity-75 transition-opacity duration-100"
                    style={{ background: s.bg, color: s.color, border: s.border, fontWeight: s.fontWeight }}
                    onClick={() => openModal(day)}
                  >
                    <span style={{ fontSize: 13 }}>{day}</span>
                    {label && (
                      <span style={{ fontSize: 9, lineHeight: 1.3, maxWidth: "88%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.85 }}>
                        {label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 pt-4 mt-4" style={{ borderTop: "1px solid #e4e2dc", flexShrink: 0 }}>
              {[
                { label: "Travis", ...TRAVIS.legend },
                { label: "Briana", ...BRIANA.legend },
              ].map(({ label, bg, border }) => (
                <div key={label} className="flex items-center gap-1.5 text-[12px]" style={{ color: "#6b6960" }}>
                  <span className="rounded" style={{ width: 10, height: 10, background: bg, border, display: "inline-block" }} />
                  {label}
                </div>
              ))}
              <span className="ml-auto text-[11px]" style={{ color: "#9e9b93" }}>Click any day to add or view a stay</span>
            </div>
          </div>

          {/* Stays list */}
          <div
            className="bg-white border border-[#e4e2dc] rounded-xl flex flex-col"
            style={{ width: 300, flexShrink: 0, padding: "20px", overflowY: "auto" }}
          >
            <div className="text-[13.5px] font-semibold mb-4" style={{ color: "#1c1c1a" }}>All Stays</div>

            {upcoming.length > 0 && (
              <div className="mb-5">
                <div className="text-[10px] font-medium uppercase tracking-[0.08em] mb-2" style={{ color: "#9e9b93" }}>Upcoming</div>
                <div className="flex flex-col gap-2">
                  {upcoming.map(s => {
                    const c = personColors(s.person);
                    return (
                      <div key={s.id} className="flex items-center gap-2.5 rounded-xl" style={{ padding: "10px 12px", background: c.bg }}>
                        <span className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, background: c.solid }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-medium truncate" style={{ color: "#1c1c1a" }}>
                            {s.guest || s.person}
                          </div>
                          <div className="text-[11px] mt-0.5 truncate" style={{ color: "#6b6960" }}>
                            {s.guest ? `${s.person} · ` : ""}{formatStayRange(s)} · {s.nights}n
                          </div>
                        </div>
                        <button
                          className="flex items-center justify-center rounded-lg flex-shrink-0"
                          style={{ width: 26, height: 26, background: "none", border: "none", cursor: "pointer", color: "#9e9b93" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(185,50,40,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#b93228"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#9e9b93"; }}
                          onClick={() => removeStay(s.id)}
                        >
                          <IconTrash size={13} strokeWidth={2} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[0.08em] mb-2" style={{ color: "#9e9b93" }}>Past</div>
                <div className="flex flex-col gap-2">
                  {past.map(s => (
                    <div key={s.id} className="flex items-center gap-2.5 rounded-xl" style={{ padding: "10px 12px", background: "#f4f3f0" }}>
                      <span className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, background: "#9e9b93" }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium truncate" style={{ color: "#6b6960" }}>
                          {s.guest || s.person}
                        </div>
                        <div className="text-[11px] mt-0.5 truncate" style={{ color: "#9e9b93" }}>
                          {s.guest ? `${s.person} · ` : ""}{formatStayRange(s)} · {s.nights}n
                        </div>
                      </div>
                      <button
                        className="flex items-center justify-center rounded-lg flex-shrink-0"
                        style={{ width: 26, height: 26, background: "none", border: "none", cursor: "pointer", color: "#9e9b93" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(185,50,40,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#b93228"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#9e9b93"; }}
                        onClick={() => removeStay(s.id)}
                      >
                        <IconTrash size={13} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {upcoming.length === 0 && past.length === 0 && (
              <div className="text-[12.5px] text-center mt-8" style={{ color: "#9e9b93" }}>
                No stays yet. Click any day on the calendar to add one.
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.38)", zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="bg-white rounded-2xl" style={{ width: 340, padding: "28px", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}>
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
                <div
                  className="rounded-xl flex items-center gap-3 mb-5"
                  style={{ padding: "14px 16px", background: personColors(modal.existing.person).bg }}
                >
                  <span className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: personColors(modal.existing.person).solid }} />
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: "#1c1c1a" }}>
                      {modal.existing.guest || modal.existing.person}
                    </div>
                    <div className="text-[11.5px] mt-0.5" style={{ color: "#6b6960" }}>
                      {modal.existing.guest ? `${modal.existing.person} · ` : ""}
                      {modal.existing.nights} night{modal.existing.nights !== 1 ? "s" : ""} · {formatStayRange(modal.existing)}
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
                <div className="mb-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-2" style={{ color: "#9e9b93" }}>Owner</div>
                  <div className="flex gap-2">
                    {(["Travis", "Briana"] as Person[]).map(p => {
                      const c = personColors(p);
                      return (
                        <button
                          key={p}
                          className="flex-1 py-2 rounded-xl text-[13px] font-medium transition-all duration-150"
                          style={{
                            border: "none", cursor: "pointer",
                            background: person === p ? c.bg : "#f4f3f0",
                            color:      person === p ? c.text : "#6b6960",
                          }}
                          onClick={() => setPerson(p)}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-2" style={{ color: "#9e9b93" }}>
                    Guest name <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                  </div>
                  <input
                    type="text"
                    value={guest}
                    onChange={e => setGuest(e.target.value)}
                    placeholder="Leave blank for personal stay"
                    style={{
                      width: "100%", padding: "9px 12px", border: "1px solid #e4e2dc",
                      borderRadius: 10, background: "#fafaf9", color: "#1c1c1a",
                      fontSize: 13, outline: "none",
                      fontFamily: "var(--font-inter), sans-serif",
                      boxSizing: "border-box",
                    }}
                  />
                  {people.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {people.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setGuest(g => g === p.name ? "" : p.name)}
                          style={{
                            fontSize: 11, padding: "3px 10px", borderRadius: 999,
                            border: "none", cursor: "pointer",
                            background: guest === p.name ? "#1c1c1a" : "#f0ede8",
                            color:      guest === p.name ? "#fff"    : "#6b6960",
                          }}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

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
                    <span className="flex-1 text-center text-[22px] font-semibold" style={{ color: "#1c1c1a" }}>{nights}</span>
                    <button
                      className="flex items-center justify-center rounded-xl text-[18px] font-medium"
                      style={{ width: 36, height: 36, background: "#f4f3f0", border: "none", cursor: "pointer", color: "#6b6960" }}
                      onClick={() => setNights(n => n + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

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
                      background: personColors(person).solid,
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
