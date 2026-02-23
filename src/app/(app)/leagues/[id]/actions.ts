"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export type RosterPick = {
  skater_id: string;
  skater_name: string;
  country: string;
  discipline: string;
  points_earned: number | null;
};

export type MemberRoster = {
  user_id: string;
  display_name: string;
  picks: RosterPick[];
  total_points: number;
};

export async function fetchLeagueRosters(
  leagueId: string,
  eventId: string
): Promise<{ success: boolean; rosters?: MemberRoster[]; error?: string }> {
  const supabase = createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }
  const user = session.user;

  // Verify league membership
  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("league_members")
    .select("league_id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { success: false, error: "Not a member of this league" };
  }

  // Verify event is locked
  const { data: event } = await admin
    .from("events")
    .select("id, status, picks_lock_at")
    .eq("id", eventId)
    .single();

  if (!event) {
    return { success: false, error: "Event not found" };
  }

  const isLocked =
    event.status === "locked" ||
    event.status === "in_progress" ||
    event.status === "completed" ||
    (event.picks_lock_at && new Date(event.picks_lock_at) <= new Date());

  if (!isLocked) {
    return { success: false, error: "Picks are not yet locked for this event" };
  }

  // Fetch all league member user IDs
  const { data: members } = await admin
    .from("league_members")
    .select("user_id, users(id, display_name)")
    .eq("league_id", leagueId);

  if (!members || members.length === 0) {
    return { success: true, rosters: [] };
  }

  const memberUserIds = members.map((m) => m.user_id);

  // Fetch all picks for these members for this event
  const { data: picks } = await admin
    .from("user_picks")
    .select("user_id, skater_id, points_earned, skaters(id, name, country, discipline)")
    .eq("event_id", eventId)
    .in("user_id", memberUserIds);

  // Group picks by user
  const rosterMap = new Map<string, MemberRoster>();

  for (const m of members) {
    const u = m.users as unknown as { id: string; display_name: string };
    rosterMap.set(m.user_id, {
      user_id: m.user_id,
      display_name: u.display_name,
      picks: [],
      total_points: 0,
    });
  }

  for (const p of picks ?? []) {
    const roster = rosterMap.get(p.user_id);
    if (!roster) continue;

    const skater = p.skaters as unknown as {
      id: string;
      name: string;
      country: string;
      discipline: string;
    };

    roster.picks.push({
      skater_id: p.skater_id,
      skater_name: skater.name,
      country: skater.country,
      discipline: skater.discipline,
      points_earned: p.points_earned,
    });

    if (p.points_earned != null) {
      roster.total_points += p.points_earned;
    }
  }

  // Sort rosters by total points descending
  const rosters = Array.from(rosterMap.values()).sort(
    (a, b) => b.total_points - a.total_points
  );

  return { success: true, rosters };
}
