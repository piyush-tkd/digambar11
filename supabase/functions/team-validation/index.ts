// ============================================================
// Edge Function: Team Validation
// Validates team composition before saving
// Called from frontend when user submits team
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, apikey',
  'Content-Type': 'application/json',
};

interface TeamRequest {
  match_id: string;
  player_ids: string[];
  captain_id: string;
  vice_captain_id: string;
  impact_player_id: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, errors: ['Not authenticated'] }), {
        status: 401, headers: CORS_HEADERS,
      });
    }

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ success: false, errors: ['Invalid token'] }), {
        status: 401, headers: CORS_HEADERS,
      });
    }

    // Parse request
    const body: TeamRequest = await req.json();
    const { match_id, player_ids, captain_id, vice_captain_id, impact_player_id } = body;

    // =====================
    // VALIDATION RULES
    // =====================
    const errors: string[] = [];

    // 1. Exactly 11 players
    if (!player_ids || player_ids.length !== 11) {
      errors.push(`Must select exactly 11 players (got ${player_ids?.length || 0})`);
    }

    // 2. Captain and VC must be in the team
    if (captain_id && !player_ids.includes(captain_id)) {
      errors.push('Captain must be in your team');
    }
    if (vice_captain_id && !player_ids.includes(vice_captain_id)) {
      errors.push('Vice-captain must be in your team');
    }

    // 3. Captain ≠ Vice-captain
    if (captain_id && captain_id === vice_captain_id) {
      errors.push('Captain and Vice-captain must be different');
    }

    // 3b. Impact Player validation
    if (impact_player_id) {
      if (!player_ids.includes(impact_player_id)) {
        errors.push('Impact Player must be in your team');
      }
      if (impact_player_id === captain_id) {
        errors.push('Impact Player must be different from Captain');
      }
      if (impact_player_id === vice_captain_id) {
        errors.push('Impact Player must be different from Vice-captain');
      }
    }

    // 4. Fetch player details for remaining validations
    const { data: players, error: playerErr } = await supabase
      .from('players')
      .select('id, name, team, role, credit, overseas')
      .in('id', player_ids);

    if (playerErr || !players) {
      return new Response(JSON.stringify({ success: false, errors: ['Failed to fetch player data'] }), {
        status: 500, headers: CORS_HEADERS,
      });
    }

    if (players.length !== player_ids.length) {
      errors.push(`Some players not found (expected ${player_ids.length}, found ${players.length})`);
    }

    // 5. Total credits ≤ 100
    const totalCredits = players.reduce((sum, p) => sum + Number(p.credit), 0);
    if (totalCredits > 100) {
      errors.push(`Total credits exceed 100 (got ${totalCredits})`);
    }

    // 6. Max 4 overseas players
    const overseasCount = players.filter(p => p.overseas).length;
    if (overseasCount > 4) {
      errors.push(`Max 4 overseas players allowed (got ${overseasCount})`);
    }

    // 7. Role limits: min 1, max 8 per role (Dream11 rules)
    const roleCounts: Record<string, number> = { WK: 0, BAT: 0, AR: 0, BWL: 0 };
    players.forEach(p => { roleCounts[p.role] = (roleCounts[p.role] || 0) + 1; });

    if (roleCounts.WK < 1) errors.push('Need at least 1 Wicket-keeper');
    if (roleCounts.BAT < 1) errors.push('Need at least 1 Batter');
    if (roleCounts.AR < 1) errors.push('Need at least 1 All-rounder');
    if (roleCounts.BWL < 1) errors.push('Need at least 1 Bowler');
    if (roleCounts.WK > 8) errors.push('Max 8 Wicket-keepers');
    if (roleCounts.BAT > 8) errors.push('Max 8 Batters');
    if (roleCounts.AR > 8) errors.push('Max 8 All-rounders');
    if (roleCounts.BWL > 8) errors.push('Max 8 Bowlers');

    // 8. Max 10 from one team (Dream11 rules)
    const teamCounts: Record<string, number> = {};
    players.forEach(p => { teamCounts[p.team] = (teamCounts[p.team] || 0) + 1; });
    for (const [team, count] of Object.entries(teamCounts)) {
      if (count > 10) {
        errors.push(`Max 10 players from one team (${team}: ${count})`);
      }
    }

    // 9. Check match is still open for team creation
    const { data: match } = await supabase
      .from('matches')
      .select('status, starts_at')
      .eq('id', match_id)
      .single();

    if (!match) {
      errors.push('Match not found');
    } else if (match.status !== 'upcoming') {
      errors.push('Match has already started — team editing is locked');
    }

    // Return errors if any
    if (errors.length > 0) {
      return new Response(JSON.stringify({ success: false, errors }), {
        status: 400, headers: CORS_HEADERS,
      });
    }

    // =====================
    // SAVE TEAM
    // =====================

    // Upsert user_team (one team per user per match)
    const { data: team, error: teamErr } = await supabase
      .from('user_teams')
      .upsert({
        user_id: user.id,
        match_id,
        captain_id,
        vice_captain_id,
        impact_player_id: impact_player_id || null,
        total_credits: totalCredits,
        total_points: 0,
      }, {
        onConflict: 'user_id,match_id',
      })
      .select()
      .single();

    if (teamErr || !team) {
      return new Response(JSON.stringify({ success: false, errors: ['Failed to save team'] }), {
        status: 500, headers: CORS_HEADERS,
      });
    }

    // Delete existing players and insert new ones
    await supabase.from('user_team_players').delete().eq('user_team_id', team.id);

    const playerRows = player_ids.map(pid => ({
      user_team_id: team.id,
      player_id: pid,
    }));

    const { error: insertErr } = await supabase
      .from('user_team_players')
      .insert(playerRows);

    if (insertErr) {
      return new Response(JSON.stringify({ success: false, errors: ['Failed to save players'] }), {
        status: 500, headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      team_id: team.id,
      total_credits: totalCredits,
      composition: roleCounts,
    }), { headers: CORS_HEADERS });

  } catch (err) {
    console.error('Team validation error:', err);
    return new Response(JSON.stringify({ success: false, errors: [String(err)] }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
});
