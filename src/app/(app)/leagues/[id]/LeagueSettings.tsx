"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameLeague, deleteLeague } from "@/app/(app)/leagues/actions";

export default function LeagueSettings({
  leagueId,
  currentName,
}: {
  leagueId: string;
  currentName: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renaming, startRename] = useTransition();
  const [deleting, startDelete] = useTransition();

  function handleRename() {
    if (name.trim() === currentName) {
      setEditing(false);
      return;
    }
    setError(null);
    startRename(async () => {
      const result = await renameLeague(leagueId, name);
      if (result?.error) {
        setError(result.error);
      } else {
        setEditing(false);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    setError(null);
    startDelete(async () => {
      const result = await deleteLeague(leagueId);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mt-8 rounded-xl border border-black/5 bg-card p-5">
      <h3 className="font-display font-semibold text-sm text-text-secondary mb-4">
        League Settings
      </h3>

      {/* Rename */}
      <div className="mb-4">
        {editing ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setName(currentName);
                  setEditing(false);
                }
              }}
              className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald"
            />
            <button
              onClick={handleRename}
              disabled={renaming}
              className="rounded-lg aurora-gradient px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {renaming ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setName(currentName);
                setEditing(false);
              }}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-text-secondary hover:bg-black/5"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
            Rename league
          </button>
        )}
      </div>

      {/* Delete */}
      <div>
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-red-600">
              Delete this league permanently?
            </span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-text-secondary hover:bg-black/5"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            Delete league
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
