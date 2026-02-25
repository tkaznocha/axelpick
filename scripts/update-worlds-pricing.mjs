// Update pricing for newly added Worlds skaters using the granular formula.
// Skips skaters that have GP price_history records (their prices already reflect performance).
// Run with: node --env-file=.env.local scripts/update-worlds-pricing.mjs [--apply]

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const dryRun = !process.argv.includes("--apply");

function getInitialPrice(worldRanking) {
  if (!worldRanking || worldRanking < 1) return 3_000_000;
  if (worldRanking <= 5) return 15_000_000 - (worldRanking - 1) * 750_000;
  if (worldRanking <= 15) return 12_000_000 - (worldRanking - 6) * 400_000;
  if (worldRanking <= 30) return 8_000_000 - (worldRanking - 16) * 200_000;
  return Math.max(2_000_000, 5_000_000 - (worldRanking - 31) * 100_000);
}

async function main() {
  if (dryRun) console.log("=== DRY RUN (pass --apply to commit changes) ===\n");

  // 1. Find the Worlds event
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, name")
    .eq("event_type", "worlds")
    .eq("status", "upcoming")
    .single();

  if (eventErr || !event) {
    console.error("Could not find upcoming Worlds event:", eventErr?.message);
    process.exit(1);
  }
  console.log(`Event: ${event.name} (${event.id})\n`);

  // 2. Get all entries with skater info
  const { data: entries } = await supabase
    .from("event_entries")
    .select("id, skater_id, price_at_event, skaters(id, name, discipline, world_ranking, current_price)")
    .eq("event_id", event.id);

  // 3. Get skater IDs that have price_history (GP-adjusted)
  const { data: historyRows } = await supabase
    .from("price_history")
    .select("skater_id");

  const gpAdjusted = new Set((historyRows ?? []).map((r) => r.skater_id));

  let updated = 0;
  let skipped = 0;
  let unchanged = 0;

  for (const entry of entries) {
    const s = entry.skaters;
    const newPrice = getInitialPrice(s.world_ranking);

    if (gpAdjusted.has(s.id)) {
      console.log(`  SKIP (GP adjusted) ${s.name} — keeping $${(s.current_price / 1e6).toFixed(1)}M`);
      skipped++;
      continue;
    }

    if (s.current_price === newPrice && entry.price_at_event === newPrice) {
      unchanged++;
      continue;
    }

    const oldPrice = s.current_price;
    console.log(
      `  UPDATE ${s.name} (rank ${s.world_ranking ?? "—"}): ` +
      `$${(oldPrice / 1e6).toFixed(1)}M → $${(newPrice / 1e6).toFixed(1)}M`
    );

    if (!dryRun) {
      await supabase
        .from("skaters")
        .update({ current_price: newPrice })
        .eq("id", s.id);

      await supabase
        .from("event_entries")
        .update({ price_at_event: newPrice })
        .eq("id", entry.id);
    }
    updated++;
  }

  console.log(`\n--- Summary ---`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (GP adjusted): ${skipped}`);
  console.log(`Already correct: ${unchanged}`);
  console.log(`Total entries: ${entries.length}`);
  if (dryRun && updated > 0) console.log(`\nRun with --apply to commit these changes.`);
}

main().catch(console.error);
