import type { Metadata } from "next";
import { getAuthUser, getDisplayName } from "@/lib/supabase-server";
import AppShell from "@/components/AppShell";
import TrackEvent from "@/components/TrackEvent";

export const metadata: Metadata = { title: "How to Play" };

export default async function HowToPlayPage() {
  const user = await getAuthUser();
  const displayName = user ? getDisplayName(user) : "Skater";

  return (
    <AppShell displayName={displayName}>
    <main className="min-h-screen p-6 md:p-8 max-w-3xl mx-auto">
      <TrackEvent name="how_to_play_viewed" />

      <h1 className="font-display text-4xl font-bold mb-3">How to Play</h1>
      <p className="text-lg text-text-secondary mb-12 max-w-xl">
        Pick your skaters from the entry list and stay within budget. Points are
        based on placement, with bonuses for clean skates and personal bests.
        Bigger events = more picks and bigger points.
      </p>

      {/* ===== Event Tiers ===== */}
      <Section label="Event Tiers" title="Three levels of competition">
        <div className="grid gap-4 sm:grid-cols-3">
          <TierCard
            tier="Grand Prix"
            picks={4}
            budget="$30M"
            multiplier="1"
            color="emerald"
          />
          <TierCard
            tier="Championships"
            subtitle="4CC / Europeans"
            picks={6}
            budget="$50M"
            multiplier="1.5"
            color="sky"
          />
          <TierCard
            tier="Worlds"
            picks={8}
            budget="$70M"
            multiplier="2"
            color="lavender"
          />
        </div>
        <ul className="mt-6 space-y-2 text-sm text-text-secondary">
          <li>
            <strong className="text-text-primary">No discipline restrictions</strong>{" "}
            — pick any skater (Men, Women, Pairs, Ice Dance)
          </li>
          <li>
            <strong className="text-text-primary">Picks lock</strong> when the
            first discipline&apos;s Short Program starts
          </li>
          <li>
            <strong className="text-text-primary">Fresh picks each event</strong>{" "}
            — no season-long roster
          </li>
        </ul>
      </Section>

      {/* ===== Scoring ===== */}
      <Section label="Scoring" title="How points are earned">
        {/* Placement */}
        <h3 className="font-display font-semibold mb-3">Placement Points</h3>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-8">
          {[
            [1, 25],
            [2, 18],
            [3, 15],
            [4, 12],
            [5, 10],
            [6, 8],
            [7, 6],
            [8, 4],
            [9, 2],
            [10, 1],
          ].map(([place, pts]) => (
            <div
              key={place}
              className={`text-center rounded-xl p-3 border border-black/5 ${
                place === 1
                  ? "bg-amber-50"
                  : place === 2
                    ? "bg-gray-50"
                    : place === 3
                      ? "bg-orange-50"
                      : "bg-card"
              }`}
            >
              <p className="font-mono text-xs text-text-secondary">
                {ordinal(place as number)}
              </p>
              <p className="font-mono font-bold text-lg">{pts}</p>
            </div>
          ))}
        </div>

        {/* Bonuses */}
        <h3 className="font-display font-semibold mb-3">Bonuses</h3>
        <div className="grid gap-3 sm:grid-cols-3 mb-8">
          <BonusCard
            label="SP Top 3"
            detail="1st: +5 / 2nd: +3 / 3rd: +1"
            positive
          />
          <BonusCard
            label="Clean Skate"
            detail="0 falls in the event: +3"
            positive
          />
          <BonusCard
            label="Personal Best"
            detail="Beat their PB score: +5"
            positive
          />
        </div>

        {/* Penalties */}
        <h3 className="font-display font-semibold mb-3">Penalties</h3>
        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          <BonusCard label="Fall" detail="-2 per fall" positive={false} />
          <BonusCard
            label="Withdrawal"
            detail="Withdraw after SP: -10"
            positive={false}
          />
        </div>

        <p className="text-sm text-text-secondary mt-4">
          Final points = raw points &times; event multiplier (1&times;, 1.5&times;,
          or 2&times;)
        </p>
      </Section>

      {/* ===== Skater Pricing ===== */}
      <Section label="Budget" title="Skater pricing">
        <p className="text-sm text-text-secondary mb-6">
          Each skater has a price based on their ISU World Standings rank.
          Pairs and ice dance couples are priced as one unit. Price floor is $2M,
          ceiling is $18M.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <PriceCard rank="#1 – #5" price="$12M – $15M" label="Elite tier" />
          <PriceCard rank="#6 – #15" price="$8M – $12M" label="Contenders" />
          <PriceCard rank="#16 – #30" price="$5M – $8M" label="Mid-range" />
          <PriceCard rank="#31+" price="$2M – $5M" label="Sleepers" />
        </div>
        <p className="text-sm text-text-secondary mt-6">
          After each event, prices shift based on performance: exceeded
          expectations &rarr; +$1–3M, met expectations &rarr; no change,
          underperformed &rarr; -$1–3M.
        </p>
      </Section>

      {/* ===== Leaderboards ===== */}
      <Section label="Competition" title="Leaderboards">
        <div className="grid gap-4 sm:grid-cols-3">
          <LeaderboardCard
            title="Global"
            desc="Cumulative season leaderboard — compete against every player worldwide"
          />
          <LeaderboardCard
            title="Private Leagues"
            desc="Create or join leagues with an invite code — compete with friends"
          />
          <LeaderboardCard
            title="Per-Event"
            desc="See who scored the most at each individual competition"
          />
        </div>
      </Section>

    </main>
    </AppShell>
  );
}

