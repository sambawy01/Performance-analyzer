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
  ClipboardCheck,
  FileText,
  Menu,
  X,
  GitCompare,
  FileBarChart,
  HeartPulse,
  Waypoints,
  Shield,
  Key,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    color: "#00d4ff",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, color: "#00d4ff" },
      { href: "/sessions", label: "Sessions", icon: CalendarDays, color: "#06b6d4" },
      { href: "/players", label: "Players", icon: Users, color: "#38bdf8" },
    ],
  },
  {
    label: "Coaching",
    color: "#00ff88",
    items: [
      { href: "/planner", label: "Planner", icon: CalendarClock, color: "#00ff88" },
      { href: "/match-readiness", label: "Match Readiness", icon: HeartPulse, color: "#34d399" },
      { href: "/squad-builder", label: "Squad Builder", icon: ShieldHalf, color: "#4ade80" },
      { href: "/log", label: "Quick Log", icon: ClipboardCheck, color: "#00ff88" },
      { href: "/session-design", label: "Session Design", icon: ClipboardList, color: "#22d3ee" },
      { href: "/tactic-board", label: "Tactic Board", icon: Waypoints, color: "#22d3ee" },
    ],
  },
  {
    label: "Intelligence",
    color: "#a855f7",
    items: [
      { href: "/scout", label: "Scout", icon: Target, color: "#a855f7" },
      { href: "/injury-prevention", label: "Injury Prevention", icon: Shield, color: "#ff3355" },
      { href: "/compare", label: "Compare", icon: GitCompare, color: "#c084fc" },
      { href: "/debrief", label: "Debrief", icon: FileBarChart, color: "#818cf8" },
      { href: "/reports", label: "Reports", icon: FileText, color: "#a78bfa" },
    ],
  },
  {
    label: "Live",
    color: "#ff3355",
    items: [
      { href: "/live", label: "Live HR", icon: Radio, isLive: true, color: "#ff3355" },
    ],
  },
  {
    label: "Admin",
    color: "#ff6b35",
    items: [
      { href: "/admin/users", label: "Users", icon: Settings, adminOnly: true, color: "#ff6b35" },
      { href: "/admin/invites", label: "Invites", icon: Key, adminOnly: true, color: "#ff6b35" },
    ],
  },
];

function NavContent({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Logo */}
      <div className="mb-6 px-2">
        <div className="flex items-center gap-2.5">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #00d4ff, #a855f7)",
              boxShadow: "0 0 20px rgba(0,212,255,0.25), 0 0 40px rgba(168,85,247,0.1)",
            }}
          >
            <span className="text-white font-bold text-sm">M8</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">Coach M8</h1>
            <p className="text-[8px] text-white/25 uppercase tracking-[0.18em] mt-0.5 font-medium">
              AI Performance &amp; Squad
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 mb-4 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* Nav groups */}
      <nav className="space-y-4 flex-1">
        {navGroups.map((group) => {
          const items = group.items.filter(
            (item) => !("adminOnly" in item && item.adminOnly) || role === "director"
          );
          if (items.length === 0) return null;

          return (
            <div key={group.label}>
              <p
                className="text-[9px] font-bold uppercase tracking-[0.18em] px-3 mb-2"
                style={{ color: `${group.color}40` }}
              >
                {group.label}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all duration-250 group ${
                        isActive
                          ? "text-white"
                          : "text-white/40 hover:text-white/75"
                      }`}
                      style={!isActive ? undefined : {
                        background: `linear-gradient(135deg, ${item.color}18, ${item.color}08)`,
                        border: `1px solid ${item.color}25`,
                        boxShadow: `0 0 20px ${item.color}08, inset 0 1px 0 rgba(255,255,255,0.04)`,
                      }}
                    >
                      {/* Hover background for inactive */}
                      {!isActive && (
                        <div className="absolute inset-0 rounded-xl bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      )}
                      {/* Icon container */}
                      <div
                        className="relative z-10 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
                        style={isActive ? {
                          background: `linear-gradient(135deg, ${item.color}30, ${item.color}15)`,
                          boxShadow: `0 0 12px ${item.color}20`,
                        } : {
                          background: `${item.color}08`,
                        }}
                      >
                        <item.icon
                          className="h-4 w-4 transition-all duration-200"
                          style={{
                            color: isActive ? item.color : `${item.color}50`,
                            filter: isActive ? `drop-shadow(0 0 6px ${item.color}80)` : undefined,
                          }}
                        />
                      </div>
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
      <div className="mt-auto pt-4 px-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-3" />
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#00ff88]" style={{ boxShadow: "0 0 6px rgba(0,255,136,0.5)" }} />
          <p className="text-[9px] text-white/20 font-mono">
            v2.0 &middot; The Maker
          </p>
        </div>
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
