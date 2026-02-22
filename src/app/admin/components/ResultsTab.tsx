"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import {
  fetchEvents,
  fetchEventResults,
  importResults,
  updateResult,
  deleteResult,
  recalculateEventPoints,
} from "../actions";
import { ConfirmDialog } from "./shared";

interface EventOption {
  id: string;
  name: string;
  event_type: string;
  status: string;
  start_date: string;
}

interface ResultRow {
  id: string;
  skater_id: string;
  final_placement: number;
  sp_placement: number | null;
  total_score: number | null;
  sp_score: number | null;
  fs_score: number | null;
  falls: number;
  is_personal_best: boolean;
  is_withdrawal: boolean;
  fantasy_points_raw: number;
  fantasy_points_final: number;
  skaters: {
    id: string;
    name: string;
    country: string;
    discipline: string;
  };
}

export function ResultsTab() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [recalcPending, startRecalc] = useTransition();
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    fetchEvents().then((res) => {
      if (res.success) setEvents(res.events);
    });
  }, []);

  const loadResults = useCallback(async () => {
    if (!selectedEvent) { setResults([]); return; }
    setLoading(true);
    setMessage(null);
    const res = await fetchEventResults(selectedEvent);
    if (res.success) setResults(res.results as ResultRow[]);
    setLoading(false);
  }, [selectedEvent]);

  useEffect(() => { loadResults(); }, [loadResults]);

  function handleRecalculate() {
    startRecalc(async () => {
      const res = await recalculateEventPoints(selectedEvent);
      if (res.success) {
        setMessage({ success: true, text: res.summary! });
        loadResults();
      } else {
        setMessage({ success: false, text: res.error ?? "Recalculation failed" });
      }
    });
  }

  async function handleDelete() {
    if (!deleteId) return;
    const res = await deleteResult(deleteId);
    if (res.success) {
      setResults((prev) => prev.filter((r) => r.id !== deleteId));
      setMessage({ success: true, text: "Result deleted" });
    } else {
      setMessage({ success: false, text: res.error ?? "Delete failed" });
    }
    setDeleteId(null);
  }

  return (
    <div className="space-y-5">
      {message && (
        <div className={`rounded-lg p-3 text-sm border ${message.success ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {message.text}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Event</label>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-background px-4 py-3 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald"
        >
          <option value="">Select an event...</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name} ({ev.event_type}) — {ev.status}
            </option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(!showImport)}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            {showImport ? "Hide Import" : "Import JSON"}
          </button>
          <button
            onClick={handleRecalculate}
            disabled={recalcPending}
            className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            {recalcPending ? "Recalculating..." : "Recalculate Points"}
          </button>
        </div>
      )}

      {showImport && selectedEvent && (
        <ImportResultsInline eventId={selectedEvent} onDone={() => { loadResults(); setShowImport(false); }} />
      )}

      {loading && <p className="text-sm text-text-secondary">Loading results...</p>}

      {results.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">{results.length} results</p>
          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.id} className="rounded-xl border border-black/5 bg-card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-mono font-bold w-8 text-center">{r.final_placement}</span>
                    <span className="font-medium">{r.skaters.name}</span>
                    <span className="text-xs text-text-secondary">{r.skaters.country}</span>
                    {r.total_score && (
                      <span className="font-mono text-xs text-text-secondary">{r.total_score}pts</span>
                    )}
                    {r.falls > 0 && (
                      <span className="text-xs text-red-600">{r.falls} fall(s)</span>
                    )}
                    {r.is_personal_best && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">PB</span>
                    )}
                    <span className="font-mono text-xs font-semibold text-emerald-600">
                      {r.fantasy_points_final} fp
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setEditingId(editingId === r.id ? null : r.id)}
                      className="rounded-lg border border-black/10 px-2.5 py-1 text-xs font-medium text-text-secondary hover:bg-black/5"
                    >
                      {editingId === r.id ? "Close" : "Edit"}
                    </button>
                    <button
                      onClick={() => setDeleteId(r.id)}
                      className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {editingId === r.id && (
                  <EditResultForm result={r} onSaved={(updated) => {
                    setResults((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...updated } : x)));
                    setEditingId(null);
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Result"
        message="This will permanently remove this result row."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

// ---------- Edit Result Form ----------

function EditResultForm({
  result,
  onSaved,
}: {
  result: ResultRow;
  onSaved: (updated: Partial<ResultRow>) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    final_placement: result.final_placement,
    sp_placement: result.sp_placement ?? "",
    total_score: result.total_score ?? "",
    sp_score: result.sp_score ?? "",
    fs_score: result.fs_score ?? "",
    falls: result.falls,
    is_personal_best: result.is_personal_best,
    is_withdrawal: result.is_withdrawal,
  });
  const [error, setError] = useState("");

  function handleSubmit() {
    startTransition(async () => {
      const fields = {
        final_placement: Number(form.final_placement),
        sp_placement: form.sp_placement !== "" ? Number(form.sp_placement) : null,
        total_score: form.total_score !== "" ? Number(form.total_score) : null,
        sp_score: form.sp_score !== "" ? Number(form.sp_score) : null,
        fs_score: form.fs_score !== "" ? Number(form.fs_score) : null,
        falls: Number(form.falls),
        is_personal_best: form.is_personal_best,
        is_withdrawal: form.is_withdrawal,
      };

      const res = await updateResult(result.id, fields);
      if (res.success) {
        onSaved({
          ...fields,
          fantasy_points_raw: res.fantasy_points_raw,
          fantasy_points_final: res.fantasy_points_final,
        });
      } else {
        setError(res.error ?? "Update failed");
      }
    });
  }

  const inputClass = "rounded-lg border border-black/10 bg-background px-3 py-1.5 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald";

  return (
    <div className="mt-3 pt-3 border-t border-black/5 space-y-3">
      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-xs text-text-secondary">Placement</label>
          <input type="number" value={form.final_placement} onChange={(e) => setForm({ ...form, final_placement: Number(e.target.value) })} className={inputClass + " w-full"} />
        </div>
        <div>
          <label className="text-xs text-text-secondary">SP Place</label>
          <input type="number" value={form.sp_placement} onChange={(e) => setForm({ ...form, sp_placement: e.target.value === "" ? "" : Number(e.target.value) })} className={inputClass + " w-full"} />
        </div>
        <div>
          <label className="text-xs text-text-secondary">Total Score</label>
          <input type="number" step="0.01" value={form.total_score} onChange={(e) => setForm({ ...form, total_score: e.target.value === "" ? "" : Number(e.target.value) })} className={inputClass + " w-full"} />
        </div>
        <div>
          <label className="text-xs text-text-secondary">Falls</label>
          <input type="number" value={form.falls} onChange={(e) => setForm({ ...form, falls: Number(e.target.value) })} className={inputClass + " w-full"} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-xs text-text-secondary">SP Score</label>
          <input type="number" step="0.01" value={form.sp_score} onChange={(e) => setForm({ ...form, sp_score: e.target.value === "" ? "" : Number(e.target.value) })} className={inputClass + " w-full"} />
        </div>
        <div>
          <label className="text-xs text-text-secondary">FS Score</label>
          <input type="number" step="0.01" value={form.fs_score} onChange={(e) => setForm({ ...form, fs_score: e.target.value === "" ? "" : Number(e.target.value) })} className={inputClass + " w-full"} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_personal_best} onChange={(e) => setForm({ ...form, is_personal_best: e.target.checked })} className="rounded" />
          PB
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_withdrawal} onChange={(e) => setForm({ ...form, is_withdrawal: e.target.checked })} className="rounded" />
          WD
        </label>
      </div>

      <button onClick={handleSubmit} disabled={isPending} className="rounded-xl bg-emerald px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
        {isPending ? "Saving..." : "Save & Recalculate"}
      </button>
    </div>
  );
}

// ---------- Import Results inline ----------

function ImportResultsInline({ eventId, onDone }: { eventId: string; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [jsonText, setJsonText] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string; details?: string[] } | null>(null);

  function handleSubmit() {
    if (!jsonText.trim()) return;
    startTransition(async () => {
      const res = await importResults(eventId, jsonText);
      if (res.success) {
        setResult({ success: true, message: res.summary!, details: res.details });
        onDone();
      } else {
        setResult({ success: false, message: res.error ?? "Unknown error" });
      }
    });
  }

  return (
    <div className="rounded-xl border border-black/10 p-4 space-y-3">
      <p className="text-sm font-medium">Import Results (JSON)</p>
      {result && (
        <div className={`rounded-lg p-2 text-xs border ${result.success ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {result.message}
        </div>
      )}
      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        rows={8}
        placeholder='[{"skater_name":"...","placement":1,"sp_placement":1,"total_score":310.5,"falls":0,"is_personal_best":true}]'
        className="w-full rounded-xl border border-black/10 bg-background px-4 py-3 font-mono text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald"
      />
      <button onClick={handleSubmit} disabled={isPending} className="rounded-xl bg-emerald px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
        {isPending ? "Importing..." : "Import"}
      </button>
      {result?.details && result.details.length > 0 && (
        <div className="rounded-xl bg-black/5 p-3 max-h-40 overflow-auto">
          {result.details.map((line, i) => (
            <p key={i} className="font-mono text-xs text-text-secondary">{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
