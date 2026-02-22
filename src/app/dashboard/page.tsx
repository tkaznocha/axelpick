import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import NotificationBanner from "@/components/NotificationBanner";
import AppShell from "@/components/AppShell";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile from public.users table
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, avatar_url, total_season_points")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Skater";

  // Fetch upcoming events
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("id, name, location, start_date, end_date, event_type, status, picks_limit, budget")
    .in("status", ["upcoming", "locked"])
    .order("start_date", { ascending: true })
    .limit(3);

  // Fetch unread notifications
  const { data: unreadNotifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, event_id, metadata, is_read, created_at")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch user's leagues (up to 3)
  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name, created_by)")
    .eq("user_id", user.id)
    .limit(3);

  const myLeagues = (memberships ?? []).map((m) => {
    const l = m.leagues as unknown as {
      id: string;
      name: string;
      created_by: string;
    };
    return { id: l.id, name: l.name, isCreator: l.created_by === user.id };
  });

  return (
    <AppShell>
    <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">
          Hey, {displayName}
        </h1>
        <p className="mt-1 text-text-secondary">
          Welcome to your fantasy skating dashboard.
        </p>
      </div>

      {/* Notifications */}
      <NotificationBanner notifications={unreadNotifications ?? []} />

      {/* Season Points */}
      <div className="mb-8 rounded-2xl aurora-gradient p-px">
        <div className="rounded-2xl bg-card p-6">
          <p className="text-sm text-text-secondary">Season Points</p>
          <p className="font-display text-4xl font-bold mt-1">
            {profile?.total_season_points ?? 0}
          </p>
        </div>
      </div>

      {/* Upcoming Events */}
      <section>
        <h2 className="font-display text-xl font-semibold mb-4">
          Upcoming Events
        </h2>

        {upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <a
                key={event.id}
                href={`/events/${event.id}`}
                className="block rounded-xl bg-card p-5 shadow-sm border border-black/5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-semibold">
                      {event.name}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {event.location} &middot;{" "}
                      {new Date(event.start_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {" \u2013 "}
                      {new Date(event.end_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      {event.picks_limit} picks &middot; ${(event.budget / 1_000_000).toFixed(0)}M
                    </span>
                    <p className="text-xs text-text-secondary mt-1 capitalize">
                      {event.status}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-card p-8 text-center border border-black/5">
            <p className="text-text-secondary">
              No upcoming events yet. Check back soon!
            </p>
          </div>
        )}
      </section>

      {/* My Leagues */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">My Leagues</h2>
          {myLeagues.length > 0 && (
            <a
              href="/leagues"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              View all &rarr;
            </a>
          )}
        </div>

        {myLeagues.length > 0 ? (
          <div className="space-y-3">
            {myLeagues.map((league) => (
              <a
                key={league.id}
                href={`/leagues/${league.id}`}
                className="block rounded-xl bg-card p-4 shadow-sm border border-black/5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-semibold">
                      {league.name}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {league.isCreator ? "Created by you" : "Member"}
                    </p>
                  </div>
                  <span className="text-text-secondary text-sm">&rarr;</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-card p-6 text-center border border-black/5">
            <p className="text-text-secondary text-sm mb-3">
              Compete with friends in a private league.
            </p>
            <a
              href="/leagues/create"
              className="inline-block rounded-xl aurora-gradient px-5 py-2.5 text-sm font-display font-semibold text-white transition-opacity hover:opacity-90"
            >
              Create League
            </a>
          </div>
        )}
      </section>
    </main>
    </AppShell>
  );
}
