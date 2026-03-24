"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff3355]/10 border border-[#ff3355]/20">
        <AlertTriangle className="h-8 w-8 text-[#ff3355]" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-xl font-bold text-white">Something went wrong</h2>
        <p className="text-sm text-white/50">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        {error.digest && (
          <p className="text-xs text-white/30 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <Button
        onClick={reset}
        className="bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white font-semibold hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-300 border-0"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}
