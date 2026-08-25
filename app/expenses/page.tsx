"use client";

import { useState, useEffect } from "react";
import {
  IconReceipt2, IconPlus, IconPencil, IconTrash, IconX,
  IconCheck, IconChevronLeft, IconChevronRight, IconCalendar,
  IconTag, IconRepeat,
} from "@tabler/icons-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import {
  useExpenses,
  type Expense,
  type ExpensePaidBy,
  type ExpenseStatus,
  type ExpenseRecurrence,
  type RecurringTemplate,
  DEFAULT_EXPENSE_CATEGORIES,
  EXPENSE_RECURRENCES,
  templateDueDate,
} from "@/context/ExpensesContext";
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
function fmtDateFull(s: string) {
  const d = new Date(s + "T12:00:00");
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const CAT_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Mortgage:      { bg: "rgba(59,158,149,0.12)",  text: "#16645d", bar: "#3b9e95" },
  Electric:      { bg: "rgba(201,168,76,0.15)",  text: "#7a5e10", bar: "#C9A84C" },
  Water:         { bg: "rgba(91,155,213,0.15)",  text: "#2d5a8a", bar: "#5b9bd5" },
  Insurance:     { bg: "rgba(127,168,130,0.15)", text: "#3d5e3f", bar: "#7FA882" },
  Maintenance:   { bg: "rgba(192,128,64,0.13)",  text: "#7a4e10", bar: "#c08040" },
  Miscellaneous: { bg: "rgba(155,111,163,0.13)", text: "#5a3460", bar: "#9b6fa3" },
  Other:         { bg: "#f0ede8",                text: "#6b6960", bar: "#9e9b93" },
};
const FALLBACK_CAT = { bg: "#f0ede8", text: "#6b6960", bar: "#9e9b93" };
function getCatStyle(cat: string) { return CAT_COLORS[cat] ?? FALLBACK_CAT; }

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

type TabFilter  = "All" | "Unpaid" | "Paid";
type PageView   = "expenses" | "recurring";

