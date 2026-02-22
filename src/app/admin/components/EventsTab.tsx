"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createEvent,
  fetchEventsFull,
  updateEvent,
  deleteEvent,
} from "../actions";
import { InlineEditField, ConfirmDialog } from "./shared";

interface EventFull {
  id: string;
  name: string;
  event_type: string;
  status: string;
  location: string;
  start_date: string;
  end_date: string;
  picks_limit: number;
  budget: number;
  points_multiplier: number;
  picks_lock_at: string | null;
  replacement_deadline: string | null;
}

const STATUS_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

const EVENT_TYPE_OPTIONS = [
  { value: "gp", label: "Grand Prix" },
  { value: "championship", label: "Championship" },
  { value: "worlds", label: "Worlds" },
];

const statusBadge: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-gray-100 text-gray-600",
};

export function EventsTab() {
  const [events, setEvents] = useState<EventFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  async function loadEvents() {
    const res = await fetchEventsFull();
    if (res.success) setEvents(res.events as EventFull[]);
    setLoading(false);
  }

  useEffect(() => { loadEvents(); }, []);

  async function handleFieldUpdate(eventId: string, field: string, value: string | null) {
    let parsed: unknown = value;
    if (value !== null && ["picks_limit", "budget"].includes(field)) parsed = parseInt(value, 10);
    if (value !== null && field === "points_multiplier") parsed = parseFloat(value);

    const res = await updateEvent(eventId, { [field]: parsed });
    if (res.success) {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, [field]: parsed } : e))
      );
    } else {
      setMessage({ success: false, text: res.error ?? "Update failed" });
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const res = await deleteEvent(deleteId);
    if (res.success) {
      setEvents((prev) => prev.filter((e) => e.id !== deleteId));
      setMessage({ success: true, text: "Event deleted" });
    } else {
      setMessage({ success: false, text: res.error ?? "Delete failed" });
    }
    setDeleteId(null);
  }

  if (loading) return <p className="text-sm text-text-secondary">Loading events...</p>;

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

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{events.length} event(s)</p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-xl bg-emerald px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          {showCreate ? "Hide Form" : "Create New"}
        </button>
      </div>

      {showCreate && <CreateEventInline onCreated={() => { loadEvents(); setShowCreate(false); }} />}

      <div className="space-y-3">
        {events.map((ev) => (
          <div key={ev.id} className="rounded-xl border border-black/5 bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{ev.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      statusBadge[ev.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {ev.status}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">
                  {ev.event_type} &middot; {ev.location || "No location"} &middot;{" "}
                  {ev.start_date} to {ev.end_date} &middot; Budget: $
                  {(ev.budget / 1_000_000).toFixed(0)}M &middot; {ev.points_multiplier}x
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setEditingId(editingId === ev.id ? null : ev.id)}
                  className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-black/5"
                >
                  {editingId === ev.id ? "Close" : "Edit"}
                </button>
                <button
                  onClick={() => setDeleteId(ev.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>

            {editingId === ev.id && (
              <div className="mt-4 pt-4 border-t border-black/5 grid grid-cols-2 gap-3 text-sm">
                <EditRow label="Name">
                  <InlineEditField value={ev.name} onSave={(v) => handleFieldUpdate(ev.id, "name", v)} />
                </EditRow>
                <EditRow label="Status">
                  <InlineEditField
                    value={ev.status}
                    type="select"
                    options={STATUS_OPTIONS}
                    onSave={(v) => handleFieldUpdate(ev.id, "status", v)}
                    displayFormatter={(v) => String(v).charAt(0).toUpperCase() + String(v).slice(1)}
                  />
                </EditRow>
                <EditRow label="Type">
                  <InlineEditField
                    value={ev.event_type}
                    type="select"
                    options={EVENT_TYPE_OPTIONS}
                    onSave={(v) => handleFieldUpdate(ev.id, "event_type", v)}
                  />
                </EditRow>
                <EditRow label="Location">
                  <InlineEditField value={ev.location || ""} onSave={(v) => handleFieldUpdate(ev.id, "location", v)} />
                </EditRow>
                <EditRow label="Start Date">
                  <InlineEditField value={ev.start_date} type="date" onSave={(v) => handleFieldUpdate(ev.id, "start_date", v)} />
                </EditRow>
                <EditRow label="End Date">
                  <InlineEditField value={ev.end_date} type="date" onSave={(v) => handleFieldUpdate(ev.id, "end_date", v)} />
                </EditRow>
                <EditRow label="Picks Limit">
                  <InlineEditField value={ev.picks_limit} type="number" onSave={(v) => handleFieldUpdate(ev.id, "picks_limit", v)} />
                </EditRow>
                <EditRow label="Budget ($)">
                  <InlineEditField
                    value={ev.budget}
                    type="number"
                    onSave={(v) => handleFieldUpdate(ev.id, "budget", v)}
                    displayFormatter={(v) => `$${(Number(v) / 1_000_000).toFixed(1)}M`}
                  />
                </EditRow>
                <EditRow label="Multiplier">
                  <InlineEditField value={ev.points_multiplier} type="number" onSave={(v) => handleFieldUpdate(ev.id, "points_multiplier", v)} />
                </EditRow>
                <EditRow label="Picks Lock At">
                  <InlineEditField value={ev.picks_lock_at ?? ""} onSave={(v) => handleFieldUpdate(ev.id, "picks_lock_at", v || null)} />
                </EditRow>
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Event"
        message="This will permanently delete the event and all its entries and results. User picks will block deletion."
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

function CreateEventInline({ onCreated }: { onCreated: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createEvent(formData);
      if (res.success) {
        setResult({ success: true, message: `Event "${res.event.name}" created` });
        onCreated();
      } else {
        setResult({ success: false, message: res.error ?? "Unknown error" });
      }
    });
  }

  return (
    <form action={handleSubmit} className="rounded-xl border border-emerald/20 bg-emerald-50/30 p-4 space-y-4">
      <p className="text-sm font-medium">Create New Event</p>

      {result && (
        <div className={`rounded-lg p-2 text-xs border ${result.success ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {result.message}
        </div>
      )}

      <input name="name" placeholder="Event Name" required className="w-full rounded-xl border border-black/10 bg-background px-4 py-2.5 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald" />

      <div className="grid grid-cols-2 gap-3">
        <select name="event_type" required className="rounded-xl border border-black/10 bg-background px-4 py-2.5 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald">
          <option value="gp">Grand Prix</option>
          <option value="championship">Championship</option>
          <option value="worlds">Worlds</option>
        </select>
        <input name="location" placeholder="Location" className="rounded-xl border border-black/10 bg-background px-4 py-2.5 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input name="start_date" type="date" required className="rounded-xl border border-black/10 bg-background px-4 py-2.5 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald" />
        <input name="end_date" type="date" required className="rounded-xl border border-black/10 bg-background px-4 py-2.5 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <input name="picks_limit" type="number" placeholder="Picks Limit (8)" required className="rounded-xl border border-black/10 bg-background px-4 py-2.5 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald" />
        <input name="budget" type="number" placeholder="Budget" required className="rounded-xl border border-black/10 bg-background px-4 py-2.5 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald" />
        <input name="points_multiplier" type="number" step="0.5" placeholder="Multiplier (2)" required className="rounded-xl border border-black/10 bg-background px-4 py-2.5 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald" />
      </div>

      <input name="picks_lock_at" type="datetime-local" placeholder="Picks Lock At" className="w-full rounded-xl border border-black/10 bg-background px-4 py-2.5 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald" />

      <button type="submit" disabled={isPending} className="w-full rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
        {isPending ? "Creating..." : "Create Event"}
      </button>
    </form>
  );
}