/* ===== Helper Components ===== */

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <p className="font-mono text-[10px] font-medium tracking-widest uppercase text-text-secondary mb-2">
        {label}
      </p>
      <h2 className="font-display text-2xl font-bold mb-6">{title}</h2>
      {children}
    </section>
  );
}

function TierCard({
  tier,
  subtitle,
  picks,
  budget,
  multiplier,
  color,
}: {
  tier: string;
  subtitle?: string;
  picks: number;
  budget: string;
  multiplier: string;
  color: "emerald" | "sky" | "lavender";
}) {
  const bgMap = {
    emerald: "bg-emerald-50 border-emerald/20",
    sky: "bg-sky-50 border-sky/20",
    lavender: "bg-lavender-50 border-lavender/20",
  };
  const textMap = {
    emerald: "text-emerald-700",
    sky: "text-sky-700",
    lavender: "text-lavender-700",
  };

  return (
    <div className={`rounded-xl p-5 border ${bgMap[color]}`}>
      <p className={`font-display font-semibold ${textMap[color]}`}>{tier}</p>
      {subtitle && (
        <p className="text-xs text-text-secondary">{subtitle}</p>
      )}
      <div className="mt-4 space-y-1.5">
        <Stat label="Picks" value={String(picks)} />
        <Stat label="Budget" value={budget} />
        <Stat label="Multiplier" value={`${multiplier}\u00D7`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}

function BonusCard({
  label,
  detail,
  positive,
}: {
  label: string;
  detail: string;
  positive: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        positive
          ? "bg-emerald-50 border-emerald/20"
          : "bg-red-50 border-red-200"
      }`}
    >
      <p
        className={`font-display font-semibold text-sm ${
          positive ? "text-emerald-700" : "text-red-700"
        }`}
      >
        {label}
      </p>
      <p className="text-xs text-text-secondary mt-1">{detail}</p>
    </div>
  );
}

function PriceCard({
  rank,
  price,
  label,
}: {
  rank: string;
  price: string;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-card p-4 border border-black/5">
      <div className="flex items-center justify-between">
        <span className="font-mono font-semibold text-sm">{rank}</span>
        <span className="font-mono text-sm text-emerald">{price}</span>
      </div>
      <p className="text-xs text-text-secondary mt-1">{label}</p>
    </div>
  );
}

function LeaderboardCard({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl bg-card p-5 border border-black/5">
      <p className="font-display font-semibold mb-2">{title}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