export default function ExpensesPage() {
  const {
    expenses, addExpense, updateExpense, removeExpense, markPaid,
    customCategories, addCategory, removeCategory,
    recurringTemplates, addTemplate, updateTemplate, removeTemplate,
  } = useExpenses();

  const now = new Date();
  const allCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...customCategories];

  // ── Page view ─────────────────────────────────────────────────────
  const [pageView, setPageView] = useState<PageView>("expenses");

  // ── Period filter ─────────────────────────────────────────────────
  const [filterMode,  setFilterMode]  = useState<"month" | "range">("month");
  const [filterYear,  setFilterYear]  = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [rangeStart,  setRangeStart]  = useState(localDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [rangeEnd,    setRangeEnd]    = useState(localDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)));

  function prevMonth() {
    if (filterMonth === 1) { setFilterMonth(12); setFilterYear(y => y - 1); }
    else setFilterMonth(m => m - 1);
  }
  function nextMonth() {
    if (filterMonth === 12) { setFilterMonth(1); setFilterYear(y => y + 1); }
    else setFilterMonth(m => m + 1);
  }

  function inPeriod(e: Expense): boolean {
    if (filterMode === "month") {
      const d = new Date(e.dueDate + "T12:00:00");
      return d.getFullYear() === filterYear && d.getMonth() + 1 === filterMonth;
    }
    if (!rangeStart || !rangeEnd) return true;
    return e.dueDate >= rangeStart && e.dueDate <= rangeEnd;
  }

  const periodLabel = filterMode === "month"
    ? `${MONTHS[filterMonth - 1]} ${filterYear}`
    : rangeStart && rangeEnd
      ? `${fmtDate(rangeStart)} – ${fmtDate(rangeEnd)}`
      : "Custom range";

  // ── Period-filtered data ──────────────────────────────────────────
  const periodExpenses = expenses.filter(inPeriod);
  const totalBilled = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid   = periodExpenses.filter(e => e.status === "Paid").reduce((s, e) => s + e.amount, 0);
  const totalUnpaid = totalBilled - totalPaid;

  const breakdown = allCategories
    .map(cat => ({ cat, total: periodExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0) }))
    .filter(x => x.total > 0)
    .sort((a, b) => b.total - a.total);

  const paidPieData = allCategories
    .map(cat => ({ cat, value: periodExpenses.filter(e => e.status === "Paid" && e.category === cat).reduce((s, e) => s + e.amount, 0) }))
    .filter(x => x.value > 0)
    .sort((a, b) => b.value - a.value);

  // ── Tab filter ────────────────────────────────────────────────────
  const [tabFilter, setTabFilter] = useState<TabFilter>("All");

  const unpaidList = periodExpenses
    .filter(e => e.status === "Unpaid")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const paidList = periodExpenses
    .filter(e => e.status === "Paid")
    .sort((a, b) => new Date(b.datePaid ?? b.dueDate).getTime() - new Date(a.datePaid ?? a.dueDate).getTime());

  const displayExpenses: Expense[] =
    tabFilter === "Unpaid" ? unpaidList :
    tabFilter === "Paid"   ? paidList   :
    [...unpaidList, ...paidList];

  // ── Category history drawer ───────────────────────────────────────
  const [historyCategory, setHistoryCategory] = useState<string | null>(null);
  const categoryHistory = historyCategory
    ? [...expenses]
        .filter(e => e.category === historyCategory)
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    : [];

  // ── Add/Edit expense modal ────────────────────────────────────────
  const [showModal,   setShowModal]   = useState(false);
  const [editId,      setEditId]      = useState<string | null>(null);
  const [category,    setCategory]    = useState(allCategories[0] ?? "Miscellaneous");
  const [description, setDescription] = useState("");
  const [amount,      setAmount]      = useState("");
  const [dueDate,     setDueDate]     = useState(localDate());
  const [recurrence,  setRecurrence]  = useState<ExpenseRecurrence>("One-time");
  const [modalStatus, setModalStatus] = useState<ExpenseStatus>("Unpaid");
  const [paidBy,      setPaidBy]      = useState<ExpensePaidBy>("Travis");
  const [datePaid,    setDatePaid]    = useState(localDate());
  const [notes,       setNotes]       = useState("");

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // ── Mark-as-Paid mini-modal ──────────────────────────────────────
  const [markingId,    setMarkingId]    = useState<string | null>(null);
  const [markPaidBy,   setMarkPaidBy]   = useState<ExpensePaidBy>("Travis");
  const [markPaidDate, setMarkPaidDate] = useState(localDate());

  function openAdd() {
    setEditId(null); setCategory(allCategories[0] ?? "Miscellaneous"); setDescription("");
    setAmount(""); setDueDate(localDate()); setRecurrence("One-time");
    setModalStatus("Unpaid"); setPaidBy("Travis"); setDatePaid(localDate());
    setNotes(""); setShowModal(true);
  }
  function openEdit(e: Expense) {
    setEditId(e.id); setCategory(e.category); setDescription(e.description);
    setAmount(String(e.amount)); setDueDate(e.dueDate); setRecurrence(e.recurrence);
    setModalStatus(e.status); setPaidBy(e.paidBy ?? "Travis");
    setDatePaid(e.datePaid ?? localDate()); setNotes(e.notes ?? "");
    setShowModal(true);
  }
  function closeModal() { setShowModal(false); setEditId(null); }
  function handleSave() {
    if (!description.trim() || !amount || !dueDate) return;
    const data: Omit<Expense, "id"> = {
      category, description: description.trim(), amount: parseFloat(amount),
      dueDate, status: modalStatus, recurrence,
      paidBy:   modalStatus === "Paid" ? paidBy   : undefined,
      datePaid: modalStatus === "Paid" ? datePaid  : undefined,
      notes: notes.trim() || undefined,
    };
    if (editId) updateExpense(editId, data);
    else        addExpense(data);
    closeModal();
  }
  function handleDelete() { if (editId) removeExpense(editId); closeModal(); }
  function openMarkPaid(exp: Expense) {
    setMarkingId(exp.id); setMarkPaidBy("Travis"); setMarkPaidDate(localDate());
  }
  function confirmMarkPaid() {
    if (markingId) { markPaid(markingId, markPaidBy, markPaidDate); setMarkingId(null); }
  }
  const canSave = description.trim() && amount && parseFloat(amount) > 0 && dueDate;

  // ── Recurring template modal ──────────────────────────────────────
  const [showTplModal,   setShowTplModal]   = useState(false);
  const [editTplId,      setEditTplId]      = useState<string | null>(null);
  const [tplName,        setTplName]        = useState("");
  const [tplCategory,    setTplCategory]    = useState(allCategories[0] ?? "Miscellaneous");
  const [tplAmount,      setTplAmount]      = useState("");
  const [tplDueDay,      setTplDueDay]      = useState("1");
  const [tplPaidBy,      setTplPaidBy]      = useState<ExpensePaidBy>("Travis");
  const [tplActive,      setTplActive]      = useState(true);

  function openAddTemplate() {
    setEditTplId(null);
    setTplName(""); setTplCategory(allCategories[0] ?? "Miscellaneous");
    setTplAmount(""); setTplDueDay("1"); setTplPaidBy("Travis"); setTplActive(true);
    setShowTplModal(true);
  }
  function openEditTemplate(t: RecurringTemplate) {
    setEditTplId(t.id);
    setTplName(t.name); setTplCategory(t.category);
    setTplAmount(String(t.defaultAmount)); setTplDueDay(String(t.dueDayOfMonth));
    setTplPaidBy(t.paidBy); setTplActive(t.active);
    setShowTplModal(true);
  }
  function closeTplModal() { setShowTplModal(false); setEditTplId(null); }

  function handleSaveTemplate() {
    const amt = parseFloat(tplAmount);
    const day = Math.max(1, Math.min(31, parseInt(tplDueDay) || 1));
    if (!tplName.trim() || !amt || amt <= 0) return;

    const data = {
      name: tplName.trim(),
      category: tplCategory,
      defaultAmount: amt,
      dueDayOfMonth: day,
      paidBy: tplPaidBy,
      active: tplActive,
    };

    if (editTplId) {
      const prev = recurringTemplates.find(t => t.id === editTplId);
      updateTemplate(editTplId, data);
      // Auto-generate for current month if template is being activated
      if (tplActive && prev && !prev.active) {
        autoGenForTemplate({ ...data, id: editTplId });
      }
    } else {
      addTemplate(data); // addTemplate handles auto-gen internally
    }
    closeTplModal();
  }

  function handleDeleteTemplate() {
    if (editTplId) removeTemplate(editTplId);
    closeTplModal();
  }

  function handleToggleTemplate(t: RecurringTemplate) {
    const newActive = !t.active;
    updateTemplate(t.id, { active: newActive });
    if (newActive) autoGenForTemplate(t);
  }

  function autoGenForTemplate(t: RecurringTemplate & { id: string }) {
    const n = new Date();
    const year  = n.getFullYear();
    const month = n.getMonth() + 1;
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
    const exists = expenses.some(e => e.templateId === t.id && e.dueDate.startsWith(monthPrefix));
    if (!exists) {
      addExpense({
        category:    t.category,
        description: t.name,
        amount:      t.defaultAmount,
        dueDate:     templateDueDate(t, year, month),
        status:      "Unpaid",
        recurrence:  "Monthly",
        templateId:  t.id,
      });
    }
  }

  const canSaveTpl = tplName.trim() && tplAmount && parseFloat(tplAmount) > 0;

  // ── Manage categories modal ───────────────────────────────────────
  const [showCatModal,  setShowCatModal]  = useState(false);
  const [newCatInput,   setNewCatInput]   = useState("");

  function handleAddCategory() {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    addCategory(trimmed);
    setNewCatInput("");
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: "#f5f4f1" }}>
        <div style={{ height: 3, background: "#3b9e95", flexShrink: 0 }} />
        <Topbar />

        <main className="flex-1 overflow-y-auto" style={{ padding: "24px", background: "#f5f4f1", boxSizing: "border-box" }}>
          <div className="bg-white border border-[#e4e2dc] rounded-xl" style={{ padding: "20px", maxWidth: 720 }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: "#1c1c1a" }}>
                <IconReceipt2 size={15} style={{ color: "#3b9e95" }} strokeWidth={2} />
                Expenses
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-1.5 text-[11.5px] font-medium px-3 py-1.5 rounded-full"
                  style={{ color: "#6b6960", background: "#f0ede8", border: "none", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#e4e2dc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#f0ede8")}
                  onClick={() => setShowCatModal(true)}
                >
                  <IconTag size={12} strokeWidth={2} />
                  Categories
                </button>
                <button
                  className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full"
                  style={{ color: "#3b9e95", background: "rgba(59,158,149,0.1)", border: "none", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(59,158,149,0.1)")}
                  onClick={pageView === "recurring" ? openAddTemplate : openAdd}
                >
                  <IconPlus size={12} strokeWidth={2.5} />
                  {pageView === "recurring" ? "Add template" : "Add expense"}
                </button>
              </div>
            </div>

            {/* View tabs */}
            <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "#f4f3f0" }}>
              {([
                { key: "expenses",  label: "Expenses",      icon: <IconReceipt2 size={12} strokeWidth={2} /> },
                { key: "recurring", label: "Recurring Bills", icon: <IconRepeat  size={12} strokeWidth={2} /> },
              ] as const).map(({ key, label, icon }) => (
                <button
                  key={key}
                  className="flex flex-1 items-center justify-center gap-1.5 text-[12px] font-medium py-1.5 rounded-lg"
                  style={{
                    background: pageView === key ? "#fff" : "transparent",
                    color:      pageView === key ? "#1c1c1a" : "#9e9b93",
                    border: "none", cursor: "pointer",
                    boxShadow: pageView === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s",
                  }}
                  onClick={() => setPageView(key)}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {/* ═══════════════ EXPENSES VIEW ═══════════════ */}
            {pageView === "expenses" && (
              <>
                {/* Period filter */}
                <div
                  className="flex items-center gap-3 mb-5 flex-wrap"
                  style={{ padding: "10px 14px", background: "#f9f8f6", borderRadius: 12, border: "1px solid #ede9e3" }}
                >
                  {filterMode === "month" ? (
                    <>
                      <div className="flex items-center gap-1 flex-1">
                        <button
                          onClick={prevMonth}
                          className="flex items-center justify-center rounded-lg"
                          style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "#6b6960" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#ede9e3")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}
                        >
                          <IconChevronLeft size={15} strokeWidth={2} />
                        </button>
                        <span className="text-[13px] font-semibold" style={{ color: "#1c1c1a", minWidth: 110, textAlign: "center" }}>
                          {periodLabel}
                        </span>
                        <button
                          onClick={nextMonth}
                          className="flex items-center justify-center rounded-lg"
                          style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "#6b6960" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#ede9e3")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}
                        >
                          <IconChevronRight size={15} strokeWidth={2} />
                        </button>
                      </div>
                      <button
                        onClick={() => setFilterMode("range")}
                        className="flex items-center gap-1.5 text-[11.5px] font-medium px-3 py-1.5 rounded-full"
                        style={{ background: "#ede9e3", color: "#6b6960", border: "none", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#e4e2dc")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#ede9e3")}
                      >
                        <IconCalendar size={12} strokeWidth={2} />
                        Custom range
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-1 flex-wrap">
                        <input
                          type="date" value={rangeStart}
                          onChange={e => setRangeStart(e.target.value)}
                          style={{ ...IN, width: "auto", flex: 1, minWidth: 130 }}
                        />
                        <span className="text-[12px]" style={{ color: "#9e9b93" }}>to</span>
                        <input
                          type="date" value={rangeEnd}
                          onChange={e => setRangeEnd(e.target.value)}
                          style={{ ...IN, width: "auto", flex: 1, minWidth: 130 }}
                        />
                      </div>
                      <button
                        onClick={() => setFilterMode("month")}
                        className="flex items-center gap-1.5 text-[11.5px] font-medium px-3 py-1.5 rounded-full"
                        style={{ background: "#1c1c1a", color: "#fff", border: "none", cursor: "pointer" }}
                      >
                        Month view
                      </button>
                    </>
                  )}
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Total billed", value: fmtAmt(totalBilled), dot: "#9e9b93" },
                    { label: "Total paid",   value: fmtAmt(totalPaid),   dot: "#3b9e95" },
                    { label: "Remaining",    value: fmtAmt(totalUnpaid), dot: totalUnpaid > 0 ? "#C9A84C" : "#9e9b93" },
                  ].map(({ label, value, dot }) => (
                    <div key={label} className="rounded-xl text-center" style={{ padding: "16px 12px", background: "#f9f8f6", border: "1px solid #ede9e3" }}>
                      <div className="text-[10px] font-medium uppercase tracking-[0.08em] mb-2" style={{ color: "#9e9b93" }}>{label}</div>
                      <div className="text-[22px] font-semibold leading-none mb-1.5" style={{ color: "#1c1c1a" }}>{value}</div>
                      <span className="inline-block rounded-full" style={{ width: 7, height: 7, background: dot }} />
                    </div>
                  ))}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1.5 mb-5">
                  {(["All", "Unpaid", "Paid"] as TabFilter[]).map(f => {
                    const count = f === "All" ? periodExpenses.length : periodExpenses.filter(e => e.status === f).length;
                    const active = tabFilter === f;
                    return (
                      <button
                        key={f}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium"
                        style={{
                          border: "none", cursor: "pointer",
                          background: active ? "#1c1c1a" : "#f0ede8",
                          color:      active ? "#fff"    : "#6b6960",
                        }}
                        onClick={() => setTabFilter(f)}
                      >
                        {f}
                        {count > 0 && (
                          <span style={{
                            marginLeft: 2, padding: "2px 6px", borderRadius: 10,
                            backgroundColor: active ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.08)",
                            fontSize: 10, fontWeight: 600,
                          }}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Pie chart */}
                {isMounted && paidPieData.length > 0 && (
                  <div className="mb-6" style={{ padding: "16px", background: "#f9f8f6", borderRadius: 12, border: "1px solid #ede9e3" }}>
                    <div className="text-[12.5px] font-semibold mb-0.5" style={{ color: "#1c1c1a" }}>Spending by Category</div>
                    <div className="text-[11px] mb-4" style={{ color: "#9e9b93" }}>{periodLabel} · paid only</div>
                    <div className="flex gap-6 items-center">
                      <div style={{ flexShrink: 0 }}>
                        <PieChart width={180} height={180}>
                          <Pie
                            data={paidPieData} cx={90} cy={90}
                            innerRadius={52} outerRadius={82}
                            paddingAngle={2} dataKey="value" strokeWidth={0}
                          >
                            {paidPieData.map((entry, i) => (
                              <Cell key={i} fill={getCatStyle(entry.cat).bar} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v: unknown) => [typeof v === "number" ? fmtAmt(v) : String(v ?? ""), ""] as [string, string]}
                            contentStyle={{ background: "#fff", border: "1px solid #e4e2dc", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                            itemStyle={{ color: "#1c1c1a" }}
                          />
                        </PieChart>
                      </div>
                      <div className="flex-1 flex flex-col gap-2.5">
                        {paidPieData.map(({ cat, value }) => {
                          const pct = totalPaid > 0 ? ((value / totalPaid) * 100).toFixed(0) : "0";
                          const c = getCatStyle(cat);
                          return (
                            <div key={cat} className="flex items-center gap-2">
                              <span className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: c.bar }} />
                              <button
                                className="text-[12px] font-medium text-left flex-1"
                                style={{ color: "#1c1c1a", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                onClick={() => setHistoryCategory(cat)}
                                onMouseEnter={e => (e.currentTarget.style.color = "#3b9e95")}
                                onMouseLeave={e => (e.currentTarget.style.color = "#1c1c1a")}
                              >
                                {cat}
                              </button>
                              <span className="text-[11px]" style={{ color: "#9e9b93" }}>{pct}%</span>
                              <span className="text-[12px] font-semibold" style={{ color: "#1c1c1a", minWidth: 56, textAlign: "right" }}>{fmtAmt(value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Category breakdown bars */}
                {breakdown.length > 0 && (
                  <>
                    <div className="mb-3">
                      <div className="text-[12.5px] font-semibold mb-0.5" style={{ color: "#1c1c1a" }}>Category Breakdown</div>
                      <div className="text-[11px]" style={{ color: "#9e9b93" }}>{periodLabel} · all expenses</div>
                    </div>
                    <div className="flex flex-col gap-2.5 mb-6">
                      {breakdown.map(({ cat, total }) => {
                        const pct = totalBilled > 0 ? (total / totalBilled) * 100 : 0;
                        const c = getCatStyle(cat);
                        return (
                          <div key={cat} className="flex items-center gap-3">
                            <button
                              className="text-[12px] font-medium text-left flex-shrink-0"
                              style={{ width: 112, color: "#1c1c1a", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                              onClick={() => setHistoryCategory(cat)}
                              onMouseEnter={e => (e.currentTarget.style.color = "#3b9e95")}
                              onMouseLeave={e => (e.currentTarget.style.color = "#1c1c1a")}
                            >
                              {cat}
                            </button>
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

                <div style={{ height: 1, background: "#f0ede8", marginBottom: 16 }} />

                {/* List header */}
                <div className="text-[12.5px] font-semibold mb-3" style={{ color: "#1c1c1a" }}>
                  {tabFilter === "All" ? "All Expenses" : tabFilter === "Unpaid" ? "Upcoming Bills" : "Payment History"}
                  <span className="ml-2 text-[11px] font-normal" style={{ color: "#9e9b93" }}>
                    {displayExpenses.length} {displayExpenses.length !== 1 ? "entries" : "entry"} · {periodLabel}
                  </span>
                </div>

                {/* Expense rows */}
                {displayExpenses.length === 0 ? (
                  <div className="text-center py-8 text-[13px]" style={{ color: "#9e9b93" }}>
                    {tabFilter === "Unpaid" ? `No upcoming bills in ${periodLabel}.` :
                     tabFilter === "Paid"   ? `No paid expenses in ${periodLabel}.` :
                     `No expenses in ${periodLabel}.`}
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {displayExpenses.map((exp, idx) => {
                      const c  = getCatStyle(exp.category);
                      const pb = exp.paidBy === "Travis" ? TRAVIS : BRIANA;
                      const isLast = idx === displayExpenses.length - 1;
                      return (
                        <div
                          key={exp.id}
                          className="flex items-center gap-3 py-3"
                          style={{ borderBottom: isLast ? "none" : "1px solid #f0ede8" }}
                        >
                          <button
                            className="text-[10.5px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap"
                            style={{ background: c.bg, color: c.text, border: "none", cursor: "pointer" }}
                            onClick={() => setHistoryCategory(exp.category)}
                            title={`View ${exp.category} history`}
                          >
                            {exp.category}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium truncate" style={{ color: "#1c1c1a" }}>{exp.description}</div>
                            <div className="text-[11.5px] mt-0.5" style={{ color: "#9e9b93" }}>
                              {exp.status === "Paid" ? <>Paid {exp.datePaid ? fmtDate(exp.datePaid) : "—"}</> : <>Due {fmtDate(exp.dueDate)}</>}
                              {exp.recurrence !== "One-time" && <span> · {exp.recurrence}</span>}
                              {exp.notes && <span> · {exp.notes}</span>}
                            </div>
                          </div>
                          {exp.status === "Paid" && exp.paidBy && (
                            <span
                              className="text-[10.5px] font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                              style={{ background: pb.bg, color: pb.text }}
                            >
                              {exp.paidBy}
                            </span>
                          )}
                          <div className="text-[13.5px] font-semibold flex-shrink-0" style={{ color: "#1c1c1a", minWidth: 60, textAlign: "right" }}>
                            {fmtAmt(exp.amount)}
                          </div>
                          {exp.status === "Unpaid" && (
                            <button
                              className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-full flex-shrink-0"
                              style={{ background: "rgba(59,158,149,0.1)", color: "#3b9e95", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.2)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(59,158,149,0.1)")}
                              onClick={() => openMarkPaid(exp)}
                            >
                              <IconCheck size={11} strokeWidth={2.5} />
                              Mark paid
                            </button>
                          )}
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
              </>
            )}

            {/* ═══════════════ RECURRING BILLS VIEW ═══════════════ */}
            {pageView === "recurring" && (
              <>
                <div className="text-[11.5px] mb-5" style={{ color: "#9e9b93" }}>
                  Active templates automatically create an unpaid expense entry at the start of each month.
                </div>

                {recurringTemplates.length === 0 ? (
                  <div className="text-center py-10 text-[13px]" style={{ color: "#9e9b93" }}>
                    No recurring bill templates yet.
                    <div className="mt-2 text-[12px]">Click "+ Add template" to create one.</div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {recurringTemplates.map((t, idx) => {
                      const c = getCatStyle(t.category);
                      const pb = t.paidBy === "Travis" ? TRAVIS : BRIANA;
                      const isLast = idx === recurringTemplates.length - 1;
                      return (
                        <div
                          key={t.id}
                          className="flex items-center gap-3 py-3"
                          style={{ borderBottom: isLast ? "none" : "1px solid #f0ede8", opacity: t.active ? 1 : 0.55 }}
                        >
                          {/* Active toggle */}
                          <button
                            className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              background: t.active ? "rgba(59,158,149,0.12)" : "#f0ede8",
                              color:      t.active ? "#3b9e95"               : "#9e9b93",
                              border: "none", cursor: "pointer",
                              minWidth: 52, textAlign: "center",
                            }}
                            onClick={() => handleToggleTemplate(t)}
                            title={t.active ? "Click to pause" : "Click to activate"}
                          >
                            {t.active ? "Active" : "Paused"}
                          </button>

                          {/* Name + meta */}
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium truncate" style={{ color: "#1c1c1a" }}>{t.name}</div>
                            <div className="text-[11px] mt-0.5" style={{ color: "#9e9b93" }}>
                              Due {ordinal(t.dueDayOfMonth)} of each month
                            </div>
                          </div>

                          {/* Category badge */}
                          <span
                            className="text-[10.5px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap"
                            style={{ background: c.bg, color: c.text }}
                          >
                            {t.category}
                          </span>

                          {/* Default amount */}
                          <div className="text-[13.5px] font-semibold flex-shrink-0" style={{ color: "#1c1c1a", minWidth: 60, textAlign: "right" }}>
                            {fmtAmt(t.defaultAmount)}
                          </div>

                          {/* Paid-by chip */}
                          <span
                            className="text-[10.5px] font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                            style={{ background: pb.bg, color: pb.text }}
                          >
                            {t.paidBy}
                          </span>

                          {/* Edit / Delete */}
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              className="flex items-center justify-center rounded-lg"
                              style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "#c8c5bf" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f0ede8"; (e.currentTarget as HTMLButtonElement).style.color = "#6b6960"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#c8c5bf"; }}
                              onClick={() => openEditTemplate(t)}
                              title="Edit"
                            >
                              <IconPencil size={13} strokeWidth={2} />
                            </button>
                            <button
                              className="flex items-center justify-center rounded-lg"
                              style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "#c8c5bf" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(185,50,40,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#b93228"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#c8c5bf"; }}
                              onClick={() => removeTemplate(t.id)}
                              title="Delete template"
                            >
                              <IconTrash size={13} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* ── Category history drawer ────────────────────────────────── */}
      {historyCategory && (
        <>
          <div
            className="fixed inset-0"
            style={{ background: "rgba(0,0,0,0.18)", zIndex: 40 }}
            onClick={() => setHistoryCategory(null)}
          />
          <div
            className="fixed top-0 right-0 h-full bg-white flex flex-col"
            style={{ width: 360, zIndex: 41, borderLeft: "1px solid #e4e2dc", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)" }}
          >
            <div className="flex items-start justify-between flex-shrink-0" style={{ padding: "20px 20px 16px" }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10.5px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: getCatStyle(historyCategory).bg, color: getCatStyle(historyCategory).text }}
                  >
                    {historyCategory}
                  </span>
                </div>
                <div className="text-[15px] font-semibold" style={{ color: "#1c1c1a" }}>{historyCategory} History</div>
                <div className="text-[11.5px] mt-0.5" style={{ color: "#9e9b93" }}>
                  {categoryHistory.length} {categoryHistory.length !== 1 ? "entries" : "entry"} · all time
                </div>
              </div>
              <button
                onClick={() => setHistoryCategory(null)}
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{ width: 28, height: 28, background: "#f4f3f0", border: "none", cursor: "pointer", color: "#6b6960", marginTop: 2 }}
              >
                <IconX size={14} strokeWidth={2} />
              </button>
            </div>
            <div style={{ height: 1, background: "#f0ede8" }} />
            <div className="flex-1 overflow-y-auto" style={{ padding: "8px 0" }}>
              {categoryHistory.length === 0 ? (
                <div className="text-center py-10 text-[13px]" style={{ color: "#9e9b93" }}>
                  No {historyCategory} expenses yet.
                </div>
              ) : (
                categoryHistory.map((exp, idx) => {
                  const pb = exp.paidBy === "Travis" ? TRAVIS : BRIANA;
                  const isLast = idx === categoryHistory.length - 1;
                  return (
                    <div
                      key={exp.id}
                      style={{ padding: "12px 20px", borderBottom: isLast ? "none" : "1px solid #f0ede8" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-[12.5px] font-medium" style={{ color: "#1c1c1a" }}>{exp.description}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: "#9e9b93" }}>
                            {exp.status === "Paid"
                              ? <>Paid {exp.datePaid ? fmtDate(exp.datePaid) : "—"} · due {fmtDate(exp.dueDate)}</>
                              : <>Due {fmtDateFull(exp.dueDate)}</>
                            }
                            {exp.recurrence !== "One-time" && <span> · {exp.recurrence}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <div className="text-[13px] font-semibold" style={{ color: "#1c1c1a" }}>{fmtAmt(exp.amount)}</div>
                          {exp.status === "Paid" && exp.paidBy ? (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: pb.bg, color: pb.text }}>
                              {exp.paidBy}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(201,168,76,0.15)", color: "#7a5e10" }}>
                              Unpaid
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Add/Edit expense modal ─────────────────────────────────── */}
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
              <div>
                <label style={LBL}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...IN, appearance: "auto" as never }}>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>Description</label>
                <input
                  type="text" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Duke Energy bill" autoFocus
                  onKeyDown={e => e.key === "Enter" && handleSave()} style={IN}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label style={LBL}>Amount</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9e9b93", fontSize: 13, pointerEvents: "none" }}>$</span>
                    <input type="number" min={0} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={{ ...IN, paddingLeft: 26 }} />
                  </div>
                </div>
                <div className="flex-1">
                  <label style={LBL}>Due date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={IN} />
                </div>
              </div>
              <div>
                <label style={LBL}>Recurrence</label>
                <select value={recurrence} onChange={e => setRecurrence(e.target.value as ExpenseRecurrence)} style={{ ...IN, appearance: "auto" as never }}>
                  {EXPENSE_RECURRENCES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>Status</label>
                <div className="flex gap-2">
                  {(["Unpaid", "Paid"] as ExpenseStatus[]).map(s => (
                    <button
                      key={s}
                      className="flex-1 py-2 rounded-xl text-[13px] font-medium"
                      style={{
                        border: "none", cursor: "pointer",
                        background: modalStatus === s ? s === "Paid" ? "rgba(59,158,149,0.12)" : "rgba(201,168,76,0.15)" : "#f4f3f0",
                        color: modalStatus === s ? s === "Paid" ? "#16645d" : "#7a5e10" : "#6b6960",
                      }}
                      onClick={() => setModalStatus(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {modalStatus === "Paid" && (
                <>
                  <div>
                    <label style={LBL}>Paid by</label>
                    <div className="flex gap-2">
                      {(["Travis", "Briana"] as ExpensePaidBy[]).map(p => {
                        const col = p === "Travis" ? TRAVIS : BRIANA;
                        return (
                          <button
                            key={p}
                            className="flex-1 py-2 rounded-xl text-[13px] font-medium"
                            style={{ border: "none", cursor: "pointer", background: paidBy === p ? col.bg : "#f4f3f0", color: paidBy === p ? col.text : "#6b6960" }}
                            onClick={() => setPaidBy(p)}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label style={LBL}>Date paid</label>
                    <input type="date" value={datePaid} onChange={e => setDatePaid(e.target.value)} style={IN} />
                  </div>
                </>
              )}
              <div>
                <label style={LBL}>Notes <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional details…" rows={2} style={{ ...IN, resize: "none", lineHeight: 1.5 }} />
              </div>
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 rounded-xl text-[13px] font-medium" style={{ background: "#f4f3f0", color: "#6b6960", border: "none", cursor: "pointer" }} onClick={closeModal}>Cancel</button>
                  <button
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                    style={{ background: canSave ? "#1c1c1a" : "#c8c5bf", color: "#fff", border: "none", cursor: canSave ? "pointer" : "not-allowed" }}
                    onClick={handleSave}
                  >
                    {editId ? "Save changes" : "Add expense"}
                  </button>
                </div>
                {editId && (
                  <button className="w-full py-2 rounded-xl text-[12.5px] font-medium" style={{ background: "rgba(185,50,40,0.08)", color: "#b93228", border: "none", cursor: "pointer" }} onClick={handleDelete}>
                    Delete expense
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark-as-Paid mini-modal ────────────────────────────────── */}
      {markingId && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.38)", zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) setMarkingId(null); }}
        >
          <div className="bg-white rounded-2xl" style={{ width: 320, padding: "24px", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="text-[14px] font-semibold" style={{ color: "#1c1c1a" }}>Mark as Paid</div>
              <button onClick={() => setMarkingId(null)} className="flex items-center justify-center rounded-full" style={{ width: 28, height: 28, background: "#f4f3f0", border: "none", cursor: "pointer", color: "#6b6960" }}>
                <IconX size={14} strokeWidth={2} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label style={LBL}>Who paid?</label>
                <div className="flex gap-2">
                  {(["Travis", "Briana"] as ExpensePaidBy[]).map(p => {
                    const col = p === "Travis" ? TRAVIS : BRIANA;
                    return (
                      <button
                        key={p}
                        className="flex-1 py-2 rounded-xl text-[13px] font-medium"
                        style={{ border: "none", cursor: "pointer", background: markPaidBy === p ? col.bg : "#f4f3f0", color: markPaidBy === p ? col.text : "#6b6960" }}
                        onClick={() => setMarkPaidBy(p)}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={LBL}>Date paid</label>
                <input type="date" value={markPaidDate} onChange={e => setMarkPaidDate(e.target.value)} style={IN} />
              </div>
              <div className="flex gap-2 mt-1">
                <button className="flex-1 py-2.5 rounded-xl text-[13px] font-medium" style={{ background: "#f4f3f0", color: "#6b6960", border: "none", cursor: "pointer" }} onClick={() => setMarkingId(null)}>Cancel</button>
                <button className="flex-1 py-2.5 rounded-xl text-[13px] font-medium" style={{ background: "#3b9e95", color: "#fff", border: "none", cursor: "pointer" }} onClick={confirmMarkPaid}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Recurring template modal ───────────────────────────────── */}
      {showTplModal && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.38)", zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) closeTplModal(); }}
        >
          <div
            className="bg-white rounded-2xl"
            style={{ width: 420, maxHeight: "92vh", overflowY: "auto", padding: "28px", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="text-[15px] font-semibold" style={{ color: "#1c1c1a" }}>
                {editTplId ? "Edit recurring bill" : "New recurring bill"}
              </div>
              <button
                onClick={closeTplModal}
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
                  type="text" value={tplName} onChange={e => setTplName(e.target.value)}
                  placeholder="e.g. Electric Bill" autoFocus style={IN}
                  onKeyDown={e => e.key === "Enter" && handleSaveTemplate()}
                />
              </div>
              <div>
                <label style={LBL}>Category</label>
                <select value={tplCategory} onChange={e => setTplCategory(e.target.value)} style={{ ...IN, appearance: "auto" as never }}>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label style={LBL}>Default amount</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9e9b93", fontSize: 13, pointerEvents: "none" }}>$</span>
                    <input
                      type="number" min={0} step="0.01" value={tplAmount}
                      onChange={e => setTplAmount(e.target.value)} placeholder="0.00"
                      style={{ ...IN, paddingLeft: 26 }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label style={LBL}>Due day of month</label>
                  <input
                    type="number" min={1} max={31} value={tplDueDay}
                    onChange={e => setTplDueDay(e.target.value)} placeholder="1"
                    style={IN}
                  />
                </div>
              </div>
              <div>
                <label style={LBL}>Paid by default</label>
                <div className="flex gap-2">
                  {(["Travis", "Briana"] as ExpensePaidBy[]).map(p => {
                    const col = p === "Travis" ? TRAVIS : BRIANA;
                    return (
                      <button
                        key={p}
                        className="flex-1 py-2 rounded-xl text-[13px] font-medium"
                        style={{ border: "none", cursor: "pointer", background: tplPaidBy === p ? col.bg : "#f4f3f0", color: tplPaidBy === p ? col.text : "#6b6960" }}
                        onClick={() => setTplPaidBy(p)}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <div className="text-[13px] font-medium" style={{ color: "#1c1c1a" }}>Active</div>
                  <div className="text-[11px]" style={{ color: "#9e9b93" }}>Auto-generate this month's entry when active</div>
                </div>
                <button
                  className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full"
                  style={{
                    background: tplActive ? "rgba(59,158,149,0.12)" : "#f0ede8",
                    color:      tplActive ? "#3b9e95"               : "#9e9b93",
                    border: "none", cursor: "pointer",
                    minWidth: 52, justifyContent: "center",
                  }}
                  onClick={() => setTplActive(v => !v)}
                >
                  {tplActive ? "On" : "Off"}
                </button>
              </div>
              <div className="flex flex-col gap-2 mt-1">
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 rounded-xl text-[13px] font-medium" style={{ background: "#f4f3f0", color: "#6b6960", border: "none", cursor: "pointer" }} onClick={closeTplModal}>
                    Cancel
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                    style={{ background: canSaveTpl ? "#1c1c1a" : "#c8c5bf", color: "#fff", border: "none", cursor: canSaveTpl ? "pointer" : "not-allowed" }}
                    onClick={handleSaveTemplate}
                  >
                    {editTplId ? "Save changes" : "Add template"}
                  </button>
                </div>
                {editTplId && (
                  <button className="w-full py-2 rounded-xl text-[12.5px] font-medium" style={{ background: "rgba(185,50,40,0.08)", color: "#b93228", border: "none", cursor: "pointer" }} onClick={handleDeleteTemplate}>
                    Delete template
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage categories modal ────────────────────────────────── */}
      {showCatModal && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.38)", zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) setShowCatModal(false); }}
        >
          <div
            className="bg-white rounded-2xl"
            style={{ width: 380, maxHeight: "80vh", overflowY: "auto", padding: "28px", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="text-[15px] font-semibold" style={{ color: "#1c1c1a" }}>Manage Categories</div>
              <button
                onClick={() => setShowCatModal(false)}
                className="flex items-center justify-center rounded-full"
                style={{ width: 28, height: 28, background: "#f4f3f0", border: "none", cursor: "pointer", color: "#6b6960" }}
              >
                <IconX size={14} strokeWidth={2} />
              </button>
            </div>

            {/* Default categories */}
            <div className="mb-5">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-2.5" style={{ color: "#9e9b93" }}>Default</div>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_EXPENSE_CATEGORIES.map(cat => {
                  const c = getCatStyle(cat);
                  return (
                    <span key={cat} className="text-[11.5px] font-medium px-2.5 py-1 rounded-full" style={{ background: c.bg, color: c.text }}>
                      {cat}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Custom categories */}
            {customCategories.length > 0 && (
              <div className="mb-5">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-2.5" style={{ color: "#9e9b93" }}>Custom</div>
                <div className="flex flex-col gap-2">
                  {customCategories.map(cat => {
                    const inUse = expenses.some(e => e.category === cat);
                    return (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-[13px] font-medium" style={{ color: "#1c1c1a" }}>{cat}</span>
                        <button
                          className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                          style={{
                            background: inUse ? "#f4f3f0" : "rgba(185,50,40,0.08)",
                            color:      inUse ? "#c8c5bf" : "#b93228",
                            border: "none",
                            cursor: inUse ? "default" : "pointer",
                          }}
                          onClick={() => { if (!inUse) removeCategory(cat); }}
                          title={inUse ? "Category is used by existing expenses" : "Delete category"}
                          disabled={inUse}
                        >
                          {inUse ? "In use" : "Delete"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add new category */}
            <div style={{ height: 1, background: "#f0ede8", marginBottom: 16 }} />
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-2.5" style={{ color: "#9e9b93" }}>Add Custom Category</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatInput}
                onChange={e => setNewCatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddCategory()}
                placeholder="Category name"
                style={{ ...IN, flex: 1 }}
              />
              <button
                onClick={handleAddCategory}
                style={{
                  background: newCatInput.trim() ? "#1c1c1a" : "#c8c5bf",
                  color: "#fff", border: "none", borderRadius: 8,
                  padding: "9px 16px", cursor: newCatInput.trim() ? "pointer" : "default",
                  fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
                  fontFamily: "var(--font-inter), sans-serif",
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
