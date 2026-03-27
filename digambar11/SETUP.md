# Digambar11 Backend Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **"New Project"**
3. Name: `digambar11`
4. Database password: (save this somewhere safe)
5. Region: **South Asia (Mumbai)** — closest to IPL users
6. Click **Create new project**

## Step 2: Get Your API Keys

1. Go to **Settings → API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** → e.g. `https://abcdefg.supabase.co`
   - **anon public key** → e.g. `eyJhbGciOiJIUzI1NiIs...`
   - **service_role key** → (keep this secret, for Edge Functions only)

## Step 3: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Go to **APIs & Services → Credentials**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URI: `https://YOUR_SUPABASE_URL/auth/v1/callback`
6. Copy the **Client ID** and **Client Secret**
7. In Supabase Dashboard → **Authentication → Providers → Google**
8. Enable Google, paste Client ID and Secret, save

## Step 4: Run Database Migrations

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy-paste the contents of `supabase/migrations/001_schema.sql`
4. Click **Run** ✓
5. Create another query, paste `supabase/migrations/002_seed_data.sql`
6. Click **Run** ✓

## Step 5: Configure Cricket Data APIs

### CricketData.org (Primary)
1. Sign up at [cricketdata.org](https://cricketdata.org)
2. Get your API key from the dashboard
3. In Supabase SQL Editor, run:
```sql
UPDATE provider_config
SET api_key = 'YOUR_ACTUAL_CRICKETDATA_KEY'
WHERE id = 'cricketdata';
```

### Sportmonks (Secondary/Fallback)
1. Sign up at [sportmonks.com](https://sportmonks.com)
2. Get your API token
3. In Supabase SQL Editor, run:
```sql
UPDATE provider_config
SET api_key = 'YOUR_ACTUAL_SPORTMONKS_TOKEN'
WHERE id = 'sportmonks';
```

## Step 6: Deploy Edge Functions

### Option A: Using Supabase CLI (Recommended)
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
cd digambar11
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy score-ingestion
supabase functions deploy team-validation
supabase functions deploy prize-distribution

# Set secrets
supabase secrets set CRON_SECRET=your-random-secret-string
```

### Option B: Via Supabase Dashboard
1. Go to **Edge Functions** in the dashboard
2. Create new function for each: `score-ingestion`, `team-validation`, `prize-distribution`
3. Copy-paste the code from `supabase/functions/*/index.ts`

## Step 7: Set Up Score Ingestion Cron

For live score updates every 30 seconds during matches, set up a cron job:

### Using Supabase Cron (built-in)
In SQL Editor, run:
```sql
SELECT cron.schedule(
  'score-ingestion',
  '*/1 * * * *',  -- every minute (Supabase cron minimum)
  $$
  SELECT net.http_post(
    'YOUR_SUPABASE_URL/functions/v1/score-ingestion',
    '{}',
    'application/json',
    ARRAY[http_header('Authorization', 'Bearer YOUR_CRON_SECRET')]
  );
  $$
);
```

### For 30-second updates (more frequent)
Use an external cron service like [cron-job.org](https://cron-job.org) (free) to hit the score-ingestion endpoint every 30 seconds during IPL match hours (3:30 PM - 11:30 PM IST).

## Step 8: Update Frontend

1. Open `public/index.html`
2. Change the script tag from:
   ```html
   <script src="./api.js"></script>
   ```
   to:
   ```html
   <script src="./supabase-client.js"></script>
   ```
3. Open `public/supabase-client.js`
4. Replace the config values:
   ```javascript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```

## Step 9: Deploy to Vercel

```bash
cd digambar11
git add -A
git commit -m "Add Supabase backend integration"
git push origin main
```

Then in Vercel, it auto-deploys from GitHub.

## Step 10: Test End-to-End

1. Open the app in your browser
2. Click "Sign in with Google" → should redirect to Google OAuth
3. Set your squad name → should save to Supabase
4. Navigate to a match → should load players from DB
5. Select 11 players → team validation Edge Function validates
6. During a live match → scores update in real-time via Supabase Realtime

## Architecture Quick Reference

| Component              | Technology                  | Cost      |
|-----------------------|----------------------------|-----------|
| Frontend              | Static HTML/JS on Vercel    | Free      |
| Auth                  | Supabase Google OAuth       | Free      |
| Database              | Supabase PostgreSQL         | Free      |
| Realtime              | Supabase Realtime           | Free      |
| Server Logic          | Supabase Edge Functions     | Free      |
| Live Scores (Primary) | CricketData.org             | $6/month  |
| Live Scores (Fallback)| Sportmonks                  | €29/month |
| Hosting               | Vercel                      | Free      |

## Switching Between Mock and Real Backend

- **Mock mode** (for offline dev): Use `<script src="./api.js"></script>`
- **Real mode** (production): Use `<script src="./supabase-client.js"></script>`

Both expose the same `window.D11API` interface, so the frontend code works identically with either.
