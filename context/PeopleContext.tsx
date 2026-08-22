"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type PersonEntry = {
  id: string;
  name: string;
  relationship: string;
};

type PeopleCtx = {
  people: PersonEntry[];
  addPerson: (p: Omit<PersonEntry, "id">) => void;
  removePerson: (id: string) => void;
};

const Ctx = createContext<PeopleCtx | null>(null);

const SEED: PersonEntry[] = [
  { id: "pe-1", name: "Mom",   relationship: "Travis's mom"      },
  { id: "pe-2", name: "Dad",   relationship: "Travis's dad"      },
  { id: "pe-3", name: "Sarah", relationship: "Briana's sister"   },
  { id: "pe-4", name: "Kyle",  relationship: "Family friend"     },
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
