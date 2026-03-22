"use client";

import { AiSummaryBlock } from "@/components/ai/ai-summary-block";

export function SessionAiReportTab({ sessionId }: { sessionId: string }) {
  return (
    <AiSummaryBlock
      title="AI Session Report"
      apiEndpoint="/api/ai/session-summary"
      requestBody={{ sessionId }}
      placeholder="Click 'Generate Analysis' to create an AI-powered session report analyzing team intensity, individual performance, load alerts, and coaching recommendations."
    />
  );
}
