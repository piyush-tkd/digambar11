// Vercel Serverless Function: Live Score + Fantasy Points Ingestion
// Uses Sportmonks Cricket API (primary, paid) for:
//   1. Match scores (score_a, score_b, status)
//   2. Player-level batting/bowling/fielding for fantasy points
//
// Called via: GET /api/live-score  (browser polling or Vercel cron)
// Reads API key from Supabase `provider_config` table.

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
  if (['finished', 'aban.', 'cancelled', 'postp.'].some(x => s === x)) {
    if (s === 'finished') return 'completed';
    return 'abandoned';
  }
  if (s.includes('won') || s.includes('result') || s.includes('completed') || s === 'match over' || s === 'finished') return 'completed';
  if (['1st innings', '2nd innings', 'innings break', 'stump day 1', 'stump day 2', 'stump day 3', 'stump day 4'].some(x => s === x)) return 'live';
  if (s.includes('live') || s.includes('break') || s.includes('innings') || s.includes('timeout') || s.includes('in progress')) return 'live';
  if (s.includes('abandon') || s.includes('no result')) return 'abandoned';
  if (s.includes('upcoming') || s.includes('not started') || s.includes('scheduled') || s === '' || s === 'ns') return 'upcoming';
  return 'live'; // Default to live if unknown
}

