"use client";

import { useState } from "react";
import { IconX, IconWind, IconDroplet, IconBug, IconBolt, IconTool, IconDots, IconCheck } from "@tabler/icons-react";
import {
  type MaintenanceTask, type TaskCategory, type TaskRecurrence, type TaskAssignee,
  deriveStatus, CATEGORIES, RECURRENCES, ASSIGNEES,
} from "@/context/MaintenanceContext";

function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function catIcon(cat: TaskCategory) {
  const map = {
    HVAC: IconWind, Plumbing: IconDroplet, "Pest Control": IconBug,
    Electrical: IconBolt, General: IconTool, Other: IconDots,
  };
  return map[cat] ?? IconTool;
}

const STATUS_COLORS = {
  Overdue:  { bg: "rgba(185,50,40,0.1)",  text: "#b93228" },
  Upcoming: { bg: "#f0ede8",               text: "#9e9b93" },
  Done:     { bg: "rgba(59,158,149,0.1)",  text: "#16645d" },
};

const IN: React.CSSProperties = {
  width: "100%", padding: "9px 12px", border: "1px solid #e4e2dc",
  borderRadius: 8, background: "#fafaf9", color: "#1c1c1a",
  fontSize: 13, outline: "none",
  fontFamily: "var(--font-inter), sans-serif",
  boxSizing: "border-box",
};

type Props = {
  task?:       MaintenanceTask;
  onClose:     () => void;
  onSave:      (data: Omit<MaintenanceTask, "id">) => void;
  onDelete?:   () => void;
  onComplete?: (completedDate: string, actualCost?: number) => void;
};

