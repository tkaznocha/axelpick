# Axel Pick — Claude Code Handoff

> **Version:** 2.0 · **Updated:** February 14, 2026
> **Target:** Preview round at ISU World Championships, Prague, March 24–29, 2026
> **Domain:** axelpick.app

---

## 1. Product Summary

Axel Pick is a free, ad-free fantasy league for ISU figure skating. Users pick skaters before each competition, earn points based on real results, and compete on global and private leaderboards.

The preview round launches at Worlds 2026 in Prague. The full season (GP Series → GP Final → Championships → Worlds) launches October 2026.

---

## 2. Brand

- **Name:** Axel Pick
- **Identity:** Northern Lights — aurora gradients on clean surfaces
- **Colors:** Emerald #00A572, Sky #0C8DCC, Lavender #7C5FD3 (light mode accents, darkened for contrast). Aurora gradient: `linear-gradient(135deg, #00C78A, #0EA5E9, #A78BFA)` for decorative use.
- **Light mode BG:** #F5F7FB, cards #FFFFFF, text #0A1628
- **Dark mode** (competition days): deep navy #0A1628 base, frosted glass panels
- **Fonts:** Plus Jakarta Sans (display/headings), DM Sans (body), JetBrains Mono (data/mono)
- **Style:** Frosted glass, subtle aurora glows, clean card-based UI, country flags as color accents

---

## 3. Game Rules

### 3.1 Core Rule
> Pick your skaters from the entry list and stay within budget. Points are based on placement, with bonuses for clean skates and personal bests. Bigger events = more picks and bigger points.

### 3.2 Event Tiers

| | GP Events (incl. GP Final) | Championships (4CC / Europeans) | Worlds |
|---|---|---|---|
| Picks | 4 | 6 | 8 |
| Budget | $30M | $50M | $70M |
| Points multiplier | 1× | 1.5× | 2× |

- No discipline restrictions — pick any skater (Men, Women, Pairs, Ice Dance)
- Picks lock when the first discipline's Short Program starts
- Fresh picks each event (no season-long roster)

### 3.3 Scoring (per skater, before multiplier)

**Placement:** 1st=25, 2nd=18, 3rd=15, 4th=12, 5th=10, 6th=8, 7th=6, 8th=4, 9th=2, 10th=1

**Bonuses:** SP top 3: +5/+3/+1 · Clean skate (0 falls): +3 · Personal best beaten: +5

**Penalties:** Fall: −2 per fall · Withdrawal after SP: −10

### 3.4 Skater Pricing

**Initial price** based on ISU World Standings: #1–5 = $12M–$15M, #6–15 = $8M–$12M, #16–30 = $5M–$8M, #31+ = $2M–$5M. Floor $2M, ceiling $18M. Pairs/couples priced as one unit.

**Price fluctuation** after each event: exceeded expectations → +1–3M, met → no change, underperformed → −1–3M.

### 3.5 Leaderboards
- Global season leaderboard (cumulative)
- Private leagues (create/join with invite code)
- Per-event leaderboard

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + Tailwind |
| Hosting | Vercel |
| Auth | Supabase Auth (email + Google) |
| Database | Supabase Postgres + RLS |
| Data Ingestion | Semi-automated admin panel (MVP) |
| Donations | Stripe or Buy Me a Coffee (post-MVP) |

---

## 5. Database Schema

```sql
CREATE TABLE skaters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isu_id TEXT UNIQUE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  discipline TEXT NOT NULL, -- 'men', 'women', 'pairs', 'ice_dance'
  photo_url TEXT,
  current_price INTEGER DEFAULT 5000000,
  world_ranking INTEGER,
  season_best_score DECIMAL,
  personal_best_score DECIMAL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isu_id TEXT UNIQUE,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'gp', 'championship', 'worlds'
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  picks_limit INTEGER NOT NULL,
  budget INTEGER NOT NULL,
  points_multiplier DECIMAL NOT NULL,
  picks_lock_at TIMESTAMPTZ,
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'locked', 'in_progress', 'completed'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE event_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  skater_id UUID REFERENCES skaters(id),
  price_at_event INTEGER NOT NULL,
  UNIQUE(event_id, skater_id)
);

CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  skater_id UUID REFERENCES skaters(id),
  final_placement INTEGER,
  sp_placement INTEGER,
  total_score DECIMAL,
  sp_score DECIMAL,
  fs_score DECIMAL,
  falls INTEGER DEFAULT 0,
  is_personal_best BOOLEAN DEFAULT false,
  is_withdrawal BOOLEAN DEFAULT false,
  fantasy_points_raw INTEGER,
  fantasy_points_final INTEGER,
  UNIQUE(event_id, skater_id)
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  total_season_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  skater_id UUID REFERENCES skaters(id),
  picked_at TIMESTAMPTZ DEFAULT now(),
  points_earned INTEGER,
  UNIQUE(user_id, event_id, skater_id)
);

CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE league_members (
  league_id UUID REFERENCES leagues(id),
  user_id UUID REFERENCES users(id),
  PRIMARY KEY (league_id, user_id)
);

CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skater_id UUID REFERENCES skaters(id),
  event_id UUID REFERENCES events(id),
  price_before INTEGER,
  price_after INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_event_entries_event ON event_entries(event_id);
CREATE INDEX idx_results_event ON results(event_id);
CREATE INDEX idx_user_picks_user_event ON user_picks(user_id, event_id);
CREATE INDEX idx_league_members_user ON league_members(user_id);
CREATE INDEX idx_skaters_discipline ON skaters(discipline);
CREATE INDEX idx_events_status ON events(status);
```

