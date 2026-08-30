"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { stayEvents } from "@/lib/stayEvents";

export type PaymentStatus  = "Pending" | "Paid" | "Refunded";
export type PaymentMethod  = "Cash" | "Venmo" | "Zelle" | "Stripe";

export type RevenueEntry = {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  nightlyRate: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
};

export const PAYMENT_STATUSES: PaymentStatus[] = ["Pending", "Paid", "Refunded"];
export const PAYMENT_METHODS:  PaymentMethod[]  = ["Cash", "Venmo", "Zelle", "Stripe"];

function mapEntry(r: any): RevenueEntry {
  return {
    id:            r.id,
    guestName:     r.guest_name,
    checkIn:       r.check_in,
    checkOut:      r.check_out,
    nights:        r.nights,
    nightlyRate:   r.nightly_rate,
    totalAmount:   r.total_amount,
    paymentStatus: r.payment_status,
    paymentMethod: r.payment_method,
    notes:         r.notes ?? undefined,
  };
}

function toRow(e: Omit<RevenueEntry, "id">) {
  return {
    guest_name:     e.guestName,
    check_in:       e.checkIn,
    check_out:      e.checkOut,
    nights:         e.nights,
    nightly_rate:   e.nightlyRate,
    total_amount:   e.totalAmount,
    payment_status: e.paymentStatus,
    payment_method: e.paymentMethod,
    notes:          e.notes ?? null,
  };
}

function stayRowFromEntry(entry: RevenueEntry) {
  return {
    person:         null,
    guest:          entry.guestName,
    start_date:     entry.checkIn,
    nights:         entry.nights,
    cost:           entry.totalAmount,
    payment_status: entry.paymentStatus,
    payment_method: entry.paymentMethod,
    payment_notes:  null,
  };
}

type RevenueCtx = {
  entries:     RevenueEntry[];
  loading:     boolean;
  addEntry:    (data: Omit<RevenueEntry, "id">) => void;
  updateEntry: (id: string, data: Partial<Omit<RevenueEntry, "id">>) => void;
  removeEntry: (id: string) => void;
};

const Ctx = createContext<RevenueCtx | null>(null);

export function RevenueProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("revenue").select("*").order("check_in")
      .then(({ data }) => {
        if (data) setEntries(data.map(mapEntry));
        setLoading(false);
      });
  }, []);

  function addEntry(data: Omit<RevenueEntry, "id">) {
    void (async () => {
      // 1. Insert revenue entry
      const { data: row, error } = await supabase.from("revenue").insert(toRow(data)).select().single();
      if (error) { console.error("[Revenue] insert error:", error); return; }
      if (!row)  { console.error("[Revenue] insert returned no row"); return; }

      const entry = mapEntry(row);
      setEntries(prev => [...prev, entry]);

      // 2. Create linked calendar stay with revenue_id so it shows gold and stays in sync
      const stayPayload = { ...stayRowFromEntry(entry), revenue_id: entry.id };
      console.log("[Revenue] creating linked stay:", stayPayload);
      const { error: stayErr } = await supabase.from("stays").insert(stayPayload);
      if (stayErr) console.error("[Revenue] stay insert error:", stayErr);

      // 3. Refresh calendar immediately
      stayEvents.refresh();
    })();
  }

  function updateEntry(id: string, data: Partial<Omit<RevenueEntry, "id">>) {
    void (async () => {
      const current = entries.find(e => e.id === id);
      if (!current) return;
      const merged = { ...current, ...data };

      const { data: row, error } = await supabase
        .from("revenue").update(toRow(merged)).eq("id", id).select().single();
      if (error) { console.error("[Revenue] update error:", error); return; }
      if (row) setEntries(prev => prev.map(e => e.id === id ? mapEntry(row) : e));

      // Sync linked stay fields
      const { error: stayErr } = await supabase.from("stays")
        .update(stayRowFromEntry(merged))
        .eq("revenue_id", id);
      if (stayErr) console.error("[Revenue] stay update error:", stayErr);

      stayEvents.refresh();
    })();
  }

  function removeEntry(id: string) {
    // ON DELETE CASCADE on revenue_id removes the linked stay automatically
    supabase.from("revenue").delete().eq("id", id)
      .then(({ error }) => {
        if (error) { console.error("[Revenue] delete error:", error); return; }
        setEntries(prev => prev.filter(e => e.id !== id));
        stayEvents.refresh();
      });
  }

  return (
    <Ctx.Provider value={{ entries, loading, addEntry, updateEntry, removeEntry }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRevenue() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRevenue must be used inside RevenueProvider");
  return ctx;
}
