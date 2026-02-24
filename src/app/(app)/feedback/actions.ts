"use server";

import { Resend } from "resend";
import { getAuthUser } from "@/lib/supabase-server";

const resend = new Resend(process.env.RESEND_API_KEY);

const VALID_TYPES = ["bug", "feedback", "feature"] as const;

const TYPE_LABELS: Record<string, string> = {
  bug: "Bug Report",
  feedback: "Feedback",
  feature: "Feature Request",
};

export async function submitFeedback(formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "You must be signed in to send feedback." };

  const type = formData.get("type") as string;
  const subject = (formData.get("subject") as string)?.trim();
  const message = (formData.get("message") as string)?.trim();

  if (!VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return { error: "Invalid feedback type." };
  }
  if (!subject || subject.length < 1 || subject.length > 200) {
    return { error: "Subject must be between 1 and 200 characters." };
  }
  if (!message || message.length < 10 || message.length > 5000) {
    return { error: "Message must be between 10 and 5000 characters." };
  }

  const label = TYPE_LABELS[type] ?? "Feedback";
  const userEmail = user.email ?? "unknown";

  try {
    await resend.emails.send({
      from: "Axel Pick Feedback <support@pantro.app>",
      to: "tomasz@pantro.app",
      replyTo: userEmail,
      subject: `[${label}] ${subject}`,
      text: [
        `Type: ${label}`,
        `From: ${userEmail}`,
        `User ID: ${user.id}`,
        "",
        message,
      ].join("\n"),
    });

    return { success: true };
  } catch {
    return { error: "Failed to send feedback. Please try again." };
  }
}
