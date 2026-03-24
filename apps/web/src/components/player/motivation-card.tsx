"use client";

import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

interface MotivationCardProps {
  playerId: string;
  initialMessage?: string;
  context?: "motivation" | "development" | "tip" | "challenge";
}

export function MotivationCard({
  playerId,
  initialMessage,
  context = "motivation",
}: MotivationCardProps) {
  const [message, setMessage] = useState(
    initialMessage ?? "Loading your personalized insight..."
  );
  const [loading, setLoading] = useState(!initialMessage);
  const [hasLoaded, setHasLoaded] = useState(!!initialMessage);

  async function fetchMotivation() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/player-motivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, context }),
      });
      const data = await res.json();
      if (data.message) {
        setMessage(data.message);
      } else if (data.error) {
        setMessage(
          "Keep pushing yourself in every session. Your consistency is building something great."
        );
      }
    } catch {
      setMessage(
        "Every session counts. Stay focused, stay hungry, and trust the process."
      );
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }

  // Auto-fetch on mount if no initial message
  if (!hasLoaded && !initialMessage) {
    fetchMotivation();
  }

  return (
    <div className="glass rounded-2xl p-5 relative overflow-hidden group">
      {/* Accent glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#a855f7]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-[#a855f7]" />
        <span className="text-xs font-semibold text-[#a855f7] uppercase tracking-wider">
          AI Coach Insight
        </span>
        <button
          onClick={fetchMotivation}
          disabled={loading}
          className="ml-auto p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors disabled:opacity-40"
          aria-label="Refresh insight"
        >
          <RefreshCw
            size={14}
            className={`text-white/40 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <p
        className={`text-sm text-white/80 leading-relaxed transition-opacity duration-300 ${
          loading ? "opacity-40" : "opacity-100"
        }`}
      >
        {message}
      </p>
    </div>
  );
}
