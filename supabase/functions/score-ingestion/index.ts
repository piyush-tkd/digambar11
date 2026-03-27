// ============================================================
// Edge Function: Score Ingestion
// Runs every 30 seconds during live matches (via cron or webhook)
// Fetches live data → calculates fantasy points → updates DB
// → Supabase Realtime pushes to all connected clients
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchLiveMatchData } from '../shared/provider.ts';
import { calculateFantasyPoints } from '../shared/fantasy-calculator.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  try {
    // Verify authorization (cron secret or service role)
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get all live matches
    const { data: liveMatches, error: matchErr } = await supabase
      .from('matches')
      .select('id, external_id, team_a, team_b')
      .eq('status', 'live');

    if (matchErr) throw matchErr;
    if (!liveMatches || liveMatches.length === 0) {
      return new Response(JSON.stringify({ message: 'No live matches', processed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const match of liveMatches) {
      try {
        // 1. Fetch live data from provider (with fallback)
        const liveData = await fetchLiveMatchData(match.external_id);
        if (!liveData) {
          results.push({ match_id: match.id, status: 'no_data' });
          continue;
        }

        // 2. Update match scores
        await supabase
          .from('matches')
          .update({
            status: liveData.status === 'completed' ? 'completed' : 'live',
            innings: liveData.innings,
            score_a: liveData.score_a,
            score_b: liveData.score_b,
            result: liveData.result,
            updated_at: new Date().toISOString(),
          })
          .eq('id', match.id);

        // 3. Get player mapping (external_id → our player id)
        const { data: dbPlayers } = await supabase
          .from('players')
          .select('id, external_id, name, team')
          .in('team', [match.team_a, match.team_b]);

        const playerMap = new Map<string, string>();
        if (dbPlayers) {
          for (const p of dbPlayers) {
            // Map by external_id if available, also by name as fallback
            if (p.external_id) playerMap.set(p.external_id, p.id);
            playerMap.set(p.name.toLowerCase(), p.id);
          }
        }

        // 4. Calculate fantasy points and upsert live_scores
        let playersUpdated = 0;
        for (const player of liveData.players) {
          // Find our player ID
          const playerId = playerMap.get(player.external_id)
            || playerMap.get(player.name.toLowerCase());

          if (!playerId) {
            console.warn(`Player not found in DB: ${player.name} (${player.external_id})`);
            continue;
          }

          // Calculate fantasy points
          const fantasy = calculateFantasyPoints(player);

          // Upsert live score
          const { error: upsertErr } = await supabase
            .from('live_scores')
            .upsert({
              match_id: match.id,
              player_id: playerId,
              // Batting
              runs: player.batting?.runs || 0,
              balls_faced: player.batting?.balls_faced || 0,
              fours: player.batting?.fours || 0,
              sixes: player.batting?.sixes || 0,
              strike_rate: player.batting?.strike_rate || 0,
              // Bowling
              overs_bowled: player.bowling?.overs || 0,
              maidens: player.bowling?.maidens || 0,
              runs_conceded: player.bowling?.runs_conceded || 0,
              wickets: player.bowling?.wickets || 0,
              economy: player.bowling?.economy || 0,
              // Fielding
              catches: player.fielding.catches,
              run_outs: player.fielding.run_outs,
              stumpings: player.fielding.stumpings,
              // Calculated
              fantasy_pts: fantasy.total_pts,
              status: player.status,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'match_id,player_id',
            });

          if (upsertErr) {
            console.error(`Failed to upsert score for ${player.name}:`, upsertErr);
          } else {
            playersUpdated++;
          }
        }

        // 5. Recalculate user team points and ranks
        const { error: calcErr } = await supabase.rpc('calculate_user_team_points', {
          p_match_id: match.id,
        });
        if (calcErr) console.error('Failed to recalculate points:', calcErr);

        // 6. If match completed, distribute prizes
        if (liveData.status === 'completed') {
          const { data: contests } = await supabase
            .from('contests')
            .select('id')
            .eq('match_id', match.id)
            .eq('status', 'live');

          if (contests) {
            for (const contest of contests) {
              const { error: prizeErr } = await supabase.rpc('distribute_prizes', {
                p_contest_id: contest.id,
              });
              if (prizeErr) console.error(`Failed to distribute prizes for contest ${contest.id}:`, prizeErr);
            }
          }
        }

        results.push({
          match_id: match.id,
          status: 'updated',
          players_updated: playersUpdated,
          match_status: liveData.status,
        });

      } catch (matchErr) {
        console.error(`Error processing match ${match.id}:`, matchErr);
        results.push({ match_id: match.id, status: 'error', error: String(matchErr) });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Score ingestion failed:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
