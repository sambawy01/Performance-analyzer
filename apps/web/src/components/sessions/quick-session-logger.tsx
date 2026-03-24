"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  Users,
  Heart,
  Loader2,
  CheckCircle2,
  Calendar,
  MapPin,
  Timer,
  Dumbbell,
  Swords,
  HandHeart,
  Leaf,
  UserCheck,
  UserX,
  Sparkles,
} from "lucide-react";
// validation utils used server-side in the API route

interface Player {
  id: string;
  name: string;
  jersey_number: number;
  position: string;
  age_group: string;
  hr_max_measured: number | null;
}

interface PlayerMetric {
  hrAvg: number | null;
}

const SESSION_TYPES = [
  { value: "training", label: "Training", icon: Dumbbell, color: "#00d4ff" },
  { value: "match", label: "Match", icon: Swords, color: "#00ff88" },
  { value: "friendly", label: "Friendly", icon: HandHeart, color: "#a855f7" },
  { value: "recovery", label: "Recovery", icon: Leaf, color: "#ff6b35" },
];

const DURATIONS = [
  { value: 60, label: "60 min" },
  { value: 75, label: "75 min" },
  { value: 90, label: "90 min" },
  { value: 120, label: "120 min" },
];

const LOCATIONS = [
  { value: "HQ", label: "HQ" },
  { value: "October", label: "October" },
  { value: "New Cairo", label: "New Cairo" },
  { value: "Maadi", label: "Maadi" },
];

const AGE_GROUPS = [
  { value: "2010", label: "U16 (2010)" },
  { value: "2012", label: "U14 (2012)" },
  { value: "2013", label: "U13 (2013)" },
];

