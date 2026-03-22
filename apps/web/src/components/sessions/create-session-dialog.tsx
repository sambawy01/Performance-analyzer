"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { AgeGroup, SessionType, Location } from "@/types";
import { ageGroupLabel, sessionTypeLabel } from "@/lib/format";
import { Plus } from "lucide-react";

export function CreateSessionDialog({ academyId }: { academyId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error } = await supabase.from("sessions").insert({
      academy_id: academyId,
      date: formData.get("date") as string,
      type: formData.get("type") as string,
      location: formData.get("location") as string,
      age_group: formData.get("age_group") as string,
      duration_minutes: formData.get("duration")
        ? parseInt(formData.get("duration") as string, 10)
        : null,
      notes: (formData.get("notes") as string) || null,
    });

    setLoading(false);

    if (!error) {
      setOpen(false);
      router.refresh();
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#a855f7] px-4 py-2 text-sm font-medium text-white hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-300">
        <Plus className="h-4 w-4 mr-2" />
        New Session
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={today}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                placeholder="90"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select name="type" defaultValue="training">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SessionType).map((t) => (
                  <SelectItem key={t} value={t}>
                    {sessionTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Age Group</Label>
            <Select name="age_group">
              <SelectTrigger>
                <SelectValue placeholder="Select age group" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(AgeGroup).map((ag) => (
                  <SelectItem key={ag} value={ag}>
                    {ageGroupLabel(ag)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Select name="location">
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Location).map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Optional notes..." />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Session"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
