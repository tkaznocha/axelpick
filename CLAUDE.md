# CLAUDE.md

## Project Overview

Axel Pick is a fantasy figure skating web application where users pick skaters, earn points from real competition results, and compete on leaderboards. Hosted at https://axelpick.app.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with React 18
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 3 with custom theme (emerald, sky, lavender, navy)
- **Database & Auth**: Supabase (PostgreSQL + Auth via `@supabase/ssr`)
- **Email**: Resend
- **AI**: Anthropic SDK
- **Analytics**: Vercel Analytics
- **Testing**: Vitest with jsdom + Testing Library
- **Linting**: ESLint (`next/core-web-vitals`, `next/typescript`)
- **Deployment**: Vercel

## Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run lint       # Run ESLint
npm test           # Run tests (vitest run)
npm run test:watch # Run tests in watch mode
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout (fonts, metadata)
│   ├── page.tsx             # Landing page
│   ├── login/               # Login page + auth actions
│   ├── admin/               # Admin panel (server actions)
│   ├── auth/                # Auth callback routes
│   ├── (app)/               # Authenticated route group
│   │   ├── layout.tsx       # App shell with nav
│   │   ├── dashboard/       # User dashboard
│   │   ├── events/[id]/     # Event pages (picks, results)
│   │   ├── skaters/[id]/    # Skater profiles
│   │   ├── leaderboard/     # Global leaderboard
│   │   ├── leagues/         # Private leagues (create, join, view)
│   │   ├── settings/        # User settings
│   │   └── how-to-play/     # Rules page
│   ├── privacy/             # Privacy policy
│   └── terms/               # Terms of service
├── components/              # Reusable UI components
├── lib/                     # Shared utilities
│   ├── supabase.ts          # Browser Supabase client
│   ├── supabase-server.ts   # Server-side Supabase client + auth helpers
│   ├── supabase-admin.ts    # Service-role Supabase client
│   ├── scoring.ts           # Points/scoring logic
│   ├── pricing.ts           # Skater pricing formulas
│   ├── isu-scraper.ts       # ISU website data scraper
│   ├── url.ts               # URL utilities
│   └── resize-image.ts      # Image processing
├── styles/                  # Global CSS
└── middleware.ts             # Auth middleware (route protection)
scripts/                     # One-off admin/data scripts
supabase/migrations/         # Database migration SQL files
```

## Key Conventions

- **Path alias**: `@/*` maps to `./src/*`
- **Server Actions**: Data mutations use Next.js Server Actions (`actions.ts` files colocated with pages)
- **Route groups**: `(app)` wraps all authenticated routes; middleware redirects unauthenticated users to `/login`
- **Supabase clients**: Use `supabase-server.ts` in Server Components/Actions, `supabase.ts` in Client Components, `supabase-admin.ts` for privileged operations
- **Fonts**: Plus Jakarta Sans (`font-display`) for headings, DM Sans (`font-body`) for body text
- **Tests**: Colocated in `__tests__/` directories next to the code they test

## Environment Variables

Required in `.env.local` (see `.env.local.example`):

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)
- `ADMIN_USER_ID` — Supabase auth user ID for admin access
- `ANTHROPIC_API_KEY` — Anthropic API key
