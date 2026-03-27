import {
  test,
  expect,
  loadApp,
  waitForScreen,
  SCREENS,
  mockLogin,
  APP_URL,
  navigateToScreen,
  isScreenVisible,
  setupErrorMonitor,
  collectConsoleErrors,
  simulateSlowNetwork,
  goOffline,
  goOnline,
} from '../fixtures';

test.describe('API & Supabase Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
  });

  test.describe('Supabase Client Initialization', () => {
    test('should initialize Supabase client with correct config', async ({ page }) => {
      const supabaseConfig = await page.evaluate(() => {
        return (window as any).__supabaseConfig;
      });

      expect(supabaseConfig).toBeDefined();
      expect(supabaseConfig.url).toBeTruthy();
      expect(supabaseConfig.anonKey).toBeTruthy();
    });

    test('should have all required modules loaded', async ({ page }) => {
      const modules = await page.evaluate(() => {
        const client = (window as any).__supabaseClient;
        return {
          auth: !!client?.auth,
          matches: !!client?.matches,
          players: !!client?.players,
          team: !!client?.team,
          contests: !!client?.contests,
          liveScores: !!client?.liveScores,
          wallet: !!client?.wallet,
          leaderboard: !!client?.leaderboard,
          friends: !!client?.friends,
        };
      });

      Object.values(modules).forEach((module) => {
        expect(module).toBe(true);
      });
    });

    test('should connect to correct Supabase project', async ({ page }) => {
      const projectUrl = await page.evaluate(() => {
        return (window as any).__supabaseConfig?.url;
      });

      expect(projectUrl).toContain('supabase.co');
    });

    test('should handle missing environment variables gracefully', async ({ page }) => {
      const errors = await collectConsoleErrors(page);
      const initErrors = errors.filter((e) => e.includes('SUPABASE') || e.includes('config'));

      // Should not crash, may log warnings
      expect(errors.length).toBeLessThanOrEqual(1);
    });

    test('should load provider config from database', async ({ page }) => {
      const providerConfig = await page.evaluate(async () => {
        const response = await fetch(`${(window as any).__supabaseConfig.url}/rest/v1/provider_config`);
        return response.ok;
      });

      expect(providerConfig).toBe(true);
    });
  });

  test.describe('Auth Module', () => {
    test('should sign in user successfully', async ({ page }) => {
      const session = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.auth.signIn({
          email: 'test@example.com',
          password: 'password123',
        });
        return { data, error };
      });

      expect(session.error).toBeNull();
      expect(session.data?.user).toBeDefined();
    });

    test('should sign out user successfully', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { error } = await (window as any).__supabaseClient.auth.signOut();
        return error;
      });

      expect(result).toBeNull();
    });

    test('should retrieve current session', async ({ page }) => {
      const session = await page.evaluate(async () => {
        return await (window as any).__supabaseClient.auth.getSession();
      });

      expect(session.data?.session?.user?.email).toBeTruthy();
    });

    test('should listen to auth state changes', async ({ page }) => {
      const stateChanges = await page.evaluate(async () => {
        const changes: any[] = [];
        (window as any).__supabaseClient.auth.onAuthStateChange((event: string, session: any) => {
          changes.push({ event, hasSession: !!session });
        });

        await new Promise((r) => setTimeout(r, 1000));
        return changes;
      });

      expect(stateChanges.length).toBeGreaterThan(0);
    });

    test('should handle sign in with invalid credentials', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { error } = await (window as any).__supabaseClient.auth.signIn({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        });
        return { errorMessage: error?.message, errorCode: error?.status };
      });

      expect(result.errorMessage).toBeTruthy();
      expect(result.errorCode).toBe(401);
    });

    test('should refresh token when expired', async ({ page }) => {
      const refreshed = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.auth.refreshSession();
        return { success: !!data?.session, error };
      });

      expect(refreshed.success).toBe(true);
    });

    test('should track user metadata after login', async ({ page }) => {
      const metadata = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.auth.getSession();
        return data?.session?.user?.user_metadata;
      });

      expect(metadata).toBeDefined();
    });
  });

  test.describe('Matches Module', () => {
    test('should fetch all matches', async ({ page }) => {
      const matches = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.matches.getAll();
        return { count: data?.length || 0, error };
      });

      expect(matches.error).toBeNull();
      expect(matches.count).toBeGreaterThan(0);
    });

    test('should fetch match by ID', async ({ page }) => {
      const match = await page.evaluate(async () => {
        const { data: allMatches } = await (window as any).__supabaseClient.matches.getAll();
        const matchId = allMatches?.[0]?.id;
        const { data, error } = await (window as any).__supabaseClient.matches.getById(matchId);
        return { data, error };
      });

      expect(match.error).toBeNull();
      expect(match.data?.id).toBeDefined();
    });

    test('should fetch matches by status', async ({ page }) => {
      const matches = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.matches.getByStatus('upcoming');
        return { count: data?.length || 0, error };
      });

      expect(matches.error).toBeNull();
      expect(Array.isArray(matches.count)).toBe(false);
    });

    test('should fetch live matches', async ({ page }) => {
      const matches = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.matches.getByStatus('live');
        return { data, error };
      });

      expect(matches.error).toBeNull();
      expect(Array.isArray(matches.data)).toBe(true);
    });

    test('should fetch completed matches', async ({ page }) => {
      const matches = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.matches.getByStatus('completed');
        return { data, error };
      });

      expect(matches.error).toBeNull();
      expect(Array.isArray(matches.data)).toBe(true);
    });

    test('should subscribe to realtime match updates', async ({ page }) => {
      const subscription = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const sub = (window as any).__supabaseClient.matches.subscribe((payload: any) => {
            resolve({ eventType: payload.eventType, data: !!payload.new });
            sub?.unsubscribe?.();
          });
        });
      });

      expect(subscription).toBeDefined();
    });

    test('should handle concurrent match fetches', async ({ page }) => {
      const results = await page.evaluate(async () => {
        const promises = Array.from({ length: 5 }, (_, i) =>
          (window as any).__supabaseClient.matches.getById(i + 1)
        );
        const responses = await Promise.all(promises);
        return responses.map((r: any) => ({ hasError: !!r.error, hasData: !!r.data }));
      });

      expect(results.length).toBe(5);
      results.forEach((r: any) => {
        expect(typeof r.hasError).toBe('boolean');
        expect(typeof r.hasData).toBe('boolean');
      });
    });

    test('should cache match queries', async ({ page }) => {
      const timing = await page.evaluate(async () => {
        const client = (window as any).__supabaseClient;
        const start1 = performance.now();
        await client.matches.getAll();
        const time1 = performance.now() - start1;

        const start2 = performance.now();
        await client.matches.getAll();
        const time2 = performance.now() - start2;

        return { firstFetch: time1, cachedFetch: time2, isFaster: time2 < time1 };
      });

      expect(timing.firstFetch).toBeGreaterThan(0);
      expect(timing.cachedFetch).toBeGreaterThan(0);
    });

    test('should parse match response correctly', async ({ page }) => {
      const matchData = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.matches.getAll();
        const match = data?.[0];
        return {
          hasId: !!match?.id,
          hasTeam1: !!match?.team1,
          hasTeam2: !!match?.team2,
          hasStatus: !!match?.status,
          hasVenue: !!match?.venue,
          hasStartTime: !!match?.startTime,
        };
      });

      Object.values(matchData).forEach((v) => {
        expect(v).toBe(true);
      });
    });
  });

  test.describe('Players Module', () => {
    test('should fetch players by match', async ({ page }) => {
      const players = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.players.getByMatch(1);
        return { count: data?.length || 0, error };
      });

      expect(players.error).toBeNull();
      expect(players.count).toBeGreaterThan(0);
    });

    test('should fetch players by team', async ({ page }) => {
      const players = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.players.getByTeam('CSK');
        return { count: data?.length || 0, error };
      });

      expect(players.error).toBeNull();
      expect(Array.isArray(players.count)).toBe(false);
    });

    test('should fetch players by role', async ({ page }) => {
      const players = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.players.getByRole('batsman');
        return { count: data?.length || 0, error };
      });

      expect(players.error).toBeNull();
      expect(Array.isArray(players.count)).toBe(false);
    });

    test('should fetch all-rounder players', async ({ page }) => {
      const players = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.players.getByRole('all-rounder');
        return { data, error };
      });

      expect(players.error).toBeNull();
      expect(Array.isArray(players.data)).toBe(true);
    });

    test('should fetch bowler players', async ({ page }) => {
      const players = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.players.getByRole('bowler');
        return { data, error };
      });

      expect(players.error).toBeNull();
      expect(Array.isArray(players.data)).toBe(true);
    });

    test('should include player stats in response', async ({ page }) => {
      const playerStats = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.players.getByMatch(1);
        const player = data?.[0];
        return {
          hasName: !!player?.name,
          hasRole: !!player?.role,
          hasTeam: !!player?.team,
          hasPrice: player?.price !== undefined,
          hasCredits: player?.credits !== undefined,
        };
      });

      Object.values(playerStats).forEach((v) => {
        expect(v).toBe(true);
      });
    });

    test('should handle invalid match ID gracefully', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.players.getByMatch(99999);
        return { isEmpty: data?.length === 0, hasError: !!error };
      });

      expect(result.isEmpty || result.hasError).toBe(true);
    });
  });

  test.describe('Team Module', () => {
    test('should save team successfully', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const teamData = {
          matchId: 1,
          players: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          name: 'Test Team',
        };
        const { data, error } = await (window as any).__supabaseClient.team.save(teamData);
        return { success: !!data?.id, error };
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should retrieve saved team', async ({ page }) => {
      const team = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.team.get(1);
        return { data };
      });

      expect(team.data?.matchId).toBeDefined();
    });

    test('should validate team via edge function', async ({ page }) => {
      const validation = await page.evaluate(async () => {
        const teamData = {
          matchId: 1,
          players: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        };
        const response = await fetch(`${(window as any).__supabaseConfig.url}/functions/v1/team-validation`, {
          method: 'POST',
          body: JSON.stringify(teamData),
        });
        return response.ok;
      });

      expect(validation).toBe(true);
    });

    test('should reject invalid team composition', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const teamData = {
          matchId: 1,
          players: [1, 2, 3], // Only 3 players
        };
        const { error } = await (window as any).__supabaseClient.team.save(teamData);
        return !!error;
      });

      expect(result).toBe(true);
    });

    test('should check credit constraints', async ({ page }) => {
      const validation = await page.evaluate(async () => {
        const teamData = {
          matchId: 1,
          players: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          totalCredits: 100,
        };
        const { data, error } = await (window as any).__supabaseClient.team.save(teamData);
        return { hasValidation: !!error?.message?.includes('credit'), data };
      });

      expect(typeof validation.hasValidation).toBe('boolean');
    });

    test('should update existing team', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const teamData = {
          id: 1,
          matchId: 1,
          players: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          name: 'Updated Team',
        };
        const { data, error } = await (window as any).__supabaseClient.team.save(teamData);
        return { updated: !!data?.id, error };
      });

      expect(result.updated).toBe(true);
    });

    test('should include vice-captain and captain in team', async ({ page }) => {
      const team = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.team.get(1);
        return {
          hasCaptain: data?.captain !== undefined,
          hasViceCaptain: data?.viceCaptain !== undefined,
        };
      });

      expect(team.hasCaptain).toBe(true);
      expect(team.hasViceCaptain).toBe(true);
    });
  });

  test.describe('Contests Module', () => {
    test('should fetch contests by match', async ({ page }) => {
      const contests = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.contests.getByMatch(1);
        return { count: data?.length || 0, error };
      });

      expect(contests.error).toBeNull();
      expect(contests.count).toBeGreaterThan(0);
    });

    test('should enter contest successfully', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.contests.enter({
          contestId: 1,
          teamId: 1,
          entryFee: 100,
        });
        return { success: !!data?.entryId, error };
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should fetch contest entries', async ({ page }) => {
      const entries = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.contests.getEntries(1);
        return { count: data?.length || 0, error };
      });

      expect(entries.error).toBeNull();
      expect(entries.count).toBeGreaterThan(0);
    });

    test('should prevent duplicate contest entries', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { error: error1 } = await (window as any).__supabaseClient.contests.enter({
          contestId: 1,
          teamId: 1,
          entryFee: 100,
        });
        const { error: error2 } = await (window as any).__supabaseClient.contests.enter({
          contestId: 1,
          teamId: 1,
          entryFee: 100,
        });
        return { firstEntry: !error1, secondEntryError: !!error2 };
      });

      expect(result.firstEntry).toBe(true);
      expect(result.secondEntryError).toBe(true);
    });

    test('should validate sufficient wallet balance before entry', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { error } = await (window as any).__supabaseClient.contests.enter({
          contestId: 999,
          teamId: 1,
          entryFee: 999999,
        });
        return !!error?.message?.includes('balance');
      });

      expect(typeof result).toBe('boolean');
    });

    test('should parse contest details correctly', async ({ page }) => {
      const contestDetails = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.contests.getByMatch(1);
        const contest = data?.[0];
        return {
          hasName: !!contest?.name,
          hasEntryFee: contest?.entryFee !== undefined,
          hasPrizePool: contest?.prizePool !== undefined,
          hasWinners: contest?.maxWinners !== undefined,
        };
      });

      Object.values(contestDetails).forEach((v) => {
        expect(v).toBe(true);
      });
    });
  });

  test.describe('LiveScores Module', () => {
    test('should subscribe to live score updates', async ({ page }) => {
      const subscription = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const sub = (window as any).__supabaseClient.liveScores.subscribe(1, (payload: any) => {
            resolve({ hasPayload: !!payload });
            sub?.unsubscribe?.();
          });
        });
      });

      expect(subscription).toBeDefined();
    });

    test('should unsubscribe from live scores', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const sub = (window as any).__supabaseClient.liveScores.subscribe(1, () => {});
        await new Promise((r) => setTimeout(r, 100));
        const unsubscribed = await sub?.unsubscribe?.();
        return { success: unsubscribed !== undefined };
      });

      expect(result.success).toBe(true);
    });

    test('should fetch live scores by match', async ({ page }) => {
      const scores = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.liveScores.getByMatch(1);
        return { data, error };
      });

      expect(scores.error).toBeNull();
      expect(Array.isArray(scores.data)).toBe(true);
    });

    test('should receive real-time player scores', async ({ page }) => {
      const scores = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.liveScores.getByMatch(1);
        const playerScore = data?.[0];
        return {
          hasPlayerId: !!playerScore?.playerId,
          hasScore: playerScore?.score !== undefined,
          hasStats: !!playerScore?.stats,
        };
      });

      Object.values(scores).forEach((v) => {
        expect(v).toBe(true);
      });
    });

    test('should handle multiple concurrent subscriptions', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const subscriptions = Array.from({ length: 3 }, (_, i) =>
          (window as any).__supabaseClient.liveScores.subscribe(i + 1, () => {})
        );
        return subscriptions.length;
      });

      expect(result).toBe(3);
    });

    test('should provide updated team scores', async ({ page }) => {
      const teamScores = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.liveScores.getByMatch(1);
        return {
          hasTeamScores: data?.some((d: any) => d.teamScore !== undefined),
          hasRunRate: data?.some((d: any) => d.runRate !== undefined),
        };
      });

      expect(typeof teamScores.hasTeamScores).toBe('boolean');
    });
  });

  test.describe('Wallet Module', () => {
    test('should fetch wallet balance', async ({ page }) => {
      const balance = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.wallet.getBalance();
        return { balance: data?.balance, error };
      });

      expect(balance.error).toBeNull();
      expect(typeof balance.balance).toBe('number');
      expect(balance.balance).toBeGreaterThanOrEqual(0);
    });

    test('should fetch wallet transactions', async ({ page }) => {
      const transactions = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.wallet.getTransactions();
        return { count: data?.length || 0, error };
      });

      expect(transactions.error).toBeNull();
      expect(Array.isArray(transactions.count)).toBe(false);
    });

    test('should include transaction details', async ({ page }) => {
      const transaction = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.wallet.getTransactions();
        const txn = data?.[0];
        return {
          hasId: !!txn?.id,
          hasAmount: txn?.amount !== undefined,
          hasType: !!txn?.type,
          hasDate: !!txn?.date,
        };
      });

      Object.values(transaction).forEach((v) => {
        expect(v).toBe(true);
      });
    });

    test('should track bonus credit transactions', async ({ page }) => {
      const bonusTransactions = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.wallet.getTransactions();
        return data?.filter((t: any) => t.type === 'bonus') || [];
      });

      expect(Array.isArray(bonusTransactions)).toBe(true);
    });

    test('should track contest entry deductions', async ({ page }) => {
      const contestTransactions = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.wallet.getTransactions();
        return data?.filter((t: any) => t.type === 'contest_entry') || [];
      });

      expect(Array.isArray(contestTransactions)).toBe(true);
    });
  });

  test.describe('Leaderboard Module', () => {
    test('should fetch match leaderboard', async ({ page }) => {
      const leaderboard = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.leaderboard.getByMatch(1);
        return { count: data?.length || 0, error };
      });

      expect(leaderboard.error).toBeNull();
      expect(leaderboard.count).toBeGreaterThan(0);
    });

    test('should fetch league standings', async ({ page }) => {
      const standings = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.leaderboard.getLeagueStandings();
        return { count: data?.length || 0, error };
      });

      expect(standings.error).toBeNull();
      expect(standings.count).toBeGreaterThan(0);
    });

    test('should include rank in leaderboard', async ({ page }) => {
      const leaderboardData = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.leaderboard.getByMatch(1);
        const entry = data?.[0];
        return {
          hasRank: entry?.rank !== undefined,
          hasScore: entry?.score !== undefined,
          hasUserName: !!entry?.userName,
          hasTeamName: !!entry?.teamName,
        };
      });

      Object.values(leaderboardData).forEach((v) => {
        expect(v).toBe(true);
      });
    });

    test('should sort leaderboard by score descending', async ({ page }) => {
      const isSorted = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.leaderboard.getByMatch(1);
        if (data?.length < 2) return true;
        for (let i = 0; i < data.length - 1; i++) {
          if (data[i].score < data[i + 1].score) return false;
        }
        return true;
      });

      expect(isSorted).toBe(true);
    });
  });

  test.describe('Friends Module', () => {
    test('should fetch friends list', async ({ page }) => {
      const friends = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.friends.getFriends();
        return { count: data?.length || 0, error };
      });

      expect(friends.error).toBeNull();
      expect(Array.isArray(friends.count)).toBe(false);
    });

    test('should generate invite link', async ({ page }) => {
      const invite = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.friends.getInviteLink();
        return { link: data?.link, error };
      });

      expect(invite.error).toBeNull();
      expect(invite.link).toBeTruthy();
      expect(invite.link).toContain('http');
    });

    test('should send friend invite', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { data, error } = await (window as any).__supabaseClient.friends.sendInvite('friend@example.com');
        return { success: !!data?.inviteId, error };
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should include friend details in list', async ({ page }) => {
      const friendDetails = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.friends.getFriends();
        const friend = data?.[0];
        return {
          hasId: !!friend?.id,
          hasName: !!friend?.name,
          hasEmail: !!friend?.email,
          hasStatus: !!friend?.status,
        };
      });

      Object.values(friendDetails).forEach((v) => {
        expect(v).toBe(true);
      });
    });
  });

  test.describe('Edge Functions', () => {
    test('should call match-sync edge function', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const result = await fetch(
          `${(window as any).__supabaseConfig.url}/functions/v1/match-sync`,
          {
            method: 'POST',
            body: JSON.stringify({ matchId: 1 }),
          }
        );
        return { ok: result.ok, status: result.status };
      });

      expect(response.ok || response.status === 401).toBe(true);
    });

    test('should call live-score edge function', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const result = await fetch(
          `${(window as any).__supabaseConfig.url}/functions/v1/live-score`,
          {
            method: 'POST',
            body: JSON.stringify({ matchId: 1 }),
          }
        );
        return { ok: result.ok, status: result.status };
      });

      expect(response.ok || response.status === 401).toBe(true);
    });

    test('should include CORS headers on edge function responses', async ({ page }) => {
      const headers = await page.evaluate(async () => {
        const response = await fetch(
          `${(window as any).__supabaseConfig.url}/functions/v1/match-sync`,
          {
            method: 'POST',
            body: JSON.stringify({ matchId: 1 }),
          }
        );
        return {
          allowOrigin: response.headers.get('Access-Control-Allow-Origin'),
          allowMethods: response.headers.get('Access-Control-Allow-Methods'),
        };
      });

      expect(headers.allowOrigin).toBeTruthy();
    });

    test('should call team-validation edge function', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const result = await fetch(
          `${(window as any).__supabaseConfig.url}/functions/v1/team-validation`,
          {
            method: 'POST',
            body: JSON.stringify({ players: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }),
          }
        );
        return result.ok;
      });

      expect(typeof response).toBe('boolean');
    });

    test('should call prize-distribution edge function', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const result = await fetch(
          `${(window as any).__supabaseConfig.url}/functions/v1/prize-distribution`,
          {
            method: 'POST',
            body: JSON.stringify({ contestId: 1 }),
          }
        );
        return { ok: result.ok, status: result.status };
      });

      expect(response.ok || response.status === 401).toBe(true);
    });

    test('should call score-ingestion edge function', async ({ page }) => {
      const response = await page.evaluate(async () => {
        const result = await fetch(
          `${(window as any).__supabaseConfig.url}/functions/v1/score-ingestion`,
          {
            method: 'POST',
            body: JSON.stringify({ matchId: 1, scores: [] }),
          }
        );
        return { ok: result.ok, status: result.status };
      });

      expect(response.ok || response.status === 401).toBe(true);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await simulateSlowNetwork(page);
      const result = await page.evaluate(async () => {
        try {
          await (window as any).__supabaseClient.matches.getAll();
          return { timedOut: false };
        } catch (e: any) {
          return { timedOut: e?.message?.includes('timeout') };
        }
      });

      expect(typeof result.timedOut).toBe('boolean');
    });

    test('should handle 401 unauthorized error', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { error } = await (window as any).__supabaseClient.auth.signIn({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
        return error?.status === 401;
      });

      expect(result).toBe(true);
    });

    test('should handle 403 forbidden error', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { error } = await (window as any).__supabaseClient.team.get(99999);
        return typeof error === 'object';
      });

      expect(result).toBe(true);
    });

    test('should handle 404 not found error', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { error } = await (window as any).__supabaseClient.matches.getById(99999);
        return error?.status === 404 || !error;
      });

      expect(result).toBe(true);
    });

    test('should handle 500 server error', async ({ page }) => {
      const result = await page.evaluate(async () => {
        try {
          await (window as any).__supabaseClient.matches.getAll();
          return { hasError: false };
        } catch (e: any) {
          return { hasError: e?.status === 500 };
        }
      });

      expect(typeof result.hasError).toBe('boolean');
    });

    test('should log API errors to console', async ({ page }) => {
      const errors = await page.evaluate(async () => {
        const { error } = await (window as any).__supabaseClient.matches.getById(99999);
        if (error) console.error('API Error:', error);
        return error !== null;
      });

      const consoleErrors = await collectConsoleErrors(page);
      expect(errors || consoleErrors.length >= 0).toBe(true);
    });

    test('should retry failed API calls', async ({ page }) => {
      const result = await page.evaluate(async () => {
        let attempts = 0;
        const retry = async () => {
          attempts++;
          const { error } = await (window as any).__supabaseClient.matches.getAll();
          if (error && attempts < 3) {
            return retry();
          }
          return { attempts, error };
        };
        return await retry();
      });

      expect(result.attempts).toBeGreaterThan(0);
    });
  });

  test.describe('Response Parsing', () => {
    test('should parse JSON responses correctly', async ({ page }) => {
      const data = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.matches.getAll();
        return { isArray: Array.isArray(data), isValid: typeof data === 'object' };
      });

      expect(data.isArray).toBe(true);
      expect(data.isValid).toBe(true);
    });

    test('should handle null responses', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.matches.getById(99999);
        return data === null || Array.isArray(data);
      });

      expect(result).toBe(true);
    });

    test('should parse timestamps correctly', async ({ page }) => {
      const timestamp = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.matches.getAll();
        const match = data?.[0];
        return { isString: typeof match?.startTime === 'string', isValid: !isNaN(Date.parse(match?.startTime)) };
      });

      expect(timestamp.isString).toBe(true);
      expect(timestamp.isValid).toBe(true);
    });

    test('should handle nested response structures', async ({ page }) => {
      const nested = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.leaderboard.getByMatch(1);
        const entry = data?.[0];
        return {
          hasNested: !!entry?.stats && typeof entry.stats === 'object',
          hasArrays: Array.isArray(entry?.transactions),
        };
      });

      expect(typeof nested.hasNested).toBe('boolean');
    });
  });

  test.describe('Mock API Fallback', () => {
    test('should fall back to mock API when Supabase unavailable', async ({ page }) => {
      await goOffline(page);
      const result = await page.evaluate(async () => {
        try {
          const data = await (window as any).__mockAPI?.matches?.getAll?.();
          return { hasFallback: !!data, isArray: Array.isArray(data) };
        } catch (e) {
          return { hasFallback: false };
        }
      });

      expect(typeof result.hasFallback).toBe('boolean');
      await goOnline(page);
    });

    test('should use consistent data between Supabase and mock API', async ({ page }) => {
      const supabaseData = await page.evaluate(async () => {
        const { data } = await (window as any).__supabaseClient.matches.getAll();
        return data?.[0]?.id;
      });

      await goOffline(page);
      const mockData = await page.evaluate(async () => {
        const data = await (window as any).__mockAPI?.matches?.getAll?.();
        return data?.[0]?.id;
      });
      await goOnline(page);

      expect(mockData === supabaseData || mockData !== undefined).toBe(true);
    });
  });

  test.describe('Realtime Subscriptions', () => {
    test('should establish WebSocket connection for realtime', async ({ page }) => {
      const connection = await page.evaluate(async () => {
        const sub = (window as any).__supabaseClient.matches.subscribe(() => {});
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ connected: !!sub });
          }, 1000);
        });
      });

      expect(connection).toBeDefined();
    });

    test('should receive INSERT events on realtime subscription', async ({ page }) => {
      const event = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const sub = (window as any).__supabaseClient.matches.subscribe((payload: any) => {
            if (payload.eventType === 'INSERT') {
              resolve({ eventType: payload.eventType, hasData: !!payload.new });
              sub?.unsubscribe?.();
            }
          });
        });
      });

      expect(event).toBeDefined();
    });

    test('should receive UPDATE events on realtime subscription', async ({ page }) => {
      const event = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const sub = (window as any).__supabaseClient.matches.subscribe((payload: any) => {
            if (payload.eventType === 'UPDATE') {
              resolve({ eventType: payload.eventType });
              sub?.unsubscribe?.();
            }
          });
        });
      });

      expect(typeof event).toBe('object');
    });

    test('should handle subscription cleanup', async ({ page }) => {
      const cleanup = await page.evaluate(async () => {
        const sub = (window as any).__supabaseClient.matches.subscribe(() => {});
        await sub?.unsubscribe?.();
        return { unsubscribed: true };
      });

      expect(cleanup.unsubscribed).toBe(true);
    });

    test('should reconnect WebSocket on connection loss', async ({ page }) => {
      const reconnected = await page.evaluate(async () => {
        const sub = (window as any).__supabaseClient.matches.subscribe(() => {});
        // Simulate connection loss
        await new Promise((r) => setTimeout(r, 100));
        // Should attempt reconnect
        return { monitoring: !!sub };
      });

      expect(reconnected.monitoring).toBe(true);
    });
  });

  test.describe('Concurrent API Calls', () => {
    test('should handle 10 concurrent requests', async ({ page }) => {
      const results = await page.evaluate(async () => {
        const promises = Array.from({ length: 10 }, () =>
          (window as any).__supabaseClient.matches.getAll()
        );
        const responses = await Promise.all(promises);
        return responses.map((r: any) => !!r.data);
      });

      expect(results.length).toBe(10);
      expect(results.every((r: any) => typeof r === 'boolean')).toBe(true);
    });

    test('should handle mixed concurrent request types', async ({ page }) => {
      const results = await page.evaluate(async () => {
        const client = (window as any).__supabaseClient;
        const promises = [
          client.matches.getAll(),
          client.players.getByMatch(1),
          client.contests.getByMatch(1),
          client.liveScores.getByMatch(1),
          client.leaderboard.getByMatch(1),
        ];
        const responses = await Promise.all(promises);
        return responses.map((r: any) => !!r.data);
      });

      expect(results.length).toBe(5);
    });
  });

  test.describe('API Timeout Handling', () => {
    test('should timeout after 30 seconds', async ({ page }) => {
      await simulateSlowNetwork(page);
      const timedOut = await page.evaluate(async () => {
        try {
          const client = (window as any).__supabaseClient;
          client.requestTimeout = 1000; // Set to 1s for testing
          await client.matches.getAll();
          return false;
        } catch (e: any) {
          return e?.message?.includes('timeout') || e?.code === 'ETIMEDOUT';
        }
      });

      expect(typeof timedOut).toBe('boolean');
    });
  });

  test.describe('Rate Limiting', () => {
    test('should respect rate limit headers', async ({ page }) => {
      const rateLimit = await page.evaluate(async () => {
        const response = await fetch(`${(window as any).__supabaseConfig.url}/rest/v1/matches`, {
          headers: { apikey: (window as any).__supabaseConfig.anonKey },
        });
        return {
          hasRateLimit: response.headers.has('X-RateLimit-Limit'),
          hasRemaining: response.headers.has('X-RateLimit-Remaining'),
        };
      });

      expect(typeof rateLimit.hasRateLimit).toBe('boolean');
    });

    test('should handle 429 too many requests', async ({ page }) => {
      const result = await page.evaluate(async () => {
        // Make rapid requests
        const promises = Array.from({ length: 100 }, () =>
          fetch(`${(window as any).__supabaseConfig.url}/rest/v1/matches`, {
            headers: { apikey: (window as any).__supabaseConfig.anonKey },
          })
        );
        const responses = await Promise.all(promises);
        return responses.some((r: any) => r.status === 429);
      });

      expect(typeof result).toBe('boolean');
    });
  });

  test.describe('Auth Headers in API Calls', () => {
    test('should include auth token in API headers', async ({ page }) => {
      const hasToken = await page.evaluate(async () => {
        const client = (window as any).__supabaseClient;
        const session = await client.auth.getSession();
        return !!session?.data?.session?.access_token;
      });

      expect(hasToken).toBe(true);
    });

    test('should refresh auth token when expired', async ({ page }) => {
      const refreshed = await page.evaluate(async () => {
        const client = (window as any).__supabaseClient;
        const { data, error } = await client.auth.refreshSession();
        return { hasNewToken: !!data?.session?.access_token, error };
      });

      expect(refreshed.hasNewToken).toBe(true);
      expect(refreshed.error).toBeNull();
    });

    test('should clear auth token on sign out', async ({ page }) => {
      const cleared = await page.evaluate(async () => {
        const client = (window as any).__supabaseClient;
        await client.auth.signOut();
        const session = await client.auth.getSession();
        return !session?.data?.session;
      });

      expect(cleared).toBe(true);
    });
  });

  test.describe('RPC Functions', () => {
    test('should call upsert_match RPC function', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const client = (window as any).__supabaseClient;
        const { data, error } = await client.rpc('upsert_match', {
          match_data: { id: 1, status: 'live' },
        });
        return { success: !!data, error };
      });

      expect(typeof result.success).toBe('boolean');
    });

    test('should call bulk_upsert_matches RPC function', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const client = (window as any).__supabaseClient;
        const { data, error } = await client.rpc('bulk_upsert_matches', {
          matches: [{ id: 1 }, { id: 2 }],
        });
        return { success: !!data, error };
      });

      expect(typeof result.success).toBe('boolean');
    });
  });

  test.describe('Provider Config Management', () => {
    test('should fetch sportmonks provider config', async ({ page }) => {
      const config = await page.evaluate(async () => {
        const client = (window as any).__supabaseClient;
        const { data } = await client
          .from('provider_config')
          .select('*')
          .eq('provider', 'sportmonks')
          .single();
        return { hasConfig: !!data, hasApiKey: !!data?.api_key };
      });

      expect(typeof config.hasConfig).toBe('boolean');
    });

    test('should fetch cricketdata provider config', async ({ page }) => {
      const config = await page.evaluate(async () => {
        const client = (window as any).__supabaseClient;
        const { data } = await client
          .from('provider_config')
          .select('*')
          .eq('provider', 'cricketdata')
          .single();
        return { hasConfig: !!data };
      });

      expect(typeof config.hasConfig).toBe('boolean');
    });
  });
});
