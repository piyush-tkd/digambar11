// ============================================================
// Edge Function: Match Sync
// Fetches upcoming/live IPL matches from Sportmonks (primary)
// or CricAPI (fallback) and syncs to DB
// Run daily or on-demand to keep match list current
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// IPL team code mapping (Sportmonks team names → our short codes)
const TEAM_MAP: Record<string, { code: string; name: string }> = {
  'Chennai Super Kings':    { code: 'CSK', name: 'Chennai' },
  'Mumbai Indians':         { code: 'MI',  name: 'Mumbai' },
  'Royal Challengers':      { code: 'RCB', name: 'Bangalore' },
  'Royal Challengers Bengaluru': { code: 'RCB', name: 'Bangalore' },
  'Royal Challengers Bangalore': { code: 'RCB', name: 'Bangalore' },
  'Kolkata Knight Riders':  { code: 'KKR', name: 'Kolkata' },
  'Delhi Capitals':         { code: 'DC',  name: 'Delhi' },
  'Sunrisers Hyderabad':    { code: 'SRH', name: 'Hyderabad' },
  'Rajasthan Royals':       { code: 'RR',  name: 'Rajasthan' },
  'Punjab Kings':           { code: 'PBKS', name: 'Punjab' },
  'Gujarat Titans':         { code: 'GT',  name: 'Gujarat' },
  'Lucknow Super Giants':   { code: 'LSG', name: 'Lucknow' },
};

function resolveTeam(teamName: string): { code: string; name: string } | null {
  if (!teamName) return null;
  // Direct match
  if (TEAM_MAP[teamName]) return TEAM_MAP[teamName];
  // Partial match
  const lower = teamName.toLowerCase();
  for (const [key, val] of Object.entries(TEAM_MAP)) {
    if (lower.includes(key.toLowerCase().split(' ')[0])) return val;
  }
  return null;
}

