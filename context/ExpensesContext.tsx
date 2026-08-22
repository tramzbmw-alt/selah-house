"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ExpenseCategory = "Mortgage" | "Electric" | "Water" | "Insurance" | "Maintenance" | "Miscellaneous" | "Other";
export type ExpensePaidBy   = "Travis" | "Briana";

export type Expense = {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  datePaid: string;  // YYYY-MM-DD
  paidBy: ExpensePaidBy;
  notes?: string;
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Mortgage", "Electric", "Water", "Insurance", "Maintenance", "Miscellaneous", "Other",
];

const SEED: Expense[] = [
  { id: "ex1", category: "Mortgage",      description: "Monthly mortgage payment", amount: 2400, datePaid: "2026-08-01", paidBy: "Travis" },
  { id: "ex2", category: "Electric",      description: "Duke Energy",              amount: 185,  datePaid: "2026-08-05", paidBy: "Briana" },
  { id: "ex3", category: "Water",         description: "City water bill",          amount: 65,   datePaid: "2026-08-07", paidBy: "Travis" },
  { id: "ex4", category: "Miscellaneous", description: "Cleaning supplies",        amount: 540,  datePaid: "2026-08-15", paidBy: "Briana" },
];

type ExpensesCtx = {
  expenses:      Expense[];
  addExpense:    (data: Omit<Expense, "id">) => void;
  updateExpense: (id: string, data: Partial<Omit<Expense, "id">>) => void;
  removeExpense: (id: string) => void;
};

const Ctx = createContext<ExpensesCtx | null>(null);
let _nextId = 5;

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>(SEED);

  function addExpense(data: Omit<Expense, "id">) {
    setExpenses(e => [...e, { ...data, id: `ex${_nextId++}` }]);
  }

  function updateExpense(id: string, data: Partial<Omit<Expense, "id">>) {
    setExpenses(e => e.map(ex => ex.id === id ? { ...ex, ...data } : ex));
  }

  function removeExpense(id: string) {
    setExpenses(e => e.filter(ex => ex.id !== id));
  }

  return (
    <Ctx.Provider value={{ expenses, addExpense, updateExpense, removeExpense }}>
      {children}
    </Ctx.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useExpenses must be used inside ExpensesProvider");
  return ctx;
}
