export default function LeaguesLoading() {
  return (
    <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-36 bg-black/5 rounded-lg" />
        <div className="h-10 w-32 bg-black/5 rounded-xl" />
      </div>

      {/* League cards */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-black/5 h-20" />
        ))}
      </div>
    </main>
  );
}
