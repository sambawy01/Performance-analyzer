import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0e1a] px-6">
      {/* Logo */}
      <div className="mb-8">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{
            background: "linear-gradient(135deg, #00d4ff, #a855f7)",
            boxShadow:
              "0 0 40px rgba(0,212,255,0.2), 0 0 80px rgba(168,85,247,0.1)",
          }}
        >
          <span className="text-white font-bold text-2xl">M8</span>
        </div>
      </div>

      {/* 404 Number */}
      <h1
        className="text-8xl font-bold font-mono tracking-tighter mb-4"
        style={{
          background: "linear-gradient(135deg, #00d4ff, #a855f7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        404
      </h1>

      {/* Message */}
      <h2 className="text-xl font-bold text-white mb-2">Page not found</h2>
      <p className="text-sm text-white/45 max-w-sm text-center mb-8 leading-relaxed">
        The page you are looking for does not exist or has been moved. Head back to the dashboard to continue coaching.
      </p>

      {/* Back to Dashboard */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #00d4ff, #a855f7)",
          color: "#0a0e1a",
          boxShadow:
            "0 0 20px rgba(0,212,255,0.3), 0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        Back to Dashboard
      </Link>

      {/* Subtle branding */}
      <p className="mt-16 text-[10px] text-white/15 font-mono uppercase tracking-widest">
        Coach M8 &middot; AI Performance &amp; Squad
      </p>
    </div>
  );
}
