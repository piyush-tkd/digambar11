// ============================================================
// Edge Function: Prize Distribution
// Called when a match completes — calculates final rankings
// and distributes prize pool to contest winners
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { match_id } = await req.json();

    if (!match_id) {
      return new Response(JSON.stringify({ error: 'match_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify match is completed
    const { data: match } = await supabase
      .from('matches')
      .select('id, status')
      .eq('id', match_id)
      .single();

    if (!match || match.status !== 'completed') {
      return new Response(JSON.stringify({ error: 'Match not completed yet' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Final recalculation of points
    await supabase.rpc('calculate_user_team_points', { p_match_id: match_id });

    // Get all contests for this match that are still live
    const { data: contests } = await supabase
      .from('contests')
      .select('id, prize_pool')
      .eq('match_id', match_id)
      .in('status', ['live', 'locked']);

    if (!contests || contests.length === 0) {
      return new Response(JSON.stringify({ message: 'No contests to settle', distributed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const contest of contests) {
      try {
        // Call the distribute_prizes database function
        const { error } = await supabase.rpc('distribute_prizes', {
          p_contest_id: contest.id,
        });

        if (error) {
          results.push({ contest_id: contest.id, status: 'error', error: error.message });
        } else {
          // Get the final standings
          const { data: entries } = await supabase
            .from('contest_entries')
            .select(`
              rank, winnings,
              profiles:user_id (name, squad_name),
              user_teams:user_team_id (total_points)
            `)
            .eq('contest_id', contest.id)
            .order('rank', { ascending: true });

          results.push({
            contest_id: contest.id,
            status: 'distributed',
            prize_pool: contest.prize_pool,
            standings: entries,
          });
        }
      } catch (err) {
        results.push({ contest_id: contest.id, status: 'error', error: String(err) });
      }
    }

    return new Response(JSON.stringify({
      match_id,
      contests_settled: results.length,
      results,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Prize distribution failed:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
