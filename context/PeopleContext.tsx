"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type GuestType  = "owner" | "paid";
export type OwnerAssoc = "Travis" | "Briana" | "Both";

export type PersonEntry = {
  id: string;
  name: string;
  type: GuestType;
  relationship?: string;
  owner?: OwnerAssoc;
  rate?: number;
};

type PeopleCtx = {
  people: PersonEntry[];
  loading: boolean;
  addPerson: (p: Omit<PersonEntry, "id">) => void;
  updatePerson: (id: string, p: Omit<PersonEntry, "id">) => void;
  removePerson: (id: string) => void;
};

function mapRow(r: any): PersonEntry {
  return {
    id:           r.id,
    name:         r.name,
    type:         r.type,
    relationship: r.relationship ?? undefined,
    owner:        r.owner ?? undefined,
    rate:         r.rate ?? undefined,
  };
}

function toRow(p: Omit<PersonEntry, "id">) {
  return {
    name:         p.name,
    type:         p.type,
    relationship: p.relationship ?? null,
    owner:        p.owner ?? null,
    rate:         p.rate ?? null,
  };
}

const Ctx = createContext<PeopleCtx | null>(null);

export function PeopleProvider({ children }: { children: ReactNode }) {
  const [people,  setPeople]  = useState<PersonEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("people").select("*").order("created_at")
      .then(({ data }) => {
        if (data) setPeople(data.map(mapRow));
        setLoading(false);
      });
  }, []);

  function addPerson(p: Omit<PersonEntry, "id">) {
    supabase.from("people").insert(toRow(p)).select().single()
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        if (data) setPeople(prev => [...prev, mapRow(data)]);
      });
  }

  function updatePerson(id: string, p: Omit<PersonEntry, "id">) {
    supabase.from("people").update(toRow(p)).eq("id", id).select().single()
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        if (data) setPeople(prev => prev.map(pe => pe.id === id ? mapRow(data) : pe));
      });
  }

  function removePerson(id: string) {
    supabase.from("people").delete().eq("id", id)
      .then(({ error }) => {
        if (error) { console.error(error); return; }
        setPeople(prev => prev.filter(p => p.id !== id));
      });
  }

  return (
    <Ctx.Provider value={{ people, loading, addPerson, updatePerson, removePerson }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePeople() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePeople must be used within PeopleProvider");
  return ctx;
}
