"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

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

const SEED: Vendor[] = [
  { id: "v1", name: "Carolina Climate Control", category: "HVAC",               phone: "910-555-0110", email: "service@ccclimate.com",             notes: "Annual service contract through Dec 2026" },
  { id: "v2", name: "Wilmington Pest Pros",      category: "Pest Control",       phone: "910-555-0187",                                               notes: "Quarterly treatment plan" },
  { id: "v3", name: "Coastal Landscaping Co.",   category: "Landscaping",        phone: "910-555-0234", website: "coastallandscaping.example.com" },
];

let _nextId = 4;

type VendorsCtx = {
  vendors:      Vendor[];
  addVendor:    (data: Omit<Vendor, "id">) => void;
  updateVendor: (id: string, data: Partial<Omit<Vendor, "id">>) => void;
  removeVendor: (id: string) => void;
};

const Ctx = createContext<VendorsCtx | null>(null);

export function VendorsProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>(SEED);

  function addVendor(data: Omit<Vendor, "id">) {
    setVendors(v => [...v, { ...data, id: `v${_nextId++}` }]);
  }
  function updateVendor(id: string, data: Partial<Omit<Vendor, "id">>) {
    setVendors(v => v.map(vendor => vendor.id === id ? { ...vendor, ...data } : vendor));
  }
  function removeVendor(id: string) {
    setVendors(v => v.filter(vendor => vendor.id !== id));
  }

  return (
    <Ctx.Provider value={{ vendors, addVendor, updateVendor, removeVendor }}>
      {children}
    </Ctx.Provider>
  );
}

export function useVendors() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVendors must be used inside VendorsProvider");
  return ctx;
}
