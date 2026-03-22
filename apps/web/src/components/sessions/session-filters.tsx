"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgeGroup, SessionType } from "@/types";
import { ageGroupLabel, sessionTypeLabel } from "@/lib/format";

export function SessionFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/sessions?${params.toString()}`);
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
        value={searchParams.get("type") ?? "all"}
        onValueChange={(v) => updateFilter("type", v as string)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {Object.values(SessionType).map((t) => (
            <SelectItem key={t} value={t}>
              {sessionTypeLabel(t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
