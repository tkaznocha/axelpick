"use client";

import { useFormStatus } from "react-dom";

export default function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-display font-semibold text-text-secondary transition-colors hover:bg-black/5 disabled:opacity-50"
    >
      {pending && (
        <svg className="mr-1.5 inline h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {pending ? "Signing out\u2026" : "Sign out"}
    </button>
  );
}
