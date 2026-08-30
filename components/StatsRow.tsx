"use client";

import { useStays } from "@/context/StaysContext";
import { useRevenue } from "@/context/RevenueContext";
import { useMaintenance, deriveStatus } from "@/context/MaintenanceContext";
import { useExpenses } from "@/context/ExpensesContext";
import { getUpcomingStays, formatShortDate, MONTHS_SHORT } from "@/lib/stayUtils";

const DOT: Record<string, string> = {
  travis: "#c08040",
  briana: "#3b9e95",
  both:   "#7FA882",
  paid:   "#C9A84C",
  red:    "#b93228",
  gray:   "#9e9b93",
  teal:   "#3b9e95",
};

function stayDot(s: ReturnType<typeof getUpcomingStays>[number] | undefined) {
  if (!s) return "gray";
  if (s.cost > 0) return "paid";
  if (s.person === "Travis") return "travis";
  if (s.person === "Briana") return "briana";
  if (s.person === "Both")   return "both";
  return "gray";
}

function staySub(s: ReturnType<typeof getUpcomingStays>[number] | undefined, empty: string) {
  if (!s) return empty;
  if (s.cost > 0)            return `${s.guest || "Paid guest"} · $${s.cost}`;
  if (s.person === "Both")   return `${s.guest || "Shared"} · ${s.nights}n`;
  return `${s.person} · ${s.nights} night${s.nights !== 1 ? "s" : ""}`;
}

function fmtAmt(n: number) {
  return "$" + (n % 1 === 0 ? n.toLocaleString() : n.toFixed(2));
}

export default function StatsRow() {
  const { stays }              = useStays();
  const { entries }             = useRevenue();
  const { tasks }              = useMaintenance();
  const { expenses }           = useExpenses();
  const upcoming               = getUpcomingStays(stays);
  const next                   = upcoming[0];

  const now = new Date();
  const cm  = now.getMonth() + 1;
  const cy  = now.getFullYear();

  const inCurrMonth = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.getFullYear() === cy && d.getMonth() + 1 === cm;
  };

  // Monthly Revenue: revenue table entries only (revenue → calendar, not the other way)
  const monthRevenue = entries
    .filter(e => e.paymentStatus === "Paid" && inCurrMonth(e.checkIn))
    .reduce((sum, e) => sum + e.totalAmount, 0);

  const revValue   = fmtAmt(monthRevenue);
  const revLabel   = `${MONTHS_SHORT[now.getMonth()]} Revenue`;
  const totalStays = entries.filter(e => inCurrMonth(e.checkIn)).length;
  const paidStays  = entries.filter(e => e.paymentStatus === "Paid" && inCurrMonth(e.checkIn)).length;
  const revSub     = totalStays === 0 ? "no stays this month"
                   : paidStays === totalStays ? "all paid"
                   : `${paidStays} of ${totalStays} paid`;
  const revDot     = totalStays === 0 ? "gray"
                   : paidStays === totalStays ? "teal"
                   : paidStays > 0 ? "paid" : "gray";

  // Unpaid Bills: unpaid expenses for current month
  const monthExpenses   = expenses.filter(e => inCurrMonth(e.dueDate));
  const unpaidThisMonth = monthExpenses.filter(e => e.status === "Unpaid");
  const unpaidTotal     = unpaidThisMonth.reduce((s, e) => s + e.amount, 0);
  const billsValue      = unpaidThisMonth.length === 0 ? "—" : fmtAmt(unpaidTotal);
  const billsSub        = unpaidThisMonth.length === 0 ? "all clear"
                        : `${unpaidThisMonth.length} unpaid bill${unpaidThisMonth.length !== 1 ? "s" : ""}`;
  const billsDot        = unpaidThisMonth.length === 0 ? "teal"
                        : unpaidTotal > 500 ? "red" : "paid";

  // Open Tasks
  const openTasks    = tasks.filter(t => deriveStatus(t) !== "Done").length;
  const overdueTasks = tasks.filter(t => deriveStatus(t) === "Overdue").length;
  const taskSub      = overdueTasks > 0 ? `${overdueTasks} overdue` : openTasks === 0 ? "All clear" : "all on track";

  const STATS = [
    {
      label: revLabel,
      value: revValue,
      sub:   revSub,
      dot:   revDot,
    },
    {
      label: "Unpaid Bills",
      value: billsValue,
      sub:   billsSub,
      dot:   billsDot,
    },
    {
      label: "Next Stay",
      value: next ? formatShortDate(next.startDate) : "—",
      sub:   staySub(next, "None scheduled"),
      dot:   stayDot(next),
    },
    {
      label: "Open Tasks",
      value: String(openTasks),
      sub:   taskSub,
      dot:   overdueTasks > 0 ? "red" : openTasks === 0 ? "briana" : "gray",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {STATS.map(({ label, value, sub, dot }) => (
        <div
          key={label}
          className="bg-white border border-[#e4e2dc] rounded-xl flex flex-col items-center text-center"
          style={{ padding: "20px" }}
        >
          <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] mb-3" style={{ color: "#9e9b93" }}>
            {label}
          </div>
          <div className="text-[28px] font-semibold leading-none mb-3" style={{ color: "#1c1c1a" }}>
            {value}
          </div>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#6b6960" }}>
            <span className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, background: DOT[dot] }} />
            {sub}
          </div>
        </div>
      ))}
    </div>
  );
}
