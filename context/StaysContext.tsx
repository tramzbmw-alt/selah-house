"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { stayEvents } from "@/lib/stayEvents";

export type Person     = "Travis" | "Briana";
export type StayPerson = Person | "Both";

export type Stay = {
  id: string;
  person?: StayPerson;
  startDate: string;   // "YYYY-MM-DD"
  nights: number;
  guest?: string;
  cost: number;
  revenueId?: string;  // set when stay was created from a revenue entry
};

type StaysCtx = {
  stays: Stay[];
  loading: boolean;
  addStay: (s: Omit<Stay, "id" | "revenueId">) => void;
  updateStay: (id: string, s: Omit<Stay, "id" | "revenueId">) => void;
  removeStay: (id: string) => void;
};

function mapRow(r: any): Stay {
  return {
    id:        r.id,
    person:    r.person ?? undefined,
    startDate: r.start_date,
    nights:    r.nights,
    guest:     r.guest ?? undefined,
    cost:      r.cost,
    revenueId: r.revenue_id ?? undefined,
  };
}

function toRow(s: Omit<Stay, "id" | "revenueId">) {
  return {
    person:     s.person ?? null,
    start_date: s.startDate,
    nights:     s.nights,
    guest:      s.guest ?? null,
    cost:       s.cost,
  };
}

const Ctx = createContext<StaysCtx | null>(null);

export function StaysProvider({ children }: { children: ReactNode }) {
  const [stays,   setStays]   = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStays = useCallback(() => {
    supabase.from("stays").select("*").order("start_date")
      .then(({ data }) => {
        if (data) setStays(data.map(mapRow));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadStays();
    // Re-fetch whenever RevenueContext mutates stays
    const unsub = stayEvents.onRefresh(loadStays);
    return unsub;
  }, [loadStays]);

  function addStay(s: Omit<Stay, "id" | "revenueId">) {
    supabase.from("stays").insert(toRow(s)).select().single()
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        if (data) setStays(prev => [...prev, mapRow(data)]);
      });
  }

  function updateStay(id: string, s: Omit<Stay, "id" | "revenueId">) {
    supabase.from("stays").update(toRow(s)).eq("id", id).select().single()
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        if (data) setStays(prev => prev.map(st => st.id === id ? mapRow(data) : st));
      });
  }

  function removeStay(id: string) {
    supabase.from("stays").delete().eq("id", id)
      .then(({ error }) => {
        if (error) { console.error(error); return; }
        setStays(prev => prev.filter(s => s.id !== id));
      });
  }

  return (
    <Ctx.Provider value={{ stays, loading, addStay, updateStay, removeStay }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStays() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStays must be used within StaysProvider");
  return ctx;
}
