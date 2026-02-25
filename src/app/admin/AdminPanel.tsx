"use client";

import { useState } from "react";
import { EventsTab } from "./components/EventsTab";
import { EntriesTab } from "./components/EntriesTab";
import { ResultsTab } from "./components/ResultsTab";
import { SkatersTab } from "./components/SkatersTab";
import { WithdrawalsTab } from "./components/WithdrawalsTab";
import { FactsTab } from "./components/FactsTab";

type Tab = "events" | "entries" | "results" | "skaters" | "withdrawals" | "facts";

export function AdminPanel() {
  const [tab, setTab] = useState<Tab>("events");

  return (
    <main className="min-h-screen p-6 md:p-8 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-2">Admin Panel</h1>
      <p className="text-text-secondary mb-8">
        Manage events, entries, results, skaters, and withdrawals.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 rounded-xl bg-black/5 p-1">
        {([
          ["events", "Events"],
          ["entries", "Entries"],
          ["results", "Results"],
          ["skaters", "Skaters"],
          ["withdrawals", "Withdrawals"],
          ["facts", "Facts"],
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

      {tab === "events" && <EventsTab />}
      {tab === "entries" && <EntriesTab />}
      {tab === "results" && <ResultsTab />}
      {tab === "skaters" && <SkatersTab />}
      {tab === "withdrawals" && <WithdrawalsTab />}
      {tab === "facts" && <FactsTab />}
    </main>
  );
}
