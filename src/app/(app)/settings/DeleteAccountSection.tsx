"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "./actions";

export default function DeleteAccountSection() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount();
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-display font-semibold text-red-600 transition-colors hover:bg-red-100"
        >
          Delete account
        </button>
      ) : (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
          <p className="text-sm text-red-700 font-medium">
            Are you sure? This will permanently delete your account, picks, and
            league memberships. This cannot be undone.
          </p>

          {error && (
            <div className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-display font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Deleting\u2026" : "Yes, delete my account"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowConfirm(false);
                setError(null);
              }}
              disabled={isPending}
              className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-display font-semibold text-text-secondary transition-colors hover:bg-black/5 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
