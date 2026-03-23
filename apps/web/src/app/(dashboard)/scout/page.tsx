import { Target } from "lucide-react";
import { ScoutReport } from "@/components/scout/scout-report";

export default function ScoutPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-6 w-6 text-[#00d4ff]" />
          Opponent Scout Report
        </h2>
        <p className="text-sm text-white/50 mt-1">
          AI-generated pre-match tactical plan based on your squad&apos;s current data
        </p>
      </div>
      <ScoutReport />
    </div>
  );
}
