export default function SettingsLoading() {
  return (
    <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-32 bg-black/5 rounded-lg" />
        <div className="h-4 w-56 bg-black/5 rounded-lg mt-2" />
      </div>

      {/* Profile card skeleton */}
      <div className="rounded-2xl bg-black/5 h-48 mb-6" />

      {/* Password section skeleton */}
      <div className="rounded-2xl bg-black/5 h-36 mb-6" />

      {/* Account section skeleton */}
      <div className="rounded-2xl bg-black/5 h-28" />
    </main>
  );
}
