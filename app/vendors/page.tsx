"use client";

import { useState } from "react";
import {
  IconAddressBook, IconPlus, IconPencil, IconTrash, IconX,
  IconPhone, IconMail, IconWorldWww, IconWind, IconDroplet,
  IconBug, IconBolt, IconTool, IconDots, IconNotes,
  IconReceipt2,
} from "@tabler/icons-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useVendors, type Vendor, type VendorCategory, VENDOR_CATEGORIES } from "@/context/VendorsContext";
import { useMaintenance, deriveStatus } from "@/context/MaintenanceContext";
import { useExpenses } from "@/context/ExpensesContext";
import { formatShortDate } from "@/lib/stayUtils";

const IN: React.CSSProperties = {
  width: "100%", padding: "9px 12px", border: "1px solid #e4e2dc",
  borderRadius: 8, background: "#fafaf9", color: "#1c1c1a",
  fontSize: 13, outline: "none",
  fontFamily: "var(--font-inter), sans-serif",
  boxSizing: "border-box",
};
const LBL: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 500,
  textTransform: "uppercase", letterSpacing: "0.08em",
  marginBottom: 6, color: "#9e9b93",
};

const CAT_ICONS: Record<VendorCategory, React.ElementType> = {
  HVAC: IconWind,
  Plumbing: IconDroplet,
  "Pest Control": IconBug,
  Electrical: IconBolt,
  Landscaping: IconTool,
  "General Contractor": IconTool,
  Other: IconDots,
};
const CAT_COLORS: Record<VendorCategory, { bg: string; text: string }> = {
  HVAC:               { bg: "rgba(59,158,149,0.12)",  text: "#16645d" },
  Plumbing:           { bg: "rgba(91,155,213,0.15)",  text: "#2d5a8a" },
  "Pest Control":     { bg: "rgba(192,128,64,0.13)",  text: "#7a4e10" },
  Electrical:         { bg: "rgba(201,168,76,0.15)",  text: "#7a5e10" },
  Landscaping:        { bg: "rgba(127,168,130,0.15)", text: "#3d5e3f" },
  "General Contractor": { bg: "rgba(155,111,163,0.13)", text: "#5a3460" },
  Other:              { bg: "#f0ede8",                text: "#6b6960" },
};

function fmtAmt(n: number) {
  return "$" + (n % 1 === 0 ? n.toLocaleString() : n.toFixed(2));
}
function fmtDate(s: string) {
  const d = new Date(s + "T12:00:00");
  return formatShortDate(s);
}

const STATUS_COLORS = {
  Overdue:  { bg: "rgba(185,50,40,0.1)",  text: "#b93228" },
  Upcoming: { bg: "#f0ede8",              text: "#9e9b93" },
  Done:     { bg: "rgba(59,158,149,0.1)", text: "#16645d" },
};

