"use client";

import { useState } from "react";
import { IconTool, IconPlus, IconPencil, IconTrash, IconWind, IconDroplet, IconBug, IconBolt, IconDots } from "@tabler/icons-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MaintenanceModal from "@/components/MaintenanceModal";
import { useMaintenance, deriveStatus, type MaintenanceTask, type TaskCategory, type TaskStatus } from "@/context/MaintenanceContext";
import { formatShortDate } from "@/lib/stayUtils";

function catIcon(cat: TaskCategory) {
  const map = {
    HVAC: IconWind, Plumbing: IconDroplet, "Pest Control": IconBug,
    Electrical: IconBolt, General: IconTool, Other: IconDots,
  };
  return map[cat] ?? IconTool;
}

const STATUS_STYLE: Record<TaskStatus, { badge: [string, string]; icon: [string, string] }> = {
  Overdue:  { badge: ["rgba(185,50,40,0.12)",  "#b93228"], icon: ["rgba(185,50,40,0.12)",  "#b93228"] },
  Upcoming: { badge: ["#f0ede8",               "#9e9b93"], icon: ["#f0ede8",               "#9e9b93"] },
  Done:     { badge: ["rgba(59,158,149,0.1)",  "#16645d"], icon: ["rgba(59,158,149,0.1)",  "#16645d"] },
};

const STATUS_ORDER: Record<TaskStatus, number> = { Overdue: 0, Upcoming: 1, Done: 2 };
const FILTERS = ["All", "Overdue", "Upcoming", "Done"] as const;
type Filter = typeof FILTERS[number];

function sortTasks(tasks: MaintenanceTask[]) {
  return [...tasks].sort((a, b) => {
    const sa = deriveStatus(a), sb = deriveStatus(b);
    if (sa !== sb) return STATUS_ORDER[sa] - STATUS_ORDER[sb];
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

export default function MaintenancePage() {
  const { tasks, addTask, updateTask, removeTask, completeTask } = useMaintenance();

  const [filter,      setFilter]      = useState<Filter>("All");
  const [showModal,   setShowModal]   = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);

  const sorted = sortTasks(tasks);
  const filtered = filter === "All" ? sorted : sorted.filter(t => deriveStatus(t) === filter);

  const countByStatus = (s: TaskStatus) => tasks.filter(t => deriveStatus(t) === s).length;

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
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: "#f5f4f1" }}>
        <div style={{ height: 3, background: "#3b9e95", flexShrink: 0 }} />
        <Topbar />

        <main className="flex-1 overflow-y-auto" style={{ padding: "24px", background: "#f5f4f1", boxSizing: "border-box" }}>
          <div className="bg-white border border-[#e4e2dc] rounded-xl" style={{ padding: "20px", maxWidth: 680 }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: "#1c1c1a" }}>
                <IconTool size={15} style={{ color: "#3b9e95" }} strokeWidth={2} />
                Maintenance
              </div>
              <button
                className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full"
                style={{ color: "#3b9e95", background: "rgba(59,158,149,0.1)", border: "none", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,158,149,0.2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(59,158,149,0.1)")}
                onClick={openAdd}
              >
                <IconPlus size={12} strokeWidth={2.5} />
                Add task
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1.5 mb-5 flex-wrap">
              {FILTERS.map(f => {
                const count = f === "All" ? tasks.length : countByStatus(f as TaskStatus);
                const active = filter === f;
                return (
                  <button
                    key={f}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium"
                    style={{
                      border: "none", cursor: "pointer",
                      background: active ? "#1c1c1a" : "#f0ede8",
                      color:      active ? "#fff"    : "#6b6960",
                    }}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                    {count > 0 && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: active ? "rgba(255,255,255,0.22)" : "#e0ddd8",
                          color:      active ? "#fff" : "#6b6960",
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Task list */}
            {filtered.length === 0 ? (
              <div className="text-center py-10" style={{ color: "#9e9b93", fontSize: 13 }}>
                {filter === "All" ? "No tasks yet. Add one to get started." : `No ${filter.toLowerCase()} tasks.`}
              </div>
            ) : (
              <div className="flex flex-col">
                {filtered.map((task, idx) => {
                  const status = deriveStatus(task);
                  const { badge, icon } = STATUS_STYLE[status];
                  const Icon = catIcon(task.category);
                  const dueStr = formatShortDate(task.dueDate);
                  const meta = task.manualDone
                    ? `Completed ${task.completedDate ? formatShortDate(task.completedDate) : ""}${task.actualCost != null ? ` · $${task.actualCost}` : ""}`
                    : `Due ${dueStr} · ${task.recurrence}${task.assignee ? ` · ${task.assignee}` : ""}`;

                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 py-3"
                      style={{ borderBottom: idx < filtered.length - 1 ? "1px solid #f0ede8" : "none" }}
                    >
                      <div
                        className="flex items-center justify-center rounded-lg flex-shrink-0"
                        style={{ width: 34, height: 34, background: icon[0], color: icon[1] }}
                      >
                        <Icon size={15} strokeWidth={2} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium" style={{ color: "#1c1c1a" }}>{task.title}</div>
                        <div className="text-[11.5px] mt-0.5 truncate" style={{ color: "#9e9b93" }}>{meta}</div>
                      </div>

                      <span
                        className="flex-shrink-0 whitespace-nowrap text-[10.5px] font-medium px-2.5 py-1 rounded-full"
                        style={{ background: badge[0], color: badge[1] }}
                      >
                        {status}
                      </span>

                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          className="flex items-center justify-center rounded-lg"
                          style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "#c8c5bf" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f0ede8"; (e.currentTarget as HTMLButtonElement).style.color = "#6b6960"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#c8c5bf"; }}
                          onClick={() => openEdit(task)}
                          title="Edit"
                        >
                          <IconPencil size={13} strokeWidth={2} />
                        </button>
                        <button
                          className="flex items-center justify-center rounded-lg"
                          style={{ width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "#c8c5bf" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(185,50,40,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#b93228"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#c8c5bf"; }}
                          onClick={() => removeTask(task.id)}
                          title="Delete"
                        >
                          <IconTrash size={13} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

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
