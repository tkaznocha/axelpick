import { createServerSupabaseClient, getAuthUser, getDisplayName } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

export default async function LeaderboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = createServerSupabaseClient();

  // Fetch top 100 users sorted by season points
  const { data: users } = await supabase
    .from("users")
    .select("id, display_name, avatar_url, total_season_points")
    .order("total_season_points", { ascending: false })
    .limit(100);

  const leaderboard = (users ?? []).map((u, i) => ({
    ...u,
    rank: i + 1,
    isCurrentUser: u.id === user.id,
  }));

  // Find current user's rank
  const currentUserEntry = leaderboard.find((u) => u.isCurrentUser);

  const displayName = getDisplayName(user);

  return (
    <AppShell displayName={displayName}>
    <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
        </div>
      </div>
      <p className="text-text-secondary mb-8">Global season rankings</p>

      {/* Current user highlight */}
      {currentUserEntry && (
        <div className="mb-8 rounded-2xl aurora-gradient p-px shadow-lg shadow-emerald/10">
          <div className="rounded-2xl bg-card p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Your Rank</p>
              <p className="font-display text-3xl font-bold mt-0.5">
                #{currentUserEntry.rank}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">Season Points</p>
              <p className="font-mono text-3xl font-bold mt-0.5">
                {currentUserEntry.total_season_points}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard list */}
      {leaderboard.length > 0 ? (
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center gap-4 rounded-xl p-4 border transition-all ${
                entry.isCurrentUser
                  ? "border-emerald bg-emerald-50 ring-1 ring-emerald"
                  : "border-black/5 bg-card"
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-10 text-center">
                <span
                  className={`font-mono font-bold ${
                    entry.rank === 1
                      ? "text-lg text-amber-500"
                      : entry.rank === 2
                        ? "text-lg text-gray-400"
                        : entry.rank === 3
                          ? "text-lg text-amber-700"
                          : "text-sm text-text-secondary"
                  }`}
                >
                  {entry.rank <= 3 ? getMedal(entry.rank) : entry.rank}
                </span>
              </div>

              {/* Avatar */}
              <div className="h-9 w-9 flex-shrink-0 rounded-full bg-black/5 flex items-center justify-center text-sm font-semibold text-text-secondary">
                {entry.display_name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold truncate">
                  {entry.display_name}
                  {entry.isCurrentUser && (
                    <span className="ml-2 text-xs font-normal text-emerald-700">
                      You
                    </span>
                  )}
                </p>
              </div>

              {/* Points */}
              <div className="flex-shrink-0 text-right">
                <p className="font-mono font-bold">
                  {entry.total_season_points}
                </p>
                <p className="text-xs text-text-secondary">pts</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-card p-10 text-center border border-black/5">
          <div className="h-12 w-12 mx-auto mb-4 rounded-xl bg-amber-50 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>
          <p className="text-text-secondary">
            No rankings yet. Points will appear after the first event!
          </p>
        </div>
      )}
    </main>
    </AppShell>
  );
}

function getMedal(rank: number): string {
  if (rank === 1) return "\u{1F947}";
  if (rank === 2) return "\u{1F948}";
  if (rank === 3) return "\u{1F949}";
  return String(rank);
}