export function QuickSessionLogger({ players }: { players: Player[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);

  // Step 1: Session Info
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [type, setType] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);
  const [location, setLocation] = useState<string>("");
  const [ageGroup, setAgeGroup] = useState<string>("");

  // Step 2: Attendance
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    new Set()
  );

  // Step 3: Notes
  const [teamNotes, setTeamNotes] = useState("");
  const [playerNotes, setPlayerNotes] = useState<Record<string, string>>({});
  const [autoMetrics, setAutoMetrics] = useState(true);

  // Filter players by selected age group
  const filteredPlayers = useMemo(
    () =>
      ageGroup
        ? players.filter((p) => p.age_group === ageGroup)
        : players,
    [players, ageGroup]
  );

  // Reset selections when age group changes
  const handleAgeGroupChange = (ag: string) => {
    setAgeGroup(ag);
    setSelectedPlayers(new Set());
    setPlayerNotes({});
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedPlayers(new Set(filteredPlayers.map((p) => p.id)));
  };

  const clearAll = () => {
    setSelectedPlayers(new Set());
  };

  const updatePlayerNote = (playerId: string, note: string) => {
    setPlayerNotes((prev) => ({ ...prev, [playerId]: note }));
  };

  const canProceedStep1 =
    date && type && duration > 0 && location && ageGroup;
  const canProceedStep2 = selectedPlayers.size > 0;

  const attendingPlayers = filteredPlayers.filter((p) =>
    selectedPlayers.has(p.id)
  );

  async function handleComplete() {
    setLoading(true);
    setError(null);

    const playerPayload = filteredPlayers.map((p) => ({
      id: p.id,
      attended: selectedPlayers.has(p.id),
      note: playerNotes[p.id] || undefined,
    }));

    try {
      const res = await fetch("/api/sessions/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          type,
          duration,
          location,
          ageGroup,
          autoGenerateMetrics: autoMetrics,
          teamNotes,
          players: playerPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create session");
        setLoading(false);
        return;
      }

      setCreatedSessionId(data.session.id);
      setStep(4);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step indicator
  const steps = [
    { num: 1, label: "Info", icon: Calendar },
    { num: 2, label: "Attendance", icon: Users },
    { num: 3, label: "Notes", icon: Heart },
    { num: 4, label: "Done", icon: Check },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #00ff8830, #00ff8810)",
              border: "1px solid #00ff8830",
            }}
          >
            <ClipboardCheck className="h-5 w-5 text-[#00ff88]" />
          </div>
          <h1 className="text-xl font-bold text-white">Quick Log</h1>
        </div>
        <p className="text-sm text-white/40">
          Log a session in under 2 minutes
        </p>
      </div>

      {/* Step Progress */}
      <div className="flex items-center justify-center gap-1">
        {steps.map((s, i) => {
          const isActive = step === s.num;
          const isComplete = step > s.num;
          const Icon = s.icon;
          return (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30"
                    : isComplete
                      ? "bg-[#00ff88]/10 text-[#00ff88]/60"
                      : "bg-white/[0.04] text-white/30"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-6 h-px mx-1 ${
                    isComplete ? "bg-[#00ff88]/40" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Session Info */}
      {step === 1 && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 text-white font-medium text-base focus:outline-none focus:border-[#00ff88]/50 focus:ring-1 focus:ring-[#00ff88]/30 transition-all [color-scheme:dark]"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Session Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SESSION_TYPES.map((t) => {
                const isSelected = type === t.value;
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className="relative h-16 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-1 active:scale-95"
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${t.color}20, ${t.color}08)`
                        : "rgba(255,255,255,0.04)",
                      borderColor: isSelected
                        ? `${t.color}50`
                        : "rgba(255,255,255,0.08)",
                      boxShadow: isSelected
                        ? `0 0 20px ${t.color}15, inset 0 1px 0 rgba(255,255,255,0.05)`
                        : "none",
                    }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: isSelected ? t.color : "rgba(255,255,255,0.4)" }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: isSelected ? t.color : "rgba(255,255,255,0.5)" }}
                    >
                      {t.label}
                    </span>
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 h-4 w-4 rounded-full flex items-center justify-center"
                        style={{ background: `${t.color}30` }}
                      >
                        <Check
                          className="h-2.5 w-2.5"
                          style={{ color: t.color }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5" />
              Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map((d) => {
                const isSelected = duration === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    className={`h-12 rounded-xl border text-sm font-semibold transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? "bg-[#00d4ff]/15 border-[#00d4ff]/40 text-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.1)]"
                        : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/70"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Location
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LOCATIONS.map((l) => {
                const isSelected = location === l.value;
                return (
                  <button
                    key={l.value}
                    onClick={() => setLocation(l.value)}
                    className={`h-12 rounded-xl border text-sm font-semibold transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? "bg-[#a855f7]/15 border-[#a855f7]/40 text-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                        : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/70"
                    }`}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Age Group */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Age Group
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AGE_GROUPS.map((ag) => {
                const isSelected = ageGroup === ag.value;
                const count = players.filter(
                  (p) => p.age_group === ag.value
                ).length;
                return (
                  <button
                    key={ag.value}
                    onClick={() => handleAgeGroupChange(ag.value)}
                    className={`h-14 rounded-xl border text-sm font-semibold transition-all duration-200 flex flex-col items-center justify-center active:scale-95 ${
                      isSelected
                        ? "bg-[#00ff88]/15 border-[#00ff88]/40 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.1)]"
                        : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/70"
                    }`}
                  >
                    <span>{ag.label}</span>
                    <span className="text-[10px] font-normal opacity-60">
                      {count} players
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next button */}
          <button
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="w-full h-14 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: canProceedStep1
                ? "linear-gradient(135deg, #00ff88, #00d4ff)"
                : "rgba(255,255,255,0.06)",
              color: canProceedStep1 ? "#0a0e1a" : "rgba(255,255,255,0.3)",
            }}
          >
            Next: Attendance
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Step 2: Attendance */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="h-9 px-3 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-xs font-semibold transition-all hover:bg-[#00ff88]/20 active:scale-95 flex items-center gap-1.5"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Select All
              </button>
              <button
                onClick={clearAll}
                className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs font-semibold transition-all hover:bg-white/[0.08] active:scale-95 flex items-center gap-1.5"
              >
                <UserX className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
            <span className="text-sm font-mono font-semibold">
              <span className="text-[#00ff88]">{selectedPlayers.size}</span>
              <span className="text-white/30">/{filteredPlayers.length}</span>
            </span>
          </div>

          {/* Player list */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {filteredPlayers.map((player) => {
              const isSelected = selectedPlayers.has(player.id);
              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 active:scale-[0.98] ${
                    isSelected
                      ? "bg-[#00ff88]/10 border-[#00ff88]/30"
                      : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`h-7 w-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                      isSelected
                        ? "bg-[#00ff88] border-[#00ff88]"
                        : "border-white/20 bg-transparent"
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-4 w-4 text-[#0a0e1a]" />
                    )}
                  </div>

                  {/* Jersey number */}
                  <span
                    className={`font-mono text-sm font-bold w-8 text-center ${
                      isSelected ? "text-[#00ff88]" : "text-white/30"
                    }`}
                  >
                    {player.jersey_number}
                  </span>

                  {/* Name */}
                  <span
                    className={`text-sm font-medium flex-1 text-left ${
                      isSelected ? "text-white" : "text-white/50"
                    }`}
                  >
                    {player.name}
                  </span>

                  {/* Position */}
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isSelected
                        ? "bg-[#00ff88]/15 text-[#00ff88]/70"
                        : "bg-white/[0.04] text-white/25"
                    }`}
                  >
                    {player.position}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="h-14 px-5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/60 font-semibold transition-all hover:bg-white/[0.1] active:scale-95 flex items-center gap-1.5"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className="flex-1 h-14 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: canProceedStep2
                  ? "linear-gradient(135deg, #00ff88, #00d4ff)"
                  : "rgba(255,255,255,0.06)",
                color: canProceedStep2 ? "#0a0e1a" : "rgba(255,255,255,0.3)",
              }}
            >
              Next: Metrics
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Coach Notes + Auto Metrics */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Auto-generate metrics toggle */}
          <div className="rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#a855f7]" />
                <span className="text-sm font-semibold text-white">Auto-Generate Metrics</span>
              </div>
              <button
                onClick={() => setAutoMetrics(!autoMetrics)}
                className={`w-12 h-7 rounded-full transition-all duration-200 ${
                  autoMetrics ? "bg-[#a855f7]" : "bg-white/10"
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    autoMetrics ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-white/40 mt-1.5">
              {autoMetrics
                ? "AI will generate realistic HR, TRIMP, speed, and distance data based on session type and duration. Perfect for demo or when wearables aren't available."
                : "No metrics will be generated. You can add them manually later from the session detail page."}
            </p>
          </div>

          {/* Team Notes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Team Notes
            </label>
            <textarea
              value={teamNotes}
              onChange={(e) => setTeamNotes(e.target.value)}
              placeholder="Overall session observations, tactical notes, team performance..."
              rows={3}
              className="w-full rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#00d4ff]/50 resize-none"
            />
          </div>

          {/* Player Notes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Player Notes (optional)
            </label>
            <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
              {attendingPlayers.map((player) => (
                <div key={player.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-[#00d4ff] w-6 text-center">
                      {player.jersey_number}
                    </span>
                    <span className="text-sm font-medium text-white/70">{player.name}</span>
                  </div>
                  <input
                    type="text"
                    value={playerNotes[player.id] || ""}
                    onChange={(e) => updatePlayerNote(player.id, e.target.value)}
                    placeholder="e.g. Great pressing, needs work on first touch..."
                    className="w-full h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 text-xs text-white/60 placeholder:text-white/20 focus:outline-none focus:border-[#00d4ff]/30"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-[#ff3355]/10 border border-[#ff3355]/20 px-4 py-3">
              <p className="text-sm text-[#ff3355]">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="h-14 px-5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/60 font-semibold transition-all hover:bg-white/[0.1] active:scale-95 flex items-center gap-1.5"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>
            <button
              onClick={() => handleComplete()}
              disabled={loading}
              className="flex-1 h-14 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #00ff88, #00d4ff)",
                color: "#0a0e1a",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Complete Session
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Success animation */}
          <div className="text-center py-6">
            <div
              className="h-20 w-20 rounded-full mx-auto mb-4 flex items-center justify-center animate-in zoom-in duration-500"
              style={{
                background:
                  "linear-gradient(135deg, #00ff8830, #00ff8810)",
                border: "2px solid #00ff8840",
                boxShadow:
                  "0 0 40px rgba(0,255,136,0.2), 0 0 80px rgba(0,255,136,0.1)",
              }}
            >
              <Sparkles className="h-10 w-10 text-[#00ff88]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              Session Logged
            </h2>
            <p className="text-sm text-white/40">
              All data saved successfully
            </p>
          </div>

          {/* Summary card */}
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/30">
                  Date
                </span>
                <p className="text-sm font-medium text-white">{date}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/30">
                  Type
                </span>
                <p className="text-sm font-medium text-white capitalize">
                  {type}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/30">
                  Duration
                </span>
                <p className="text-sm font-medium text-white">
                  {duration} min
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-white/30">
                  Location
                </span>
                <p className="text-sm font-medium text-white">{location}</p>
              </div>
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-white/30">
                Attendance
              </span>
              <span className="font-mono text-sm font-bold text-[#00ff88]">
                {selectedPlayers.size} / {filteredPlayers.length} players
              </span>
            </div>
            {autoMetrics && (
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/30">
                  Metrics
                </span>
                <span className="font-mono text-sm font-bold text-[#a855f7]">
                  Auto-generated
                </span>
              </div>
            )}
            {teamNotes && (
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/30">
                  Coach Notes
                </span>
                <span className="text-sm text-[#00d4ff]">Included</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {createdSessionId && (
              <button
                onClick={() =>
                  router.push(`/sessions/${createdSessionId}`)
                }
                className="w-full h-14 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #00d4ff, #a855f7)",
                  color: "white",
                }}
              >
                View Session Details
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => {
                setStep(1);
                setType("");
                setDuration(0);
                setLocation("");
                setSelectedPlayers(new Set());
                setPlayerNotes({});
                setCreatedSessionId(null);
              }}
              className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/50 font-semibold text-sm transition-all hover:bg-white/[0.1] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <ClipboardCheck className="h-4 w-4" />
              Log Another Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
