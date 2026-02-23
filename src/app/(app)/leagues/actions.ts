"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateInviteCode(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export async function createLeague(formData: FormData) {
  const supabase = createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");
  const user = session.user;

  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length === 0) {
    return { error: "League name is required" };
  }
  if (name.length > 50) {
    return { error: "League name must be 50 characters or less" };
  }

  // Use admin client for all DB operations to bypass RLS issues
  const admin = createAdminClient();

  // Generate a unique invite code (retry on collision)
  let inviteCode = generateInviteCode();
  let retries = 5;
  while (retries > 0) {
    const { data: existing } = await admin
      .from("leagues")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();

    if (!existing) break;
    inviteCode = generateInviteCode();
    retries--;
  }

  // Insert the league
  const { data: league, error: leagueError } = await admin
    .from("leagues")
    .insert({ name, invite_code: inviteCode, created_by: user.id })
    .select("id")
    .single();

  if (leagueError) {
    console.error("[createLeague] league insert failed:", leagueError);
    return { error: "Failed to create league. Please try again." };
  }

  // Auto-join the creator
  const { error: joinError } = await admin
    .from("league_members")
    .upsert({ league_id: league.id, user_id: user.id });

  if (joinError) {
    console.error("[createLeague] league_members upsert failed:", joinError);
    return { error: "League created but failed to join. Please try again." };
  }

  redirect(`/leagues/${league.id}`);
}

export async function renameLeague(leagueId: string, newName: string) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const name = newName.trim();
  if (!name || name.length === 0) {
    return { error: "League name is required" };
  }
  if (name.length > 50) {
    return { error: "League name must be 50 characters or less" };
  }

  const admin = createAdminClient();

  // Verify user is the creator
  const { data: league } = await admin
    .from("leagues")
    .select("id, created_by")
    .eq("id", leagueId)
    .single();

  if (!league || league.created_by !== session.user.id) {
    return { error: "Only the league creator can rename it" };
  }

  const { error } = await admin
    .from("leagues")
    .update({ name })
    .eq("id", leagueId);

  if (error) {
    return { error: "Failed to rename league. Please try again." };
  }

  return { success: true };
}

export async function deleteLeague(leagueId: string) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const admin = createAdminClient();

  // Verify user is the creator
  const { data: league } = await admin
    .from("leagues")
    .select("id, created_by")
    .eq("id", leagueId)
    .single();

  if (!league || league.created_by !== session.user.id) {
    return { error: "Only the league creator can delete it" };
  }

  // Delete members first (foreign key), then the league
  await admin.from("league_members").delete().eq("league_id", leagueId);
  const { error } = await admin.from("leagues").delete().eq("id", leagueId);

  if (error) {
    return { error: "Failed to delete league. Please try again." };
  }

  redirect("/leagues");
}

export async function joinLeague(inviteCode: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");
  const user = session.user;

  // Case-insensitive lookup: normalize to uppercase
  const normalizedCode = inviteCode.toUpperCase().trim();

  const { data: league } = await supabase
    .from("leagues")
    .select("id")
    .eq("invite_code", normalizedCode)
    .single();

  if (!league) {
    return { error: "League not found" };
  }

  // Use admin client to bypass self-referencing RLS on league_members
  const admin = createAdminClient();

  // Check if already a member
  const { data: existing } = await admin
    .from("league_members")
    .select("league_id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    redirect(`/leagues/${league.id}`);
  }

  const { error } = await admin
    .from("league_members")
    .insert({ league_id: league.id, user_id: user.id });

  if (error) {
    return { error: "Failed to join league. Please try again." };
  }

  redirect(`/leagues/${league.id}`);
}
