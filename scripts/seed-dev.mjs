/**
 * seed-dev.mjs — Dev/local database seed for testing the points flow end-to-end.
 *
 * What this does:
 *   1. Upserts a small set of test skaters
 *   2. Creates a past GP event ("Dev Test GP France") with status "completed"
 *   3. Creates event entries linking skaters to the event at specific prices
 *   4. Creates 3 test auth users (Alice, Bob, Carol) if they don't exist
 *   5. Makes picks for each user (inserted directly, bypassing lock time)
 *   6. Imports results with placements, SP placements, falls, PB flags
 *   7. Recalculates user_picks.points_earned and users.total_season_points
 *   8. Prints a full verification table comparing expected vs actual points
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-dev.mjs
 *
 * To run against local Supabase (after `supabase start`):
 *   node --env-file=.env.local.dev scripts/seed-dev.mjs
 *
 * To reset and re-run:
 *   node --env-file=.env.local scripts/seed-dev.mjs --reset
 *   (--reset tears down the test event and test users before re-seeding)
 */

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RESET = process.argv.includes("--reset");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ---------------------------------------------------------------------------
// Scoring logic (mirrors src/lib/scoring.ts)
// ---------------------------------------------------------------------------

const PLACEMENT_POINTS = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 };
const SP_BONUS = { 1: 5, 2: 3, 3: 1 };

