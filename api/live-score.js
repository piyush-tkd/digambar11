// Vercel Serverless Function: Live Score Ingestion
// Multi-provider live score ingestion for IPL matches.
// Provider waterfall: Sportmonks (primary) -> CricketData (fallback)
//
// Called via: GET /api/live-score
// Reads API keys from Supabase `provider_config` table.
// Updates `matches` table with live scores.

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://dpuglcubuhbzowrzmfxd.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ─── IPL Team Resolution ────────────────────────────────────
const TEAM_ALIASES = {
  CSK: ['chennai super kings', 'chennai', 'csk', 'che'],
  MI:  ['mumbai indians', 'mumbai', 'mi', 'mum'],
  RCB: ['royal challengers', 'royal challengers bengaluru', 'royal challengers bangalore', 'bangalore', 'bengaluru', 'rcb', 'ban'],
  KKR: ['kolkata knight riders', 'kolkata', 'kkr', 'kol'],
  DC:  ['delhi capitals', 'delhi', 'dc', 'del'],
  SRH: ['sunrisers hyderabad', 'hyderabad', 'srh', 'hyd', 'sunrisers'],
  RR:  ['rajasthan royals', 'rajasthan', 'rr', 'raj'],
  PBKS:['punjab kings', 'punjab', 'pbks', 'pun', 'pk'],
  GT:  ['gujarat titans', 'gujarat', 'gt', 'guj'],
  LSG: ['lucknow super giants', 'lucknow', 'lsg', 'luc'],
};

function resolveTeamCode(name) {
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

function mapStatus(raw) {
  const s = (raw || '').toLowerCase();
  if (s.includes('won') || s.includes('result') || s.includes('completed') || s === 'match over') return 'completed';
  if (s.includes('live') || s.includes('break') || s.includes('innings') || s.includes('timeout') || s.includes('in progress')) return 'live';
  if (s.includes('abandon') || s.includes('no result')) return 'abandoned';
  if (s.includes('upcoming') || s.includes('not started') || s.includes('scheduled') || s === '') return 'upcoming';
  return 'live';
}

// ─── Provider Config ────────────────────────────────────────
async function getProviderKey(providerId) {
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

function findDbMatch(dbMatches, codeA, codeB) {
  return dbMatches.find(m =>
    (m.team_a === codeA && m.team_b === codeB) ||
    (m.team_a === codeB && m.team_b === codeA)
  );
}

async function updateMatch(dbId, scoreA, scoreB, status, result, source) {
  const { error } = await supabase
    .from('matches')
    .update({
      score_a: scoreA,
      score_b: scoreB,
      status,
      result,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dbId);
  if (error) console.error(`DB update failed [${source}]:`, error);
  return !error;
}

// ═══════════════════════════════════════════════════════════
// PROVIDER 1: Sportmonks Cricket API (PRIMARY)
// ═══════════════════════════════════════════════════════════
async function fetchSportmonks(dbMatches) {
  const config = await getProviderKey('sportmonks');
  if (!config?.apiKey) return { results: [], error: 'No Sportmonks API token in provider_config' };

  const BASE = config.baseUrl || 'https://cricket.sportmonks.com/api/v2.0';
  const results = [];

  try {
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
      const localTeam = m.localteam?.name || m.localteam?.code || '';
      const visitorTeam = m.visitorteam?.name || m.visitorteam?.code || '';
      const code1 = resolveTeamCode(localTeam);
      const code2 = resolveTeamCode(visitorTeam);

      if (!code1 || !code2) continue;

      const dbMatch = findDbMatch(dbMatches, code1, code2);
      if (!dbMatch) continue;

      const scoreMap = {};
      const runs = m.runs?.data || m.runs || [];

      if (Array.isArray(runs)) {
        for (const r of runs) {
          let teamCode = null;
          if (r.team_id === m.localteam_id) teamCode = code1;
          else if (r.team_id === m.visitorteam_id) teamCode = code2;
          if (teamCode && r.score !== undefined) {
            scoreMap[teamCode] = `${r.score}/${r.wickets} (${r.overs})`;
          }
        }
      }

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

    // If no live scores, try fixtures for today
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

          const fStatus = mapStatus(f.status || '');
          if (fStatus === 'upcoming') continue;

          const scoreMap = {};
          const fRuns = f.runs?.data || [];
          for (const r of fRuns) {
            let tc = null;
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
// PROVIDER 2: CricketData.org (FALLBACK)
// ═══════════════════════════════════════════════════════════
async function fetchCricketData(dbMatches) {
  const config = await getProviderKey('cricketdata');
  if (!config?.apiKey) return { results: [], error: 'No CricketData API key in provider_config' };

  const BASE = config.baseUrl || 'https://api.cricapi.com/v1';
  const results = [];

  try {
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

    for (const m of matches) {
      const series = (m.series || '').toLowerCase();
      const isIPL = series.includes('ipl') || series.includes('indian premier league');
      const t1 = m.teamInfo?.[0]?.shortname || m.teams?.[0] || '';
      const t2 = m.teamInfo?.[1]?.shortname || m.teams?.[1] || '';
      const code1 = resolveTeamCode(t1);
      const code2 = resolveTeamCode(t2);

      if (!isIPL && !(code1 && code2)) continue;
      if (!code1 || !code2) continue;

      const dbMatch = findDbMatch(dbMatches, code1, code2);
      if (!dbMatch) continue;

      const scoreMap = {};
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

    return { results };
  } catch (err) {
    console.error('[CricketData] Fetch error:', err);
    return { results: [], error: String(err) };
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════
module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== Live Score Update (Vercel) v2 ===');

    // Get all live/upcoming matches from DB
    const dbMatches = await getDbLiveMatches();
    console.log(`DB has ${dbMatches.length} live/upcoming matches`);

    if (dbMatches.length === 0) {
      return res.json({
        success: true,
        message: 'No live/upcoming matches in DB',
        matches_updated: 0,
      });
    }

    // Provider waterfall: Sportmonks first, CricketData fallback
    let allResults = [];
    const errors = [];

    // 1. Try Sportmonks FIRST (primary)
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

    return res.json({
      success: true,
      version: 'v2-vercel-sportmonks-primary',
      matches_updated: allResults.length,
      db_total: dbMatches.length,
      errors: errors.length > 0 ? errors : undefined,
      results: allResults,
    });

  } catch (err) {
    console.error('Live score update failed:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
}
