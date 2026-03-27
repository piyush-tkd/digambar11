// ============================================================
// Digambar11 — Supabase Client Integration
// Replaces mock api.js with real Supabase backend
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
    async saveTeam(matchId, playerIds, captainId, viceCaptainId) {
      const sb = await initSupabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return { success: false, errors: ['Not logged in'] };

      // Call team-validation Edge Function
      const res = await fetch(`${FUNCTIONS_URL}/team-validation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_id: matchId,
          player_ids: playerIds,
          captain_id: captainId,
          vice_captain_id: viceCaptainId,
        }),
      });

      return await res.json();
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
            user_teams:user_team_id (total_points)
          )
        `)
        .eq('match_id', matchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
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

    // Players
    getPlayers: Players.getPlayers,
    getPlayersByMatch: Players.getPlayersByMatch,

    // Team
    saveTeam: Team.saveTeam,
    getMyTeam: Team.getMyTeam,

    // Contests
    createContest: Contests.createContest,
    joinContest: Contests.joinContest,
    getContestsByMatch: Contests.getContestsByMatch,
    joinByInviteCode: Contests.joinByInviteCode,

    // Live Scores
    getLiveScores: LiveScores.getLiveScores,
    subscribeToMatch: LiveScores.subscribeToMatch,
    unsubscribeLive: LiveScores.unsubscribe,

    // Wallet
    getBalance: Wallet.getBalance,
    getTransactions: Wallet.getTransactions,

    // Leaderboard
    getMatchLeaderboard: Leaderboard.getMatchLeaderboard,
    getContestLeaderboard: Leaderboard.getContestLeaderboard,

    // Friends
    getFriends: Friends.getFriends,
  };

  console.log('🏏 D11API (Supabase) loaded — real backend ready');
})();
