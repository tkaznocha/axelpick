export default function LeagueDetailLoading() {
  return (
    <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-8 w-56 bg-black/5 rounded-lg" />
        <div className="h-4 w-32 bg-black/5 rounded-lg mt-2" />
      </div>

      {/* Invite link skeleton */}
      <div className="mb-8 rounded-xl bg-black/5 h-12" />

      {/* Leaderboard skeleton */}
      <div className="h-6 w-32 bg-black/5 rounded-lg mb-4" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-black/5 h-16" />
        ))}
      </div>
    </main>
  );
}
