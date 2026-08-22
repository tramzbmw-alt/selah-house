"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

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

const SEED: MaintenanceTask[] = [
  { id: "m1", title: "HVAC filter replacement", category: "HVAC",         dueDate: "2026-07-28", recurrence: "Quarterly",  assignee: "Travis" },
  { id: "m2", title: "Outdoor shower caulk",    category: "Plumbing",     dueDate: "2026-08-25", recurrence: "One-time",   assignee: "Travis" },
  { id: "m3", title: "Pest control visit",       category: "Pest Control", dueDate: "2026-08-02", recurrence: "Quarterly",  assignee: "Vendor", manualDone: true, completedDate: "2026-08-02", actualCost: 85 },
  { id: "m4", title: "Fire pit inspection",      category: "General",      dueDate: "2026-10-01", recurrence: "Annual",     assignee: "Travis" },
];

type MaintenanceCtx = {
  tasks: MaintenanceTask[];
  addTask:      (data: Omit<MaintenanceTask, "id">) => void;
  updateTask:   (id: string, data: Partial<Omit<MaintenanceTask, "id">>) => void;
  removeTask:   (id: string) => void;
  completeTask: (id: string, completedDate: string, actualCost?: number) => void;
};

const Ctx = createContext<MaintenanceCtx | null>(null);
let _nextId = 5;

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<MaintenanceTask[]>(SEED);

  function addTask(data: Omit<MaintenanceTask, "id">) {
    setTasks(t => [...t, { ...data, id: `m${_nextId++}` }]);
  }

  function updateTask(id: string, data: Partial<Omit<MaintenanceTask, "id">>) {
    setTasks(t => t.map(task => task.id === id ? { ...task, ...data } : task));
  }

  function removeTask(id: string) {
    setTasks(t => t.filter(task => task.id !== id));
  }

  function completeTask(id: string, completedDate: string, actualCost?: number) {
    setTasks(prev => {
      const task = prev.find(t => t.id === id);
      if (!task) return prev;
      const next = nextDueDate(task.dueDate, task.recurrence);
      const updated = prev.map(t =>
        t.id === id ? { ...t, manualDone: true, completedDate, actualCost } : t
      );
      if (!next) return updated;
      return [...updated, {
        ...task,
        id: `m${_nextId++}`,
        dueDate: next,
        manualDone: false,
        completedDate: undefined,
        actualCost: undefined,
      }];
    });
  }

  return (
    <Ctx.Provider value={{ tasks, addTask, updateTask, removeTask, completeTask }}>
      {children}
    </Ctx.Provider>
  );
}

export function useMaintenance() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMaintenance must be used inside MaintenanceProvider");
  return ctx;
}
