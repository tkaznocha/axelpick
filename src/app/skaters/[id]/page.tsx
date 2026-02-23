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

export default async function SkaterPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();

  const user = await getAuthUser();
  if (!user) redirect("/login");

  // Run all data queries in parallel
  const [{ data: skater }, { data: entries }, { data: results }, { data: avatarRow }] = await Promise.all([
    supabase.from("skaters").select("*").eq("id", params.id).single(),
    supabase
      .from("event_entries")
      .select("event_id, price_at_event, is_withdrawn, events(id, name, start_date, status)")
      .eq("skater_id", params.id),
    supabase
      .from("results")
      .select("event_id, final_placement, total_score, sp_score, fs_score, falls, is_personal_best, fantasy_points_final, events(id, name, start_date)")
      .eq("skater_id", params.id)
      .order("events(start_date)", { ascending: false }),
    supabase
      .from("users")
      .select("avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  if (!skater) notFound();

  const displayName = getDisplayName(user);

  const priceM = (skater.current_price / 1_000_000).toFixed(1);

  // Discipline-aware labels for SP/FS
  const isIceDance = skater.discipline === "ice_dance";
  const spLabel = isIceDance ? "Rhythm Dance" : "Short Program";
  const fsLabel = isIceDance ? "Free Dance" : "Free Skating";

  // Compute age from date_of_birth
  let age: number | null = null;
  if (skater.date_of_birth) {
    const dob = new Date(skater.date_of_birth);
    const now = new Date();
    age = now.getFullYear() - dob.getFullYear();
    if (
      now.getMonth() < dob.getMonth() ||
      (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())
    ) {
      age--;
    }
  }

  const hasSegmentScores =
    skater.season_best_sp != null ||
    skater.season_best_fs != null ||
    skater.personal_best_sp != null ||
    skater.personal_best_fs != null;

  const hasProgramInfo =
    skater.sp_music || skater.fs_music || skater.coaches || skater.choreographer;

  const hasAboutInfo =
    skater.height_cm || skater.hometown || skater.started_skating;

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
    <AppShell displayName={displayName} avatarUrl={avatarRow?.avatar_url ?? null}>
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
            <div className="h-16 w-16 flex-shrink-0 rounded-full bg-black/5 flex items-center justify-center text-xl font-semibold text-text-secondary">
              {skater.name.charAt(0).toUpperCase()}
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
                {age != null && (
                  <span className="text-sm text-text-secondary">Age {age}</span>
                )}
                {skater.hometown && (
                  <span className="text-sm text-text-secondary">{skater.hometown}</span>
                )}
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

        {/* Segment Score Breakdown */}
        {hasSegmentScores && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <div className="rounded-xl bg-card border border-black/5 p-4">
              <p className="text-xs text-text-secondary mb-1">Season Best {spLabel}</p>
              <p className="font-mono font-semibold text-lg">
                {skater.season_best_sp != null ? Number(skater.season_best_sp).toFixed(2) : "\u2014"}
              </p>
            </div>
            <div className="rounded-xl bg-card border border-black/5 p-4">
              <p className="text-xs text-text-secondary mb-1">Season Best {fsLabel}</p>
              <p className="font-mono font-semibold text-lg">
                {skater.season_best_fs != null ? Number(skater.season_best_fs).toFixed(2) : "\u2014"}
              </p>
            </div>
            <div className="rounded-xl bg-card border border-black/5 p-4">
              <p className="text-xs text-text-secondary mb-1">PB {spLabel}</p>
              <p className="font-mono font-semibold text-lg">
                {skater.personal_best_sp != null ? Number(skater.personal_best_sp).toFixed(2) : "\u2014"}
              </p>
            </div>
            <div className="rounded-xl bg-card border border-black/5 p-4">
              <p className="text-xs text-text-secondary mb-1">PB {fsLabel}</p>
              <p className="font-mono font-semibold text-lg">
                {skater.personal_best_fs != null ? Number(skater.personal_best_fs).toFixed(2) : "\u2014"}
              </p>
            </div>
          </div>
        )}

        {/* Programs & Coaching */}
        {hasProgramInfo && (
          <div className="rounded-2xl bg-card border border-black/5 shadow-sm p-6 mb-6">
            <h2 className="font-display text-lg font-semibold mb-4">Programs & Coaching</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {skater.sp_music && (
                <div>
                  <dt className="text-xs text-text-secondary">{spLabel} Music</dt>
                  <dd className="mt-0.5 whitespace-pre-line">{skater.sp_music}</dd>
                </div>
              )}
              {skater.fs_music && (
                <div>
                  <dt className="text-xs text-text-secondary">{fsLabel} Music</dt>
                  <dd className="mt-0.5 whitespace-pre-line">{skater.fs_music}</dd>
                </div>
              )}
              {skater.coaches && (
                <div>
                  <dt className="text-xs text-text-secondary">Coach</dt>
                  <dd className="mt-0.5">{skater.coaches}</dd>
                </div>
              )}
              {skater.choreographer && (
                <div>
                  <dt className="text-xs text-text-secondary">Choreographer</dt>
                  <dd className="mt-0.5">{skater.choreographer}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* About */}
        {hasAboutInfo && (
          <div className="rounded-2xl bg-card border border-black/5 shadow-sm p-6 mb-6">
            <h2 className="font-display text-lg font-semibold mb-4">About</h2>
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
              {skater.height_cm && (
                <div>
                  <dt className="text-xs text-text-secondary">Height</dt>
                  <dd className="mt-0.5">{skater.height_cm} cm</dd>
                </div>
              )}
              {skater.hometown && (
                <div>
                  <dt className="text-xs text-text-secondary">Hometown</dt>
                  <dd className="mt-0.5">{skater.hometown}</dd>
                </div>
              )}
              {skater.started_skating && (
                <div>
                  <dt className="text-xs text-text-secondary">Started Skating</dt>
                  <dd className="mt-0.5">{skater.started_skating}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

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
