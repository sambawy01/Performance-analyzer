export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  return `${h}h ${m}min`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function riskFlagColor(flag: string): string {
  switch (flag) {
    case "red":
      return "text-[#ff3355] bg-[#ff3355]/10 border-[#ff3355]/20";
    case "amber":
      return "text-[#ff6b35] bg-[#ff6b35]/10 border-[#ff6b35]/20";
    case "green":
      return "text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/20";
    case "blue":
      return "text-[#00d4ff] bg-[#00d4ff]/10 border-[#00d4ff]/20";
    default:
      return "text-white/40 bg-white/5 border-white/10";
  }
}

export function riskFlagBadgeVariant(
  flag: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (flag) {
    case "red":
      return "destructive";
    case "amber":
      return "default";
    default:
      return "secondary";
  }
}

export function ageGroupLabel(ageGroup: string): string {
  const year = parseInt(ageGroup, 10);
  if (isNaN(year)) return ageGroup;
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  return `U${age} (${ageGroup})`;
}

export function sessionTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