// ─── Fantasy Points Calculator ──────────────────────────────
function calcFantasyPoints(batting, bowling, fielding) {
  let pts = 0;

  if (batting) {
    const runs = batting.runs || 0;
    const balls = batting.balls || 0;
    const fours = batting.fours || 0;
    const sixes = batting.sixes || 0;
    const sr = balls > 0 ? (runs / balls) * 100 : 0;
    const isDismissed = batting.dismissed;

    pts += runs;                          // +1 per run
    pts += fours * 1;                     // +1 bonus per boundary
    pts += sixes * 2;                     // +2 bonus per six
    if (runs >= 100) pts += 16;           // Century bonus
    else if (runs >= 50) pts += 8;        // Half-century bonus
    if (runs === 0 && isDismissed) pts -= 2; // Duck penalty

    // Strike rate bonus/penalty (only if 10+ balls faced)
    if (balls >= 10) {
      if (sr > 170) pts += 6;
      else if (sr < 70) pts -= 6;
    }
  }

  if (bowling) {
    const wickets = bowling.wickets || 0;
    const maidens = bowling.maidens || 0;
    const eco = bowling.economy || 0;
    const overs = bowling.overs || 0;

    pts += wickets * 25;                  // +25 per wicket
    pts += maidens * 12;                  // +12 per maiden
    if (wickets >= 5) pts += 16;          // 5-wicket haul
    else if (wickets >= 4) pts += 8;      // 4-wicket haul
    else if (wickets >= 3) pts += 4;      // 3-wicket haul

    // Economy bonus/penalty (only if 2+ overs bowled)
    if (overs >= 2) {
      if (eco < 5) pts += 6;
      else if (eco > 10) pts -= 6;
    }
  }

  if (fielding) {
    pts += (fielding.catches || 0) * 8;     // +8 per catch
    pts += (fielding.stumpings || 0) * 12;  // +12 per stumping
    pts += (fielding.runouts || 0) * 12;    // +12 per run out
  }

  // Playing in XI bonus (+4)
  if (batting || bowling) pts += 4;

  return pts;
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

// ─── Match DB players by name (fuzzy) ───────────────────────
function matchPlayerByName(dbPlayers, apiName) {
  if (!apiName) return null;
  const apiLower = apiName.toLowerCase().trim();

  // Exact match
  let match = dbPlayers.find(p => p.players?.name?.toLowerCase() === apiLower);
  if (match) return match;

  // Contains match
  match = dbPlayers.find(p => {
    const dbName = (p.players?.name || '').toLowerCase();
    return dbName.includes(apiLower) || apiLower.includes(dbName);
  });
  if (match) return match;

  // Last name match (if last name is 4+ chars)
  const apiLast = apiLower.split(' ').pop();
  if (apiLast.length >= 4) {
    match = dbPlayers.find(p => {
      const dbLast = (p.players?.name || '').toLowerCase().split(' ').pop();
      return dbLast === apiLast;
    });
  }
  if (match) return match;

  // First name match (if first name is 4+ chars)
  const apiFirst = apiLower.split(' ')[0];
  if (apiFirst.length >= 4) {
    match = dbPlayers.find(p => {
      const dbFirst = (p.players?.name || '').toLowerCase().split(' ')[0];
      return dbFirst === apiFirst;
    });
  }
  return match || null;
}

// ═══════════════════════════════════════════════════════════
// SPORTMONKS: Fetch livescores + player scorecards
// ═══════════════════════════════════════════════════════════
async function fetchSportmonks(dbMatches) {
  const config = await getProviderKey('sportmonks');
  if (!config?.apiKey) return { results: [], error: 'No Sportmonks API token in provider_config' };

  const BASE = config.baseUrl || 'https://cricket.sportmonks.com/api/v2.0';
  const results = [];
  const fantasyResults = [];

  try {
    // Fetch livescores with ALL includes we need
    const url = `${BASE}/livescores?api_token=${config.apiKey}&include=runs,batting,bowling,lineup,localteam,visitorteam`;
    console.log('[Sportmonks] Fetching livescores with batting/bowling...');

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error('[Sportmonks] API error:', JSON.stringify(data.error).substring(0, 200));
      return { results: [], fantasyResults: [], error: `Sportmonks: ${JSON.stringify(data.error).substring(0, 200)}` };
    }

    let matches = data.data || [];
    console.log(`[Sportmonks] Got ${matches.length} live matches`);

    // If no live matches, try today's fixtures
    if (matches.length === 0) {
      console.log('[Sportmonks] No livescores, trying today fixtures...');
      const today = new Date().toISOString().split('T')[0];
      const fUrl = `${BASE}/fixtures?api_token=${config.apiKey}&filter[starts_between]=${today},${today}&include=runs,batting,bowling,lineup,localteam,visitorteam`;
      const fRes = await fetch(fUrl);
      const fData = await fRes.json();
      matches = fData.data || [];
      console.log(`[Sportmonks] Today fixtures: ${matches.length}`);
    }

    for (const m of matches) {
      // Resolve team names
      const localTeamName = m.localteam?.name || m.localteam?.code || '';
      const visitorTeamName = m.visitorteam?.name || m.visitorteam?.code || '';
      const code1 = resolveTeamCode(localTeamName);
      const code2 = resolveTeamCode(visitorTeamName);

      console.log(`[Sportmonks] Match: ${localTeamName} (${code1}) vs ${visitorTeamName} (${code2}) | status: ${m.status}`);

      if (!code1 || !code2) {
        console.log(`[Sportmonks] Skipping non-IPL match: ${localTeamName} vs ${visitorTeamName}`);
        continue;
      }

      const dbMatch = findDbMatch(dbMatches, code1, code2);
      if (!dbMatch) {
        console.log(`[Sportmonks] No DB match for ${code1} vs ${code2}`);
        continue;
      }

      // ── 1. Update match scores ──────────────────────────
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

      const scoreA = scoreMap[dbMatch.team_a] || 'Yet to bat';
      const scoreB = scoreMap[dbMatch.team_b] || 'Yet to bat';
      const status = mapStatus(m.status || '');
      const result = m.note || m.status || null;

      if (status === 'upcoming') {
        console.log(`[Sportmonks] Match ${code1} vs ${code2} still upcoming, skipping`);
        continue;
      }

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
        console.log(`[Sportmonks] ✓ Updated ${code1} vs ${code2}: ${scoreA} / ${scoreB} [${status}]`);
      }

      // ── 2. Process batting/bowling for fantasy points ───
      if (status === 'live' || status === 'completed') {
        const battingData = m.batting?.data || m.batting || [];
        const bowlingData = m.bowling?.data || m.bowling || [];
        const lineupData = m.lineup?.data || m.lineup || [];

        console.log(`[Sportmonks] Scorecard: ${battingData.length} batting, ${bowlingData.length} bowling, ${lineupData.length} lineup`);

        if (battingData.length > 0 || bowlingData.length > 0) {
          const fpResult = await processFantasyPoints(
            dbMatch.id, m.localteam_id, m.visitorteam_id,
            code1, code2, battingData, bowlingData, lineupData
          );
          fantasyResults.push(fpResult);
        } else {
          console.log(`[Sportmonks] No batting/bowling data yet for ${code1} vs ${code2}`);

          // Try fixture endpoint for this specific match for more detailed data
          if (m.id) {
            console.log(`[Sportmonks] Trying fixture/${m.id} for scorecard...`);
            try {
              const fxUrl = `${BASE}/fixtures/${m.id}?api_token=${config.apiKey}&include=batting,bowling,lineup,localteam,visitorteam`;
              const fxRes = await fetch(fxUrl);
              const fxData = await fxRes.json();
              const fx = fxData.data;

              if (fx) {
                const fxBatting = fx.batting?.data || fx.batting || [];
                const fxBowling = fx.bowling?.data || fx.bowling || [];
                const fxLineup = fx.lineup?.data || fx.lineup || [];

                console.log(`[Sportmonks] Fixture scorecard: ${fxBatting.length} batting, ${fxBowling.length} bowling`);

                if (fxBatting.length > 0 || fxBowling.length > 0) {
                  const fpResult = await processFantasyPoints(
                    dbMatch.id, fx.localteam_id, fx.visitorteam_id,
                    code1, code2, fxBatting, fxBowling, fxLineup
                  );
                  fantasyResults.push(fpResult);
                }
              }
            } catch (fxErr) {
              console.error(`[Sportmonks] Fixture fetch error:`, fxErr.message);
            }
          }
        }
      }
    }

    return { results, fantasyResults };
  } catch (err) {
    console.error('[Sportmonks] Fetch error:', err);
    return { results: [], fantasyResults: [], error: String(err) };
  }
}

