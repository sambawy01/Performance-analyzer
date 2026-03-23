"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Brain, Send, X, ChevronUp, ChevronDown, Loader2 } from "lucide-react";

interface QAPair {
  question: string;
  answer: string;
}

function formatMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-1" />;

    const formatted = line.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="text-white font-semibold">$1</strong>'
    );

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

    if (line.trim().startsWith("##")) {
      return (
        <p key={i} className="text-sm font-semibold text-white mt-2 first:mt-0">
          {line.replace(/^#+\s*/, "").trim()}
        </p>
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

const QUICK_CHIPS = [
  "Who should rest?",
  "Squad fitness ranking",
  "Best formation?",
  "Players at risk today",
  "Load spike this week?",
];

export function QueryBar() {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<QAPair[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
        inputRef.current?.blur();
      }
    },
    []
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const askQuestion = useCallback(async (question: string) => {
    if (!question.trim() || isLoading) return;

    const q = question.trim();
    setInput("");
    setIsLoading(true);
    setIsExpanded(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: q }],
          context: "Global query bar — coach asking a quick question from any page.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get response");

      setHistory((prev) => {
        const updated = [{ question: q, answer: data.reply }, ...prev];
        return updated.slice(0, 3);
      });
    } catch (e) {
      setHistory((prev) => {
        const updated = [
          {
            question: q,
            answer: `Error: ${e instanceof Error ? e.message : "Something went wrong"}`,
          },
          ...prev,
        ];
        return updated.slice(0, 3);
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSubmit = () => {
    if (input.trim()) askQuestion(input);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      {/* Expandable panel */}
      {isExpanded && (
        <div
          ref={panelRef}
          className="pointer-events-auto mx-auto max-w-3xl mb-0 px-4"
        >
          <div
            className="rounded-t-2xl border border-white/10 border-b-0 shadow-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,14,26,0.97) 0%, rgba(15,20,40,0.99) 100%)",
              backdropFilter: "blur(24px)",
            }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Brain className="h-3.5 w-3.5 text-[#a855f7]" />
                <span className="text-xs text-white/50 uppercase tracking-widest">
                  Coach M8 Answers
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[340px] overflow-y-auto p-4 space-y-4">
              {isLoading && (
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-[#a855f7]/15 flex items-center justify-center shrink-0">
                    <Loader2 className="h-3.5 w-3.5 text-[#a855f7] animate-spin" />
                  </div>
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#a855f7] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-[#a855f7] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-[#a855f7] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              {history.map((pair, i) => (
                <div key={i} className="space-y-2">
                  {/* Question */}
                  <div className="flex justify-end">
                    <div className="max-w-[75%] rounded-lg px-3 py-2 bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-sm text-white">
                      {pair.question}
                    </div>
                  </div>
                  {/* Answer */}
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-full bg-[#a855f7]/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Brain className="h-3 w-3 text-[#a855f7]" />
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 flex-1">
                      <div className="space-y-1">{formatMarkdown(pair.answer)}</div>
                    </div>
                  </div>
                  {i < history.length - 1 && (
                    <div className="border-t border-white/[0.04] pt-2" />
                  )}
                </div>
              ))}

              {history.length === 0 && !isLoading && (
                <p className="text-sm text-white/40 text-center py-4">
                  Ask Coach M8 anything about your squad...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div
        className="pointer-events-auto px-4 pb-4 pt-2"
        style={{ background: isExpanded ? "transparent" : undefined }}
      >
        <div className="mx-auto max-w-3xl">
          {/* Quick chips */}
          {!isExpanded && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => askQuestion(chip)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/[0.1] bg-black/40 text-white/50 hover:text-[#00d4ff] hover:border-[#00d4ff]/40 hover:bg-[#00d4ff]/5 transition-all duration-200 backdrop-blur-xl"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <div
            className="flex items-center gap-3 rounded-2xl border border-white/[0.12] px-4 py-3 shadow-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(10,14,26,0.95) 0%, rgba(20,15,45,0.95) 100%)",
              backdropFilter: "blur(24px)",
              boxShadow:
                "0 0 0 1px rgba(168,85,247,0.08), 0 8px 32px rgba(0,0,0,0.6), 0 0 60px rgba(168,85,247,0.05)",
            }}
          >
            <Brain className="h-4 w-4 text-[#a855f7] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              onFocus={() => history.length > 0 && setIsExpanded(true)}
              placeholder="Ask Coach M8 anything..."
              className="flex-1 bg-transparent text-white placeholder:text-white/30 text-sm outline-none min-w-0"
            />
            {history.length > 0 && (
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="shrink-0 text-white/30 hover:text-white/60 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
            )}
            {input && (
              <button
                onClick={() => setInput("")}
                className="shrink-0 text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-30"
              style={{
                background:
                  "linear-gradient(135deg, #a855f7 0%, #00d4ff 100%)",
                boxShadow: input.trim()
                  ? "0 0 20px rgba(168,85,247,0.4)"
                  : undefined,
              }}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 text-white" />
              )}
            </button>
          </div>

          <p className="text-center text-xs text-white/20 mt-1.5">
            Press Esc to close · Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
