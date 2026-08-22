"use client";

import { useState } from "react";
import Link from "next/link";
import { IconTool, IconPlus, IconWind, IconDroplet, IconBug, IconBolt, IconDots } from "@tabler/icons-react";
import { useMaintenance, deriveStatus, type MaintenanceTask, type TaskCategory, type TaskStatus } from "@/context/MaintenanceContext";
import MaintenanceModal from "@/components/MaintenanceModal";

function catIcon(cat: TaskCategory) {
  const map = {
    HVAC: IconWind, Plumbing: IconDroplet, "Pest Control": IconBug,
    Electrical: IconBolt, General: IconTool, Other: IconDots,
  };
  return map[cat] ?? IconTool;
}

const STATUS_STYLE: Record<TaskStatus, { badge: [string, string]; icon: [string, string] }> = {
  Overdue:  { badge: ["rgba(185,50,40,0.12)",  "#b93228"], icon: ["rgba(185,50,40,0.12)",  "#b93228"] },
  Pending:  { badge: ["rgba(192,128,64,0.13)", "#7a4e10"], icon: ["rgba(192,128,64,0.13)", "#7a4e10"] },
  Upcoming: { badge: ["#f0ede8",               "#9e9b93"], icon: ["#f0ede8",               "#9e9b93"] },
  Done:     { badge: ["rgba(59,158,149,0.1)",  "#16645d"], icon: ["rgba(59,158,149,0.1)",  "#16645d"] },
};

const STATUS_ORDER: Record<TaskStatus, number> = { Overdue: 0, Pending: 1, Upcoming: 2, Done: 3 };

function sortedTasks(tasks: MaintenanceTask[]) {
  return [...tasks].sort((a, b) => {
    const sa = deriveStatus(a), sb = deriveStatus(b);
    if (sa !== sb) return STATUS_ORDER[sa] - STATUS_ORDER[sb];
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

export default function MaintenanceCard() {
  const { tasks, addTask, updateTask, removeTask, completeTask } = useMaintenance();

  const [showModal,    setShowModal]    = useState(false);
  const [editingTask,  setEditingTask]  = useState<MaintenanceTask | null>(null);

  const displayed = sortedTasks(tasks).slice(0, 4);

  function openAdd() {
    setEditingTask(null);
    setShowModal(true);
  }

  function openEdit(task: MaintenanceTask) {
    setEditingTask(task);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingTask(null);
  }

  function handleSave(data: Omit<MaintenanceTask, "id">) {
    if (editingTask) updateTask(editingTask.id, data);
    else             addTask(data);
    closeModal();
  }

  function handleDelete() {
    if (editingTask) removeTask(editingTask.id);
    closeModal();
  }

  function handleComplete(completedDate: string, actualCost?: number) {
    if (editingTask) completeTask(editingTask.id, completedDate, actualCost);
    closeModal();
  }

  return (
    <div className="bg-white border border-[#e4e2dc] rounded-xl flex flex-col" style={{ padding: "20px" }}>
      {/* Head */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: "#1c1c1a" }}>
          <IconTool size={15} style={{ color: "#3b9e95" }} strokeWidth={2} />
          Maintenance
        </div>
        <Link
          href="/maintenance"
          className="text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors duration-150"
          style={{ color: "#3b9e95", background: "rgba(59,158,149,0.1)", textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.2)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(59,158,149,0.1)")}
        >
          View all
        </Link>
      </div>

      {/* List */}
      <div className="flex flex-col flex-1">
        {displayed.length === 0 ? (
          <div className="text-[12.5px] py-4" style={{ color: "#9e9b93" }}>No maintenance tasks yet.</div>
        ) : displayed.map((task, idx) => {
          const status   = deriveStatus(task);
          const { badge, icon } = STATUS_STYLE[status];
          const Icon     = catIcon(task.category);
          const meta     = task.manualDone
            ? `Done ${task.completedDate ?? ""}${task.actualCost != null ? ` · $${task.actualCost}` : ""}`
            : `Due ${task.dueDate.slice(5).replace("-", "/")} · ${task.recurrence}`;
          return (
            <div
              key={task.id}
              className="flex items-center gap-3 py-3 pr-1 cursor-pointer hover:bg-[#faf9f7] transition-colors duration-100 rounded-lg -mx-1 px-1"
              style={{ borderBottom: idx < displayed.length - 1 ? "1px solid #e4e2dc" : "none" }}
              onClick={() => openEdit(task)}
            >
              <div
                className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{ width: 32, height: 32, background: icon[0], color: icon[1] }}
              >
                <Icon size={14} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate" style={{ color: "#1c1c1a" }}>{task.title}</div>
                <div className="text-[11px] mt-0.5 truncate" style={{ color: "#9e9b93" }}>{meta}</div>
              </div>
              <span
                className="flex-shrink-0 whitespace-nowrap text-[10.5px] font-medium px-2.5 py-1 rounded-full"
                style={{ background: badge[0], color: badge[1] }}
              >
                {status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Add task */}
      <button
        className="flex items-center justify-center gap-1.5 w-full mt-4 py-2 text-[12.5px] rounded-lg transition-colors duration-150"
        style={{
          color: "#3b9e95",
          border: "1.5px dashed rgba(59,158,149,0.35)",
          background: "none",
          cursor: "pointer",
          fontFamily: "var(--font-inter), sans-serif",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.06)")}
        onMouseLeave={e => (e.currentTarget.style.background = "none")}
        onClick={openAdd}
      >
        <IconPlus size={13} strokeWidth={2} />
        Log a task
      </button>

      {showModal && (
        <MaintenanceModal
          task={editingTask ?? undefined}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={editingTask ? handleDelete : undefined}
          onComplete={editingTask ? handleComplete : undefined}
        />
      )}
    </div>
  );
}
