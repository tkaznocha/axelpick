// Fix stale user_picks for withdrawn skaters.
// Finds all withdrawn event_entries and deletes any user_picks that still reference them.
//
// Run with: node --env-file=.env.local scripts/fix-withdrawn-picks.mjs

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // 1. Find all withdrawn event entries
  const { data: withdrawn, error: wErr } = await supabase
    .from("event_entries")
    .select("event_id, skater_id, skaters(name)")
    .eq("is_withdrawn", true);

  if (wErr) {
    console.error("Failed to fetch withdrawn entries:", wErr.message);
    process.exit(1);
  }

  if (!withdrawn || withdrawn.length === 0) {
    console.log("No withdrawn entries found. Nothing to clean up.");
    return;
  }

  console.log(`Found ${withdrawn.length} withdrawn entry/entries.\n`);

  let totalDeleted = 0;

  for (const entry of withdrawn) {
    const skaterName = entry.skaters?.name ?? entry.skater_id;

    // Find stale user_picks for this (event_id, skater_id)
    const { data: stalePicks, error: pickErr } = await supabase
      .from("user_picks")
      .select("id, user_id")
      .eq("event_id", entry.event_id)
      .eq("skater_id", entry.skater_id);

    if (pickErr) {
      console.log(`  ERROR checking picks for ${skaterName}: ${pickErr.message}`);
      continue;
    }

    if (!stalePicks || stalePicks.length === 0) continue;

    // Delete them
    const { error: delErr } = await supabase
      .from("user_picks")
      .delete()
      .eq("event_id", entry.event_id)
      .eq("skater_id", entry.skater_id);

    if (delErr) {
      console.log(`  ERROR deleting picks for ${skaterName}: ${delErr.message}`);
      continue;
    }

    const userIds = stalePicks.map((p) => p.user_id);
    console.log(`  DELETED ${stalePicks.length} pick(s) for ${skaterName} (users: ${userIds.join(", ")})`);
    totalDeleted += stalePicks.length;
  }

  console.log(`\nDone: ${totalDeleted} stale pick(s) deleted.`);
}

main().catch(console.error);
