// ============================================================
// Dual Cricket Data Provider Router
// Tries primary provider first, falls back to secondary
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// ============================================================
// Types
// ============================================================
export interface NormalizedPlayer {
  external_id: string;
  name: string;
  team: string;
  batting: {
    runs: number;
    balls_faced: number;
    fours: number;
    sixes: number;
    strike_rate: number;
    out: boolean;
  } | null;
  bowling: {
    overs: number;
    maidens: number;
    runs_conceded: number;
    wickets: number;
    economy: number;
  } | null;
  fielding: {
    catches: number;
    run_outs: number;
    stumpings: number;
  };
  status: 'batting' | 'bowling' | 'out' | 'waiting';
}

export interface NormalizedMatchData {
  external_id: string;
  status: 'live' | 'completed';
  innings: number;
  score_a: string;
  score_b: string;
  result: string | null;
  players: NormalizedPlayer[];
}

interface ProviderConfig {
  id: string;
  api_key: string;
  base_url: string;
  is_primary: boolean;
  enabled: boolean;
  rate_limit_per_day: number | null;
  calls_today: number;
  last_reset_at: string;
}

// ============================================================
// Provider Router
// ============================================================
export async function fetchLiveMatchData(externalMatchId: string): Promise<NormalizedMatchData | null> {
  const { data: providers } = await supabase
    .from('provider_config')
    .select('*')
    .eq('enabled', true)
    .order('is_primary', { ascending: false });

  if (!providers || providers.length === 0) {
    console.error('No providers configured');
    return null;
  }

  // Reset daily counters if needed
  for (const provider of providers) {
    const today = new Date().toISOString().split('T')[0];
    if (provider.last_reset_at !== today) {
      await supabase
        .from('provider_config')
        .update({ calls_today: 0, last_reset_at: today })
        .eq('id', provider.id);
      provider.calls_today = 0;
    }
  }

  // Try providers in order (primary first)
  for (const provider of providers) {
    // Check rate limit
    if (provider.rate_limit_per_day && provider.calls_today >= provider.rate_limit_per_day) {
      console.warn(`Provider ${provider.id} rate-limited (${provider.calls_today}/${provider.rate_limit_per_day})`);
      continue;
    }

    try {
      const data = await fetchFromProvider(provider, externalMatchId);
      if (data) {
        // Increment call counter
        await supabase
          .from('provider_config')
          .update({ calls_today: provider.calls_today + 1 })
          .eq('id', provider.id);
        return data;
      }
    } catch (err) {
      console.error(`Provider ${provider.id} failed:`, err);
      continue; // Try next provider
    }
  }

  console.error('All providers failed for match:', externalMatchId);
  return null;
}

// ============================================================
// Provider-Specific Fetchers
// ============================================================
async function fetchFromProvider(config: ProviderConfig, matchId: string): Promise<NormalizedMatchData | null> {
  switch (config.id) {
    case 'cricketdata':
      return fetchFromCricketData(config, matchId);
    case 'sportmonks':
      return fetchFromSportmonks(config, matchId);
    default:
      throw new Error(`Unknown provider: ${config.id}`);
  }
}

