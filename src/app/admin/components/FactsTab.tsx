"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import {
  fetchEvents,
  getEventStats,
  generateFacts,
  fetchEventFacts,
  updateFact,
  deleteFact,
  publishAllFacts,
} from "../actions";
import type { EventStats } from "../actions";
import { ConfirmDialog } from "./shared";

interface EventOption {
  id: string;
  name: string;
  event_type: string;
  status: string;
  start_date: string;
}

interface Fact {
  id: string;
  event_id: string;
  fact_text: string;
  category: string | null;
  is_published: boolean;
  sort_order: number;
  generated_at: string;
  edited_at: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  surprise: "bg-amber-100 text-amber-700",
  popular: "bg-blue-100 text-blue-700",
  underdog: "bg-purple-100 text-purple-700",
  value: "bg-emerald-100 text-emerald-700",
  scoring: "bg-cyan-100 text-cyan-700",
  drama: "bg-red-100 text-red-700",
  strategy: "bg-indigo-100 text-indigo-700",
};

export function FactsTab() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [facts, setFacts] = useState<Fact[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [generating, startGenerate] = useTransition();
  const [publishing, startPublish] = useTransition();
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    fetchEvents().then((res) => {
      if (res.success) {
        // Only show completed events
        setEvents(res.events.filter((e) => e.status === "completed"));
      }
    });
  }, []);

  const loadFacts = useCallback(async () => {
    if (!selectedEvent) {
      setFacts([]);
      setStats(null);
      return;
    }
    setLoading(true);
    setMessage(null);
    const [factsRes, statsRes] = await Promise.all([
      fetchEventFacts(selectedEvent),
      getEventStats(selectedEvent),
    ]);
    if (factsRes.success) setFacts(factsRes.facts as Fact[]);
    if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
    setLoading(false);
  }, [selectedEvent]);

  useEffect(() => {
    loadFacts();
  }, [loadFacts]);

  function handleGenerate() {
    startGenerate(async () => {
      const res = await generateFacts(selectedEvent);
      if (res.success) {
        setMessage({ success: true, text: res.summary! });
        loadFacts();
      } else {
        setMessage({ success: false, text: res.error ?? "Generation failed" });
      }
    });
  }

  function handlePublishAll() {
    startPublish(async () => {
      const res = await publishAllFacts(selectedEvent);
      if (res.success) {
        setFacts((prev) => prev.map((f) => ({ ...f, is_published: true })));
        setMessage({ success: true, text: "All facts published" });
      } else {
        setMessage({ success: false, text: res.error ?? "Publish failed" });
      }
    });
  }

  async function handleTogglePublish(fact: Fact) {
    const res = await updateFact(fact.id, { is_published: !fact.is_published });
    if (res.success) {
      setFacts((prev) =>
        prev.map((f) =>
          f.id === fact.id ? { ...f, is_published: !f.is_published } : f
        )
      );
    }
  }

  async function handleSaveEdit(factId: string) {
    const res = await updateFact(factId, { fact_text: editText });
    if (res.success) {
      setFacts((prev) =>
        prev.map((f) => (f.id === factId ? { ...f, fact_text: editText } : f))
      );
      setEditingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const res = await deleteFact(deleteId);
    if (res.success) {
      setFacts((prev) => prev.filter((f) => f.id !== deleteId));
      setMessage({ success: true, text: "Fact deleted" });
    } else {
      setMessage({ success: false, text: res.error ?? "Delete failed" });
    }
    setDeleteId(null);
  }

  const unpublishedCount = facts.filter((f) => !f.is_published).length;

  return (
    <div className="space-y-5">
      {message && (
        <div
          className={`rounded-lg p-3 text-sm border ${
            message.success
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">
          Event (completed only)
        </label>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-background px-4 py-3 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald"
        >
          <option value="">Select an event...</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} ({ev.event_type})
            </option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-xl bg-emerald px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Facts"}
          </button>
          {facts.length > 0 && unpublishedCount > 0 && (
            <button
              onClick={handlePublishAll}
              disabled={publishing}
              className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              {publishing ? "Publishing..." : "Publish All"}
            </button>
          )}
          {stats && (
            <button
              onClick={() => setShowStats(!showStats)}
              className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
            >
              {showStats ? "Hide Stats" : "Show Stats"}
            </button>
          )}
        </div>
      )}

      {/* Stats summary panel */}
      {showStats && stats && (
        <div className="rounded-xl border border-black/10 p-4 space-y-2">
          <p className="text-sm font-medium">
            Pick Stats — {stats.total_users} players
          </p>
          <div className="max-h-60 overflow-auto space-y-1">
            {stats.skaters.map((s) => (
              <div
                key={s.skater_name}
                className="flex items-center gap-3 text-xs"
              >
                <span className="font-mono w-6 text-right">
                  {s.placement ?? "—"}
                </span>
                <span className="font-medium w-40 truncate">
                  {s.skater_name}
                </span>
                <span className="text-text-secondary w-8">${s.price}</span>
                <span className="text-text-secondary">
                  {s.pick_count} picks ({s.pick_pct}%)
                </span>
                <span className="font-mono text-emerald-600">
                  {s.fantasy_points} fp
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <p className="text-sm text-text-secondary">Loading facts...</p>
      )}

      {/* Facts list */}
      {facts.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">{facts.length} facts</p>
          <div className="space-y-2">
            {facts.map((f) => (
              <div
                key={f.id}
                className={`rounded-xl border p-3 ${
                  f.is_published
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-black/5 bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {f.category && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            CATEGORY_COLORS[f.category] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {f.category}
                        </span>
                      )}
                      {f.is_published && (
                        <span className="text-xs text-emerald-600 font-medium">
                          Published
                        </span>
                      )}
                    </div>

                    {editingId === f.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-emerald bg-background px-3 py-2 text-sm outline-none ring-1 ring-emerald"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(f.id)}
                            className="rounded-lg bg-emerald px-3 py-1 text-xs font-medium text-white hover:bg-emerald-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-black/10 px-3 py-1 text-xs font-medium text-text-secondary hover:bg-black/5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">{f.fact_text}</p>
                    )}
                  </div>

                  {editingId !== f.id && (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(f.id);
                          setEditText(f.fact_text);
                        }}
                        className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-black/5"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleTogglePublish(f)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                          f.is_published
                            ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {f.is_published ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={() => setDeleteId(f.id)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Fact"
        message="This will permanently remove this fact."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
