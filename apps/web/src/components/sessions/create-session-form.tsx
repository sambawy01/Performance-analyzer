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
import { AgeGroup, Location } from "@/types";
import { ageGroupLabel } from "@/lib/format";
import { Loader2, Plus, Calendar } from "lucide-react";

const SESSION_TYPES = [
  { value: "training", label: "Training" },
  { value: "match", label: "Match" },
  { value: "friendly", label: "Friendly" },
  { value: "recovery", label: "Recovery" },
];

export function CreateSessionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.get("date") as string,
          type: formData.get("type") as string,
          duration_minutes: formData.get("duration")
            ? parseInt(formData.get("duration") as string, 10)
            : 90,
          location: formData.get("location") as string,
          age_group: formData.get("age_group") as string,
          notes: (formData.get("notes") as string) || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Failed to create session");
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  const inputClass =
    "bg-white/[0.04] border-white/10 text-white placeholder:text-white/40 focus-visible:border-[#00d4ff]/50 focus-visible:ring-[#00d4ff]/20";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setError(null);
      }}
    >
      <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#a855f7] px-4 py-2 text-sm font-medium text-white hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-300">
        <Plus className="h-4 w-4 mr-2" />
        New Session
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#00d4ff]" />
            Create Session
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-white/60">
                Date *
              </Label>
              <Input
                name="date"
                type="date"
                defaultValue={today}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-white/60">
                Duration (min)
              </Label>
              <Input
                name="duration"
                type="number"
                placeholder="90"
                min="1"
                max="600"
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-white/60">
              Type *
            </Label>
            <Select name="type" defaultValue="training">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-white/60">
              Age Group
            </Label>
            <Select name="age_group" defaultValue="2013">
              <SelectTrigger className="w-full">
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
            <Label className="text-xs uppercase tracking-widest text-white/60">
              Location
            </Label>
            <Select name="location" defaultValue="HQ">
              <SelectTrigger className="w-full">
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
            <Label className="text-xs uppercase tracking-widest text-white/60">
              Notes
            </Label>
            <Input
              name="notes"
              placeholder="Optional session notes..."
              className={inputClass}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-[#ff3355]/10 border border-[#ff3355]/20 px-3 py-2">
              <p className="text-sm text-[#ff3355]">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white font-semibold hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-300 border-0"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Session"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
