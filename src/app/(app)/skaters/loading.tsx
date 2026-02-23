export default function SkatersLoading() {
  return (
    <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-8 w-32 bg-black/5 rounded-lg" />
        <div className="h-4 w-56 bg-black/5 rounded-lg mt-2" />
      </div>

      {/* Grid of card skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl bg-black/5 h-24" />
        ))}
      </div>
    </main>
  );
}
