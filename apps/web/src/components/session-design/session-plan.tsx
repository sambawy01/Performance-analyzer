"use client";

import { useState } from "react";
import { ClipboardList, Loader2, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SESSION_TYPES = ["training", "recovery", "tactical", "match-prep", "fitness"];
const FOCUS_AREAS = ["pressing", "possession", "transitions", "set pieces", "fitness", "defending", "attacking"];

function formatMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />;

    const formatted = line.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="text-white font-semibold">$1</strong>'
    );

    if (line.trim().startsWith("## ")) {
      const title = line.replace(/^##\s*/, "");
      // Color-code phases
      let color = "text-[#a855f7]";
      if (title.toLowerCase().includes("warm")) color = "text-[#ff9900]";
      if (title.toLowerCase().includes("main")) color = "text-[#00d4ff]";
      if (title.toLowerCase().includes("cool")) color = "text-[#00ff88]";
      if (title.toLowerCase().includes("load") || title.toLowerCase().includes("modif")) color = "text-[#ff3355]";

      return (
        <h3
          key={i}
          className={`text-sm font-bold ${color} mt-5 first:mt-0 uppercase tracking-wider border-b border-white/[0.06] pb-1`}
        >
          {title}
        </h3>
      );
    }

    if (/^\d+\.\s/.test(line.trim())) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-2">
          <span className="text-[#a855f7] font-mono text-xs mt-0.5 shrink-0">
            {line.trim().match(/^(\d+)\./)?.[1]}.
          </span>
          <span
            className="text-white/70 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s*/, "") }}
          />
        </div>
      );
    }

    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-2">
          <span className="text-[#00d4ff] mt-1 shrink-0">•</span>
          <span
            className="text-white/70 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•]\s*/, "") }}
          />
        </div>
      );
    }

    return (
      <p
        key={i}
        className="text-sm text-white/70 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  });
}

export function SessionPlan() {
  const [type, setType] = useState("training");
  const [playerCount, setPlayerCount] = useState("18");
  const [duration, setDuration] = useState("90");
  const [focus, setFocus] = useState("pressing");
  const [notes, setNotes] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function designSession() {
    if (!playerCount || !duration) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/design-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, playerCount: parseInt(playerCount), duration: parseInt(duration), focus, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setPlan(data.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-[#a855f7]" />
            <span>Session Parameters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60 uppercase tracking-wider">
                Session Type
              </Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#a855f7]/50 focus:ring-1 focus:ring-[#a855f7]/20"
              >
                {SESSION_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#0a0a0f] text-white">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/60 uppercase tracking-wider">
                Focus Area
              </Label>
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#a855f7]/50 focus:ring-1 focus:ring-[#a855f7]/20"
              >
                {FOCUS_AREAS.map((f) => (
                  <option key={f} value={f} className="bg-[#0a0a0f] text-white">
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/60 uppercase tracking-wider">
                Players
              </Label>
              <Input
                type="number"
                value={playerCount}
                onChange={(e) => setPlayerCount(e.target.value)}
                min={6}
                max={30}
                className="bg-white/[0.03] border-white/[0.08] text-white focus:border-[#a855f7]/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-white/60 uppercase tracking-wider">
                Duration (min)
              </Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min={30}
                max={180}
                step={15}
                className="bg-white/[0.03] border-white/[0.08] text-white focus:border-[#a855f7]/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-white/60 uppercase tracking-wider">
              Additional Notes (optional)
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Key players returning from injury, focus on left flank..."
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/40 focus:border-[#a855f7]/50"
            />
          </div>

          <button
            onClick={designSession}
            disabled={loading || !playerCount || !duration}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#a855f7] to-[#00d4ff] px-4 py-2 text-sm font-medium text-white hover:shadow-[0_0_25px_rgba(168,85,247,0.35)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Designing Session...
              </>
            ) : plan ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Redesign Session
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Design Session
              </>
            )}
          </button>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-[#ff3355]/10 border border-[#ff3355]/20 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-[#ff3355]" />
          <div>
            <p className="font-medium text-[#ff3355]">Failed to generate</p>
            <p className="text-xs mt-0.5 text-white/60">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="rounded-full bg-[#a855f7]/10 p-5 animate-pulse shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                  <ClipboardList className="h-8 w-8 text-[#a855f7]" />
                </div>
                <div
                  className="absolute inset-0 rounded-full border-2 border-[#a855f7]/30 animate-spin border-t-[#a855f7]"
                  style={{ animationDuration: "2s" }}
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-[#a855f7] animate-pulse font-medium">
                  Designing your session...
                </p>
                <p className="text-xs text-white/40 mt-1">
                  Analysing team load and tactical context
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Plan */}
      {plan && !loading && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#a855f7]" />
              <span className="text-gradient">
                {type.charAt(0).toUpperCase() + type.slice(1)} Session — {focus.charAt(0).toUpperCase() + focus.slice(1)} Focus
              </span>
              <span className="ml-auto text-xs text-white/40">
                {playerCount} players · {duration} min
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">{formatMarkdown(plan)}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
