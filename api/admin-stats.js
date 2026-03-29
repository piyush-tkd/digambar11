// Vercel Serverless Function: Admin Stats
// GET /api/admin-stats — returns signup and join counts

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://dpuglcubuhbzowrzmfxd.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayStart = `${today}T00:00:00Z`;

    // Get all profiles
    const { data: allProfiles, count: totalProfiles } = await supabase
      .from('profiles')
      .select('id, name, squad_name, created_at', { count: 'exact' });

    // Profiles created today
    const todayProfiles = (allProfiles || []).filter(p => p.created_at >= todayStart);

    // Get all contest entries
    const { data: allEntries } = await supabase
      .from('contest_entries')
      .select('id, user_id, contest_id, created_at');

    const todayEntries = (allEntries || []).filter(e => e.created_at >= todayStart);

    // Get user_teams
    const { data: allTeams } = await supabase
      .from('user_teams')
      .select('id, user_id, match_id, created_at');

    const todayTeams = (allTeams || []).filter(t => t.created_at >= todayStart);

    // Get matches summary
    const { data: matches } = await supabase
      .from('matches')
      .select('id, team_a, team_b, status, score_a, score_b')
      .order('starts_at', { ascending: true });

    return res.json({
      success: true,
      date: today,
      profiles: {
        total: totalProfiles || (allProfiles || []).length,
        today: todayProfiles.length,
        list: todayProfiles.map(p => ({ name: p.name, squad: p.squad_name, created: p.created_at })),
        all: (allProfiles || []).map(p => ({ name: p.name, squad: p.squad_name, created: p.created_at })),
      },
      teams: {
        total: (allTeams || []).length,
        today: todayTeams.length,
      },
      contest_entries: {
        total: (allEntries || []).length,
        today: todayEntries.length,
      },
      matches: (matches || []).map(m => ({
        teams: `${m.team_a} vs ${m.team_b}`,
        status: m.status,
        score_a: m.score_a,
        score_b: m.score_b,
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: String(err) });
  }
};
