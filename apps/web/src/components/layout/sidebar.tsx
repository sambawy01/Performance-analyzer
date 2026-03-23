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

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["coach", "analyst", "director"] },
  { href: "/sessions", label: "Sessions", icon: CalendarDays, roles: ["coach", "analyst", "director"] },
  { href: "/players", label: "Players", icon: Users, roles: ["coach", "analyst", "director"] },
  { href: "/planner", label: "Planner", icon: CalendarClock, roles: ["coach", "analyst", "director"] },
  { href: "/match-readiness", label: "Match Readiness", icon: HeartPulse, roles: ["coach", "analyst", "director"] },
  { href: "/squad-builder", label: "Squad Builder", icon: ShieldHalf, roles: ["coach", "analyst", "director"] },
  { href: "/scout", label: "Scout", icon: Target, roles: ["coach", "analyst", "director"] },
  { href: "/session-design", label: "Session Design", icon: ClipboardList, roles: ["coach", "analyst", "director"] },
  { href: "/compare", label: "Compare", icon: GitCompare, roles: ["coach", "analyst", "director"] },
  { href: "/debrief", label: "Debrief", icon: FileBarChart, roles: ["coach", "analyst", "director"] },
  { href: "/reports", label: "Reports", icon: FileText, roles: ["coach", "analyst", "director"] },
  { href: "/live", label: "Live HR", icon: Radio, roles: ["coach", "analyst", "director"], isLive: true },
  { href: "/admin/users", label: "Users", icon: Settings, roles: ["director"] },
];

function NavContent({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gradient tracking-tight">Coach M8</h1>
        <p className="text-xs text-white/40 uppercase tracking-widest mt-0.5">AI Performance Analysis & Squad Management</p>
      </div>
      <nav className="space-y-0.5">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 group ${
                isActive
                  ? "bg-[#00d4ff]/10 text-white shadow-[inset_3px_0_0_0_#00d4ff]"
                  : "text-white/60 hover:bg-[#00d4ff]/[0.06] hover:text-white"
              }`}
            >
              <item.icon className={`h-4 w-4 transition-colors ${isActive ? "text-[#00d4ff]" : "group-hover:text-[#00d4ff]"}`} />
              <span className="flex-1">{item.label}</span>
              {"isLive" in item && item.isLive && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#ff3355] live-dot" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff3355]" />
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar({ role }: { role: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:block w-64 border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 shrink-0">
        <NavContent role={role} />
      </aside>

      {/* Mobile hamburger button — visible on mobile only */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[997] h-10 w-10 rounded-lg bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.1] transition-all"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile slide-out drawer */}
      {mobileOpen && typeof document !== "undefined" && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[998] md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-72 z-[999] md:hidden bg-[#0a0e1a]/98 backdrop-blur-xl border-r border-white/[0.08] p-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-bold text-gradient tracking-tight">Coach M8</h1>
                <p className="text-xs text-white/40 uppercase tracking-widest mt-0.5">AI Performance Analysis & Squad Management</p>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="h-8 w-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
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
