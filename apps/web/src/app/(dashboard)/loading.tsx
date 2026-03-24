export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Spinning brain logo */}
      <div className="flex items-center justify-center py-4">
        <div className="relative">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center animate-spin"
            style={{
              background: "linear-gradient(135deg, #00d4ff, #a855f7)",
              boxShadow:
                "0 0 30px rgba(0,212,255,0.3), 0 0 60px rgba(168,85,247,0.15)",
              animationDuration: "2s",
              animationTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <span className="text-white font-bold text-base">M8</span>
          </div>
          {/* Outer glow ring */}
          <div
            className="absolute -inset-2 rounded-2xl animate-pulse"
            style={{
              border: "1px solid rgba(0,212,255,0.15)",
              animationDuration: "2s",
            }}
          />
        </div>
      </div>

      {/* Title skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div
            className="h-7 w-48 rounded-lg"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,212,255,0.06) 0%, rgba(168,85,247,0.06) 50%, rgba(0,212,255,0.06) 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s ease-in-out infinite",
            }}
          />
          <div
            className="h-4 w-72 rounded-md"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s ease-in-out infinite 0.2s",
            }}
          />
        </div>
        <div
          className="h-9 w-32 rounded-lg"
          style={{
            background: "rgba(0,212,255,0.04)",
            border: "1px solid rgba(0,212,255,0.08)",
          }}
        />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => {
          const colors = ["#00d4ff", "#00ff88", "#ff6b35", "#a855f7", "#ff3355", "#06b6d4", "#00d4ff", "#00ff88"];
          const color = colors[i % colors.length];
          return (
            <div
              key={i}
              className="rounded-xl p-4 space-y-3"
              style={{
                background: `linear-gradient(135deg, ${color}06, transparent)`,
                border: `1px solid ${color}10`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg animate-pulse"
                  style={{
                    background: `${color}12`,
                    animationDuration: `${1.5 + i * 0.15}s`,
                  }}
                />
                <div className="space-y-1.5 flex-1">
                  <div
                    className="h-4 w-16 rounded animate-pulse"
                    style={{
                      background: `${color}10`,
                      animationDuration: `${1.5 + i * 0.15}s`,
                    }}
                  />
                  <div
                    className="h-3 w-12 rounded animate-pulse"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      animationDuration: `${1.8 + i * 0.15}s`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-xl p-4 space-y-4"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="space-y-1">
              <div
                className="h-4 w-32 rounded animate-pulse"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
              <div
                className="h-3 w-48 rounded animate-pulse"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  animationDelay: "0.3s",
                }}
              />
            </div>
            <div
              className="h-48 rounded-lg animate-pulse"
              style={{
                background:
                  "linear-gradient(180deg, rgba(0,212,255,0.03) 0%, rgba(168,85,247,0.02) 100%)",
                animationDuration: "2s",
              }}
            />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 py-2"
          >
            <div
              className="h-8 w-8 rounded-full animate-pulse"
              style={{
                background: "rgba(255,255,255,0.06)",
                animationDuration: `${1.5 + i * 0.1}s`,
              }}
            />
            <div
              className="h-4 flex-1 rounded animate-pulse"
              style={{
                background: "rgba(255,255,255,0.04)",
                animationDuration: `${1.6 + i * 0.1}s`,
              }}
            />
            <div
              className="h-4 w-20 rounded animate-pulse"
              style={{
                background: "rgba(255,255,255,0.03)",
                animationDuration: `${1.7 + i * 0.1}s`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
