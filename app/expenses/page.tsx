"use client";

import { useState } from "react";
import { IconReceipt2, IconPlus, IconPencil, IconTrash, IconX } from "@tabler/icons-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useExpenses, type Expense, type ExpenseCategory, type ExpensePaidBy, EXPENSE_CATEGORIES } from "@/context/ExpensesContext";
import { MONTHS, MONTHS_SHORT, TRAVIS, BRIANA } from "@/lib/stayUtils";

function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtAmt(n: number) {
  return "$" + (n % 1 === 0 ? n.toLocaleString() : n.toFixed(2));
}

function fmtDate(s: string) {
  const d = new Date(s + "T12:00:00");
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

const CAT_STYLE: Record<ExpenseCategory, { bg: string; text: string; bar: string }> = {
  Mortgage:      { bg: "rgba(59,158,149,0.12)",  text: "#16645d", bar: "#3b9e95" },
  Electric:      { bg: "rgba(201,168,76,0.15)",  text: "#7a5e10", bar: "#C9A84C" },
  Water:         { bg: "rgba(91,155,213,0.15)",  text: "#2d5a8a", bar: "#5b9bd5" },
  Insurance:     { bg: "rgba(127,168,130,0.15)", text: "#3d5e3f", bar: "#7FA882" },
  Maintenance:   { bg: "rgba(192,128,64,0.13)",  text: "#7a4e10", bar: "#c08040" },
  Miscellaneous: { bg: "rgba(155,111,163,0.13)", text: "#5a3460", bar: "#9b6fa3" },
  Other:         { bg: "#f0ede8",                text: "#6b6960", bar: "#9e9b93" },
};

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

export default function ExpensesPage() {
  const { expenses, addExpense, updateExpense, removeExpense } = useExpenses();

  const now = new Date();
  const cm  = now.getMonth() + 1;
  const cy  = now.getFullYear();

  const monthExpenses = expenses
    .filter(e => {
      const d = new Date(e.datePaid + "T12:00:00");
      return d.getFullYear() === cy && d.getMonth() + 1 === cm;
    })
    .sort((a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime());

  const totalMonth  = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const travisTotal = monthExpenses.filter(e => e.paidBy === "Travis").reduce((s, e) => s + e.amount, 0);
  const brianaTotal = monthExpenses.filter(e => e.paidBy === "Briana").reduce((s, e) => s + e.amount, 0);

  const breakdown = EXPENSE_CATEGORIES
    .map(cat => ({ cat, total: monthExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0) }))
    .filter(x => x.total > 0)
    .sort((a, b) => b.total - a.total);

  // Modal state
  const [showModal,    setShowModal]    = useState(false);
  const [editId,       setEditId]       = useState<string | null>(null);
  const [category,     setCategory]     = useState<ExpenseCategory>("Miscellaneous");
  const [description,  setDescription]  = useState("");
  const [amount,       setAmount]       = useState("");
  const [datePaid,     setDatePaid]     = useState(localDate());
  const [paidBy,       setPaidBy]       = useState<ExpensePaidBy>("Travis");
  const [notes,        setNotes]        = useState("");

  function openAdd() {
    setEditId(null);
    setCategory("Miscellaneous");
    setDescription("");
    setAmount("");
    setDatePaid(localDate());
    setPaidBy("Travis");
    setNotes("");
    setShowModal(true);
  }

  function openEdit(e: Expense) {
    setEditId(e.id);
    setCategory(e.category);
    setDescription(e.description);
    setAmount(String(e.amount));
    setDatePaid(e.datePaid);
    setPaidBy(e.paidBy);
    setNotes(e.notes ?? "");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
  }

  function handleSave() {
    if (!description.trim() || !amount) return;
    const data = {
      category, description: description.trim(),
      amount: parseFloat(amount), datePaid, paidBy,
      notes: notes.trim() || undefined,
    };
    if (editId) updateExpense(editId, data);
    else        addExpense(data);
    closeModal();
  }

  function handleDelete() {
    if (editId) removeExpense(editId);
    closeModal();
  }

  const canSave = description.trim() && amount && parseFloat(amount) > 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: "#f5f4f1" }}>
        <div style={{ height: 3, background: "#3b9e95", flexShrink: 0 }} />
        <Topbar />

        <main className="flex-1 overflow-y-auto" style={{ padding: "24px", background: "#f5f4f1", boxSizing: "border-box" }}>
          <div className="bg-white border border-[#e4e2dc] rounded-xl" style={{ padding: "20px", maxWidth: 720 }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: "#1c1c1a" }}>
                <IconReceipt2 size={15} style={{ color: "#3b9e95" }} strokeWidth={2} />
                Expenses
              </div>
              <button
                className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full"
                style={{ color: "#3b9e95", background: "rgba(59,158,149,0.1)", border: "none", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(59,158,149,0.1)")}
                onClick={openAdd}
              >
                <IconPlus size={12} strokeWidth={2.5} />
                Add expense
              </button>
            </div>

            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Total this month", value: fmtAmt(totalMonth), dot: "#9e9b93" },
                { label: "Travis paid",      value: fmtAmt(travisTotal), dot: TRAVIS.solid },
                { label: "Briana paid",      value: fmtAmt(brianaTotal), dot: BRIANA.solid },
              ].map(({ label, value, dot }) => (
                <div
                  key={label}
                  className="rounded-xl text-center"
                  style={{ padding: "16px 12px", background: "#f9f8f6", border: "1px solid #ede9e3" }}
                >
                  <div className="text-[10px] font-medium uppercase tracking-[0.08em] mb-2" style={{ color: "#9e9b93" }}>{label}</div>
                  <div className="text-[22px] font-semibold leading-none mb-1.5" style={{ color: "#1c1c1a" }}>{value}</div>
                  <span className="inline-block rounded-full" style={{ width: 7, height: 7, background: dot }} />
                </div>
              ))}
            </div>

            {/* Category breakdown */}
            {breakdown.length > 0 && (
              <>
                <div className="mb-3">
                  <div className="text-[12.5px] font-semibold mb-0.5" style={{ color: "#1c1c1a" }}>Category Breakdown</div>
                  <div className="text-[11px]" style={{ color: "#9e9b93" }}>{MONTHS[cm - 1]} {cy}</div>
                </div>
                <div className="flex flex-col gap-2.5 mb-6">
                  {breakdown.map(({ cat, total }) => {
                    const pct = totalMonth > 0 ? (total / totalMonth) * 100 : 0;
                    const c = CAT_STYLE[cat];
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <div className="text-[12px] font-medium" style={{ width: 112, color: "#1c1c1a", flexShrink: 0 }}>{cat}</div>
                        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: "#f0ede8" }}>
                          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: c.bar }} />
                        </div>
                        <div className="text-[12px] font-semibold" style={{ width: 72, textAlign: "right", color: "#1c1c1a", flexShrink: 0 }}>{fmtAmt(total)}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: "#f0ede8", marginBottom: 16 }} />

            {/* Expense list header */}
            <div className="text-[12.5px] font-semibold mb-3" style={{ color: "#1c1c1a" }}>
              {MONTHS[cm - 1]} {cy}
              <span className="ml-2 text-[11px] font-normal" style={{ color: "#9e9b93" }}>
                {monthExpenses.length} expense{monthExpenses.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Expense rows */}
            {monthExpenses.length === 0 ? (
              <div className="text-center py-8 text-[13px]" style={{ color: "#9e9b93" }}>
                No expenses logged for {MONTHS[cm - 1]}. Add one above.
              </div>
            ) : (
              <div className="flex flex-col">
                {monthExpenses.map((exp, idx) => {
                  const c = CAT_STYLE[exp.category];
                  const pb = exp.paidBy === "Travis" ? TRAVIS : BRIANA;
                  return (
                    <div
                      key={exp.id}
                      className="flex items-center gap-3 py-3"
                      style={{ borderBottom: idx < monthExpenses.length - 1 ? "1px solid #f0ede8" : "none" }}
                    >
                      {/* Category badge */}
                      <span
                        className="text-[10.5px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap"
                        style={{ background: c.bg, color: c.text }}
                      >
                        {exp.category}
                      </span>

                      {/* Description + date */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate" style={{ color: "#1c1c1a" }}>{exp.description}</div>
                        <div className="text-[11.5px] mt-0.5" style={{ color: "#9e9b93" }}>
                          {fmtDate(exp.datePaid)}
                          {exp.notes && <span> · {exp.notes}</span>}
                        </div>
                      </div>

                      {/* Paid by chip */}
                      <span
                        className="text-[10.5px] font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{ background: pb.bg, color: pb.text }}
                      >
                        {exp.paidBy}
                      </span>

                      {/* Amount */}
                      <div className="text-[13.5px] font-semibold flex-shrink-0" style={{ color: "#1c1c1a", minWidth: 60, textAlign: "right" }}>
                        {fmtAmt(exp.amount)}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          className="flex items-center justify-center rounded-lg"
                          style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "#c8c5bf" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f0ede8"; (e.currentTarget as HTMLButtonElement).style.color = "#6b6960"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#c8c5bf"; }}
                          onClick={() => openEdit(exp)}
                          title="Edit"
                        >
                          <IconPencil size={13} strokeWidth={2} />
                        </button>
                        <button
                          className="flex items-center justify-center rounded-lg"
                          style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "#c8c5bf" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(185,50,40,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#b93228"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#c8c5bf"; }}
                          onClick={() => removeExpense(exp.id)}
                          title="Delete"
                        >
                          <IconTrash size={13} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.38)", zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="bg-white rounded-2xl"
            style={{ width: 400, maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <div className="text-[15px] font-semibold" style={{ color: "#1c1c1a" }}>
                {editId ? "Edit expense" : "New expense"}
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
              {/* Category */}
              <div>
                <label style={LBL}>Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ExpenseCategory)}
                  style={{ ...IN, appearance: "auto" as any }}
                >
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label style={LBL}>Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Duke Energy bill"
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                  style={IN}
                />
              </div>

              {/* Amount + Date */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label style={LBL}>Amount</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9e9b93", fontSize: 13, pointerEvents: "none" }}>$</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      style={{ ...IN, paddingLeft: 26 }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label style={LBL}>Date paid</label>
                  <input
                    type="date"
                    value={datePaid}
                    onChange={e => setDatePaid(e.target.value)}
                    style={IN}
                  />
                </div>
              </div>

              {/* Paid by */}
              <div>
                <label style={LBL}>Paid by</label>
                <div className="flex gap-2">
                  {(["Travis", "Briana"] as ExpensePaidBy[]).map(p => {
                    const c = p === "Travis" ? TRAVIS : BRIANA;
                    return (
                      <button
                        key={p}
                        className="flex-1 py-2 rounded-xl text-[13px] font-medium transition-all duration-150"
                        style={{
                          border: "none", cursor: "pointer",
                          background: paidBy === p ? c.bg : "#f4f3f0",
                          color:      paidBy === p ? c.text : "#6b6960",
                        }}
                        onClick={() => setPaidBy(p)}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={LBL}>
                  Notes <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any additional details…"
                  rows={2}
                  style={{ ...IN, resize: "none", lineHeight: 1.5 }}
                />
              </div>

              {/* Actions */}
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
                    {editId ? "Save changes" : "Add expense"}
                  </button>
                </div>
                {editId && (
                  <button
                    className="w-full py-2 rounded-xl text-[12.5px] font-medium"
                    style={{ background: "rgba(185,50,40,0.08)", color: "#b93228", border: "none", cursor: "pointer" }}
                    onClick={handleDelete}
                  >
                    Delete expense
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
