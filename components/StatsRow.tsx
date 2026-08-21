const DOT: Record<string, string> = {
  teal:  "#3b9e95",
  amber: "#c08040",
  red:   "#b93228",
  gray:  "#9e9b93",
};

const STATS = [
  { label: "Next Stay",    value: "Aug 18",  sub: "Travis · 5 nights",    dot: "teal"  },
  { label: "After That",  value: "Sep 4",   sub: "Briana · 3 nights",    dot: "amber" },
  { label: "Open Tasks",  value: "2",       sub: "1 overdue",             dot: "red"   },
  { label: "Aug Expenses",value: "$3,190",  sub: "mortgage + utilities",  dot: "gray"  },
];

export default function StatsRow() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {STATS.map(({ label, value, sub, dot }) => (
        <div
          key={label}
          className="bg-white border border-[#e4e2dc] rounded-xl p-5 flex flex-col items-center text-center"
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
