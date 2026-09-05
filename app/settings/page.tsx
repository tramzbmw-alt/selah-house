"use client";

import { useState, useEffect } from "react";
import {
  IconSettings,
  IconCurrencyDollar,
  IconCheck,
} from "@tabler/icons-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { supabase } from "@/lib/supabase";

type SettingKey = "nightly_rate" | "holiday_rate" | "minimum_nights" | "deposit_percentage";

const FIELDS: { key: SettingKey; label: string; prefix?: string; suffix: string; hint: string; min: number; step: number }[] = [
  { key: "nightly_rate",       label: "Standard nightly rate", prefix: "$", suffix: "/ night", hint: "Base rate applied to most nights",                    min: 0, step: 5  },
  { key: "holiday_rate",       label: "Holiday / peak rate",   prefix: "$", suffix: "/ night", hint: "Applied during peak seasons and holidays",            min: 0, step: 5  },
  { key: "minimum_nights",     label: "Minimum nights",                     suffix: "nights",   hint: "Minimum stay required per booking request",          min: 1, step: 1  },
  { key: "deposit_percentage", label: "Deposit percentage",                  suffix: "%",        hint: "Percentage of total due at time of booking",         min: 0, step: 5  },
];

const IN: React.CSSProperties = {
  height: 38,
  border: "1px solid #e4e2dc",
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
  color: "#1c1c1a",
  background: "#fafaf9",
  outline: "none",
  textAlign: "right",
  appearance: "none" as const,
  MozAppearance: "textfield" as const,
  WebkitAppearance: "none" as const,
};

export default function SettingsPage() {
  const [values,  setValues]  = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState<Record<string, boolean>>({});
  const [saved,   setSaved]   = useState<Record<string, boolean>>({});
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("settings").select("key,value").then(({ data }) => {
      if (data) setValues(Object.fromEntries(data.map(r => [r.key, r.value])));
      setLoading(false);
    });
  }, []);

  async function save(key: string) {
    setSaving(s  => ({ ...s,  [key]: true  }));
    setErrors(e  => ({ ...e,  [key]: ""    }));
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

          {/* Pricing card */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e6e4de", maxWidth: 700, overflow: "hidden" }}>

            {/* Card header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0ede8", display: "flex", alignItems: "center", gap: 8 }}>
              <IconCurrencyDollar size={15} strokeWidth={1.75} style={{ color: "#3b9e95" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6b6960", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Pricing
              </span>
            </div>

            {loading ? (
              <div style={{ padding: "32px 24px", color: "#9e9b93", fontSize: 14 }}>Loading…</div>
            ) : (
              FIELDS.map((field, idx) => (
                <div
                  key={field.key}
                  style={{
                    padding: "20px 24px",
                    borderBottom: idx < FIELDS.length - 1 ? "1px solid #f0ede8" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    flexWrap: "wrap",
                  }}
                >
                  {/* Label + hint */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1c1c1a", marginBottom: 3 }}>
                      {field.label}
                    </div>
                    <div style={{ fontSize: 12, color: "#9e9b93" }}>{field.hint}</div>
                  </div>

                  {/* Input row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {field.prefix && (
                      <span style={{ fontSize: 14, color: "#9e9b93", fontWeight: 500 }}>{field.prefix}</span>
                    )}
                    <input
                      type="number"
                      min={field.min}
                      step={field.step}
                      value={values[field.key] ?? ""}
                      onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && save(field.key)}
                      style={{ ...IN, width: field.suffix === "nights" ? 72 : 90, padding: "0 10px" }}
                    />
                    <span style={{ fontSize: 12, color: "#9e9b93", whiteSpace: "nowrap" }}>{field.suffix}</span>

                    <button
                      onClick={() => save(field.key)}
                      disabled={saving[field.key]}
                      style={{
                        height: 36,
                        padding: "0 18px",
                        borderRadius: 8,
                        border: "none",
                        background: saved[field.key]
                          ? "rgba(59,158,149,0.12)"
                          : saving[field.key]
                          ? "#e4e2dc"
                          : "#3b9e95",
                        color: saved[field.key] ? "#16645d" : saving[field.key] ? "#9e9b93" : "#fff",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: saving[field.key] ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "background 0.15s, color 0.15s",
                        minWidth: 76,
                        justifyContent: "center",
                      }}
                    >
                      {saved[field.key] ? (
                        <><IconCheck size={13} strokeWidth={2.5} /> Saved</>
                      ) : saving[field.key] ? (
                        "Saving…"
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>

                  {errors[field.key] && (
                    <div style={{ width: "100%", fontSize: 12, color: "#b93228", marginTop: -8 }}>
                      {errors[field.key]}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <p style={{ fontSize: 12, color: "#c0bdb6", marginTop: 16 }}>
            Press Enter or click Save to commit each field individually.
          </p>
        </main>
      </div>
    </div>
  );
}
