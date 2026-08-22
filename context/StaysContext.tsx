"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type Person     = "Travis" | "Briana";
export type StayPerson = Person | "Both"; // "Both" = shared family guest

export type Stay = {
  id: string;
  person?: StayPerson; // undefined for paid guest stays
  startDate: string;   // "YYYY-MM-DD"
  nights: number;
  guest?: string;      // optional name shown on calendar; color still reflects person/paid
  cost: number;        // 0 = owner/owner-guest stay; >0 = paid guest stay
};

type StaysCtx = {
  stays: Stay[];
  addStay: (s: Omit<Stay, "id">) => void;
  updateStay: (id: string, s: Omit<Stay, "id">) => void;
  removeStay: (id: string) => void;
};

const Ctx = createContext<StaysCtx | null>(null);

const SEED: Stay[] = [
  { id: "seed-1", person: "Travis", startDate: "2026-08-18", nights: 5, cost: 0 },
  { id: "seed-2", person: "Briana", startDate: "2026-09-04", nights: 3, cost: 0 },
];

export function StaysProvider({ children }: { children: ReactNode }) {
  const [stays, setStays] = useState<Stay[]>(SEED);

  const addStay = (s: Omit<Stay, "id">) =>
    setStays(prev => [...prev, { ...s, id: crypto.randomUUID() }]);

  const updateStay = (id: string, s: Omit<Stay, "id">) =>
    setStays(prev => prev.map(st => st.id === id ? { ...s, id } : st));

  const removeStay = (id: string) =>
    setStays(prev => prev.filter(s => s.id !== id));

  return <Ctx.Provider value={{ stays, addStay, updateStay, removeStay }}>{children}</Ctx.Provider>;
}

export function useStays() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStays must be used within StaysProvider");
  return ctx;
}
