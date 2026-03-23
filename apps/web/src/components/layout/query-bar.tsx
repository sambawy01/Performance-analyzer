"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Brain, Send, X, Loader2, Sparkles, Bot, User, Minimize2 } from "lucide-react";

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
          <span className="text-white/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s*/, "") }} />
        </div>
      );
    }
    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-2">
          <span className="text-[#00d4ff] mt-0.5">•</span>
          <span className="text-white/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•]\s*/, "") }} />
        </div>
      );
    }
    if (line.trim().startsWith("##") || (line.trim().startsWith("**") && line.trim().endsWith("**"))) {
      return <p key={i} className="text-sm font-semibold text-white mt-3 first:mt-0">{line.replace(/[#*]/g, "").trim()}</p>;
    }
    return <p key={i} className="text-sm text-white/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
  });
}

export function QueryBar() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QAPair[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false);
      // Cmd/Ctrl + K to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  async function ask() {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...history.flatMap((h) => [
              { role: "user", content: h.question },
              { role: "assistant", content: h.answer },
            ]),
            { role: "user", content: q },
          ],
          context: "",
        }),
      });
      const data = await res.json();
      setHistory((prev) => [...prev, { question: q, answer: data.reply ?? "No response." }]);
    } catch {
      setHistory((prev) => [...prev, { question: q, answer: "Failed to get response." }]);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  // Render the slide-out panel via portal
  return createPortal(
    <>
      {/* Overlay when open */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-[998]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Toggle button — fixed bottom-right */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[999] h-14 w-14 rounded-full bg-gradient-to-br from-[#a855f7] to-[#00d4ff] flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] hover:scale-110 transition-all duration-300"
          title="Ask Coach M8 (⌘K)"
        >
          <Brain className="h-6 w-6 text-white" />
        </button>
      )}

      {/* Side panel */}
      <div
        className={`fixed top-0 right-0 h-full z-[999] transition-all duration-300 ease-in-out ${
          open ? "w-[420px] translate-x-0" : "w-0 translate-x-full"
        }`}
      >
        <div className="h-full w-[420px] bg-[#0a0e1a]/98 backdrop-blur-xl border-l border-white/[0.08] flex flex-col">
          {/* Panel header */}
          <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#a855f7] to-[#00d4ff] flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Coach M8 AI</h3>
                <p className="text-xs text-white/40">Ask anything about your squad</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.1] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {history.length === 0 && !loading && (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#a855f7]/20 to-[#00d4ff]/20 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-[#a855f7]" />
                </div>
                <p className="text-base font-semibold text-white mb-1">Ask Coach M8</p>
                <p className="text-sm text-white/40 max-w-[280px]">
                  I have access to all your player data, sessions, and performance metrics. Ask me anything.
                </p>

                {/* Quick suggestions */}
                <div className="flex flex-wrap gap-2 mt-6 justify-center">
                  {[
                    "Who should rest today?",
                    "Squad fitness ranking",
                    "Best formation for next match",
                    "Design a pressing drill",
                    "Injury risk report",
                    "Compare top 3 strikers",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setQuestion(q); setTimeout(ask, 50); }}
                      className="text-xs px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-[#a855f7] hover:border-[#a855f7]/30 hover:bg-[#a855f7]/5 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {history.map((qa, i) => (
              <div key={i} className="space-y-3">
                {/* User message */}
                <div className="flex gap-2 justify-end">
                  <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-[#00d4ff]/10 border border-[#00d4ff]/20 px-3 py-2">
                    <p className="text-sm text-white">{qa.question}</p>
                  </div>
                  <div className="shrink-0 h-7 w-7 rounded-full bg-[#00d4ff]/15 flex items-center justify-center mt-0.5">
                    <User className="h-3.5 w-3.5 text-[#00d4ff]" />
                  </div>
                </div>

                {/* AI response */}
                <div className="flex gap-2">
                  <div className="shrink-0 h-7 w-7 rounded-full bg-[#a855f7]/15 flex items-center justify-center mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-[#a855f7]" />
                  </div>
                  <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-white/[0.04] border border-white/[0.08] px-3 py-2">
                    <div className="space-y-1">{formatMarkdown(qa.answer)}</div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="shrink-0 h-7 w-7 rounded-full bg-[#a855f7]/15 flex items-center justify-center mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-[#a855f7]" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-[#a855f7] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-2 w-2 rounded-full bg-[#a855f7] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="h-2 w-2 rounded-full bg-[#a855f7] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 p-4 border-t border-white/[0.08]">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
                placeholder="Ask anything..."
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#a855f7]/50 focus:outline-none focus:ring-1 focus:ring-[#a855f7]/20"
                disabled={loading}
              />
              <button
                onClick={ask}
                disabled={!question.trim() || loading}
                className="shrink-0 h-11 w-11 rounded-xl bg-gradient-to-r from-[#a855f7] to-[#00d4ff] flex items-center justify-center hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all disabled:opacity-30"
              >
                {loading ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
              </button>
            </div>
            <p className="text-[10px] text-white/20 mt-2 text-center">
              ⌘K to toggle • Escape to close • Full academy data context
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