### RLS Policies
```sql
ALTER TABLE user_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own picks" ON user_picks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Picks only before lock" ON user_picks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE id = event_id
      AND (picks_lock_at IS NULL OR picks_lock_at > now())
    )
  );
```

---

## 6. API Routes

```
GET  /api/events                    — list events with status
GET  /api/events/[id]               — event detail + entry list with prices
GET  /api/events/[id]/results       — results + fantasy points
GET  /api/skaters                   — all skaters with current prices
GET  /api/skaters/[id]              — skater detail + history

POST /api/picks                     — submit picks for an event
GET  /api/picks/[eventId]           — get user's picks for an event

GET  /api/leaderboard               — global season leaderboard
GET  /api/leaderboard/[leagueId]    — league leaderboard

POST /api/leagues                   — create league
POST /api/leagues/join              — join league with invite code

POST /api/admin/ingest-entries      — (admin) import entry list
POST /api/admin/ingest-results      — (admin) import results + calculate points
POST /api/admin/update-prices       — (admin) recalculate skater prices
```

---

## 7. Page Map

```
/                        — Landing page (already built, deploy as-is)
/dashboard               — User home: upcoming event, current picks, season stats
/events                  — Season calendar with event cards
/events/[id]             — Event page: entry list, pick skaters, budget tracker
/events/[id]/results     — Results + points breakdown
/leaderboard             — Global season leaderboard
/leagues                 — User's leagues
/leagues/[id]            — League leaderboard
/leagues/create          — Create new league
/leagues/join/[code]     — Join via invite link
/skaters                 — Browse skaters (filter by discipline)
/skaters/[id]            — Skater profile: stats, price history
/how-to-play             — Rules page
/admin                   — Admin panel (create events, import data)
```

---

## 8. Fantasy Points Calculation

```javascript
function calculateFantasyPoints(result, event) {
  let points = 0;
  const placementMap = {
    1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
    6: 8, 7: 6, 8: 4, 9: 2, 10: 1
  };
  points += placementMap[result.final_placement] || 0;

  const spBonusMap = { 1: 5, 2: 3, 3: 1 };
  points += spBonusMap[result.sp_placement] || 0;

  if (result.falls === 0) points += 3;
  if (result.is_personal_best) points += 5;
  points -= result.falls * 2;
  if (result.is_withdrawal) points -= 10;

  return {
    raw: points,
    final: Math.round(points * event.points_multiplier)
  };
}
```

---

## 9. Data Sources

- **ISU Results API:** `https://api.isuresults.eu/` — JSON endpoints for events, competitors, results (may be speed skating focused)
- **ISU Skating site:** `https://isu-skating.com/figure-skating/` — skater profiles, event entries, results (React frontend, possible JSON API behind it)
- **isuresults.com:** HTML tables with competition results, consistent URL patterns, scrapeable with cheerio
- **SkatingScores.com:** comprehensive stats database, potential collaboration partner

### MVP approach: semi-automated
Admin manually creates events and triggers result imports via admin panel. Entry lists published 2-3 weeks before events. Results imported after competition, admin reviews before publishing.

---

## 10. MVP Scope for Prague Preview

**Must have (before March 22):**
- [ ] Auth (email + Google)
- [ ] Single event page: Worlds 2026 Prague
- [ ] Entry list with skater cards, prices, country flags
- [ ] Pick flow: select skaters → budget tracker → lock picks
- [ ] Results page with points breakdown (populated after competition)
- [ ] Global leaderboard for Worlds
- [ ] Admin panel: create event, import entries, import results
- [ ] How to play / rules page
- [ ] Landing page (already done — integrate or redirect)

