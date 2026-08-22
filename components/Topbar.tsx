export default function Topbar() {
  return (
    <header
      className="flex items-center justify-between px-6 py-4"
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #e6e4de",
        flexShrink: 0,
      }}
    >
      <div>
        <h1 className="text-[15px] font-semibold" style={{ color: "#1c1c1a" }}>
          Good morning, Travis ☀️
        </h1>
        <p className="text-[12px] mt-0.5" style={{ color: "#6b6960" }}>
          August 2026 &middot; 3 bed &middot; 2 bath &middot; sleeps 6–8
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div className="text-right text-[11px] leading-[1.7]" style={{ color: "#9e9b93" }}>
          <div>15 min → Wrightsville Beach</div>
          <div>10 min → Mayfaire</div>
        </div>

        {/* Avatars */}
        <div className="flex items-center">
          {[
            { initials: "TR", bg: "#c08040", label: "Travis" },
            { initials: "BR", bg: "#3b9e95", label: "Briana", offset: true },
          ].map(({ initials, bg, label, offset }) => (
            <div
              key={initials}
              title={label}
              className="flex items-center justify-center rounded-full text-[11px] font-semibold text-white"
              style={{
                width: 34,
                height: 34,
                background: bg,
                border: "2.5px solid #fff",
                marginLeft: offset ? -10 : 0,
              }}
            >
              {initials}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
