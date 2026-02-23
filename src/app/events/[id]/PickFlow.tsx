"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { track } from "@vercel/analytics";
import SkaterCard, { type SkaterEntry } from "@/components/SkaterCard";
import BudgetBar from "@/components/BudgetBar";
import { addPick, removePick, replaceWithdrawnPick } from "./actions";

type SortKey = "price_desc" | "price_asc" | "ranking" | "name";

interface PendingReplacement {
  withdrawn_skater_id: string;
  replacement_skater_id: string | null;
}

interface PickFlowProps {
  eventId: string;
  picksLimit: number;
  budget: number;
  entries: SkaterEntry[];
  initialPicks: string[]; // skater IDs already picked
  isLocked: boolean; // event is past lock time or completed
  pendingReplacements: PendingReplacement[];
  replacementDeadline: string | null;
}

export default function PickFlow({
  eventId,
  picksLimit,
  budget,
  entries,
  initialPicks,
  isLocked,
  pendingReplacements,
  replacementDeadline,
}: PickFlowProps) {
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(initialPicks)
  );
  const [isSaving, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Replacement mode state
  const unreplacedWithdrawals = pendingReplacements.filter(
    (r) => r.replacement_skater_id === null
  );
  const inReplacementMode = isLocked && unreplacedWithdrawals.length > 0;
  const [replacementPick, setReplacementPick] = useState<string | null>(null);
  const [replacingFor, setReplacingFor] = useState<string | null>(
    unreplacedWithdrawals[0]?.withdrawn_skater_id ?? null
  );
  const [replacementSuccess, setReplacementSuccess] = useState(false);

  const deadlinePassed = replacementDeadline
    ? new Date(replacementDeadline) <= new Date()
    : false;

  // Filters
  const [discipline, setDiscipline] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("ranking");
  const [search, setSearch] = useState("");

  // Withdrawn skater IDs (for filtering)
  const withdrawnIds = useMemo(
    () => new Set(entries.filter((e) => e.is_withdrawn).map((e) => e.skater_id)),
    [entries]
  );

  // Derived
  const budgetSpent = useMemo(() => {
    let total = entries
      .filter((e) => picked.has(e.skater_id) && !withdrawnIds.has(e.skater_id))
      .reduce((sum, e) => sum + e.price_at_event, 0);
    // Add replacement pick cost if in replacement mode
    if (replacementPick) {
      const rpEntry = entries.find((e) => e.skater_id === replacementPick);
      if (rpEntry) total += rpEntry.price_at_event;
    }
    return total;
  }, [entries, picked, withdrawnIds, replacementPick]);

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

  const togglePick = useCallback(function togglePick(skaterId: string) {
    if (inReplacementMode) {
      // In replacement mode, select/deselect replacement candidate
      setReplacementPick((prev) => (prev === skaterId ? null : skaterId));
      setError(null);
      return;
    }
    if (isLocked) return;

    const isRemoving = picked.has(skaterId);
    const atLimit = picked.size >= picksLimit;

    if (!isRemoving && atLimit) return;

    // Optimistically update
    setPicked((prev) => {
      const next = new Set(prev);
      if (isRemoving) {
        next.delete(skaterId);
      } else {
        next.add(skaterId);
      }
      return next;
    });
    setError(null);

    // Save to server
    startTransition(async () => {
      const res = isRemoving
        ? await removePick(eventId, skaterId)
        : await addPick(eventId, skaterId);

      if (!res.success) {
        // Rollback
        setPicked((prev) => {
          const next = new Set(prev);
          if (isRemoving) {
            next.add(skaterId);
          } else {
            next.delete(skaterId);
          }
          return next;
        });
        setError(res.error ?? "Failed to save pick");
      } else {
        const entry = entries.find((e) => e.skater_id === skaterId);
        const newSize = isRemoving ? picked.size - 1 : picked.size + 1;
        track(isRemoving ? "skater_removed" : "skater_picked", {
          event_id: eventId,
          discipline: entry?.skater.discipline ?? "",
          skater_price: entry?.price_at_event ?? 0,
          picks_count: newSize,
          budget_remaining: budget - budgetSpent,
        });
      }
    });
  }, [inReplacementMode, isLocked, picked, picksLimit, entries, eventId, budget, budgetSpent, startTransition]);

  // Stable per-skater callbacks so SkaterCard memo works
  const toggleCallbacks = useMemo(() => {
    const map = new Map<string, () => void>();
    for (const entry of entries) {
      map.set(entry.skater_id, () => togglePick(entry.skater_id));
    }
    return map;
  }, [entries, togglePick]);

  function handleReplacement() {
    if (!replacingFor || !replacementPick) return;
    startTransition(async () => {
      const res = await replaceWithdrawnPick(
        eventId,
        replacingFor,
        replacementPick
      );
      if (res.success) {
        track("withdrawn_replaced", { event_id: eventId });
        setReplacementSuccess(true);
        setError(null);
        // Update local state
        setPicked((prev) => {
          const next = new Set(prev);
          next.delete(replacingFor!);
          next.add(replacementPick!);
          return next;
        });
        setReplacementPick(null);
        setReplacingFor(null);
      } else {
        setError(res.error ?? "Failed to replace pick");
      }
    });
  }

  const atLimit = picked.size >= picksLimit;

  return (
    <div className="pb-24">
      {/* Withdrawal replacement banner */}
      {inReplacementMode && !deadlinePassed && !replacementSuccess && (
        <div className="mb-4 rounded-lg bg-amber-50 p-4 border border-amber-200">
          <p className="text-sm font-semibold text-amber-800">
            {unreplacedWithdrawals.length} skater{unreplacedWithdrawals.length > 1 ? "s" : ""} in your roster withdrew
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Select a replacement skater below.
            {replacementDeadline && (
              <> Deadline: {new Date(replacementDeadline).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" })}</>
            )}
          </p>
        </div>
      )}
      {inReplacementMode && deadlinePassed && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          The replacement deadline has passed.
        </div>
      )}

      {/* Status messages */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}
      {replacementSuccess && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200">
          Replacement confirmed! Your roster has been updated.
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
        <div className="flex gap-1 rounded-xl bg-black/5 p-1 max-w-full overflow-x-auto scrollbar-hide">
          <FilterChip
            active={discipline === "all"}
            onClick={() => {
              setDiscipline("all");
              track("roster_filter_used", { filter_type: "discipline", value: "all" });
            }}
          >
            All
          </FilterChip>
          {disciplines.map((d) => (
            <FilterChip
              key={d}
              active={discipline === d}
              onClick={() => {
                setDiscipline(d);
                track("roster_filter_used", { filter_type: "discipline", value: d });
              }}
            >
              {d === "ice_dance" ? "Dance" : d.charAt(0).toUpperCase() + d.slice(1)}
            </FilterChip>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => {
            const val = e.target.value as SortKey;
            setSort(val);
            track("roster_filter_used", { filter_type: "sort", value: val });
          }}
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
        {filtered.map((entry) => {
          const isWithdrawn = withdrawnIds.has(entry.skater_id);
          const isReplacementCandidate =
            inReplacementMode && !isWithdrawn && !picked.has(entry.skater_id);
          const isSelectedReplacement = replacementPick === entry.skater_id;

          return (
            <SkaterCard
              key={entry.skater_id}
              entry={entry}
              isPicked={
                isSelectedReplacement
                  ? true
                  : picked.has(entry.skater_id) && !isWithdrawn
              }
              onToggle={toggleCallbacks.get(entry.skater_id)!}
              disabled={
                isWithdrawn ||
                (inReplacementMode
                  ? deadlinePassed || (!isReplacementCandidate && !isSelectedReplacement)
                  : isLocked || (atLimit && !picked.has(entry.skater_id)))
              }
              isWithdrawn={isWithdrawn}
            />
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl bg-card p-8 text-center border border-black/5">
          <p className="text-text-secondary">No skaters match your filters.</p>
        </div>
      )}

      {/* Sticky budget bar */}
      <BudgetBar
        picksUsed={inReplacementMode ? picksLimit - unreplacedWithdrawals.length + (replacementPick ? 1 : 0) : picked.size}
        picksLimit={picksLimit}
        budgetSpent={budgetSpent}
        budgetTotal={budget}
        isSaving={isSaving}
        lastSaveError={error}
      >
        {/* Replacement button rendered here when in replacement mode */}
        {inReplacementMode && !deadlinePassed && !replacementSuccess && (
          <button
            onClick={handleReplacement}
            disabled={!replacementPick || isSaving}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              replacementPick
                ? "aurora-gradient hover:shadow-lg hover:shadow-emerald/20"
                : "bg-gray-300"
            }`}
          >
            {isSaving ? "Replacing..." : "Confirm Replacement"}
          </button>
        )}
      </BudgetBar>
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
      className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-card text-text-primary shadow-sm"
          : "text-text-secondary hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}
