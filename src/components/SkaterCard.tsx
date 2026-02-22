"use client";

export interface SkaterEntry {
  skater_id: string;
  price_at_event: number;
  is_withdrawn?: boolean;
  skater: {
    id: string;
    name: string;
    country: string;
    discipline: string;
    world_ranking: number | null;
    photo_url: string | null;
    season_best_score: number | null;
    personal_best_score: number | null;
  };
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

// Simple country code → flag emoji (expects 2-3 letter ISO codes)
function countryFlag(code: string): string {
  const upper = code.toUpperCase().slice(0, 2);
  if (upper.length !== 2) return code;
  return String.fromCodePoint(
    ...upper.split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export default function SkaterCard({
  entry,
  isPicked,
  onToggle,
  disabled,
  isWithdrawn,
}: {
  entry: SkaterEntry;
  isPicked: boolean;
  onToggle: () => void;
  disabled: boolean;
  isWithdrawn?: boolean;
}) {
  const { skater, price_at_event } = entry;
  const priceM = (price_at_event / 1_000_000).toFixed(1);

  if (isWithdrawn) {
    return (
      <div className="w-full text-left rounded-xl p-4 shadow-sm border border-red-200 bg-red-50/50 opacity-60 cursor-not-allowed">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 flex-shrink-0 rounded-full bg-black/5 flex items-center justify-center text-lg">
            {countryFlag(skater.country)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold truncate line-through text-text-secondary">
                {skater.name}
              </span>
              <span className="flex-shrink-0 rounded-full bg-red-200 px-2 py-0.5 text-xs font-medium text-red-800">
                WITHDRAWN
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onToggle}
      disabled={disabled && !isPicked}
      className={`w-full text-left rounded-xl p-4 shadow-sm border transition-all ${
        isPicked
          ? "border-emerald bg-emerald-50 ring-1 ring-emerald"
          : "border-black/5 bg-card hover:border-black/10 hover:shadow-md"
      } ${disabled && !isPicked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="flex items-center gap-3">
        {/* Photo placeholder */}
        <div className="h-12 w-12 flex-shrink-0 rounded-full bg-black/5 flex items-center justify-center text-lg">
          {countryFlag(skater.country)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold truncate">
              {skater.name}
            </span>
            {isPicked && (
              <span className="flex-shrink-0 text-xs text-emerald-700 font-medium">
                PICKED
              </span>
            )}
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
          {(skater.season_best_score || skater.personal_best_score) && (
            <div className="flex items-center gap-2 mt-0.5">
              {skater.season_best_score && (
                <span className="text-xs text-text-secondary">
                  SB: <span className="font-mono font-medium text-text-primary">{skater.season_best_score.toFixed(2)}</span>
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

        {/* Price */}
        <div className="text-right flex-shrink-0">
          <p className="font-mono font-semibold text-sm">${priceM}M</p>
        </div>
      </div>
    </button>
  );
}
