export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-white/[0.06]" />
          <div className="h-4 w-72 rounded-md bg-white/[0.04]" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-white/[0.06]" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        <div className="h-8 w-28 rounded-lg bg-white/[0.04]" />
        <div className="h-8 w-28 rounded-lg bg-white/[0.04]" />
        <div className="h-8 w-28 rounded-lg bg-white/[0.04]" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/[0.06]" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-24 rounded bg-white/[0.06]" />
                <div className="h-3 w-16 rounded bg-white/[0.04]" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-12 rounded-lg bg-white/[0.04]" />
              <div className="h-12 rounded-lg bg-white/[0.04]" />
              <div className="h-12 rounded-lg bg-white/[0.04]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
