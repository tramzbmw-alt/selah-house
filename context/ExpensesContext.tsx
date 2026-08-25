"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type ExpenseCategory   = string;
export type ExpensePaidBy     = "Travis" | "Briana" | "Split";
export type ExpenseStatus     = "Unpaid" | "Paid";
export type ExpenseRecurrence = "One-time" | "Monthly" | "Quarterly" | "Annual";

export type Expense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  dueDate: string;          // YYYY-MM-DD
  status: ExpenseStatus;
  paidBy?: ExpensePaidBy;
  datePaid?: string;
  splitPayment?: { travis: number; briana: number }; // only when paidBy === "Split"
  recurrence: ExpenseRecurrence;
  notes?: string;
  templateId?: string;
  vendorId?: string;
};

export type RecurringTemplate = {
  id: string;
  name: string;
  category: string;
  defaultAmount: number;
  dueDayOfMonth: number;             // 1–31
  generateMode: "automatic" | "manual";
  active: boolean;
};

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  "Mortgage", "Electric", "Water", "Insurance", "Maintenance", "Miscellaneous", "Other",
];
export const EXPENSE_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES;

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

export function templateDueDate(t: Pick<RecurringTemplate, "dueDayOfMonth">, year: number, month: number): string {
  const maxDay = new Date(year, month, 0).getDate();
  const day = Math.min(t.dueDayOfMonth, maxDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const SEED_TEMPLATES: RecurringTemplate[] = [
  { id: "rt1", name: "Mortgage",             category: "Mortgage",      defaultAmount: 2400, dueDayOfMonth: 1,  generateMode: "automatic", active: true },
  { id: "rt2", name: "Electric",             category: "Electric",      defaultAmount: 185,  dueDayOfMonth: 5,  generateMode: "automatic", active: true },
  { id: "rt3", name: "Water",                category: "Water",         defaultAmount: 65,   dueDayOfMonth: 7,  generateMode: "automatic", active: true },
  { id: "rt4", name: "Homeowners Insurance", category: "Insurance",     defaultAmount: 220,  dueDayOfMonth: 25, generateMode: "automatic", active: true },
  { id: "rt5", name: "Pool Service",         category: "Miscellaneous", defaultAmount: 95,   dueDayOfMonth: 28, generateMode: "automatic", active: true },
];

const SEED: Expense[] = [
  { id: "ex1", category: "Mortgage",      description: "Mortgage",             amount: 2400, dueDate: "2026-08-01", status: "Paid",   paidBy: "Travis", datePaid: "2026-08-01", recurrence: "Monthly",  templateId: "rt1" },
  { id: "ex2", category: "Electric",      description: "Electric",             amount: 185,  dueDate: "2026-08-05", status: "Paid",   paidBy: "Briana", datePaid: "2026-08-05", recurrence: "Monthly",  templateId: "rt2" },
  { id: "ex3", category: "Water",         description: "Water",                amount: 65,   dueDate: "2026-08-07", status: "Paid",   paidBy: "Travis", datePaid: "2026-08-07", recurrence: "Monthly",  templateId: "rt3" },
  { id: "ex4", category: "Miscellaneous", description: "Cleaning supplies",    amount: 540,  dueDate: "2026-08-15", status: "Paid",   paidBy: "Split",  datePaid: "2026-08-15", splitPayment: { travis: 270, briana: 270 }, recurrence: "One-time" },
  { id: "ex5", category: "Insurance",     description: "Homeowners Insurance", amount: 220,  dueDate: "2026-08-25", status: "Unpaid",                                          recurrence: "Monthly",  templateId: "rt4" },
  { id: "ex6", category: "Miscellaneous", description: "Pool Service",         amount: 95,   dueDate: "2026-08-28", status: "Unpaid",                                          recurrence: "Monthly",  templateId: "rt5" },
];

let _nextExpId = 7;
let _nextTplId = 6;

type ExpensesCtx = {
  expenses:           Expense[];
  addExpense:         (data: Omit<Expense, "id">) => void;
  updateExpense:      (id: string, data: Partial<Omit<Expense, "id">>) => void;
  removeExpense:      (id: string) => void;
  markPaid:           (id: string, paidBy: ExpensePaidBy, datePaid: string, splitPayment?: { travis: number; briana: number }) => void;

  customCategories:   string[];
  addCategory:        (name: string) => void;
  removeCategory:     (name: string) => void;

  recurringTemplates: RecurringTemplate[];
  addTemplate:        (data: Omit<RecurringTemplate, "id">) => void;
  updateTemplate:     (id: string, data: Partial<Omit<RecurringTemplate, "id">>) => void;
  removeTemplate:     (id: string) => void;
};

const Ctx = createContext<ExpensesCtx | null>(null);

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses,           setExpenses]           = useState<Expense[]>(SEED);
  const [customCategories,   setCustomCategories]   = useState<string[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>(SEED_TEMPLATES);

  // On mount: auto-generate current-month entries for active "automatic" templates
  useEffect(() => {
    const now = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
    setExpenses(prev => {
      const toAdd: Expense[] = [];
      for (const t of SEED_TEMPLATES) {
        if (!t.active || t.generateMode !== "automatic") continue;
        const exists = prev.some(e => e.templateId === t.id && e.dueDate.startsWith(monthPrefix));
        if (!exists) {
          toAdd.push({
            id:          `ex${_nextExpId++}`,
            category:    t.category,
            description: t.name,
            amount:      t.defaultAmount,
            dueDate:     templateDueDate(t, year, month),
            status:      "Unpaid",
            recurrence:  "Monthly",
            templateId:  t.id,
          });
        }
      }
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function addExpense(data: Omit<Expense, "id">) {
    setExpenses(e => [...e, { ...data, id: `ex${_nextExpId++}` }]);
  }

  function updateExpense(id: string, data: Partial<Omit<Expense, "id">>) {
    setExpenses(e => e.map(ex => ex.id === id ? { ...ex, ...data } : ex));
  }

  function removeExpense(id: string) {
    setExpenses(e => e.filter(ex => ex.id !== id));
  }

  function markPaid(
    id: string,
    paidBy: ExpensePaidBy,
    datePaid: string,
    splitPayment?: { travis: number; briana: number },
  ) {
    setExpenses(prev => {
      const exp = prev.find(e => e.id === id);
      if (!exp) return prev;

      const updated = prev.map(e =>
        e.id === id
          ? { ...e, status: "Paid" as ExpenseStatus, paidBy, datePaid, splitPayment: splitPayment ?? undefined }
          : e
      );

      if (exp.recurrence !== "One-time") {
        const nextDue = advanceDueDate(exp.dueDate, exp.recurrence);
        const alreadyExists = updated.some(e =>
          (exp.templateId ? e.templateId === exp.templateId : e.description === exp.description)
          && e.dueDate === nextDue
        );
        if (!alreadyExists) {
          const { paidBy: _pb, datePaid: _dp, splitPayment: _sp, ...rest } = exp;
          updated.push({ ...rest, id: `ex${_nextExpId++}`, dueDate: nextDue, status: "Unpaid" });
        }
      }

      return updated;
    });
  }

  function addCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCustomCategories(prev => {
      if (prev.includes(trimmed) || DEFAULT_EXPENSE_CATEGORIES.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
  }

  function removeCategory(name: string) {
    setCustomCategories(prev => prev.filter(c => c !== name));
  }

  function addTemplate(data: Omit<RecurringTemplate, "id">) {
    const id = `rt${_nextTplId++}`;
    const newTpl: RecurringTemplate = { ...data, id };
    setRecurringTemplates(prev => [...prev, newTpl]);

    // Auto-generate current month only for automatic mode
    if (data.active && data.generateMode === "automatic") {
      const now = new Date();
      const year  = now.getFullYear();
      const month = now.getMonth() + 1;
      const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
      setExpenses(prev => {
        if (prev.some(e => e.templateId === id && e.dueDate.startsWith(monthPrefix))) return prev;
        return [...prev, {
          id:          `ex${_nextExpId++}`,
          category:    data.category,
          description: data.name,
          amount:      data.defaultAmount,
          dueDate:     templateDueDate(newTpl, year, month),
          status:      "Unpaid",
          recurrence:  "Monthly",
          templateId:  id,
        }];
      });
    }
  }

  function updateTemplate(id: string, data: Partial<Omit<RecurringTemplate, "id">>) {
    setRecurringTemplates(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }

  function removeTemplate(id: string) {
    setRecurringTemplates(prev => prev.filter(t => t.id !== id));
  }

  return (
    <Ctx.Provider value={{
      expenses, addExpense, updateExpense, removeExpense, markPaid,
      customCategories, addCategory, removeCategory,
      recurringTemplates, addTemplate, updateTemplate, removeTemplate,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useExpenses must be used inside ExpensesProvider");
  return ctx;
}
