import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient, getAuthUser, getDisplayName } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";
import NotificationBanner from "@/components/NotificationBanner";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const user = await getAuthUser();
  if (!user) redirect("/login");

  // Run all data queries in parallel (auth is instant cookie read)
  const [
    { data: upcomingEvents },
    { data: profile },
    { data: unreadNotifications },
    { data: memberships },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, location, start_date, end_date, event_type, status, picks_limit, budget")
      .in("status", ["upcoming", "locked"])
      .order("start_date", { ascending: true })
      .limit(3),
    supabase
      .from("users")
      .select("display_name, avatar_url, total_season_points")
      .eq("id", user.id)
      .single(),
    supabase
      .from("notifications")
      .select("id, type, title, body, event_id, metadata, is_read, created_at")
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(10),
    createAdminClient()
      .from("league_members")
      .select("league_id, leagues(id, name, created_by)")
      .eq("user_id", user.id)
      .limit(3),
  ]);

  const displayName = profile?.display_name || getDisplayName(user);

  const myLeagues = (memberships ?? []).map((m) => {
    const l = m.leagues as unknown as {
      id: string;
      name: string;
      created_by: string;
    };
    return { id: l.id, name: l.name, isCreator: l.created_by === user.id };
  });

  return (
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
      <div className="mb-8 rounded-2xl aurora-gradient p-px shadow-lg shadow-emerald/10">
        <div className="rounded-2xl bg-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">Season Points</p>
            <p className="font-display text-4xl font-bold mt-1">
              {profile?.total_season_points ?? 0}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <h2 className="font-display text-xl font-semibold">
              Upcoming Events
            </h2>
          </div>
          {upcomingEvents && upcomingEvents.length > 0 && (
            <Link href="/events" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              View all &rarr;
            </Link>
          )}
        </div>

        {upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block rounded-xl bg-card p-5 shadow-sm border border-black/5 card-accent-sky transition-all hover:shadow-md hover:-translate-y-px"
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
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-card p-10 text-center border border-black/5">
            <div className="h-12 w-12 mx-auto mb-4 rounded-xl bg-sky-50 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-text-secondary">
              No upcoming events yet. Check back soon!
            </p>
          </div>
        )}
      </section>

      {/* My Leagues */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lavender">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h2 className="font-display text-xl font-semibold">My Leagues</h2>
          </div>
          {myLeagues.length > 0 && (
            <Link
              href="/leagues"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              View all &rarr;
            </Link>
          )}
        </div>

        {myLeagues.length > 0 ? (
          <div className="space-y-3">
            {myLeagues.map((league) => (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="block rounded-xl bg-card p-4 shadow-sm border border-black/5 card-accent-lavender transition-all hover:shadow-md hover:-translate-y-px"
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
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-card p-8 text-center border border-black/5">
            <div className="h-12 w-12 mx-auto mb-4 rounded-xl bg-lavender-50 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-lavender">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-text-secondary text-sm mb-3">
              Compete with friends in a private league.
            </p>
            <Link
              href="/leagues/create"
              className="inline-block rounded-xl aurora-gradient px-5 py-2.5 text-sm font-display font-semibold text-white transition-opacity hover:opacity-90"
            >
              Create League
            </Link>
          </div>
        )}
      </section>

      {/* Support */}
      <section className="mt-8">
        <a
          href="https://buymeacoffee.com/axelpick"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl bg-card p-5 shadow-sm border border-black/5 transition-all hover:shadow-md hover:-translate-y-px text-center"
        >
          <p className="text-sm text-text-secondary">
            Enjoying Axel Pick?{" "}
            <span className="font-semibold text-text-primary">Buy us a coffee</span>{" "}
            to help keep it running.
          </p>
        </a>
      </section>
    </main>
  );
}
