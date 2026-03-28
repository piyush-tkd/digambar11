// ============================================================
// Edge Function: Live Score
// Multi-provider live score ingestion for IPL matches.
//
// Provider waterfall:
//   1. CricketData.org (paid plan) — currentMatches + match_scorecard
//   2. Sportmonks Cricket API — /livescores with runs include
//
// Both API keys read from `provider_config` table:
//   - id='cricketdata' → CricketData.org key
//   - id='sportmonks'  → Sportmonks API token
//
// Called periodically (every 30-60s during live matches).
// Updates `matches` table → Supabase Realtime pushes to all clients.
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ─── IPL Team Resolution ────────────────────────────────────
const TEAM_ALIASES: Record<string, string[]> = {
  CSK:  ['chennai super kings', 'chennai', 'csk', 'che'],
  MI:   ['mumbai indians', 'mumbai', 'mi', 'mum'],
  RCB:  ['royal challengers', 'royal challengers bengaluru', 'royal challengers bangalore', 'bangalore', 'bengaluru', 'rcb', 'ban'],
  KKR:  ['kolkata knight riders', 'kolkata', 'kkr', 'kol'],
  DC:   ['delhi capitals', 'delhi', 'dc', 'del'],
  SRH:  ['sunrisers hyderabad', 'hyderabad', 'srh', 'hyd', 'sunrisers'],
  RR:   ['rajasthan royals', 'rajasthan', 'rr', 'raj'],
  PBKS: ['punjab kings', 'punjab', 'pbks', 'pun', 'pk'],
  GT:   ['gujarat titans', 'gujarat', 'gt', 'guj'],
  LSG:  ['lucknow super giants', 'lucknow', 'lsg', 'luc'],
};

function resolveTeamCode(name: string): string | null {
  if (!name) return null;
  const upper = name.toUpperCase().trim();
  if (TEAM_ALIASES[upper]) return upper;

  const lower = name.toLowerCase().trim();
  for (const [code, aliases] of Object.entries(TEAM_ALIASES)) {
    for (const alias of aliases) {
      if (lower === alias || lower.includes(alias) || alias.includes(lower)) return code;
    }
  }
  return null;
}

// ─── Status Mapping ─────────────────────────────────────────
function mapStatus(raw: string): string {
  const s = (raw || '').toLowerCase();
  if (s.includes('won') || s.includes('result') || s.includes('completed') || s === 'match over') return 'completed';
  if (s.includes('live') || s.includes('break') || s.includes('innings') || s.includes('timeout') || s.includes('in progress')) return 'live';
  if (s.includes('abandon') || s.includes('no result')) return 'abandoned';
  if (s.includes('upcoming') || s.includes('not started') || s.includes('scheduled') || s === '') return 'upcoming';
  return 'live'; // default for unknown active states
}

// ─── Provider Config ────────────────────────────────────────
async function getProviderKey(providerId: string): Promise<{ apiKey: string; baseUrl: string } | null> {
  const { data } = await supabase
    .from('provider_config')
    .select('api_key, base_url')
    .eq('id', providerId)
    .single();
  if (data?.api_key) return { apiKey: data.api_key, baseUrl: data.base_url || '' };
  return null;
}

// ─── DB Helpers ─────────────────────────────────────────────
async function getDbLiveMatches() {
  const { data } = await supabase
    .from('matches')
    .select('id, external_id, team_a, team_b, status, starts_at')
    .in('status', ['live', 'upcoming']);
  return data || [];
}

function findDbMatch(dbMatches: any[], codeA: string, codeB: string) {
  return dbMatches.find(m =>
    (m.team_a === codeA && m.team_b === codeB) ||
    (m.team_a === codeB && m.team_b === codeA)
  );
}

