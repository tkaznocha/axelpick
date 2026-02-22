import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import PickFlow from "./PickFlow";
import AppShell from "@/components/AppShell";

export default async function EventPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch event
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!event) notFound();

  // Fetch entry list with skater details
  const { data: entries } = await supabase
    .from("event_entries")
    .select(
      "skater_id, price_at_event, is_withdrawn, skaters(id, name, country, discipline, world_ranking, photo_url)"
    )
    .eq("event_id", params.id);

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
    },
  }));

  // Fetch user's pending replacement entitlements
  const { data: pendingReplacements } = await supabase
    .from("pick_replacements")
    .select("withdrawn_skater_id, replacement_skater_id")
    .eq("user_id", user.id)
    .eq("event_id", params.id);

  // Fetch user's existing picks for this event
  const { data: existingPicks } = await supabase
    .from("user_picks")
    .select("skater_id")
    .eq("user_id", user.id)
    .eq("event_id", params.id);

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

  return (
    <AppShell>
    <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto">
      {/* Event header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-block rounded-full aurora-gradient px-3 py-1 text-xs font-semibold text-white">
            {tierLabel} &middot; {event.points_multiplier}×
          </span>
          {isLocked && (
            <span className="inline-block rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-text-secondary">
              Picks Locked
            </span>
          )}
        </div>
        <h1 className="font-display text-3xl font-bold">{event.name}</h1>
        <p className="mt-1 text-text-secondary">
          {event.location} &middot; {startStr} – {endStr}
        </p>
        <div className="mt-3 flex gap-4 text-sm">
          <span className="font-mono">
            <span className="text-text-secondary">Picks:</span>{" "}
            <span className="font-semibold">{event.picks_limit}</span>
          </span>
          <span className="font-mono">
            <span className="text-text-secondary">Budget:</span>{" "}
            <span className="font-semibold">${budgetM}M</span>
          </span>
          <span className="font-mono">
            <span className="text-text-secondary">Skaters:</span>{" "}
            <span className="font-semibold">{entryList.length}</span>
          </span>
        </div>
      </div>

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
