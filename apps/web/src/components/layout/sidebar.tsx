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
    <aside className="w-64 border-r bg-muted/40 p-4">
      <div className="mb-8">
        <h1 className="text-lg font-bold">Opsnerve</h1>
        <p className="text-xs text-muted-foreground">Performance Analyzer</p>
      </div>
      <nav className="space-y-1">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
