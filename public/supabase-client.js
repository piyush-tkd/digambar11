// ============================================================
// Digambar11 — Supabase Client Integration
// Supabase backend — all Sportmonks API calls go through Edge Functions
//
// SETUP: Replace SUPABASE_URL and SUPABASE_ANON_KEY below
//        with your actual Supabase project credentials
// ============================================================

(function() {
  'use strict';

  // ====== CONFIG ======
  // Get these from: Supabase Dashboard → Settings → API
  const SUPABASE_URL = 'https://dpuglcubuhbzowrzmfxd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdWdsY3VidWhiem93cnptZnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTQ4MDMsImV4cCI6MjA5MDEzMDgwM30.p2VjBD4KqUMuhX_JaSSZYJcSFw4DcDB3dMoQRTJT5nk';

  // Edge Function URLs
  const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

  // ====== SUPABASE SDK (loaded from CDN) ======
  // We'll load the SDK dynamically, then initialize
  let supabase = null;
  let currentUser = null;
  let realtimeChannel = null;

  async function initSupabase() {
    if (supabase) return supabase;

    // Import Supabase from CDN
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Check existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      currentUser = session.user;
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      currentUser = session?.user || null;
      if (event === 'SIGNED_OUT') {
        currentUser = null;
      }
    });

    return supabase;
  }

  // ====== AUTH MODULE ======
  const Auth = {
    async googleLogin() {
      const sb = await initSupabase();
      const { data, error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return data;
    },

    async getUser() {
      const sb = await initSupabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return null;

      // Fetch profile
      const { data: profile } = await sb
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return profile ? {
        id: user.id,
        email: user.email,
        name: profile.name,
        squadName: profile.squad_name,
        avatarUrl: profile.avatar_url,
        walletBalance: profile.wallet_balance,
      } : null;
    },

    async setSquadName(squadName) {
      const sb = await initSupabase();
      const user = currentUser;
      if (!user) return { success: false, error: 'Not logged in' };

      // Check uniqueness
      const { data: existing } = await sb
        .from('profiles')
        .select('id')
        .eq('squad_name', squadName)
        .neq('id', user.id)
        .single();

      if (existing) return { success: false, error: 'Name already taken' };

      const { error } = await sb
        .from('profiles')
        .update({ squad_name: squadName, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      return error ? { success: false, error: error.message } : { success: true };
    },

    async updateProfile(updates) {
      const sb = await initSupabase();
      if (!currentUser) return { success: false, error: 'Not logged in' };

      const { error } = await sb
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', currentUser.id);

      return error ? { success: false, error: error.message } : { success: true };
    },

    async logout() {
      const sb = await initSupabase();
      await sb.auth.signOut();
      currentUser = null;
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
    },
  };

  // ====== MATCHES MODULE ======
  const Matches = {
    async getMatches(status = null) {
      const sb = await initSupabase();
      let query = sb.from('matches').select('*').order('starts_at', { ascending: true });
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async getMatch(matchId) {
      const sb = await initSupabase();
      const { data, error } = await sb
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();
      if (error) throw error;
      return data;
    },

    async updateMatchScore(matchId, updates) {
      const sb = await initSupabase();
      if (!currentUser) return { success: false, error: 'Not logged in' };
      const allowed = {};
      if (updates.status) allowed.status = updates.status;
      if (updates.score_a !== undefined) allowed.score_a = updates.score_a || null;
      if (updates.score_b !== undefined) allowed.score_b = updates.score_b || null;
      if (updates.result !== undefined) allowed.result = updates.result || null;
      const { data, error } = await sb.from('matches')
        .update(allowed)
        .eq('id', matchId)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, match: data };
    },
  };

  // ====== PLAYERS MODULE ======
  const Players = {
    async getPlayers(team = null) {
      const sb = await initSupabase();
      let query = sb.from('players').select('*').order('credit', { ascending: false });
      if (team) query = query.eq('team', team);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async getPlayersByMatch(matchId) {
      const sb = await initSupabase();
      const { data: match } = await sb
        .from('matches')
        .select('team_a, team_b')
        .eq('id', matchId)
        .single();

      if (!match) return [];

      const { data, error } = await sb
        .from('players')
        .select('*')
        .in('team', [match.team_a, match.team_b])
        .order('credit', { ascending: false });

      if (error) throw error;
      return data;
    },
  };

  // ====== TEAM MODULE ======
  const Team = {
    async saveTeam(matchId, playerIds, captainId, viceCaptainId, impactPlayerId) {
      const sb = await initSupabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return { success: false, errors: ['Not logged in'] };

      // Deduplicate player IDs
      const uniquePlayerIds = [...new Set(playerIds)];

      // ===== CLIENT-SIDE VALIDATION =====
      const errors = [];
      if (!uniquePlayerIds || uniquePlayerIds.length !== 11) errors.push(`Must select exactly 11 players (got ${uniquePlayerIds?.length || 0})`);
      if (captainId && !uniquePlayerIds.includes(captainId)) errors.push('Captain must be in your team');
      if (viceCaptainId && !uniquePlayerIds.includes(viceCaptainId)) errors.push('Vice-captain must be in your team');
      if (captainId && captainId === viceCaptainId) errors.push('Captain and Vice-captain must be different');

      // Fetch player details for credit/role validation
      const { data: players, error: plErr } = await sb.from('players').select('id, name, team, role, credit, overseas').in('id', uniquePlayerIds);
      if (plErr || !players) return { success: false, errors: ['Failed to fetch player data'] };

      const totalCredits = players.reduce((s, p) => s + Number(p.credit), 0);
      if (totalCredits > 100) errors.push(`Total credits exceed 100 (got ${totalCredits})`);

      const overseasCount = players.filter(p => p.overseas).length;
      if (overseasCount > 4) errors.push(`Max 4 overseas players (got ${overseasCount})`);

      const rc = { WK: 0, BAT: 0, AR: 0, BWL: 0 };
      players.forEach(p => { rc[p.role] = (rc[p.role] || 0) + 1; });
      if (rc.WK < 1) errors.push('Need at least 1 Wicket-keeper');
      if (rc.BAT < 1) errors.push('Need at least 1 Batter');
      if (rc.AR < 1) errors.push('Need at least 1 All-rounder');
      if (rc.BWL < 1) errors.push('Need at least 1 Bowler');

      const tc = {};
      players.forEach(p => { tc[p.team] = (tc[p.team] || 0) + 1; });
      for (const [t, c] of Object.entries(tc)) { if (c > 10) errors.push(`Max 10 from one team (${t}: ${c})`); }

      if (errors.length > 0) return { success: false, errors };

      // Upsert user_team
      const { data: team, error: teamErr } = await sb.from('user_teams').upsert({
        user_id: session.user.id,
        match_id: matchId,
        captain_id: captainId,
        vice_captain_id: viceCaptainId,
        impact_player_id: impactPlayerId || null,
        total_credits: totalCredits,
        total_points: 0,
      }, { onConflict: 'user_id,match_id' }).select().single();

      if (teamErr || !team) return { success: false, errors: ['Failed to save team: ' + (teamErr?.message || 'unknown')] };

      // Replace players using upsert (avoids delete RLS issues entirely)
      // Step 1: Upsert all new players (creates or updates)
      const playerRows = uniquePlayerIds.map(pid => ({ user_team_id: team.id, player_id: pid }));
      const { error: upsertErr } = await sb.from('user_team_players')
        .upsert(playerRows, { onConflict: 'user_team_id,player_id' });
      if (upsertErr) return { success: false, errors: ['Failed to save players: ' + upsertErr.message] };

      // Step 2: Delete any old players that are NOT in the new selection
      const { error: cleanupErr } = await sb.from('user_team_players')
        .delete()
        .eq('user_team_id', team.id)
        .not('player_id', 'in', `(${uniquePlayerIds.join(',')})`);
      if (cleanupErr) console.warn('Cleanup of old players failed (non-critical):', cleanupErr.message);

      console.log('Team saved successfully');
      return { success: true, team_id: team.id, total_credits: totalCredits, composition: rc };
    },

    async getMyTeam(matchId) {
      const sb = await initSupabase();
      if (!currentUser) return null;

      const { data: team } = await sb
        .from('user_teams')
        .select(`
          *,
          user_team_players (
            player_id,
            players:player_id (*)
          )
        `)
        .eq('user_id', currentUser.id)
        .eq('match_id', matchId)
        .single();

      return team;
    },
  };

  // ====== CONTESTS MODULE ======
  const Contests = {
    async createContest(matchId, name, entryFee) {
      const sb = await initSupabase();
      if (!currentUser) return { success: false, error: 'Not logged in' };

      const { data, error } = await sb
        .from('contests')
        .insert({
          match_id: matchId,
          name: name || 'Friends League',
          created_by: currentUser.id,
          entry_fee: entryFee || 25,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, contest: data };
    },

    async joinContest(contestId, userTeamId) {
      const sb = await initSupabase();
      if (!currentUser) return { success: false, error: 'Not logged in' };

      // Check wallet balance
      const { data: profile } = await sb
        .from('profiles')
        .select('wallet_balance')
        .eq('id', currentUser.id)
        .single();

      const { data: contest } = await sb
        .from('contests')
        .select('entry_fee, prize_pool, max_entries')
        .eq('id', contestId)
        .single();

      if (!profile || !contest) return { success: false, error: 'Data not found' };
      if (profile.wallet_balance < contest.entry_fee) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Check max entries
      const { count } = await sb
        .from('contest_entries')
        .select('id', { count: 'exact' })
        .eq('contest_id', contestId);

      if (count >= contest.max_entries) {
        return { success: false, error: 'Contest is full' };
      }

      // Deduct entry fee
      const newBalance = profile.wallet_balance - contest.entry_fee;
      await sb.from('profiles').update({ wallet_balance: newBalance }).eq('id', currentUser.id);

      // Record transaction
      await sb.from('transactions').insert({
        user_id: currentUser.id,
        type: 'entry_fee',
        amount: -contest.entry_fee,
        description: 'Contest entry fee',
        contest_id: contestId,
        balance_after: newBalance,
      });

      // Update prize pool
      await sb.from('contests').update({
        prize_pool: contest.prize_pool + contest.entry_fee,
      }).eq('id', contestId);

      // Join contest
      const { error } = await sb
        .from('contest_entries')
        .insert({
          contest_id: contestId,
          user_id: currentUser.id,
          user_team_id: userTeamId,
        });

      if (error) return { success: false, error: error.message };
      return { success: true };
    },

    async getContestsByMatch(matchId) {
      const sb = await initSupabase();
      const { data, error } = await sb
        .from('contests')
        .select(`
          *,
          contest_entries (
            user_id,
            rank,
            winnings,
            profiles:user_id (name, squad_name),
            user_teams:user_team_id (
              id,
              total_points,
              captain_id,
              vice_captain_id,
              user_team_players (
                player_id,
                players:player_id (id, name, team, role)
              )
            )
          )
        `)
        .eq('match_id', matchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    // Auto-join (or create) the Friends League for a match when user saves a team
    async joinFriendsLeague(matchId, userTeamId) {
      const sb = await initSupabase();
      if (!currentUser) return { success: false, error: 'Not logged in' };

      // 1. Find existing Friends League contest for this match, or create one
      let { data: contest } = await sb
        .from('contests')
        .select('id, entry_fee, prize_pool, max_entries')
        .eq('match_id', matchId)
        .eq('name', 'Friends League')
        .single();

      if (!contest) {
        // Create the Friends League contest for this match
        const { data: newContest, error: createErr } = await sb
          .from('contests')
          .insert({
            match_id: matchId,
            name: 'Friends League',
            created_by: currentUser.id,
            entry_fee: 25,
            max_entries: 10,
            prize_pool: 0,
          })
          .select()
          .single();
        if (createErr) return { success: false, error: 'Failed to create contest: ' + createErr.message };
        contest = newContest;
      }

      // 2. Check if user already joined this contest
      const { data: existing } = await sb
        .from('contest_entries')
        .select('id')
        .eq('contest_id', contest.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (existing) {
        // Already joined — just update the team reference
        await sb.from('contest_entries').update({ user_team_id: userTeamId }).eq('id', existing.id);
        return { success: true, alreadyJoined: true };
      }

      // 3. Check wallet balance
      const { data: profile } = await sb
        .from('profiles')
        .select('wallet_balance')
        .eq('id', currentUser.id)
        .single();

      if (!profile) return { success: false, error: 'Profile not found' };
      if (profile.wallet_balance < contest.entry_fee) {
        return { success: false, error: 'Insufficient balance. Need ₹' + contest.entry_fee + ', have ₹' + profile.wallet_balance };
      }

      // 4. Check max entries
      const { count } = await sb
        .from('contest_entries')
        .select('id', { count: 'exact' })
        .eq('contest_id', contest.id);

      if (count >= contest.max_entries) {
        return { success: false, error: 'Contest is full (' + contest.max_entries + ' players max)' };
      }

      // 5. Deduct entry fee
      const newBalance = profile.wallet_balance - contest.entry_fee;
      await sb.from('profiles').update({ wallet_balance: newBalance }).eq('id', currentUser.id);

      // 6. Record transaction
      await sb.from('transactions').insert({
        user_id: currentUser.id,
        type: 'entry_fee',
        amount: -contest.entry_fee,
        description: 'Friends League entry — Match',
        contest_id: contest.id,
        balance_after: newBalance,
      });

      // 7. Update prize pool
      await sb.from('contests').update({
        prize_pool: (contest.prize_pool || 0) + contest.entry_fee,
      }).eq('id', contest.id);

      // 8. Join contest
      const { error: joinErr } = await sb
        .from('contest_entries')
        .insert({
          contest_id: contest.id,
          user_id: currentUser.id,
          user_team_id: userTeamId,
        });

      if (joinErr) return { success: false, error: 'Failed to join: ' + joinErr.message };
      return { success: true, newBalance };
    },

    async joinByInviteCode(inviteCode) {
      const sb = await initSupabase();
      const { data: contest } = await sb
        .from('contests')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();

      if (!contest) return { success: false, error: 'Invalid invite code' };
      return { contestId: contest.id };
    },
  };

  // ====== LIVE SCORES MODULE ======
  const LiveScores = {
    async getLiveScores(matchId) {
      const sb = await initSupabase();
      const { data, error } = await sb
        .from('live_scores')
        .select(`
          *,
          players:player_id (name, team, role, credit)
        `)
        .eq('match_id', matchId)
        .order('fantasy_pts', { ascending: false });

      if (error) throw error;
      return data;
    },

    // Subscribe to real-time score updates
    async subscribeToMatch(matchId, onUpdate) {
      const sb = await initSupabase();

      // Clean up existing subscription
      if (realtimeChannel) {
        sb.removeChannel(realtimeChannel);
      }

      realtimeChannel = sb
        .channel(`live-scores-${matchId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'live_scores',
          filter: `match_id=eq.${matchId}`,
        }, (payload) => {
          onUpdate(payload);
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        }, (payload) => {
          onUpdate({ type: 'match_update', ...payload });
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_teams',
          filter: `match_id=eq.${matchId}`,
        }, (payload) => {
          onUpdate({ type: 'team_update', ...payload });
        })
        .subscribe();

      return realtimeChannel;
    },

    unsubscribe() {
      if (realtimeChannel && supabase) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
    },
  };

  // ====== WALLET MODULE ======
  const Wallet = {
    async getBalance() {
      const sb = await initSupabase();
      if (!currentUser) return 0;

      const { data } = await sb
        .from('profiles')
        .select('wallet_balance')
        .eq('id', currentUser.id)
        .single();

      return data?.wallet_balance || 0;
    },

    async getTransactions(limit = 20) {
      const sb = await initSupabase();
      if (!currentUser) return [];

      const { data, error } = await sb
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  };

  // ====== LEADERBOARD MODULE ======
  const Leaderboard = {
    async getMatchLeaderboard(matchId) {
      const sb = await initSupabase();
      const { data, error } = await sb
        .from('user_teams')
        .select(`
          total_points, rank,
          profiles:user_id (name, squad_name)
        `)
        .eq('match_id', matchId)
        .order('total_points', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },

    async getContestLeaderboard(contestId) {
      const sb = await initSupabase();
      const { data, error } = await sb
        .from('contest_entries')
        .select(`
          rank, winnings,
          profiles:user_id (name, squad_name),
          user_teams:user_team_id (total_points)
        `)
        .eq('contest_id', contestId)
        .order('rank', { ascending: true });

      if (error) throw error;
      return data;
    },
  };

  // ====== FRIENDS MODULE ======
  const Friends = {
    async getFriends() {
      // For now, friends are users in the same contests
      const sb = await initSupabase();
      if (!currentUser) return [];

      const { data: myEntries } = await sb
        .from('contest_entries')
        .select('contest_id')
        .eq('user_id', currentUser.id);

      if (!myEntries || myEntries.length === 0) return [];

      const contestIds = myEntries.map(e => e.contest_id);
      const { data: friendEntries } = await sb
        .from('contest_entries')
        .select('profiles:user_id (id, name, squad_name, avatar_url)')
        .in('contest_id', contestIds)
        .neq('user_id', currentUser.id);

      // Deduplicate
      const seen = new Set();
      return (friendEntries || [])
        .map(e => e.profiles)
        .filter(p => {
          if (!p || seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
    },
  };

  // ====== ADMIN / SYNC MODULE ======
  // All Sportmonks API calls go through Supabase Edge Functions (server-side)
  // to avoid CORS issues. The Edge Function handles Sportmonks → DB sync.
  // Browser clients never call Sportmonks directly.

  const Admin = {
    // ============================================================
    // Sync IPL matches via Edge Function (Sportmonks API)
    // The Edge Function runs server-side — no CORS issues with Sportmonks.
    // ============================================================
    async syncMatches() {
      console.log('Syncing IPL matches via Edge Function (Sportmonks)...');
      try {
        const res = await fetch(`${FUNCTIONS_URL}/match-sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        const result = await res.json();
        console.log('Match sync complete:', result);
        return result;
      } catch (err) {
        console.error('Match sync failed:', err);
        return { success: false, error: String(err) };
      }
    },

    // Trigger live score update via Vercel serverless function
    async triggerLiveUpdate(matchExternalId) {
      console.log(`Triggering live update for match ${matchExternalId}...`);
      try {
        const res = await fetch('/api/live-score', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        return await res.json();
      } catch (err) {
        console.error('Live update failed:', err);
        return { success: false, error: String(err) };
      }
    },

    // Check provider status via Edge Function
    async getProviderStatus() {
      try {
        const res = await fetch(`${FUNCTIONS_URL}/match-sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'status' }),
        });
        return await res.json();
      } catch {
        return { reachable: false, provider: 'unknown' };
      }
    },
  };

  // ====== LIVE SCORE POLLING (reads from Supabase DB) ======
  let _scorePollingInterval = null;

  const ScorePoller = {
    // Start polling live scores from Supabase every N seconds
    // This reads from the DB — NOT from any external API. Safe for all 50 users.
    startPolling(matchId, onUpdate, intervalMs = 30000) {
      this.stopPolling(); // clear any existing

      const poll = async () => {
        try {
          const scores = await LiveScores.getLiveScores(matchId);
          if (onUpdate) onUpdate(scores);
        } catch (err) {
          console.warn('Score poll failed:', err);
        }
      };

      // Immediate first fetch
      poll();
      _scorePollingInterval = setInterval(poll, intervalMs);
      console.log(`Score polling started for match ${matchId} (every ${intervalMs/1000}s)`);
    },

    stopPolling() {
      if (_scorePollingInterval) {
        clearInterval(_scorePollingInterval);
        _scorePollingInterval = null;
        console.log('Score polling stopped');
      }
    },
  };

  // ====== CENTRALIZED LIVE MATCH UPDATER ======
  // Only ONE person (admin/host) runs this. It calls the Edge Function
  // every 30 seconds which fetches live scores from Sportmonks server-side
  // and writes to Supabase. All other users get instant updates via
  // Supabase Realtime subscriptions — zero external API calls from browser.
  //
  // With Sportmonks Major Plan: 2000 requests/hour, ball-by-ball accuracy.

  let _liveUpdaterInterval = null;

  const LiveMatchUpdater = {
    // Start centralized score updates (admin only — run on ONE browser tab)
    async startUpdating(matchExternalId, intervalMs = 30000) {
      this.stopUpdating();

      console.log(`ADMIN: Starting live score updates for match ${matchExternalId} (every ${intervalMs/1000}s)`);
      console.log('All calls go through Vercel serverless function. Users get Realtime push.');

      const update = async () => {
        try {
          const result = await Admin.triggerLiveUpdate(matchExternalId);
          if (result.success) {
            console.log(`Score updated: ${result.score_a || '?'} vs ${result.score_b || '?'} [${result.status || '?'}]`);
          }
          // Auto-stop when match is completed
          if (result.status === 'completed') {
            console.log('Match completed! Stopping live updates.');
            this.stopUpdating();
          }
        } catch (err) {
          console.warn('Live update failed:', err);
        }
      };

      // Immediate first fetch
      await update();
      _liveUpdaterInterval = setInterval(update, intervalMs);
    },

    stopUpdating() {
      if (_liveUpdaterInterval) {
        clearInterval(_liveUpdaterInterval);
        _liveUpdaterInterval = null;
        console.log('ADMIN: Live score updates stopped');
      }
    },

    isUpdating() {
      return _liveUpdaterInterval !== null;
    },
  };

  // ====== EXPOSE PUBLIC API ======
  window.D11API = {
    // Init
    init: initSupabase,

    // Auth
    googleLogin: Auth.googleLogin,
    getUser: Auth.getUser,
    setSquadName: Auth.setSquadName,
    updateProfile: Auth.updateProfile,
    logout: Auth.logout,

    // Matches
    getMatches: Matches.getMatches,
    getMatch: Matches.getMatch,
    updateMatchScore: Matches.updateMatchScore,

    // Players
    getPlayers: Players.getPlayers,
    getPlayersByMatch: Players.getPlayersByMatch,

    // Team
    saveTeam: Team.saveTeam,
    getMyTeam: Team.getMyTeam,

    // Contests
    createContest: Contests.createContest,
    joinContest: Contests.joinContest,
    joinFriendsLeague: Contests.joinFriendsLeague,
    getContestsByMatch: Contests.getContestsByMatch,
    joinByInviteCode: Contests.joinByInviteCode,

    // Live Scores
    getLiveScores: LiveScores.getLiveScores,
    subscribeToMatch: LiveScores.subscribeToMatch,
    unsubscribeLive: LiveScores.unsubscribe,

    // Score Polling (alternative to Realtime for live updates)
    startScorePolling: ScorePoller.startPolling.bind(ScorePoller),
    stopScorePolling: ScorePoller.stopPolling.bind(ScorePoller),

    // Wallet
    getBalance: Wallet.getBalance,
    getTransactions: Wallet.getTransactions,

    // Leaderboard
    getMatchLeaderboard: Leaderboard.getMatchLeaderboard,
    getContestLeaderboard: Leaderboard.getContestLeaderboard,

    // Friends
    getFriends: Friends.getFriends,

    // Admin / Sync (all API calls go through Edge Functions — no CORS issues)
    syncMatches: Admin.syncMatches.bind(Admin),
    triggerLiveUpdate: Admin.triggerLiveUpdate.bind(Admin),
    getProviderStatus: Admin.getProviderStatus.bind(Admin),

    // Live Match Updater (ADMIN ONLY — run on exactly ONE browser tab)
    // Fetches scores from Sportmonks every 30s via Edge Function, writes to DB,
    // all 50 users get instant Realtime push — zero extra API calls.
    startLiveUpdates: LiveMatchUpdater.startUpdating.bind(LiveMatchUpdater),
    stopLiveUpdates: LiveMatchUpdater.stopUpdating.bind(LiveMatchUpdater),
    isLiveUpdating: LiveMatchUpdater.isUpdating.bind(LiveMatchUpdater),
  };

  console.log('🏏 D11API (Supabase + Sportmonks) loaded — real backend ready');
  console.log('💡 D11API.syncMatches() — syncs 70+ IPL fixtures via Sportmonks (server-side, no CORS)');
  console.log('💡 D11API.startLiveUpdates("sm_12345") — starts live score polling for a match');
})();
