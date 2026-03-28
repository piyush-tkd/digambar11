// ============================================================
// Edge Function: Live Score
// Fetches real-time score for a specific match from Sportmonks
// and updates the DB. Called every 30s during live matches.
// All 50 users get instant Realtime push via Supabase subscriptions.
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// IPL team code mapping
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
  if (TEAM_MAP[teamName]) return TEAM_MAP[teamName];
  const lower = teamName.toLowerCase();
  for (const [key, val] of Object.entries(TEAM_MAP)) {
    if (lower.includes(key.toLowerCase().split(' ')[0])) return val;
  }
  return null;
}

function mapStatus(smStatus: string, live: boolean | number): string {
  const s = (smStatus || '').toLowerCase();
  if (s === 'finished' || s.includes('won')) return 'completed';
  if (s === 'aban.' || s.includes('abandon')) return 'abandoned';
  if (s === '1st innings' || s === '2nd innings' || s === 'innings break' || s === 'stumps' || s === 'drinks') return 'live';
  if (live) return 'live';
  if (s === 'ns' || s === 'not started') return 'upcoming';
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
    const body = await req.json().catch(() => ({}));
    const matchExternalId = body.match_external_id;

    if (!matchExternalId) {
      return new Response(JSON.stringify({ error: 'match_external_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Sportmonks API token from provider_config
    const { data: smProvider } = await supabase
      .from('provider_config')
      .select('*')
      .eq('id', 'sportmonks')
      .single();

    if (!smProvider?.api_key) {
      return new Response(JSON.stringify({ error: 'Sportmonks API key not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = smProvider.api_key;
    const baseUrl = smProvider.base_url || 'https://cricket.sportmonks.com/api/v2.0';

    // Extract numeric Sportmonks fixture ID (strip "sm_" prefix if present)
    const fixtureId = matchExternalId.replace(/^sm_/, '');

    // Fetch live fixture data with ball-by-ball, batting, bowling, scoreboards
    const url = `${baseUrl}/fixtures/${fixtureId}?api_token=${token}&include=localteam,visitorteam,venue,runs,batting,bowling,scoreboards,balls`;
    console.log(`Fetching live data for fixture ${fixtureId}...`);

    const res = await fetch(url);
    const json = await res.json();

    // DEBUG: Log raw Sportmonks response keys and status
    console.log('Raw Sportmonks response keys:', Object.keys(json));
    if (json.data) {
      console.log('Fixture status:', json.data.status, 'live:', json.data.live);
      console.log('Fixture localteam_id:', json.data.localteam_id, 'visitorteam_id:', json.data.visitorteam_id);
      console.log('Runs data:', JSON.stringify(json.data.runs));
      console.log('Batting data count:', Array.isArray(json.data.batting?.data) ? json.data.batting.data.length : (Array.isArray(json.data.batting) ? json.data.batting.length : 'none'));
      console.log('Scoreboards:', JSON.stringify(json.data.scoreboards)?.substring(0, 500));
    }

    if (!json.data) {
      console.warn('No fixture data returned for ID:', fixtureId, 'Response:', JSON.stringify(json).substring(0, 500));
      return new Response(JSON.stringify({ success: false, error: 'Fixture not found', raw: JSON.stringify(json).substring(0, 300) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const f = json.data;

    // Resolve teams (support both nested .data and flat structure)
    const localName = f.localteam?.data?.name || f.localteam?.name || '';
    const visitorName = f.visitorteam?.data?.name || f.visitorteam?.name || '';
    const teamA = resolveTeam(localName);
    const teamB = resolveTeam(visitorName);

    if (!teamA || !teamB) {
      return new Response(JSON.stringify({
        success: false,
        error: `Team mapping failed: "${localName}" vs "${visitorName}"`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const status = mapStatus(f.status, f.live);

    // Parse scores from runs
    let scoreA = '';
    let scoreB = '';
    const runs = f.runs?.data || f.runs || [];
    const localTeamId = f.localteam_id || f.localteam?.id;
    const visitorTeamId = f.visitorteam_id || f.visitorteam?.id;

    console.log('localTeamId:', localTeamId, 'visitorTeamId:', visitorTeamId, 'runs length:', Array.isArray(runs) ? runs.length : 'not array');

    if (Array.isArray(runs) && runs.length > 0) {
      const team1Runs = runs.find((r: any) => r.team_id === localTeamId);
      const team2Runs = runs.find((r: any) => r.team_id === visitorTeamId);
      if (team1Runs) scoreA = `${team1Runs.score}/${team1Runs.wickets} (${team1Runs.overs})`;
      if (team2Runs) scoreB = `${team2Runs.score}/${team2Runs.wickets} (${team2Runs.overs})`;
    }

    // Fallback: try scoreboards if runs are empty
    if (!scoreA && !scoreB) {
      const scoreboards = f.scoreboards?.data || f.scoreboards || [];
      if (Array.isArray(scoreboards) && scoreboards.length > 0) {
        console.log('Using scoreboards fallback, count:', scoreboards.length);
        // Scoreboards have type "total" with team_id, score, wickets, overs
        const totals = scoreboards.filter((s: any) => s.type === 'total');
        const team1Total = totals.find((s: any) => s.team_id === localTeamId);
        const team2Total = totals.find((s: any) => s.team_id === visitorTeamId);
        if (team1Total) scoreA = `${team1Total.total}/${team1Total.wickets} (${team1Total.overs})`;
        if (team2Total) scoreB = `${team2Total.total}/${team2Total.wickets} (${team2Total.overs})`;
      }
    }

    // Fallback 2: try fixture-level score fields
    if (!scoreA && !scoreB) {
      if (f.localteam_dl_data?.score || f.localteam_dl_data?.total) {
        scoreA = `${f.localteam_dl_data.score || f.localteam_dl_data.total}`;
      }
      if (f.visitorteam_dl_data?.score || f.visitorteam_dl_data?.total) {
        scoreB = `${f.visitorteam_dl_data.score || f.visitorteam_dl_data.total}`;
      }
    }

    console.log('Final scores — A:', scoreA, 'B:', scoreB);

    // Upsert match in DB (triggers Realtime push to all subscribed clients)
    const { error: upsertError } = await supabase
      .from('matches')
      .upsert({
        external_id: matchExternalId,
        team_a: teamA.code,
        team_b: teamB.code,
        team_a_name: teamA.name,
        team_b_name: teamB.name,
        venue: f.venue?.data?.name || f.venue?.name || '',
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

    if (upsertError) {
      console.error('DB upsert failed:', upsertError);
      return new Response(JSON.stringify({ success: false, error: upsertError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Optionally sync player-level scores to live_scores table
    const batting = f.batting?.data || f.batting || [];
    const bowling = f.bowling?.data || f.bowling || [];

    if (batting.length > 0 || bowling.length > 0) {
      console.log(`Player stats: ${batting.length} batters, ${bowling.length} bowlers`);
      // Future: write individual player fantasy points to live_scores table
    }

    const result = {
      success: true,
      match_external_id: matchExternalId,
      team_a: teamA.code,
      team_b: teamB.code,
      debug_fixture_status: f.status,
      debug_fixture_live: f.live,
      debug_runs_count: Array.isArray(runs) ? runs.length : 0,
      debug_fixture_note: f.note || null,
      score_a: scoreA,
      score_b: scoreB,
      status,
      result: f.note || null,
      batting_count: batting.length,
      bowling_count: bowling.length,
    };

    console.log(`Live update: ${teamA.code} ${scoreA} vs ${teamB.code} ${scoreB} [${status}]`);

    return new Response(JSON.stringify(result), {
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
