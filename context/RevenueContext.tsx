"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

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

export type StayPaymentInfo = {
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

type RevenueCtx = {
  entries:           RevenueEntry[];
  loading:           boolean;
  addEntry:          (data: Omit<RevenueEntry, "id">) => void;
  updateEntry:       (id: string, data: Partial<Omit<RevenueEntry, "id">>) => void;
  removeEntry:       (id: string) => void;
  stayPayments:      Record<string, StayPaymentInfo>;
  updateStayPayment: (stayId: string, info: Partial<StayPaymentInfo>) => void;
};

const Ctx = createContext<RevenueCtx | null>(null);

export function RevenueProvider({ children }: { children: ReactNode }) {
  const [entries,      setEntries]      = useState<RevenueEntry[]>([]);
  const [stayPayments, setStayPayments] = useState<Record<string, StayPaymentInfo>>({});
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("revenue").select("*").order("check_in"),
      // Load payment info for paid stays
      supabase.from("stays").select("id,payment_status,payment_method,payment_notes").gt("cost", 0),
    ]).then(([{ data: revRows }, { data: stayRows }]) => {
      if (revRows) setEntries(revRows.map(mapEntry));
      if (stayRows) {
        const payments: Record<string, StayPaymentInfo> = {};
        for (const s of stayRows) {
          if (s.payment_status) {
            payments[s.id] = {
              paymentStatus: s.payment_status,
              paymentMethod: s.payment_method ?? "Cash",
              notes:         s.payment_notes ?? undefined,
            };
          }
        }
        setStayPayments(payments);
      }
      setLoading(false);
    });
  }, []);

  function addEntry(data: Omit<RevenueEntry, "id">) {
    supabase.from("revenue").insert(toRow(data)).select().single()
      .then(({ data: row, error }) => {
        if (error) { console.error(error); return; }
        if (row) setEntries(prev => [...prev, mapEntry(row)]);
      });
  }

  function updateEntry(id: string, data: Partial<Omit<RevenueEntry, "id">>) {
    const current = entries.find(e => e.id === id);
    if (!current) return;
    const merged = { ...current, ...data };
    supabase.from("revenue").update(toRow(merged)).eq("id", id).select().single()
      .then(({ data: row, error }) => {
        if (error) { console.error(error); return; }
        if (row) setEntries(prev => prev.map(e => e.id === id ? mapEntry(row) : e));
      });
  }

  function removeEntry(id: string) {
    supabase.from("revenue").delete().eq("id", id)
      .then(({ error }) => {
        if (error) { console.error(error); return; }
        setEntries(prev => prev.filter(e => e.id !== id));
      });
  }

  function updateStayPayment(stayId: string, info: Partial<StayPaymentInfo>) {
    const base: StayPaymentInfo = stayPayments[stayId] ?? { paymentStatus: "Pending", paymentMethod: "Cash" };
    const merged = { ...base, ...info };
    supabase.from("stays").update({
      payment_status: merged.paymentStatus,
      payment_method: merged.paymentMethod,
      payment_notes:  merged.notes ?? null,
    }).eq("id", stayId)
      .then(({ error }) => {
        if (error) { console.error(error); return; }
        setStayPayments(prev => ({ ...prev, [stayId]: merged }));
      });
  }

  return (
    <Ctx.Provider value={{ entries, loading, addEntry, updateEntry, removeEntry, stayPayments, updateStayPayment }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRevenue() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRevenue must be used inside RevenueProvider");
  return ctx;
}
