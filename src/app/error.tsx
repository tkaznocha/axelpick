"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center max-w-md">
        <p className="font-mono text-sm text-text-secondary mb-2">Error</p>
        <h1 className="font-display text-3xl font-bold mb-3">
          Something went wrong
        </h1>
        <p className="text-text-secondary mb-8">
          An unexpected error occurred. Please try again or head back to your
          dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-block rounded-xl aurora-gradient px-5 py-2.5 text-sm font-display font-semibold text-white transition-opacity hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="inline-block rounded-xl border border-black/10 px-5 py-2.5 text-sm font-display font-semibold text-text-secondary transition-colors hover:bg-black/5"
          >
            Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
