export default function SkaterDetailLoading() {
  return (
    <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto animate-pulse">
      {/* Back link skeleton */}
      <div className="h-4 w-24 bg-black/5 rounded-lg mb-6" />

      {/* Profile header */}
      <div className="rounded-2xl bg-black/5 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-black/5" />
          <div>
            <div className="h-8 w-48 bg-black/5 rounded-lg" />
            <div className="h-4 w-32 bg-black/5 rounded-lg mt-2" />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-black/5 h-20" />
        ))}
      </div>

      {/* Event history */}
      <div className="h-6 w-36 bg-black/5 rounded-lg mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-black/5 h-24" />
        ))}
      </div>
    </main>
  );
}
