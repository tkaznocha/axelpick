"use client";

import { useState } from "react";
import { fetchLeagueRosters, MemberRoster } from "./actions";

const disciplineColors: Record<string, string> = {
  men: "bg-sky-50 text-sky-700",
  women: "bg-lavender-50 text-lavender-700",
  pairs: "bg-emerald-50 text-emerald-700",
  ice_dance: "bg-amber-50 text-amber-700",
};

const disciplineLabels: Record<string, string> = {
  men: "Men",
  women: "Women",
  pairs: "Pairs",
  ice_dance: "Dance",
};

type LockedEvent = {
  id: string;
  name: string;
  status: string;
};

export default function EventRosters({
  leagueId,
  lockedEvents,
  currentUserId,
}: {
  leagueId: string;
  lockedEvents: LockedEvent[];
  currentUserId: string;
}) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [rosters, setRosters] = useState<MemberRoster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  async function handleEventChange(eventId: string) {
    setSelectedEventId(eventId);
    if (!eventId) {
      setRosters([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetchLeagueRosters(leagueId, eventId);

    if (result.success && result.rosters) {
      setRosters(result.rosters);
      // Auto-expand current user's card
      setExpandedUsers(new Set([currentUserId]));
    } else {
      setError(result.error ?? "Failed to load rosters");
      setRosters([]);
    }

    setLoading(false);
  }

  function toggleExpand(userId: string) {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  if (lockedEvents.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold mb-1">
        Event Rosters
      </h2>
      <p className="text-sm text-text-secondary mb-4">
        See what your league-mates picked
      </p>

      {/* Event selector */}
      <select
        value={selectedEventId}
        onChange={(e) => handleEventChange(e.target.value)}
        className="w-full rounded-xl border border-black/10 bg-card px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald mb-4"
      >
        <option value="">Select an event...</option>
        {lockedEvents.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.name}
          </option>
        ))}
      </select>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl bg-card p-8 text-center border border-black/5">
          <p className="text-text-secondary">Loading rosters...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-center border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Rosters */}
      {!loading && !error && selectedEventId && rosters.length === 0 && (
        <div className="rounded-xl bg-card p-8 text-center border border-black/5">
          <p className="text-text-secondary">
            No picks found for this event.
          </p>
        </div>
      )}

      {!loading && !error && rosters.length > 0 && (
        <div className="space-y-2">
          {rosters.map((roster) => {
            const isCurrentUser = roster.user_id === currentUserId;
            const isExpanded = expandedUsers.has(roster.user_id);

            return (
              <div
                key={roster.user_id}
                className={`rounded-xl border transition-all ${
                  isCurrentUser
                    ? "border-emerald bg-emerald-50 ring-1 ring-emerald"
                    : "border-black/5 bg-card"
                }`}
              >
                {/* Header — always visible, clickable */}
                <button
                  onClick={() => toggleExpand(roster.user_id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  {/* Avatar */}
                  <div className="h-9 w-9 flex-shrink-0 rounded-full bg-black/5 flex items-center justify-center text-sm font-semibold text-text-secondary">
                    {roster.display_name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold truncate">
                      {roster.display_name}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs font-normal text-emerald-700">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {roster.picks.length} pick{roster.picks.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Points */}
                  <div className="flex-shrink-0 text-right">
                    <p className="font-mono font-bold">{roster.total_points}</p>
                    <p className="text-xs text-text-secondary">pts</p>
                  </div>

                  {/* Expand indicator */}
                  <div className="flex-shrink-0 text-text-secondary">
                    <svg
                      className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded picks */}
                {isExpanded && roster.picks.length > 0 && (
                  <div className="px-4 pb-4 space-y-2">
                    {roster.picks.map((pick) => (
                      <div
                        key={pick.skater_id}
                        className={`flex items-center gap-3 rounded-lg p-3 ${
                          isCurrentUser ? "bg-emerald-100/50" : "bg-black/[0.02]"
                        }`}
                      >
                        {/* Initials */}
                        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-black/5 flex items-center justify-center text-xs font-semibold text-text-secondary">
                          {pick.skater_name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>

                        {/* Skater info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-medium text-sm truncate">
                            {pick.skater_name}
                          </p>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              disciplineColors[pick.discipline] ?? "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {disciplineLabels[pick.discipline] ?? pick.discipline}
                          </span>
                        </div>

                        {/* Points */}
                        <div className="flex-shrink-0 text-right">
                          <p className="font-mono font-semibold text-sm">
                            {pick.points_earned != null ? pick.points_earned : "\u2014"}
                          </p>
                          <p className="text-xs text-text-secondary">pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