// ═══════════════════════════════════════════════════════════
// Fantasy Points: Process batting/bowling and write to DB
// ═══════════════════════════════════════════════════════════
async function processFantasyPoints(
  dbMatchId, localteamId, visitorteamId,
  code1, code2, battingData, bowlingData, lineupData
) {
  // Build Sportmonks player_id -> name map from lineup
  const playerNameMap = {};
  for (const p of lineupData) {
    playerNameMap[p.id] = p.fullname || `${p.firstname || ''} ${p.lastname || ''}`.trim();
  }

  // Build per-player stats from batting array
  // Sportmonks batting fields: player_id, score, ball, four_x, six_x, rate,
  //   team_id, scoreboard (S1/S2), catch_stump_player_id, bowling_player_id, batsmanout_id
  const playerStats = {};

  for (const b of battingData) {
    const pid = b.player_id;
    const name = playerNameMap[pid] || `player_${pid}`;
    if (!playerStats[pid]) playerStats[pid] = { name, batting: null, bowling: null, fielding: { catches: 0, stumpings: 0, runouts: 0 } };

    // Accumulate batting (handles multi-innings though rare in T20)
    if (!playerStats[pid].batting) {
      playerStats[pid].batting = { runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, dismissed: false };
    }
    playerStats[pid].batting.runs += (b.score || 0);
    playerStats[pid].batting.balls += (b.ball || 0);
    playerStats[pid].batting.fours += (b.four_x || 0);
    playerStats[pid].batting.sixes += (b.six_x || 0);

    // Check if dismissed: batsmanout_id matches this player, or catch/bowling player exists
    if (b.batsmanout_id === pid || b.bowling_player_id || b.catch_stump_player_id) {
      playerStats[pid].batting.dismissed = true;
    }

    // Recalc SR
    if (playerStats[pid].batting.balls > 0) {
      playerStats[pid].batting.sr = Math.round((playerStats[pid].batting.runs / playerStats[pid].batting.balls) * 100 * 100) / 100;
    }

    // Track catches/stumpings from fielding references
    if (b.catch_stump_player_id && b.catch_stump_player_id !== pid) {
      const catcherId = b.catch_stump_player_id;
      if (!playerStats[catcherId]) {
        playerStats[catcherId] = {
          name: playerNameMap[catcherId] || `player_${catcherId}`,
          batting: null, bowling: null,
          fielding: { catches: 0, stumpings: 0, runouts: 0 },
        };
      }
      // Determine if catch or stumping based on dismissal type
      // For now count as catch (most common)
      playerStats[catcherId].fielding.catches += 1;
    }

    // Track runouts
    if (b.runout_by_id) {
      const roId = b.runout_by_id;
      if (!playerStats[roId]) {
        playerStats[roId] = {
          name: playerNameMap[roId] || `player_${roId}`,
          batting: null, bowling: null,
          fielding: { catches: 0, stumpings: 0, runouts: 0 },
        };
      }
      playerStats[roId].fielding.runouts += 1;
    }
  }

  // Process bowling array
  // Sportmonks bowling fields: player_id, overs, medians (maidens), runs, wickets, rate (economy),
  //   team_id, wide, noball, scoreboard
  for (const bw of bowlingData) {
    const pid = bw.player_id;
    const name = playerNameMap[pid] || `player_${pid}`;
    if (!playerStats[pid]) playerStats[pid] = { name, batting: null, bowling: null, fielding: { catches: 0, stumpings: 0, runouts: 0 } };

    if (!playerStats[pid].bowling) {
      playerStats[pid].bowling = { overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0 };
    }

    playerStats[pid].bowling.overs += (bw.overs || 0);
    playerStats[pid].bowling.maidens += (bw.medians || 0);
    playerStats[pid].bowling.runs += (bw.runs || 0);
    playerStats[pid].bowling.wickets += (bw.wickets || 0);

    // Recalc economy
    if (playerStats[pid].bowling.overs > 0) {
      playerStats[pid].bowling.economy = Math.round((playerStats[pid].bowling.runs / playerStats[pid].bowling.overs) * 100) / 100;
    }
  }

  // Get DB players for this match
  const { data: dbPlayers } = await supabase
    .from('match_players')
    .select('player_id, players:player_id (id, name, team, role)')
    .eq('match_id', dbMatchId);

  if (!dbPlayers || dbPlayers.length === 0) {
    console.log(`[Fantasy] No match_players found for match ${dbMatchId}`);
    return { match_id: dbMatchId, players: 0, error: 'No match_players' };
  }

  console.log(`[Fantasy] ${Object.keys(playerStats).length} API players, ${dbPlayers.length} DB players`);

  // Match API players to DB players and build upserts
  const upserts = [];
  let matchedCount = 0;

  for (const mp of dbPlayers) {
    const p = mp.players;
    if (!p) continue;

    // Try to find this DB player in API data by name
    let stats = null;
    for (const [smId, ps] of Object.entries(playerStats)) {
      const matched = matchPlayerByName([{ players: { name: ps.name } }], p.name);
      if (matched) {
        stats = ps;
        break;
      }
    }

    // If no match by Sportmonks name, try reverse: match DB name against API names
    if (!stats) {
      for (const [smId, ps] of Object.entries(playerStats)) {
        const matched = matchPlayerByName([{ players: { name: p.name } }], ps.name);
        if (matched) {
          stats = ps;
          break;
        }
      }
    }

    const pts = stats ? calcFantasyPoints(stats.batting, stats.bowling, stats.fielding) : 0;
    const batStatus = stats?.batting
      ? (stats.batting.dismissed ? 'out' : 'batting')
      : (stats?.bowling ? 'bowling' : 'waiting');

    if (stats) matchedCount++;

    upserts.push({
      match_id: dbMatchId,
      player_id: p.id,
      fantasy_pts: pts,
      status: batStatus,
      runs: stats?.batting?.runs || 0,
      balls_faced: stats?.batting?.balls || 0,
      fours: stats?.batting?.fours || 0,
      sixes: stats?.batting?.sixes || 0,
      strike_rate: stats?.batting?.sr || 0,
      overs_bowled: stats?.bowling?.overs || 0,
      maidens: stats?.bowling?.maidens || 0,
      runs_conceded: stats?.bowling?.runs || 0,
      wickets: stats?.bowling?.wickets || 0,
      economy: stats?.bowling?.economy || 0,
      catches: stats?.fielding?.catches || 0,
      run_outs: stats?.fielding?.runouts || 0,
      stumpings: stats?.fielding?.stumpings || 0,
      updated_at: new Date().toISOString(),
    });
  }

  console.log(`[Fantasy] Matched ${matchedCount}/${dbPlayers.length} players, upserting ${upserts.length} rows`);

  // Upsert to live_scores
  if (upserts.length > 0) {
    const { error } = await supabase
      .from('live_scores')
      .upsert(upserts, { onConflict: 'match_id,player_id' });
    if (error) {
      console.error(`[Fantasy] live_scores upsert error:`, error.message);
      return { match_id: dbMatchId, players: upserts.length, matched: matchedCount, error: error.message };
    }
    console.log(`[Fantasy] ✓ Upserted ${upserts.length} live_scores rows`);
  }

  // Recalculate user team points and ranks
  try {
    const { error: rpcError } = await supabase.rpc('calculate_user_team_points', { p_match_id: dbMatchId });
    if (rpcError) {
      console.warn(`[Fantasy] RPC calculate_user_team_points error:`, rpcError.message);
    } else {
      console.log(`[Fantasy] ✓ Recalculated user team points for match ${dbMatchId}`);
    }
  } catch (rpcErr) {
    console.warn(`[Fantasy] RPC error:`, rpcErr.message);
  }

  return { match_id: dbMatchId, players: upserts.length, matched: matchedCount };
}

// ═══════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== Live Score + Fantasy Points Update v3 ===');

    const dbMatches = await getDbLiveMatches();
    console.log(`DB has ${dbMatches.length} live/upcoming matches`);

    if (dbMatches.length === 0) {
      return res.json({
        success: true,
        message: 'No live/upcoming matches in DB',
        matches_updated: 0,
      });
    }

    // Use Sportmonks for everything
    const sm = await fetchSportmonks(dbMatches);

    const allResults = sm.results || [];
    const fantasyResults = sm.fantasyResults || [];
    const errors = sm.error ? [sm.error] : [];

    console.log(`=== Done: ${allResults.length} matches, ${fantasyResults.length} fantasy scorecards ===`);

    return res.json({
      success: true,
      version: 'v3-sportmonks-fullstack',
      matches_updated: allResults.length,
      fantasy_scorecards: fantasyResults.length,
      db_total: dbMatches.length,
      errors: errors.length > 0 ? errors : undefined,
      results: allResults,
      fantasy: fantasyResults,
    });

  } catch (err) {
    console.error('Live score update failed:', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
};
