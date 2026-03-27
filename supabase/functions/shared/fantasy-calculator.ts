// ============================================================
// Fantasy Points Calculator
// Converts raw cricket stats → fantasy points
// Based on Dream11-style scoring system
// ============================================================

import type { NormalizedPlayer } from './provider.ts';

export interface FantasyBreakdown {
  batting_pts: number;
  bowling_pts: number;
  fielding_pts: number;
  bonus_pts: number;
  total_pts: number;
}

export function calculateFantasyPoints(player: NormalizedPlayer): FantasyBreakdown {
  let batting_pts = 0;
  let bowling_pts = 0;
  let fielding_pts = 0;
  let bonus_pts = 0;

  // =====================
  // BATTING POINTS
  // =====================
  if (player.batting) {
    const b = player.batting;

    // Runs scored: +1 per run
    batting_pts += b.runs;

    // Boundaries: +1 bonus per four
    batting_pts += b.fours;

    // Sixes: +2 bonus per six
    batting_pts += b.sixes * 2;

    // Milestones
    if (b.runs >= 100) {
      bonus_pts += 16; // Century
    } else if (b.runs >= 50) {
      bonus_pts += 8;  // Half-century
    } else if (b.runs >= 30) {
      bonus_pts += 4;  // 30-run bonus
    }

    // Duck penalty (out for 0, must have faced at least 1 ball)
    if (b.out && b.runs === 0 && b.balls_faced > 0) {
      batting_pts -= 2;
    }

    // Strike rate bonus/penalty (min 10 balls)
    if (b.balls_faced >= 10) {
      if (b.strike_rate >= 170) bonus_pts += 6;
      else if (b.strike_rate >= 150) bonus_pts += 4;
      else if (b.strike_rate >= 130) bonus_pts += 2;
      else if (b.strike_rate < 60) bonus_pts -= 6;
      else if (b.strike_rate < 70) bonus_pts -= 4;
      else if (b.strike_rate < 80) bonus_pts -= 2;
    }
  }

  // =====================
  // BOWLING POINTS
  // =====================
  if (player.bowling) {
    const bw = player.bowling;

    // Wickets: +25 per wicket
    bowling_pts += bw.wickets * 25;

    // Wicket haul bonuses
    if (bw.wickets >= 5) {
      bonus_pts += 8;  // 5-wicket haul
    } else if (bw.wickets >= 3) {
      bonus_pts += 4;  // 3-wicket haul
    }

    // Maidens: +12 per maiden
    bowling_pts += bw.maidens * 12;

    // Economy bonus/penalty (min 2 overs)
    if (bw.overs >= 2) {
      if (bw.economy < 5) bonus_pts += 6;
      else if (bw.economy < 6) bonus_pts += 4;
      else if (bw.economy < 7) bonus_pts += 2;
      else if (bw.economy > 12) bonus_pts -= 6;
      else if (bw.economy > 11) bonus_pts -= 4;
      else if (bw.economy > 10) bonus_pts -= 2;
    }
  }

  // =====================
  // FIELDING POINTS
  // =====================
  if (player.fielding) {
    const f = player.fielding;

    // Catches: +8 per catch
    fielding_pts += f.catches * 8;

    // Run outs: +12 per direct run out (simplified: all run outs treated equally)
    fielding_pts += f.run_outs * 12;

    // Stumpings: +12 per stumping
    fielding_pts += f.stumpings * 12;

    // 3+ catches bonus
    if (f.catches >= 3) bonus_pts += 4;
  }

  const total_pts = batting_pts + bowling_pts + fielding_pts + bonus_pts;

  return {
    batting_pts: Math.round(batting_pts * 10) / 10,
    bowling_pts: Math.round(bowling_pts * 10) / 10,
    fielding_pts: Math.round(fielding_pts * 10) / 10,
    bonus_pts: Math.round(bonus_pts * 10) / 10,
    total_pts: Math.round(total_pts * 10) / 10,
  };
}
