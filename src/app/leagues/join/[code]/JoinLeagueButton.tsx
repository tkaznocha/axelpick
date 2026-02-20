"use client";

import { useState, useTransition } from "react";
import { joinLeague } from "@/app/leagues/actions";

export default function JoinLeagueButton({ inviteCode }: { inviteCode: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      const result = await joinLeague(inviteCode);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleJoin}
        disabled={isPending}
        className="w-full rounded-xl aurora-gradient px-6 py-3 font-display font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Joining..." : "Join League"}
      </button>
      {error && (
        <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