// Map Sportmonks status to our status
function mapStatus(smStatus: string, live: boolean | number): 'upcoming' | 'live' | 'completed' | 'abandoned' {
  const s = (smStatus || '').toLowerCase();
  if (s === 'finished' || s === 'won' || s.includes('won')) return 'completed';
  if (s === 'aban.' || s === 'abandoned' || s.includes('abandon')) return 'abandoned';
  if (s === 'ns' || s === 'not started' || s === '1st innings' || s === '2nd innings' || s === 'innings break') {
    return live ? 'live' : 'upcoming';
  }
  if (live) return 'live';
  return 'upcoming';
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
    // ============================================
    // Try Sportmonks first (primary), CricAPI fallback
    // ============================================
    const { data: smProvider } = await supabase
      .from('provider_config')
      .select('*')
      .eq('id', 'sportmonks')
      .single();

    const { data: cdProvider } = await supabase
      .from('provider_config')
      .select('*')
      .eq('id', 'cricketdata')
      .single();

    let matchesSynced = 0;
    let matchesSkipped = 0;
    let providerUsed = '';
    let apiCallsMade = 0;

    // ============================================
    // SPORTMONKS PROVIDER
    // ============================================
    if (smProvider?.api_key && smProvider.api_key !== 'YOUR_SPORTMONKS_API_KEY') {
      providerUsed = 'sportmonks';
      const token = smProvider.api_key;
      const baseUrl = smProvider.base_url || 'https://cricket.sportmonks.com/api/v2.0';

      // Step 1: Find IPL league — search all leagues for "Indian Premier League"
      console.log('Fetching leagues from Sportmonks...');
      const leaguesRes = await fetch(`${baseUrl}/leagues?api_token=${token}`);
      const leaguesJson = await leaguesRes.json();
      apiCallsMade++;

      const iplLeague = (leaguesJson.data || []).find((l: any) =>
        l.name?.toLowerCase().includes('indian premier league') ||
        l.code?.toUpperCase() === 'IPL'
      );

      if (!iplLeague) {
        console.log('IPL league not found, listing available leagues:',
          (leaguesJson.data || []).map((l: any) => `${l.id}: ${l.name} (${l.code})`).join(', '));

        // Fallback: try fetching fixtures with date filter for upcoming matches
        console.log('Trying date-based fixture fetch...');
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 60 days ahead
        const fixturesRes = await fetch(
          `${baseUrl}/fixtures?api_token=${token}&filter[starts_between]=${today},${futureDate}&include=localteam,visitorteam,venue,runs`
        );
        const fixturesJson = await fixturesRes.json();
        apiCallsMade++;

        // Filter for IPL-related fixtures by checking team names
        const allFixtures = fixturesJson.data || [];
        const iplFixtures = allFixtures.filter((f: any) => {
          const local = f.localteam?.data?.name || '';
          const visitor = f.visitorteam?.data?.name || '';
          return resolveTeam(local) !== null || resolveTeam(visitor) !== null;
        });

        for (const f of iplFixtures) {
          const result = await syncSportmonksFixture(f);
          if (result) matchesSynced++; else matchesSkipped++;
        }
      } else {
        // Found IPL league — fetch fixtures for current season
        const seasonId = iplLeague.season_id;
        console.log(`Found IPL league: id=${iplLeague.id}, season_id=${seasonId}`);

        const fixturesRes = await fetch(
          `${baseUrl}/fixtures?api_token=${token}&filter[season_id]=${seasonId}&include=localteam,visitorteam,venue,runs`
        );
        const fixturesJson = await fixturesRes.json();
        apiCallsMade++;

        const fixtures = fixturesJson.data || [];
        console.log(`Found ${fixtures.length} IPL fixtures for season ${seasonId}`);

        // Handle pagination
        let allFixtures = [...fixtures];
        let nextPage = fixturesJson.meta?.current_page < fixturesJson.meta?.last_page
          ? fixturesJson.meta?.current_page + 1
          : null;

        while (nextPage) {
          const pageRes = await fetch(
            `${baseUrl}/fixtures?api_token=${token}&filter[season_id]=${seasonId}&include=localteam,visitorteam,venue,runs&page=${nextPage}`
          );
          const pageJson = await pageRes.json();
          apiCallsMade++;
          allFixtures = [...allFixtures, ...(pageJson.data || [])];
          nextPage = pageJson.meta?.current_page < pageJson.meta?.last_page
            ? pageJson.meta?.current_page + 1
            : null;
        }

        for (const f of allFixtures) {
          const result = await syncSportmonksFixture(f);
          if (result) matchesSynced++; else matchesSkipped++;
        }
      }

      // Update API call count
      await supabase
        .from('provider_config')
        .update({ calls_today: (smProvider.calls_today || 0) + apiCallsMade })
        .eq('id', 'sportmonks');
    }
    // ============================================
    // CRICAPI FALLBACK
    // ============================================
    else if (cdProvider?.api_key && cdProvider.api_key !== 'YOUR_CRICKETDATA_API_KEY') {
      providerUsed = 'cricketdata';
      const apiKey = cdProvider.api_key;
      const baseUrl = cdProvider.base_url || 'https://api.cricapi.com/v1';

      const fetchOpts = {
        headers: { 'User-Agent': 'Digambar11/1.0', 'Accept': 'application/json' },
      };

      const currentRes = await fetch(`${baseUrl}/currentMatches?apikey=${apiKey}&offset=0`, fetchOpts);
      const currentJson = await currentRes.json();
      apiCallsMade++;

      const upcomingRes = await fetch(`${baseUrl}/matches?apikey=${apiKey}&offset=0`, fetchOpts);
      const upcomingJson = await upcomingRes.json();
      apiCallsMade++;

      const allMatches = [...(currentJson.data || []), ...(upcomingJson.data || [])];

      // Filter IPL matches
      const iplMatches = allMatches.filter((m: any) => {
        const name = (m.name || '').toLowerCase();
        const series = (m.series || '').toLowerCase();
        return name.includes('ipl') || series.includes('ipl')
          || name.includes('indian premier league') || series.includes('indian premier league');
      });

      // Deduplicate
      const seen = new Set<string>();
      for (const m of iplMatches) {
        const id = m.id || m.unique_id;
        if (!id || seen.has(id)) continue;
        seen.add(id);

        const result = await syncCricApiMatch(m);
        if (result) matchesSynced++; else matchesSkipped++;
      }

      await supabase
        .from('provider_config')
        .update({ calls_today: (cdProvider.calls_today || 0) + apiCallsMade })
        .eq('id', 'cricketdata');
    } else {
      return new Response(JSON.stringify({
        error: 'No API keys configured. Update provider_config with Sportmonks or CricketData API keys.',
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const response = {
      success: true,
      provider: providerUsed,
      matches_synced: matchesSynced,
      matches_skipped: matchesSkipped,
      api_calls_made: apiCallsMade,
    };

    console.log('Sync complete:', JSON.stringify(response));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Match sync failed:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================
// Sync a single Sportmonks fixture to DB
// ============================================
async function syncSportmonksFixture(f: any): Promise<boolean> {
  const localTeamName = f.localteam?.data?.name || '';
  const visitorTeamName = f.visitorteam?.data?.name || '';

  const teamA = resolveTeam(localTeamName);
  const teamB = resolveTeam(visitorTeamName);

  if (!teamA || !teamB) return false;

  const status = mapStatus(f.status, f.live);

  // Parse scores from runs include
  let scoreA = '';
  let scoreB = '';
  const runs = f.runs?.data || [];
  if (runs.length > 0) {
    const team1Runs = runs.find((r: any) => r.team_id === f.localteam_id);
    const team2Runs = runs.find((r: any) => r.team_id === f.visitorteam_id);
    if (team1Runs) scoreA = `${team1Runs.score}/${team1Runs.wickets} (${team1Runs.overs})`;
    if (team2Runs) scoreB = `${team2Runs.score}/${team2Runs.wickets} (${team2Runs.overs})`;
  }

  const { error } = await supabase
    .from('matches')
    .upsert({
      external_id: String(f.id),
      team_a: teamA.code,
      team_b: teamB.code,
      team_a_name: teamA.name,
      team_b_name: teamB.name,
      venue: f.venue?.data?.name || '',
      starts_at: f.starting_at || new Date().toISOString(),
      status,
      score_a: scoreA,
      score_b: scoreB,
      result: f.note || null,
      innings: runs.length,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'external_id',
    });

  if (error) {
    console.error(`Failed to upsert fixture ${f.id}:`, error);
    return false;
  }
  return true;
}

// ============================================
// Sync a single CricAPI match to DB (fallback)
// ============================================
async function syncCricApiMatch(m: any): Promise<boolean> {
  const externalId = m.id || m.unique_id;
  const teams = m.teamInfo || m.teams || [];

  let teamA = null;
  let teamB = null;

  if (Array.isArray(teams) && teams.length >= 2) {
    if (teams[0].name) {
      teamA = resolveTeam(teams[0].name) || { code: teams[0].shortname || teams[0].name.substring(0, 3).toUpperCase(), name: teams[0].name };
      teamB = resolveTeam(teams[1].name) || { code: teams[1].shortname || teams[1].name.substring(0, 3).toUpperCase(), name: teams[1].name };
    }
  }

  if (!teamA || !teamB) {
    const nameMatch = (m.name || '').match(/^(.+?)\s+vs?\s+(.+?),/i);
    if (nameMatch) {
      teamA = resolveTeam(nameMatch[1].trim());
      teamB = resolveTeam(nameMatch[2].trim());
    }
  }

  if (!teamA || !teamB) return false;

  let status: 'upcoming' | 'live' | 'completed' | 'abandoned' = 'upcoming';
  if (m.matchStarted && !m.matchEnded) status = 'live';
  else if (m.matchEnded) status = 'completed';

  const scores = m.score || [];
  const scoreA = scores[0] ? `${scores[0].r}/${scores[0].w} (${scores[0].o})` : '';
  const scoreB = scores[1] ? `${scores[1].r}/${scores[1].w} (${scores[1].o})` : '';

  const { error } = await supabase
    .from('matches')
    .upsert({
      external_id: String(externalId),
      team_a: teamA.code,
      team_b: teamB.code,
      team_a_name: teamA.name,
      team_b_name: teamB.name,
      venue: m.venue || '',
      starts_at: m.dateTimeGMT || m.date || new Date().toISOString(),
      status,
      score_a: scoreA,
      score_b: scoreB,
      result: m.status || null,
      innings: scores.length,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'external_id',
    });

  if (error) {
    console.error(`Failed to upsert match ${externalId}:`, error);
    return false;
  }
  return true;
}
