import type { Metadata } from "next";
export const metadata: Metadata = { title: "Reports -- Coach M8" };

import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  HeartPulse,
  FileText,
  ArrowRight,
} from "lucide-react";

const reportCards = [
  {
    href: "/reports/monthly",
    icon: BarChart3,
    color: "#00d4ff",
    gradient: "from-[#00d4ff]/20 to-[#a855f7]/10",
    border: "border-[#00d4ff]/20 hover:border-[#00d4ff]/50",
    glow: "hover:shadow-[0_0_30px_rgba(0,212,255,0.15)]",
    title: "Monthly Team Report",
    description:
      "Full-squad performance overview: sessions, load trends, top performers, injury flags, and AI executive summary.",
    badge: "AI Generated",
    badgeColor: "text-[#00d4ff] bg-[#00d4ff]/10",
  },
  {
    href: "/reports/weekly",
    icon: CalendarDays,
    color: "#00ff88",
    gradient: "from-[#00ff88]/20 to-[#00d4ff]/10",
    border: "border-[#00ff88]/20 hover:border-[#00ff88]/50",
    glow: "hover:shadow-[0_0_30px_rgba(0,255,136,0.15)]",
    title: "Weekly Training Summary",
    description:
      "Last 7 days of sessions: daily load, HR trends, player highlights, and next-week load recommendations.",
    badge: "Last 7 Days",
    badgeColor: "text-[#00ff88] bg-[#00ff88]/10",
  },
  {
    href: "/reports/medical",
    icon: HeartPulse,
    color: "#ff3355",
    gradient: "from-[#ff3355]/20 to-[#ff6b35]/10",
    border: "border-[#ff3355]/20 hover:border-[#ff3355]/50",
    glow: "hover:shadow-[0_0_30px_rgba(255,51,85,0.15)]",
    title: "Medical / Injury Report",
    description:
      "All players ranked by injury risk. ACWR flags, recovery trends, load modifications, and return-to-play notes.",
    badge: "Risk Triage",
    badgeColor: "text-[#ff3355] bg-[#ff3355]/10",
  },
  {
    href: "/reports/parent",
    icon: FileText,
    color: "#a855f7",
    gradient: "from-[#a855f7]/20 to-[#00d4ff]/10",
    border: "border-[#a855f7]/20 hover:border-[#a855f7]/50",
    glow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]",
    title: "Parent Report",
    description:
      "Warm, jargon-free monthly development report for parents. Covers attendance, fitness progress, and coach message.",
    badge: "Per Player",
    badgeColor: "text-[#a855f7] bg-[#a855f7]/10",
  },
];

export default function ReportsHubPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-[#00d4ff]" />
          Reports
        </h2>
        <p className="text-sm text-white/50 mt-1">
          AI-powered reports for coaching staff, medical team, and parents
        </p>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportCards.map((card) => (
          <Link key={card.href} href={card.href} className="group block">
            <div
              className={`relative rounded-2xl border bg-gradient-to-br ${card.gradient} ${card.border} ${card.glow} backdrop-blur-xl p-6 transition-all duration-300 h-full`}
            >
              {/* Background glow effect */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(ellipse at top left, ${card.color}08 0%, transparent 60%)`,
                }}
              />

              <div className="relative space-y-4">
                {/* Icon + Badge row */}
                <div className="flex items-start justify-between">
                  <div
                    className="rounded-xl p-3"
                    style={{
                      background: `${card.color}15`,
                      border: `1px solid ${card.color}30`,
                    }}
                  >
                    <card.icon
                      className="h-6 w-6"
                      style={{ color: card.color }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${card.badgeColor}`}
                  >
                    {card.badge}
                  </span>
                </div>

                {/* Title + Description */}
                <div>
                  <h3 className="text-base font-semibold text-white group-hover:text-white/90 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-white/50 mt-1.5 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* CTA */}
                <div
                  className="flex items-center gap-1.5 text-sm font-medium transition-all duration-200 group-hover:gap-2.5"
                  style={{ color: card.color }}
                >
                  <span>Generate Report</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-white/20 text-center">
        All reports are generated using live academy data · Powered by Claude AI
      </p>
    </div>
  );
}
