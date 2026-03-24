"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, Save, Activity } from "lucide-react";

interface Player {
  id: string;
  name: string;
  jersey_number: number;
  position: string;
  hr_max_measured: number | null;
}

interface MetricRow {
  playerId: string;
  hrAvg: string;
  hrMax: string;
}

function calculateTrimp(
  durationMinutes: number,
  hrAvg: number,
  hrMax: number
): number {
  // Modified Banister TRIMP: duration * (HR_avg - 60) / (HR_max - 60) * factor
  const restHr = 60;
  if (hrMax <= restHr) return 0;
  const ratio = (hrAvg - restHr) / (hrMax - restHr);
  const factor = 1.67; // Male youth approximation
  const trimp = durationMinutes * ratio * factor;
  return Math.round(Math.max(0, trimp) * 10) / 10;
}

export function MetricsEntry({
  sessionId,
  durationMinutes,
  players,
  hasExistingMetrics,
}: {
  sessionId: string;
  durationMinutes: number;
  players: Player[];
  hasExistingMetrics: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [metrics, setMetrics] = useState<MetricRow[]>(
    players.map((p) => ({
      playerId: p.id,
      hrAvg: "",
      hrMax: "",
    }))
  );

  const updateMetric = useCallback(
    (playerId: string, field: "hrAvg" | "hrMax", value: string) => {
      setMetrics((prev) =>
        prev.map((m) =>
          m.playerId === playerId ? { ...m, [field]: value } : m
        )
      );
    },
    []
  );

  async function handleSave() {
    setLoading(true);
    setError(null);

    // Filter out empty rows
    const filledMetrics = metrics.filter(
      (m) => m.hrAvg.trim() !== "" && m.hrMax.trim() !== ""
    );

    if (filledMetrics.length === 0) {
      setError("Enter HR data for at least one player");
      setLoading(false);
      return;
    }

    // Validate values
    for (const m of filledMetrics) {
      const avg = parseFloat(m.hrAvg);
      const max = parseFloat(m.hrMax);
      if (isNaN(avg) || isNaN(max)) {
        setError("All HR values must be valid numbers");
        setLoading(false);
        return;
      }
      if (avg < 40 || avg > 220 || max < 40 || max > 220) {
        setError("HR values must be between 40 and 220 bpm");
        setLoading(false);
        return;
      }
      if (avg > max) {
        const player = players.find((p) => p.id === m.playerId);
        setError(`HR Avg cannot exceed HR Max for ${player?.name ?? "player"}`);
        setLoading(false);
        return;
      }
    }

    const payload = filledMetrics.map((m) => {
      const hrAvg = parseFloat(m.hrAvg);
      const hrMax = parseFloat(m.hrMax);
      return {
        playerId: m.playerId,
        hrAvg,
        hrMax,
        trimpScore: calculateTrimp(durationMinutes, hrAvg, hrMax),
      };
    });

    try {
      const res = await fetch(`/api/sessions/${sessionId}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: payload }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError("Failed to save metrics");
    } finally {
      setLoading(false);
    }
  }

  if (hasExistingMetrics) {
    return null;
  }

  if (success) {
    return (
      <Card className="glass border-[#00ff88]/20 glow-green">
        <CardContent className="py-8 text-center">
          <Activity className="h-8 w-8 text-[#00ff88] mx-auto mb-2" />
          <p className="text-[#00ff88] font-semibold">Metrics saved successfully</p>
          <p className="text-sm text-white/50 mt-1">
            TRIMP scores have been auto-calculated
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-[#ff3355]" />
          Quick Metrics Entry
          <Badge variant="outline" className="ml-auto text-xs">
            {durationMinutes} min session
          </Badge>
        </CardTitle>
        <p className="text-sm text-white/50">
          Enter HR data for each player. TRIMP is auto-calculated.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_100px_100px_100px] gap-2 text-xs uppercase tracking-widest text-white/40 px-2">
          <span>Player</span>
          <span className="text-center">HR Avg</span>
          <span className="text-center">HR Max</span>
          <span className="text-center">TRIMP est.</span>
        </div>

        {/* Player rows */}
        {players.map((player) => {
          const row = metrics.find((m) => m.playerId === player.id);
          const hrAvg = parseFloat(row?.hrAvg ?? "0");
          const hrMax = parseFloat(row?.hrMax ?? "0");
          const trimp =
            row?.hrAvg && row?.hrMax && !isNaN(hrAvg) && !isNaN(hrMax) && hrMax > 60
              ? calculateTrimp(durationMinutes, hrAvg, hrMax)
              : null;

          return (
            <div
              key={player.id}
              className="grid grid-cols-[1fr_100px_100px_100px] gap-2 items-center rounded-lg bg-white/[0.02] border border-white/[0.04] px-2 py-2 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#00d4ff] w-6 text-center">
                  {player.jersey_number}
                </span>
                <span className="text-sm font-medium truncate">
                  {player.name}
                </span>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {player.position}
                </Badge>
              </div>
              <Input
                type="number"
                min="40"
                max="220"
                placeholder="--"
                value={row?.hrAvg ?? ""}
                onChange={(e) =>
                  updateMetric(player.id, "hrAvg", e.target.value)
                }
                className="h-8 text-center font-mono text-sm bg-white/[0.03] border-white/10"
              />
              <Input
                type="number"
                min="40"
                max="220"
                placeholder="--"
                value={row?.hrMax ?? ""}
                onChange={(e) =>
                  updateMetric(player.id, "hrMax", e.target.value)
                }
                className="h-8 text-center font-mono text-sm bg-white/[0.03] border-white/10"
              />
              <div className="text-center font-mono text-sm">
                {trimp !== null ? (
                  <span
                    className={
                      trimp > 300
                        ? "text-[#ff3355]"
                        : trimp > 200
                          ? "text-[#ff6b35]"
                          : trimp > 100
                            ? "text-[#00ff88]"
                            : "text-[#00d4ff]"
                    }
                  >
                    {trimp}
                  </span>
                ) : (
                  <span className="text-white/20">--</span>
                )}
              </div>
            </div>
          );
        })}

        {error && (
          <div className="rounded-lg bg-[#ff3355]/10 border border-[#ff3355]/20 px-3 py-2">
            <p className="text-sm text-[#ff3355]">{error}</p>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white font-semibold hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-300 border-0"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Metrics...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Metrics
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
