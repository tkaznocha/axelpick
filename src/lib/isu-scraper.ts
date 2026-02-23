import * as cheerio from "cheerio";

export interface IsuProfileData {
  date_of_birth: string | null; // ISO date string
  height_cm: number | null;
  hometown: string | null;
  started_skating: number | null;
  coaches: string | null;
  choreographer: string | null;
  sp_music: string | null;
  fs_music: string | null;
  season_best_sp: number | null;
  season_best_fs: number | null;
  personal_best_sp: number | null;
  personal_best_fs: number | null;
}

/**
 * Derive the ISU "Home of Skating" URL slug from a skater name.
 * Singles: "Ilia MALININ" → "ilia-malinin"
 * Pairs/Dance: "Madison CHOCK / Evan BATES" → "madison-chock-evan-bates"
 */
export function deriveIsuSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/\s*\/\s*/g, " ") // "A / B" → "A B"
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric
    .trim()
    .replace(/\s+/g, "-"); // spaces → hyphens
}

const ISU_BASE = "https://isu-skating.com/figure-skating/skaters";

/**
 * Parse an ISU date like "02 Dec 2004" → "2004-12-02"
 */
function parseIsuDate(raw: string): string | null {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * Parse height like "174 CM" → 174
 */
function parseHeight(raw: string): number | null {
  const m = raw.match(/(\d+)\s*cm/i);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Parse "Start skating 2011" or "Started skating: 2011" → 2011
 */
function parseStartedSkating(raw: string): number | null {
  const m = raw.match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Build a map from bio label → value.
 * ISU uses <li> with two <span> children: label span + value span.
 */
function parseBioFields($: cheerio.CheerioAPI): Map<string, string> {
  const fields = new Map<string, string>();

  // Primary: <li> with two <span> children (ISU current layout)
  $("li").each((_, el) => {
    const spans = $(el).find("span");
    if (spans.length >= 2) {
      const key = $(spans[0]).text().trim().toLowerCase();
      const val = $(spans[1]).text().trim();
      if (key && val) fields.set(key, val);
    }
  });

  // Fallback: <dt>/<dd> pairs
  if (fields.size === 0) {
    $("dt").each((_, el) => {
      const key = $(el).text().trim().toLowerCase();
      const val = $(el).next("dd").text().trim();
      if (key && val) fields.set(key, val);
    });
  }

  return fields;
}

/**
 * Extract music from sections headed by h4 containing "Music".
 * ISU layout: <h4>Music Short Program...</h4><div>Track A<br/>Track B</div>
 * Returns [spMusic, fsMusic].
 */
function parseMusic($: cheerio.CheerioAPI): [string | null, string | null] {
  let spMusic: string | null = null;
  let fsMusic: string | null = null;

  $("h4").each((_, el) => {
    const heading = $(el).text().trim();
    if (!heading.toLowerCase().includes("music")) return;

    // The music tracks are in the next sibling <div>, separated by <br/>
    const nextDiv = $(el).next("div");
    let musicText: string | null = null;
    if (nextDiv.length) {
      // Replace <br/> with newlines, then get text
      const html = nextDiv.html() ?? "";
      musicText =
        html
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .trim() || null;
    }

    const headingLower = heading.toLowerCase();
    if (
      headingLower.includes("short program") ||
      headingLower.includes("rhythm dance")
    ) {
      spMusic = musicText;
    } else if (
      headingLower.includes("free skating") ||
      headingLower.includes("free dance")
    ) {
      fsMusic = musicText;
    }
  });

  return [spMusic, fsMusic];
}

/**
 * Extract best scores from <table> rows.
 * ISU layout: <tr><td>Personal Best Score Short Program</td><td>event</td><td>date</td><td>110.41</td></tr>
 */
function parseScores($: cheerio.CheerioAPI): {
  season_best_sp: number | null;
  season_best_fs: number | null;
  personal_best_sp: number | null;
  personal_best_fs: number | null;
} {
  const scores = {
    season_best_sp: null as number | null,
    season_best_fs: null as number | null,
    personal_best_sp: null as number | null,
    personal_best_fs: null as number | null,
  };

  const labelMap: Array<{ pattern: RegExp; key: keyof typeof scores }> = [
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

/**
 * Scrape a single ISU skater profile page.
 */
export async function scrapeIsuProfile(
  slug: string
): Promise<IsuProfileData> {
  const url = `${ISU_BASE}/${slug}/`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "AxelPick/1.0 (fantasy skating app)",
    },
  });

  if (!res.ok) {
    throw new Error(`ISU fetch failed for ${slug}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const bio = parseBioFields($);

  const [spMusic, fsMusic] = parseMusic($);
  const scores = parseScores($);

  // Extract started skating — may appear as a dt/dd or inline text
  let startedSkating: number | null = null;
  const startSkatingVal =
    bio.get("start skating") ??
    bio.get("started skating") ??
    bio.get("start sk.") ??
    null;
  if (startSkatingVal) {
    startedSkating = parseStartedSkating(startSkatingVal);
  } else {
    // Fallback: search full text
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

export interface BulkScrapeResult {
  id: string;
  name: string;
  data?: IsuProfileData;
  error?: string;
}

/**
 * Scrape multiple ISU profiles sequentially with rate limiting.
 */
export async function scrapeMultipleProfiles(
  skaters: Array<{ id: string; name: string; isu_slug: string }>,
  delayMs = 1500
): Promise<BulkScrapeResult[]> {
  const results: BulkScrapeResult[] = [];

  for (let i = 0; i < skaters.length; i++) {
    const { id, name, isu_slug } = skaters[i];
    try {
      const data = await scrapeIsuProfile(isu_slug);
      results.push({ id, name, data });
    } catch (err) {
      results.push({
        id,
        name,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Rate limit — skip delay after last item
    if (i < skaters.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
