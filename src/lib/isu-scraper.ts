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
 * Build a map from <dt> text → <dd> text for the bio section.
 */
function parseBioFields($: cheerio.CheerioAPI): Map<string, string> {
  const fields = new Map<string, string>();
  $("dt").each((_, el) => {
    const key = $(el).text().trim().toLowerCase();
    const val = $(el).next("dd").text().trim();
    if (key && val) fields.set(key, val);
  });
  return fields;
}

/**
 * Extract music from sections headed by h4 containing "Music".
 * Returns [spMusic, fsMusic].
 */
function parseMusic($: cheerio.CheerioAPI): [string | null, string | null] {
  let spMusic: string | null = null;
  let fsMusic: string | null = null;

  // Look for headings (h3, h4, h5) containing music info
  $("h3, h4, h5").each((_, el) => {
    const heading = $(el).text().trim();
    if (!heading.toLowerCase().includes("music")) return;

    // Gather text from siblings until next heading
    const lines: string[] = [];
    let sibling = $(el).next();
    while (sibling.length && !sibling.is("h3, h4, h5")) {
      const text = sibling.text().trim();
      if (text) lines.push(text);
      sibling = sibling.next();
    }
    const musicText = lines.join("\n") || null;

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
 * Extract best scores. We look for text patterns like:
 * "Season Best Score Short Program" followed by event name, date, score.
 * Returns { season_best_sp, season_best_fs, personal_best_sp, personal_best_fs }
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

  // Get full page text and find score patterns
  const fullText = $("body").text();

  // Match patterns like "Personal Best Score Short Program" or "Season Best Score Free Skating"
  const patterns: Array<{
    regex: RegExp;
    key: keyof typeof scores;
  }> = [
    {
      regex:
        /personal\s+best\s+score\s+(?:short\s+program|rhythm\s+dance)[\s\S]*?(\d+\.\d+)/i,
      key: "personal_best_sp",
    },
    {
      regex:
        /personal\s+best\s+score\s+(?:free\s+skating|free\s+dance)[\s\S]*?(\d+\.\d+)/i,
      key: "personal_best_fs",
    },
    {
      regex:
        /season\s+best\s+score\s+(?:short\s+program|rhythm\s+dance)[\s\S]*?(\d+\.\d+)/i,
      key: "season_best_sp",
    },
    {
      regex:
        /season\s+best\s+score\s+(?:free\s+skating|free\s+dance)[\s\S]*?(\d+\.\d+)/i,
      key: "season_best_fs",
    },
  ];

  for (const { regex, key } of patterns) {
    const m = fullText.match(regex);
    if (m) scores[key] = parseFloat(m[1]);
  }

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
