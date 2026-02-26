// Apply world rankings from ranked_skaters.json and reprice accordingly.
// Run with: node --env-file=.env.local scripts/apply-rankings.mjs [--apply]

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dryRun = !process.argv.includes("--apply");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getInitialPrice(worldRanking) {
  if (!worldRanking || worldRanking < 1) return 3_000_000;
  if (worldRanking <= 5)  return 15_000_000 - (worldRanking - 1) * 750_000;
  if (worldRanking <= 15) return 12_000_000 - (worldRanking - 6) * 400_000;
  if (worldRanking <= 30) return 8_000_000  - (worldRanking - 16) * 200_000;
  return Math.max(2_000_000, 5_000_000 - (worldRanking - 31) * 100_000);
}

async function main() {
  if (dryRun) console.log("=== DRY RUN (pass --apply to commit changes) ===\n");

  const ranked = JSON.parse(
    readFileSync(resolve(__dirname, "ranked_skaters.json"), "utf-8")
  );

  const { data: event } = await supabase
    .from("events")
    .select("id, name")
    .eq("event_type", "worlds")
    .eq("status", "upcoming")
    .single();

  console.log(`Event: ${event.name}\n`);

  let updated = 0, errors = 0;

  for (const entry of ranked) {
    const newPrice = getInitialPrice(entry.world_ranking);

    // Find skater
    const { data: skater } = await supabase
      .from("skaters")
      .select("id, current_price, world_ranking")
      .eq("name", entry.name)
      .eq("discipline", entry.discipline)
      .single();

    if (!skater) {
      console.log(`  NOT FOUND: ${entry.name} (${entry.discipline})`);
      errors++;
      continue;
    }

    console.log(
      `  ${entry.name}: rank null → ${entry.world_ranking}, ` +
      `$${(skater.current_price / 1e6).toFixed(1)}M → $${(newPrice / 1e6).toFixed(1)}M`
    );

    if (!dryRun) {
      await supabase
        .from("skaters")
        .update({ world_ranking: entry.world_ranking, current_price: newPrice })
        .eq("id", skater.id);

      await supabase
        .from("event_entries")
        .update({ price_at_event: newPrice })
        .eq("skater_id", skater.id)
        .eq("event_id", event.id);
    }
    updated++;
  }

  console.log(`\n--- Summary ---`);
  console.log(`Updated: ${updated}`);
  if (errors) console.log(`Not found: ${errors}`);
  if (dryRun && updated > 0) console.log(`\nRun with --apply to commit.`);
}

main().catch(console.error);
