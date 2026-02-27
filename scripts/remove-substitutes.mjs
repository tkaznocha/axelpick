// Remove specific skaters from Worlds 2026 event entries
// Deletes user_picks first (budget is computed, so picks deletion = budget refund)
// Then deletes event_entries
// Run with: node --env-file=.env.local scripts/remove-substitutes.mjs

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Skaters to remove: Maxim Naumov (substitute) + 5 extras not in ISU entry list
const skatersToRemove = [
  { name: "Maxim Naumov", discipline: "men" },
  { name: "Jin Boyang", discipline: "men" },
  { name: "Mikhail Shaidorov", discipline: "men" },
  { name: "Charlene Guignard / Marco Fabbri", discipline: "ice_dance" },
  { name: "Shiyue Wang / Xinyu Liu", discipline: "ice_dance" },
  { name: "Sui Wenjing / Han Cong", discipline: "pairs" },
];

// Find the Worlds 2026 event
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

// Get all current event entries with skater info
const { data: currentEntries } = await supabase
  .from("event_entries")
  .select("id, skater_id, price_at_event, skaters(id, name, discipline)")
  .eq("event_id", event.id);

console.log(`Current entries: ${currentEntries?.length ?? 0}\n`);

let removedEntries = 0;
let removedPicks = 0;
let removedReplacements = 0;

for (const target of skatersToRemove) {
  const match = currentEntries?.find(
    (e) =>
      e.skaters.name.toLowerCase() === target.name.toLowerCase() &&
      e.skaters.discipline === target.discipline
  );

  if (!match) {
    console.log(`NOT FOUND: ${target.name} (${target.discipline})`);
    continue;
  }

  const price = (match.price_at_event / 1e6).toFixed(1);

  // 1. Delete pick_replacements referencing this skater (as withdrawn or replacement)
  const { data: repls1 } = await supabase
    .from("pick_replacements")
    .delete()
    .eq("event_id", event.id)
    .eq("withdrawn_skater_id", match.skater_id)
    .select("id");

  const { data: repls2 } = await supabase
    .from("pick_replacements")
    .delete()
    .eq("event_id", event.id)
    .eq("replacement_skater_id", match.skater_id)
    .select("id");

  const replCount = (repls1?.length ?? 0) + (repls2?.length ?? 0);
  removedReplacements += replCount;

  // 2. Delete user_picks for this skater in this event (frees budget automatically)
  const { data: deletedPicks, error: picksErr } = await supabase
    .from("user_picks")
    .delete()
    .eq("event_id", event.id)
    .eq("skater_id", match.skater_id)
    .select("id, user_id");

  if (picksErr) {
    console.log(`ERROR deleting picks for ${target.name}: ${picksErr.message}`);
    continue;
  }

  const pickCount = deletedPicks?.length ?? 0;
  removedPicks += pickCount;

  if (pickCount > 0) {
    console.log(`  Deleted ${pickCount} user pick(s) for ${target.name} ($${price}M) — budget refunded`);
    for (const p of deletedPicks) {
      console.log(`    - user ${p.user_id}`);
    }
  }

  // 3. Delete event_entry
  const { error: delErr } = await supabase
    .from("event_entries")
    .delete()
    .eq("id", match.id);

  if (delErr) {
    console.log(`ERROR removing entry ${target.name}: ${delErr.message}`);
  } else {
    console.log(`REMOVED: ${target.name} (${target.discipline}, $${price}M)`);
    removedEntries++;
  }
}

console.log(`\n--- Summary ---`);
console.log(`Event entries removed: ${removedEntries}`);
console.log(`User picks deleted (budget refunded): ${removedPicks}`);
console.log(`Pick replacements deleted: ${removedReplacements}`);
console.log(`Remaining entries: ${(currentEntries?.length ?? 0) - removedEntries}`);
