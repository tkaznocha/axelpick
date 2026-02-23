"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function markNotificationRead(notificationId: string) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { success: false };
  const user = session.user;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  return { success: true };
}
