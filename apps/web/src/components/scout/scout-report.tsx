"use client";

import { useState } from "react";
import { Target, Loader2, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExportShareBar } from "@/components/ui/export-share-bar";

function formatMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />;

    const formatted = line.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="text-white font-semibold">$1</strong>'
    );

    if (line.trim().startsWith("## ")) {
      return (
        <h3
          key={i}
          className="text-sm font-bold text-[#00d4ff] mt-5 first:mt-0 uppercase tracking-wider border-b border-white/[0.06] pb-1"
        >
          {line.replace(/^##\s*/, "")}
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

export function ScoutReport() {
  const [opponent, setOpponent] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateReport() {
    if (!opponent.trim() || !matchDate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/scout-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opponent: opponent.trim(), matchDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setReport(data.report);
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
            <Target className="h-4 w-4 text-[#00d4ff]" />
            <span>Match Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60 uppercase tracking-wider">
                Opponent Name
              </Label>
              <Input
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="e.g. Al-Ahly U16, Cairo SC..."
                className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/40 focus:border-[#00d4ff]/50"
                onKeyDown={(e) => e.key === "Enter" && generateReport()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/60 uppercase tracking-wider">
                Match Date
              </Label>
              <Input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="bg-white/[0.03] border-white/[0.08] text-white focus:border-[#00d4ff]/50"
              />
            </div>
          </div>
          <button
            onClick={generateReport}
            disabled={loading || !opponent.trim() || !matchDate}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#a855f7] px-4 py-2 text-sm font-medium text-white hover:shadow-[0_0_25px_rgba(0,212,255,0.35)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Researching &amp; Analyzing...
              </>
            ) : report ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Regenerate Report
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Opponent Dossier
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

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="rounded-full bg-[#00d4ff]/10 p-5 animate-pulse shadow-[0_0_30px_rgba(0,212,255,0.2)]">
                  <Target className="h-8 w-8 text-[#00d4ff]" />
                </div>
                <div
                  className="absolute inset-0 rounded-full border-2 border-[#00d4ff]/30 animate-spin border-t-[#00d4ff]"
                  style={{ animationDuration: "2s" }}
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-[#00d4ff] animate-pulse font-medium">
                  Researching {opponent}...
                </p>
                <p className="text-xs text-white/40 mt-1">
                  Gathering intel, analyzing formation &amp; key players
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report */}
      {report && !loading && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#00d4ff]" />
                  <span className="text-gradient">
                    Opponent Dossier — vs {opponent}
                  </span>
                </CardTitle>
                <span className="text-xs text-white/40">{matchDate}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">{formatMarkdown(report)}</div>
            </CardContent>
          </Card>
          <ExportShareBar
            title={`Scout Report — vs ${opponent}`}
            content={report}
          />
        </>
      )}
    </div>
  );
}
