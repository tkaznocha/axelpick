"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

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
