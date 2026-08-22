"use client";

import { useState } from "react";
import { IconUsers, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { usePeople } from "@/context/PeopleContext";

export default function PeoplePage() {
  const { people, addPerson, removePerson } = usePeople();

  const [showForm, setShowForm] = useState(false);
  const [name,     setName]     = useState("");
  const [rel,      setRel]      = useState("");

  function handleAdd() {
    if (!name.trim()) return;
    addPerson({ name: name.trim(), relationship: rel.trim() });
    setName("");
    setRel("");
    setShowForm(false);
  }

  function handleCancel() {
    setName("");
    setRel("");
    setShowForm(false);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: "#f5f4f1" }}>
        <div style={{ height: 3, background: "#3b9e95", flexShrink: 0 }} />
        <Topbar />

        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: "24px", background: "#f5f4f1", boxSizing: "border-box" }}
        >
          <div className="bg-white border border-[#e4e2dc] rounded-xl" style={{ padding: "20px", maxWidth: 560 }}>
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
              <div
                className="rounded-xl mb-4"
                style={{ padding: "16px", background: "#f9f8f6", border: "1px solid #e4e2dc" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12.5px] font-medium" style={{ color: "#1c1c1a" }}>New person</span>
                  <button
                    onClick={handleCancel}
                    className="flex items-center justify-center rounded-full"
                    style={{ width: 24, height: 24, background: "#ede9e3", border: "none", cursor: "pointer", color: "#6b6960" }}
                  >
                    <IconX size={12} strokeWidth={2} />
                  </button>
                </div>
                <div className="flex flex-col gap-2.5">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Name"
                    autoFocus
                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                    style={{
                      width: "100%", padding: "8px 12px", border: "1px solid #e4e2dc",
                      borderRadius: 8, background: "#fff", color: "#1c1c1a",
                      fontSize: 13, outline: "none",
                      fontFamily: "var(--font-inter), sans-serif",
                      boxSizing: "border-box",
                    }}
                  />
                  <input
                    type="text"
                    value={rel}
                    onChange={e => setRel(e.target.value)}
                    placeholder="Relationship (e.g. Travis's sister)"
                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                    style={{
                      width: "100%", padding: "8px 12px", border: "1px solid #e4e2dc",
                      borderRadius: 8, background: "#fff", color: "#1c1c1a",
                      fontSize: 13, outline: "none",
                      fontFamily: "var(--font-inter), sans-serif",
                      boxSizing: "border-box",
                    }}
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      className="flex-1 py-2 rounded-lg text-[12.5px] font-medium"
                      style={{ background: "#ede9e3", color: "#6b6960", border: "none", cursor: "pointer" }}
                      onClick={handleCancel}
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

            {/* People list */}
            {people.length === 0 ? (
              <div className="text-center py-10 text-[13px]" style={{ color: "#9e9b93" }}>
                No people yet. Add someone to get started.
              </div>
            ) : (
              <div className="flex flex-col">
                {people.map(({ id, name, relationship }, idx) => (
                  <div
                    key={id}
                    className="flex items-center gap-3 py-3"
                    style={{ borderBottom: idx < people.length - 1 ? "1px solid #f0ede8" : "none" }}
                  >
                    {/* Avatar */}
                    <div
                      className="flex items-center justify-center rounded-full flex-shrink-0 text-[11px] font-semibold"
                      style={{ width: 32, height: 32, background: "#f0ede8", color: "#6b6960" }}
                    >
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium" style={{ color: "#1c1c1a" }}>{name}</div>
                      {relationship && (
                        <div className="text-[11.5px] mt-0.5" style={{ color: "#9e9b93" }}>{relationship}</div>
                      )}
                    </div>
                    <button
                      className="flex items-center justify-center rounded-lg flex-shrink-0"
                      style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "#c8c5bf" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(185,50,40,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#b93228"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#c8c5bf"; }}
                      onClick={() => removePerson(id)}
                      title="Remove"
                    >
                      <IconTrash size={13} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
