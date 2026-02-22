export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center max-w-md">
        <p className="font-mono text-sm text-text-secondary mb-2">404</p>
        <h1 className="font-display text-3xl font-bold mb-3">Page not found</h1>
        <p className="text-text-secondary mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="/dashboard"
            className="inline-block rounded-xl aurora-gradient px-5 py-2.5 text-sm font-display font-semibold text-white transition-opacity hover:opacity-90"
          >
            Go to Dashboard
          </a>
          <a
            href="/"
            className="inline-block rounded-xl border border-black/10 px-5 py-2.5 text-sm font-display font-semibold text-text-secondary transition-colors hover:bg-black/5"
          >
            Home
          </a>
        </div>
      </div>
    </main>
  );
}