**Nice to have:**
- [ ] Private leagues
- [ ] Skater profiles with stats
- [ ] Shareable pick cards

**Post-preview (for October season launch):**
- [ ] Season calendar
- [ ] Price fluctuation system
- [ ] League management
- [ ] Email notifications
- [ ] PWA support

---

## 11. Claude Code Build Sequence

### Step 1: Scaffold
```
Read docs/axelpick-handoff.md — this is the full spec for Axel Pick, 
a fantasy figure skating league. 

Initialize a Next.js 14 project with Tailwind, TypeScript, and 
Supabase. Set up the file structure. Create the Supabase migration 
file from the database schema in Section 5 (all tables). Set up the 
environment variables template.

Use Plus Jakarta Sans for display headings, DM Sans for body text, 
and JetBrains Mono for data/mono. Color palette from Section 2.

Don't build any features yet — just the skeleton, DB schema, and 
auth config.
```

### Step 2: Auth + User Profile
```
Build the auth flow: email signup/login + Google OAuth via 
Supabase Auth. After signup, create a user record in the users 
table with display_name from the auth profile. Build a simple 
/dashboard page that shows the logged-in user's name and a 
placeholder for upcoming events.
```

### Step 3: Admin Panel
```
Build /admin with a simple admin check (hardcode your user ID for 
now). The admin panel needs:
1. Create Event form (name, type, dates, picks_limit, budget, 
   multiplier, picks_lock_at)
2. Import Entries: paste a JSON array of {skater_name, country, 
   discipline, world_ranking, price} and create skater + 
   event_entry records
3. Import Results: paste JSON array of {skater_name, placement, 
   sp_placement, total_score, falls, is_personal_best, 
   is_withdrawal} and calculate fantasy points
```

### Step 4: Pick Flow (Core Game Loop)
```
Build /events/[id] — the main game screen:
1. Show event info header (name, location, dates, budget, picks 
   allowed)
2. Entry list as skater cards: photo placeholder, name, country 
   flag emoji, discipline badge, price, world ranking
3. Filter/sort by discipline, price, ranking
4. Click to add/remove from team
5. Sticky budget bar showing: picks used / allowed, budget 
   remaining, "Lock Picks" button
6. Lock picks button: validate (correct count, within budget), 
   save to user_picks, show confirmation
7. After picks_lock_at: show picks as read-only
Use the brand colors — emerald for primary actions, aurora 
gradient for the lock button.
```

### Step 5: Results + Leaderboard
```
Build /events/[id]/results:
1. Show each skater's result: placement, scores, fantasy points 
   breakdown (base + SP bonus + clean skate + PB − falls)
2. Highlight the user's picked skaters
3. Show user's total points for this event

Build /leaderboard:
1. Global ranking: all users sorted by total_season_points
2. Show rank, display_name, total points
3. Highlight current user's position
```

### Step 6: Landing + How to Play
```
Integrate the existing landing page at / (the HTML file in 
docs/axelpick-landing.html). Wire up the email signup to a 
Supabase 'waitlist' table.

Build /how-to-play with the game rules from Section 3 of the 
spec, presented in a clean, visual way with the brand styling.
```

---

## 12. Repo Structure

```
axelpick/
├── docs/
│   ├── axelpick-handoff.md          ← this file
│   └── axelpick-landing.html        ← landing page
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── src/
│   ├── app/
│   │   ├── page.tsx                 ← landing
│   │   ├── dashboard/
│   │   ├── events/
│   │   │   └── [id]/
│   │   │       ├── page.tsx         ← pick screen
│   │   │       └── results/
│   │   ├── leaderboard/
│   │   ├── leagues/
│   │   ├── skaters/
│   │   ├── how-to-play/
│   │   └── admin/
│   ├── components/
│   │   ├── SkaterCard.tsx
│   │   ├── BudgetBar.tsx
│   │   ├── PickButton.tsx
│   │   ├── LeaderboardRow.tsx
│   │   └── EventCard.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── scoring.ts               ← fantasy points calc
│   │   └── pricing.ts               ← skater pricing logic
│   └── styles/
│       └── globals.css
├── public/
│   └── flags/                       ← country flag SVGs
├── .env.local.example
├── tailwind.config.ts
└── package.json
```

---

*Ready to build. Drop this file into your repo root and reference it in Claude Code.*
