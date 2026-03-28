// ============================================================
// Edge Function: Live Score
// Fetches real-time scores from CricketData.org (cricapi.com) API
// and updates ALL live IPL matches in the DB.
// Called periodically (every 60s) — single call returns all live matches.
// All users get instant Realtime push via Supabase subscriptions.
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// CricketData.org API (cricapi.com v1)
const CRICDATA_BASE = 'https://api.cricapi.com/v1';

// IPL team code mapping — handles various name formats from different APIs
const TEAM_MAP: Record<string, { code: string; name: string }> = {
  'Chennai Super Kings':              { code: 'CSK', name: 'Chennai' },
  'Mumbai Indians':                   { code: 'MI',  name: 'Mumbai' },
  'Royal Challengers':                { code: 'RCB', name: 'Bangalore' },
  'Royal Challengers Bengaluru':      { code: 'RCB', name: 'Bangalore' },
  'Royal Challengers Bangalore':      { code: 'RCB', name: 'Bangalore' },
  'Kolkata Knight Riders':            { code: 'KKR', name: 'Kolkata' },
  'Delhi Capitals':                   { code: 'DC',  name: 'Delhi' },
  'Sunrisers Hyderabad':              { code: 'SRH', name: 'Hyderabad' },
  'Rajasthan Royals':                 { code: 'RR',  name: 'Rajasthan' },
  'Punjab Kings':                     { code: 'PBKS', name: 'Punjab' },
  'Gujarat Titans':                   { code: 'GT',  name: 'Gujarat' },
  'Lucknow Super Giants':             { code: 'LSG', name: 'Lucknow' },
};

// Short name to code mapping (from cricapi teamInfo.shortname)
const SHORT_MAP: Record<string, string> = {
  'CSK': 'CSK', 'MI': 'MI', 'RCB': 'RCB', 'KKR': 'KKR',
  'DC': 'DC', 'SRH': 'SRH', 'RR': 'RR', 'PBKS': 'PBKS',
  'GT': 'GT', 'LSG': 'LSG',
};

function resolveTeamCode(teamName: string, shortName?: string): string | null {
  // Try short name first
  if (shortName && SHORT_MAP[shortName.toUpperCase()]) {
    return SHORT_MAP[shortName.toUpperCase()];
  }
  // Try exact match
  if (TEAM_MAP[teamName]) return TEAM_MAP[teamName].code;
  // Try partial match
  const lower = teamName.toLowerCase();
  for (const [key, val] of Object.entries(TEAM_MAP)) {
    if (lower.includes(key.toLowerCase().split(' ')[0])) return val.code;
  }
  return null;
}