async function updateMatch(dbId: string, scoreA: string, scoreB: string, status: string, result: string | null, source: string) {
  const { error } = await supabase
    .from('matches')
    .update({
      score_a: scoreA,
      score_b: scoreB,
      status,
      result,
      status_note: result,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dbId);
  if (error) console.error(`DB update failed [${source}]:`, error);
  return !error;
}

// ═══════════════════════════════════════════════════════════
// PROVIDER 1: CricketData.org
// API: https://api.cricapi.com/v1
// Endpoints: currentMatches (all live), match_info, match_scorecard
// Score format: score[].r (runs), .w (wickets), .o (overs), .inning
// ═══════════════════════════════════════════════════════════
async function fetchCricketData(dbMatches: any[]): Promise<{ results: any[]; error?: string }> {
  const config = await getProviderKey('cricketdata');
  if (!config?.apiKey) return { results: [], error: 'No CricketData API key in provider_config' };

  const BASE = config.baseUrl || 'https://api.cricapi.com/v1';
  const results: any[] = [];

  try {
    // Fetch all current matches
    const url = `${BASE}/currentMatches?apikey=${config.apiKey}&offset=0`;
    console.log('[CricketData] Fetching currentMatches...');

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'failure') {
      console.error('[CricketData] API failure:', data.reason);
      return { results: [], error: `CricketData: ${data.reason}` };
    }

    const matches = data.data || [];
    console.log(`[CricketData] Got ${matches.length} current matches`);

    // Filter for IPL
    for (const m of matches) {
      const series = (m.series || '').toLowerCase();
      const isIPL = series.includes('ipl') || series.includes('indian premier league');

      // Resolve teams
      const t1 = m.teamInfo?.[0]?.shortname || m.teams?.[0] || '';
      const t2 = m.teamInfo?.[1]?.shortname || m.teams?.[1] || '';
      const code1 = resolveTeamCode(t1);
      const code2 = resolveTeamCode(t2);

      // Skip if not IPL and not both IPL teams
      if (!isIPL && !(code1 && code2)) continue;
      if (!code1 || !code2) continue;

      // Find DB match
      const dbMatch = findDbMatch(dbMatches, code1, code2);
      if (!dbMatch) {
        console.log(`[CricketData] No DB match for ${code1} vs ${code2}`);
        continue;
      }

      // Parse scores from score array
      const scoreMap: Record<string, string> = {};
      if (Array.isArray(m.score) && m.score.length > 0) {
        for (const s of m.score) {
          const inningTeam = resolveTeamCode(s.inning?.split(' ')?.[0] || '');
          if (inningTeam) {
            scoreMap[inningTeam] = `${s.r}/${s.w} (${s.o})`;
          }
        }
      }

      const scoreA = scoreMap[dbMatch.team_a] || 'Yet to bat';
      const scoreB = scoreMap[dbMatch.team_b] || 'Yet to bat';
      const status = mapStatus(m.status || m.matchType || '');
      const result = m.status || null;

      const ok = await updateMatch(dbMatch.id, scoreA, scoreB, status, result, 'cricketdata');
      if (ok) {
        console.log(`[CricketData] ✓ ${dbMatch.team_a} ${scoreA} vs ${dbMatch.team_b} ${scoreB} [${status}]`);
        results.push({
          match_id: dbMatch.id,
          teams: `${dbMatch.team_a} vs ${dbMatch.team_b}`,
          score_a: scoreA,
          score_b: scoreB,
          status,
          result,
          source: 'cricketdata',
        });
      }
    }

    // If no IPL in currentMatches, try individual match lookups for live DB matches
    if (results.length === 0) {
      console.log('[CricketData] No IPL in currentMatches, trying match_info for live matches...');
      const liveOnly = dbMatches.filter(m => m.status === 'live');

      for (const dbm of liveOnly) {
        if (!dbm.external_id) continue;
        try {
          const miUrl = `${BASE}/match_info?apikey=${config.apiKey}&id=${dbm.external_id}`;
          const miRes = await fetch(miUrl);
          const miData = await miRes.json();

          if (miData.status !== 'success' || !miData.data) continue;
          const md = miData.data;

          const scoreMap: Record<string, string> = {};
          if (Array.isArray(md.score)) {
            for (const s of md.score) {
              const code = resolveTeamCode(s.inning?.split(' ')?.[0] || '');
              if (code) scoreMap[code] = `${s.r}/${s.w} (${s.o})`;
            }
          }

          const scoreA = scoreMap[dbm.team_a] || 'Yet to bat';
          const scoreB = scoreMap[dbm.team_b] || 'Yet to bat';
          const status = mapStatus(md.status || '');
          const result = md.status || null;

          const ok = await updateMatch(dbm.id, scoreA, scoreB, status, result, 'cricketdata_direct');
          if (ok) {
            console.log(`[CricketData] ✓ direct: ${dbm.team_a} ${scoreA} vs ${dbm.team_b} ${scoreB}`);
            results.push({
              match_id: dbm.id,
              teams: `${dbm.team_a} vs ${dbm.team_b}`,
              score_a: scoreA,
              score_b: scoreB,
              status,
              result,
              source: 'cricketdata_direct',
            });
          }
        } catch (e) {
          console.warn(`[CricketData] match_info failed for ${dbm.external_id}:`, e);
        }
      }
    }

    return { results };

  } catch (err) {
    console.error('[CricketData] Fetch error:', err);
    return { results: [], error: String(err) };
  }
}

