"use client";

import Link from "next/link";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useExpenses } from "@/context/ExpensesContext";

function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtAmt(n: number) {
  return "$" + (n % 1 === 0 ? n.toLocaleString() : n.toFixed(2));
}

export default function UnpaidBillsAlert() {
  const { expenses } = useExpenses();

  const now   = new Date();
  const in7   = new Date(now);
  in7.setDate(in7.getDate() + 7);

  const todayStr = localDate(now);
  const in7Str   = localDate(in7);

  const dueSoon = expenses.filter(
    e => e.status === "Unpaid" && e.dueDate >= todayStr && e.dueDate <= in7Str
  );

  if (dueSoon.length === 0) return null;

  const total = dueSoon.reduce((s, e) => s + e.amount, 0);
  const label = dueSoon.length === 1 ? "1 bill due this week" : `${dueSoon.length} bills due this week`;

  return (
    <Link href="/expenses" style={{ textDecoration: "none" }}>
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-150"
        style={{
          background: "rgba(201,168,76,0.1)",
          border: "1px solid rgba(201,168,76,0.25)",
          cursor: "pointer",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,168,76,0.16)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(201,168,76,0.1)")}
      >
        <IconAlertTriangle size={14} strokeWidth={2} style={{ color: "#C9A84C", flexShrink: 0 }} />
        <span className="text-[13px] font-medium" style={{ color: "#7a5e10" }}>
          {label} —{" "}
          <span className="font-semibold">{fmtAmt(total)}</span>
        </span>
        <span className="ml-auto text-[11.5px]" style={{ color: "#C9A84C" }}>
          View unpaid →
        </span>
      </div>
    </Link>
  );
}
