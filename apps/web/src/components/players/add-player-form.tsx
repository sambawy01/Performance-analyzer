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
import { Loader2, Plus, UserPlus } from "lucide-react";

const POSITIONS = [
  { value: "GK", label: "GK - Goalkeeper" },
  { value: "CB", label: "CB - Centre Back" },
  { value: "LB", label: "LB - Left Back" },
  { value: "RB", label: "RB - Right Back" },
  { value: "CDM", label: "CDM - Def. Midfielder" },
  { value: "CM", label: "CM - Central Midfielder" },
  { value: "CAM", label: "CAM - Att. Midfielder" },
  { value: "LW", label: "LW - Left Wing" },
  { value: "RW", label: "RW - Right Wing" },
  { value: "ST", label: "ST - Striker" },
  { value: "CF", label: "CF - Centre Forward" },
];

const AGE_GROUPS = [
  { value: "2010", label: "U16 (2010)" },
  { value: "2011", label: "U15 (2011)" },
  { value: "2012", label: "U14 (2012)" },
  { value: "2013", label: "U13 (2013)" },
  { value: "2014", label: "U12 (2014)" },
  { value: "2015", label: "U11 (2015)" },
  { value: "2016", label: "U10 (2016)" },
];

export function AddPlayerForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [position, setPosition] = useState("");
  const [ageGroup, setAgeGroup] = useState("2013");
  const [dominantFoot, setDominantFoot] = useState("right");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  function resetForm() {
    setName("");
    setJerseyNumber("");
    setPosition("");
    setAgeGroup("2013");
    setDominantFoot("right");
    setHeightCm("");
    setWeightKg("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          jerseyNumber,
          position,
          ageGroup,
          dominantFoot,
          heightCm: heightCm || null,
          weightKg: weightKg || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      resetForm();
      setOpen(false);
      router.refresh();
    } catch {
      setError("Failed to create player");
      setLoading(false);
    }
  }

  const inputClass =
    "bg-white/[0.04] border-white/10 text-white placeholder:text-white/40 focus-visible:border-[#00d4ff]/50 focus-visible:ring-[#00d4ff]/20";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#a855f7] px-4 py-2 text-sm font-medium text-white hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-300">
        <Plus className="h-4 w-4 mr-2" />
        Add Player
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#00d4ff]" />
            Add New Player
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-white/60">
              Player Name *
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Mohamed Salah"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-white/60">
                Jersey Number *
              </Label>
              <Input
                type="number"
                min="1"
                max="99"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                required
                placeholder="10"
                className={`${inputClass} font-mono text-center`}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-white/60">
                Position *
              </Label>
              <Select value={position} onValueChange={(v) => v && setPosition(v)} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-white/60">
                Age Group
              </Label>
              <Select value={ageGroup} onValueChange={(v) => v && setAgeGroup(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGE_GROUPS.map((ag) => (
                    <SelectItem key={ag.value} value={ag.value}>
                      {ag.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-white/60">
                Dominant Foot
              </Label>
              <Select value={dominantFoot} onValueChange={(v) => v && setDominantFoot(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-white/60">
                Height (cm)
              </Label>
              <Input
                type="number"
                min="100"
                max="220"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="165"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-white/60">
                Weight (kg)
              </Label>
              <Input
                type="number"
                min="20"
                max="120"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="55"
                className={`${inputClass} font-mono`}
              />
            </div>
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
                Adding Player...
              </>
            ) : (
              "Add Player"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
