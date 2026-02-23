import { createServerSupabaseClient, getAuthUser, getDisplayName } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import dynamic from "next/dynamic";
import PicksLockTime from "@/components/PicksLockTime";
import AppShell from "@/components/AppShell";

const PickFlow = dynamic(() => import("./PickFlow"), {
  loading: () => (
    <div className="grid gap-3 sm:grid-cols-2 animate-pulse">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="rounded-xl bg-black/5 h-28" />
      ))}
    </div>
  ),
});

export default async function EventPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  const user = await getAuthUser();
  if (!user) redirect("/login");

  // Run all data queries in parallel
  const [
    { data: event },
    { data: entries },
    { data: pendingReplacements },
    { data: existingPicks },
    { data: avatarRow },
  ] = await Promise.all([
    supabase.from("events").select("*").eq("id", params.id).single(),
    supabase
      .from("event_entries")
      .select(
        "skater_id, price_at_event, is_withdrawn, skaters(id, name, country, discipline, world_ranking, photo_url, season_best_score, personal_best_score)"
      )
      .eq("event_id", params.id),
    supabase
      .from("pick_replacements")
      .select("withdrawn_skater_id, replacement_skater_id")
      .eq("user_id", user.id)
      .eq("event_id", params.id),
    supabase
      .from("user_picks")
      .select("skater_id")
      .eq("user_id", user.id)
      .eq("event_id", params.id),
    supabase
      .from("users")
      .select("avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  if (!event) notFound();

  // Reshape entries for the client — Supabase returns skaters as object, not array
  const entryList = (entries ?? []).map((e: Record<string, unknown>) => ({
    skater_id: e.skater_id as string,
    price_at_event: e.price_at_event as number,
    is_withdrawn: (e.is_withdrawn as boolean) ?? false,
    skater: e.skaters as {
      id: string;
      name: string;
      country: string;
      discipline: string;
      world_ranking: number | null;
      photo_url: string | null;
      season_best_score: number | null;
      personal_best_score: number | null;
    },
  }));

  const pickedSkaterIds = (existingPicks ?? []).map((p) => p.skater_id);

  // Check if event is locked
  const isLocked =
    event.status === "locked" ||
    event.status === "in_progress" ||
    event.status === "completed" ||
    (event.picks_lock_at && new Date(event.picks_lock_at) <= new Date());

  // Format dates
  const startStr = new Date(event.start_date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const endStr = new Date(event.end_date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const budgetM = (event.budget / 1_000_000).toFixed(0);
  const tierLabel =
    event.event_type === "worlds"
      ? "Worlds"
      : event.event_type === "championship"
        ? "Championship"
        : "Grand Prix";

  const displayName = getDisplayName(user);

  return (
    <AppShell displayName={displayName} avatarUrl={avatarRow?.avatar_url ?? null}>
    <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto overflow-x-hidden">
      {/* Event header */}
      <div className="mb-8 rounded-2xl bg-card p-6 border border-black/5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-block rounded-full aurora-gradient px-3 py-1 text-xs font-semibold text-white">
            {tierLabel} &middot; {event.points_multiplier}×
          </span>
          {isLocked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-text-secondary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Locked
            </span>
          )}
        </div>
        <h1 className="font-display text-3xl font-bold">{event.name}</h1>
        <p className="mt-1 text-text-secondary flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {event.location} &middot; {startStr} – {endStr}
        </p>
        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-md bg-emerald-50 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <span className="font-mono">
              <span className="font-semibold">{event.picks_limit}</span>{" "}
              <span className="text-text-secondary">picks</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-md bg-sky-50 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="font-mono">
              <span className="font-semibold">${budgetM}M</span>{" "}
              <span className="text-text-secondary">budget</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-md bg-lavender-50 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-lavender">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="font-mono">
              <span className="font-semibold">{entryList.length}</span>{" "}
              <span className="text-text-secondary">skaters</span>
            </span>
          </div>
          {event.picks_lock_at && !isLocked && (
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-md bg-amber-50 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="font-mono">
                <span className="text-text-secondary">locks </span>
                <PicksLockTime lockAt={event.picks_lock_at} />
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Entry list notice for Worlds */}
      {event.event_type === "worlds" && (
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50/60 px-5 py-4 flex items-start gap-3 text-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-text-secondary">
            Entries are currently identical to the Olympic Games and will be updated as soon as official entries are provided by the ISU.
          </p>
        </div>
      )}

      {/* Pick flow */}
      <PickFlow
        eventId={params.id}
        picksLimit={event.picks_limit}
        budget={event.budget}
        entries={entryList}
        initialPicks={pickedSkaterIds}
        isLocked={!!isLocked}
        pendingReplacements={(pendingReplacements ?? []).map((r) => ({
          withdrawn_skater_id: r.withdrawn_skater_id,
          replacement_skater_id: r.replacement_skater_id,
        }))}
        replacementDeadline={event.replacement_deadline ?? null}
      />
    </main>
    </AppShell>
  );
}
