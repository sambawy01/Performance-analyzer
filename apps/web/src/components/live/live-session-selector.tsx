"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ageGroupLabel, sessionTypeLabel } from "@/lib/format";

interface Session {
  id: string;
  date: string;
  type: string;
  age_group: string;
  location: string;
}

export function LiveSessionSelector({
  sessions,
  currentSessionId,
}: {
  sessions: Session[];
  currentSessionId?: string;
}) {
  const router = useRouter();

  if (sessions.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Session:</span>
      <Select
        value={currentSessionId ?? ""}
        onValueChange={(id) => router.push(`/live?session=${id}`)}
      >
        <SelectTrigger className="w-[350px]">
          <SelectValue placeholder="Select a session" />
        </SelectTrigger>
        <SelectContent>
          {sessions.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {sessionTypeLabel(s.type)} — {ageGroupLabel(s.age_group)} —{" "}
              {s.location} ({s.date})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
