"use client";

import { AiReportChat } from "@/components/ai/ai-report-chat";

interface SessionAiReportTabProps {
  sessionId: string;
  sessionContext: string;
}

export function SessionAiReportTab({ sessionId, sessionContext }: SessionAiReportTabProps) {
  return (
    <AiReportChat
      title="AI Session Analysis"
      reportEndpoint="/api/ai/session-summary"
      chatEndpoint="/api/ai/chat"
      reportBody={{ sessionId }}
      context={sessionContext}
      placeholder="Generate a comprehensive AI session report analyzing team intensity, individual performance, load impact, tactical observations, and next-session recommendations."
    />
  );
}
