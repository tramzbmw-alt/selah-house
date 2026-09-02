"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome2,
  IconCalendar,
  IconTool,
  IconReceipt2,
  IconCurrencyDollar,
  IconFiles,
  IconAddressBook,
  IconUsers,
  IconSettings,
  IconInbox,
} from "@tabler/icons-react";

const NAV = [
  {
    section: "Overview",
    items: [
      { icon: IconHome2,    label: "Dashboard",  href: "/"           },
      { icon: IconCalendar, label: "Scheduling", href: "/scheduling" },
    ],
  },
  {
    section: "House",
    items: [
      { icon: IconTool,            label: "Maintenance", href: "/maintenance" },
      { icon: IconReceipt2,        label: "Expenses",    href: "/expenses"    },
      { icon: IconCurrencyDollar,  label: "Revenue",     href: "/revenue"     },
      { icon: IconFiles,           label: "Documents",   href: "/documents"   },
      { icon: IconAddressBook,     label: "Vendors",     href: "/vendors"     },
    ],
  },
  {
    section: "Guests",
    items: [
      { icon: IconInbox, label: "Booking Requests", href: "/booking-requests" },
      { icon: IconUsers, label: "People",           href: "/people"           },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col h-full overflow-y-auto"
      style={{ width: 220, flexShrink: 0, background: "#1a3d3a" }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center text-center px-4" style={{ paddingTop: "24px", paddingBottom: "24px" }}>
        <div
          className="flex items-center justify-center text-xl rounded-xl mb-3"
          style={{ width: 42, height: 42, background: "#3b9e95" }}
        >
          🌊
        </div>
        <div className="text-[16px] font-semibold tracking-tight" style={{ color: "#e6f5f4" }}>
          Selah House
        </div>
        <div className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
          Wilmington, NC · Murrayville
        </div>
        <div
          className="text-[10px] mt-1.5"
          style={{
            fontFamily: "var(--font-lora), serif",
            fontStyle: "italic",
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.02em",
          }}
        >
          pause · breathe · reflect
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px" }} />

      {/* Nav */}
      <nav
        className="flex flex-col flex-1"
        style={{ paddingLeft: "12px", paddingRight: "12px", paddingTop: "8px" }}
      >
        {NAV.map(({ section, items }, idx) => (
          <div key={section} style={{ marginTop: idx > 0 ? "24px" : "0" }}>
            <div
              className="text-[10px] uppercase tracking-[0.1em] mb-2"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              {section}
            </div>
            {items.map(({ icon: Icon, label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150"
                  style={{
                    color:          active ? "#6ecfc3" : "rgba(255,255,255,0.46)",
                    background:     active ? "rgba(59,158,149,0.18)" : "transparent",
                    textDecoration: "none",
                    fontWeight:     active ? 500 : 400,
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                      (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.7)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                      (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.46)";
                    }
                  }}
                >
                  <Icon size={15} strokeWidth={1.75} />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ paddingLeft: "12px", paddingRight: "12px", paddingBottom: "24px" }}>
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 12 }} />
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150"
          style={{ color: "rgba(255,255,255,0.28)", textDecoration: "none" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
            (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.6)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.28)";
          }}
        >
          <IconSettings size={15} strokeWidth={1.75} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
