import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

// Load env
const env = fs.readFileSync(".env.local", "utf8");
env.split("\n").forEach((l) => {
  const [k, ...v] = l.split("=");
  if (k && v.length) process.env[k.trim()] = v.join("=").trim();
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function deriveIsuSlug(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s*\/\s*/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function isuProfileUrl(slug, discipline) {
  const base = "https://isu-skating.com/figure-skating/skaters";
  if (discipline === "pairs" || discipline === "ice_dance") {
    return `${base}/pairs/${slug}/`;
  }
  return `${base}/${slug}/`;
}

function parseIsuDate(raw) {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function parseHeight(raw) {
  const m = raw.match(/(\d+)\s*cm/i);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Fetch ISU page by streaming chunks. Stop early when bio data arrives.
 */
async function fetchIsuPage(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const res = await fetch(url, {
    headers: { "User-Agent": "AxelPick/1.0 (fantasy skating app)" },
    signal: controller.signal,
  });
  if (!res.ok) {
    clearTimeout(timer);
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let html = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (html.includes("Date of birth") && (html.includes("Best Score") || html.includes("best score"))) {
        controller.abort();
        break;
      }
    }
  } catch {
    // Expected: abort or timeout
  }
  clearTimeout(timer);

  if (!html.includes("Date of birth")) {
    throw new Error("bio data not received (timeout or page structure different)");
  }
  return html;
}

function parseProfile(html) {
  const $ = cheerio.load(html);

  const bio = new Map();
  $("li").each((_, el) => {
    const spans = $(el).find("span");
    if (spans.length >= 2) {
      const key = $(spans[0]).text().trim().toLowerCase();
      const val = $(spans[1]).text().trim();
      if (key && val) bio.set(key, val);
    }
  });

  let sp_music = null;
  let fs_music = null;
  $("h4").each((_, el) => {
    const heading = $(el).text().trim();
    if (!heading.toLowerCase().includes("music")) return;
    const nextDiv = $(el).next("div");
    if (!nextDiv.length) return;
    const innerHtml = nextDiv.html() || "";
    const text = innerHtml.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim() || null;
    const h = heading.toLowerCase();
    if (h.includes("short program") || h.includes("rhythm dance")) sp_music = text;
    else if (h.includes("free skating") || h.includes("free dance")) fs_music = text;
  });

  const scores = { season_best_sp: null, season_best_fs: null, personal_best_sp: null, personal_best_fs: null };
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
    const scoreVal = parseFloat($(cells[cells.length - 1]).text().trim());
    if (isNaN(scoreVal)) return;
    for (const { pattern, key } of labelMap) {
      if (pattern.test(label)) { scores[key] = scoreVal; break; }
    }
  });

  let started_skating = null;
  const ssVal = bio.get("start skating") ?? bio.get("started skating") ?? null;
  if (ssVal) { const m = ssVal.match(/(\d{4})/); if (m) started_skating = parseInt(m[1], 10); }

  return {
    date_of_birth: parseIsuDate(bio.get("date of birth") ?? ""),
    height_cm: parseHeight(bio.get("height") ?? ""),
    hometown: bio.get("hometown") ?? null,
    started_skating,
    coaches: bio.get("coach") ?? bio.get("coaches") ?? null,
    choreographer: bio.get("choreographer") ?? null,
    sp_music,
    fs_music,
    ...scores,
  };
}

// Main
const { data: skaters } = await supabase
  .from("skaters")
  .select("id, name, isu_slug, discipline")
  .eq("is_active", true)
  .is("isu_bio_updated_at", null)
  .order("name");

console.log(`Found ${skaters.length} remaining skaters\n`);

let ok = 0, fail = 0;
for (let i = 0; i < skaters.length; i++) {
  const s = skaters[i];
  const slug = s.isu_slug || deriveIsuSlug(s.name);
  const url = isuProfileUrl(slug, s.discipline);
  try {
    const html = await fetchIsuPage(url, 12000);
    const data = parseProfile(html);
    await supabase.from("skaters").update({
      isu_slug: slug,
      ...data,
      isu_bio_updated_at: new Date().toISOString(),
    }).eq("id", s.id);
    ok++;
    console.log(`[${i + 1}/${skaters.length}] OK  ${s.name}`);
  } catch (err) {
    fail++;
    console.log(`[${i + 1}/${skaters.length}] ERR ${s.name} (${slug}): ${err.message}`);
  }
  if (i < skaters.length - 1) await new Promise(r => setTimeout(r, 500));
}

console.log(`\nDone: ${ok} synced, ${fail} failed out of ${skaters.length}`);
process.exit(0);
