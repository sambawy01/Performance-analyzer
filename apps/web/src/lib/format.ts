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
      return "text-red-600 bg-red-50 border-red-200";
    case "amber":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "green":
      return "text-green-600 bg-green-50 border-green-200";
    case "blue":
      return "text-blue-600 bg-blue-50 border-blue-200";
    default:
      return "text-muted-foreground bg-muted";
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
