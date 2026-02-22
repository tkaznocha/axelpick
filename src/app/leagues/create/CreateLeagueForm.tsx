"use client";

import { useState, useTransition } from "react";
import { track } from "@vercel/analytics";
import { createLeague } from "@/app/leagues/actions";

export default function CreateLeagueForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    const name = formData.get("name") as string;
    track("league_created", { league_name_length: name?.trim().length ?? 0 });
    startTransition(async () => {
      const result = await createLeague(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-lg mx-auto">
      <h1 className="font-display text-3xl font-bold mb-2">Create League</h1>
      <p className="text-text-secondary mb-8">
        Start a private league and invite your friends.
      </p>

      <form action={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            League Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={50}
            placeholder="e.g. Ice Queens"
            className="w-full rounded-xl border border-black/10 bg-card px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl aurora-gradient px-6 py-3 font-display font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create League"}
        </button>
      </form>
    </main>
  );
}
