export default function DashboardLoading() {
  return (
    <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-black/5 rounded-lg" />
        <div className="h-4 w-72 bg-black/5 rounded-lg mt-2" />
      </div>

      {/* Season points skeleton */}
      <div className="mb-8 rounded-2xl bg-black/5 h-24" />

      {/* Events skeleton */}
      <div className="mb-4 h-6 w-40 bg-black/5 rounded-lg" />
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-black/5 h-20" />
        ))}
      </div>

      {/* Leagues skeleton */}
      <div className="mt-8 mb-4 h-6 w-32 bg-black/5 rounded-lg" />
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-black/5 h-16" />
        ))}
      </div>
    </main>
  );
}
