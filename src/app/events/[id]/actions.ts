"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function lockPicks(eventId: string, skaterIds: string[]) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Fetch event to validate
  const { data: event } = await supabase
    .from("events")
    .select("id, picks_limit, budget, picks_lock_at, status")
    .eq("id", eventId)
    .single();

  if (!event) {
    return { success: false, error: "Event not found" };
  }

  // Check if picks are locked
  if (event.status !== "upcoming") {
    return { success: false, error: "Event is no longer accepting picks" };
  }
  if (event.picks_lock_at && new Date(event.picks_lock_at) <= new Date()) {
    return { success: false, error: "Picks are locked for this event" };
  }

  // Validate pick count
  if (skaterIds.length !== event.picks_limit) {
    return {
      success: false,
      error: `You must pick exactly ${event.picks_limit} skaters`,
    };
  }

  // Validate budget — fetch prices for selected skaters
  const { data: entries } = await supabase
    .from("event_entries")
    .select("skater_id, price_at_event")
    .eq("event_id", eventId)
    .in("skater_id", skaterIds);

  if (!entries || entries.length !== skaterIds.length) {
    return {
      success: false,
      error: "One or more selected skaters are not in this event",
    };
  }

  const totalCost = entries.reduce((sum, e) => sum + e.price_at_event, 0);
  if (totalCost > event.budget) {
    return {
      success: false,
      error: `Over budget: $${(totalCost / 1_000_000).toFixed(1)}M / $${(event.budget / 1_000_000).toFixed(0)}M`,
    };
  }

  // Delete any existing picks for this user+event, then insert new ones
  await supabase
    .from("user_picks")
    .delete()
    .eq("user_id", user.id)
    .eq("event_id", eventId);

  const picks = skaterIds.map((skaterId) => ({
    user_id: user.id,
    event_id: eventId,
    skater_id: skaterId,
  }));

  const { error } = await supabase.from("user_picks").insert(picks);

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
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

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
