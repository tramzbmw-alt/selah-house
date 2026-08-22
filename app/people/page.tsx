"use client";

import { useState } from "react";
import { IconUsers, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { usePeople, type GuestType } from "@/context/PeopleContext";
import { type Person } from "@/context/StaysContext";
import { TRAVIS, BRIANA } from "@/lib/stayUtils";

const INPUT_STYLE = {
  width: "100%", padding: "8px 12px", border: "1px solid #e4e2dc",
  borderRadius: 8, background: "#fff", color: "#1c1c1a",
  fontSize: 13, outline: "none",
  fontFamily: "var(--font-inter), sans-serif",
  boxSizing: "border-box" as const,
};

export default function PeoplePage() {
  const { people, addPerson, removePerson } = usePeople();

  const [showForm,  setShowForm]  = useState(false);
  const [guestType, setGuestType] = useState<GuestType>("owner");
  const [name,      setName]      = useState("");
  const [rel,       setRel]       = useState("");
  const [owner,     setOwner]     = useState<Person | "">("");
  const [rate,      setRate]      = useState("");

  const ownerGuests = people.filter(p => p.type === "owner");
  const paidGuests  = people.filter(p => p.type === "paid");

  function handleAdd() {
    if (!name.trim()) return;
    if (guestType === "owner") {
      addPerson({
        type: "owner",
        name: name.trim(),
        relationship: rel.trim() || undefined,
        owner: owner || undefined,
      });
    } else {
      addPerson({
        type: "paid",
        name: name.trim(),
        rate: rate ? parseFloat(rate) : undefined,
      });
    }
    resetForm();
  }

  function resetForm() {
    setName(""); setRel(""); setOwner(""); setRate("");
    setGuestType("owner"); setShowForm(false);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: "#f5f4f1" }}>
        <div style={{ height: 3, background: "#3b9e95", flexShrink: 0 }} />
        <Topbar />

        <main className="flex-1 overflow-y-auto" style={{ padding: "24px", background: "#f5f4f1", boxSizing: "border-box" }}>
          <div className="bg-white border border-[#e4e2dc] rounded-xl" style={{ padding: "20px", maxWidth: 580 }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: "#1c1c1a" }}>
                <IconUsers size={15} style={{ color: "#3b9e95" }} strokeWidth={2} />
                People
              </div>
              {!showForm && (
                <button
                  className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors duration-150"
                  style={{ color: "#3b9e95", background: "rgba(59,158,149,0.1)", border: "none", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(59,158,149,0.1)")}
                  onClick={() => setShowForm(true)}
                >
                  <IconPlus size={12} strokeWidth={2.5} />
                  Add person
                </button>
              )}
            </div>

            {/* Add form */}
            {showForm && (
              <div className="rounded-xl mb-5" style={{ padding: "16px", background: "#f9f8f6", border: "1px solid #e4e2dc" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12.5px] font-medium" style={{ color: "#1c1c1a" }}>New person</span>
                  <button
                    onClick={resetForm}
                    className="flex items-center justify-center rounded-full"
                    style={{ width: 24, height: 24, background: "#ede9e3", border: "none", cursor: "pointer", color: "#6b6960" }}
                  >
                    <IconX size={12} strokeWidth={2} />
                  </button>
                </div>

                {/* Type toggle */}
                <div className="flex gap-2 mb-3">
                  {(["owner", "paid"] as GuestType[]).map(t => (
                    <button
                      key={t}
                      className="flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150"
                      style={{
                        border: "none", cursor: "pointer",
                        background: guestType === t ? "#1c1c1a" : "#ede9e3",
                        color:      guestType === t ? "#fff"    : "#6b6960",
                      }}
                      onClick={() => setGuestType(t)}
                    >
                      {t === "owner" ? "Owner Guest" : "Paid Guest"}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2.5">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Name"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                    style={INPUT_STYLE}
                  />

                  {guestType === "owner" ? (
                    <>
                      <input
                        type="text"
                        value={rel}
                        onChange={e => setRel(e.target.value)}
                        placeholder="Relationship (e.g. Travis's sister)"
                        onKeyDown={e => e.key === "Enter" && handleAdd()}
                        style={INPUT_STYLE}
                      />
                      {/* Owner association */}
                      <div>
                        <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] mb-1.5" style={{ color: "#9e9b93" }}>Associated with</div>
                        <div className="flex gap-2">
                          {(["Travis", "Briana", ""] as const).map(o => {
                            const c = o === "Travis" ? TRAVIS : o === "Briana" ? BRIANA : null;
                            return (
                              <button
                                key={o || "none"}
                                className="flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150"
                                style={{
                                  border: "none", cursor: "pointer",
                                  background: owner === o ? (c?.bg ?? "#e4e2dc") : "#ede9e3",
                                  color:      owner === o ? (c?.text ?? "#1c1c1a") : "#6b6960",
                                }}
                                onClick={() => setOwner(o)}
                              >
                                {o || "Neither"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9e9b93", fontSize: 13, pointerEvents: "none" }}>$</span>
                      <input
                        type="number"
                        min={0}
                        value={rate}
                        onChange={e => setRate(e.target.value)}
                        placeholder="Rate per night (optional)"
                        onKeyDown={e => e.key === "Enter" && handleAdd()}
                        style={{ ...INPUT_STYLE, paddingLeft: 26 }}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 mt-1">
                    <button
                      className="flex-1 py-2 rounded-lg text-[12.5px] font-medium"
                      style={{ background: "#ede9e3", color: "#6b6960", border: "none", cursor: "pointer" }}
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 py-2 rounded-lg text-[12.5px] font-medium"
                      style={{
                        background: name.trim() ? "#3b9e95" : "#c8c5bf",
                        color: "#fff", border: "none",
                        cursor: name.trim() ? "pointer" : "not-allowed",
                      }}
                      onClick={handleAdd}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Owner Guests section */}
            <Section
              title="Owner Guests"
              subtitle="Free stays — count against owner allocation"
              empty="No owner guests yet."
            >
              {ownerGuests.map(({ id, name, relationship, owner }, idx) => (
                <PersonRow
                  key={id}
                  initials={name.slice(0, 2).toUpperCase()}
                  avatarBg={owner === "Travis" ? TRAVIS.bg : owner === "Briana" ? BRIANA.bg : "#f0ede8"}
                  avatarColor={owner === "Travis" ? TRAVIS.text : owner === "Briana" ? BRIANA.text : "#6b6960"}
                  name={name}
                  sub={[relationship, owner ? `${owner}'s guest` : ""].filter(Boolean).join(" · ")}
                  isLast={idx === ownerGuests.length - 1}
                  onRemove={() => removePerson(id)}
                />
              ))}
            </Section>

            <div style={{ height: 1, background: "#f0ede8", margin: "20px 0" }} />

            {/* Paid Guests section */}
            <Section
              title="Paid Guests"
              subtitle="Independent stays — not counted against owner allocation"
              empty="No paid guests yet."
            >
              {paidGuests.map(({ id, name, rate }, idx) => (
                <PersonRow
                  key={id}
                  initials={name.slice(0, 2).toUpperCase()}
                  avatarBg="rgba(201,168,76,0.15)"
                  avatarColor="#7a5e10"
                  name={name}
                  sub={rate ? `$${rate}/night` : "Rate varies"}
                  isLast={idx === paidGuests.length - 1}
                  onRemove={() => removePerson(id)}
                />
              ))}
            </Section>

          </div>
        </main>
      </div>
    </div>
  );
}

function Section({ title, subtitle, empty, children }: {
  title: string;
  subtitle: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div>
      <div className="mb-3">
        <div className="text-[12.5px] font-semibold" style={{ color: "#1c1c1a" }}>{title}</div>
        <div className="text-[11px] mt-0.5" style={{ color: "#9e9b93" }}>{subtitle}</div>
      </div>
      {hasChildren ? (
        <div className="flex flex-col">{children}</div>
      ) : (
        <div className="text-[12.5px] py-4" style={{ color: "#9e9b93" }}>{empty}</div>
      )}
    </div>
  );
}

function PersonRow({ initials, avatarBg, avatarColor, name, sub, isLast, onRemove }: {
  initials: string;
  avatarBg: string;
  avatarColor: string;
  name: string;
  sub: string;
  isLast: boolean;
  onRemove: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: isLast ? "none" : "1px solid #f0ede8" }}
    >
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0 text-[11px] font-semibold"
        style={{ width: 32, height: 32, background: avatarBg, color: avatarColor }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium" style={{ color: "#1c1c1a" }}>{name}</div>
        {sub && <div className="text-[11.5px] mt-0.5" style={{ color: "#9e9b93" }}>{sub}</div>}
      </div>
      <button
        className="flex items-center justify-center rounded-lg flex-shrink-0"
        style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "#c8c5bf" }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(185,50,40,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#b93228"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#c8c5bf"; }}
        onClick={onRemove}
      >
        <IconTrash size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
