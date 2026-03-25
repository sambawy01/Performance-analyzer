"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Brain,
  Loader2,
  RefreshCw,
  AlertCircle,
  Send,
  MessageSquare,
  Sparkles,
  User,
  Bot,
} from "lucide-react";
import { ExportShareBar } from "@/components/ui/export-share-bar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiReportChatProps {
  title: string;
  reportEndpoint: string;
  chatEndpoint: string;
  reportBody: Record<string, string>;
  context: string;
  placeholder?: string;
}

function formatMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />;

    // Bold text
    const formatted = line.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="text-white font-semibold">$1</strong>'
    );

    // Numbered list
    if (/^\d+\.\s/.test(line.trim())) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-2">
          <span className="text-[#a855f7] font-mono text-xs mt-0.5 shrink-0">
            {line.trim().match(/^(\d+)\./)?.[1]}.
          </span>
          <span
            className="text-white/50 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s*/, "") }}
          />
        </div>
      );
    }

    // Bullet points
    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-2">
          <span className="text-[#00d4ff] mt-1 shrink-0">•</span>
          <span
            className="text-white/50 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•]\s*/, "") }}
          />
        </div>
      );
    }

    // Section headers
    if (line.trim().startsWith("##") || line.trim().startsWith("**") && line.trim().endsWith("**")) {
      return (
        <p key={i} className="text-sm font-semibold text-white mt-3 first:mt-0 tracking-tight">
          {line.replace(/[#*]/g, "").trim()}
        </p>
      );
    }

    return (
      <p
        key={i}
        className="text-sm text-white/50 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  });
}

export function AiReportChat({
  title,
  reportEndpoint,
  chatEndpoint,
  reportBody,
  context,
  placeholder = "Generate an AI-powered analysis...",
}: AiReportChatProps) {
  const [report, setReport] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function generateReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(reportEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportBody),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setReport(data.summary);
      setMessages([{ role: "assistant", content: data.summary }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || chatLoading) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setChatLoading(true);

    try {
      const res = await fetch(chatEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: `Error: ${e instanceof Error ? e.message : "Failed to respond"}` },
      ]);
    } finally {
      setChatLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="space-y-4">
      {/* Report Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-[#a855f7] drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
              <span className="text-gradient">{title}</span>
            </CardTitle>
            <button
              onClick={generateReport}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#a855f7] to-[#00d4ff] px-3 py-1.5 text-xs font-medium text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing...
                </>
              ) : report ? (
                <>
                  <RefreshCw className="h-3 w-3" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  Generate Analysis
                </>
              )}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#ff3355]/10 border border-[#ff3355]/20 text-sm mb-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-[#ff3355]" />
              <div>
                <p className="font-medium text-[#ff3355]">Failed to generate</p>
                <p className="text-xs mt-0.5 text-white/60">{error}</p>
              </div>
            </div>
          )}

          {!report && !loading && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="rounded-full bg-[#a855f7]/10 p-4 mb-4 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                <Brain className="h-8 w-8 text-[#a855f7]" />
              </div>
              <p className="text-sm text-white/60 max-w-md">{placeholder}</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-8">
              <div className="relative">
                <div className="rounded-full bg-[#a855f7]/10 p-4 animate-pulse shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                  <Brain className="h-8 w-8 text-[#a855f7]" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-[#a855f7]/30 animate-spin border-t-[#a855f7]" style={{ animationDuration: "2s" }} />
              </div>
              <p className="text-sm text-[#a855f7] mt-4 animate-pulse">
                Analyzing data with Coach M8 AI...
              </p>
            </div>
          )}

          {report && !loading && (
            <>
              <div className="space-y-1.5">{formatMarkdown(report)}</div>
              <div className="mt-4">
                <ExportShareBar
                  title={title}
                  content={report}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Chat Interface — only shows after report is generated */}
      {report && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-[#00d4ff]" />
              <span>Discuss with AI Analyst</span>
              <span className="text-xs text-white/60 uppercase tracking-widest ml-2">
                Ask follow-up questions
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Chat messages */}
            <div className="max-h-[400px] overflow-y-auto space-y-3 mb-4 pr-1">
              {messages.slice(1).map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 mt-0.5">
                      <div className="h-6 w-6 rounded-full bg-[#a855f7]/15 flex items-center justify-center">
                        <Bot className="h-3.5 w-3.5 text-[#a855f7]" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-white"
                        : "bg-white/[0.03] border border-white/[0.06]"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="space-y-1">{formatMarkdown(msg.content)}</div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="shrink-0 mt-0.5">
                      <div className="h-6 w-6 rounded-full bg-[#00d4ff]/15 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-[#00d4ff]" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div className="flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="h-6 w-6 rounded-full bg-[#a855f7]/15 flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-[#a855f7]" />
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#a855f7] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-1.5 w-1.5 rounded-full bg-[#a855f7] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-1.5 w-1.5 rounded-full bg-[#a855f7] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick suggestion chips */}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  "Which players should rest before the next match?",
                  "Give me a full squad fitness ranking right now",
                  "Who had the biggest load spike this week?",
                  "Compare Ahmed and Youssef's last 5 sessions",
                  "Design next week's training plan based on current loads",
                  "Who should start Saturday and who should be on the bench?",
                  "What's our pressing intensity trend over the last 2 weeks?",
                  "Which players are improving fastest?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                      setTimeout(() => {
                        const fakeEvent = { preventDefault: () => {} } as any;
                        sendMessage();
                      }, 100);
                    }}
                    className="text-xs px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-[#00d4ff] hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/5 transition-all duration-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input bar */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about the data... (e.g. 'Should Ahmed play the full match Saturday?')"
                className="flex-1 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/60 focus:border-[#00d4ff]/50 focus:ring-[#00d4ff]/20"
                disabled={chatLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || chatLoading}
                className="shrink-0 h-9 w-9 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#a855f7] flex items-center justify-center hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all duration-300 disabled:opacity-30"
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              <Brain className="h-3 w-3 text-[#a855f7]/40" />
              <span className="text-xs text-white/60">
                Coach M8 AI — powered by your academy&apos;s live performance data
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
