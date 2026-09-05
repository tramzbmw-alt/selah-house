"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconSettings, IconCurrencyDollar, IconCheck,
  IconCalendar, IconPlus, IconPencil, IconTrash, IconX,
} from "@tabler/icons-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { supabase } from "@/lib/supabase";

// ─── Pricing fields ───────────────────────────────────────────────────────────

type SettingKey = "nightly_rate" | "holiday_rate" | "minimum_nights" | "deposit_percentage";

const FIELDS: { key: SettingKey; label: string; prefix?: string; suffix: string; hint: string; min: number; step: number }[] = [
  { key: "nightly_rate",       label: "Standard nightly rate", prefix: "$", suffix: "/ night", hint: "Base rate applied to most nights",               min: 0, step: 5 },
  { key: "holiday_rate",       label: "Holiday / peak rate",   prefix: "$", suffix: "/ night", hint: "Applied during peak seasons and holidays",       min: 0, step: 5 },
  { key: "minimum_nights",     label: "Minimum nights",                     suffix: "nights",   hint: "Minimum stay required per booking request",     min: 1, step: 1 },
  { key: "deposit_percentage", label: "Deposit percentage",                  suffix: "%",        hint: "Percentage of total due at time of booking",    min: 0, step: 5 },
];

// ─── Seasonal rates ───────────────────────────────────────────────────────────

type SeasonalRate = { id: string; name: string; start_date: string; end_date: string; rate: number };
type RateForm     = { name: string; start_date: string; end_date: string; rate: string };

const EMPTY_FORM: RateForm = { name: "", start_date: "", end_date: "", rate: "" };

