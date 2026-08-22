"use client";

import { useState } from "react";
import { IconCalendarEvent, IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";
import { useStays, type StayPerson, type Stay } from "@/context/StaysContext";
import { usePeople } from "@/context/PeopleContext";
import { getOccupied, MONTHS, DOW, TRAVIS, BRIANA, BOTH, PAID, stayColors, personColors, formatShortDate } from "@/lib/stayUtils";

function getDayStyle(stay: Stay | undefined, isToday: boolean) {
  let bg = "#f4f3f0", color = "#6b6960", border = "none" as string, fontWeight = 400;
  if (stay) {
    const c = stayColors(stay);
    bg = c.bg; color = c.text; border = c.border; fontWeight = 600;
  }
  if (isToday) border = "2px solid #3b9e95";
  return { bg, color, border, fontWeight };
}

type ModalState = { day: number; existing?: Stay; editing?: boolean };

export default function OccupancyCalendar() {
  const { stays, addStay, updateStay, removeStay } = useStays();
  const { people } = usePeople();

  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  const [modal,     setModal]     = useState<ModalState | null>(null);
  const [person,    setPerson]    = useState<StayPerson>("Travis");
  const [nights,    setNights]    = useState(1);
  const [guest,     setGuest]     = useState("");
  const [cost,      setCost]      = useState(0);
  const [costInput, setCostInput] = useState("0");

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
    setNights(existing?.nights ?? 1);
    setGuest("");
    setCost(0);
    setCostInput("0");
    setModal({ day, existing });
  }

  function enterEditMode() {
    if (!modal?.existing) return;
    const ex = modal.existing;
    setPerson(ex.person ?? "Travis");
    setNights(ex.nights);
    setGuest(ex.guest ?? "");
    setCost(ex.cost);
    setCostInput(String(ex.cost));
    setModal({ ...modal, editing: true });
  }

  function handleCostChange(raw: string) {
    setCostInput(raw);
    const n = parseFloat(raw);
    setCost(isNaN(n) || n < 0 ? 0 : n);
  }

  function handleConfirm() {
    if (!modal) return;
    const isEdit = !!(modal.existing && modal.editing);
    const startDate = isEdit
      ? modal.existing!.startDate
      : `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(modal.day).padStart(2, "0")}`;
    const data = {
      person: cost > 0 ? undefined : person,
      startDate,
      nights,
      guest: guest.trim() || undefined,
      cost,
    };
    if (isEdit) updateStay(modal.existing!.id, data);
    else        addStay(data);
    setModal(null);
  }

  function handleRemove() {
    if (modal?.existing) { removeStay(modal.existing.id); setModal(null); }
  }

  const isEdit    = !!(modal?.existing && modal.editing);
  const isDetails = !!(modal?.existing && !modal.editing);
  const chipPeople = cost > 0
    ? people.filter(p => p.type === "paid")
    : people.filter(p => p.type === "owner");
  const confirmBg  = cost > 0 ? PAID.solid : personColors(person).solid;

  const modalTitle = isEdit ? "Edit stay" : isDetails ? "Stay details" : "Add a stay";
  const modalSub   = isEdit && modal?.existing
    ? `Starting ${formatShortDate(modal.existing.startDate)}`
    : modal ? `${MONTHS[viewMonth - 1]} ${modal.day}, ${viewYear}` : "";

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
          <div key={d} className="flex items-center justify-center text-[10px] font-medium uppercase tracking-[0.05em]" style={{ height: 26, color: "#9e9b93" }}>
            {d}
          </div>
        ))}
        {Array(firstDow).fill(null).map((_, i) => <div key={`e${i}`} style={{ height: 44 }} />)}
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
          const stay  = occupied.get(day);
          const s     = getDayStyle(stay, day === todayDay);
          const label = stay?.guest ? stay.guest.split(" ")[0] : null;
          return (
            <div
              key={day}
              className="flex flex-col items-center justify-center rounded-md cursor-pointer hover:opacity-75 transition-opacity duration-100"
              style={{ height: 44, background: s.bg, color: s.color, border: s.border, fontWeight: s.fontWeight }}
              onClick={() => openModal(day)}
            >
              <span style={{ fontSize: 12, lineHeight: 1 }}>{day}</span>
              {label && <span style={{ fontSize: 8, lineHeight: 1.3, maxWidth: "90%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.85 }}>{label}</span>}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 pt-4 flex-wrap" style={{ borderTop: "1px solid #e4e2dc" }}>
        {[
          { label: "Travis",  ...TRAVIS.legend },
          { label: "Briana",  ...BRIANA.legend },
          { label: "Shared",  ...BOTH.legend   },
          { label: "Paid",    ...PAID.legend    },
        ].map(({ label, bg, border }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px]" style={{ color: "#6b6960" }}>
            <span className="rounded" style={{ width: 9, height: 9, background: bg, border, display: "inline-block" }} />
            {label}
          </div>
        ))}
        <span className="ml-auto text-[10px]" style={{ color: "#9e9b93" }}>Click a day</span>
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
                <div className="text-[15px] font-semibold" style={{ color: "#1c1c1a" }}>{modalTitle}</div>
                <div className="text-[12px] mt-0.5" style={{ color: "#9e9b93" }}>{modalSub}</div>
              </div>
              <button
                onClick={() => setModal(null)}
                className="flex items-center justify-center rounded-full"
                style={{ width: 28, height: 28, background: "#f4f3f0", border: "none", cursor: "pointer", color: "#6b6960" }}
              >
                <IconX size={14} strokeWidth={2} />
              </button>
            </div>

            {isDetails ? (
              /* ── Details view ── */
              <>
                <div
                  className="rounded-xl flex items-center gap-3 mb-5"
                  style={{ padding: "14px 16px", background: stayColors(modal.existing!).bg }}
                >
                  <span className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: stayColors(modal.existing!).solid }} />
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: "#1c1c1a" }}>
                      {modal.existing!.guest || (modal.existing!.cost > 0 ? "Paid guest" : modal.existing!.person)}
                    </div>
                    <div className="text-[11.5px] mt-0.5" style={{ color: "#6b6960" }}>
                      {modal.existing!.cost > 0
                        ? `$${modal.existing!.cost} · `
                        : modal.existing!.guest ? `${modal.existing!.person} · ` : ""}
                      {modal.existing!.nights} night{modal.existing!.nights !== 1 ? "s" : ""} from {formatShortDate(modal.existing!.startDate)}
                    </div>
                  </div>
                </div>
                {/* Edit (full width) */}
                <button
                  className="w-full py-2.5 rounded-xl text-[13px] font-medium mb-2"
                  style={{ background: "#f4f3f0", color: "#1c1c1a", border: "none", cursor: "pointer" }}
                  onClick={enterEditMode}
                >
                  Edit stay
                </button>
                {/* Close + Remove */}
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
                    Remove
                  </button>
                </div>
              </>
            ) : (
              /* ── Add / Edit form ── */
              <>
                {/* Cost */}
                <div className="mb-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-2" style={{ color: "#9e9b93" }}>
                    Cost <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>($0 = owner stay)</span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9e9b93", fontSize: 13, pointerEvents: "none" }}>$</span>
                    <input
                      type="number"
                      min={0}
                      value={costInput}
                      onChange={e => handleCostChange(e.target.value)}
                      onFocus={e => { if (e.target.value === "0") setCostInput(""); }}
                      onBlur={e  => { if (e.target.value === "") { setCostInput("0"); setCost(0); } }}
                      style={{
                        width: "100%", padding: "9px 12px 9px 26px", border: "1px solid #e4e2dc",
                        borderRadius: 10, background: cost > 0 ? "rgba(201,168,76,0.07)" : "#fafaf9",
                        color: "#1c1c1a", fontSize: 13, outline: "none",
                        fontFamily: "var(--font-inter), sans-serif",
                        boxSizing: "border-box", transition: "background 0.15s",
                      }}
                    />
                  </div>
                  {cost > 0 && (
                    <div className="text-[11px] mt-1.5" style={{ color: PAID.solid }}>
                      Paid stay — not counted against owner allocation
                    </div>
                  )}
                </div>

                {/* Owner (only for free stays) */}
                {cost === 0 && (
                  <div className="mb-4">
                    <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-2" style={{ color: "#9e9b93" }}>Owner</div>
                    <div className="flex gap-2">
                      {(["Travis", "Briana", "Both"] as StayPerson[]).map(p => {
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
                )}

                {/* Guest name */}
                <div className="mb-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-2" style={{ color: "#9e9b93" }}>
                    Guest name <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                  </div>
                  <input
                    type="text"
                    value={guest}
                    onChange={e => setGuest(e.target.value)}
                    placeholder={cost > 0 ? "Guest or group name" : "Leave blank for personal stay"}
                    style={{
                      width: "100%", padding: "9px 12px", border: "1px solid #e4e2dc",
                      borderRadius: 10, background: "#fafaf9", color: "#1c1c1a",
                      fontSize: 13, outline: "none",
                      fontFamily: "var(--font-inter), sans-serif", boxSizing: "border-box",
                    }}
                  />
                  {chipPeople.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {chipPeople.map(p => (
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
                    onClick={() => isEdit ? setModal({ ...modal!, editing: false }) : setModal(null)}
                  >
                    {isEdit ? "Back" : "Cancel"}
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                    style={{ border: "none", cursor: "pointer", background: confirmBg, color: "#fff" }}
                    onClick={handleConfirm}
                  >
                    {isEdit ? "Save" : "Confirm"}
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
