"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import {
  fetchEvents,
  fetchEventEntries,
  importEntries,
  updateEntryPrice,
  removeEntry,
  addEntryToEvent,
  fetchSkaterSearch,
} from "../actions";
import { InlineEditField, ConfirmDialog } from "./shared";

interface EventOption {
  id: string;
  name: string;
  event_type: string;
  status: string;
  start_date: string;
}

interface EntryRow {
  id: string;
  skater_id: string;
  price_at_event: number;
  is_withdrawn: boolean;
  withdrawn_at: string | null;
  skaters: {
    id: string;
    name: string;
    country: string;
    discipline: string;
  };
}

interface SkaterResult {
  id: string;
  name: string;
  country: string;
  discipline: string;
  current_price: number;
}

export function EntriesTab() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    fetchEvents().then((res) => {
      if (res.success) setEvents(res.events);
    });
  }, []);

  const loadEntries = useCallback(async () => {
    if (!selectedEvent) { setEntries([]); return; }
    setLoading(true);
    setMessage(null);
    const res = await fetchEventEntries(selectedEvent);
    if (res.success) setEntries(res.entries as EntryRow[]);
    setLoading(false);
  }, [selectedEvent]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  async function handlePriceUpdate(entryId: string, newPrice: string) {
    const price = parseInt(newPrice, 10);
    if (isNaN(price)) return;
    const res = await updateEntryPrice(entryId, price);
    if (res.success) {
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, price_at_event: price } : e))
      );
    } else {
      setMessage({ success: false, text: res.error ?? "Update failed" });
    }
  }

  async function handleRemove() {
    if (!removeId) return;
    const res = await removeEntry(removeId);
    if (res.success) {
      setEntries((prev) => prev.filter((e) => e.id !== removeId));
      setMessage({ success: true, text: "Entry removed" });
    } else {
      setMessage({ success: false, text: res.error ?? "Remove failed" });
    }
    setRemoveId(null);
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
            onClick={() => { setShowImport(!showImport); setShowAdd(false); }}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            {showImport ? "Hide Import" : "Import JSON"}
          </button>
          <button
            onClick={() => { setShowAdd(!showAdd); setShowImport(false); }}
            className="rounded-xl bg-emerald px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            {showAdd ? "Hide" : "Add Entry"}
          </button>
        </div>
      )}

      {showImport && selectedEvent && (
        <ImportEntriesInline eventId={selectedEvent} onDone={() => { loadEntries(); setShowImport(false); }} />
      )}

      {showAdd && selectedEvent && (
        <AddEntryInline eventId={selectedEvent} onAdded={loadEntries} />
      )}

      {loading && <p className="text-sm text-text-secondary">Loading entries...</p>}

      {entries.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">{entries.length} entries</p>
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl border border-black/5 bg-card p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-sm font-medium ${entry.is_withdrawn ? "line-through text-red-600" : ""}`}>
                    {entry.skaters.name}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {entry.skaters.country} &middot; {entry.skaters.discipline}
                  </span>
                  {entry.is_withdrawn && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">WD</span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <InlineEditField
                    value={entry.price_at_event}
                    type="number"
                    onSave={(v) => handlePriceUpdate(entry.id, v)}
                    displayFormatter={(v) => `$${(Number(v) / 1_000_000).toFixed(1)}M`}
                    className="font-mono text-xs"
                  />
                  <button
                    onClick={() => setRemoveId(entry.id)}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!removeId}
        title="Remove Entry"
        message="This will remove the skater from this event. Blocked if users have already picked them."
        confirmLabel="Remove"
        onConfirm={handleRemove}
        onCancel={() => setRemoveId(null)}
      />
    </div>
  );
}

// ---------- Import JSON inline ----------

function ImportEntriesInline({ eventId, onDone }: { eventId: string; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [jsonText, setJsonText] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string; details?: string[] } | null>(null);

  function handleSubmit() {
    if (!jsonText.trim()) return;
    startTransition(async () => {
      const res = await importEntries(eventId, jsonText);
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
      <p className="text-sm font-medium">Import Entries (JSON)</p>
      {result && (
        <div className={`rounded-lg p-2 text-xs border ${result.success ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {result.message}
        </div>
      )}
      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        rows={8}
        placeholder='[{"skater_name":"...","country":"...","discipline":"...","price":15000000}]'
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

// ---------- Add Entry inline ----------

function AddEntryInline({ eventId, onAdded }: { eventId: string; onAdded: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SkaterResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSkater, setSelectedSkater] = useState<SkaterResult | null>(null);
  const [price, setPrice] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const res = await fetchSkaterSearch(query);
      if (res.success) setResults(res.skaters as SkaterResult[]);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(skater: SkaterResult) {
    setSelectedSkater(skater);
    setPrice(String(skater.current_price));
    setQuery("");
    setResults([]);
  }

  function handleAdd() {
    if (!selectedSkater || !price) return;
    startTransition(async () => {
      const res = await addEntryToEvent(eventId, selectedSkater.id, parseInt(price, 10));
      if (res.success) {
        setMessage({ success: true, text: `${selectedSkater.name} added` });
        setSelectedSkater(null);
        setPrice("");
        onAdded();
      } else {
        setMessage({ success: false, text: res.error ?? "Failed" });
      }
    });
  }

  return (
    <div className="rounded-xl border border-emerald/20 bg-emerald-50/30 p-4 space-y-3">
      <p className="text-sm font-medium">Add Entry</p>
      {message && (
        <div className={`rounded-lg p-2 text-xs border ${message.success ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {message.text}
        </div>
      )}

      {!selectedSkater ? (
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skaters by name..."
            className="w-full rounded-xl border border-black/10 bg-background px-4 py-2.5 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald"
          />
          {searching && <p className="text-xs text-text-secondary mt-1">Searching...</p>}
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-black/10 bg-card shadow-lg max-h-48 overflow-auto">
              {results.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-black/5 border-b border-black/5 last:border-0"
                >
                  {s.name} <span className="text-text-secondary">({s.country}, {s.discipline})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{selectedSkater.name}</span>
          <span className="text-xs text-text-secondary">{selectedSkater.country}, {selectedSkater.discipline}</span>
          <button onClick={() => setSelectedSkater(null)} className="text-xs text-red-600 hover:underline">Change</button>
        </div>
      )}

      {selectedSkater && (
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="flex-1 rounded-xl border border-black/10 bg-background px-4 py-2.5 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald"
          />
          <button
            onClick={handleAdd}
            disabled={isPending}
            className="rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {isPending ? "Adding..." : "Add"}
          </button>
        </div>
      )}
    </div>
  );
}
