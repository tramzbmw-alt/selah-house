const FACTS = [
  { icon: "🛏", val: "3 Bedrooms",    sub: "King · Queen · Bunk" },
  { icon: "🔥", val: "Backyard",      sub: "Fire pit · Treehouse" },
  { icon: "🔑", val: "Keyless Entry", sub: "Smart lock · Cam" },
  { icon: "🏖", val: "15 min",        sub: "Wrightsville Beach" },
  { icon: "🌳", val: "Walk to Park",  sub: "Lake · Trails · Picnic" },
];

export default function HouseFacts() {
  return (
    <div className="grid grid-cols-5 gap-3">
      {FACTS.map(({ icon, val, sub }) => (
        <div
          key={val}
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: "#fff", border: "1px solid #e6e4de" }}
        >
          <span className="text-[18px] leading-none flex-shrink-0">{icon}</span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium truncate" style={{ color: "#1c1c1a" }}>
              {val}
            </div>
            <div className="text-[10.5px] truncate" style={{ color: "#9e9b93" }}>
              {sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
