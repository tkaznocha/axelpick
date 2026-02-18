"use server";

import { createAdminClient } from "@/lib/supabase-admin";

export async function joinWaitlist(email: string) {
  if (!email || !email.includes("@") || !email.includes(".")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const admin = createAdminClient();

  const { error } = await admin.from("waitlist").insert({ email: email.trim().toLowerCase() });

  if (error) {
    if (error.message.includes("duplicate")) {
      return { success: true }; // Already signed up — treat as success
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
