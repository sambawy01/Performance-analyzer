"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarClock,
  Users,
  Radio,
  Settings,
  ShieldHalf,
  Target,
  ClipboardList,
  FileText,
  Menu,
  X,
  GitCompare,
  FileBarChart,
  HeartPulse,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/sessions", label: "Sessions", icon: CalendarDays },
      { href: "/players", label: "Players", icon: Users },
    ],
  },
  {
    label: "Coaching",
    items: [
      { href: "/planner", label: "Planner", icon: CalendarClock },
      { href: "/match-readiness", label: "Match Readiness", icon: HeartPulse },
      { href: "/squad-builder", label: "Squad Builder", icon: ShieldHalf },
      { href: "/session-design", label: "Session Design", icon: ClipboardList },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/scout", label: "Scout", icon: Target },
      { href: "/compare", label: "Compare", icon: GitCompare },
      { href: "/debrief", label: "Debrief", icon: FileBarChart },
      { href: "/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    label: "Live",
    items: [
      { href: "/live", label: "Live HR", icon: Radio, isLive: true },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/users", label: "Users", icon: Settings, adminOnly: true },
    ],
  },
];

function NavContent({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Logo */}
      <div className="mb-7 px-1">
        <h1 className="text-lg font-bold text-gradient tracking-tight">Coach M8</h1>
        <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] mt-1 font-medium">
          AI Performance Analysis &amp; Squad Management
        </p>
      </div>

      {/* Nav groups */}
      <nav className="space-y-5">
        {navGroups.map((group) => {
          const items = group.items.filter(
            (item) => !("adminOnly" in item && item.adminOnly) || role === "director"
          );
          if (items.length === 0) return null;

          return (
            <div key={group.label}>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/20 px-3 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 group ${
                        isActive
                          ? "text-white"
                          : "text-white/45 hover:text-white/80 hover:bg-white/[0.03]"
                      }`}
                    >
                      {/* Active background */}
                      {isActive && (
                        <div
                          className="absolute inset-0 rounded-lg"
                          style={{
                            background: "linear-gradient(90deg, rgba(0,212,255,0.12) 0%, rgba(168,85,247,0.06) 100%)",
                            boxShadow: "inset 0 0 12px rgba(0,212,255,0.05)",
                          }}
                        />
                      )}
                      {/* Active left accent */}
                      {isActive && (
                        <div
                          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                          style={{
                            background: "linear-gradient(180deg, #00d4ff, #a855f7)",
                            boxShadow: "0 0 8px rgba(0,212,255,0.5)",
                          }}
                        />
                      )}
                      <item.icon
                        className={`h-[18px] w-[18px] relative z-10 transition-colors duration-200 ${
                          isActive
                            ? "text-[#00d4ff]"
                            : "text-white/30 group-hover:text-white/60"
                        }`}
                        style={isActive ? { filter: "drop-shadow(0 0 4px rgba(0,212,255,0.4))" } : undefined}
                      />
                      <span className="relative z-10 flex-1">{item.label}</span>
                      {("isLive" in item && item.isLive) ? (
                        <span className="relative flex h-2 w-2 z-10">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-[#ff3355] live-dot" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff3355]" />
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom branding */}
      <div className="mt-auto pt-4 px-3 border-t border-white/[0.04]">
        <p className="text-[9px] text-white/15 font-mono">
          v2.0 &middot; The Maker Football Incubator
        </p>
      </div>
    </>
  );
}

export function Sidebar({ role }: { role: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-white/[0.06] bg-[#080c16]/80 backdrop-blur-xl px-3 py-5 shrink-0">
        <NavContent role={role} />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[997] h-10 w-10 rounded-lg bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.1] transition-all"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998] md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-64 z-[999] md:hidden flex flex-col bg-[#080c16]/98 backdrop-blur-xl border-r border-white/[0.08] px-3 py-5 shadow-[0_0_60px_rgba(0,0,0,0.8)] animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between mb-2 px-1">
                <h1 className="text-lg font-bold text-gradient tracking-tight">Coach M8</h1>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-7 w-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <NavContent role={role} onNavigate={() => setMobileOpen(false)} />
            </div>
          </>,
          document.body
        )}
    </>
  );
}
