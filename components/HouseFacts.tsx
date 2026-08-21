const facts = [
  { icon: "🛏", val: "3 bedrooms",    label: "King · Queen · Bunk" },
  { icon: "🔥", val: "Backyard",      label: "Fire pit · Treehouse" },
  { icon: "🔑", val: "Keyless entry", label: "Smart lock · Cam" },
  { icon: "🏖", val: "15 min",        label: "Wrightsville Beach" },
  { icon: "🌳", val: "Walk to park",  label: "Lake · Trails · Picnic" },
];

export default function HouseFacts() {
  return (
    <div className="grid grid-cols-5 gap-2">
      {facts.map(({ icon, val, label }) => (
        <div
          key={val}
          className="flex items-center gap-2 rounded-lg px-3 py-[10px]"
          style={{ background: "#fff", border: "1px solid #eae8e2" }}
        >
          <span className="text-[18px] flex-shrink-0">{icon}</span>
          <div>
            <div className="text-[12.5px] font-medium" style={{ color: "#1c1c1a" }}>{val}</div>
            <div className="text-[10.5px]" style={{ color: "#9e9b93" }}>{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
