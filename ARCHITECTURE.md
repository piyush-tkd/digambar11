# ADR-001: Digambar11 Backend Architecture

**Status:** Accepted
**Date:** 2026-03-26
**Deciders:** Piyush

## Context

Digambar11 is a fantasy cricket app (IPL-focused) currently running as a static SPA with a mock API layer (`api.js`). We need a production-ready backend that handles auth, team management, live score ingestion from external APIs, real-time leaderboard updates, and wallet/prize distribution — all within a cost-effective budget for 2 months.

## Decision

**Supabase (free tier)** as the backend platform, with a **dual cricket data provider** strategy using CricketData.org (primary, cost-effective) and Sportmonks (secondary, higher quality).

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                   FRONTEND (Vercel)                       │
│          index.html + supabase-client.js                  │
│       ↓ Supabase JS SDK (auth + realtime + queries)       │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────┐
│                    SUPABASE                               │
│                                                           │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  AUTH    │  │ POSTGRES │  │ REALTIME │  │  EDGE    │  │
│  │ Google  │  │  10 tables│  │ Live push│  │FUNCTIONS │  │
│  │ OAuth   │  │  + RLS    │  │ to users │  │ 4 funcs  │  │
│  └─────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                ↓          │
│              ┌─────────────────────────────────┘          │
│              ▼                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          SCORE INGESTION ENGINE                      │ │
│  │                                                      │ │
│  │   Provider Router (tries primary, falls back)        │ │
│  │        ├── CricketData.org (primary, free/$6)        │ │
│  │        └── Sportmonks (fallback, €29/mo)             │ │
│  │                                                      │ │
│  │   ┌─ Normalizer ─→ Fantasy Points Calculator ─┐     │ │
│  │   └─────────────────→ Write to live_scores ───┘     │ │
│  │                        ↓                             │ │
│  │              Supabase Realtime pushes                 │ │
│  │              to all connected clients                 │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Dual Provider Strategy

### Why Two Providers?

| Dimension         | CricketData.org       | Sportmonks              |
|-------------------|-----------------------|-------------------------|
| Cost              | Free / $5.99/mo       | Free trial / €29/mo     |
| IPL Coverage      | Yes                   | Yes (Major plan)        |
| Ball-by-ball      | Yes                   | Yes                     |
| Fantasy-ready     | Yes (fantasy points)  | Yes (detailed stats)    |
| Rate Limits       | 100/day free          | Generous paid           |
| Data Quality      | Good                  | Excellent               |
| Reliability       | Good                  | Excellent               |

### Provider Router Logic

```
1. During development → CricketData.org free tier (100 calls/day)
2. During live IPL matches → Primary: CricketData.org paid ($6/mo)
                           → Fallback: Sportmonks (if primary fails/rate-limited)
3. For detailed stats    → Sportmonks (player profiles, season stats)
4. For live ball-by-ball → CricketData.org (cheaper per call)
```

### Normalized Data Model

Both providers return different JSON structures. The normalizer converts both into a unified format:

```json
{
  "match_id": "ipl-2026-28",
  "status": "live",
  "innings": 2,
  "score": { "runs": 145, "wickets": 3, "overs": 14.2 },
  "players": [
    {
      "external_id": "virat-kohli",
      "name": "Virat Kohli",
      "team": "RCB",
      "batting": { "runs": 62, "balls": 41, "fours": 7, "sixes": 2, "sr": 151.2 },
      "bowling": null,
      "fielding": { "catches": 1, "runouts": 0 },
      "fantasy_pts": 89.5
    }
  ]
}
```

## Fantasy Points Scoring System

| Event                    | Points |
|--------------------------|--------|
| Run scored               | +1     |
| Boundary (4)             | +1 bonus |
| Six                      | +2 bonus |
| 30 runs (bonus)          | +4     |
| 50 runs (half-century)   | +8     |
| 100 runs (century)       | +16    |
| Duck (0 runs, out)       | -2     |
| Wicket taken             | +25    |
| 3-wicket haul            | +4 bonus |
| 5-wicket haul            | +8 bonus |
| Maiden over              | +12    |
| Economy < 5 (min 2 ov)   | +6     |
| Economy 5-6              | +4     |
| Economy 6-7              | +2     |
| Economy > 10             | -6     |
| Catch taken              | +8     |
| Run out (direct)         | +12    |
| Run out (indirect)       | +6     |
| Stumping                 | +12    |
| Captain multiplier       | ×2     |
| Vice-captain multiplier  | ×1.5   |

## Database Schema

10 tables with Row Level Security (RLS):

1. **profiles** — User data (extends Supabase auth.users)
2. **matches** — IPL match schedule + status
3. **players** — Full IPL rosters (all 10 teams)
4. **match_players** — Players in a specific match (playing XI)
5. **user_teams** — User's selected 11 + captain/VC per match
6. **user_team_players** — Junction: which players in which user team
7. **contests** — Friend leagues with entry fee + prize pool
8. **contest_entries** — Who joined which contest
9. **live_scores** — Real-time player fantasy points per match
10. **transactions** — Wallet: deposits, entry fees, winnings

## Edge Functions

1. **score-ingestion** — Cron every 30s during live matches. Fetches from provider, normalizes, calculates fantasy points, writes to live_scores. Triggers realtime push.
2. **team-validation** — Called on team save. Validates 11 players, role minimums, max 4 overseas, ≤100 credits, captain ≠ VC.
3. **prize-distribution** — Called on match completion. Calculates rankings, distributes prize pool pro-rata (30/25/20/15/10% for top 5).
4. **shared/** — Common utilities: provider router, normalizer, fantasy calculator.

## Cost Estimate (2 months)

| Service           | Monthly   | 2-Month Total |
|-------------------|-----------|---------------|
| Supabase Free     | $0        | $0            |
| Vercel Free       | $0        | $0            |
| CricketData.org   | $6        | $12           |
| Sportmonks        | $0-29     | $0-58         |
| **Total**         | **$6-35** | **$12-70**    |

Recommendation: Start with CricketData.org paid ($6/mo) only. Add Sportmonks only if you need better data quality or CricketData.org has reliability issues during IPL.

## Action Items

1. [x] Design architecture (this document)
2. [ ] Create Supabase project and configure Google OAuth
3. [ ] Run database migrations (schema + RLS policies)
4. [ ] Deploy Edge Functions
5. [ ] Update frontend to use Supabase client instead of mock api.js
6. [ ] Sign up for CricketData.org API key
7. [ ] Test end-to-end with live IPL data
