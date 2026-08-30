"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type VendorCategory =
  | "HVAC"
  | "Plumbing"
  | "Electrical"
  | "Pest Control"
  | "Landscaping"
  | "General Contractor"
  | "Other";

export type Vendor = {
  id: string;
  name: string;
  category: VendorCategory;
  phone: string;
  email?: string;
  website?: string;
  notes?: string;
};

export const VENDOR_CATEGORIES: VendorCategory[] = [
  "HVAC", "Plumbing", "Electrical", "Pest Control", "Landscaping", "General Contractor", "Other",
];

function mapRow(r: any): Vendor {
  return {
    id:       r.id,
    name:     r.name,
    category: r.category,
    phone:    r.phone ?? "",
    email:    r.email ?? undefined,
    website:  r.website ?? undefined,
    notes:    r.notes ?? undefined,
  };
}

function toRow(v: Omit<Vendor, "id">) {
  return {
    name:     v.name,
    category: v.category,
    phone:    v.phone,
    email:    v.email ?? null,
    website:  v.website ?? null,
    notes:    v.notes ?? null,
  };
}

type VendorsCtx = {
  vendors:      Vendor[];
  loading:      boolean;
  addVendor:    (data: Omit<Vendor, "id">) => void;
  updateVendor: (id: string, data: Partial<Omit<Vendor, "id">>) => void;
  removeVendor: (id: string) => void;
};

const Ctx = createContext<VendorsCtx | null>(null);

export function VendorsProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("vendors").select("*").order("name")
      .then(({ data }) => {
        if (data) setVendors(data.map(mapRow));
        setLoading(false);
      });
  }, []);

  function addVendor(data: Omit<Vendor, "id">) {
    supabase.from("vendors").insert(toRow(data)).select().single()
      .then(({ data: row, error }) => {
        if (error) { console.error(error); return; }
        if (row) setVendors(prev => [...prev, mapRow(row)]);
      });
  }

  function updateVendor(id: string, data: Partial<Omit<Vendor, "id">>) {
    const current = vendors.find(v => v.id === id);
    if (!current) return;
    const merged = { ...current, ...data };
    supabase.from("vendors").update(toRow(merged)).eq("id", id).select().single()
      .then(({ data: row, error }) => {
        if (error) { console.error(error); return; }
        if (row) setVendors(prev => prev.map(v => v.id === id ? mapRow(row) : v));
      });
  }

  function removeVendor(id: string) {
    supabase.from("vendors").delete().eq("id", id)
      .then(({ error }) => {
        if (error) { console.error(error); return; }
        setVendors(prev => prev.filter(v => v.id !== id));
      });
  }

  return (
    <Ctx.Provider value={{ vendors, loading, addVendor, updateVendor, removeVendor }}>
      {children}
    </Ctx.Provider>
  );
}

export function useVendors() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVendors must be used inside VendorsProvider");
  return ctx;
}
