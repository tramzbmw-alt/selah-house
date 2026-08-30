"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type TaskCategory   = "HVAC" | "Plumbing" | "Pest Control" | "Electrical" | "General" | "Other";
export type TaskRecurrence = "One-time" | "Monthly" | "Quarterly" | "Semi-annual" | "Annual";
export type TaskAssignee   = "Travis" | "Briana" | "Vendor";
export type TaskStatus     = "Overdue" | "Upcoming" | "Done";

export type MaintenanceTask = {
  id: string;
  title: string;
  category: TaskCategory;
  dueDate: string;
  recurrence: TaskRecurrence;
  assignee?: TaskAssignee;
  vendorId?: string;
  cost?: number;
  notes?: string;
  manualDone?: boolean;
  completedDate?: string;
  actualCost?: number;
};

export const CATEGORIES:  TaskCategory[]   = ["HVAC", "Plumbing", "Pest Control", "Electrical", "General", "Other"];
export const RECURRENCES: TaskRecurrence[] = ["One-time", "Monthly", "Quarterly", "Semi-annual", "Annual"];
export const ASSIGNEES:   TaskAssignee[]   = ["Travis", "Briana", "Vendor"];

export function deriveStatus(task: MaintenanceTask): TaskStatus {
  if (task.manualDone) return "Done";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(task.dueDate + "T12:00:00"); due.setHours(0, 0, 0, 0);
  return due < today ? "Overdue" : "Upcoming";
}

export function nextDueDate(dueDate: string, recurrence: TaskRecurrence): string | null {
  if (recurrence === "One-time") return null;
  const d = new Date(dueDate + "T12:00:00");
  if (recurrence === "Monthly")     d.setMonth(d.getMonth() + 1);
  if (recurrence === "Quarterly")   d.setMonth(d.getMonth() + 3);
  if (recurrence === "Semi-annual") d.setMonth(d.getMonth() + 6);
  if (recurrence === "Annual")      d.setFullYear(d.getFullYear() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mapRow(r: any): MaintenanceTask {
  return {
    id:            r.id,
    title:         r.title,
    category:      r.category,
    dueDate:       r.due_date,
    recurrence:    r.recurrence,
    assignee:      r.assignee ?? undefined,
    vendorId:      r.vendor_id ?? undefined,
    cost:          r.cost ?? undefined,
    notes:         r.notes ?? undefined,
    manualDone:    r.manual_done ?? false,
    completedDate: r.completed_date ?? undefined,
    actualCost:    r.actual_cost ?? undefined,
  };
}

function toRow(t: Omit<MaintenanceTask, "id">) {
  return {
    title:          t.title,
    category:       t.category,
    due_date:       t.dueDate,
    recurrence:     t.recurrence,
    assignee:       t.assignee ?? null,
    vendor_id:      t.vendorId ?? null,
    cost:           t.cost ?? null,
    notes:          t.notes ?? null,
    manual_done:    t.manualDone ?? false,
    completed_date: t.completedDate ?? null,
    actual_cost:    t.actualCost ?? null,
  };
}

type MaintenanceCtx = {
  tasks: MaintenanceTask[];
  loading: boolean;
  addTask:      (data: Omit<MaintenanceTask, "id">) => void;
  updateTask:   (id: string, data: Partial<Omit<MaintenanceTask, "id">>) => void;
  removeTask:   (id: string) => void;
  completeTask: (id: string, completedDate: string, actualCost?: number) => void;
};

const Ctx = createContext<MaintenanceCtx | null>(null);

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  const [tasks,   setTasks]   = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("maintenance").select("*").order("due_date")
      .then(({ data }) => {
        if (data) setTasks(data.map(mapRow));
        setLoading(false);
      });
  }, []);

  function addTask(data: Omit<MaintenanceTask, "id">) {
    supabase.from("maintenance").insert(toRow(data)).select().single()
      .then(({ data: row, error }) => {
        if (error) { console.error(error); return; }
        if (row) setTasks(prev => [...prev, mapRow(row)]);
      });
  }

  function updateTask(id: string, data: Partial<Omit<MaintenanceTask, "id">>) {
    const current = tasks.find(t => t.id === id);
    if (!current) return;
    const merged = { ...current, ...data };
    supabase.from("maintenance").update(toRow(merged)).eq("id", id).select().single()
      .then(({ data: row, error }) => {
        if (error) { console.error(error); return; }
        if (row) setTasks(prev => prev.map(t => t.id === id ? mapRow(row) : t));
      });
  }

  function removeTask(id: string) {
    supabase.from("maintenance").delete().eq("id", id)
      .then(({ error }) => {
        if (error) { console.error(error); return; }
        setTasks(prev => prev.filter(t => t.id !== id));
      });
  }

  function completeTask(id: string, completedDate: string, actualCost?: number) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    supabase.from("maintenance")
      .update({ manual_done: true, completed_date: completedDate, actual_cost: actualCost ?? null })
      .eq("id", id)
      .then(({ error }) => {
        if (error) { console.error(error); return; }

        setTasks(prev => prev.map(t =>
          t.id === id ? { ...t, manualDone: true, completedDate, actualCost } : t
        ));

        const next = nextDueDate(task.dueDate, task.recurrence);
        if (!next) return;

        const { id: _id, manualDone: _md, completedDate: _cd, actualCost: _ac, ...rest } = task;
        supabase.from("maintenance").insert(toRow({ ...rest, dueDate: next, manualDone: false })).select().single()
          .then(({ data: newRow, error: err2 }) => {
            if (err2) { console.error(err2); return; }
            if (newRow) setTasks(prev => [...prev, mapRow(newRow)]);
          });
      });
  }

  return (
    <Ctx.Provider value={{ tasks, loading, addTask, updateTask, removeTask, completeTask }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMaintenance() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMaintenance must be used inside MaintenanceProvider");
  return ctx;
}