function mapStatus(cricapiStatus: string): string {
  const s = (cricapiStatus || '').toLowerCase();
  if (s.includes('won') || s.includes('result') || s.includes('tied') || s.includes('draw')) return 'completed';
  if (s.includes('abandon') || s.includes('no result')) return 'abandoned';
  if (s.includes('innings') || s.includes('break') || s.includes('session') || s.includes('trail') || s.includes('lead')) return 'live';
  if (s.includes('not started') || s.includes('toss')) return 'upcoming';
  // If match has scores, it's live
  return 'live';
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
    // Get CricketData.org API key from provider_config
    // First try cricketdata provider, fall back to sportmonks
    let apiKey = '';

    const { data: cdProvider } = await supabase
      .from('provider_config')
      .select('*')
      .eq('id', 'cricketdata')
      .single();

    if (cdProvider?.api_key) {
      apiKey = cdProvider.api_key;
    } else {
      // Fallback: check if stored in sportmonks row with a cricketdata key
      const { data: smProvider } = await supabase
        .from('provider_config')
        .select('*')
        .eq('id', 'sportmonks')
        .single();

      if (smProvider?.extra_config) {
        try {
          const extra = typeof smProvider.extra_config === 'string'
            ? JSON.parse(smProvider.extra_config)
            : smProvider.extra_config;
          apiKey = extra.cricketdata_api_key || '';
        } catch {}
      }
    }

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: 'CricketData.org API key not configured. Add a row to provider_config with id=cricketdata and api_key=YOUR_KEY'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch ALL current (live) matches from CricketData.org
    // This single API call returns all ongoing matches with live scores
    const url = `${CRICDATA_BASE}/currentMatches?apikey=${apiKey}&offset=0`;
    console.log('Fetching live matches from CricketData.org...');

    const res = await fetch(url);
    const json = await res.json();

    if (json.status !== 'success' || !json.data) {
      console.error('CricketData.org API error:', JSON.stringify(json).substring(0, 500));
      return new Response(JSON.stringify({
        success: false,
        error: 'API request failed',
        info: json.info,
        apiStatus: json.status,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Got ${json.data.length} current matches. Hits today: ${json.info?.hitsToday}/${json.info?.hitsLimit}`);

    // Filter for IPL matches only
    const iplMatches = json.data.filter((m: any) => {
      const name = (m.name || '').toLowerCase();
      const series = (m.series_id || m.matchType || '').toLowerCase();
      return name.includes('ipl') || name.includes('indian premier league') ||
             // Also match by team names
             m.teams?.some((t: string) => resolveTeamCode(t) !== null);
    });

    console.log(`Found ${iplMatches.length} IPL matches`);

    const results: any[] = [];

    for (const m of iplMatches) {
      try {
        // Resolve team codes
        const teamInfoA = m.teamInfo?.[0];
        const teamInfoB = m.teamInfo?.[1];
        const teamNameA = m.teams?.[0] || '';
        const teamNameB = m.teams?.[1] || '';

        const codeA = resolveTeamCode(teamNameA, teamInfoA?.shortname);
        const codeB = resolveTeamCode(teamNameB, teamInfoB?.shortname);

        if (!codeA || !codeB) {
          console.warn(`Skipping match — couldn't resolve teams: "${teamNameA}" vs "${teamNameB}"`);
          continue;
        }

        // Parse scores from score array
        // score: [{ r: 198, w: 10, o: 76.4, inning: "Team Inning 1" }, ...]
        let scoreA = '';
        let scoreB = '';
        const scores = m.score || [];

        for (const s of scores) {
          const inning = (s.inning || '').toLowerCase();
          // Match inning to team
          if (inning.includes(teamNameA.toLowerCase().split(' ')[0]) ||
              inning.includes(teamNameA.toLowerCase())) {
            scoreA = `${s.r}/${s.w} (${s.o})`;
          } else if (inning.includes(teamNameB.toLowerCase().split(' ')[0]) ||
                     inning.includes(teamNameB.toLowerCase())) {
            scoreB = `${s.r}/${s.w} (${s.o})`;
          }
        }

        // If only one team has batted, the other is "Yet to bat"
        if (scores.length > 0 && scoreA && !scoreB) scoreB = 'Yet to bat';
        if (scores.length > 0 && scoreB && !scoreA) scoreA = 'Yet to bat';

        const status = mapStatus(m.status);

        // Find the matching match in our DB by team codes
        const { data: dbMatches } = await supabase
          .from('matches')
          .select('id, external_id, team_a, team_b')
          .or(`and(team_a.eq.${codeA},team_b.eq.${codeB}),and(team_a.eq.${codeB},team_b.eq.${codeA})`)
          .eq('status', 'live')
          .limit(1);

        // Also try matching by upcoming status if no live match found
        let dbMatch = dbMatches?.[0];
        if (!dbMatch) {
          const { data: upcomingMatches } = await supabase
            .from('matches')
            .select('id, external_id, team_a, team_b')
            .or(`and(team_a.eq.${codeA},team_b.eq.${codeB}),and(team_a.eq.${codeB},team_b.eq.${codeA})`)
            .order('starts_at', { ascending: false })
            .limit(1);
          dbMatch = upcomingMatches?.[0];
        }

        if (!dbMatch) {
          console.warn(`No DB match found for ${codeA} vs ${codeB}`);
          continue;
        }

        // Determine score assignment based on DB team order
        let dbScoreA = scoreA;
        let dbScoreB = scoreB;

        // If DB has teams in reverse order, swap scores
        if (dbMatch.team_a === codeB && dbMatch.team_b === codeA) {
          dbScoreA = scoreB;
          dbScoreB = scoreA;
        }

        // Update the match in DB
        const { error: updateError } = await supabase
          .from('matches')
          .update({
            score_a: dbScoreA,
            score_b: dbScoreB,
            status,
            result: m.status || null,  // Human-readable status from API
            updated_at: new Date().toISOString(),
          })
          .eq('id', dbMatch.id);

        if (updateError) {
          console.error(`Failed to update ${codeA} vs ${codeB}:`, updateError);
        } else {
          console.log(`Updated: ${dbMatch.team_a} ${dbScoreA} vs ${dbMatch.team_b} ${dbScoreB} [${status}]`);
        }

        results.push({
          match_id: dbMatch.id,
          teams: `${codeA} vs ${codeB}`,
          score_a: dbScoreA,
          score_b: dbScoreB,
          status,
          api_status: m.status,
        });

      } catch (matchErr) {
        console.error('Error processing match:', matchErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      matches_updated: results.length,
      total_current_matches: json.data.length,
      ipl_matches_found: iplMatches.length,
      hits_today: json.info?.hitsToday,
      hits_limit: json.info?.hitsLimit,
      results,
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
