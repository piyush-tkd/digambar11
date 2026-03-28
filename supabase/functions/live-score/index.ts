// ============================================================
// Edge Function: Live Score
// Fetches real-time scores from ESPNCricinfo's free consumer API
// and updates ALL live IPL matches in the DB.
// Called periodically (every 60s) — single call returns all live matches.
// All users get instant Realtime push via Supabase subscriptions.
//
// Primary: ESPNCricinfo consumer API (free, no key, works from Deno Deploy)
// Fallback: CricketData.org API (if configured in provider_config)
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ESPNCricinfo consumer API (free, no auth required)
const ESPN_BASE = 'https://hs-consumer-api.espncricinfo.com/v1/pages';
const ESPN_IPL_SERIES_ID = '1510719'; // IPL 2026

// IPL team code mapping — handles various name formats
const TEAM_MAP: Record<string, { code: string; aliases: string[] }> = {
  'CSK': { code: 'CSK', aliases: ['chennai super kings', 'chennai', 'csk'] },
  'MI':  { code: 'MI',  aliases: ['mumbai indians', 'mumbai', 'mi'] },
  'RCB': { code: 'RCB', aliases: ['royal challengers', 'royal challengers bengaluru', 'royal challengers bangalore', 'bangalore', 'bengaluru', 'rcb'] },
  'KKR': { code: 'KKR', aliases: ['kolkata knight riders', 'kolkata', 'kkr'] },
  'DC':  { code: 'DC',  aliases: ['delhi capitals', 'delhi', 'dc'] },
  'SRH': { code: 'SRH', aliases: ['sunrisers hyderabad', 'hyderabad', 'srh', 'sunrisers'] },
  'RR':  { code: 'RR',  aliases: ['rajasthan royals', 'rajasthan', 'rr'] },
  'PBKS':{ code: 'PBKS', aliases: ['punjab kings', 'punjab', 'pbks'] },
  'GT':  { code: 'GT',  aliases: ['gujarat titans', 'gujarat', 'gt'] },
  'LSG': { code: 'LSG', aliases: ['lucknow super giants', 'lucknow', 'lsg'] },
};

function resolveTeamCode(teamName: string): string | null {
  if (!teamName) return null;
  const lower = teamName.toLowerCase().trim();

  // Direct code match
  const upper = teamName.toUpperCase().trim();
  if (TEAM_MAP[upper]) return upper;

  // Search aliases
  for (const [code, info] of Object.entries(TEAM_MAP)) {
    for (const alias of info.aliases) {
      if (lower === alias || lower.includes(alias) || alias.includes(lower)) {
        return code;
      }
    }
  }
  return null;
}

function mapEspnStatus(matchState: string, statusText: string): string {
  const state = (matchState || '').toUpperCase();
  const text = (statusText || '').toLowerCase();

  if (state === 'RESULT' || state === 'POST' || text.includes('won') || text.includes('tied')) return 'completed';
  if (state === 'LIVE' || state === 'INNINGS_BREAK' || state === 'STRATEGIC_TIMEOUT' ||
      text.includes('innings') || text.includes('break')) return 'live';
  if (state === 'ABANDONED' || text.includes('abandon') || text.includes('no result')) return 'abandoned';
  if (state === 'PRE' || state === 'SCHEDULED' || text.includes('yet to begin')) return 'upcoming';
  // Default to live if we're unsure but have data
  return 'live';
}

