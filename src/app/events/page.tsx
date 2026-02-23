import type { Metadata } from "next";
import { createServerSupabaseClient, getAuthUser, getDisplayName } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import EventCard from "@/components/EventCard";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const supabase = createServerSupabaseClient();

  const user = await getAuthUser();
  if (!user) redirect("/login");

  // Run all data queries in parallel
  const [{ data: allEvents }, { data: userPicks }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, event_type, location, start_date, end_date, picks_limit, budget, points_multiplier, status")
      .order("start_date", { ascending: true }),
    supabase
      .from("user_picks")
      .select("event_id, points_earned")
      .eq("user_id", user.id),
  ]);

  // Build lookup map: eventId → { pickCount, totalPoints }
  const pickMap = new Map<string, { pickCount: number; totalPoints: number }>();
  for (const pick of userPicks ?? []) {
    const entry = pickMap.get(pick.event_id) ?? { pickCount: 0, totalPoints: 0 };
    entry.pickCount++;
    entry.totalPoints += pick.points_earned ?? 0;
    pickMap.set(pick.event_id, entry);
  }

  const displayName = getDisplayName(user);
  const events = allEvents ?? [];

  // Group events by status
  const liveEvents = events.filter((e) => e.status === "in_progress");
  const upcomingEvents = events.filter((e) => e.status === "upcoming" || e.status === "locked");
  const completedEvents = events
    .filter((e) => e.status === "completed")
    .reverse(); // most recent first

  return (
    <AppShell displayName={displayName}>
      <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Events</h1>
          <p className="mt-1 text-text-secondary">Season calendar and results.</p>
        </div>

        {events.length === 0 ? (
          <div className="rounded-xl bg-card p-10 text-center border border-black/5">
            <div className="h-12 w-12 mx-auto mb-4 rounded-xl bg-sky-50 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-text-secondary">No events yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Live Now */}
            {liveEvents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <h2 className="font-display text-xl font-semibold">Live Now</h2>
                </div>
                <div className="space-y-4">
                  {liveEvents.map((event) => {
                    const stats = pickMap.get(event.id) ?? { pickCount: 0, totalPoints: 0 };
                    return <EventCard key={event.id} event={event} pickCount={stats.pickCount} totalPoints={stats.totalPoints} />;
                  })}
                </div>
              </section>
            )}

            {/* Upcoming */}
            {upcomingEvents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <h2 className="font-display text-xl font-semibold">Upcoming</h2>
                </div>
                <div className="space-y-4">
                  {upcomingEvents.map((event) => {
                    const stats = pickMap.get(event.id) ?? { pickCount: 0, totalPoints: 0 };
                    return <EventCard key={event.id} event={event} pickCount={stats.pickCount} totalPoints={stats.totalPoints} />;
                  })}
                </div>
              </section>
            )}

            {/* Completed */}
            {completedEvents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <h2 className="font-display text-xl font-semibold">Completed</h2>
                </div>
                <div className="space-y-4">
                  {completedEvents.map((event) => {
                    const stats = pickMap.get(event.id) ?? { pickCount: 0, totalPoints: 0 };
                    return <EventCard key={event.id} event={event} pickCount={stats.pickCount} totalPoints={stats.totalPoints} />;
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}
