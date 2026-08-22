"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useRevenue, PAYMENT_STATUSES, PAYMENT_METHODS, type RevenueEntry, type PaymentStatus, type PaymentMethod, type StayPaymentInfo } from "@/context/RevenueContext";
import { useStays } from "@/context/StaysContext";
import { MONTHS_SHORT } from "@/lib/stayUtils";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
  IconX,
  IconCheck,
} from "@tabler/icons-react";

function fmtAmt(n: number) {
  return "$" + (n % 1 === 0 ? n.toLocaleString() : n.toFixed(2));
}
function fmtDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${MONTHS_SHORT[parseInt(m) - 1]} ${parseInt(day)}, ${y}`;
}
function parseLocalDate(s: string) {
  return new Date(s + "T12:00:00");
}

const STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string; border: string }> = {
  Paid:     { bg: "rgba(59,158,149,0.1)",   text: "#1f7068", border: "rgba(59,158,149,0.25)" },
  Pending:  { bg: "rgba(201,168,76,0.1)",   text: "#7a5e10", border: "rgba(201,168,76,0.3)"  },
  Refunded: { bg: "rgba(158,155,147,0.12)", text: "#5c5a55", border: "rgba(158,155,147,0.3)" },
};

type UnifiedEntry = {
  key:        string;
  source:     "stay" | "manual";
  stayId?:    string;
  manualId?:  string;
  guestName:  string;
  checkIn:    string;
  checkOut:   string;
  nights:     number;
  nightlyRate: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?:     string;
};

type FilterMode = "month" | "range";
type TabFilter  = "All" | "Pending" | "Paid" | "Refunded";

const EMPTY_FORM = {
  guestName:     "",
  checkIn:       "",
  checkOut:      "",
  nights:        1,
  nightlyRate:   0,
  totalAmount:   0,
  paymentStatus: "Pending" as PaymentStatus,
  paymentMethod: "Cash" as PaymentMethod,
  notes:         "",
};

export default function RevenuePage() {
  const { entries, addEntry, updateEntry, removeEntry, stayPayments, updateStayPayment } = useRevenue();
  const { stays } = useStays();

  const now = new Date();
  const [filterMode, setFilterMode]   = useState<FilterMode>("month");
  const [filterYear, setFilterYear]   = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [rangeStart, setRangeStart]   = useState("");
  const [rangeEnd, setRangeEnd]       = useState("");
  const [tab, setTab]                 = useState<TabFilter>("All");

  // Modal state
  const [showAdd,    setShowAdd]    = useState(false);
  const [editEntry,  setEditEntry]  = useState<UnifiedEntry | null>(null);
  const [deleteKey,  setDeleteKey]  = useState<string | null>(null);
  const [form,       setForm]       = useState({ ...EMPTY_FORM });

  // Build unified list
  const stayEntries: UnifiedEntry[] = stays
    .filter(s => s.cost > 0)
    .map(s => {
      const payment = stayPayments[s.id] ?? { paymentStatus: "Pending" as PaymentStatus, paymentMethod: "Cash" as PaymentMethod };
      const checkOut = (() => {
        const d = parseLocalDate(s.startDate);
        d.setDate(d.getDate() + s.nights);
        return d.toISOString().split("T")[0];
      })();
      const nights = s.nights;
      const nightlyRate = Math.round(s.cost / nights);
      return {
        key:           s.id,
        source:        "stay" as const,
        stayId:        s.id,
        guestName:     s.guest || "Paid Guest",
        checkIn:       s.startDate,
        checkOut,
        nights,
        nightlyRate,
        totalAmount:   s.cost,
        paymentStatus: payment.paymentStatus,
        paymentMethod: payment.paymentMethod,
        notes:         payment.notes,
      };
    });

  const manualEntries: UnifiedEntry[] = entries.map(e => ({
    key:           e.id,
    source:        "manual" as const,
    manualId:      e.id,
    guestName:     e.guestName,
    checkIn:       e.checkIn,
    checkOut:      e.checkOut,
    nights:        e.nights,
    nightlyRate:   e.nightlyRate,
    totalAmount:   e.totalAmount,
    paymentStatus: e.paymentStatus,
    paymentMethod: e.paymentMethod,
    notes:         e.notes,
  }));

  const allEntries: UnifiedEntry[] = [...stayEntries, ...manualEntries].sort(
    (a, b) => b.checkIn.localeCompare(a.checkIn)
  );

  // Period filter
  function inPeriod(e: UnifiedEntry) {
    if (filterMode === "month") {
      const d = parseLocalDate(e.checkIn);
      return d.getFullYear() === filterYear && d.getMonth() + 1 === filterMonth;
    }
    if (!rangeStart || !rangeEnd) return true;
    return e.checkIn >= rangeStart && e.checkIn <= rangeEnd;
  }

  const periodEntries = allEntries.filter(inPeriod);
  const tabEntries    = periodEntries.filter(e => tab === "All" || e.paymentStatus === tab);

  // Summary stats
  const paidRevenue    = periodEntries.filter(e => e.paymentStatus === "Paid").reduce((s, e) => s + e.totalAmount, 0);
  const pendingRevenue = periodEntries.filter(e => e.paymentStatus === "Pending").reduce((s, e) => s + e.totalAmount, 0);

  const ytdRevenue = allEntries
    .filter(e => {
      const d = parseLocalDate(e.checkIn);
      return d.getFullYear() === now.getFullYear() && e.paymentStatus === "Paid";
    })
    .reduce((s, e) => s + e.totalAmount, 0);

  // Tab counts
  const tabCount = (t: TabFilter) =>
    t === "All" ? periodEntries.length : periodEntries.filter(e => e.paymentStatus === t).length;

  // Period navigation
  function prevPeriod() {
    if (filterMode !== "month") return;
    if (filterMonth === 1) { setFilterMonth(12); setFilterYear(y => y - 1); }
    else setFilterMonth(m => m - 1);
  }
  function nextPeriod() {
    if (filterMode !== "month") return;
    if (filterMonth === 12) { setFilterMonth(1); setFilterYear(y => y + 1); }
    else setFilterMonth(m => m + 1);
  }

  // Form helpers
  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setShowAdd(true);
  }
  function openEdit(e: UnifiedEntry) {
    setForm({
      guestName:     e.guestName,
      checkIn:       e.checkIn,
      checkOut:      e.checkOut,
      nights:        e.nights,
      nightlyRate:   e.nightlyRate,
      totalAmount:   e.totalAmount,
      paymentStatus: e.paymentStatus,
      paymentMethod: e.paymentMethod,
      notes:         e.notes ?? "",
    });
    setEditEntry(e);
  }
  function closeModals() {
    setShowAdd(false);
    setEditEntry(null);
    setDeleteKey(null);
  }

  function recalcTotal(nights: number, rate: number) {
    return nights * rate;
  }

  function handleFormChange(field: string, value: string | number) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === "nights" || field === "nightlyRate") {
        next.totalAmount = recalcTotal(
          field === "nights" ? Number(value) : prev.nights,
          field === "nightlyRate" ? Number(value) : prev.nightlyRate
        );
      }
      // Auto-compute checkout from checkIn + nights
      if (field === "checkIn" || field === "nights") {
        const ci = field === "checkIn" ? String(value) : prev.checkIn;
        const n  = field === "nights" ? Number(value) : prev.nights;
        if (ci) {
          const d = parseLocalDate(ci);
          d.setDate(d.getDate() + n);
          next.checkOut = d.toISOString().split("T")[0];
        }
      }
      return next;
    });
  }

  function saveAdd() {
    if (!form.guestName || !form.checkIn) return;
    addEntry({
      guestName:     form.guestName,
      checkIn:       form.checkIn,
      checkOut:      form.checkOut,
      nights:        form.nights,
      nightlyRate:   form.nightlyRate,
      totalAmount:   form.totalAmount,
      paymentStatus: form.paymentStatus,
      paymentMethod: form.paymentMethod,
      notes:         form.notes || undefined,
    });
    closeModals();
  }

  function saveEdit() {
    if (!editEntry) return;
    if (editEntry.source === "manual" && editEntry.manualId) {
      updateEntry(editEntry.manualId, {
        guestName:     form.guestName,
        checkIn:       form.checkIn,
        checkOut:      form.checkOut,
        nights:        form.nights,
        nightlyRate:   form.nightlyRate,
        totalAmount:   form.totalAmount,
        paymentStatus: form.paymentStatus,
        paymentMethod: form.paymentMethod,
        notes:         form.notes || undefined,
      });
    } else if (editEntry.source === "stay" && editEntry.stayId) {
      // For stay-derived: only update payment info
      updateStayPayment(editEntry.stayId, {
        paymentStatus: form.paymentStatus,
        paymentMethod: form.paymentMethod,
        notes:         form.notes || undefined,
      });
    }
    closeModals();
  }

  function confirmDelete() {
    if (!deleteKey) return;
    const entry = allEntries.find(e => e.key === deleteKey);
    if (entry?.source === "manual" && entry.manualId) {
      removeEntry(entry.manualId);
    }
    closeModals();
  }

  const isStayEdit = editEntry?.source === "stay";

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: "#f5f4f1" }}>
        <div style={{ height: 3, background: "#3b9e95", flexShrink: 0 }} />
        <Topbar />

        <main
          className="flex-1 flex flex-col gap-4"
          style={{ padding: "24px", overflow: "hidden", overflowY: "auto", background: "#f5f4f1" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[20px] font-semibold" style={{ color: "#1c1c1a" }}>Revenue</h1>
              <p className="text-[13px] mt-0.5" style={{ color: "#9e9b93" }}>
                Paid stays and rental income
              </p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-150"
              style={{ background: "#3b9e95", color: "#fff", border: "none", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#2f8a82")}
              onMouseLeave={e => (e.currentTarget.style.background = "#3b9e95")}
            >
              <IconPlus size={15} strokeWidth={2} />
              Add Entry
            </button>
          </div>

          {/* Period filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <button
                onClick={prevPeriod}
                className="flex items-center justify-center rounded-lg transition-colors"
                style={{ width: 30, height: 30, background: "#fff", border: "1px solid #e4e2dc", cursor: "pointer", color: "#9e9b93" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f5f4f1")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
              >
                <IconChevronLeft size={14} />
              </button>
              <div
                className="flex items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium"
                style={{ height: 30, background: "#fff", border: "1px solid #e4e2dc", color: "#1c1c1a", minWidth: 110, justifyContent: "center" }}
              >
                <IconCalendar size={13} style={{ color: "#9e9b93" }} />
                {filterMode === "month"
                  ? `${MONTHS_SHORT[filterMonth - 1]} ${filterYear}`
                  : rangeStart && rangeEnd
                    ? `${fmtDate(rangeStart)} – ${fmtDate(rangeEnd)}`
                    : "Custom range"}
              </div>
              <button
                onClick={nextPeriod}
                className="flex items-center justify-center rounded-lg transition-colors"
                style={{ width: 30, height: 30, background: "#fff", border: "1px solid #e4e2dc", cursor: "pointer", color: "#9e9b93" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f5f4f1")}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
              >
                <IconChevronRight size={14} />
              </button>
            </div>

            <button
              onClick={() => setFilterMode(m => m === "month" ? "range" : "month")}
              className="text-[12px] rounded-lg px-3 transition-colors"
              style={{
                height: 30, background: filterMode === "range" ? "#3b9e95" : "#fff",
                border: "1px solid " + (filterMode === "range" ? "#3b9e95" : "#e4e2dc"),
                color: filterMode === "range" ? "#fff" : "#9e9b93", cursor: "pointer",
              }}
            >
              Custom range
            </button>

            {filterMode === "range" && (
              <div className="flex items-center gap-2">
                <input
                  type="date" value={rangeStart}
                  onChange={e => setRangeStart(e.target.value)}
                  className="text-[12px] rounded-lg px-2"
                  style={{ height: 30, border: "1px solid #e4e2dc", background: "#fff", color: "#1c1c1a" }}
                />
                <span style={{ color: "#9e9b93", fontSize: 12 }}>to</span>
                <input
                  type="date" value={rangeEnd}
                  onChange={e => setRangeEnd(e.target.value)}
                  className="text-[12px] rounded-lg px-2"
                  style={{ height: 30, border: "1px solid #e4e2dc", background: "#fff", color: "#1c1c1a" }}
                />
              </div>
            )}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Period Revenue", value: fmtAmt(paidRevenue),    sub: "paid this period",    dot: paidRevenue > 0 ? "#3b9e95" : "#9e9b93" },
              { label: "Pending",        value: fmtAmt(pendingRevenue), sub: "awaiting collection", dot: pendingRevenue > 0 ? "#C9A84C" : "#9e9b93" },
              { label: "YTD Revenue",    value: fmtAmt(ytdRevenue),     sub: `${now.getFullYear()} paid total`, dot: "#3b9e95" },
            ].map(({ label, value, sub, dot }) => (
              <div
                key={label}
                className="bg-white rounded-xl flex flex-col items-center text-center"
                style={{ border: "1px solid #e4e2dc", padding: "20px" }}
              >
                <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] mb-3" style={{ color: "#9e9b93" }}>
                  {label}
                </div>
                <div className="text-[28px] font-semibold leading-none mb-3" style={{ color: "#1c1c1a" }}>
                  {value}
                </div>
                <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#6b6960" }}>
                  <span className="rounded-full" style={{ width: 7, height: 7, background: dot, flexShrink: 0 }} />
                  {sub}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {(["All", "Pending", "Paid", "Refunded"] as TabFilter[]).map(t => {
              const active = tab === t;
              const count  = tabCount(t);
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex items-center gap-1.5 rounded-lg px-3 text-[13px] transition-all duration-150"
                  style={{
                    height: 32, cursor: "pointer", border: "none",
                    background: active ? "#3b9e95" : "transparent",
                    color:      active ? "#fff" : "#9e9b93",
                    fontWeight: active ? 500 : 400,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  {t}
                  {count > 0 && (
                    <span
                      className="flex items-center justify-center rounded-full text-[10px] font-semibold"
                      style={{
                        minWidth: 18, height: 18, padding: "0 5px",
                        background: active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.07)",
                        color:      active ? "#fff" : "#6b6960",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Entries list */}
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            {tabEntries.length === 0 ? (
              <div
                className="flex-1 flex items-center justify-center rounded-xl"
                style={{ background: "#fff", border: "1px solid #e4e2dc", minHeight: 120 }}
              >
                <span className="text-[13px]" style={{ color: "#9e9b93" }}>
                  No revenue entries for this period
                </span>
              </div>
            ) : (
              tabEntries.map(entry => {
                const sc = STATUS_COLORS[entry.paymentStatus];
                return (
                  <div
                    key={entry.key}
                    className="bg-white rounded-xl flex items-center gap-4"
                    style={{ border: "1px solid #e4e2dc", padding: "14px 18px" }}
                  >
                    {/* Date column */}
                    <div className="flex flex-col items-center justify-center rounded-lg flex-shrink-0"
                      style={{ width: 44, height: 44, background: "#f5f4f1" }}>
                      <div className="text-[10px] uppercase font-semibold" style={{ color: "#9e9b93" }}>
                        {MONTHS_SHORT[parseInt(entry.checkIn.split("-")[1]) - 1]}
                      </div>
                      <div className="text-[17px] font-semibold leading-none" style={{ color: "#1c1c1a" }}>
                        {parseInt(entry.checkIn.split("-")[2])}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[14px] font-medium truncate" style={{ color: "#1c1c1a" }}>
                          {entry.guestName}
                        </span>
                        {entry.source === "stay" && (
                          <span
                            className="text-[10px] font-medium rounded px-1.5"
                            style={{ background: "rgba(59,158,149,0.1)", color: "#1f7068", border: "1px solid rgba(59,158,149,0.2)" }}
                          >
                            From Calendar
                          </span>
                        )}
                      </div>
                      <div className="text-[12px]" style={{ color: "#9e9b93" }}>
                        {fmtDate(entry.checkIn)} – {fmtDate(entry.checkOut)} · {entry.nights} night{entry.nights !== 1 ? "s" : ""} · {fmtAmt(entry.nightlyRate)}/night
                      </div>
                    </div>

                    {/* Payment method */}
                    <div className="text-[12px] font-medium" style={{ color: "#6b6960" }}>
                      {entry.paymentMethod}
                    </div>

                    {/* Status badge */}
                    <div
                      className="flex items-center rounded-full text-[11px] font-semibold"
                      style={{ padding: "3px 10px", background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                    >
                      {entry.paymentStatus}
                    </div>

                    {/* Total */}
                    <div className="text-[15px] font-semibold flex-shrink-0" style={{ color: "#1c1c1a", minWidth: 72, textAlign: "right" }}>
                      {fmtAmt(entry.totalAmount)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(entry)}
                        className="flex items-center justify-center rounded-lg transition-colors"
                        style={{ width: 30, height: 30, background: "transparent", border: "1px solid #e4e2dc", cursor: "pointer", color: "#9e9b93" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f5f4f1")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <IconEdit size={13} strokeWidth={1.75} />
                      </button>
                      {entry.source === "manual" && (
                        <button
                          onClick={() => setDeleteKey(entry.key)}
                          className="flex items-center justify-center rounded-lg transition-colors"
                          style={{ width: 30, height: 30, background: "transparent", border: "1px solid #e4e2dc", cursor: "pointer", color: "#9e9b93" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(185,50,40,0.06)"; e.currentTarget.style.color = "#b93228"; e.currentTarget.style.borderColor = "rgba(185,50,40,0.2)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9e9b93"; e.currentTarget.style.borderColor = "#e4e2dc"; }}
                        >
                          <IconTrash size={13} strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Modal */}
      {(showAdd || editEntry) && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.35)", zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) closeModals(); }}
        >
          <div
            className="rounded-2xl flex flex-col"
            style={{ background: "#fff", width: 480, maxHeight: "85vh", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between" style={{ borderBottom: "1px solid #e4e2dc", paddingLeft: "24px", paddingRight: "24px", paddingTop: "20px", paddingBottom: "20px" }}>
              <h2 className="text-[15px] font-semibold" style={{ color: "#1c1c1a" }}>
                {showAdd ? "Add Revenue Entry" : isStayEdit ? "Edit Payment Details" : "Edit Entry"}
              </h2>
              <button onClick={closeModals} style={{ background: "none", border: "none", cursor: "pointer", color: "#9e9b93" }}>
                <IconX size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex flex-col gap-4 overflow-y-auto" style={{ padding: "24px" }}>
              {isStayEdit && (
                <div className="rounded-lg px-3 py-2 text-[12px]" style={{ background: "rgba(59,158,149,0.08)", color: "#1f7068", border: "1px solid rgba(59,158,149,0.2)" }}>
                  This entry is derived from the calendar. Only payment details can be edited here.
                </div>
              )}

              {!isStayEdit && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#9e9b93" }}>Guest Name</label>
                    <input
                      value={form.guestName}
                      onChange={e => handleFormChange("guestName", e.target.value)}
                      placeholder="e.g. The Johnson Family"
                      className="rounded-lg px-3 text-[13px]"
                      style={{ height: 38, border: "1px solid #e4e2dc", background: "#fafaf9", color: "#1c1c1a", outline: "none", paddingLeft: "12px" }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#9e9b93" }}>Check-In</label>
                      <input
                        type="date" value={form.checkIn}
                        onChange={e => handleFormChange("checkIn", e.target.value)}
                        className="rounded-lg px-3 text-[13px]"
                        style={{ height: 38, border: "1px solid #e4e2dc", background: "#fafaf9", color: "#1c1c1a", outline: "none", paddingLeft: "12px" }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#9e9b93" }}>Nights</label>
                      <input
                        type="number" min={1} value={form.nights}
                        onChange={e => handleFormChange("nights", parseInt(e.target.value) || 1)}
                        className="rounded-lg px-3 text-[13px]"
                        style={{ height: 38, border: "1px solid #e4e2dc", background: "#fafaf9", color: "#1c1c1a", outline: "none", paddingLeft: "12px" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#9e9b93" }}>Nightly Rate ($)</label>
                      <input
                        type="number" min={0} value={form.nightlyRate}
                        onChange={e => handleFormChange("nightlyRate", parseFloat(e.target.value) || 0)}
                        className="rounded-lg px-3 text-[13px]"
                        style={{ height: 38, border: "1px solid #e4e2dc", background: "#fafaf9", color: "#1c1c1a", outline: "none", paddingLeft: "12px" }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#9e9b93" }}>Total ($)</label>
                      <input
                        type="number" min={0} value={form.totalAmount}
                        onChange={e => handleFormChange("totalAmount", parseFloat(e.target.value) || 0)}
                        className="rounded-lg px-3 text-[13px]"
                        style={{ height: 38, border: "1px solid #e4e2dc", background: "#fafaf9", color: "#1c1c1a", outline: "none", paddingLeft: "12px" }}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#9e9b93" }}>Payment Status</label>
                  <select
                    value={form.paymentStatus}
                    onChange={e => handleFormChange("paymentStatus", e.target.value as PaymentStatus)}
                    className="rounded-lg px-3 text-[13px]"
                    style={{ height: 38, border: "1px solid #e4e2dc", background: "#fafaf9", color: "#1c1c1a", outline: "none", paddingLeft: "12px" }}
                  >
                    {PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#9e9b93" }}>Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={e => handleFormChange("paymentMethod", e.target.value as PaymentMethod)}
                    className="rounded-lg px-3 text-[13px]"
                    style={{ height: 38, border: "1px solid #e4e2dc", background: "#fafaf9", color: "#1c1c1a", outline: "none", paddingLeft: "12px" }}
                  >
                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "#9e9b93" }}>Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => handleFormChange("notes", e.target.value)}
                  rows={2}
                  placeholder="Any additional notes..."
                  className="rounded-lg px-3 py-2 text-[13px] resize-none"
                  style={{ border: "1px solid #e4e2dc", background: "#fafaf9", color: "#1c1c1a", outline: "none", paddingLeft: "12px" }}
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2" style={{ borderTop: "1px solid #e4e2dc", paddingRight: "24px", paddingBottom: "20px", paddingTop: "16px" }}>
              <button
                onClick={closeModals}
                className="rounded-lg px-4 text-[13px] transition-colors"
                style={{ height: 36, background: "transparent", border: "1px solid #e4e2dc", color: "#6b6960", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f5f4f1")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                Cancel
              </button>
              <button
                onClick={showAdd ? saveAdd : saveEdit}
                className="flex items-center gap-1.5 rounded-lg px-4 text-[13px] font-medium transition-colors"
                style={{ height: 36, background: "#3b9e95", color: "#fff", border: "none", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#2f8a82")}
                onMouseLeave={e => (e.currentTarget.style.background = "#3b9e95")}
              >
                <IconCheck size={14} strokeWidth={2} />
                {showAdd ? "Add Entry" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteKey && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.35)", zIndex: 50 }}
          onClick={e => { if (e.target === e.currentTarget) closeModals(); }}
        >
          <div className="rounded-2xl" style={{ background: "#fff", width: 360, padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <h2 className="text-[15px] font-semibold mb-2" style={{ color: "#1c1c1a" }}>Delete entry?</h2>
            <p className="text-[13px] mb-6" style={{ color: "#9e9b93" }}>
              This will permanently remove this revenue entry.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModals}
                className="rounded-lg px-4 text-[13px] transition-colors"
                style={{ height: 36, background: "transparent", border: "1px solid #e4e2dc", color: "#6b6960", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f5f4f1")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg px-4 text-[13px] font-medium transition-colors"
                style={{ height: 36, background: "#b93228", color: "#fff", border: "none", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#9e2820")}
                onMouseLeave={e => (e.currentTarget.style.background = "#b93228")}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
