"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateDisplayName(formData: FormData) {
  const supabase = createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Not authenticated" };
  }
  const user = session.user;

  const displayName = (formData.get("displayName") as string)?.trim();

  if (!displayName || displayName.length < 1 || displayName.length > 50) {
    return { error: "Display name must be 1\u201350 characters" };
  }

  const { error } = await supabase
    .from("users")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) {
    return { error: "Failed to update display name. Please try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const supabase = createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Not authenticated" };
  }

  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: "Failed to update password. Please try again." };
  }

  return { success: true };
}

export async function deleteAccount() {
  const supabase = createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Not authenticated" };
  }
  const user = session.user;

  const admin = createAdminClient();

  // Delete user data from public tables (cascading order)
  await admin.from("user_picks").delete().eq("user_id", user.id);
  await admin.from("league_members").delete().eq("user_id", user.id);
  await admin.from("notifications").delete().eq("user_id", user.id);
  await admin.from("users").delete().eq("id", user.id);

  // Delete auth user
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return { error: "Failed to delete account. Please try again." };
  }

  // Sign out and redirect
  await supabase.auth.signOut();
  redirect("/login");
}
