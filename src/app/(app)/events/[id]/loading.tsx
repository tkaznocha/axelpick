export default function EventLoading() {
  return (
    <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto animate-pulse">
      {/* Event header skeleton */}
      <div className="mb-8 rounded-2xl bg-black/5 h-40" />

      {/* Filters skeleton */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="h-10 flex-1 min-w-[180px] bg-black/5 rounded-xl" />
        <div className="h-10 w-48 bg-black/5 rounded-xl" />
        <div className="h-10 w-36 bg-black/5 rounded-xl" />
      </div>

      {/* Skater cards skeleton */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl bg-black/5 h-28" />
        ))}
      </div>
    </main>
  );
}
