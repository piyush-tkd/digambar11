// ============================================================
// Edge Function: Match Sync
// Fetches upcoming/live IPL matches from CricAPI and syncs to DB
// Also syncs player squads with external_id mapping
// Run daily or on-demand to keep match list current
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// IPL team code mapping (API team names â our short codes)
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
  // Direct match
  if (TEAM_MAP[teamName]) return TEAM_MAP[teamName];
  // Partial match
  const lower = teamName.toLowerCase();
  for (const [key, val] of Object.entries(TEAM_MAP)) {
    if (lower.includes(key.toLowerCase().split(' ')[0])) return val;
  }
  return null;
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
    // Get CricAPI config
    const { data: provider } = await supabase
      .from('provider_config')
      .select('*')
      .eq('id', 'cricketdata')
      .single();

    if (!provider || !provider.api_key || provider.api_key === 'YOUR_CRICKETDATA_API_KEY') {
      return new Response(JSON.stringify({
        error: 'CricAPI key not configured. Update provider_config table with your API key from https://cricketdata.org',
        setup_steps: [
          '1. Sign up at https://cricketdata.org (free = 100 calls/day)',
          '2. Get your API key from dashboard',
          '3. Run: UPDATE provider_config SET api_key = \'YOUR_KEY\' WHERE id = \'cricketdata\';',
        ],
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = provider.api_key;
    const baseUrl = provider.base_url;
    const results: any[] = [];

    // ============================================
    // STEP 1: Fetch current/upcoming matches
    // ============================================
    // CricAPI v1 endpoints:
    //   /currentMatches â live + recently completed
    //   /matches â upcoming + recent
    //   /series_info â series/tournament info

    // Fetch current matches (live + recent)
    const currentRes = await fetch(`${baseUrl}/currentMatches?apikey=${apiKey}&offset=0`);
    const currentJson = await currentRes.json();

    // Fetch upcoming matches
    const upcomingRes = await fetch(`${baseUrl}/matches?apikey=${apiKey}&offset=0`);
    const upcomingJson = await upcomingRes.json();

    // Combine and deduplicate
    const allMatches = [
      ...(currentJson.data || []),
      ...(upcomingJson.data || []),
    ];

    // Filter IPL matches only
    const iplMatches = allMatches.filter((m: any) => {
      const name = (m.name || m.series_id || '').toLowerCase();
      const series = (m.series || m.seriesName || '').toLowerCase();
      return name.includes('ipl') || series.includes('ipl')
        || name.includes('indian premier league') || series.includes('indian premier league')
        || name.includes('t20') && (name.includes('india') || series.includes('india'));
    });

    // Deduplicate by API match ID
    const seen = new Set<string>();
    const uniqueMatches = iplMatches.filter((m: any) => {
      const id = m.id || m.unique_id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    let matchesSynced = 0;
    let matchesSkipped = 0;

    for (const m of uniqueMatches) {
      const externalId = m.id || m.unique_id;
      const teams = m.teamInfo || m.teams || [];

      // Try to resolve teams
      let teamA = null;
      let teamB = null;

      if (Array.isArray(teams) && teams.length >= 2) {
        // teamInfo format: [{name: "Chennai Super Kings", shortname: "CSK", img: "..."}]
        if (teams[0].name) {
          teamA = resolveTeam(teams[0].name) || { code: teams[0].shortname || teams[0].name.substring(0, 3).toUpperCase(), name: teams[0].name };
          teamB = resolveTeam(teams[1].name) || { code: teams[1].shortname || teams[1].name.substring(0, 3).toUpperCase(), name: teams[1].name };
        } else if (typeof teams[0] === 'string') {
          teamA = resolveTeam(teams[0]) || { code: teams[0].substring(0, 3).toUpperCase(), name: teams[0] };
          teamB = resolveTeam(teams[1]) || { code: teams[1].substring(0, 3).toUpperCase(), name: teams[1] };
        }
      }

      // Fallback: parse from match name (e.g., "Chennai Super Kings vs Mumbai Indians, 28th Match")
      if (!teamA || !teamB) {
        const nameMatch = (m.name || '').match(/^(.+?)\s+vs?\s+(.+?),/i);
        if (nameMatch) {
          teamA = resolveTeam(nameMatch[1].trim()) || { code: nameMatch[1].trim().substring(0, 3).toUpperCase(), name: nameMatch[1].trim() };
          teamB = resolveTeam(nameMatch[2].trim()) || { code: nameMatch[2].trim().substring(0, 3).toUpperCase(), name: nameMatch[2].trim() };
        }
      }

      if (!teamA || !teamB) {
        matchesSkipped++;
        continue;
      }

      // Map API status to our status
      let status: 'upcoming' | 'live' | 'completed' | 'abandoned' = 'upcoming';
      if (m.matchStarted && !m.matchEnded) status = 'live';
      else if (m.matchEnded) status = 'completed';
      else if (m.status === 'Match not started') status = 'upcoming';

      // Parse scores from API
      const scores = m.score || [];
      const scoreA = scores[0] ? `${scores[0].r}/${scores[0].w} (${scores[0].o})` : '';
      const scoreB = scores[1] ? `${scores[1].r}/${scores[1].w} (${scores[1].o})` : '';

      // Upsert match
      const { error: upsertErr } = await supabase
        .from('matches')
        .upsert({
          external_id: externalId,
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

      if (upsertErr) {
        console.error(`Failed to upsert match ${externalId}:`, upsertErr);
      } else {
        matchesSynced++;
      }
    }

    // ============================================
    // STEP 2: Sync player external IDs
    // ============================================
    // For each live/upcoming match with external_id, try to fetch squad/scorecard
    // and map player names to external IDs
    const { data: dbMatches } = await supabase
      .from('matches')
      .select('id, external_id, team_a, team_b')
      .not('external_id', 'is', null)
      .in('status', ['upcoming', 'live']);

    let playersUpdated = 0;

    for (const match of (dbMatches || [])) {
      if (!match.external_id) continue;

      try {
        // Fetch match info/squad from API
        const infoRes = await fetch(`${baseUrl}/match_info?apikey=${apiKey}&id=${match.external_id}`);
        const infoJson = await infoRes.json();

        if (infoJson.status !== 'success' || !infoJson.data) continue;

        const teamInfo = infoJson.data.teamInfo || [];

        for (const team of teamInfo) {
          const teamCode = resolveTeam(team.name)?.code || team.shortname;
          if (!teamCode) continue;

          // Get squad/players from the API response
          const squad = team.players || [];

          for (const apiPlayer of squad) {
            if (!apiPlayer.id || !apiPlayer.name) continue;

            // Try to match by name to our DB players
            const { data: dbPlayer } = await supabase
              .from('players')
              .select('id, external_id')
              .eq('team', teamCode)
              .ilike('name', `%${apiPlayer.name.split(' ').pop()}%`)
              .limit(1)
              .single();

            if (dbPlayer && !dbPlayer.external_id) {
              await supabase
                .from('players')
                .update({ external_id: apiPlayer.id })
                .eq('id', dbPlayer.id);
              playersUpdated++;
            }
          }
        }
      } catch (err) {
        console.error(`Failed to sync players for match ${match.id}:`, err);
      }
    }

    // Update API call count
    await supabase
      .from('provider_config')
      .update({ calls_today: (provider.calls_today || 0) + 3 }) // ~3 API calls made
      .eq('id', 'cricketdata');

    const response = {
      success: true,
      matches_found: uniqueMatches.length,
      matches_synced: matchesSynced,
      matches_skipped: matchesSkipped,
      players_updated: playersUpdated,
      api_calls_used: provider.calls_today + 3,
      api_calls_limit: provider.rate_limit_per_day,
    };

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
