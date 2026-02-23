"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function addPick(eventId: string, skaterId: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }
  const user = session.user;

  // Fetch event, entry, and existing picks in parallel
  const [{ data: event }, { data: entry }, { data: existingPicks }] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, picks_limit, budget, picks_lock_at, status")
        .eq("id", eventId)
        .single(),
      supabase
        .from("event_entries")
        .select("skater_id, price_at_event, is_withdrawn")
        .eq("event_id", eventId)
        .eq("skater_id", skaterId)
        .single(),
      supabase
        .from("user_picks")
        .select("skater_id")
        .eq("user_id", user.id)
        .eq("event_id", eventId),
    ]);

  if (!event) {
    return { success: false, error: "Event not found" };
  }

  // Check if event is still open
  if (event.status !== "upcoming") {
    return { success: false, error: "Event is no longer accepting picks" };
  }
  if (event.picks_lock_at && new Date(event.picks_lock_at) <= new Date()) {
    return { success: false, error: "Picks are locked for this event" };
  }

  if (!entry) {
    return { success: false, error: "Skater is not in this event" };
  }
  if (entry.is_withdrawn) {
    return { success: false, error: "Skater has withdrawn from this event" };
  }

  const currentPicks = existingPicks ?? [];

  // Check for duplicate
  if (currentPicks.some((p) => p.skater_id === skaterId)) {
    return { success: false, error: "Skater already picked" };
  }

  // Check pick limit
  if (currentPicks.length >= event.picks_limit) {
    return { success: false, error: "Pick limit reached" };
  }

  // Check budget — use the entry price we already fetched + existing picks
  const currentIds = currentPicks.map((p) => p.skater_id);
  let totalCost = entry.price_at_event;
  if (currentIds.length > 0) {
    const { data: currentEntries } = await supabase
      .from("event_entries")
      .select("price_at_event")
      .eq("event_id", eventId)
      .in("skater_id", currentIds);
    totalCost += (currentEntries ?? []).reduce(
      (sum, e) => sum + e.price_at_event,
      0
    );
  }
  if (totalCost > event.budget) {
    return {
      success: false,
      error: `Over budget: $${(totalCost / 1_000_000).toFixed(1)}M / $${(event.budget / 1_000_000).toFixed(0)}M`,
    };
  }

  // Insert the pick
  const { error } = await supabase.from("user_picks").insert({
    user_id: user.id,
    event_id: eventId,
    skater_id: skaterId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function removePick(eventId: string, skaterId: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }
  const user = session.user;

  // Fetch event to validate
  const { data: event } = await supabase
    .from("events")
    .select("id, picks_lock_at, status")
    .eq("id", eventId)
    .single();

  if (!event) {
    return { success: false, error: "Event not found" };
  }

  // Check if event is still open
  if (event.status !== "upcoming") {
    return { success: false, error: "Event is no longer accepting picks" };
  }
  if (event.picks_lock_at && new Date(event.picks_lock_at) <= new Date()) {
    return { success: false, error: "Picks are locked for this event" };
  }

  // Delete the pick
  const { count } = await supabase
    .from("user_picks")
    .delete({ count: "exact" })
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .eq("skater_id", skaterId);

  if (count === 0) {
    return { success: false, error: "Pick not found" };
  }

  return { success: true };
}

export async function clearAllPicks(eventId: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }
  const user = session.user;

  const { data: event } = await supabase
    .from("events")
    .select("id, picks_lock_at, status")
    .eq("id", eventId)
    .single();

  if (!event) {
    return { success: false, error: "Event not found" };
  }

  if (event.status !== "upcoming") {
    return { success: false, error: "Event is no longer accepting picks" };
  }
  if (event.picks_lock_at && new Date(event.picks_lock_at) <= new Date()) {
    return { success: false, error: "Picks are locked for this event" };
  }

  const { error } = await supabase
    .from("user_picks")
    .delete()
    .eq("user_id", user.id)
    .eq("event_id", eventId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function replaceWithdrawnPick(
  eventId: string,
  withdrawnSkaterId: string,
  replacementSkaterId: string
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { success: false, error: "Not authenticated" };
  const user = session.user;

  // Use admin client for mutations (picks are locked, RLS would block INSERT)
  const admin = createAdminClient();

  // 1. Verify the user has a pending replacement entitlement
  const { data: replacement } = await admin
    .from("pick_replacements")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .eq("withdrawn_skater_id", withdrawnSkaterId)
    .is("replacement_skater_id", null)
    .single();

  if (!replacement) {
    return { success: false, error: "No pending replacement found" };
  }

  // 2. Check replacement deadline
  const { data: event } = await admin
    .from("events")
    .select("replacement_deadline, budget")
    .eq("id", eventId)
    .single();

  if (
    event?.replacement_deadline &&
    new Date(event.replacement_deadline) <= new Date()
  ) {
    return { success: false, error: "Replacement deadline has passed" };
  }

  // 3. Verify replacement skater is in the event and not withdrawn
  const { data: newEntry } = await admin
    .from("event_entries")
    .select("skater_id, price_at_event, is_withdrawn")
    .eq("event_id", eventId)
    .eq("skater_id", replacementSkaterId)
    .single();

  if (!newEntry || newEntry.is_withdrawn) {
    return { success: false, error: "Selected skater is not available" };
  }

  // 4. Budget check: remaining picks (excluding withdrawn) + new pick
  const { data: currentPicks } = await admin
    .from("user_picks")
    .select("skater_id")
    .eq("user_id", user.id)
    .eq("event_id", eventId);

  const keptSkaterIds = (currentPicks ?? [])
    .map((p) => p.skater_id)
    .filter((id: string) => id !== withdrawnSkaterId);

  if (keptSkaterIds.includes(replacementSkaterId)) {
    return { success: false, error: "You already have this skater" };
  }

  const allIds = [...keptSkaterIds, replacementSkaterId];
  const { data: allEntries } = await admin
    .from("event_entries")
    .select("price_at_event")
    .eq("event_id", eventId)
    .in("skater_id", allIds);

  const totalCost = (allEntries ?? []).reduce(
    (sum, e) => sum + e.price_at_event,
    0
  );
  if (totalCost > (event?.budget ?? 0)) {
    return {
      success: false,
      error: `Over budget: $${(totalCost / 1_000_000).toFixed(1)}M / $${((event?.budget ?? 0) / 1_000_000).toFixed(0)}M`,
    };
  }

  // 5. Execute the swap
  await admin
    .from("user_picks")
    .delete()
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .eq("skater_id", withdrawnSkaterId);

  const { error: insertErr } = await admin.from("user_picks").insert({
    user_id: user.id,
    event_id: eventId,
    skater_id: replacementSkaterId,
  });

  if (insertErr) {
    return { success: false, error: insertErr.message };
  }

  // 6. Record the replacement
  await admin
    .from("pick_replacements")
    .update({
      replacement_skater_id: replacementSkaterId,
      replaced_at: new Date().toISOString(),
    })
    .eq("id", replacement.id);

  return { success: true };
}
