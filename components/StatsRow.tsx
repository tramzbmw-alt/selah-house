type DotColor = "teal" | "amber" | "red" | "gray";

const dotColors: Record<DotColor, string> = {
  teal:  "#3b9e95",
  amber: "#c08040",
  red:   "#b93228",
  gray:  "#9e9b93",
};

function Stat({ label, value, sub, dot }: { label: string; value: string; sub: string; dot: DotColor }) {
  return (
    <div
      className="rounded-lg p-[0.9rem_1.1rem]"
      style={{ background: "#fff", border: "1px solid #eae8e2" }}
    >
      <div className="text-[11px] uppercase tracking-[0.06em] mb-[5px]" style={{ color: "#9e9b93" }}>
        {label}
      </div>
      <div className="text-[22px] font-semibold leading-none" style={{ color: "#1c1c1a" }}>
        {value}
      </div>
      <div className="flex items-center gap-[5px] text-[11.5px] mt-[5px]" style={{ color: "#6b6960" }}>
        <span
          className="inline-block w-[7px] h-[7px] rounded-full flex-shrink-0"
          style={{ background: dotColors[dot] }}
        />
        {sub}
      </div>
    </div>
  );
}

export default function StatsRow() {
  return (
    <div className="grid grid-cols-4 gap-[10px]">
      <Stat label="Next stay"    value="Aug 18"  sub="Travis · 5 nights"         dot="teal"  />
      <Stat label="After that"   value="Sep 4"   sub="Briana · 3 nights"         dot="amber" />
      <Stat label="Open tasks"   value="2"       sub="1 overdue"                 dot="red"   />
      <Stat label="Aug expenses" value="$3,190"  sub="mortgage + utilities"      dot="gray"  />
    </div>
  );
}
