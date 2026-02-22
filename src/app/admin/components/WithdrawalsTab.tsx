"use client";

import { useEffect, useState, useTransition } from "react";
import {
  fetchEvents,
  fetchEventEntries,
  withdrawSkater,
} from "../actions";

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

export function WithdrawalsTab() {
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deadline, setDeadline] = useState("");
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchEvents().then((res) => {
      if (res.success) setEvents(res.events);
    });
  }, []);

  useEffect(() => {
    if (!selectedEvent) {
      setEntries([]);
      return;
    }
    setLoadingEntries(true);
    setResult(null);
    setConfirmingId(null);
    fetchEventEntries(selectedEvent).then((res) => {
      if (res.success) setEntries(res.entries as EntryRow[]);
      setLoadingEntries(false);
    });
  }, [selectedEvent]);

  function handleWithdraw(skaterId: string) {
    startTransition(async () => {
      const res = await withdrawSkater(
        selectedEvent,
        skaterId,
        deadline || null
      );
      if (res.success) {
        setResult({ success: true, message: res.summary! });
        setConfirmingId(null);
        const refreshed = await fetchEventEntries(selectedEvent);
        if (refreshed.success) setEntries(refreshed.entries as EntryRow[]);
      } else {
        setResult({ success: false, message: res.error ?? "Unknown error" });
      }
    });
  }

  const activeEntries = entries.filter((e) => !e.is_withdrawn);
  const withdrawnEntries = entries.filter((e) => e.is_withdrawn);

  return (
    <div className="space-y-5">
      {result && (
        <div
          className={`rounded-lg p-3 text-sm border ${
            result.success
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {result.message}
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
        <div>
          <label className="mb-1 block text-sm font-medium">
            Replacement Deadline (UTC)
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-background px-4 py-3 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald"
          />
          <p className="mt-1 text-xs text-text-secondary">
            Enter time in UTC. Set before withdrawing a skater.
          </p>
        </div>
      )}

      {loadingEntries && (
        <p className="text-sm text-text-secondary">Loading entries...</p>
      )}

      {withdrawnEntries.length > 0 && (
        <div>
          <p className="text-sm font-medium text-red-600 mb-2">
            Withdrawn ({withdrawnEntries.length})
          </p>
          <div className="space-y-2">
            {withdrawnEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-red-700 line-through">
                    {entry.skaters.name}
                  </span>
                  <span className="text-xs text-red-500">
                    {entry.skaters.country} &middot; {entry.skaters.discipline}
                  </span>
                </div>
                <span className="rounded-full bg-red-200 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  WITHDRAWN
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeEntries.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">
            Active Entries ({activeEntries.length})
          </p>
          <div className="space-y-2">
            {activeEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-black/5 bg-card p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {entry.skaters.name}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {entry.skaters.country} &middot;{" "}
                      {entry.skaters.discipline}
                    </span>
                    <span className="font-mono text-xs text-text-secondary">
                      ${(entry.price_at_event / 1_000_000).toFixed(1)}M
                    </span>
                  </div>
                  {confirmingId === entry.skater_id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleWithdraw(entry.skater_id)}
                        disabled={isPending}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {isPending ? "..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-black/5"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingId(entry.skater_id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
