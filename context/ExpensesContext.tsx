"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type ExpenseCategory   = string;
export type ExpensePaidBy     = "Travis" | "Briana" | "Split";
export type ExpenseStatus     = "Unpaid" | "Paid";
export type ExpenseRecurrence = "One-time" | "Monthly" | "Quarterly" | "Annual";

export type Expense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  dueDate: string;
  status: ExpenseStatus;
  paidBy?: ExpensePaidBy;
  datePaid?: string;
  splitPayment?: { travis: number; briana: number };
  recurrence: ExpenseRecurrence;
  notes?: string;
  templateId?: string;
  vendorId?: string;
  maintenanceTaskId?: string;
  source?: "maintenance";
};

export type RecurringTemplate = {
  id: string;
  name: string;
  category: string;
  defaultAmount: number;
  dueDayOfMonth: number;
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

function mapExpense(r: any): Expense {
  return {
    id:                r.id,
    category:          r.category,
    description:       r.description,
    amount:            r.amount,
    dueDate:           r.due_date,
    status:            r.status,
    paidBy:            r.paid_by ?? undefined,
    datePaid:          r.date_paid ?? undefined,
    splitPayment:      r.split_payment ?? undefined,
    recurrence:        r.recurrence,
    notes:             r.notes ?? undefined,
    templateId:        r.template_id ?? undefined,
    vendorId:          r.vendor_id ?? undefined,
    maintenanceTaskId: r.maintenance_task_id ?? undefined,
    source:            r.source ?? undefined,
  };
}

function toExpenseRow(e: Omit<Expense, "id">) {
  return {
    category:            e.category,
    description:         e.description,
    amount:              e.amount,
    due_date:            e.dueDate,
    status:              e.status,
    paid_by:             e.paidBy ?? null,
    date_paid:           e.datePaid ?? null,
    split_payment:       e.splitPayment ?? null,
    recurrence:          e.recurrence,
    notes:               e.notes ?? null,
    template_id:         e.templateId ?? null,
    vendor_id:           e.vendorId ?? null,
    maintenance_task_id: e.maintenanceTaskId ?? null,
    source:              e.source ?? null,
  };
}

function mapTemplate(r: any): RecurringTemplate {
  return {
    id:            r.id,
    name:          r.name,
    category:      r.category,
    defaultAmount: r.default_amount,
    dueDayOfMonth: r.due_day_of_month,
    generateMode:  r.generate_mode,
    active:        r.active,
  };
}

function toTemplateRow(t: Omit<RecurringTemplate, "id">) {
  return {
    name:             t.name,
    category:         t.category,
    default_amount:   t.defaultAmount,
    due_day_of_month: t.dueDayOfMonth,
    generate_mode:    t.generateMode,
    active:           t.active,
  };
}

type ExpensesCtx = {
  expenses:           Expense[];
  loading:            boolean;
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
  const [expenses,           setExpenses]           = useState<Expense[]>([]);
  const [customCategories,   setCustomCategories]   = useState<string[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);
  const [loading,            setLoading]            = useState(true);

  useEffect(() => {
    void (async () => {
      const [{ data: tpls }, { data: exps }, { data: cats }] = await Promise.all([
        supabase.from("recurring_templates").select("*").order("created_at"),
        supabase.from("expenses").select("*").order("due_date"),
        supabase.from("expense_categories").select("name"),
      ]);

      const templates  = (tpls  || []).map(mapTemplate);
      let   expenses   = (exps  || []).map(mapExpense);
      const customCats = (cats  || []).map((c: any) => c.name);

      // Auto-generate current-month entries for active "automatic" templates
      const now    = new Date();
      const year   = now.getFullYear();
      const month  = now.getMonth() + 1;
      const prefix = `${year}-${String(month).padStart(2, "0")}`;

      const toInsert: any[] = [];
      for (const t of templates) {
        if (!t.active || t.generateMode !== "automatic") continue;
        if (expenses.some(e => e.templateId === t.id && e.dueDate.startsWith(prefix))) continue;
        toInsert.push({
          category:    t.category,
          description: t.name,
          amount:      t.defaultAmount,
          due_date:    templateDueDate(t, year, month),
          status:      "Unpaid",
          recurrence:  "Monthly",
          template_id: t.id,
        });
      }

      if (toInsert.length > 0) {
        const { data: newRows } = await supabase.from("expenses").insert(toInsert).select();
        if (newRows) expenses = [...expenses, ...newRows.map(mapExpense)];
      }

      setRecurringTemplates(templates);
      setExpenses(expenses);
      setCustomCategories(customCats);
      setLoading(false);
    })();
  }, []);

  function addExpense(data: Omit<Expense, "id">) {
    supabase.from("expenses").insert(toExpenseRow(data)).select().single()
      .then(({ data: row, error }) => {
        if (error) { console.error(error); return; }
        if (row) setExpenses(prev => [...prev, mapExpense(row)]);
      });
  }

  function updateExpense(id: string, data: Partial<Omit<Expense, "id">>) {
    const current = expenses.find(e => e.id === id);
    if (!current) return;
    const merged = { ...current, ...data };
    supabase.from("expenses").update(toExpenseRow(merged)).eq("id", id).select().single()
      .then(({ data: row, error }) => {
        if (error) { console.error(error); return; }
        if (row) setExpenses(prev => prev.map(e => e.id === id ? mapExpense(row) : e));
      });
  }

  function removeExpense(id: string) {
    supabase.from("expenses").delete().eq("id", id)
      .then(({ error }) => {
        if (error) { console.error(error); return; }
        setExpenses(prev => prev.filter(e => e.id !== id));
      });
  }

  function markPaid(
    id: string,
    paidBy: ExpensePaidBy,
    datePaid: string,
    splitPayment?: { travis: number; briana: number },
  ) {
    void (async () => {
      const exp = expenses.find(e => e.id === id);
      if (!exp) return;

      const { error } = await supabase.from("expenses").update({
        status:        "Paid",
        paid_by:       paidBy,
        date_paid:     datePaid,
        split_payment: splitPayment ?? null,
      }).eq("id", id);

      if (error) { console.error(error); return; }

      setExpenses(prev => prev.map(e =>
        e.id === id ? { ...e, status: "Paid" as ExpenseStatus, paidBy, datePaid, splitPayment } : e
      ));

      if (exp.recurrence === "One-time") return;

      const nextDue = advanceDueDate(exp.dueDate, exp.recurrence);
      const alreadyExists = expenses.some(e =>
        (exp.templateId ? e.templateId === exp.templateId : e.description === exp.description)
        && e.dueDate === nextDue
      );
      if (alreadyExists) return;

      const newRow = {
        category:    exp.category,
        description: exp.description,
        amount:      exp.amount,
        due_date:    nextDue,
        status:      "Unpaid",
        recurrence:  exp.recurrence,
        template_id: exp.templateId ?? null,
        vendor_id:   exp.vendorId ?? null,
        notes:       exp.notes ?? null,
      };

      const { data: newExpRow, error: err2 } = await supabase.from("expenses").insert(newRow).select().single();
      if (err2) { console.error(err2); return; }
      if (newExpRow) setExpenses(prev => [...prev, mapExpense(newExpRow)]);
    })();
  }

  function addCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (customCategories.includes(trimmed) || DEFAULT_EXPENSE_CATEGORIES.includes(trimmed)) return;
    supabase.from("expense_categories").insert({ name: trimmed })
      .then(({ error }) => {
        if (error) { console.error(error); return; }
        setCustomCategories(prev => [...prev, trimmed]);
      });
  }

  function removeCategory(name: string) {
    supabase.from("expense_categories").delete().eq("name", name)
      .then(({ error }) => {
        if (error) { console.error(error); return; }
        setCustomCategories(prev => prev.filter(c => c !== name));
      });
  }

  function addTemplate(data: Omit<RecurringTemplate, "id">) {
    void (async () => {
      const { data: row, error } = await supabase
        .from("recurring_templates").insert(toTemplateRow(data)).select().single();
      if (error) { console.error(error); return; }
      if (!row) return;

      const newTpl = mapTemplate(row);
      setRecurringTemplates(prev => [...prev, newTpl]);

      if (!data.active || data.generateMode !== "automatic") return;

      const now   = new Date();
      const year  = now.getFullYear();
      const month = now.getMonth() + 1;
      const prefix = `${year}-${String(month).padStart(2, "0")}`;

      const { data: existing } = await supabase.from("expenses")
        .select("id").eq("template_id", newTpl.id).like("due_date", `${prefix}%`);
      if (existing && existing.length > 0) return;

      const { data: expRow, error: err2 } = await supabase.from("expenses").insert({
        category:    data.category,
        description: data.name,
        amount:      data.defaultAmount,
        due_date:    templateDueDate(newTpl, year, month),
        status:      "Unpaid",
        recurrence:  "Monthly",
        template_id: newTpl.id,
      }).select().single();

      if (err2) { console.error(err2); return; }
      if (expRow) setExpenses(prev => [...prev, mapExpense(expRow)]);
    })();
  }

  function updateTemplate(id: string, data: Partial<Omit<RecurringTemplate, "id">>) {
    const current = recurringTemplates.find(t => t.id === id);
    if (!current) return;
    const merged = { ...current, ...data };
    supabase.from("recurring_templates").update(toTemplateRow(merged)).eq("id", id).select().single()
      .then(({ data: row, error }) => {
        if (error) { console.error(error); return; }
        if (row) setRecurringTemplates(prev => prev.map(t => t.id === id ? mapTemplate(row) : t));
      });
  }

  function removeTemplate(id: string) {
    supabase.from("recurring_templates").delete().eq("id", id)
      .then(({ error }) => {
        if (error) { console.error(error); return; }
        setRecurringTemplates(prev => prev.filter(t => t.id !== id));
      });
  }

  return (
    <Ctx.Provider value={{
      expenses, loading, addExpense, updateExpense, removeExpense, markPaid,
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
