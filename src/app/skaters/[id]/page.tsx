import { createServerSupabaseClient, getAuthUser, getDisplayName } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";

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

interface EventRef {
  id: string;
  name: string;
  start_date: string;
  status?: string;
}

function countryFlag(code: string): string {
  const upper = code.toUpperCase().slice(0, 2);
  if (upper.length !== 2) return code;
  return String.fromCodePoint(
    ...upper.split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export default async function SkaterPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();

  // Phase 1: auth + skater
  const [user, { data: skater }] = await Promise.all([
    getAuthUser(),
    supabase.from("skaters").select("*").eq("id", params.id).single(),
  ]);

  if (!user) redirect("/login");
  if (!skater) notFound();

  const displayName = getDisplayName(user);

  // Phase 2: event history
  const [{ data: entries }, { data: results }] = await Promise.all([
    supabase
      .from("event_entries")
      .select("event_id, price_at_event, is_withdrawn, events(id, name, start_date, status)")
      .eq("skater_id", params.id),
    supabase
      .from("results")
      .select("event_id, final_placement, total_score, sp_score, fs_score, falls, is_personal_best, fantasy_points_final, events(id, name, start_date)")
      .eq("skater_id", params.id)
      .order("events(start_date)", { ascending: false }),
  ]);

  const priceM = (skater.current_price / 1_000_000).toFixed(1);

  // Build results lookup by event_id
  const resultsMap = new Map<string, NonNullable<typeof results>[number]>();
  for (const r of results ?? []) {
    resultsMap.set(r.event_id, r);
  }

  // Sort entries by event start_date descending
  const sortedEntries = [...(entries ?? [])].sort((a, b) => {
    const dateA = (a.events as unknown as EventRef | null)?.start_date ?? "";
    const dateB = (b.events as unknown as EventRef | null)?.start_date ?? "";
    return dateB.localeCompare(dateA);
  });

  return (
    <AppShell displayName={displayName}>
      <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/skaters"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All skaters
        </Link>

        {/* Profile Header */}
        <div className="rounded-2xl bg-card border border-black/5 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 flex-shrink-0 rounded-full bg-black/5 flex items-center justify-center text-3xl">
              {countryFlag(skater.country)}
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">{skater.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-text-secondary">{skater.country}</span>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    disciplineColors[skater.discipline] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {disciplineLabels[skater.discipline] ?? skater.discipline}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="rounded-xl bg-card border border-black/5 p-4">
            <p className="text-xs text-text-secondary mb-1">World Ranking</p>
            <p className="font-mono font-semibold text-lg">
              {skater.world_ranking ? `#${skater.world_ranking}` : "\u2014"}
            </p>
          </div>
          <div className="rounded-xl bg-card border border-black/5 p-4">
            <p className="text-xs text-text-secondary mb-1">Current Price</p>
            <p className="font-mono font-semibold text-lg">${priceM}M</p>
          </div>
          <div className="rounded-xl bg-card border border-black/5 p-4">
            <p className="text-xs text-text-secondary mb-1">Season Best</p>
            <p className="font-mono font-semibold text-lg">
              {skater.season_best_score ? skater.season_best_score.toFixed(2) : "\u2014"}
            </p>
          </div>
          <div className="rounded-xl bg-card border border-black/5 p-4">
            <p className="text-xs text-text-secondary mb-1">Personal Best</p>
            <p className="font-mono font-semibold text-lg">
              {skater.personal_best_score ? skater.personal_best_score.toFixed(2) : "\u2014"}
            </p>
          </div>
        </div>

        {/* Event History */}
        <section>
          <h2 className="font-display text-xl font-semibold mb-4">Event History</h2>

          {sortedEntries.length === 0 ? (
            <div className="rounded-xl bg-card p-10 text-center border border-black/5">
              <p className="text-text-secondary">No event history yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedEntries.map((entry) => {
                const event = entry.events as unknown as EventRef | null;
                if (!event) return null;
                const result = resultsMap.get(entry.event_id);
                const entryPriceM = (entry.price_at_event / 1_000_000).toFixed(1);
                const eventDate = new Date(event.start_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <div
                    key={entry.event_id}
                    className="rounded-xl bg-card border border-black/5 shadow-sm p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/events/${event.id}`}
                          className="font-display font-semibold hover:text-sky transition-colors"
                        >
                          {event.name}
                        </Link>
                        <p className="text-xs text-text-secondary mt-0.5">{eventDate}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-text-secondary">Price</p>
                        <p className="font-mono font-medium text-sm">${entryPriceM}M</p>
                      </div>
                    </div>

                    {/* Status / Results */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {entry.is_withdrawn ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                          Withdrawn
                        </span>
                      ) : result ? (
                        <>
                          {result.final_placement && (
                            <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                              #{result.final_placement}
                            </span>
                          )}
                          {result.total_score != null && (
                            <span className="text-xs text-text-secondary">
                              Score: <span className="font-mono font-medium text-text-primary">{result.total_score.toFixed(2)}</span>
                            </span>
                          )}
                          {result.fantasy_points_final != null && (
                            <span className="text-xs text-text-secondary">
                              FP: <span className="font-mono font-medium text-emerald-700">{result.fantasy_points_final.toFixed(1)}</span>
                            </span>
                          )}
                          {result.is_personal_best && (
                            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                              PB
                            </span>
                          )}
                        </>
                      ) : (event.status === "upcoming" || event.status === "locked") ? (
                        <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                          Upcoming
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
