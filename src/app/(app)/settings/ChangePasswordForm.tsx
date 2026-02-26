"use client";

import { useState, useTransition } from "react";
import { track } from "@vercel/analytics";
import { changePassword } from "./actions";

export default function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await changePassword(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        track("password_changed");
        setMessage({ type: "success", text: "Password updated." });
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-shadow"
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-text-primary mb-1.5"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-emerald/30 focus:border-emerald transition-shadow"
          placeholder="Re-enter your new password"
        />
      </div>

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

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl aurora-gradient px-5 py-2.5 text-sm font-display font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Updating\u2026" : "Update password"}
      </button>
    </form>
  );
}
