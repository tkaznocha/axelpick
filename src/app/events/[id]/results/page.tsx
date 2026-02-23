import { createServerSupabaseClient, getAuthUser, getDisplayName } from "@/lib/supabase-server";
import { redirect, notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import TrackEvent from "@/components/TrackEvent";

const placementMap: Record<number, number> = {
  1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
  6: 8, 7: 6, 8: 4, 9: 2, 10: 1,
};
const spBonusMap: Record<number, number> = { 1: 5, 2: 3, 3: 1 };

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default async function ResultsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabaseClient();

  const user = await getAuthUser();
  if (!user) redirect("/login");

  // Run all data queries in parallel
  const [{ data: event }, { data: results }, { data: userPicks }, { data: avatarRow }] = await Promise.all([
    supabase.from("events").select("*").eq("id", params.id).single(),
    supabase
      .from("results")
      .select("*, skaters(id, name, country, discipline)")
      .eq("event_id", params.id)
      .order("final_placement", { ascending: true }),
    supabase
      .from("user_picks")
      .select("skater_id, points_earned")
      .eq("user_id", user.id)
      .eq("event_id", params.id),
    supabase
      .from("users")
      .select("avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  if (!event) notFound();

  const pickedIds = new Set((userPicks ?? []).map((p) => p.skater_id));
  const userTotal = (userPicks ?? []).reduce(
    (sum, p) => sum + (p.points_earned ?? 0),
    0
  );

  interface ResultRow {
    id: string;
    skater_id: string;
    final_placement: number | null;
    sp_placement: number | null;
    total_score: number | null;
    sp_score: number | null;
    fs_score: number | null;
    falls: number;
    is_personal_best: boolean;
    is_withdrawal: boolean;
    fantasy_points_raw: number;
    fantasy_points_final: number;
    skater: {
      id: string;
      name: string;
      country: string;
      discipline: string;
    };
  }

  const resultList: ResultRow[] = (results ?? []).map(
    (r: Record<string, unknown>) => {
      const skater = r.skaters as ResultRow["skater"];
      return { ...r, skater } as ResultRow;
    }
  );

  const startStr = new Date(event.start_date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const endStr = new Date(event.end_date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const displayName = getDisplayName(user);

  return (
    <AppShell displayName={displayName} avatarUrl={avatarRow?.avatar_url ?? null}>
    <main className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto">
      <TrackEvent name="results_viewed" data={{ event_id: params.id }} />

      {/* Event header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">{event.name}</h1>
        <p className="mt-1 text-text-secondary">
          {event.location} &middot; {startStr} – {endStr}
        </p>
      </div>

      {/* User's total points */}
      {pickedIds.size > 0 && (
        <div className="mb-8 rounded-2xl aurora-gradient p-px">
          <div className="rounded-2xl bg-card p-6">
            <p className="text-sm text-text-secondary">Your Points This Event</p>
            <p className="font-display text-4xl font-bold mt-1">{userTotal}</p>
            <p className="text-xs text-text-secondary mt-1">
              {event.points_multiplier}× multiplier applied &middot;{" "}
              {pickedIds.size} skater{pickedIds.size !== 1 ? "s" : ""} picked
            </p>
          </div>
        </div>
      )}

      {/* Results table */}
      {resultList.length > 0 ? (
        <div className="space-y-3">
          {resultList.map((r) => {
            const isPicked = pickedIds.has(r.skater?.id);
            const placement = r.final_placement;
            const spPlacement = r.sp_placement;
            const falls = r.falls ?? 0;
            const isPB = r.is_personal_best;
            const isWD = r.is_withdrawal;

            // Build points breakdown
            const breakdown: string[] = [];
            if (placement && placementMap[placement]) {
              breakdown.push(`${ordinal(placement)}: +${placementMap[placement]}`);
            }
            if (spPlacement && spBonusMap[spPlacement]) {
              breakdown.push(`SP ${ordinal(spPlacement)}: +${spBonusMap[spPlacement]}`);
            }
            if (falls === 0) {
              breakdown.push("Clean: +3");
            }
            if (isPB) {
              breakdown.push("PB: +5");
            }
            if (falls > 0) {
              breakdown.push(`Falls(${falls}): −${falls * 2}`);
            }
            if (isWD) {
              breakdown.push("WD: −10");
            }

            return (
              <div
                key={r.id}
                className={`rounded-xl p-4 shadow-sm border transition-all ${
                  isPicked
                    ? "border-emerald bg-emerald-50 ring-1 ring-emerald"
                    : "border-black/5 bg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Placement */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
                    <span
                      className={`font-mono font-bold text-sm ${
                        placement === 1
                          ? "text-amber-500"
                          : placement === 2
                            ? "text-gray-400"
                            : placement === 3
                              ? "text-amber-700"
                              : "text-text-secondary"
                      }`}
                    >
                      {placement ?? "—"}
                    </span>
                  </div>

                  {/* Skater info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-secondary">{r.skater?.name?.charAt(0)?.toUpperCase() ?? "?"}</span>
                      <span className="font-display font-semibold truncate">
                        {r.skater?.name}
                      </span>
                      {isPicked && (
                        <span className="flex-shrink-0 text-xs text-emerald-700 font-medium">
                          PICKED
                        </span>
                      )}
                    </div>

                    {/* Scores */}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-text-secondary">
                      {r.total_score != null && (
                        <span>
                          Total: <span className="font-mono">{r.total_score.toFixed(2)}</span>
                        </span>
                      )}
                      {r.sp_score != null && (
                        <span>
                          SP: <span className="font-mono">{r.sp_score.toFixed(2)}</span>
                        </span>
                      )}
                      {r.fs_score != null && (
                        <span>
                          FS: <span className="font-mono">{r.fs_score.toFixed(2)}</span>
                        </span>
                      )}
                    </div>

                    {/* Points breakdown */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {breakdown.map((b, i) => (
                        <span
                          key={i}
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            b.includes("−")
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Fantasy points */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-lg font-bold">
                      {r.fantasy_points_final}
                    </p>
                    <p className="text-xs text-text-secondary">
                      raw {r.fantasy_points_raw}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-card p-8 text-center border border-black/5">
          <p className="text-text-secondary">
            Results haven&apos;t been published yet. Check back after the competition!
          </p>
        </div>
      )}
    </main>
    </AppShell>
  );
}
