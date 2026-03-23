"use client";

import { FileDown, Mail } from "lucide-react";

interface ExportShareBarProps {
  title: string;
  content?: string;
  pageUrl?: string;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ExportShareBar({ title, content, pageUrl }: ExportShareBarProps) {
  const shareText = content
    ? `${title}\n\n${content}`
    : title;

  const shareUrl = pageUrl ?? (typeof window !== "undefined" ? window.location.href : "");
  const fullShareText = pageUrl ? `${shareText}\n\n${shareUrl}` : shareText;

  function handlePdf() {
    window.print();
  }

  function handleWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(fullShareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleEmail() {
    const url = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(fullShareText)}`;
    window.location.href = url;
  }

  return (
    <div
      className="no-print flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl px-3 py-2"
      data-no-print
    >
      <span className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mr-1">
        Export
      </span>

      {/* Download PDF */}
      <div className="relative group">
        <button
          onClick={handlePdf}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/70 hover:bg-[#00d4ff]/10 hover:border-[#00d4ff]/30 hover:text-[#00d4ff] transition-all duration-200"
          aria-label="Download PDF"
        >
          <FileDown className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">PDF</span>
        </button>
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#0f1629] border border-white/[0.08] px-2 py-1 text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
          Download PDF
        </span>
      </div>

      {/* WhatsApp */}
      <div className="relative group">
        <button
          onClick={handleWhatsApp}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/70 hover:bg-[#25D366]/10 hover:border-[#25D366]/30 hover:text-[#25D366] transition-all duration-200"
          aria-label="Share via WhatsApp"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">WhatsApp</span>
        </button>
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#0f1629] border border-white/[0.08] px-2 py-1 text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
          Share via WhatsApp
        </span>
      </div>

      {/* Email */}
      <div className="relative group">
        <button
          onClick={handleEmail}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-white/70 hover:bg-[#00d4ff]/10 hover:border-[#00d4ff]/30 hover:text-[#00d4ff] transition-all duration-200"
          aria-label="Share via Email"
        >
          <Mail className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Email</span>
        </button>
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#0f1629] border border-white/[0.08] px-2 py-1 text-[10px] text-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
          Share via Email
        </span>
      </div>
    </div>
  );
}
