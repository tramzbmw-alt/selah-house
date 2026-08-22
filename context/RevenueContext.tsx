"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type PaymentStatus  = "Pending" | "Paid" | "Refunded";
export type PaymentMethod  = "Cash" | "Venmo" | "Zelle" | "Stripe";

export type RevenueEntry = {
  id: string;
  guestName: string;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;  // YYYY-MM-DD
  nights: number;
  nightlyRate: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
};

// Payment details for stay-derived revenue (keyed by stayId)
export type StayPaymentInfo = {
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
};

export const PAYMENT_STATUSES: PaymentStatus[] = ["Pending", "Paid", "Refunded"];
export const PAYMENT_METHODS:  PaymentMethod[]  = ["Cash", "Venmo", "Zelle", "Stripe"];

const SEED: RevenueEntry[] = [
  {
    id: "rev1",
    guestName: "The Henderson Family",
    checkIn: "2026-07-04",
    checkOut: "2026-07-11",
    nights: 7,
    nightlyRate: 225,
    totalAmount: 1575,
    paymentStatus: "Paid",
    paymentMethod: "Zelle",
  },
  {
    id: "rev2",
    guestName: "Thompson Family",
    checkIn: "2026-08-29",
    checkOut: "2026-09-03",
    nights: 5,
    nightlyRate: 275,
    totalAmount: 1375,
    paymentStatus: "Pending",
    paymentMethod: "Venmo",
  },
];

type RevenueCtx = {
  entries:           RevenueEntry[];
  addEntry:          (data: Omit<RevenueEntry, "id">) => void;
  updateEntry:       (id: string, data: Partial<Omit<RevenueEntry, "id">>) => void;
  removeEntry:       (id: string) => void;
  stayPayments:      Record<string, StayPaymentInfo>;
  updateStayPayment: (stayId: string, info: Partial<StayPaymentInfo>) => void;
};

const Ctx = createContext<RevenueCtx | null>(null);
let _nextId = 3;

export function RevenueProvider({ children }: { children: ReactNode }) {
  const [entries,      setEntries]      = useState<RevenueEntry[]>(SEED);
  const [stayPayments, setStayPayments] = useState<Record<string, StayPaymentInfo>>({
    "seed-3": { paymentStatus: "Paid", paymentMethod: "Venmo" },
  });

  function addEntry(data: Omit<RevenueEntry, "id">) {
    setEntries(e => [...e, { ...data, id: `rev${_nextId++}` }]);
  }
  function updateEntry(id: string, data: Partial<Omit<RevenueEntry, "id">>) {
    setEntries(e => e.map(r => r.id === id ? { ...r, ...data } : r));
  }
  function removeEntry(id: string) {
    setEntries(e => e.filter(r => r.id !== id));
  }
  function updateStayPayment(stayId: string, info: Partial<StayPaymentInfo>) {
    setStayPayments(p => {
      const base: StayPaymentInfo = p[stayId] ?? { paymentStatus: "Pending", paymentMethod: "Cash" };
      return { ...p, [stayId]: { ...base, ...info } };
    });
  }

  return (
    <Ctx.Provider value={{ entries, addEntry, updateEntry, removeEntry, stayPayments, updateStayPayment }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRevenue() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRevenue must be used inside RevenueProvider");
  return ctx;
}
