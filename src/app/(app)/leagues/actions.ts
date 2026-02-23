"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
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

  // Generate a unique invite code (retry on collision)
  let inviteCode = generateInviteCode();
  let retries = 5;
  while (retries > 0) {
    const { data: existing } = await supabase
      .from("leagues")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();

    if (!existing) break;
    inviteCode = generateInviteCode();
    retries--;
  }

  // Insert the league
  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .insert({ name, invite_code: inviteCode, created_by: user.id })
    .select("id")
    .single();

  if (leagueError) {
    return { error: "Failed to create league. Please try again." };
  }

  // Auto-join the creator
  const { error: joinError } = await supabase
    .from("league_members")
    .insert({ league_id: league.id, user_id: user.id });

  if (joinError) {
    return { error: "League created but failed to join. Please try again." };
  }

  redirect(`/leagues/${league.id}`);
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

  // Check if already a member
  const { data: existing } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    redirect(`/leagues/${league.id}`);
  }

  const { error } = await supabase
    .from("league_members")
    .insert({ league_id: league.id, user_id: user.id });

  if (error) {
    return { error: "Failed to join league. Please try again." };
  }

  redirect(`/leagues/${league.id}`);
}