// ═══════════════════════════════════════════════════════════
// PROVIDER 2: Sportmonks Cricket API
// API: https://cricket.sportmonks.com/api/v2.0
// Endpoints: /livescores?include=runs,batting,bowling
// Auth: ?api_token=TOKEN
// ═══════════════════════════════════════════════════════════
async function fetchSportmonks(dbMatches: any[]): Promise<{ results: any[]; error?: string }> {
  const config = await getProviderKey('sportmonks');
  if (!config?.apiKey) return { results: [], error: 'No Sportmonks API token in provider_config' };

  const BASE = config.baseUrl || 'https://cricket.sportmonks.com/api/v2.0';
  const results: any[] = [];

  try {
    // Fetch live scores with runs include
    const url = `${BASE}/livescores?api_token=${config.apiKey}&include=runs,batting,bowling`;
    console.log('[Sportmonks] Fetching livescores...');

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error('[Sportmonks] API error:', data.error);
      return { results: [], error: `Sportmonks: ${JSON.stringify(data.error)}` };
    }

    const matches = data.data || [];
    console.log(`[Sportmonks] Got ${matches.length} live matches`);

    for (const m of matches) {
      // Extract team names from localteam/visitorteam
      const localTeam = m.localteam?.name || m.localteam?.code || '';
      const visitorTeam = m.visitorteam?.name || m.visitorteam?.code || '';
      const code1 = resolveTeamCode(localTeam);
      const code2 = resolveTeamCode(visitorTeam);

      if (!code1 || !code2) continue;

      const dbMatch = findDbMatch(dbMatches, code1, code2);
      if (!dbMatch) continue;

      // Parse scores from runs include
      const scoreMap: Record<string, string> = {};
      const runs = m.runs?.data || m.runs || [];

      if (Array.isArray(runs)) {
        for (const r of runs) {
          // Sportmonks runs: team_id, score, wickets, overs
          let teamCode: string | null = null;
          if (r.team_id === m.localteam_id) teamCode = code1;
          else if (r.team_id === m.visitorteam_id) teamCode = code2;

          if (teamCode && r.score !== undefined) {
            scoreMap[teamCode] = `${r.score}/${r.wickets} (${r.overs})`;
          }
        }
      }

      // Fallback: use localteam_dl_data / visitorteam_dl_data or score fields
      if (Object.keys(scoreMap).length === 0) {
        if (m.localteam_dl_data?.score !== undefined) {
          scoreMap[code1] = `${m.localteam_dl_data.score}/${m.localteam_dl_data.wickets || 0}`;
        }
        if (m.visitorteam_dl_data?.score !== undefined) {
          scoreMap[code2] = `${m.visitorteam_dl_data.score}/${m.visitorteam_dl_data.wickets || 0}`;
        }
      }

      const scoreA = scoreMap[dbMatch.team_a] || 'Yet to bat';
      const scoreB = scoreMap[dbMatch.team_b] || 'Yet to bat';
      const status = mapStatus(m.status || '');
      const result = m.note || m.status || null;

      const ok = await updateMatch(dbMatch.id, scoreA, scoreB, status, result, 'sportmonks');
      if (ok) {
        console.log(`[Sportmonks] ✓ ${dbMatch.team_a} ${scoreA} vs ${dbMatch.team_b} ${scoreB} [${status}]`);
        results.push({
          match_id: dbMatch.id,
          teams: `${dbMatch.team_a} vs ${dbMatch.team_b}`,
          score_a: scoreA,
          score_b: scoreB,
          status,
          result,
          source: 'sportmonks',
        });
      }
    }

    // If no live scores, also try fixtures endpoint for today
    if (results.length === 0 && matches.length === 0) {
      console.log('[Sportmonks] No livescores, trying today fixtures...');
      const today = new Date().toISOString().split('T')[0];
      const fUrl = `${BASE}/fixtures?api_token=${config.apiKey}&filter[starts_between]=${today},${today}&include=runs`;
      try {
        const fRes = await fetch(fUrl);
        const fData = await fRes.json();
        const fixtures = fData.data || [];
        console.log(`[Sportmonks] Today fixtures: ${fixtures.length}`);

        for (const f of fixtures) {
          const lt = resolveTeamCode(f.localteam?.name || '');
          const vt = resolveTeamCode(f.visitorteam?.name || '');
          if (!lt || !vt) continue;

          const dbMatch = findDbMatch(dbMatches, lt, vt);
          if (!dbMatch) continue;

          // If fixture has live/completed status, update
          const fStatus = mapStatus(f.status || '');
          if (fStatus === 'upcoming') continue;

          const scoreMap: Record<string, string> = {};
          const fRuns = f.runs?.data || [];
          for (const r of fRuns) {
            let tc: string | null = null;
            if (r.team_id === f.localteam_id) tc = lt;
            else if (r.team_id === f.visitorteam_id) tc = vt;
            if (tc && r.score !== undefined) scoreMap[tc] = `${r.score}/${r.wickets} (${r.overs})`;
          }

          const scoreA = scoreMap[dbMatch.team_a] || 'Yet to bat';
          const scoreB = scoreMap[dbMatch.team_b] || 'Yet to bat';

          await updateMatch(dbMatch.id, scoreA, scoreB, fStatus, f.note || null, 'sportmonks_fixture');
          results.push({
            match_id: dbMatch.id,
            teams: `${dbMatch.team_a} vs ${dbMatch.team_b}`,
            score_a: scoreA,
            score_b: scoreB,
            status: fStatus,
            source: 'sportmonks_fixture',
          });
        }
      } catch (fErr) {
        console.warn('[Sportmonks] Fixtures fetch failed:', fErr);
      }
    }

    return { results };

  } catch (err) {
    console.error('[Sportmonks] Fetch error:', err);
    return { results: [], error: String(err) };
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== Live Score Update Started ===');

    // Get all live/upcoming matches from DB
    const dbMatches = await getDbLiveMatches();
    console.log(`DB has ${dbMatches.length} live/upcoming matches`);

    if (dbMatches.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No live/upcoming matches in DB',
        matches_updated: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Provider waterfall (respects is_primary flag) ──
    // Sportmonks is primary, CricketData is fallback
    let allResults: any[] = [];
    const errors: string[] = [];

    // 1. Try Sportmonks FIRST (is_primary=true in provider_config)
    console.log('--- Provider 1: Sportmonks (primary) ---');
    const sm = await fetchSportmonks(dbMatches);
    if (sm.results.length > 0) {
      allResults.push(...sm.results);
      console.log(`[Sportmonks] Updated ${sm.results.length} matches`);
    }
    if (sm.error) errors.push(sm.error);

    // 2. Try CricketData for any matches Sportmonks didn't cover
    const updatedIds = new Set(allResults.map(r => r.match_id));
    const remainingMatches = dbMatches.filter(m => !updatedIds.has(m.id));

    if (remainingMatches.length > 0 || allResults.length === 0) {
      console.log(`--- Provider 2: CricketData (${remainingMatches.length} remaining) ---`);
      const cd = await fetchCricketData(remainingMatches.length > 0 ? remainingMatches : dbMatches);
      if (cd.results.length > 0) {
        allResults.push(...cd.results);
        console.log(`[CricketData] Updated ${cd.results.length} matches`);
      }
      if (cd.error) errors.push(cd.error);
    }

    console.log(`=== Done: ${allResults.length} matches updated ===`);

    return new Response(JSON.stringify({
      success: true,
      matches_updated: allResults.length,
      db_total: dbMatches.length,
      errors: errors.length > 0 ? errors : undefined,
      results: allResults,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Live score update failed:', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
