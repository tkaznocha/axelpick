# ISU API Research: Event Entries & Results

Research into whether the International Skating Union (ISU) provides a public API for accessing event entries and results.

## Summary

| Source | Type | Sport | Auth | Status |
|--------|------|-------|------|--------|
| `api.isuresults.eu` | REST/JSON API | Speed Skating | None documented | **Public, working** |
| `isu-skating.com` internal API | Next.js data routes | All disciplines | Undocumented | **Exists but undocumented** |
| ISU mobile app backend | Unknown | All disciplines | Unknown | **Exists but undocumented** |
| `isuresults.com` | HTML + PDF | Figure Skating | N/A | **No API, web scraping only** |
| `results.isu.org` | HTML + PDF | Figure Skating | N/A | **No API, web scraping only** |
| DataSportsGroup (`dsg-api.com`) | REST API (XML/JSON) | Figure Skating + others | API key + password | **Commercial ($500+/mo)** |

**Key finding: There is NO official public JSON API for ISU figure skating entries/results.** Speed skating has one at `api.isuresults.eu`.

---

## 1. Speed Skating API: `api.isuresults.eu` (Official, Public)

The ISU operates a public REST API for speed skating results with Swagger documentation.

- **Swagger docs**: https://api.isuresults.eu/docs/
- **System docs**: https://docs.isuresults.eu/
- **Format**: JSON, paginated (`count`, `next`, `previous`, `results`)
- **Authentication**: None documented (open access)

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events/?season={year}` | List events for a season |
| GET | `/events/{isuId}/competitions/` | Competitions within an event |
| GET | `/events/{isuId}/competitions/{id}/results/?inSeconds=0` | Race results (times, rankings, laps) |
| GET | `/events/{isuId}/competitors/` | Competitors for an event |
| GET | `/events/{isuId}/teams/` | Teams for an event |
| GET | `/events/{isuId}/championships/` | Championship info |
| GET | `/tracks/{id}/` | Track details (city, country, coordinates, altitude) |
| GET | `/skaters/{id}/personal-best/` | Skater personal bests |

### Event ID format

ISU IDs follow the pattern `{year}_{country}_{sequence}`, e.g. `2022_NED_0002`.

### Example event object fields

```
id, name, isuShortName, nationalFederation, isuId, start, end, season,
tags (e.g. "world-cup", "senior", "final"),
track: { name, city, country, timezone, altitude, latitude, longitude }
competitorsUrl, teamsUrl, competitionsUrl, championshipsUrl
```

### Example result object fields

```
id, type, competitor: { skater: { firstName, lastName, country, gender, dateOfBirth } },
startNumber, startLane, rank, status, time, timeBehind,
laps: [{ number, time, passageTime, rank }]
```

### Known issues (from community)

- Live events may have incomplete data
- Mass Start competitions have data format inconsistencies

### Community wrapper

- GitHub: [ich95/isuresults](https://github.com/ich95/isuresults) - Python project for querying this API

---

## 2. Figure Skating: No Official Public API

The ISU does **not** provide an official public REST/JSON API for figure skating results. Data is distributed through:

### 2a. `isuresults.com` (HTML + PDF)

- **Event results**: `https://www.isuresults.com/results/season{YYZZ}/{event_code}/`
  - Example: `https://www.isuresults.com/results/season2526/gpf2025/`
  - URL pattern: `season{start_year_2digit}{end_year_2digit}/{event_code}/`
- **World standings**: `http://www.isuresults.com/ws/ws/wsmen.htm` (HTML tables)
- **Judge protocols**: Published as PDFs with patterns like `*_JudgesDetailsperSkater.pdf`
- **Format**: HTML pages and PDF documents only - no JSON/XML API

### 2b. `results.isu.org`

- Hosts event results, primarily HTML
- PDF protocols: `https://results.isu.org/results/season{YYZZ}/{event_code}/...pdf`
- Example: `https://results.isu.org/results/season2526/owg2026/`

### 2c. `isu-skating.com` (Next.js frontend - undocumented internal API)

The official ISU "Home of Skating" website is built with **Next.js** (confirmed by default error messages observed in production). As a Next.js app, it almost certainly fetches data from internal API routes, but these are not publicly documented.

- **Events**: https://isu-skating.com/figure-skating/events/
- **Results**: https://isu-skating.com/figure-skating/results/
- **Standings**: https://isu-skating.com/figure-skating/world-standings/
- **Skater profiles**: https://isu-skating.com/skaters/

