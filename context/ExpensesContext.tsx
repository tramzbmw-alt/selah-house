"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ExpenseCategory   = "Mortgage" | "Electric" | "Water" | "Insurance" | "Maintenance" | "Miscellaneous" | "Other";
export type ExpensePaidBy     = "Travis" | "Briana";
export type ExpenseStatus     = "Unpaid" | "Paid";
export type ExpenseRecurrence = "One-time" | "Monthly" | "Quarterly" | "Annual";

export type Expense = {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  dueDate: string;          // YYYY-MM-DD — always required
  status: ExpenseStatus;
  paidBy?: ExpensePaidBy;   // only when Paid
  datePaid?: string;        // only when Paid, YYYY-MM-DD
  recurrence: ExpenseRecurrence;
  notes?: string;
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Mortgage", "Electric", "Water", "Insurance", "Maintenance", "Miscellaneous", "Other",
];
export const EXPENSE_RECURRENCES: ExpenseRecurrence[] = [
  "One-time", "Monthly", "Quarterly", "Annual",
];

function advanceDueDate(dueDate: string, recurrence: ExpenseRecurrence): string {
  const d = new Date(dueDate + "T12:00:00");
  if      (recurrence === "Monthly")   d.setMonth(d.getMonth() + 1);
  else if (recurrence === "Quarterly") d.setMonth(d.getMonth() + 3);
  else if (recurrence === "Annual")    d.setFullYear(d.getFullYear() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const SEED: Expense[] = [
  { id: "ex1", category: "Mortgage",      description: "Monthly mortgage payment", amount: 2400, dueDate: "2026-08-01", status: "Paid", paidBy: "Travis", datePaid: "2026-08-01", recurrence: "Monthly" },
  { id: "ex2", category: "Electric",      description: "Duke Energy",              amount: 185,  dueDate: "2026-08-05", status: "Paid", paidBy: "Briana", datePaid: "2026-08-05", recurrence: "Monthly" },
  { id: "ex3", category: "Water",         description: "City water bill",          amount: 65,   dueDate: "2026-08-07", status: "Paid", paidBy: "Travis", datePaid: "2026-08-07", recurrence: "Monthly" },
  { id: "ex4", category: "Miscellaneous", description: "Cleaning supplies",        amount: 540,  dueDate: "2026-08-15", status: "Paid", paidBy: "Briana", datePaid: "2026-08-15", recurrence: "One-time" },
  { id: "ex5", category: "Insurance",     description: "Homeowners insurance",     amount: 220,  dueDate: "2026-08-25", status: "Unpaid", recurrence: "Monthly" },
  { id: "ex6", category: "Miscellaneous", description: "Pool service",             amount: 95,   dueDate: "2026-08-28", status: "Unpaid", recurrence: "Monthly" },
];

type ExpensesCtx = {
  expenses:      Expense[];
  addExpense:    (data: Omit<Expense, "id">) => void;
  updateExpense: (id: string, data: Partial<Omit<Expense, "id">>) => void;
  removeExpense: (id: string) => void;
  markPaid:      (id: string, paidBy: ExpensePaidBy, datePaid: string) => void;
};

const Ctx = createContext<ExpensesCtx | null>(null);
let _nextId = 7;

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

  function markPaid(id: string, paidBy: ExpensePaidBy, datePaid: string) {
    setExpenses(prev => {
      const exp = prev.find(e => e.id === id);
      if (!exp) return prev;

      const updated = prev.map(e =>
        e.id === id ? { ...e, status: "Paid" as ExpenseStatus, paidBy, datePaid } : e
      );

      if (exp.recurrence !== "One-time") {
        const nextDue = advanceDueDate(exp.dueDate, exp.recurrence);
        const alreadyExists = updated.some(e => e.description === exp.description && e.dueDate === nextDue);
        if (!alreadyExists) {
          const { paidBy: _pb, datePaid: _dp, ...rest } = exp;
          updated.push({ ...rest, id: `ex${_nextId++}`, dueDate: nextDue, status: "Unpaid" });
        }
      }

      return updated;
    });
  }

  return (
    <Ctx.Provider value={{ expenses, addExpense, updateExpense, removeExpense, markPaid }}>
      {children}
    </Ctx.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useExpenses must be used inside ExpensesProvider");
  return ctx;
}
