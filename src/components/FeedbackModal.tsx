"use client";

import { useState, useTransition, useEffect } from "react";
import { track } from "@vercel/analytics";
import { submitFeedback } from "@/app/(app)/feedback/actions";

export default function FeedbackModal({
  open,
  onClose,
  userEmail,
}: {
  open: boolean;
  onClose: () => void;
  userEmail?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) setMessage(null);
  }, [open]);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await submitFeedback(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        track("feedback_submitted", { type: formData.get("type") as string });
        setMessage({ type: "success", text: "Feedback sent! Thanks for letting us know." });
        setTimeout(() => onClose(), 1500);
      }
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-black/5 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg">Send Feedback</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-black/5 transition-colors"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {userEmail && (
          <p className="text-xs text-text-secondary mb-4">
            We&apos;ll reply to <span className="font-medium">{userEmail}</span>
          </p>
        )}

        <form action={handleSubmit} className="space-y-4">
          {/* Type */}
          <div>
            <label htmlFor="fb-type" className="block text-sm font-medium text-text-primary mb-1.5">
              Type
            </label>
            <select
              id="fb-type"
              name="type"
              required
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-shadow"
            >
              <option value="bug">Bug Report</option>
              <option value="feedback">General Feedback</option>
              <option value="feature">Feature Request</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="fb-subject" className="block text-sm font-medium text-text-primary mb-1.5">
              Subject
            </label>
            <input
              id="fb-subject"
              name="subject"
              type="text"
              required
              maxLength={200}
              placeholder="Brief summary"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-shadow"
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="fb-message" className="block text-sm font-medium text-text-primary mb-1.5">
              Message
            </label>
            <textarea
              id="fb-message"
              name="message"
              required
              rows={5}
              minLength={10}
              maxLength={5000}
              placeholder="Describe the issue or suggestion in detail..."
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-shadow resize-none"
            />
          </div>

          {/* Feedback message */}
          {message && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl aurora-gradient px-5 py-2.5 text-sm font-display font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Sending..." : "Send Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}
