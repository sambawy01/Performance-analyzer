"use client";

import { FileDown, Mail, Copy, Check } from "lucide-react";
import { useState } from "react";

interface ExportShareBarProps {
  title: string;
  content?: string;
  pageUrl?: string;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function exportToPdf(title: string, content: string) {
  // Open a new window with styled HTML for PDF printing
  const win = window.open("", "_blank");
  if (!win) return;

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title} — Coach M8</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      background: #0a0e1a;
      color: #e2e8f0;
      padding: 40px;
      line-height: 1.6;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #00d4ff;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .logo {
      font-size: 24px;
      font-weight: 700;
      background: linear-gradient(135deg, #00d4ff, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
    .date { font-size: 12px; color: #64748b; font-family: 'JetBrains Mono', monospace; }

    h1 {
      font-size: 22px;
      font-weight: 700;
      color: white;
      margin-bottom: 20px;
      letter-spacing: -0.5px;
    }

    h2 {
      font-size: 16px;
      font-weight: 700;
      color: #00d4ff;
      margin: 24px 0 12px 0;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(0,212,255,0.2);
    }

    p, li {
      font-size: 13px;
      color: #cbd5e1;
      margin-bottom: 8px;
    }

    ul, ol { padding-left: 20px; margin-bottom: 12px; }
    li { margin-bottom: 4px; }

    strong { color: white; font-weight: 600; }

    .metric-row {
      display: flex;
      gap: 12px;
      margin: 16px 0;
      flex-wrap: wrap;
    }

    .metric-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 12px 16px;
      text-align: center;
      min-width: 100px;
    }

    .metric-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 20px;
      font-weight: 700;
      color: white;
    }

    .metric-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-top: 4px;
    }

    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid rgba(255,255,255,0.1);
      font-size: 10px;
      color: #475569;
      display: flex;
      justify-content: space-between;
    }

    @media print {
      body { background: #0a0e1a !important; color: #e2e8f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Coach M8</div>
      <div class="subtitle">AI Performance Analyst</div>
    </div>
    <div class="date">${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
  </div>

  <h1>${title}</h1>

  <div class="content">
    ${content.split("\n").map((line) => {
      if (!line.trim()) return "<br/>";
      if (line.startsWith("## ")) return `<h2>${line.replace("## ", "")}</h2>`;
      if (line.startsWith("**") && line.endsWith("**")) return `<p><strong>${line.replace(/\*\*/g, "")}</strong></p>`;
      if (line.startsWith("- ") || line.startsWith("• ")) return `<li>${line.replace(/^[-•]\s*/, "")}</li>`;
      if (/^\d+\.\s/.test(line)) return `<li>${line}</li>`;
      return `<p>${line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</p>`;
    }).join("\n")}
  </div>

  <div class="footer">
    <span>Generated by Coach M8 AI — The Maker Football Incubator</span>
    <span>Confidential</span>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 30px;">
    <button onclick="window.print()" style="background: linear-gradient(135deg, #00d4ff, #a855f7); color: white; border: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;">
      Save as PDF
    </button>
  </div>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}

export function ExportShareBar({ title, content, pageUrl }: ExportShareBarProps) {
  const [copied, setCopied] = useState(false);
  const shareText = content || title;
  const url = pageUrl || (typeof window !== "undefined" ? window.location.href : "");

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1.5 no-print" data-no-print>
      {/* PDF Export */}
      <button
        onClick={() => exportToPdf(title, shareText)}
        className="h-8 w-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-all"
        title="Export as PDF"
      >
        <FileDown className="h-4 w-4" />
      </button>

      {/* Copy */}
      <button
        onClick={handleCopy}
        className="h-8 w-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
        title="Copy to clipboard"
      >
        {copied ? <Check className="h-4 w-4 text-[#00ff88]" /> : <Copy className="h-4 w-4" />}
      </button>

      {/* WhatsApp */}
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title}\n\n${shareText.substring(0, 500)}${shareText.length > 500 ? "..." : ""}\n\n— Coach M8 AI`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="h-8 w-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-[#25D366] hover:bg-[#25D366]/10 transition-all"
        title="Share via WhatsApp"
      >
        <WhatsAppIcon className="h-4 w-4" />
      </a>

      {/* Email */}
      <a
        href={`mailto:?subject=${encodeURIComponent(title + " — Coach M8")}&body=${encodeURIComponent(shareText + "\n\n— Generated by Coach M8 AI\n" + url)}`}
        className="h-8 w-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/50 hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-all"
        title="Share via Email"
      >
        <Mail className="h-4 w-4" />
      </a>
    </div>
  );
}