// ============================================================
// CricketData.org (CricAPI)
// Endpoint: https://api.cricapi.com/v1/match_scorecard?apikey=KEY&id=MATCH_ID
// ============================================================
async function fetchFromCricketData(config: ProviderConfig, matchId: string): Promise<NormalizedMatchData | null> {
  const url = `${config.base_url}/match_scorecard?apikey=${config.api_key}&id=${matchId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CricketData HTTP ${res.status}`);

  const json = await res.json();
  if (json.status !== 'success' || !json.data) return null;

  const match = json.data;
  const players: NormalizedPlayer[] = [];

  // Parse scorecard data
  // CricketData returns scorecard array with batting/bowling arrays per innings
  const scorecard = match.scorecard || match.score || [];

  // Process each innings scorecard
  for (const innings of (Array.isArray(scorecard) ? scorecard : [])) {
    // Batting
    for (const bat of (innings.batting || [])) {
      const existing = players.find(p => p.name === bat.batsman?.name);
      if (existing) {
        existing.batting = {
          runs: bat.r || 0,
          balls_faced: bat.b || 0,
          fours: bat['4s'] || 0,
          sixes: bat['6s'] || 0,
          strike_rate: bat.sr || 0,
          out: bat.dismissal !== 'not out' && bat.dismissal !== '',
        };
        existing.status = bat.dismissal && bat.dismissal !== 'not out' ? 'out' : 'batting';
      } else {
        players.push({
          external_id: bat.batsman?.id || bat.batsman?.name || '',
          name: bat.batsman?.name || 'Unknown',
          team: innings.inning?.split(' ')?.[0] || '',
          batting: {
            runs: bat.r || 0,
            balls_faced: bat.b || 0,
            fours: bat['4s'] || 0,
            sixes: bat['6s'] || 0,
            strike_rate: bat.sr || 0,
            out: bat.dismissal !== 'not out' && bat.dismissal !== '',
          },
          bowling: null,
          fielding: { catches: 0, run_outs: 0, stumpings: 0 },
          status: bat.dismissal && bat.dismissal !== 'not out' ? 'out' : 'batting',
        });
      }
    }

    // Bowling
    for (const bowl of (innings.bowling || [])) {
      const existing = players.find(p => p.name === bowl.bowler?.name);
      if (existing) {
        existing.bowling = {
          overs: bowl.o || 0,
          maidens: bowl.m || 0,
          runs_conceded: bowl.r || 0,
          wickets: bowl.w || 0,
          economy: bowl.eco || 0,
        };
        if (existing.status === 'waiting') existing.status = 'bowling';
      } else {
        players.push({
          external_id: bowl.bowler?.id || bowl.bowler?.name || '',
          name: bowl.bowler?.name || 'Unknown',
          team: '',
          batting: null,
          bowling: {
            overs: bowl.o || 0,
            maidens: bowl.m || 0,
            runs_conceded: bowl.r || 0,
            wickets: bowl.w || 0,
            economy: bowl.eco || 0,
          },
          fielding: { catches: 0, run_outs: 0, stumpings: 0 },
          status: 'bowling',
        });
      }
    }
  }

  // Parse scores
  const scores = match.score || [];
  const scoreA = scores[0] ? `${scores[0].r}/${scores[0].w} (${scores[0].o})` : '';
  const scoreB = scores[1] ? `${scores[1].r}/${scores[1].w} (${scores[1].o})` : '';

  return {
    external_id: matchId,
    status: match.matchEnded ? 'completed' : 'live',
    innings: scores.length,
    score_a: scoreA,
    score_b: scoreB,
    result: match.status || null,
    players,
  };
}

// ============================================================
// Sportmonks Cricket API
// Endpoint: https://cricket.sportmonks.com/api/v2.0/livescores?api_token=KEY&include=batting,bowling,runs,lineup
// ============================================================
async function fetchFromSportmonks(config: ProviderConfig, matchId: string): Promise<NormalizedMatchData | null> {
  const url = `${config.base_url}/fixtures/${matchId}?api_token=${config.api_key}&include=batting,bowling,runs,lineup`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sportmonks HTTP ${res.status}`);

  const json = await res.json();
  const match = json.data;
  if (!match) return null;

  const players: NormalizedPlayer[] = [];

  // Process batting scoreboards
  for (const bat of (match.batting || [])) {
    players.push({
      external_id: String(bat.player_id),
      name: bat.player_name || `Player ${bat.player_id}`,
      team: bat.team_id ? String(bat.team_id) : '',
      batting: {
        runs: bat.score || 0,
        balls_faced: bat.ball || 0,
        fours: bat.four_x || 0,
        sixes: bat.six_x || 0,
        strike_rate: bat.rate || 0,
        out: bat.result?.is_wicket || false,
      },
      bowling: null,
      fielding: { catches: 0, run_outs: 0, stumpings: 0 },
      status: bat.result?.is_wicket ? 'out' : 'batting',
    });
  }

  // Process bowling scoreboards
  for (const bowl of (match.bowling || [])) {
    const existing = players.find(p => p.external_id === String(bowl.player_id));
    const bowlingData = {
      overs: bowl.overs || 0,
      maidens: bowl.medians || 0,
      runs_conceded: bowl.runs || 0,
      wickets: bowl.wickets || 0,
      economy: bowl.rate || 0,
    };

    if (existing) {
      existing.bowling = bowlingData;
      if (existing.status === 'waiting') existing.status = 'bowling';
    } else {
      players.push({
        external_id: String(bowl.player_id),
        name: bowl.player_name || `Player ${bowl.player_id}`,
        team: bowl.team_id ? String(bowl.team_id) : '',
        batting: null,
        bowling: bowlingData,
        fielding: { catches: 0, run_outs: 0, stumpings: 0 },
        status: 'bowling',
      });
    }
  }

  // Parse runs/scores
  const runs = match.runs || [];
  const scoreA = runs[0] ? `${runs[0].score}/${runs[0].wickets} (${runs[0].overs})` : '';
  const scoreB = runs[1] ? `${runs[1].score}/${runs[1].wickets} (${runs[1].overs})` : '';

  return {
    external_id: matchId,
    status: match.status === 'Finished' ? 'completed' : 'live',
    innings: runs.length,
    score_a: scoreA,
    score_b: scoreB,
    result: match.note || null,
    players,
  };
}
