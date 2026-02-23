"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Skater {
  id: string;
  name: string;
  country: string;
  discipline: string;
  world_ranking: number | null;
  current_price: number;
  season_best_score: number | null;
  personal_best_score: number | null;
  season_best_sp: number | null;
  season_best_fs: number | null;
  is_active: boolean;
}

const disciplineColors: Record<string, string> = {
  men: "bg-sky-50 text-sky-700",
  women: "bg-lavender-50 text-lavender-700",
  pairs: "bg-emerald-50 text-emerald-700",
  ice_dance: "bg-amber-50 text-amber-700",
};

const disciplineLabels: Record<string, string> = {
  men: "Men",
  women: "Women",
  pairs: "Pairs",
  ice_dance: "Dance",
};

const disciplines = [
  { key: "all", label: "All" },
  { key: "men", label: "Men" },
  { key: "women", label: "Women" },
  { key: "pairs", label: "Pairs" },
  { key: "ice_dance", label: "Dance" },
];

type SortKey = "ranking" | "price_desc" | "price_asc" | "name";

export default function SkaterList({ skaters }: { skaters: Skater[] }) {
  const [discipline, setDiscipline] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("ranking");

  const filtered = useMemo(() => {
    let list = skaters;

    if (discipline !== "all") {
      list = list.filter((s) => s.discipline === discipline);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case "ranking":
        list = [...list].sort((a, b) => {
          if (a.world_ranking == null && b.world_ranking == null) return 0;
          if (a.world_ranking == null) return 1;
          if (b.world_ranking == null) return -1;
          return a.world_ranking - b.world_ranking;
        });
        break;
      case "price_desc":
        list = [...list].sort((a, b) => b.current_price - a.current_price);
        break;
      case "price_asc":
        list = [...list].sort((a, b) => a.current_price - b.current_price);
        break;
      case "name":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return list;
  }, [skaters, discipline, search, sort]);

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Discipline tabs */}
        <div className="flex gap-1.5">
          {disciplines.map((d) => (
            <button
              key={d.key}
              onClick={() => setDiscipline(d.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                discipline === d.key
                  ? "bg-sky text-white"
                  : "bg-black/5 text-text-secondary hover:bg-black/10"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or country..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] rounded-lg border border-black/10 bg-card px-3 py-1.5 text-sm placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-sky/30"
        />

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-lg border border-black/10 bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky/30"
        >
          <option value="ranking">Ranking</option>
          <option value="price_desc">Price (high → low)</option>
          <option value="price_asc">Price (low → high)</option>
          <option value="name">Name (A → Z)</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-text-secondary mb-3">
        Showing {filtered.length} of {skaters.length} skaters
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-card p-10 text-center border border-black/5">
          <p className="text-text-secondary">No skaters match your search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((skater) => {
            const priceM = (skater.current_price / 1_000_000).toFixed(1);
            const seasonBest =
              skater.season_best_score ??
              (skater.season_best_sp != null && skater.season_best_fs != null
                ? Number(skater.season_best_sp) + Number(skater.season_best_fs)
                : null);
            return (
              <Link
                key={skater.id}
                href={`/skaters/${skater.id}`}
                prefetch={false}
                className="block w-full rounded-xl p-4 shadow-sm border border-black/5 bg-card hover:border-black/10 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 rounded-full bg-black/5 flex items-center justify-center text-sm font-semibold text-text-secondary">
                    {skater.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold truncate">
                        {skater.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-secondary">
                        {skater.country}
                      </span>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          disciplineColors[skater.discipline] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {disciplineLabels[skater.discipline] ?? skater.discipline}
                      </span>
                      {skater.world_ranking && (
                        <span className="text-xs text-text-secondary">
                          #{skater.world_ranking}
                        </span>
                      )}
                    </div>
                    {(seasonBest || skater.personal_best_score) && (
                      <div className="flex items-center gap-2 mt-0.5">
                        {seasonBest != null && (
                          <span className="text-xs text-text-secondary">
                            SB: <span className="font-mono font-medium text-text-primary">{seasonBest.toFixed(2)}</span>
                          </span>
                        )}
                        {skater.personal_best_score && (
                          <span className="text-xs text-text-secondary">
                            PB: <span className="font-mono font-medium text-text-primary">{skater.personal_best_score.toFixed(2)}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono font-semibold text-sm">${priceM}M</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
