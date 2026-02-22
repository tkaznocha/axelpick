"use client";

import { useRef, useState, useTransition } from "react";
import { updateDisplayName } from "./actions";

export default function ProfileForm({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateDisplayName(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Display name updated." });
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-6">
      {/* Display Name */}
      <div>
        <label
          htmlFor="displayName"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={displayName}
          maxLength={50}
          required
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-shadow"
          placeholder="Your display name"
        />
        <p className="mt-1 text-xs text-text-secondary">
          This is how other players see you on leaderboards and in leagues.
        </p>
      </div>

      {/* Email (read-only) */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          disabled
          className="w-full rounded-xl border border-black/5 bg-black/[0.02] px-4 py-2.5 text-sm text-text-secondary cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-text-secondary">
          Email cannot be changed here. Contact support if needed.
        </p>
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
        className="rounded-xl aurora-gradient px-5 py-2.5 text-sm font-display font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Saving\u2026" : "Save changes"}
      </button>
    </form>
  );
}
