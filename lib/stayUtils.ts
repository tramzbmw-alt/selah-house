import type { Stay } from "@/context/StaysContext";

export const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export const MONTHS_SHORT = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

export const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// Travis = amber, Briana = teal
export const TRAVIS = {
  bg:     "rgba(192,128,64,0.15)",
  border: "1px solid rgba(192,128,64,0.22)",
  text:   "#7a4e10",
  solid:  "#c08040",
  legend: { bg: "rgba(192,128,64,0.15)", border: "1px solid rgba(192,128,64,0.22)" },
};

export const BRIANA = {
  bg:     "rgba(59,158,149,0.13)",
  border: "1px solid rgba(59,158,149,0.22)",
  text:   "#16645d",
  solid:  "#3b9e95",
  legend: { bg: "rgba(59,158,149,0.13)", border: "1px solid rgba(59,158,149,0.22)" },
};

export function personColors(person: "Travis" | "Briana") {
  return person === "Travis" ? TRAVIS : BRIANA;
}

export function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

export function getOccupied(stays: Stay[], year: number, month: number): Map<number, Stay> {
  const map = new Map<number, Stay>();
  for (const stay of stays) {
    const start = new Date(stay.startDate + "T12:00:00");
    for (let n = 0; n < stay.nights; n++) {
      const d = new Date(start);
      d.setDate(d.getDate() + n);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        if (!map.has(d.getDate())) map.set(d.getDate(), stay);
      }
    }
  }
  return map;
}

export function getUpcomingStays(stays: Stay[]) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return stays
    .map(s => {
      const start = new Date(s.startDate + "T12:00:00");
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + s.nights);
      return { ...s, start, end };
    })
    .filter(s => s.end > now)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function formatStayRange(s: Stay) {
  const start = new Date(s.startDate + "T12:00:00");
  const end   = new Date(start);
  end.setDate(end.getDate() + s.nights - 1);
  const startStr = `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}`;
  const endStr   = `${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}`;
  return `${startStr} – ${endStr}`;
}