export default function VendorsPage() {
  const { vendors, addVendor, updateVendor, removeVendor } = useVendors();
  const { tasks } = useMaintenance();
  const { expenses } = useExpenses();

  // ── Detail drawer ──────────────────────────────────────────────────
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const activeVendor = activeVendorId ? vendors.find(v => v.id === activeVendorId) : null;

  const vendorTasks = activeVendorId
    ? [...tasks]
        .filter(t => t.vendorId === activeVendorId)
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    : [];

  const vendorExpenses = activeVendorId
    ? [...expenses]
        .filter(e => e.vendorId === activeVendorId)
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    : [];

  const vendorTotalPaid = vendorExpenses
    .filter(e => e.status === "Paid")
    .reduce((s, e) => s + e.amount, 0);

  // ── Add/Edit modal ─────────────────────────────────────────────────
  const [showModal,  setShowModal]  = useState(false);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [vName,      setVName]      = useState("");
  const [vCategory,  setVCategory]  = useState<VendorCategory>("HVAC");
  const [vPhone,     setVPhone]     = useState("");
  const [vEmail,     setVEmail]     = useState("");
  const [vWebsite,   setVWebsite]   = useState("");
  const [vNotes,     setVNotes]     = useState("");

  function openAdd() {
    setEditId(null);
    setVName(""); setVCategory("HVAC"); setVPhone(""); setVEmail(""); setVWebsite(""); setVNotes("");
    setShowModal(true);
  }

  function openEdit(v: Vendor) {
    setEditId(v.id);
    setVName(v.name); setVCategory(v.category); setVPhone(v.phone);
    setVEmail(v.email ?? ""); setVWebsite(v.website ?? ""); setVNotes(v.notes ?? "");
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); setEditId(null); }

  function handleSave() {
    if (!vName.trim() || !vPhone.trim()) return;
    const data = {
      name: vName.trim(), category: vCategory, phone: vPhone.trim(),
      email:   vEmail.trim()   || undefined,
      website: vWebsite.trim() || undefined,
      notes:   vNotes.trim()   || undefined,
    };
    if (editId) updateVendor(editId, data);
    else        addVendor(data);
    closeModal();
  }

  function handleDelete() {
    if (editId) {
      removeVendor(editId);
      if (activeVendorId === editId) setActiveVendorId(null);
    }
    closeModal();
  }

  const canSave = vName.trim() && vPhone.trim();

  // Group vendors by category
  const grouped = VENDOR_CATEGORIES
    .map(cat => ({ cat, list: vendors.filter(v => v.category === cat) }))
    .filter(g => g.list.length > 0);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: "#f5f4f1" }}>
        <div style={{ height: 3, background: "#3b9e95", flexShrink: 0 }} />
        <Topbar />

        <main className="flex-1 overflow-y-auto" style={{ padding: "24px", background: "#f5f4f1", boxSizing: "border-box" }}>
          <div className="bg-white border border-[#e4e2dc] rounded-xl" style={{ padding: "20px", maxWidth: 680 }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: "#1c1c1a" }}>
                <IconAddressBook size={15} style={{ color: "#3b9e95" }} strokeWidth={2} />
                Vendors
              </div>
              <button
                className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full"
                style={{ color: "#3b9e95", background: "rgba(59,158,149,0.1)", border: "none", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(59,158,149,0.1)")}
                onClick={openAdd}
              >
                <IconPlus size={12} strokeWidth={2.5} />
                Add vendor
              </button>
            </div>

            {/* Vendor list */}
            {vendors.length === 0 ? (
              <div className="text-center py-10" style={{ color: "#9e9b93", fontSize: 13 }}>
                No vendors yet. Add one to get started.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {grouped.map(({ cat, list }) => {
                  const CatIcon = CAT_ICONS[cat as VendorCategory];
                  const catCol  = CAT_COLORS[cat as VendorCategory];
                  return (
                    <div key={cat}>
                      {/* Category header */}
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="flex items-center justify-center rounded-lg flex-shrink-0"
                          style={{ width: 24, height: 24, background: catCol.bg, color: catCol.text }}
                        >
                          <CatIcon size={13} strokeWidth={2} />
                        </span>
                        <div className="text-[11.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: catCol.text }}>
                          {cat}
                        </div>
                      </div>

                      {/* Vendor cards */}
                      <div className="flex flex-col">
                        {list.map((vendor, idx) => {
                          const taskCount = tasks.filter(t => t.vendorId === vendor.id).length;
                          const expCount  = expenses.filter(e => e.vendorId === vendor.id).length;
                          const isLast    = idx === list.length - 1;
                          return (
                            <div
                              key={vendor.id}
                              className="flex items-start gap-3 py-3"
                              style={{ borderBottom: isLast ? "none" : "1px solid #f0ede8" }}
                            >
                              {/* Icon */}
                              <div
                                className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
                                style={{ width: 34, height: 34, background: catCol.bg, color: catCol.text }}
                              >
                                <CatIcon size={15} strokeWidth={2} />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <button
                                  className="text-[13px] font-semibold text-left"
                                  style={{ color: "#1c1c1a", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                  onClick={() => setActiveVendorId(v => v === vendor.id ? null : vendor.id)}
                                  onMouseEnter={e => (e.currentTarget.style.color = "#3b9e95")}
                                  onMouseLeave={e => (e.currentTarget.style.color = "#1c1c1a")}
                                >
                                  {vendor.name}
                                </button>

                                {/* Contact row */}
                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                  <a
                                    href={`tel:${vendor.phone}`}
                                    className="flex items-center gap-1 text-[11.5px]"
                                    style={{ color: "#6b6960", textDecoration: "none" }}
                                    onMouseEnter={e => (e.currentTarget.style.color = "#3b9e95")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "#6b6960")}
                                  >
                                    <IconPhone size={11} strokeWidth={2} />
                                    {vendor.phone}
                                  </a>
                                  {vendor.email && (
                                    <a
                                      href={`mailto:${vendor.email}`}
                                      className="flex items-center gap-1 text-[11.5px]"
                                      style={{ color: "#6b6960", textDecoration: "none" }}
                                      onMouseEnter={e => (e.currentTarget.style.color = "#3b9e95")}
                                      onMouseLeave={e => (e.currentTarget.style.color = "#6b6960")}
                                    >
                                      <IconMail size={11} strokeWidth={2} />
                                      {vendor.email}
                                    </a>
                                  )}
                                  {vendor.website && (
                                    <span className="flex items-center gap-1 text-[11.5px]" style={{ color: "#6b6960" }}>
                                      <IconWorldWww size={11} strokeWidth={2} />
                                      {vendor.website}
                                    </span>
                                  )}
                                </div>

                                {/* Notes */}
                                {vendor.notes && (
                                  <div className="text-[11px] mt-1 flex items-start gap-1" style={{ color: "#9e9b93" }}>
                                    <IconNotes size={11} strokeWidth={2} style={{ marginTop: 1, flexShrink: 0 }} />
                                    {vendor.notes}
                                  </div>
                                )}

                                {/* Link count chips */}
                                {(taskCount > 0 || expCount > 0) && (
                                  <div className="flex gap-1.5 mt-1.5">
                                    {taskCount > 0 && (
                                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#f0ede8", color: "#6b6960" }}>
                                        {taskCount} {taskCount === 1 ? "task" : "tasks"}
                                      </span>
                                    )}
                                    {expCount > 0 && (
                                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#f0ede8", color: "#6b6960" }}>
                                        {expCount} {expCount === 1 ? "expense" : "expenses"}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  className="flex items-center justify-center rounded-lg"
                                  style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "#c8c5bf" }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f0ede8"; (e.currentTarget as HTMLButtonElement).style.color = "#6b6960"; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#c8c5bf"; }}
                                  onClick={() => openEdit(vendor)}
                                  title="Edit"
                                >
                                  <IconPencil size={13} strokeWidth={2} />
                                </button>
                                <button
                                  className="flex items-center justify-center rounded-lg"
                                  style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "#c8c5bf" }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(185,50,40,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#b93228"; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#c8c5bf"; }}
                                  onClick={() => { removeVendor(vendor.id); if (activeVendorId === vendor.id) setActiveVendorId(null); }}
                                  title="Delete"
                                >
                                  <IconTrash size={13} strokeWidth={2} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Vendor detail drawer ───────────────────────────────────── */}
      {activeVendor && (
        <>
          <div
            className="fixed inset-0"
            style={{ background: "rgba(0,0,0,0.18)", zIndex: 40 }}
            onClick={() => setActiveVendorId(null)}
          />
          <div
            className="fixed top-0 right-0 h-full bg-white flex flex-col"
            style={{ width: 380, zIndex: 41, borderLeft: "1px solid #e4e2dc", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)" }}
          >
            {/* Drawer header */}
            <div className="flex-shrink-0" style={{ padding: "20px 20px 16px" }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div
                    className="inline-flex items-center gap-1.5 text-[10.5px] font-medium px-2.5 py-1 rounded-full mb-2"
                    style={{ background: CAT_COLORS[activeVendor.category].bg, color: CAT_COLORS[activeVendor.category].text }}
                  >
                    {(() => { const I = CAT_ICONS[activeVendor.category]; return <I size={11} strokeWidth={2} />; })()}
                    {activeVendor.category}
                  </div>
                  <div className="text-[16px] font-semibold leading-tight" style={{ color: "#1c1c1a" }}>{activeVendor.name}</div>

                  {/* Contact info */}
                  <div className="flex flex-col gap-1 mt-2">
                    <a href={`tel:${activeVendor.phone}`} className="flex items-center gap-1.5 text-[12px]" style={{ color: "#6b6960", textDecoration: "none" }}>
                      <IconPhone size={12} strokeWidth={2} />
                      {activeVendor.phone}
                    </a>
                    {activeVendor.email && (
                      <a href={`mailto:${activeVendor.email}`} className="flex items-center gap-1.5 text-[12px]" style={{ color: "#6b6960", textDecoration: "none" }}>
                        <IconMail size={12} strokeWidth={2} />
                        {activeVendor.email}
                      </a>
                    )}
                    {activeVendor.website && (
                      <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "#6b6960" }}>
                        <IconWorldWww size={12} strokeWidth={2} />
                        {activeVendor.website}
                      </span>
                    )}
                  </div>
                  {activeVendor.notes && (
                    <div className="text-[11.5px] mt-2" style={{ color: "#9e9b93" }}>{activeVendor.notes}</div>
                  )}
                </div>
                <button
                  onClick={() => setActiveVendorId(null)}
                  className="flex items-center justify-center rounded-full flex-shrink-0 ml-3"
                  style={{ width: 28, height: 28, background: "#f4f3f0", border: "none", cursor: "pointer", color: "#6b6960" }}
                >
                  <IconX size={14} strokeWidth={2} />
                </button>
              </div>

              {/* Total paid summary */}
              {vendorTotalPaid > 0 && (
                <div className="mt-4 rounded-xl" style={{ padding: "12px 14px", background: "rgba(59,158,149,0.06)", border: "1px solid rgba(59,158,149,0.15)" }}>
                  <div className="text-[10px] font-medium uppercase tracking-[0.08em] mb-1" style={{ color: "#3b9e95" }}>Total paid</div>
                  <div className="text-[20px] font-semibold" style={{ color: "#16645d" }}>{fmtAmt(vendorTotalPaid)}</div>
                </div>
              )}

              {/* Edit button */}
              <button
                className="flex items-center gap-1.5 text-[12px] font-medium mt-3 px-3 py-1.5 rounded-full"
                style={{ background: "#f0ede8", color: "#6b6960", border: "none", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#e4e2dc")}
                onMouseLeave={e => (e.currentTarget.style.background = "#f0ede8")}
                onClick={() => openEdit(activeVendor)}
              >
                <IconPencil size={12} strokeWidth={2} />
                Edit vendor
              </button>
            </div>

            <div style={{ height: 1, background: "#f0ede8", flexShrink: 0 }} />

            {/* Drawer body — linked tasks + expenses */}
            <div className="flex-1 overflow-y-auto">

              {/* Maintenance tasks */}
              <div style={{ padding: "16px 20px 0" }}>
                <div className="flex items-center gap-2 mb-3">
                  <IconTool size={13} strokeWidth={2} style={{ color: "#9e9b93" }} />
                  <div className="text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: "#6b6960" }}>
                    Maintenance ({vendorTasks.length})
                  </div>
                </div>
              </div>

              {vendorTasks.length === 0 ? (
                <div className="text-[12px] text-center py-4" style={{ color: "#9e9b93" }}>No linked tasks</div>
              ) : (
                <div style={{ padding: "0 20px" }}>
                  {vendorTasks.map((task, idx) => {
                    const status = deriveStatus(task);
                    const sc     = STATUS_COLORS[status];
                    const isLast = idx === vendorTasks.length - 1;
                    return (
                      <div
                        key={task.id}
                        className="py-3 flex items-start gap-3"
                        style={{ borderBottom: isLast ? "none" : "1px solid #f0ede8" }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-medium" style={{ color: "#1c1c1a" }}>{task.title}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: "#9e9b93" }}>
                            {task.manualDone
                              ? `Completed ${task.completedDate ? fmtDate(task.completedDate) : ""}${task.actualCost != null ? ` · ${fmtAmt(task.actualCost)}` : ""}`
                              : `Due ${fmtDate(task.dueDate)} · ${task.recurrence}`
                            }
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: sc.bg, color: sc.text }}
                        >
                          {status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ height: 1, background: "#f0ede8", margin: "8px 0" }} />

              {/* Expenses */}
              <div style={{ padding: "8px 20px 0" }}>
                <div className="flex items-center gap-2 mb-3">
                  <IconReceipt2 size={13} strokeWidth={2} style={{ color: "#9e9b93" }} />
                  <div className="text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: "#6b6960" }}>
                    Expenses ({vendorExpenses.length})
                  </div>
                </div>
              </div>

              {vendorExpenses.length === 0 ? (
                <div className="text-[12px] text-center py-4 pb-8" style={{ color: "#9e9b93" }}>No linked expenses</div>
              ) : (
                <div style={{ padding: "0 20px 20px" }}>
                  {vendorExpenses.map((exp, idx) => {
                    const isLast = idx === vendorExpenses.length - 1;
                    return (
                      <div
                        key={exp.id}
                        className="py-3 flex items-center gap-3"
                        style={{ borderBottom: isLast ? "none" : "1px solid #f0ede8" }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-medium" style={{ color: "#1c1c1a" }}>{exp.description}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: "#9e9b93" }}>
                            {exp.status === "Paid"
                              ? `Paid ${exp.datePaid ? fmtDate(exp.datePaid) : "—"}`
                              : `Due ${fmtDate(exp.dueDate)}`
                            }
                            {exp.category && ` · ${exp.category}`}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <div className="text-[13px] font-semibold" style={{ color: "#1c1c1a" }}>{fmtAmt(exp.amount)}</div>
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{
                              background: exp.status === "Paid" ? "rgba(59,158,149,0.1)" : "rgba(201,168,76,0.15)",
                              color:      exp.status === "Paid" ? "#16645d"               : "#7a5e10",
                            }}
                          >
                            {exp.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Add/Edit vendor modal ──────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.38)", zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="bg-white rounded-2xl"
            style={{ width: 420, maxHeight: "92vh", overflowY: "auto", padding: "28px", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="text-[15px] font-semibold" style={{ color: "#1c1c1a" }}>
                {editId ? "Edit vendor" : "New vendor"}
              </div>
              <button
                onClick={closeModal}
                className="flex items-center justify-center rounded-full"
                style={{ width: 28, height: 28, background: "#f4f3f0", border: "none", cursor: "pointer", color: "#6b6960" }}
              >
                <IconX size={14} strokeWidth={2} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label style={LBL}>Name</label>
                <input
                  type="text"
                  value={vName}
                  onChange={e => setVName(e.target.value)}
                  placeholder="e.g. Carolina Climate Control"
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                  style={IN}
                />
              </div>

              <div>
                <label style={LBL}>Category</label>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                  {VENDOR_CATEGORIES.map(cat => {
                    const Icon   = CAT_ICONS[cat];
                    const active = vCategory === cat;
                    return (
                      <button
                        key={cat}
                        className="flex items-center gap-1.5 rounded-lg text-[12px] font-medium"
                        style={{
                          padding: "7px 10px", border: "none", cursor: "pointer",
                          background: active ? "#1c1c1a" : "#f4f3f0",
                          color:      active ? "#fff"    : "#6b6960",
                          textAlign: "left",
                        }}
                        onClick={() => setVCategory(cat)}
                      >
                        <Icon size={13} strokeWidth={2} />
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={LBL}>Phone</label>
                <input
                  type="tel"
                  value={vPhone}
                  onChange={e => setVPhone(e.target.value)}
                  placeholder="e.g. 910-555-0100"
                  style={IN}
                />
              </div>

              <div>
                <label style={LBL}>Email <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                <input
                  type="email"
                  value={vEmail}
                  onChange={e => setVEmail(e.target.value)}
                  placeholder="e.g. hello@vendor.com"
                  style={IN}
                />
              </div>

              <div>
                <label style={LBL}>Website <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                <input
                  type="text"
                  value={vWebsite}
                  onChange={e => setVWebsite(e.target.value)}
                  placeholder="e.g. vendor.com"
                  style={IN}
                />
              </div>

              <div>
                <label style={LBL}>Notes <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                <textarea
                  value={vNotes}
                  onChange={e => setVNotes(e.target.value)}
                  placeholder="Service contract details, preferred contact, etc."
                  rows={2}
                  style={{ ...IN, resize: "none", lineHeight: 1.5 }}
                />
              </div>

              <div className="flex flex-col gap-2 mt-1">
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                    style={{ background: "#f4f3f0", color: "#6b6960", border: "none", cursor: "pointer" }}
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                    style={{
                      background: canSave ? "#1c1c1a" : "#c8c5bf",
                      color: "#fff", border: "none",
                      cursor: canSave ? "pointer" : "not-allowed",
                    }}
                    onClick={handleSave}
                  >
                    {editId ? "Save changes" : "Add vendor"}
                  </button>
                </div>
                {editId && (
                  <button
                    className="w-full py-2 rounded-xl text-[12.5px] font-medium"
                    style={{ background: "rgba(185,50,40,0.08)", color: "#b93228", border: "none", cursor: "pointer" }}
                    onClick={handleDelete}
                  >
                    Delete vendor
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
