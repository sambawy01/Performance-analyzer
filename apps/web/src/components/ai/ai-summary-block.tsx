"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, RefreshCw, AlertCircle } from "lucide-react";

interface AiSummaryBlockProps {
  title: string;
  apiEndpoint: string;
  requestBody: Record<string, string>;
  placeholder?: string;
}

export function AiSummaryBlock({
  title,
  apiEndpoint,
  requestBody,
  placeholder = "Click 'Generate' to create an AI-powered analysis based on the player's data.",
}: AiSummaryBlockProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate");
      }

      setSummary(data.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-violet-500" />
            {title}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generate}
            disabled={loading}
            className="text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Analyzing...
              </>
            ) : summary ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Regenerate
              </>
            ) : (
              <>
                <Brain className="h-3 w-3 mr-1" />
                Generate Analysis
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#ff3355]/10 border border-[#ff3355]/20 text-sm mb-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Failed to generate</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {summary ? (
          <div className="space-y-2">
            {summary.split("\n").map((paragraph, i) => {
              if (!paragraph.trim()) return null;
              // Render bullet points
              if (paragraph.trim().startsWith("- ") || paragraph.trim().startsWith("• ")) {
                return (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-violet-500 mt-0.5 shrink-0">•</span>
                    <span className="text-muted-foreground leading-relaxed">
                      {paragraph.trim().replace(/^[-•]\s*/, "")}
                    </span>
                  </div>
                );
              }
              // Bold headers (lines ending with :)
              if (paragraph.trim().endsWith(":") || paragraph.trim().startsWith("**")) {
                return (
                  <p key={i} className="text-sm font-semibold mt-3 first:mt-0">
                    {paragraph.replace(/\*\*/g, "")}
                  </p>
                );
              }
              return (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
            <div className="flex items-center gap-1.5 pt-3 border-t mt-3">
              <Brain className="h-3 w-3 text-violet-400" />
              <span className="text-[10px] text-violet-400 font-medium">
                Coach M8 AI — analysis based on wearable HR and load data
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">{placeholder}</p>
        )}
      </CardContent>
    </Card>
  );
}