// Format score string: "185/6 (20.0)"
function formatScore(innings: any): string {
  if (!innings) return 'Yet to bat';
  const runs = innings.runs ?? innings.totalRuns ?? '';
  const wickets = innings.wickets ?? innings.totalWickets ?? '';
  const overs = innings.overs ?? innings.oversBowled ?? '';
  if (runs === '' && wickets === '' && overs === '') return 'Yet to bat';
  return `${runs}/${wickets} (${overs})`;
}

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

    // ─────────────────────────────────────────
    // Strategy 1: ESPNCricinfo — fetch all current matches
    // ─────────────────────────────────────────
    let iplMatches: any[] = [];
    let source = 'espncricinfo';

    try {
      // Get all currently live matches
      const currentUrl = `${ESPN_BASE}/matches/current?lang=en&latest=true`;
      console.log('Fetching from ESPNCricinfo:', currentUrl);

      const espnRes = await fetch(currentUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
      });

      if (!espnRes.ok) {
        throw new Error(`ESPN API returned ${espnRes.status}: ${espnRes.statusText}`);
      }

      const espnData = await espnRes.json();
      console.log('ESPN response keys:', Object.keys(espnData));

      // The response has different structures — handle both formats
      // Format 1: { matches: [...] }
      // Format 2: { content: { matches: { ... } } }
      // Format 3: { typeMatches: [ { matchType: "...", seriesMatches: [...] } ] }
      let allMatches: any[] = [];

      if (espnData.matches && Array.isArray(espnData.matches)) {
        allMatches = espnData.matches;
      } else if (espnData.content?.matches) {
        // Could be grouped by match type
        const matchGroups = espnData.content.matches;
        if (Array.isArray(matchGroups)) {
          allMatches = matchGroups;
        } else {
          // Object with match categories
          for (const key of Object.keys(matchGroups)) {
            if (Array.isArray(matchGroups[key])) {
              allMatches.push(...matchGroups[key]);
            }
          }
        }
      } else if (espnData.typeMatches && Array.isArray(espnData.typeMatches)) {
        // Format from Cricbuzz-style grouping
        for (const typeMatch of espnData.typeMatches) {
          if (typeMatch.seriesMatches && Array.isArray(typeMatch.seriesMatches)) {
            for (const seriesMatch of typeMatch.seriesMatches) {
              if (seriesMatch.seriesAdWrapper?.matches) {
                allMatches.push(...seriesMatch.seriesAdWrapper.matches);
              }
            }
          }
        }
      }

      // Also try flat data array
      if (allMatches.length === 0 && Array.isArray(espnData.data)) {
        allMatches = espnData.data;
      }

      console.log(`Total current matches from ESPN: ${allMatches.length}`);

      // Filter for IPL matches
      for (const matchWrapper of allMatches) {
        const match = matchWrapper.match || matchWrapper.matchInfo || matchWrapper;

        const seriesId = String(match.series?.id || match.seriesId || '');
        const seriesName = (match.series?.name || match.seriesName || '').toLowerCase();

        // Check if it's IPL
        const isIPL = seriesId === ESPN_IPL_SERIES_ID ||
                      seriesName.includes('indian premier league') ||
                      seriesName.includes('ipl');

        if (!isIPL) {
          // Also check by team names — if both teams are IPL teams, it's probably IPL
          const team1Name = match.teams?.[0]?.team?.name || match.team1?.teamName || '';
          const team2Name = match.teams?.[1]?.team?.name || match.team2?.teamName || '';
          const code1 = resolveTeamCode(team1Name);
          const code2 = resolveTeamCode(team2Name);
          if (!(code1 && code2)) continue;
        }

        iplMatches.push(matchWrapper);
      }

      console.log(`IPL matches from ESPN: ${iplMatches.length}`);

    } catch (espnErr) {
      console.error('ESPNCricinfo fetch failed:', espnErr);
      source = 'espn_failed';
    }

    // ─────────────────────────────────────────
    // If ESPN returned matches with no details, also try per-match endpoint
    // ─────────────────────────────────────────

    // If no matches from the current endpoint, try fetching IPL series page
    if (iplMatches.length === 0 && source === 'espncricinfo') {
      try {
        const seriesUrl = `${ESPN_BASE}/series/home?lang=en&seriesId=${ESPN_IPL_SERIES_ID}`;
        console.log('Trying ESPN series page:', seriesUrl);

        const seriesRes = await fetch(seriesUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        });

        if (seriesRes.ok) {
          const seriesData = await seriesRes.json();
          const matchList = seriesData.content?.matches ||
                           seriesData.collections?.[0]?.matches ||
                           seriesData.matches || [];

          console.log(`Series page returned ${Array.isArray(matchList) ? matchList.length : 'object'} matches`);

          const flatMatches = Array.isArray(matchList) ? matchList : Object.values(matchList).flat();

          // Find live ones
          for (const mw of flatMatches) {
            const m = mw.match || mw;
            const state = (m.state || m.matchState || '').toUpperCase();
            if (state === 'LIVE' || state === 'INNINGS_BREAK' || state === 'STRATEGIC_TIMEOUT') {
              iplMatches.push(mw);
            }
          }

          console.log(`Live IPL matches from series page: ${iplMatches.length}`);
        }
      } catch (seriesErr) {
        console.error('ESPN series fetch failed:', seriesErr);
      }
    }

    // ─────────────────────────────────────────
    // Also check DB for matches marked as live — fetch their ESPN match page directly
    // This ensures we get scores even if the "current matches" endpoint misses them
    // ─────────────────────────────────────────
    const { data: dbLiveMatches } = await supabase
      .from('matches')
      .select('id, external_id, espn_id, team_a, team_b, status')
      .in('status', ['live', 'upcoming']);

    console.log(`DB has ${dbLiveMatches?.length || 0} live/upcoming matches`);

    // For each DB match with an espn_id, fetch its match page directly
    const espnMatchResults: any[] = [];

    if (dbLiveMatches && dbLiveMatches.length > 0) {
      for (const dbm of dbLiveMatches) {
        if (!dbm.espn_id) continue;

        try {
          const matchUrl = `${ESPN_BASE}/match/home?lang=en&seriesId=${ESPN_IPL_SERIES_ID}&matchId=${dbm.espn_id}`;
          console.log(`Fetching ESPN match ${dbm.espn_id} (${dbm.team_a} vs ${dbm.team_b})...`);

          const mRes = await fetch(matchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
          });

          if (!mRes.ok) {
            console.warn(`ESPN match ${dbm.espn_id} returned ${mRes.status}`);
            continue;
          }

          const mData = await mRes.json();
          const matchInfo = mData.match || mData.content?.match || mData;
          const scorecard = mData.scorecard || mData.content?.scorecard || {};
          const innings = scorecard.innings || mData.innings || mData.content?.innings || [];

          // Get match state
          const matchState = matchInfo.state || matchInfo.matchState || '';
          const statusText = matchInfo.statusText || matchInfo.status || matchInfo.statusEng || '';
          const status = mapEspnStatus(matchState, statusText);

          // Skip if match hasn't started
          if (status === 'upcoming' && innings.length === 0) {
            console.log(`Match ${dbm.team_a} vs ${dbm.team_b} not started yet, skipping`);
            continue;
          }

          // Parse teams from ESPN response
          const espnTeam1 = matchInfo.teams?.[0]?.team || matchInfo.team1 || {};
          const espnTeam2 = matchInfo.teams?.[1]?.team || matchInfo.team2 || {};
          const espnCode1 = resolveTeamCode(espnTeam1.name || espnTeam1.teamName || '');
          const espnCode2 = resolveTeamCode(espnTeam2.name || espnTeam2.teamName || '');

          // Parse innings scores
          let scoreMap: Record<string, string> = {};

          if (Array.isArray(innings) && innings.length > 0) {
            for (const inn of innings) {
              const battingTeamId = String(inn.team?.id || inn.teamId || inn.batTeamId || '');
              const battingTeamName = inn.team?.name || inn.batTeamName || '';
              const teamCode = resolveTeamCode(battingTeamName) ||
                              (battingTeamId === String(espnTeam1.id) ? espnCode1 : null) ||
                              (battingTeamId === String(espnTeam2.id) ? espnCode2 : null);

              if (teamCode) {
                // Accumulate scores (in case of 2 innings in tests, take latest)
                scoreMap[teamCode] = formatScore(inn);
              }
            }
          }

          // Also try parsing from match.score or match.currentInnings
          if (Object.keys(scoreMap).length === 0) {
            // Try alternative score formats
            const miniScore = mData.content?.miniscore || mData.miniscore;
            if (miniScore) {
              const batTeam = miniScore.matchScoreDetails?.inningsScoreList || [];
              for (const is of batTeam) {
                const code = resolveTeamCode(is.batTeamName || '');
                if (code) {
                  scoreMap[code] = `${is.score}/${is.wickets} (${is.overs})`;
                }
              }
            }
          }

          // Assign scores to DB team order
          let dbScoreA = scoreMap[dbm.team_a] || 'Yet to bat';
          let dbScoreB = scoreMap[dbm.team_b] || 'Yet to bat';

          // If match is live and no scores yet, both are yet to bat
          if (Object.keys(scoreMap).length === 0 && status !== 'upcoming') {
            dbScoreA = 'Yet to bat';
            dbScoreB = 'Yet to bat';
          }

          // Update DB
          const { error: updateError } = await supabase
            .from('matches')
            .update({
              score_a: dbScoreA,
              score_b: dbScoreB,
              status,
              result: statusText || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', dbm.id);

          if (updateError) {
            console.error(`Failed to update ${dbm.team_a} vs ${dbm.team_b}:`, updateError);
          } else {
            console.log(`✓ Updated: ${dbm.team_a} ${dbScoreA} vs ${dbm.team_b} ${dbScoreB} [${status}] — "${statusText}"`);
          }

          espnMatchResults.push({
            match_id: dbm.id,
            teams: `${dbm.team_a} vs ${dbm.team_b}`,
            score_a: dbScoreA,
            score_b: dbScoreB,
            status,
            result: statusText,
            source: 'espn_direct',
          });

        } catch (matchErr) {
          console.error(`Error fetching ESPN match ${dbm.espn_id}:`, matchErr);
        }
      }
    }

    // ─────────────────────────────────────────
    // Process matches found from current matches endpoint
    // (only if not already handled via direct fetch)
    // ─────────────────────────────────────────
    const handledMatchIds = new Set(espnMatchResults.map(r => r.match_id));
    const currentMatchResults: any[] = [];

    for (const matchWrapper of iplMatches) {
      try {
        const match = matchWrapper.match || matchWrapper.matchInfo || matchWrapper;
        const scorecard = matchWrapper.scorecard || {};
        const innings = scorecard.innings || matchWrapper.innings || [];

        // Extract team info
        const team1 = match.teams?.[0]?.team || match.team1 || {};
        const team2 = match.teams?.[1]?.team || match.team2 || {};
        const team1Name = team1.name || team1.teamName || '';
        const team2Name = team2.name || team2.teamName || '';

        const codeA = resolveTeamCode(team1Name);
        const codeB = resolveTeamCode(team2Name);

        if (!codeA || !codeB) {
          console.warn(`Skipping match — can't resolve: "${team1Name}" vs "${team2Name}"`);
          continue;
        }

        // Find in DB
        const { data: dbMatches } = await supabase
          .from('matches')
          .select('id, external_id, espn_id, team_a, team_b')
          .or(`and(team_a.eq.${codeA},team_b.eq.${codeB}),and(team_a.eq.${codeB},team_b.eq.${codeA})`)
          .in('status', ['live', 'upcoming'])
          .order('starts_at', { ascending: false })
          .limit(1);

        const dbMatch = dbMatches?.[0];
        if (!dbMatch || handledMatchIds.has(dbMatch.id)) continue;

        // Parse scores
        const scoreMap: Record<string, string> = {};
        if (Array.isArray(innings) && innings.length > 0) {
          for (const inn of innings) {
            const teamCode = resolveTeamCode(inn.team?.name || inn.batTeamName || '');
            if (teamCode) scoreMap[teamCode] = formatScore(inn);
          }
        }

        const matchState = match.state || match.matchState || '';
        const statusText = match.statusText || match.status || '';
        const status = mapEspnStatus(matchState, statusText);

        let dbScoreA = scoreMap[dbMatch.team_a] || 'Yet to bat';
        let dbScoreB = scoreMap[dbMatch.team_b] || 'Yet to bat';

        const { error: updateError } = await supabase
          .from('matches')
          .update({
            score_a: dbScoreA,
            score_b: dbScoreB,
            status,
            result: statusText || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dbMatch.id);

        if (updateError) {
          console.error(`Failed to update ${codeA} vs ${codeB}:`, updateError);
        } else {
          console.log(`✓ Updated from current: ${dbMatch.team_a} ${dbScoreA} vs ${dbMatch.team_b} ${dbScoreB} [${status}]`);
        }

        // Store ESPN match ID if we don't have it
        const espnMatchId = String(match.id || match.objectId || '');
        if (espnMatchId && !dbMatch.espn_id) {
          await supabase
            .from('matches')
            .update({ espn_id: espnMatchId })
            .eq('id', dbMatch.id);
        }

        currentMatchResults.push({
          match_id: dbMatch.id,
          teams: `${codeA} vs ${codeB}`,
          score_a: dbScoreA,
          score_b: dbScoreB,
          status,
          result: statusText,
          source: 'espn_current',
        });

      } catch (matchErr) {
        console.error('Error processing current match:', matchErr);
      }
    }

    const allResults = [...espnMatchResults, ...currentMatchResults];

    return new Response(JSON.stringify({
      success: true,
      source,
      matches_updated: allResults.length,
      ipl_matches_found: iplMatches.length,
      db_live_matches: dbLiveMatches?.length || 0,
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
