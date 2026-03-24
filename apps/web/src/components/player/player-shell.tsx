"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Lightbulb,
} from "lucide-react";

interface PlayerShellProps {
  children: React.ReactNode;
  player: {
    id: string;
    name: string;
    jersey_number: number | null;
  };
}

const tabs = [
  { label: "Home", icon: LayoutDashboard, path: "" },
  { label: "Stats", icon: BarChart3, path: "/stats" },
  { label: "Progress", icon: TrendingUp, path: "/progress" },
  { label: "Tips", icon: Lightbulb, path: "/tips" },
];

export function PlayerShell({ children, player }: PlayerShellProps) {
  const pathname = usePathname();
  const basePath = `/player/${player.id}`;

  function isActive(tabPath: string) {
    if (tabPath === "") return pathname === basePath;
    return pathname === `${basePath}${tabPath}`;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 glass border-b border-white/[0.06]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar circle with jersey number */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center">
              <span className="font-mono text-sm font-bold text-[#0a0e1a]">
                {player.jersey_number ?? "?"}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">
                {player.name}
              </p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                Coach M8 Player
              </p>
            </div>
          </div>
          <Link
            href="/player"
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Switch
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-lg mx-auto px-4 py-5">{children}</div>
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 glass border-t border-white/[0.06]">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.label}
                href={`${basePath}${tab.path}`}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all duration-200 ${
                  active
                    ? "text-[#00d4ff]"
                    : "text-white/30 hover:text-white/50"
                }`}
              >
                <Icon
                  size={20}
                  className={active ? "drop-shadow-[0_0_6px_rgba(0,212,255,0.5)]" : ""}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {tab.label}
                </span>
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#00d4ff] rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
