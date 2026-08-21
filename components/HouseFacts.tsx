const FACTS = [
  { icon: "🛏", val: "3 Bedrooms",    sub: "King · Queen · Bunk" },
  { icon: "🔥", val: "Backyard",      sub: "Fire pit · Treehouse" },
  { icon: "🔑", val: "Keyless Entry", sub: "Smart lock · Cam" },
  { icon: "🏖", val: "15 min",        sub: "Wrightsville Beach" },
  { icon: "🌳", val: "Walk to Park",  sub: "Lake · Trails · Picnic" },
];

export default function HouseFacts() {
  return (
    <div className="flex gap-3">
      {FACTS.map(({ icon, val, sub }) => (
        <div
          key={val}
          className="flex-1 flex flex-col items-center justify-center text-center rounded-xl py-4 px-3"
          style={{ background: "#fff", border: "1px solid #e6e4de" }}
        >
          <span className="text-[20px] leading-none mb-2">{icon}</span>
          <div className="text-[12.5px] font-medium" style={{ color: "#1c1c1a" }}>{val}</div>
          <div className="text-[10.5px] mt-0.5" style={{ color: "#9e9b93" }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}
