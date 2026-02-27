// Add Jade Hovine to the upcoming Worlds event as substitute for Loena Hendrickx.
// Loena Hendrickx's withdrawal has already been handled manually.
// This script:
//   1. Upserts Jade Hovine in the skaters table (world_ranking: 62, price: $2M)
//   2. Syncs her ISU profile (bio, scores, music)
//   3. Adds Jade Hovine to the Worlds event entry at the correct price
//
// Run with: node --env-file=.env.local scripts/add-jade-hovine-worlds.mjs [--apply]

import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const dryRun = !process.argv.includes("--apply");

const JADE = {
  name: "Jade Hovine",
  country: "BEL",
  discipline: "women",
  world_ranking: 62,
  isu_slug: "jade-hovine",
};

function getInitialPrice(worldRanking) {
  if (!worldRanking || worldRanking < 1) return 3_000_000;
  if (worldRanking <= 5) return 15_000_000 - (worldRanking - 1) * 750_000;
  if (worldRanking <= 15) return 12_000_000 - (worldRanking - 6) * 400_000;
  if (worldRanking <= 30) return 8_000_000 - (worldRanking - 16) * 200_000;
  return Math.max(2_000_000, 5_000_000 - (worldRanking - 31) * 100_000);
}

// ---- ISU scraper (inline, mirrors src/lib/isu-scraper.ts) ----

