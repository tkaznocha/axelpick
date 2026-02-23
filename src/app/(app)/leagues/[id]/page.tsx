import type { Metadata } from "next";
import { createServerSupabaseClient, getAuthUser } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import CopyInviteLink from "./CopyInviteLink";
import EventRosters from "./EventRosters";
import LeagueSettings from "./LeagueSettings";
import UserAvatar from "@/components/UserAvatar";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data: league } = await supabase
    .from("leagues")
    .select("name")
    .eq("id", params.id)
    .single();

  if (!league) return { title: "League Not Found" };

  return {
    title: league.name,
    description: `${league.name} league on Axel Pick. Compete with friends in fantasy figure skating.`,
  };
}

export default async function LeaguePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  // Fetch auth + league data in parallel
  const [user, { data: league }] = await Promise.all([
    getAuthUser(),
    supabase
      .from("leagues")
      .select("id, name, invite_code, created_by, created_at")
      .eq("id", params.id)
      .single(),
  ]);

  if (!user) redirect("/login");
  if (!league) redirect("/leagues");

  // Use admin client for league_members to bypass self-referencing RLS
  const admin = createAdminClient();

  // Check membership + fetch remaining data in parallel
  const [membershipResult, membersResult, { data: lockedEvents }] =
    await Promise.all([
      admin
        .from("league_members")
        .select("league_id")
        .eq("league_id", league.id)
        .eq("user_id", user.id)
        .single(),
      admin
        .from("league_members")
        .select(
          "user_id, users(id, display_name, avatar_url, total_season_points)"
        )
        .eq("league_id", league.id),
      supabase
        .from("events")
        .select("id, name, status")
        .in("status", ["locked", "in_progress", "completed"])
        .order("start_date", { ascending: false }),
    ]);

  const { data: membership } = membershipResult;
  const { data: members } = membersResult;

  if (!membership) {
    // Self-heal: if user is the league creator, auto-add them as member
    if (league.created_by === user.id) {
      await admin
        .from("league_members")
        .upsert({ league_id: league.id, user_id: user.id });
    } else {
      redirect(`/leagues/join/${league.invite_code}`);
    }
  }

  // Build leaderboard sorted by points
  const leaderboard = (members ?? [])
    .map((m) => {
      const u = m.users as unknown as {
        id: string;
        display_name: string;
        avatar_url: string | null;
        total_season_points: number;
      };
      return {
        id: u.id,
        display_name: u.display_name,
        avatar_url: u.avatar_url,
        total_season_points: u.total_season_points ?? 0,
        isCurrentUser: u.id === user.id,
      };
    })
    .sort((a, b) => b.total_season_points - a.total_season_points)
    .map((u, i) => ({ ...u, rank: i + 1 }));

  const isCreator = league.created_by === user.id;

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto">
      {/* League header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">{league.name}</h1>
        <p className="mt-1 text-text-secondary">
          {leaderboard.length} {leaderboard.length === 1 ? "member" : "members"}
          {isCreator && " \u00B7 Created by you"}
        </p>
      </div>

      {/* Invite link */}
      <div className="mb-8">
        <CopyInviteLink inviteCode={league.invite_code} />
      </div>

      {/* Leaderboard */}
      <section>
        <h2 className="font-display text-xl font-semibold mb-4">
          Leaderboard
        </h2>

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
                <UserAvatar avatarUrl={entry.avatar_url} displayName={entry.display_name ?? "?"} size="md" />

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
          <div className="rounded-xl bg-card p-8 text-center border border-black/5">
            <p className="text-text-secondary">
              No members yet. Share the invite link to get started!
            </p>
          </div>
        )}
      </section>

      {/* Event Rosters */}
      <EventRosters
        leagueId={league.id}
        lockedEvents={lockedEvents ?? []}
        currentUserId={user.id}
      />

      {/* Creator settings */}
      {isCreator && (
        <LeagueSettings leagueId={league.id} currentName={league.name} />
      )}
    </main>
  );
}

function getMedal(rank: number): string {
  if (rank === 1) return "\u{1F947}";
  if (rank === 2) return "\u{1F948}";
  if (rank === 3) return "\u{1F949}";
  return String(rank);
}