function calculateFantasyPoints(result, event) {
  let points = 0;
  if (result.final_placement) points += PLACEMENT_POINTS[result.final_placement] ?? 0;
  if (result.sp_placement)    points += SP_BONUS[result.sp_placement] ?? 0;
  if (result.falls === 0)     points += 3;   // clean skate bonus
  if (result.is_personal_best) points += 5;
  points -= result.falls * 2;
  if (result.is_withdrawal) points -= 10;
  return {
    raw: points,
    final: Math.round(points * event.points_multiplier),
  };
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const TEST_EVENT_NAME = "Dev Test GP France";

// 6 skaters across disciplines so picks stay interesting.
// Prices are set so Alice + Bob fit in a $40M budget with 3 picks each.
const TEST_SKATERS = [
  { name: "Ilia Malinin",        country: "USA", discipline: "men",       price: 15_000_000 },
  { name: "Adam Siao Him Fa",    country: "FRA", discipline: "men",       price: 12_000_000 },
  { name: "Nika Egadze",         country: "GEO", discipline: "men",       price: 11_600_000 },
  { name: "Kevin Aymoz",         country: "FRA", discipline: "men",       price: 10_800_000 },
  { name: "Kaori Sakamoto",      country: "JPN", discipline: "women",     price: 13_000_000 },
  { name: "Isabeau Levito",      country: "USA", discipline: "women",     price: 12_500_000 },
];

// Results for the event. falls=0 gives the clean-skate +3 bonus automatically.
// Expected fantasy_points_final (multiplier = 1.0):
//   Malinin:      1st(25) + SP1st(5) + clean(3) + PB(5) = 38
//   Siao Him Fa:  2nd(18) + SP2nd(3) + clean(3)         = 24
//   Egadze:       3rd(15) + SP3rd(1) + 1 fall → no clean, -2 falls = 14
//   Aymoz:        4th(12) + clean(3)                    = 15  (SP4th → no bonus)
//   Sakamoto:     1st(25) + SP1st(5) + clean(3)         = 33
//   Levito:       withdrawn                             = -10
const TEST_RESULTS = [
  { skater_name: "Ilia Malinin",     placement: 1, sp_placement: 1, falls: 0, is_personal_best: true,  is_withdrawal: false },
  { skater_name: "Adam Siao Him Fa", placement: 2, sp_placement: 2, falls: 0, is_personal_best: false, is_withdrawal: false },
  { skater_name: "Nika Egadze",      placement: 3, sp_placement: 3, falls: 1, is_personal_best: false, is_withdrawal: false },
  { skater_name: "Kevin Aymoz",      placement: 4, sp_placement: 4, falls: 0, is_personal_best: false, is_withdrawal: false },
  { skater_name: "Kaori Sakamoto",   placement: 1, sp_placement: 1, falls: 0, is_personal_best: false, is_withdrawal: false },
  { skater_name: "Isabeau Levito",   placement: null, sp_placement: null, falls: 0, is_personal_best: false, is_withdrawal: true },
];

// Expected final points per skater (used for verification at the end).
// Calculated manually from the scoring logic above with multiplier = 1.0.
const EXPECTED_PTS = {
  "Ilia Malinin":     38,
  "Adam Siao Him Fa": 24,
  "Nika Egadze":      14,
  "Kevin Aymoz":      15,
  "Kaori Sakamoto":   33,
  "Isabeau Levito":  -10,
};

// Three test players, each with different picks.
//   Alice: Malinin + Siao Him Fa + Sakamoto → 38+24+33 = 95  (best team)
//   Bob:   Malinin + Egadze + Aymoz         → 38+14+15 = 67
//   Carol: Siao Him Fa + Aymoz + Levito     → 24+15-10 = 29  (withdrawal pain)
const TEST_USERS = [
  {
    email: "alice@axelpick-dev.test",
    password: "DevPassword123!",
    display_name: "Alice Dev",
    picks: ["Ilia Malinin", "Adam Siao Him Fa", "Kaori Sakamoto"],
    expected_total: 95,
  },
  {
    email: "bob@axelpick-dev.test",
    password: "DevPassword123!",
    display_name: "Bob Dev",
    picks: ["Ilia Malinin", "Nika Egadze", "Kevin Aymoz"],
    expected_total: 67,
  },
  {
    email: "carol@axelpick-dev.test",
    password: "DevPassword123!",
    display_name: "Carol Dev",
    picks: ["Adam Siao Him Fa", "Kevin Aymoz", "Isabeau Levito"],
    expected_total: 29,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(label) { process.stdout.write(`  ✓ ${label}\n`); }
function fail(label, err) { process.stdout.write(`  ✗ ${label}: ${err}\n`); }
function section(title) { console.log(`\n── ${title} ──`); }

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

// ---------------------------------------------------------------------------
// Reset (optional)
// ---------------------------------------------------------------------------

async function resetTestData() {
  section("Reset: removing previous test data");

  // Find the test event
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("name", TEST_EVENT_NAME)
    .maybeSingle();

  if (event) {
    // Delete dependent rows in order
    await supabase.from("results").delete().eq("event_id", event.id);
    await supabase.from("user_picks").delete().eq("event_id", event.id);
    await supabase.from("event_entries").delete().eq("event_id", event.id);
    await supabase.from("events").delete().eq("id", event.id);
    ok("removed test event and its picks/results/entries");
  } else {
    ok("no existing test event found");
  }

  // Remove test users
  for (const u of TEST_USERS) {
    const { data: list } = await supabase.auth.admin.listUsers();
    const found = (list?.users ?? []).find((x) => x.email === u.email);
    if (found) {
      await supabase.from("users").delete().eq("id", found.id);
      await supabase.auth.admin.deleteUser(found.id);
      ok(`removed auth user ${u.email}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Step 1: Upsert skaters
// ---------------------------------------------------------------------------

async function upsertSkaters() {
  section("Step 1: Upsert test skaters");
  const skaterIds = {};

  for (const s of TEST_SKATERS) {
    const { data: existing } = await supabase
      .from("skaters")
      .select("id")
      .eq("name", s.name)
      .eq("discipline", s.discipline)
      .maybeSingle();

    if (existing) {
      skaterIds[s.name] = existing.id;
      ok(`${s.name} — already exists (${existing.id})`);
    } else {
      const { data, error } = await supabase
        .from("skaters")
        .insert({ name: s.name, country: s.country, discipline: s.discipline, current_price: s.price, is_active: true })
        .select("id")
        .single();
      if (error) { fail(s.name, error.message); continue; }
      skaterIds[s.name] = data.id;
      ok(`${s.name} — created (${data.id})`);
    }
  }

  return skaterIds;
}

// ---------------------------------------------------------------------------
// Step 2: Create event
// ---------------------------------------------------------------------------

async function createEvent() {
  section("Step 2: Create test event");

  // Check for existing
  const { data: existing } = await supabase
    .from("events")
    .select("id, points_multiplier")
    .eq("name", TEST_EVENT_NAME)
    .maybeSingle();

  if (existing) {
    ok(`event "${TEST_EVENT_NAME}" already exists — reusing (${existing.id})`);
    return existing;
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      name: TEST_EVENT_NAME,
      event_type: "gp",
      location: "Paris, France",
      start_date: "2025-10-17",
      end_date: "2025-10-19",
      picks_limit: 3,
      budget: 40_000_000,
      points_multiplier: 1.0,
      // Lock time in the past so the event appears locked
      picks_lock_at: "2025-10-17T00:00:00Z",
      status: "completed",
    })
    .select("id, points_multiplier")
    .single();

  if (error) throw new Error(`create event: ${error.message}`);
  ok(`created "${TEST_EVENT_NAME}" (${data.id})`);
  return data;
}

// ---------------------------------------------------------------------------
// Step 3: Create event entries
// ---------------------------------------------------------------------------

async function createEventEntries(event, skaterIds) {
  section("Step 3: Create event entries");

  for (const s of TEST_SKATERS) {
    const skaterId = skaterIds[s.name];
    if (!skaterId) { fail(s.name, "skater id missing"); continue; }

    const { error } = await supabase.from("event_entries").insert({
      event_id: event.id,
      skater_id: skaterId,
      price_at_event: s.price,
    });

    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        ok(`${s.name} — entry already exists`);
      } else {
        fail(s.name, error.message);
      }
    } else {
      ok(`${s.name} — entry created at $${(s.price / 1_000_000).toFixed(1)}M`);
    }
  }
}

// ---------------------------------------------------------------------------
// Step 4: Create test auth users
// ---------------------------------------------------------------------------

async function createTestUsers() {
  section("Step 4: Create test auth users");
  const userIds = {};

  for (const u of TEST_USERS) {
    // Check if auth user already exists
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = (list?.users ?? []).find((x) => x.email === u.email);

    let authId;
    if (existing) {
      authId = existing.id;
      ok(`${u.email} — auth user already exists`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      });
      if (error) { fail(u.email, error.message); continue; }
      authId = data.user.id;
      ok(`${u.email} — auth user created`);
    }

    // Upsert into public.users
    const { error: uErr } = await supabase.from("users").upsert({
      id: authId,
      display_name: u.display_name,
      total_season_points: 0,
    }, { onConflict: "id" });

    if (uErr) { fail(`public.users for ${u.email}`, uErr.message); continue; }
    ok(`${u.display_name} — public.users row ready`);
    userIds[u.email] = authId;
  }

  return userIds;
}

// ---------------------------------------------------------------------------
// Step 5: Make picks (direct insert — bypasses lock time check)
// ---------------------------------------------------------------------------

async function makePicks(event, skaterIds, userIds) {
  section("Step 5: Insert picks for each test user");

  for (const u of TEST_USERS) {
    const userId = userIds[u.email];
    if (!userId) { fail(u.display_name, "user id missing"); continue; }

    for (const skaterName of u.picks) {
      const skaterId = skaterIds[skaterName];
      if (!skaterId) { fail(skaterName, "skater id missing"); continue; }

      const { error } = await supabase.from("user_picks").insert({
        user_id: userId,
        event_id: event.id,
        skater_id: skaterId,
      });

      if (error) {
        if (error.message.includes("duplicate") || error.code === "23505") {
          ok(`${u.display_name} → ${skaterName} — pick already exists`);
        } else {
          fail(`${u.display_name} → ${skaterName}`, error.message);
        }
      } else {
        ok(`${u.display_name} → ${skaterName}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Step 6: Import results & calculate fantasy points
// ---------------------------------------------------------------------------

async function importResults(event, skaterIds) {
  section("Step 6: Import results and calculate fantasy points");

  for (const r of TEST_RESULTS) {
    const skaterId = skaterIds[r.skater_name];
    if (!skaterId) { fail(r.skater_name, "skater id missing"); continue; }

    const { raw, final: finalPts } = calculateFantasyPoints(
      {
        final_placement: r.placement,
        sp_placement: r.sp_placement,
        falls: r.falls,
        is_personal_best: r.is_personal_best,
        is_withdrawal: r.is_withdrawal,
      },
      { points_multiplier: Number(event.points_multiplier) }
    );

    const { error } = await supabase.from("results").upsert({
      event_id: event.id,
      skater_id: skaterId,
      final_placement: r.placement,
      sp_placement: r.sp_placement,
      falls: r.falls,
      is_personal_best: r.is_personal_best,
      is_withdrawal: r.is_withdrawal,
      fantasy_points_raw: raw,
      fantasy_points_final: finalPts,
    }, { onConflict: "event_id,skater_id" });

    if (error) {
      fail(r.skater_name, error.message);
    } else {
      const placement = r.is_withdrawal ? "WD" : `${r.placement}${ordinal(r.placement)}`;
      ok(`${r.skater_name} — ${placement} → ${finalPts} pts (raw ${raw})`);
    }
  }
}

// ---------------------------------------------------------------------------
// Step 7: Recalculate user_picks.points_earned + users.total_season_points
// ---------------------------------------------------------------------------

async function recalcUserPoints(event) {
  section("Step 7: Recalculate user picks and season totals");

  const { data: eventResults, error: rErr } = await supabase
    .from("results")
    .select("skater_id, fantasy_points_final")
    .eq("event_id", event.id);

  if (rErr) throw new Error(rErr.message);

  const pointsBySkater = new Map();
  for (const r of eventResults) {
    pointsBySkater.set(r.skater_id, r.fantasy_points_final ?? 0);
  }

  const { data: picks, error: pErr } = await supabase
    .from("user_picks")
    .select("id, user_id, skater_id")
    .eq("event_id", event.id);

  if (pErr) throw new Error(pErr.message);

  for (const pick of picks) {
    const pts = pointsBySkater.get(pick.skater_id) ?? 0;
    await supabase.from("user_picks").update({ points_earned: pts }).eq("id", pick.id);
  }

  const userIds = Array.from(new Set(picks.map((p) => p.user_id)));
  for (const userId of userIds) {
    const { data: allPicks } = await supabase
      .from("user_picks")
      .select("points_earned")
      .eq("user_id", userId);
    const total = (allPicks ?? []).reduce((sum, p) => sum + (p.points_earned ?? 0), 0);
    await supabase.from("users").update({ total_season_points: total }).eq("id", userId);
    ok(`season total updated for user ${userId} → ${total} pts`);
  }
}

// ---------------------------------------------------------------------------
// Step 8: Verify — compare expected vs actual points
// ---------------------------------------------------------------------------

async function verify(event, skaterIds, userIds) {
  section("Step 8: Verification");

  let allPassed = true;

  // Per-skater fantasy points
  console.log("\n  Skater Results:");
  console.log("  " + "─".repeat(66));
  console.log(`  ${"Skater".padEnd(22)} ${"Expected".padStart(9)} ${"Actual".padStart(9)} ${"Status".padStart(8)}`);
  console.log("  " + "─".repeat(66));

  for (const [name, expectedPts] of Object.entries(EXPECTED_PTS)) {
    const skaterId = skaterIds[name];
    if (!skaterId) continue;

    const { data: result } = await supabase
      .from("results")
      .select("fantasy_points_final")
      .eq("event_id", event.id)
      .eq("skater_id", skaterId)
      .maybeSingle();

    const actual = result?.fantasy_points_final ?? "missing";
    const passed = actual === expectedPts;
    if (!passed) allPassed = false;
    const status = passed ? "PASS" : "FAIL";
    console.log(`  ${name.padEnd(22)} ${String(expectedPts).padStart(9)} ${String(actual).padStart(9)} ${status.padStart(8)}`);
  }

  // Per-user season totals
  console.log("\n  Player Season Totals:");
  console.log("  " + "─".repeat(56));
  console.log(`  ${"Player".padEnd(16)} ${"Expected".padStart(9)} ${"Actual".padStart(9)} ${"Status".padStart(8)}`);
  console.log("  " + "─".repeat(56));

  for (const u of TEST_USERS) {
    const userId = userIds[u.email];
    if (!userId) continue;

    const { data: user } = await supabase
      .from("users")
      .select("total_season_points")
      .eq("id", userId)
      .maybeSingle();

    const actual = user?.total_season_points ?? "missing";
    const passed = actual === u.expected_total;
    if (!passed) allPassed = false;
    const status = passed ? "PASS" : "FAIL";
    console.log(`  ${u.display_name.padEnd(16)} ${String(u.expected_total).padStart(9)} ${String(actual).padStart(9)} ${status.padStart(8)}`);
  }

  console.log("\n  " + "─".repeat(56));
  if (allPassed) {
    console.log("  All checks passed. Points flow is working correctly.\n");
  } else {
    console.log("  Some checks FAILED — see above.\n");
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function ordinal(n) {
  if (!n) return "";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== AxelPick dev seed — points flow test ===");
  console.log(`Target: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("\nERROR: Missing env vars. Run with --env-file=.env.local (or .env.local.dev)");
    process.exit(1);
  }

  if (RESET) {
    await resetTestData();
  }

  const skaterIds = await upsertSkaters();
  const event    = await createEvent();
  await createEventEntries(event, skaterIds);
  const userIds  = await createTestUsers();
  await makePicks(event, skaterIds, userIds);
  await importResults(event, skaterIds);
  await recalcUserPoints(event);
  await verify(event, skaterIds, userIds);

  console.log("Done. Log in as any test user (password: DevPassword123!) to inspect the UI.");
}

main().catch((err) => { console.error("\nFatal:", err.message); process.exit(1); });
