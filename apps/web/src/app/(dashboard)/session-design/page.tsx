import { ClipboardList } from "lucide-react";
import { SessionPlan } from "@/components/session-design/session-plan";

export default function SessionDesignPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-[#a855f7]" />
          Session Design AI
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Generate load-aware training sessions tailored to your squad&apos;s current state
        </p>
      </div>
      <SessionPlan />
    </div>
  );
}
