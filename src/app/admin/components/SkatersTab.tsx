"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchSkaters,
  updateSkater,
  deleteSkater,
  generateIsuSlugs,
  syncIsuProfile,
  bulkSyncIsuProfiles,
} from "../actions";
import { InlineEditField, ConfirmDialog } from "./shared";

interface Skater {
  id: string;
  name: string;
  country: string;
  discipline: string;
  world_ranking: number | null;
  current_price: number;
  is_active: boolean;
  season_best_score: number | null;
  personal_best_score: number | null;
  isu_slug: string | null;
  isu_bio_updated_at: string | null;
}

const DISCIPLINE_OPTIONS = [
  { value: "all", label: "All Disciplines" },
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "pairs", label: "Pairs" },
  { value: "ice_dance", label: "Ice Dance" },
];

const DISCIPLINE_EDIT_OPTIONS = DISCIPLINE_OPTIONS.filter((d) => d.value !== "all");

export function SkatersTab() {
  const [search, setSearch] = useState("");
  const [discipline, setDiscipline] = useState("all");
  const [page, setPage] = useState(1);
  const [skaters, setSkaters] = useState<Skater[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncLog, setSyncLog] = useState<string[] | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadSkaters = useCallback(async () => {
    setLoading(true);
    const res = await fetchSkaters({ search: debouncedSearch, discipline, page });
    if (res.success) {
      setSkaters(res.skaters as Skater[]);
      setTotal(res.total!);
    }
    setLoading(false);
  }, [debouncedSearch, discipline, page]);

  useEffect(() => { loadSkaters(); }, [loadSkaters]);

  async function handleFieldUpdate(skaterId: string, field: string, value: string) {
    let parsed: unknown = value;
    if (["current_price", "world_ranking"].includes(field)) parsed = value ? parseInt(value, 10) : null;
    if (["season_best_score", "personal_best_score"].includes(field)) parsed = value ? parseFloat(value) : null;
    if (field === "is_active") parsed = value === "true";

    const res = await updateSkater(skaterId, { [field]: parsed });
    if (res.success) {
      setSkaters((prev) =>
        prev.map((s) => (s.id === skaterId ? { ...s, [field]: parsed } : s))
      );
    } else {
      setMessage({ success: false, text: res.error ?? "Update failed" });
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const res = await deleteSkater(deleteId);
    if (res.success) {
      setSkaters((prev) => prev.filter((s) => s.id !== deleteId));
      setTotal((prev) => prev - 1);
      setMessage({ success: true, text: "Skater deleted" });
    } else {
      setMessage({ success: false, text: res.error ?? "Delete failed" });
    }
    setDeleteId(null);
  }

  async function handleBulkSync() {
    setBulkSyncing(true);
    setSyncLog(null);
    setMessage(null);
    // First generate slugs for any skaters missing them
    await generateIsuSlugs();
    const res = await bulkSyncIsuProfiles(discipline !== "all" ? discipline : undefined);
    if (res.success) {
      setMessage({ success: true, text: res.summary ?? "Sync complete" });
      setSyncLog(res.details ?? []);
    } else {
      setMessage({ success: false, text: res.error ?? "Bulk sync failed" });
    }
    setBulkSyncing(false);
    loadSkaters();
  }

  async function handleSingleSync(skaterId: string) {
    setSyncingId(skaterId);
    setMessage(null);
    const res = await syncIsuProfile(skaterId);
    if (res.success) {
      setMessage({ success: true, text: res.summary ?? "Synced" });
    } else {
      setMessage({ success: false, text: res.error ?? "Sync failed" });
    }
    setSyncingId(null);
    loadSkaters();
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-5">
      {message && (
        <div className={`rounded-lg p-3 text-sm border ${message.success ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search skaters..."
          className="flex-1 min-w-[200px] rounded-xl border border-black/10 bg-background px-4 py-3 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald"
        />
        <select
          value={discipline}
          onChange={(e) => { setDiscipline(e.target.value); setPage(1); }}
          className="rounded-xl border border-black/10 bg-background px-4 py-3 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald"
        >
          {DISCIPLINE_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        <button
          onClick={handleBulkSync}
          disabled={bulkSyncing}
          className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {bulkSyncing ? "Syncing ISU..." : "Bulk ISU Sync"}
        </button>
      </div>

      {syncLog && (
        <details className="rounded-xl border border-black/10 bg-black/[0.02] p-3">
          <summary className="text-sm font-medium cursor-pointer">Sync Log ({syncLog.length} entries)</summary>
          <pre className="mt-2 text-xs max-h-60 overflow-auto whitespace-pre-wrap">{syncLog.join("\n")}</pre>
        </details>
      )}

      <p className="text-sm text-text-secondary">
        {loading ? "Loading..." : `${total} skater(s) found`}
        {totalPages > 1 && ` — Page ${page} of ${totalPages}`}
      </p>

      <div className="space-y-2">
        {skaters.map((s) => (
          <div key={s.id} className="rounded-xl border border-black/5 bg-card p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm min-w-0">
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-text-secondary">{s.country}</span>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs">{s.discipline}</span>
                {s.world_ranking && (
                  <span className="text-xs text-text-secondary">#{s.world_ranking}</span>
                )}
                <span className="font-mono text-xs text-text-secondary">
                  ${(s.current_price / 1_000_000).toFixed(1)}M
                </span>
                {!s.is_active && (
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">Inactive</span>
                )}
                {s.isu_bio_updated_at ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700" title={s.isu_bio_updated_at}>
                    ISU {new Date(s.isu_bio_updated_at).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Not synced</span>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleSingleSync(s.id)}
                  disabled={syncingId === s.id}
                  className="rounded-lg border border-sky-200 px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50 disabled:opacity-50"
                >
                  {syncingId === s.id ? "Syncing..." : "Sync ISU"}
                </button>
                <button
                  onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                  className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-black/5"
                >
                  {editingId === s.id ? "Close" : "Edit"}
                </button>
                <button
                  onClick={() => setDeleteId(s.id)}
                  className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>

            {editingId === s.id && (
              <div className="mt-3 pt-3 border-t border-black/5 grid grid-cols-2 gap-3 text-sm">
                <EditRow label="Name">
                  <InlineEditField value={s.name} onSave={(v) => handleFieldUpdate(s.id, "name", v)} />
                </EditRow>
                <EditRow label="Country">
                  <InlineEditField value={s.country} onSave={(v) => handleFieldUpdate(s.id, "country", v)} />
                </EditRow>
                <EditRow label="Discipline">
                  <InlineEditField
                    value={s.discipline}
                    type="select"
                    options={DISCIPLINE_EDIT_OPTIONS}
                    onSave={(v) => handleFieldUpdate(s.id, "discipline", v)}
                  />
                </EditRow>
                <EditRow label="Ranking">
                  <InlineEditField
                    value={s.world_ranking ?? ""}
                    type="number"
                    onSave={(v) => handleFieldUpdate(s.id, "world_ranking", v)}
                  />
                </EditRow>
                <EditRow label="Price">
                  <InlineEditField
                    value={s.current_price}
                    type="number"
                    onSave={(v) => handleFieldUpdate(s.id, "current_price", v)}
                    displayFormatter={(v) => `$${(Number(v) / 1_000_000).toFixed(1)}M`}
                  />
                </EditRow>
                <EditRow label="Season Best">
                  <InlineEditField
                    value={s.season_best_score ?? ""}
                    type="number"
                    onSave={(v) => handleFieldUpdate(s.id, "season_best_score", v)}
                  />
                </EditRow>
                <EditRow label="Personal Best">
                  <InlineEditField
                    value={s.personal_best_score ?? ""}
                    type="number"
                    onSave={(v) => handleFieldUpdate(s.id, "personal_best_score", v)}
                  />
                </EditRow>
                <EditRow label="Active">
                  <InlineEditField
                    value={String(s.is_active)}
                    type="select"
                    options={[
                      { value: "true", label: "Active" },
                      { value: "false", label: "Inactive" },
                    ]}
                    onSave={(v) => handleFieldUpdate(s.id, "is_active", v)}
                    displayFormatter={(v) => (v === "true" ? "Active" : "Inactive")}
                  />
                </EditRow>
                <EditRow label="ISU Slug">
                  <InlineEditField
                    value={s.isu_slug ?? ""}
                    onSave={(v) => handleFieldUpdate(s.id, "isu_slug", v)}
                  />
                </EditRow>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium disabled:opacity-30 hover:bg-black/5"
          >
            Previous
          </button>
          <span className="text-sm text-text-secondary">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium disabled:opacity-30 hover:bg-black/5"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Skater"
        message="This will permanently delete the skater. Blocked if any entries or results reference them."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function EditRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-text-secondary">{label}</span>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
