"use client";

import {
  IconHome2,
  IconCalendar,
  IconTool,
  IconReceipt2,
  IconFiles,
  IconAddressBook,
  IconUsers,
  IconSettings,
} from "@tabler/icons-react";

const navItems = [
  { section: "Overview", items: [
    { icon: IconHome2, label: "Dashboard", active: true },
    { icon: IconCalendar, label: "Scheduling" },
  ]},
  { section: "House", items: [
    { icon: IconTool, label: "Maintenance" },
    { icon: IconReceipt2, label: "Expenses" },
    { icon: IconFiles, label: "Documents" },
    { icon: IconAddressBook, label: "Vendors" },
  ]},
  { section: "Guests", items: [
    { icon: IconUsers, label: "People" },
  ]},
];

export default function Sidebar() {
  return (
    <aside style={{ background: "#152f2d", width: 230, flexShrink: 0 }} className="flex flex-col gap-7 px-4 py-7 h-full overflow-y-auto">
      {/* Logo */}
      <div className="px-2">
        <div
          className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-xl mb-2.5"
          style={{ background: "#3b9e95" }}
        >
          🌊
        </div>
        <div className="text-[17px] font-semibold tracking-tight" style={{ color: "#e8f7f6" }}>
          Selah House
        </div>
        <div className="text-[11.5px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
          Wilmington, NC · Murrayville
        </div>
        <div
          className="text-[10.5px] mt-1 tracking-wide"
          style={{ fontFamily: "var(--font-lora), serif", fontStyle: "italic", color: "rgba(255,255,255,0.22)" }}
        >
          pause · breathe · reflect
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-px">
        {navItems.map(({ section, items }) => (
          <div key={section}>
            <div
              className="text-[10px] uppercase tracking-widest px-2.5 mt-2.5 mb-1"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {section}
            </div>
            {items.map(({ icon: Icon, label, active }) => (
              <a
                key={label}
                href="#"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] transition-all duration-150"
                style={{
                  color: active ? "#6ecfc3" : "rgba(255,255,255,0.5)",
                  background: active ? "rgba(59,158,149,0.2)" : "transparent",
                  textDecoration: "none",
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
                  }
                }}
              >
                <Icon size={16} />
                {label}
              </a>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto">
        <a
          href="#"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150"
          style={{ color: "rgba(255,255,255,0.28)", textDecoration: "none" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <IconSettings size={16} />
          Settings
        </a>
      </div>
    </aside>
  );
}
