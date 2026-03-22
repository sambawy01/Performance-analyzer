"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgeGroup, PlayerPosition, PlayerStatus } from "@/types";
import { ageGroupLabel } from "@/lib/format";

export function PlayerFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/players?${params.toString()}`);
  }

  return (
    <div className="flex gap-3 flex-wrap">
      <Select
        value={searchParams.get("age_group") ?? "all"}
        onValueChange={(v) => updateFilter("age_group", v as string)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Age Group" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Age Groups</SelectItem>
          {Object.values(AgeGroup).map((ag) => (
            <SelectItem key={ag} value={ag}>
              {ageGroupLabel(ag)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("position") ?? "all"}
        onValueChange={(v) => updateFilter("position", v as string)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Position" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Positions</SelectItem>
          {Object.values(PlayerPosition).map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(v) => updateFilter("status", v as string)}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {Object.values(PlayerStatus).map((s) => (
            <SelectItem key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