function fmtDate(s: string) {
  const [y, m, d] = s.split("-");
  return `${m}/${d}/${y}`;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const IN: React.CSSProperties = {
  height: 38, border: "1px solid #e4e2dc", borderRadius: 8,
  fontSize: 15, fontWeight: 600, color: "#1c1c1a", background: "#fafaf9",
  outline: "none", textAlign: "right",
  appearance: "none" as const, MozAppearance: "textfield" as const, WebkitAppearance: "none" as const,
};

const TEXT_IN: React.CSSProperties = {
  height: 36, padding: "0 10px", border: "1px solid #e4e2dc", borderRadius: 8,
  fontSize: 13, color: "#1c1c1a", background: "#fafaf9", outline: "none",
  fontFamily: "var(--font-inter), sans-serif", boxSizing: "border-box" as const,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  // Pricing state
  const [values,  setValues]  = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState<Record<string, boolean>>({});
  const [saved,   setSaved]   = useState<Record<string, boolean>>({});
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Seasonal rates state
  const [rates,        setRates]        = useState<SeasonalRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [showAdd,      setShowAdd]      = useState(false);
  const [addForm,      setAddForm]      = useState<RateForm>({ ...EMPTY_FORM });
  const [addSaving,    setAddSaving]    = useState(false);
  const [addError,     setAddError]     = useState("");
  const [editId,       setEditId]       = useState<string | null>(null);
  const [editForm,     setEditForm]     = useState<RateForm>({ ...EMPTY_FORM });
  const [editSaving,   setEditSaving]   = useState(false);
  const [editError,    setEditError]    = useState("");
  const [deletingId,   setDeletingId]   = useState<string | null>(null);

  // Load pricing settings
  useEffect(() => {
    supabase.from("settings").select("key,value").then(({ data }) => {
      if (data) setValues(Object.fromEntries(data.map(r => [r.key, r.value])));
      setLoading(false);
    });
  }, []);

  // Load seasonal rates
  const loadRates = useCallback(() => {
    setRatesLoading(true);
    supabase.from("seasonal_rates").select("*").order("start_date").then(({ data }) => {
      if (data) setRates(data as SeasonalRate[]);
      setRatesLoading(false);
    });
  }, []);

  useEffect(() => { loadRates(); }, [loadRates]);

  // Save a pricing field
  async function save(key: string) {
    setSaving(s => ({ ...s, [key]: true }));
    setErrors(e => ({ ...e, [key]: "" }));
    const { error } = await supabase
      .from("settings")
      .upsert({ key, value: values[key], updated_at: new Date().toISOString() }, { onConflict: "key" });
    setSaving(s => ({ ...s, [key]: false }));
    if (error) {
      setErrors(e => ({ ...e, [key]: error.message }));
    } else {
      setSaved(s => ({ ...s, [key]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 2200);
    }
  }

  // Add a seasonal rate
  async function addRate() {
    if (!addForm.name || !addForm.start_date || !addForm.end_date || !addForm.rate) {
      setAddError("All fields are required."); return;
    }
    if (addForm.end_date <= addForm.start_date) {
      setAddError("End date must be after start date."); return;
    }
    setAddSaving(true); setAddError("");
    const { error } = await supabase.from("seasonal_rates").insert({
      name: addForm.name,
      start_date: addForm.start_date,
      end_date: addForm.end_date,
      rate: Number(addForm.rate),
    });
    setAddSaving(false);
    if (error) { setAddError(error.message); return; }
    setShowAdd(false);
    setAddForm({ ...EMPTY_FORM });
    loadRates();
  }

  // Start editing a rate
  function startEdit(r: SeasonalRate) {
    setEditId(r.id);
    setEditForm({ name: r.name, start_date: r.start_date, end_date: r.end_date, rate: String(r.rate) });
    setEditError("");
  }

  // Save edited rate
  async function saveEdit() {
    if (!editForm.name || !editForm.start_date || !editForm.end_date || !editForm.rate) {
      setEditError("All fields are required."); return;
    }
    if (editForm.end_date <= editForm.start_date) {
      setEditError("End date must be after start date."); return;
    }
    setEditSaving(true); setEditError("");
    const { error } = await supabase.from("seasonal_rates").update({
      name: editForm.name,
      start_date: editForm.start_date,
      end_date: editForm.end_date,
      rate: Number(editForm.rate),
    }).eq("id", editId!);
    setEditSaving(false);
    if (error) { setEditError(error.message); return; }
    setEditId(null);
    loadRates();
  }

  // Delete a rate
  async function deleteRate(id: string) {
    setDeletingId(id);
    await supabase.from("seasonal_rates").delete().eq("id", id);
    setDeletingId(null);
    loadRates();
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: "#f5f4f1" }}>
        <div style={{ height: 3, background: "#3b9e95", flexShrink: 0 }} />
        <Topbar />

        <main className="flex-1 overflow-y-auto" style={{ padding: 24 }}>

          {/* Page header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <IconSettings size={18} strokeWidth={1.75} style={{ color: "#3b9e95" }} />
            <h1 style={{ fontSize: 19, fontWeight: 700, color: "#1c1c1a", margin: 0 }}>Settings</h1>
          </div>
          <p style={{ fontSize: 13, color: "#9e9b93", margin: "0 0 28px" }}>
            Changes take effect immediately and update the public booking website automatically.
          </p>

          {/* ── Pricing card ─────────────────────────────────────────────── */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e6e4de", maxWidth: 700, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0ede8", display: "flex", alignItems: "center", gap: 8 }}>
              <IconCurrencyDollar size={15} strokeWidth={1.75} style={{ color: "#3b9e95" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6b6960", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pricing</span>
            </div>

            {loading ? (
              <div style={{ padding: "32px 24px", color: "#9e9b93", fontSize: 14 }}>Loading…</div>
            ) : (
              FIELDS.map((field, idx) => (
                <div key={field.key} style={{ padding: "20px 24px", borderBottom: idx < FIELDS.length - 1 ? "1px solid #f0ede8" : "none", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1c1c1a", marginBottom: 3 }}>{field.label}</div>
                    <div style={{ fontSize: 12, color: "#9e9b93" }}>{field.hint}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {field.prefix && <span style={{ fontSize: 14, color: "#9e9b93", fontWeight: 500 }}>{field.prefix}</span>}
                    <input
                      type="number" min={field.min} step={field.step}
                      value={values[field.key] ?? ""}
                      onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && save(field.key)}
                      style={{ ...IN, width: field.suffix === "nights" ? 72 : 90, padding: "0 10px" }}
                    />
                    <span style={{ fontSize: 12, color: "#9e9b93", whiteSpace: "nowrap" }}>{field.suffix}</span>
                    <button
                      onClick={() => save(field.key)} disabled={saving[field.key]}
                      style={{
                        height: 36, padding: "0 18px", borderRadius: 8, border: "none",
                        background: saved[field.key] ? "rgba(59,158,149,0.12)" : saving[field.key] ? "#e4e2dc" : "#3b9e95",
                        color: saved[field.key] ? "#16645d" : saving[field.key] ? "#9e9b93" : "#fff",
                        fontSize: 13, fontWeight: 600, cursor: saving[field.key] ? "default" : "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                        transition: "background 0.15s, color 0.15s", minWidth: 76, justifyContent: "center",
                      }}
                    >
                      {saved[field.key] ? <><IconCheck size={13} strokeWidth={2.5} /> Saved</> : saving[field.key] ? "Saving…" : "Save"}
                    </button>
                  </div>
                  {errors[field.key] && <div style={{ width: "100%", fontSize: 12, color: "#b93228", marginTop: -8 }}>{errors[field.key]}</div>}
                </div>
              ))
            )}
          </div>

          {/* ── Seasonal Rates card ──────────────────────────────────────── */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e6e4de", maxWidth: 700, overflow: "hidden", marginBottom: 16 }}>

            {/* Card header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0ede8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IconCalendar size={15} strokeWidth={1.75} style={{ color: "#3b9e95" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6b6960", textTransform: "uppercase", letterSpacing: "0.1em" }}>Seasonal Rates</span>
              </div>
              {!showAdd && (
                <button
                  onClick={() => { setShowAdd(true); setAddForm({ ...EMPTY_FORM }); setAddError(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 5, height: 30, padding: "0 12px", borderRadius: 7, border: "1px solid #e4e2dc", background: "#fafaf9", fontSize: 12, fontWeight: 600, color: "#3b9e95", cursor: "pointer" }}
                >
                  <IconPlus size={13} strokeWidth={2.5} /> Add rate
                </button>
              )}
            </div>

            {/* Add form */}
            {showAdd && (
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0ede8", background: "rgba(59,158,149,0.04)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1c1c1a", marginBottom: 14 }}>New seasonal rate</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9e9b93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Name</label>
                    <input type="text" placeholder="e.g. Peak Summer" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} style={{ ...TEXT_IN, width: "100%", textAlign: "left", fontWeight: 400 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9e9b93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Nightly rate ($)</label>
                    <input type="number" min={0} step={5} placeholder="300" value={addForm.rate} onChange={e => setAddForm(f => ({ ...f, rate: e.target.value }))} style={{ ...TEXT_IN, width: "100%" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9e9b93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Start date</label>
                    <input type="date" value={addForm.start_date} onChange={e => setAddForm(f => ({ ...f, start_date: e.target.value }))} style={{ ...TEXT_IN, width: "100%", textAlign: "left", fontWeight: 400 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9e9b93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>End date</label>
                    <input type="date" value={addForm.end_date} onChange={e => setAddForm(f => ({ ...f, end_date: e.target.value }))} style={{ ...TEXT_IN, width: "100%", textAlign: "left", fontWeight: 400 }} />
                  </div>
                </div>
                {addError && <div style={{ fontSize: 12, color: "#b93228", marginBottom: 10 }}>{addError}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={addRate} disabled={addSaving} style={{ height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: "#3b9e95", color: "#fff", fontSize: 13, fontWeight: 600, cursor: addSaving ? "default" : "pointer" }}>
                    {addSaving ? "Saving…" : "Save rate"}
                  </button>
                  <button onClick={() => setShowAdd(false)} style={{ height: 34, padding: "0 14px", borderRadius: 8, border: "1px solid #e4e2dc", background: "#fff", fontSize: 13, color: "#6b6960", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                    <IconX size={13} /> Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Rates list */}
            {ratesLoading ? (
              <div style={{ padding: "24px", color: "#9e9b93", fontSize: 14 }}>Loading…</div>
            ) : rates.length === 0 && !showAdd ? (
              <div style={{ padding: "28px 24px", color: "#9e9b93", fontSize: 14, textAlign: "center" }}>
                No seasonal rates defined yet. Add one to override the standard rate for specific date ranges.
              </div>
            ) : (
              rates.map((r, idx) => (
                <div key={r.id}>
                  {/* Edit row */}
                  {editId === r.id ? (
                    <div style={{ padding: "20px 24px", borderBottom: idx < rates.length - 1 ? "1px solid #f0ede8" : "none", background: "rgba(59,158,149,0.04)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9e9b93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Name</label>
                          <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={{ ...TEXT_IN, width: "100%", textAlign: "left", fontWeight: 400 }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9e9b93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Nightly rate ($)</label>
                          <input type="number" min={0} step={5} value={editForm.rate} onChange={e => setEditForm(f => ({ ...f, rate: e.target.value }))} style={{ ...TEXT_IN, width: "100%" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9e9b93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Start date</label>
                          <input type="date" value={editForm.start_date} onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))} style={{ ...TEXT_IN, width: "100%", textAlign: "left", fontWeight: 400 }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#9e9b93", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>End date</label>
                          <input type="date" value={editForm.end_date} onChange={e => setEditForm(f => ({ ...f, end_date: e.target.value }))} style={{ ...TEXT_IN, width: "100%", textAlign: "left", fontWeight: 400 }} />
                        </div>
                      </div>
                      {editError && <div style={{ fontSize: 12, color: "#b93228", marginBottom: 10 }}>{editError}</div>}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={saveEdit} disabled={editSaving} style={{ height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: "#3b9e95", color: "#fff", fontSize: 13, fontWeight: 600, cursor: editSaving ? "default" : "pointer" }}>
                          {editSaving ? "Saving…" : "Save changes"}
                        </button>
                        <button onClick={() => setEditId(null)} style={{ height: 34, padding: "0 14px", borderRadius: 8, border: "1px solid #e4e2dc", background: "#fff", fontSize: 13, color: "#6b6960", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                          <IconX size={13} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display row */
                    <div style={{ padding: "16px 24px", borderBottom: idx < rates.length - 1 ? "1px solid #f0ede8" : "none", display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1c1c1a", marginBottom: 3 }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: "#9e9b93" }}>
                          {fmtDate(r.start_date)} — {fmtDate(r.end_date)}
                        </div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#1a3d3a", minWidth: 80, textAlign: "right" }}>
                        ${r.rate}<span style={{ fontSize: 12, fontWeight: 400, color: "#9e9b93" }}>/night</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => startEdit(r)}
                          style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid #e4e2dc", background: "#fafaf9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6960" }}
                        >
                          <IconPencil size={13} strokeWidth={1.75} />
                        </button>
                        <button
                          onClick={() => deleteRate(r.id)}
                          disabled={deletingId === r.id}
                          style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid rgba(185,50,40,0.2)", background: "rgba(185,50,40,0.05)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#b93228" }}
                        >
                          <IconTrash size={13} strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <p style={{ fontSize: 12, color: "#c0bdb6", marginTop: 4 }}>
            Seasonal rates override the standard nightly rate on the booking form for the specified date ranges.
          </p>
        </main>
      </div>
    </div>
  );
}
