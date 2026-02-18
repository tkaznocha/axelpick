"use client";

import { useMemo, useState, useTransition } from "react";
import SkaterCard, { type SkaterEntry } from "@/components/SkaterCard";
import BudgetBar from "@/components/BudgetBar";
import { lockPicks } from "./actions";

type SortKey = "price_desc" | "price_asc" | "ranking" | "name";

interface PickFlowProps {
  eventId: string;
  picksLimit: number;
  budget: number;
  entries: SkaterEntry[];
  initialPicks: string[]; // skater IDs already picked
  isLocked: boolean; // event is past lock time or completed
}

export default function PickFlow({
  eventId,
  picksLimit,
  budget,
  entries,
  initialPicks,
  isLocked: initialLocked,
}: PickFlowProps) {
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(initialPicks)
  );
  const [isLocked, setIsLocked] = useState(
    initialLocked || initialPicks.length > 0
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Filters
  const [discipline, setDiscipline] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("ranking");
  const [search, setSearch] = useState("");

  // Derived
  const budgetSpent = useMemo(() => {
    return entries
      .filter((e) => picked.has(e.skater_id))
      .reduce((sum, e) => sum + e.price_at_event, 0);
  }, [entries, picked]);

  const disciplines = useMemo(() => {
    const set = new Set(entries.map((e) => e.skater.discipline));
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let list = entries;

    if (discipline !== "all") {
      list = list.filter((e) => e.skater.discipline === discipline);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.skater.name.toLowerCase().includes(q) ||
          e.skater.country.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "price_desc":
          return b.price_at_event - a.price_at_event;
        case "price_asc":
          return a.price_at_event - b.price_at_event;
        case "ranking":
          return (
            (a.skater.world_ranking ?? 999) - (b.skater.world_ranking ?? 999)
          );
        case "name":
          return a.skater.name.localeCompare(b.skater.name);
        default:
          return 0;
      }
    });

    return list;
  }, [entries, discipline, sort, search]);

  function togglePick(skaterId: string) {
    if (isLocked) return;
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(skaterId)) {
        next.delete(skaterId);
      } else if (next.size < picksLimit) {
        next.add(skaterId);
      }
      return next;
    });
    setError(null);
    setSuccess(false);
  }

  function handleLock() {
    startTransition(async () => {
      const skaterIds = Array.from(picked);
      const res = await lockPicks(eventId, skaterIds);
      if (res.success) {
        setIsLocked(true);
        setSuccess(true);
        setError(null);
      } else {
        setError(res.error ?? "Failed to lock picks");
      }
    });
  }

  const atLimit = picked.size >= picksLimit;

  return (
    <div className="pb-24">
      {/* Status messages */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200">
          Your picks are locked! Good luck!
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Search skaters..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-black/10 bg-background px-4 py-2.5 text-sm outline-none focus:border-emerald focus:ring-1 focus:ring-emerald flex-1 min-w-[180px]"
        />

        {/* Discipline filter */}
        <div className="flex gap-1 rounded-xl bg-black/5 p-1">
          <FilterChip
            active={discipline === "all"}
            onClick={() => setDiscipline("all")}
          >
            All
          </FilterChip>
          {disciplines.map((d) => (
            <FilterChip
              key={d}
              active={discipline === d}
              onClick={() => setDiscipline(d)}
            >
              {d === "ice_dance" ? "Dance" : d.charAt(0).toUpperCase() + d.slice(1)}
            </FilterChip>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-black/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-emerald"
        >
          <option value="ranking">By Ranking</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {/* Count */}
      <p className="mb-3 text-sm text-text-secondary">
        {filtered.length} skater{filtered.length !== 1 ? "s" : ""}
        {discipline !== "all" ? ` in ${discipline === "ice_dance" ? "ice dance" : discipline}` : ""}
      </p>

      {/* Entry list */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((entry) => (
          <SkaterCard
            key={entry.skater_id}
            entry={entry}
            isPicked={picked.has(entry.skater_id)}
            onToggle={() => togglePick(entry.skater_id)}
            disabled={isLocked || (atLimit && !picked.has(entry.skater_id))}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl bg-card p-8 text-center border border-black/5">
          <p className="text-text-secondary">No skaters match your filters.</p>
        </div>
      )}

      {/* Sticky budget bar */}
      <BudgetBar
        picksUsed={picked.size}
        picksLimit={picksLimit}
        budgetSpent={budgetSpent}
        budgetTotal={budget}
        onLock={handleLock}
        isLocking={isPending}
        isLocked={isLocked}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-card text-text-primary shadow-sm"
          : "text-text-secondary hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
