// Apply GP season pricing adjustments to skater current_price
// Formula:
//   GP Series: 1st +$1M, 2nd +$750K, 3rd +$500K, 4-6 $0, 7-9 -$250K, 10+ -$500K
//   GP Final:  1st +$2M, 2nd +$1.5M, 3rd +$1M, 4th +$500K, 5th $0, 6th -$500K
//   WD: -$500K
//   Bounds: $2M floor, $18M ceiling

// Run with: node --env-file=.env.local scripts/apply-gp-pricing.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FLOOR = 2_000_000;
const CEILING = 18_000_000;

function gpSeriesAdj(placement) {
  if (placement === -1) return -500_000; // WD
  if (placement === 1) return 1_000_000;
  if (placement === 2) return 750_000;
  if (placement === 3) return 500_000;
  if (placement <= 6) return 0;
  if (placement <= 9) return -250_000;
  return -500_000; // 10+
}

function gpFinalAdj(placement) {
  if (placement === 1) return 2_000_000;
  if (placement === 2) return 1_500_000;
  if (placement === 3) return 1_000_000;
  if (placement === 4) return 500_000;
  if (placement === 5) return 0;
  return -500_000; // 6th
}

function calcNewPrice(skater) {
  let delta = 0;
  for (const r of skater.results) {
    if (r.event === "GP Final") {
      delta += gpFinalAdj(r.placement);
    } else {
      delta += gpSeriesAdj(r.placement);
    }
  }
  const raw = skater.current_price + delta;
  return { newPrice: Math.max(FLOOR, Math.min(CEILING, raw)), delta };
}

async function main() {
  const data = JSON.parse(
    readFileSync(resolve(__dirname, "gp_season_results_2025_26.json"), "utf-8")
  );

  const allSkaters = [
    ...data.men,
    ...data.women,
    ...data.pairs,
    ...data.ice_dance,
  ];

  let updated = 0;
  let unchanged = 0;
  let errors = 0;

  for (const skater of allSkaters) {
    const { newPrice, delta } = calcNewPrice(skater);

    if (delta === 0) {
      unchanged++;
      console.log(`  SKIP ${skater.skater_name}: no change ($${(skater.current_price / 1e6).toFixed(1)}M)`);
      continue;
    }

    // Find skater in DB by name
    const { data: dbSkater, error: findErr } = await supabase
      .from("skaters")
      .select("id, current_price")
      .eq("name", skater.skater_name)
      .single();

    if (findErr || !dbSkater) {
      console.log(`  ERROR ${skater.skater_name}: not found in DB`);
      errors++;
      continue;
    }

    // Update current_price
    const { error: updateErr } = await supabase
      .from("skaters")
      .update({ current_price: newPrice, updated_at: new Date().toISOString() })
      .eq("id", dbSkater.id);

    if (updateErr) {
      console.log(`  ERROR ${skater.skater_name}: ${updateErr.message}`);
      errors++;
      continue;
    }

    // Record price_history
    const sign = delta > 0 ? "+" : "";
    await supabase.from("price_history").insert({
      skater_id: dbSkater.id,
      price_before: dbSkater.current_price,
      price_after: newPrice,
      reason: `GP season 2025-26 results (${sign}$${(delta / 1e6).toFixed(2)}M)`,
    });

    const arrow = delta > 0 ? "↑" : "↓";
    console.log(
      `  ${arrow} ${skater.skater_name}: $${(dbSkater.current_price / 1e6).toFixed(1)}M → $${(newPrice / 1e6).toFixed(1)}M (${sign}$${(delta / 1e6).toFixed(2)}M)`
    );
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${unchanged} unchanged, ${errors} errors`);
}

main().catch(console.error);
