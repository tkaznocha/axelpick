// Sync Worlds 2026 entries: replace Olympic placeholders with official ISU entries
// Run with: node --env-file=.env.local scripts/sync-worlds-entries.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // 1. Read entries JSON
  const entries = JSON.parse(
    readFileSync(
      resolve(__dirname, "worlds_entries_2026_with_prices.json"),
      "utf-8"
    )
  );
  console.log(`Loaded ${entries.length} entries from JSON\n`);

  // 2. Find the Worlds 2026 event
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, name, status")
    .eq("event_type", "worlds")
    .eq("status", "upcoming")
    .single();

  if (eventErr || !event) {
    console.error("Could not find upcoming Worlds event:", eventErr?.message);
    process.exit(1);
  }
  console.log(`Found event: ${event.name} (${event.id})\n`);

  // 3. Fetch current event_entries with skater info
  const { data: currentEntries } = await supabase
    .from("event_entries")
    .select("id, skater_id, price_at_event, skaters(id, name, discipline)")
    .eq("event_id", event.id);

  const current = currentEntries ?? [];
  console.log(`Current entries in DB: ${current.length}`);

  // Build lookup of current entries by skater name + discipline (lowercase)
  const currentByKey = new Map();
  for (const e of current) {
    const key =
      e.skaters.name.toLowerCase() + "|" + e.skaters.discipline;
    currentByKey.set(key, e);
  }

  // Build lookup of new entries by skater name + discipline (lowercase)
  const newByKey = new Map();
  for (const e of entries) {
    const key = e.skater_name.toLowerCase() + "|" + e.discipline;
    newByKey.set(key, e);
  }

  // 4. Determine removals: current entries NOT in new list
  const toRemove = current.filter((e) => {
    const key =
      e.skaters.name.toLowerCase() + "|" + e.skaters.discipline;
    return !newByKey.has(key);
  });

  // 5. Determine additions: new entries NOT in current list
  const toAdd = entries.filter((e) => {
    const key = e.skater_name.toLowerCase() + "|" + e.discipline;
    return !currentByKey.has(key);
  });

  // 6. Determine kept entries
  const kept = current.filter((e) => {
    const key =
      e.skaters.name.toLowerCase() + "|" + e.skaters.discipline;
    return newByKey.has(key);
  });

  console.log(`To remove: ${toRemove.length}`);
  console.log(`To add: ${toAdd.length}`);
  console.log(`Keeping: ${kept.length}\n`);

  // --- REMOVALS ---
  let removed = 0;
  let removeWarnings = 0;
  for (const entry of toRemove) {
    // Check for user picks referencing this entry
    const { count } = await supabase
      .from("user_picks")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("skater_id", entry.skater_id);

    if (count && count > 0) {
      console.log(
        `  WARNING: ${entry.skaters.name} has ${count} user pick(s) — skipping removal`
      );
      removeWarnings++;
      continue;
    }

    const { error: delErr } = await supabase
      .from("event_entries")
      .delete()
      .eq("id", entry.id);

    if (delErr) {
      console.log(`  ERROR removing ${entry.skaters.name}: ${delErr.message}`);
    } else {
      console.log(`  REMOVED ${entry.skaters.name} (${entry.skaters.discipline})`);
      removed++;
    }
  }

  // --- ADDITIONS ---
  let added = 0;
  let addErrors = 0;
  for (const entry of toAdd) {
    // Find or create skater
    let { data: skater } = await supabase
      .from("skaters")
      .select("id, current_price")
      .eq("name", entry.skater_name)
      .eq("discipline", entry.discipline)
      .single();

    if (!skater) {
      // Create new skater
      const { data: newSkater, error: skaterErr } = await supabase
        .from("skaters")
        .insert({
          name: entry.skater_name,
          country: entry.country,
          discipline: entry.discipline,
          world_ranking: entry.world_ranking ?? null,
          current_price: entry.price,
          is_active: true,
        })
        .select("id, current_price")
        .single();

      if (skaterErr) {
        console.log(
          `  ERROR creating skater ${entry.skater_name}: ${skaterErr.message}`
        );
        addErrors++;
        continue;
      }
      skater = newSkater;
      console.log(
        `  NEW SKATER ${entry.skater_name} (${entry.country}, ${entry.discipline}) → $${(entry.price / 1e6).toFixed(1)}M`
      );
    }

    // Create event entry using skater's current_price (preserves GP adjustments)
    const { error: entryErr } = await supabase.from("event_entries").insert({
      event_id: event.id,
      skater_id: skater.id,
      price_at_event: skater.current_price,
    });

    if (entryErr) {
      if (entryErr.message.includes("duplicate")) {
        console.log(`  SKIP ${entry.skater_name}: already entered`);
      } else {
        console.log(
          `  ERROR adding entry ${entry.skater_name}: ${entryErr.message}`
        );
        addErrors++;
      }
    } else {
      console.log(
        `  ADDED ${entry.skater_name} (${entry.country}, ${entry.discipline}) @ $${(skater.current_price / 1e6).toFixed(1)}M`
      );
      added++;
    }
  }

  // --- SUMMARY ---
  console.log(`\n--- Summary ---`);
  console.log(`Removed: ${removed} entries`);
  if (removeWarnings > 0) {
    console.log(`  (${removeWarnings} skipped due to user picks)`);
  }
  console.log(`Added: ${added} entries`);
  if (addErrors > 0) {
    console.log(`  (${addErrors} errors)`);
  }
  console.log(`Kept: ${kept.length} entries (prices preserved)`);
  console.log(`Total entries now: ${kept.length + added}`);
}

main().catch(console.error);
