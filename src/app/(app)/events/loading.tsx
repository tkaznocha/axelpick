export default function EventsLoading() {
  return (
    <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-32 bg-black/5 rounded-lg" />
        <div className="h-4 w-56 bg-black/5 rounded-lg mt-2" />
      </div>

      {/* Section 1 */}
      <div className="mb-10">
        <div className="h-6 w-28 bg-black/5 rounded-lg mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-black/5 h-24" />
          ))}
        </div>
      </div>

      {/* Section 2 */}
      <div>
        <div className="h-6 w-36 bg-black/5 rounded-lg mb-4" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl bg-black/5 h-24" />
          ))}
        </div>
      </div>
    </main>
  );
}
