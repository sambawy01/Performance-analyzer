"use client";

import { useState } from "react";
import { Brain, Loader2, Sparkles, FileText, ChevronDown, ChevronRight } from "lucide-react";

interface SessionOption {
  id: string;
  date: string;
  type: string;
  age_group: string;
  location: string;
}

interface PlayerRating {
  name: string;
  jerseyNumber: number;
  rating: number;
  reasoning: string;
}

interface MatchDebriefProps {
  sessions: SessionOption[];
}

function formatMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />;

    const html = line.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="text-white font-semibold">$1</strong>'
    );

    if (/^##\s/.test(line)) {
      return (
        <h3 key={i} className="text-sm font-bold text-white mt-5 first:mt-0 flex items-center gap-2">
          <span
            className="h-1 w-4 rounded-full inline-block"
            style={{ background: "linear-gradient(90deg, #a855f7, #00d4ff)" }}
          />
          {line.replace(/^#+\s*/, "")}
        </h3>
      );
    }

    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-4">
          <span className="text-[#00d4ff] mt-1 shrink-0">•</span>
          <span className="text-white/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: html.replace(/^[-•]\s*/, "") }} />
        </div>
      );
    }

    if (/^\d+\.\s/.test(line.trim())) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-4">
          <span className="text-[#a855f7] font-mono text-xs mt-0.5 shrink-0">
            {line.trim().match(/^(\d+)\./)?.[1]}.
          </span>
          <span className="text-white/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: html.replace(/^\d+\.\s*/, "") }} />
        </div>
      );
    }

    return (
      <p key={i} className="text-sm text-white/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
    );
  });
}

function RatingBar({ rating, name, jerseyNumber, reasoning }: PlayerRating) {
  const pct = (rating / 10) * 100;
  const color =
    rating >= 8 ? "#00ff88" : rating >= 6 ? "#00d4ff" : rating >= 4 ? "#ff6b35" : "#ff3355";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${color}20`, color }}
          >
            #{jerseyNumber}
          </span>
          <span className="text-sm text-white/80">{name}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>
          {rating}/10
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className="text-xs text-white/40">{reasoning}</p>
    </div>
  );
}

export function MatchDebrief({ sessions }: MatchDebriefProps) {
  const [selectedSession, setSelectedSession] = useState<string>(sessions[0]?.id ?? "");
  const [debrief, setDebrief] = useState<string | null>(null);
  const [playerRatings, setPlayerRatings] = useState<PlayerRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRatings, setShowRatings] = useState(true);

  const generate = async () => {
    if (!selectedSession || loading) return;
    setLoading(true);
    setError(null);
    setDebrief(null);
    setPlayerRatings([]);

    try {
      const res = await fetch("/api/ai/match-debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSession }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate debrief");
      setDebrief(data.debrief);
      setPlayerRatings(data.playerRatings ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const selected = sessions.find((s) => s.id === selectedSession);

  return (
    <div className="space-y-6">
      {/* Session selector */}
      <div
        className="rounded-xl border border-white/[0.08] p-5"
        style={{ background: "rgba(10,14,26,0.8)" }}
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs text-white/40 uppercase tracking-widest">
              Select Session
            </label>
            <select
              value={selectedSession}
              onChange={(e) => {
                setSelectedSession(e.target.value);
                setDebrief(null);
                setError(null);
              }}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 cursor-pointer"
            >
              <option value="" className="bg-[#0a0e1a]">— Choose a session —</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0a0e1a]">
                  {s.date} · {s.type} · {s.age_group} · {s.location}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generate}
            disabled={!selectedSession || loading}
            className="shrink-0 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #00d4ff 100%)",
              boxShadow: selectedSession && !loading ? "0 0 24px rgba(168,85,247,0.35)" : undefined,
            }}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate Debrief</>
            )}
          </button>
        </div>

        {selected && (
          <div className="mt-3 flex flex-wrap gap-3">
            {[
              { label: "Date", value: selected.date },
              { label: "Type", value: selected.type },
              { label: "Age Group", value: selected.age_group },
              { label: "Location", value: selected.location },
            ].map((item) => (
              <div key={item.label} className="text-xs">
                <span className="text-white/30">{item.label}: </span>
                <span className="text-white/60">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-[#ff3355]/20 bg-[#ff3355]/10 px-4 py-3 text-sm text-[#ff3355]">
          {error}
        </div>
      )}

      {loading && (
        <div
          className="rounded-xl border border-white/[0.08] p-12 flex flex-col items-center gap-4"
          style={{ background: "rgba(10,14,26,0.8)" }}
        >
          <div className="relative">
            <div className="rounded-full bg-[#a855f7]/10 p-5 animate-pulse">
              <Brain className="h-10 w-10 text-[#a855f7]" />
            </div>
            <div
              className="absolute inset-0 rounded-full border-2 border-[#a855f7]/30 animate-spin border-t-[#a855f7]"
              style={{ animationDuration: "2s" }}
            />
          </div>
          <p className="text-sm text-[#a855f7] animate-pulse">
            Coach M8 is generating your match debrief...
          </p>
          <p className="text-xs text-white/30">
            Analyzing wearable data, tactical metrics, and video events
          </p>
        </div>
      )}

      {/* Player Ratings */}
      {playerRatings.length > 0 && !loading && (
        <div
          className="rounded-xl border border-white/[0.08] overflow-hidden"
          style={{ background: "rgba(10,14,26,0.8)" }}
        >
          <button
            onClick={() => setShowRatings((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#00ff88]" />
              <span className="text-sm font-semibold text-white">
                Player Ratings ({playerRatings.length} players)
              </span>
            </div>
            {showRatings ? (
              <ChevronDown className="h-4 w-4 text-white/40" />
            ) : (
              <ChevronRight className="h-4 w-4 text-white/40" />
            )}
          </button>

          {showRatings && (
            <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/[0.04]">
              {playerRatings
                .sort((a, b) => b.rating - a.rating)
                .map((r) => (
                  <RatingBar key={r.jerseyNumber} {...r} />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Debrief report */}
      {debrief && !loading && (
        <div
          className="rounded-xl border border-white/[0.08] p-6 space-y-1.5"
          style={{ background: "rgba(10,14,26,0.8)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-4 w-4 text-[#a855f7]" />
            <h3 className="text-sm font-semibold text-white/80">
              AI Match Debrief Report
            </h3>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(168,85,247,0.15)",
                color: "#a855f7",
              }}
            >
              Coach M8
            </span>
          </div>
          <div className="space-y-1">{formatMarkdown(debrief)}</div>
        </div>
      )}
    </div>
  );
}