To discover internal endpoints, one would need to inspect network requests in browser DevTools while browsing the site. Likely patterns:
- `/_next/data/{build_id}/...` (Next.js SSR data routes)
- `/api/...` (Next.js API routes)
- Or external CMS/backend API calls

### 2d. ISU Mobile App (undocumented backend)

The ISU has an official mobile app ("ISU Home of Skating Official"):
- **Android package**: `org.isu.app.mobile`
- **Features**: Live results, rankings, event schedules, entries, skater profiles
- The app's backend API endpoints are not documented publicly
- Would require MITM proxy (mitmproxy, Charles) or APK decompilation (JADX) to discover

---

## 3. Third-Party / Commercial Options

### 3a. DataSportsGroup (Commercial)

- **Base URL**: `https://dsg-api.com`
- **Format**: XML (default), JSON optional (`&ftype=json`)
- **Auth**: 3-layer (API key + password + domain whitelist)
- **Pricing**: Not public, estimated $500-1000+/month
- **Contact**: sales@datasportsgroup.com

Known figure skating endpoints (following DSG standard patterns):
- `get_rounds` (confirmed, method_id: 1088)
- `get_results`, `get_competitions`, `get_contestants`, `get_seasons`, `get_areas`, `get_disciplines`, `get_medals`, `get_peoples`, `get_venue` (inferred from other sports)

Coverage: European Championships, World Championships, Winter Olympics, Grand Prix events.

### 3b. SkatingScores.com

- **URL**: https://skatingscores.com/
- Has a "Database Queries" feature for searching figure skating elements and competition results
- Covers all major ISU events since 2003 (IJS/CoP era)
- Over 2 million elements across 17 seasons
- **No public API** - browser-based queries only

### 3c. SpeedskatingResults.com

- Has a simple API for speed skating competition lists per skater
- URL pattern: `https://speedskatingresults.com/index.php?p=209`
- Speed skating only

---

## 4. Open Source Data Projects

### Active / Recent

| Repository | Description | Approach | Coverage |
|------------|-------------|----------|----------|
| [mayupei/isu-figure-skating-competitions-web-scraper](https://github.com/mayupei/isu-figure-skating-competitions-web-scraper) | 7-step pipeline scraping ISU figure skating results | HTML scraping + PDF parsing from `isuresults.com` | 2004-2025 (379 competitions) |
| [MarsToGotlibre/isu-score-parser](https://github.com/MarsToGotlibre/isu-score-parser) | Extract score tables from ISU PDF protocols | PDF parsing (camelot-py, pdfplumber) | PDFs from 2005+ |
| [ich95/isuresults](https://github.com/ich95/isuresults) | Python wrapper for speed skating API | REST API client for `api.isuresults.eu` | Current speed skating |

### Historical / Archived

| Repository | Description | Coverage |
|------------|-------------|----------|
| [BuzzFeedNews/figure-skating-scores](https://github.com/BuzzFeedNews/figure-skating-scores) | ISU protocol PDFs parsed to JSON/CSV (MIT + CC BY 4.0) | Oct 2016 - Dec 2017 |
| [BuzzFeedNews/2018-02-figure-skating-analysis](https://github.com/BuzzFeedNews/2018-02-figure-skating-analysis) | Judge bias analysis with standardized judge data | Historical |

---

## 5. Recommendations for AxelPick

Given the findings, the practical options for accessing ISU event data are:

1. **Speed skating**: Use `api.isuresults.eu` directly - it's public, documented, and returns clean JSON.

2. **Figure skating entries/results**: The most viable approaches are:
   - **Scrape `isu-skating.com`**: Reverse-engineer the Next.js site's internal API by inspecting browser network traffic. This is likely the most complete and up-to-date data source.
   - **Scrape `isuresults.com`**: Parse HTML pages and PDF protocols. Well-established approach with existing open-source tools.
   - **ISU mobile app API**: Intercept network traffic from the official app to discover JSON endpoints. The app provides entries, live results, and standings - suggesting a clean API exists behind it.

3. **Commercial option**: DataSportsGroup provides a structured API but at significant cost ($500+/month).

### Suggested investigation next steps

1. Use browser DevTools on `isu-skating.com` to capture XHR/fetch requests and document the internal API endpoints
2. Inspect the ISU mobile app's network traffic using a proxy to find backend API endpoints
3. Evaluate whether the `isu-skating.com` or app API provides entries data (start lists) in addition to results