export default function MaintenanceModal({ task, onClose, onSave, onDelete, onComplete }: Props) {
  const isEdit = !!task;
  const status = task ? deriveStatus(task) : null;

  const [view,     setView]     = useState<"form" | "complete">("form");
  const [title,    setTitle]    = useState(task?.title    ?? "");
  const [category, setCategory] = useState<TaskCategory>(task?.category   ?? "General");
  const [dueDate,  setDueDate]  = useState(task?.dueDate  ?? localDate());
  const [recur,    setRecur]    = useState<TaskRecurrence>(task?.recurrence ?? "One-time");
  const [assignee, setAssignee] = useState<TaskAssignee | "">(task?.assignee ?? "");
  const [cost,     setCost]     = useState(task?.cost != null ? String(task.cost) : "");
  const [notes,    setNotes]    = useState(task?.notes ?? "");

  const [doneDate, setDoneDate] = useState(localDate());
  const [doneCost, setDoneCost] = useState(task?.cost != null ? String(task.cost) : "");

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      title:      title.trim(),
      category,
      dueDate,
      recurrence: recur,
      assignee:   assignee || undefined,
      cost:       cost     ? parseFloat(cost)     : undefined,
      notes:      notes.trim() || undefined,
      manualDone:     task?.manualDone,
      completedDate:  task?.completedDate,
      actualCost:     task?.actualCost,
    });
  }

  function handleConfirmDone() {
    if (!onComplete) return;
    onComplete(doneDate, doneCost ? parseFloat(doneCost) : undefined);
  }

  const CatIcon = catIcon(category);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.38)", zIndex: 50 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl"
        style={{ width: 380, maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-[15px] font-semibold" style={{ color: "#1c1c1a" }}>
              {view === "complete" ? "Mark as done" : isEdit ? "Edit task" : "New task"}
            </div>
            {view === "complete" && (
              <div className="text-[12px] mt-0.5" style={{ color: "#9e9b93" }}>{task?.title}</div>
            )}
            {view === "form" && isEdit && status && (
              <span
                className="inline-block mt-1 text-[10.5px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: STATUS_COLORS[status].bg, color: STATUS_COLORS[status].text }}
              >
                {status}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: 28, height: 28, background: "#f4f3f0", border: "none", cursor: "pointer", color: "#6b6960" }}
          >
            <IconX size={14} strokeWidth={2} />
          </button>
        </div>

        {view === "complete" ? (
          /* ── Completion view ── */
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-1.5" style={{ color: "#9e9b93" }}>Completed date</div>
              <input type="date" value={doneDate} onChange={e => setDoneDate(e.target.value)} style={IN} />
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-1.5" style={{ color: "#9e9b93" }}>
                Actual cost <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9e9b93", fontSize: 13, pointerEvents: "none" }}>$</span>
                <input
                  type="number"
                  min={0}
                  value={doneCost}
                  onChange={e => setDoneCost(e.target.value)}
                  placeholder="0"
                  style={{ ...IN, paddingLeft: 26 }}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <button
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                style={{ background: "#f4f3f0", color: "#6b6960", border: "none", cursor: "pointer" }}
                onClick={() => setView("form")}
              >
                Back
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1.5"
                style={{ background: "#3b9e95", color: "#fff", border: "none", cursor: "pointer" }}
                onClick={handleConfirmDone}
              >
                <IconCheck size={14} strokeWidth={2.5} />
                Confirm done
              </button>
            </div>
          </div>
        ) : (
          /* ── Form view ── */
          <div className="flex flex-col gap-3">
            {/* Title */}
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-1.5" style={{ color: "#9e9b93" }}>Title</div>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. HVAC filter replacement"
                autoFocus
                onKeyDown={e => e.key === "Enter" && handleSave()}
                style={IN}
              />
            </div>

            {/* Category */}
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-1.5" style={{ color: "#9e9b93" }}>Category</div>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {CATEGORIES.map(cat => {
                  const Icon = catIcon(cat);
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      className="flex items-center gap-1.5 rounded-lg text-[12px] font-medium"
                      style={{
                        padding: "7px 10px", border: "none", cursor: "pointer",
                        background: active ? "#1c1c1a" : "#f4f3f0",
                        color:      active ? "#fff"    : "#6b6960",
                      }}
                      onClick={() => setCategory(cat)}
                    >
                      <Icon size={13} strokeWidth={2} />
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Due date + Recurrence */}
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-1.5" style={{ color: "#9e9b93" }}>Due date</div>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={IN} />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-1.5" style={{ color: "#9e9b93" }}>Recurrence</div>
                <select value={recur} onChange={e => setRecur(e.target.value as TaskRecurrence)} style={{ ...IN, appearance: "auto" as any }}>
                  {RECURRENCES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Assignee */}
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-1.5" style={{ color: "#9e9b93" }}>Assigned to</div>
              <div className="flex gap-1.5">
                {([...ASSIGNEES, ""] as (TaskAssignee | "")[]).map(a => (
                  <button
                    key={a || "none"}
                    className="flex-1 py-1.5 rounded-lg text-[12px] font-medium"
                    style={{
                      border: "none", cursor: "pointer",
                      background: assignee === a ? "#1c1c1a" : "#f4f3f0",
                      color:      assignee === a ? "#fff"    : "#6b6960",
                    }}
                    onClick={() => setAssignee(a)}
                  >
                    {a || "None"}
                  </button>
                ))}
              </div>
            </div>

            {/* Cost + Notes */}
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-1.5" style={{ color: "#9e9b93" }}>
                Estimated cost <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9e9b93", fontSize: 13, pointerEvents: "none" }}>$</span>
                <input
                  type="number"
                  min={0}
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  placeholder="0"
                  style={{ ...IN, paddingLeft: 26 }}
                />
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-1.5" style={{ color: "#9e9b93" }}>
                Notes <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional details…"
                rows={2}
                style={{ ...IN, resize: "none", lineHeight: 1.5 }}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                  style={{ background: "#f4f3f0", color: "#6b6960", border: "none", cursor: "pointer" }}
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                  style={{
                    background: title.trim() ? "#1c1c1a" : "#c8c5bf",
                    color: "#fff", border: "none",
                    cursor: title.trim() ? "pointer" : "not-allowed",
                  }}
                  onClick={handleSave}
                >
                  {isEdit ? "Save changes" : "Add task"}
                </button>
              </div>

              {/* Mark done / Delete row */}
              {isEdit && (
                <div className="flex gap-2">
                  {status !== "Done" && (
                    <button
                      className="flex-1 py-2 rounded-xl text-[12.5px] font-medium flex items-center justify-center gap-1.5"
                      style={{ background: "rgba(59,158,149,0.1)", color: "#16645d", border: "none", cursor: "pointer" }}
                      onClick={() => setView("complete")}
                    >
                      <IconCheck size={13} strokeWidth={2.5} />
                      Mark as done
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="flex-1 py-2 rounded-xl text-[12.5px] font-medium"
                      style={{ background: "rgba(185,50,40,0.08)", color: "#b93228", border: "none", cursor: "pointer" }}
                      onClick={onDelete}
                    >
                      Delete task
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
