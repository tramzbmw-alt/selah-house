"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { Person } from "./StaysContext";

export type GuestType = "owner" | "paid";

export type PersonEntry = {
  id: string;
  name: string;
  type: GuestType;
  // owner guest fields
  relationship?: string;
  owner?: Person;
  // paid guest fields
  rate?: number; // per-night rate; undefined = varies / ask each time
};

type PeopleCtx = {
  people: PersonEntry[];
  addPerson: (p: Omit<PersonEntry, "id">) => void;
  removePerson: (id: string) => void;
};

const Ctx = createContext<PeopleCtx | null>(null);

const SEED: PersonEntry[] = [
  { id: "pe-1", name: "Mom",   type: "owner", relationship: "Travis's mom",    owner: "Travis" },
  { id: "pe-2", name: "Dad",   type: "owner", relationship: "Travis's dad",    owner: "Travis" },
  { id: "pe-3", name: "Sarah", type: "owner", relationship: "Briana's sister", owner: "Briana" },
  { id: "pe-4", name: "Kyle",  type: "owner", relationship: "Family friend"                    },
];

export function PeopleProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<PersonEntry[]>(SEED);

  const addPerson = (p: Omit<PersonEntry, "id">) =>
    setPeople(prev => [...prev, { ...p, id: crypto.randomUUID() }]);

  const removePerson = (id: string) =>
    setPeople(prev => prev.filter(p => p.id !== id));

  return <Ctx.Provider value={{ people, addPerson, removePerson }}>{children}</Ctx.Provider>;
}

export function usePeople() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePeople must be used within PeopleProvider");
  return ctx;
}
