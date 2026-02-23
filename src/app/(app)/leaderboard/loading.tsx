export default function LeaderboardLoading() {
  return (
    <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="h-9 w-48 bg-black/5 rounded-lg mb-2" />
      <div className="h-4 w-40 bg-black/5 rounded-lg mb-8" />

      {/* User rank skeleton */}
      <div className="mb-8 rounded-2xl bg-black/5 h-24" />

      {/* Leaderboard rows */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="rounded-xl bg-black/5 h-16" />
        ))}
      </div>
    </main>
  );
}
