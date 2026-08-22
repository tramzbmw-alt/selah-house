"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type Person = "Travis" | "Briana";

export type Stay = {
  id: string;
  person: Person;
  startDate: string; // "YYYY-MM-DD"
  nights: number;
  guest?: string; // optional guest name; color still reflects person
};

type StaysCtx = {
  stays: Stay[];
  addStay: (s: Omit<Stay, "id">) => void;
  removeStay: (id: string) => void;
};

const Ctx = createContext<StaysCtx | null>(null);

const SEED: Stay[] = [
  { id: "seed-1", person: "Travis", startDate: "2026-08-18", nights: 5 },
  { id: "seed-2", person: "Briana", startDate: "2026-09-04", nights: 3 },
];

export function StaysProvider({ children }: { children: ReactNode }) {
  const [stays, setStays] = useState<Stay[]>(SEED);

  const addStay = (s: Omit<Stay, "id">) =>
    setStays(prev => [...prev, { ...s, id: crypto.randomUUID() }]);

  const removeStay = (id: string) =>
    setStays(prev => prev.filter(s => s.id !== id));

  return <Ctx.Provider value={{ stays, addStay, removeStay }}>{children}</Ctx.Provider>;
}

export function useStays() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStays must be used within StaysProvider");
  return ctx;
}