function parseIsuDate(raw) {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function parseHeight(raw) {
  const m = raw.match(/(\d+)\s*cm/i);
  return m ? parseInt(m[1], 10) : null;
}

function parseStartedSkating(raw) {
  const m = raw.match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

function parseBioFields($) {
  const fields = new Map();
  $("li").each((_, el) => {
    const spans = $(el).find("span");
    if (spans.length >= 2) {
      const key = $(spans[0]).text().trim().toLowerCase();
      const val = $(spans[1]).text().trim();
      if (key && val) fields.set(key, val);
    }
  });
  if (fields.size === 0) {
    $("dt").each((_, el) => {
      const key = $(el).text().trim().toLowerCase();
      const val = $(el).next("dd").text().trim();
      if (key && val) fields.set(key, val);
    });
  }
  return fields;
}

function parseMusic($) {
  let spMusic = null;
  let fsMusic = null;
  $("h4").each((_, el) => {
    const heading = $(el).text().trim();
    if (!heading.toLowerCase().includes("music")) return;
    const nextDiv = $(el).next("div");
    let musicText = null;
    if (nextDiv.length) {
      const html = nextDiv.html() ?? "";
      musicText = html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim() || null;
    }
    const headingLower = heading.toLowerCase();
    if (headingLower.includes("short program") || headingLower.includes("rhythm dance")) {
      spMusic = musicText;
    } else if (headingLower.includes("free skating") || headingLower.includes("free dance")) {
      fsMusic = musicText;
    }
  });
  return [spMusic, fsMusic];
}

function parseScores($) {
  const scores = {
    season_best_sp: null,
    season_best_fs: null,
    personal_best_sp: null,
    personal_best_fs: null,
  };
  const labelMap = [
    { pattern: /personal\s+best\s+score\s+(?:short\s+program|rhythm\s+dance)/i, key: "personal_best_sp" },
    { pattern: /personal\s+best\s+score\s+(?:free\s+skating|free\s+dance)/i, key: "personal_best_fs" },
    { pattern: /season\s+best\s+score\s+(?:short\s+program|rhythm\s+dance)/i, key: "season_best_sp" },
    { pattern: /season\s+best\s+score\s+(?:free\s+skating|free\s+dance)/i, key: "season_best_fs" },
  ];
  $("table tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 4) return;
    const label = $(cells[0]).text().trim();
    const scoreText = $(cells[cells.length - 1]).text().trim();
    const scoreVal = parseFloat(scoreText);
    if (isNaN(scoreVal)) return;
    for (const { pattern, key } of labelMap) {
      if (pattern.test(label)) {
        scores[key] = scoreVal;
        break;
      }
    }
  });
  return scores;
}

async function scrapeIsuProfile(slug) {
  const url = `https://isu-skating.com/figure-skating/skaters/${slug}/`;
  console.log(`  Fetching ${url} ...`);
  const res = await fetch(url, {
    headers: { "User-Agent": "AxelPick/1.0 (fantasy skating app)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`ISU fetch failed: ${res.status} ${res.statusText}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const bio = parseBioFields($);
  const [spMusic, fsMusic] = parseMusic($);
  const scores = parseScores($);
  let startedSkating = null;
  const startVal = bio.get("start skating") ?? bio.get("started skating") ?? bio.get("start sk.") ?? null;
  if (startVal) {
    startedSkating = parseStartedSkating(startVal);
  } else {
    const fullText = $("body").text();
    const m = fullText.match(/start(?:ed)?\s+skating\s*:?\s*(\d{4})/i);
    if (m) startedSkating = parseInt(m[1], 10);
  }
  return {
    date_of_birth: parseIsuDate(bio.get("date of birth") ?? ""),
    height_cm: parseHeight(bio.get("height") ?? ""),
    hometown: bio.get("hometown") ?? null,
    started_skating: startedSkating,
    coaches: bio.get("coach") ?? bio.get("coaches") ?? null,
    choreographer: bio.get("choreographer") ?? null,
    sp_music: spMusic,
    fs_music: fsMusic,
    ...scores,
  };
}

// ---- Main ----

async function main() {
  if (dryRun) console.log("=== DRY RUN (pass --apply to commit changes) ===\n");

  // 1. Find the upcoming Worlds event
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

  // 2. Upsert Jade Hovine in skaters table
  // Note: Loena Hendrickx's withdrawal has already been handled manually.
  const price = getInitialPrice(JADE.world_ranking);
  let jade;

  const { data: existingJade } = await supabase
    .from("skaters")
    .select("id, name, current_price, world_ranking")
    .eq("name", JADE.name)
    .eq("discipline", JADE.discipline)
    .single();

  if (existingJade) {
    console.log(`\n${JADE.name} already exists (id: ${existingJade.id}), current_price: $${(existingJade.current_price / 1e6).toFixed(1)}M`);
    jade = existingJade;
    if (!dryRun) {
      await supabase
        .from("skaters")
        .update({
          isu_slug: JADE.isu_slug,
          world_ranking: JADE.world_ranking,
          current_price: price,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingJade.id);
      console.log(`  Updated price → $${(price / 1e6).toFixed(1)}M`);
    } else {
      console.log(`  DRY RUN: would update price → $${(price / 1e6).toFixed(1)}M`);
    }
  } else {
    console.log(`\nInserting ${JADE.name} (slug: ${JADE.isu_slug}, price: $${(price / 1e6).toFixed(1)}M)`);
    if (!dryRun) {
      const { data: newSkater, error: insertErr } = await supabase
        .from("skaters")
        .insert({
          name: JADE.name,
          country: JADE.country,
          discipline: JADE.discipline,
          world_ranking: JADE.world_ranking,
          current_price: price,
          isu_slug: JADE.isu_slug,
          is_active: true,
        })
        .select("id, name")
        .single();

      if (insertErr) {
        console.error("Failed to insert skater:", insertErr.message);
        process.exit(1);
      }
      jade = newSkater;
      console.log(`  Inserted with id: ${jade.id}`);
    } else {
      console.log(`  DRY RUN: would insert with slug=${JADE.isu_slug}, world_ranking=${JADE.world_ranking}, price=$${(price / 1e6).toFixed(1)}M`);
      jade = { id: "<dry-run-id>", name: JADE.name };
    }
  }

  // 3. Sync ISU profile
  console.log(`\nSyncing ISU profile for ${JADE.name} (slug: ${JADE.isu_slug})...`);
  let profileData = null;
  try {
    profileData = await scrapeIsuProfile(JADE.isu_slug);
    console.log(`  Scraped: DOB=${profileData.date_of_birth}, height=${profileData.height_cm}cm, ` +
      `PB_SP=${profileData.personal_best_sp}, PB_FS=${profileData.personal_best_fs}`);
    if (!dryRun && jade.id !== "<dry-run-id>") {
      await supabase
        .from("skaters")
        .update({ ...profileData, isu_bio_updated_at: new Date().toISOString() })
        .eq("id", jade.id);
      console.log(`  ISU profile saved.`);
    } else {
      console.log(`  DRY RUN: would save ISU profile data.`);
    }
  } catch (err) {
    console.warn(`  WARNING: ISU sync failed — ${err.message}`);
    console.warn(`  Profile can be synced later via Admin → Skaters → Sync ISU Profile`);
  }

  // 4. Add Jade Hovine to Worlds event entries
  console.log(`\nAdding ${JADE.name} to ${event.name} at $${(price / 1e6).toFixed(1)}M...`);
  if (!dryRun && jade.id !== "<dry-run-id>") {
    const { error: entryErr } = await supabase
      .from("event_entries")
      .insert({ event_id: event.id, skater_id: jade.id, price_at_event: price });

    if (entryErr) {
      if (entryErr.message.includes("duplicate")) {
        console.log(`  Already in event entries — updating price.`);
        await supabase
          .from("event_entries")
          .update({ price_at_event: price })
          .eq("event_id", event.id)
          .eq("skater_id", jade.id);
      } else {
        console.error(`  ERROR adding entry: ${entryErr.message}`);
      }
    } else {
      console.log(`  Added.`);
    }
  } else {
    console.log(`  DRY RUN: would insert event_entry with price=$${(price / 1e6).toFixed(1)}M`);
  }

  console.log(`\n--- Done ---`);
  console.log(`Jade Hovine added to ${event.name} (world_ranking: ${JADE.world_ranking}, price: $${(price / 1e6).toFixed(1)}M)`);
  if (dryRun) console.log(`\nRun with --apply to commit these changes.`);
}

main().catch(console.error);
