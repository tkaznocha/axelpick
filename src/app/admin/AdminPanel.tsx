"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createEvent,
  importEntries,
  importResults,
  fetchEvents,
} from "./actions";

type Tab = "event" | "entries" | "results";

interface EventOption {
  id: string;
  name: string;
  event_type: string;
  status: string;
  start_date: string;
}

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>("event");

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-2">Admin Panel</h1>
      <p className="text-text-secondary mb-8">
        Manage events, entries, and results.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 rounded-xl bg-black/5 p-1">
        {([
          ["event", "Create Event"],
          ["entries", "Import Entries"],
          ["results", "Import Results"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-card text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "event" && <CreateEventForm />}
      {tab === "entries" && <ImportEntriesForm />}
      {tab === "results" && <ImportResultsForm />}
    </main>
  );
}

// ---------- Create Event ----------

function CreateEventForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await createEvent(formData);
      if (res.success) {
        setResult({
          success: true,
          message: `Event "${res.event.name}" created (ID: ${res.event.id})`,
        });
      } else {
        setResult({ success: false, message: res.error ?? "Unknown error" });
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <StatusMessage result={result} />

      <Field label="Event Name" name="name" placeholder="ISU World Championships 2026" required />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Event Type</label>
          <select
            name="event_type"
            required
            className="w-full rounded-xl border border-black/10 bg-background px-4 py-3 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald"
          >
            <option value="gp">Grand Prix</option>
            <option value="championship">Championship</option>
            <option value="worlds">Worlds</option>
          </select>
        </div>
        <Field label="Location" name="location" placeholder="Prague, Czech Republic" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start Date" name="start_date" type="date" required />
        <Field label="End Date" name="end_date" type="date" required />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Picks Limit" name="picks_limit" type="number" placeholder="8" required />
        <Field
          label="Budget ($)"
          name="budget"
          type="number"
          placeholder="70000000"
          required
        />
        <Field
          label="Multiplier"
          name="points_multiplier"
          type="number"
          placeholder="2"
          step="0.5"
          required
        />
      </div>

      <Field
        label="Picks Lock At"
        name="picks_lock_at"
        type="datetime-local"
        helpText="When picks should lock (leave empty for manual lock)"
      />

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-emerald px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create Event"}
      </button>
    </form>
  );
}

// ---------- Import Entries ----------

function ImportEntriesForm() {
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string[];
  } | null>(null);

  useEffect(() => {
    fetchEvents().then((res) => {
      if (res.success) setEvents(res.events);
    });
  }, []);

  function handleSubmit() {
    if (!selectedEvent || !jsonText.trim()) return;
    startTransition(async () => {
      const res = await importEntries(selectedEvent, jsonText);
      if (res.success) {
        setResult({
          success: true,
          message: res.summary!,
          details: res.details,
        });
      } else {
        setResult({ success: false, message: res.error ?? "Unknown error" });
      }
    });
  }

  const sampleJson = `[
  {
    "skater_name": "Ilia Malinin",
    "country": "USA",
    "discipline": "men",
    "world_ranking": 1,
    "price": 15000000
  }
]`;

  return (
    <div className="space-y-5">
      <StatusMessage result={result} />

      <EventSelector
        events={events}
        value={selectedEvent}
        onChange={setSelectedEvent}
      />

      <div>
        <label className="mb-1 block text-sm font-medium">
          Entry List (JSON)
        </label>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={12}
          placeholder={sampleJson}
          className="w-full rounded-xl border border-black/10 bg-background px-4 py-3 font-mono text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald"
        />
        <p className="mt-1 text-xs text-text-secondary">
          Array of {`{skater_name, country, discipline, world_ranking, price}`}
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isPending || !selectedEvent}
        className="w-full rounded-xl bg-emerald px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
      >
        {isPending ? "Importing..." : "Import Entries"}
      </button>

      <DetailLog details={result?.details} />
    </div>
  );
}

// ---------- Import Results ----------

function ImportResultsForm() {
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string[];
  } | null>(null);

  useEffect(() => {
    fetchEvents().then((res) => {
      if (res.success) setEvents(res.events);
    });
  }, []);

  function handleSubmit() {
    if (!selectedEvent || !jsonText.trim()) return;
    startTransition(async () => {
      const res = await importResults(selectedEvent, jsonText);
      if (res.success) {
        setResult({
          success: true,
          message: res.summary!,
          details: res.details,
        });
      } else {
        setResult({ success: false, message: res.error ?? "Unknown error" });
      }
    });
  }

  const sampleJson = `[
  {
    "skater_name": "Ilia Malinin",
    "placement": 1,
    "sp_placement": 1,
    "total_score": 310.50,
    "falls": 0,
    "is_personal_best": true,
    "is_withdrawal": false
  }
]`;

  return (
    <div className="space-y-5">
      <StatusMessage result={result} />

      <EventSelector
        events={events}
        value={selectedEvent}
        onChange={setSelectedEvent}
      />

      <div>
        <label className="mb-1 block text-sm font-medium">
          Results (JSON)
        </label>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={12}
          placeholder={sampleJson}
          className="w-full rounded-xl border border-black/10 bg-background px-4 py-3 font-mono text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald"
        />
        <p className="mt-1 text-xs text-text-secondary">
          Array of{" "}
          {`{skater_name, placement, sp_placement, total_score, falls, is_personal_best, is_withdrawal}`}
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isPending || !selectedEvent}
        className="w-full rounded-xl bg-emerald px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
      >
        {isPending ? "Importing..." : "Import Results"}
      </button>

      <DetailLog details={result?.details} />
    </div>
  );
}

// ---------- Shared components ----------

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  step,
  helpText,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
  helpText?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        step={step}
        className="w-full rounded-xl border border-black/10 bg-background px-4 py-3 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald"
      />
      {helpText && (
        <p className="mt-1 text-xs text-text-secondary">{helpText}</p>
      )}
    </div>
  );
}

function EventSelector({
  events,
  value,
  onChange,
}: {
  events: EventOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">Event</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  );
}

function StatusMessage({
  result,
}: {
  result: { success: boolean; message: string } | null;
}) {
  if (!result) return null;
  return (
    <div
      className={`rounded-lg p-3 text-sm border ${
        result.success
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200"
      }`}
    >
      {result.message}
    </div>
  );
}

function DetailLog({ details }: { details?: string[] }) {
  if (!details || details.length === 0) return null;
  return (
    <div className="rounded-xl bg-black/5 p-4">
      <p className="text-xs font-medium mb-2">Import Log</p>
      <div className="max-h-48 overflow-auto space-y-0.5">
        {details.map((line, i) => (
          <p key={i} className="font-mono text-xs text-text-secondary">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
