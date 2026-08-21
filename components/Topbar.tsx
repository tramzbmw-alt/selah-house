export default function Topbar() {
  return (
    <header
      className="flex items-center justify-between px-7 py-[1.1rem]"
      style={{ background: "#ffffff", borderBottom: "1px solid #e4e2dc" }}
    >
      <div>
        <h1 className="text-base font-semibold" style={{ color: "#1c1c1a" }}>
          Good morning, Travis ☀️
        </h1>
        <p className="text-[12px] mt-0.5" style={{ color: "#6b6960" }}>
          August 2026 · 3 bed · 2 bath · sleeps 6–8
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right text-[11px] leading-relaxed" style={{ color: "#9e9b93" }}>
          <div>15 min → Wrightsville Beach</div>
          <div>10 min → Mayfaire</div>
        </div>
        <div className="flex">
          <div
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-semibold text-white"
            style={{ background: "#3b9e95", border: "2.5px solid #fff" }}
            title="Travis"
          >
            TR
          </div>
          <div
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-semibold text-white -ml-2.5"
            style={{ background: "#c08040", border: "2.5px solid #fff" }}
            title="Briana"
          >
            BR
          </div>
        </div>
      </div>
    </header>
  );
}
