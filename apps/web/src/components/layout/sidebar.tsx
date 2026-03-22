import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Radio,
  Settings,
} from "lucide-react";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["coach", "analyst", "director"],
  },
  {
    href: "/sessions",
    label: "Sessions",
    icon: CalendarDays,
    roles: ["coach", "analyst", "director"],
  },
  {
    href: "/players",
    label: "Players",
    icon: Users,
    roles: ["coach", "analyst", "director"],
  },
  {
    href: "/live",
    label: "Live HR",
    icon: Radio,
    roles: ["coach", "analyst", "director"],
    isLive: true,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Settings,
    roles: ["director"],
  },
];

export function Sidebar({ role }: { role: string }) {
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4">
      <div className="mb-8">
        <h1 className="text-lg font-bold text-gradient tracking-tight">
          Coach M8
        </h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
          AI Performance Analyst
        </p>
      </div>
      <nav className="space-y-1">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 transition-all duration-200 hover:bg-[#00d4ff]/[0.08] hover:text-white hover:shadow-[inset_3px_0_0_0_#00d4ff] group"
          >
            <item.icon className="h-4 w-4 group-hover:text-[#00d4ff] transition-colors" />
            <span className="flex-1">{item.label}</span>
            {"isLive" in item && item.isLive && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#ff3355] live-dot" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff3355]" />
              </span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
