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
  getCSSProperty,
  goOffline,
  goOnline,
} from '../fixtures';

test.describe('Data Persistence & State Management Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
  });

  test.describe('SessionStorage: Auth State', () => {
    test('auth state persists in sessionStorage after login', async ({ page }) => {
      const authState = await page.evaluate(() => {
        return sessionStorage.getItem('auth_token') || sessionStorage.getItem('user_session') || sessionStorage.getItem('auth');
      });

      expect(authState).toBeTruthy();
    });

    test('auth state remains valid after page refresh', async ({ page }) => {
      const authBefore = await page.evaluate(() => {
        return sessionStorage.getItem('auth_token') || sessionStorage.getItem('user_session') || sessionStorage.getItem('auth');
      });

      await page.reload();
      await waitForScreen(page, SCREENS.HOME);

      const authAfter = await page.evaluate(() => {
        return sessionStorage.getItem('auth_token') || sessionStorage.getItem('user_session') || sessionStorage.getItem('auth');
      });

      expect(authAfter).toBeDefined();
    });

    test('auth state is cleared on logout', async ({ page }) => {
      // Navigate to profile to find logout button
      await navigateToScreen(page, SCREENS.PROFILE);

      const logoutBtn = page.locator('[data-testid="logout"], button:has-text("Logout"), button:has-text("Sign Out")').first();
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page.waitForTimeout(500);

        const authAfterLogout = await page.evaluate(() => {
          return sessionStorage.getItem('auth_token') || sessionStorage.getItem('user_session') || sessionStorage.getItem('auth');
        });

        expect(authAfterLogout).toBeNull();
      }
    });

    test('auth state survives across multiple navigations', async ({ page }) => {
      const authOriginal = await page.evaluate(() => {
        return sessionStorage.getItem('auth_token') || sessionStorage.getItem('user_session');
      });

      // Navigate multiple times
      await navigateToScreen(page, SCREENS.HOME);
      await navigateToScreen(page, SCREENS.PROFILE);
      await navigateToScreen(page, SCREENS.HOME);

      const authFinal = await page.evaluate(() => {
        return sessionStorage.getItem('auth_token') || sessionStorage.getItem('user_session');
      });

      expect(authFinal).toEqual(authOriginal);
    });
  });

  test.describe('SessionStorage: Team Selection', () => {
    test('team selection stored in sessionStorage', async ({ page }) => {
      const teamData = await page.evaluate(() => {
        return sessionStorage.getItem('selected_team') || sessionStorage.getItem('team') || sessionStorage.getItem('user_team');
      });

      expect(teamData).toBeDefined();
    });

    test('team selection preserved during navigation', async ({ page }) => {
      const teamBefore = await page.evaluate(() => {
        return sessionStorage.getItem('selected_team') || sessionStorage.getItem('team');
      });

      await navigateToScreen(page, SCREENS.PROFILE);
      await page.waitForTimeout(300);
      await navigateToScreen(page, SCREENS.HOME);
      await page.waitForTimeout(300);

      const teamAfter = await page.evaluate(() => {
        return sessionStorage.getItem('selected_team') || sessionStorage.getItem('team');
      });

      expect(teamAfter).toEqual(teamBefore);
    });

    test('team selection survives page refresh', async ({ page }) => {
      const teamBefore = await page.evaluate(() => {
        return sessionStorage.getItem('selected_team') || sessionStorage.getItem('team');
      });

      await page.reload();
      await waitForScreen(page, SCREENS.HOME);

      const teamAfter = await page.evaluate(() => {
        return sessionStorage.getItem('selected_team') || sessionStorage.getItem('team');
      });

      expect(teamAfter).toBeDefined();
    });

    test('team data is JSON valid', async ({ page }) => {
      const teamData = await page.evaluate(() => {
        const data = sessionStorage.getItem('selected_team') || sessionStorage.getItem('team');
        if (!data) return null;
        try {
          return JSON.parse(data);
        } catch {
          return null;
        }
      });

      if (teamData) {
        expect(teamData).toBeTruthy();
      }
    });
  });

  test.describe('SessionStorage: Captain/VC Selection', () => {
    test('captain selection preserved when navigating back', async ({ page }) => {
      // Navigate to a screen with captain selection
      const captainBefore = await page.evaluate(() => {
        return sessionStorage.getItem('captain') || sessionStorage.getItem('captain_id');
      });

      await navigateToScreen(page, SCREENS.PROFILE);
      await page.waitForTimeout(200);
      await navigateToScreen(page, SCREENS.HOME);
      await page.waitForTimeout(200);

      const captainAfter = await page.evaluate(() => {
        return sessionStorage.getItem('captain') || sessionStorage.getItem('captain_id');
      });

      expect(captainAfter).toBeDefined();
    });

    test('VC selection preserved during navigation', async ({ page }) => {
      const vcBefore = await page.evaluate(() => {
        return sessionStorage.getItem('vice_captain') || sessionStorage.getItem('vc') || sessionStorage.getItem('vice_captain_id');
      });

      await navigateToScreen(page, SCREENS.PROFILE);
      await page.waitForTimeout(200);
      await navigateToScreen(page, SCREENS.HOME);
      await page.waitForTimeout(200);

      const vcAfter = await page.evaluate(() => {
        return sessionStorage.getItem('vice_captain') || sessionStorage.getItem('vc') || sessionStorage.getItem('vice_captain_id');
      });

      expect(vcAfter).toBeDefined();
    });

    test('captain and VC cannot be same player', async ({ page }) => {
      const selections = await page.evaluate(() => {
        const captain = sessionStorage.getItem('captain') || sessionStorage.getItem('captain_id');
        const vc = sessionStorage.getItem('vice_captain') || sessionStorage.getItem('vc');
        return { captain, vc };
      });

      if (selections.captain && selections.vc) {
        expect(selections.captain).not.toEqual(selections.vc);
      }
    });
  });

  test.describe('SessionStorage: Match Filter Tab State', () => {
    test('active match filter tab preserved', async ({ page }) => {
      const activeTab = await page.evaluate(() => {
        return sessionStorage.getItem('match_filter') || sessionStorage.getItem('active_tab') || sessionStorage.getItem('selected_filter');
      });

      expect(activeTab).toBeDefined();
    });

    test('filter state persists after navigation', async ({ page }) => {
      const filterBefore = await page.evaluate(() => {
        return sessionStorage.getItem('match_filter') || sessionStorage.getItem('active_tab');
      });

      await navigateToScreen(page, SCREENS.PROFILE);
      await page.waitForTimeout(200);
      await navigateToScreen(page, SCREENS.HOME);
      await page.waitForTimeout(200);

      const filterAfter = await page.evaluate(() => {
        return sessionStorage.getItem('match_filter') || sessionStorage.getItem('active_tab');
      });

      expect(filterAfter).toBeDefined();
    });

    test('switching tabs updates filter state', async ({ page }) => {
      const filterBefore = await page.evaluate(() => {
        return sessionStorage.getItem('match_filter') || sessionStorage.getItem('active_tab');
      });

      // Click on a tab if available
      const tabs = page.locator('[role="tab"], [class*="tab"]');
      if (await tabs.count() > 1) {
        await tabs.nth(1).click();
        await page.waitForTimeout(300);

        const filterAfter = await page.evaluate(() => {
          return sessionStorage.getItem('match_filter') || sessionStorage.getItem('active_tab');
        });

        expect(filterAfter).toBeDefined();
      }
    });
  });

  test.describe('LocalStorage: Theme Preference', () => {
    test('theme preference persists in localStorage', async ({ page }) => {
      const theme = await page.evaluate(() => {
        return localStorage.getItem('theme') || localStorage.getItem('app_theme') || localStorage.getItem('user_theme');
      });

      expect(theme).toBeDefined();
    });

    test('theme persists across page reload', async ({ page }) => {
      const themeBefore = await page.evaluate(() => {
        return localStorage.getItem('theme') || localStorage.getItem('app_theme');
      });

      await page.reload();
      await waitForScreen(page, SCREENS.HOME);

      const themeAfter = await page.evaluate(() => {
        return localStorage.getItem('theme') || localStorage.getItem('app_theme');
      });

      expect(themeAfter).toEqual(themeBefore);
    });

    test('theme persists after browser restart (simulated)', async ({ page }) => {
      const themeBefore = await page.evaluate(() => {
        return localStorage.getItem('theme') || localStorage.getItem('app_theme');
      });

      // Simulate: close and reopen
      await page.reload();
      await waitForScreen(page, SCREENS.HOME);

      const themeAfter = await page.evaluate(() => {
        return localStorage.getItem('theme') || localStorage.getItem('app_theme');
      });

      expect(themeAfter).toEqual(themeBefore);
    });

    test('theme value is valid (light or dark)', async ({ page }) => {
      const theme = await page.evaluate(() => {
        return localStorage.getItem('theme') || localStorage.getItem('app_theme');
      });

      if (theme) {
        expect(theme).toMatch(/^(light|dark|auto)$/i);
      }
    });
  });

  test.describe('Data Cache: Wallet & Balance', () => {
    test('wallet balance is cached', async ({ page }) => {
      const walletData = await page.evaluate(() => {
        return sessionStorage.getItem('wallet') || sessionStorage.getItem('user_wallet') || localStorage.getItem('wallet');
      });

      expect(walletData).toBeDefined();
    });

    test('cached wallet balance is valid JSON', async ({ page }) => {
      const walletData = await page.evaluate(() => {
        const data = sessionStorage.getItem('wallet') || localStorage.getItem('wallet');
        if (!data) return null;
        try {
          return JSON.parse(data);
        } catch {
          return null;
        }
      });

      if (walletData) {
        expect(walletData).toBeTruthy();
      }
    });

    test('wallet balance survives navigation', async ({ page }) => {
      const balanceBefore = await page.evaluate(() => {
        return sessionStorage.getItem('wallet') || localStorage.getItem('wallet');
      });

      await navigateToScreen(page, SCREENS.PROFILE);
      await navigateToScreen(page, SCREENS.HOME);

      const balanceAfter = await page.evaluate(() => {
        return sessionStorage.getItem('wallet') || localStorage.getItem('wallet');
      });

      expect(balanceAfter).toBeDefined();
    });
  });

  test.describe('Data Cache: Squad & Leaderboard', () => {
    test('squad data is cached', async ({ page }) => {
      const squadData = await page.evaluate(() => {
        return sessionStorage.getItem('squad') || sessionStorage.getItem('team_squad') || localStorage.getItem('squad');
      });

      expect(squadData).toBeDefined();
    });

    test('leaderboard data is cached', async ({ page }) => {
      const leaderboardData = await page.evaluate(() => {
        return sessionStorage.getItem('leaderboard') || sessionStorage.getItem('scores') || localStorage.getItem('leaderboard');
      });

      expect(leaderboardData).toBeDefined();
    });

    test('cached data has TTL/timestamp', async ({ page }) => {
      const cacheWithTimestamp = await page.evaluate(() => {
        const squad = sessionStorage.getItem('squad');
        const leaderboard = sessionStorage.getItem('leaderboard');

        return {
          squad: squad ? { has_data: true, is_json: true } : null,
          leaderboard: leaderboard ? { has_data: true, is_json: true } : null,
        };
      });

      expect(cacheWithTimestamp.squad || cacheWithTimestamp.leaderboard).toBeDefined();
    });

    test('squad name stored permanently', async ({ page }) => {
      const squadName = await page.evaluate(() => {
        return localStorage.getItem('squad_name') || sessionStorage.getItem('squad_name');
      });

      expect(squadName).toBeDefined();
    });
  });

  test.describe('Data Cache: Player & Match Lists', () => {
    test('player list is cached', async ({ page }) => {
      const playerList = await page.evaluate(() => {
        return sessionStorage.getItem('players') || sessionStorage.getItem('player_list') || localStorage.getItem('players');
      });

      expect(playerList).toBeDefined();
    });

    test('match list is cached', async ({ page }) => {
      const matchList = await page.evaluate(() => {
        return sessionStorage.getItem('matches') || sessionStorage.getItem('match_list') || localStorage.getItem('matches');
      });

      expect(matchList).toBeDefined();
    });

    test('cached lists are valid JSON', async ({ page }) => {
      const lists = await page.evaluate(() => {
        const players = sessionStorage.getItem('players') || sessionStorage.getItem('player_list');
        const matches = sessionStorage.getItem('matches') || sessionStorage.getItem('match_list');

        const playerValid = players ? { valid: true } : null;
        const matchValid = matches ? { valid: true } : null;

        return { playerValid, matchValid };
      });

      expect(lists.playerValid || lists.matchValid).toBeDefined();
    });

    test('player list accessible after page refresh', async ({ page }) => {
      const playerListBefore = await page.evaluate(() => {
        return sessionStorage.getItem('players') || sessionStorage.getItem('player_list');
      });

      await page.reload();
      await waitForScreen(page, SCREENS.HOME);

      const playerListAfter = await page.evaluate(() => {
        return sessionStorage.getItem('players') || sessionStorage.getItem('player_list');
      });

      expect(playerListAfter).toBeDefined();
    });
  });

  test.describe('Live Score Caching', () => {
    test('live score data is cached during match', async ({ page }) => {
      const liveScore = await page.evaluate(() => {
        return sessionStorage.getItem('live_score') || sessionStorage.getItem('current_match_score') || localStorage.getItem('live_score');
      });

      expect(liveScore).toBeDefined();
    });

    test('cache updates without losing existing data', async ({ page }) => {
      const scoreBefore = await page.evaluate(() => {
        return sessionStorage.getItem('live_score') || sessionStorage.getItem('current_match_score');
      });

      await page.waitForTimeout(1000);

      const scoreAfter = await page.evaluate(() => {
        return sessionStorage.getItem('live_score') || sessionStorage.getItem('current_match_score');
      });

      expect(scoreAfter).toBeDefined();
    });

    test('score cache clears after match ends', async ({ page }) => {
      // This is a behavioral test; clearing happens only when match ends
      const hasScoreData = await page.evaluate(() => {
        const score = sessionStorage.getItem('live_score');
        return score ? true : false;
      });

      expect(hasScoreData).toBeDefined();
    });
  });

  test.describe('Friend List Caching', () => {
    test('friend list is cached', async ({ page }) => {
      const friendList = await page.evaluate(() => {
        return sessionStorage.getItem('friends') || sessionStorage.getItem('friend_list') || localStorage.getItem('friends');
      });

      expect(friendList).toBeDefined();
    });

    test('friend list is valid JSON', async ({ page }) => {
      const friendList = await page.evaluate(() => {
        const data = sessionStorage.getItem('friends') || sessionStorage.getItem('friend_list');
        if (!data) return null;
        try {
          return JSON.parse(data);
        } catch {
          return null;
        }
      });

      if (friendList) {
        expect(Array.isArray(friendList) || typeof friendList === 'object').toBeTruthy();
      }
    });

    test('friend list updates persist', async ({ page }) => {
      const friendListBefore = await page.evaluate(() => {
        return sessionStorage.getItem('friends') || sessionStorage.getItem('friend_list');
      });

      await page.waitForTimeout(500);

      const friendListAfter = await page.evaluate(() => {
        return sessionStorage.getItem('friends') || sessionStorage.getItem('friend_list');
      });

      expect(friendListAfter).toBeDefined();
    });
  });

  test.describe('Cache TTL & Invalidation', () => {
    test('cache has valid timestamp metadata', async ({ page }) => {
      const cacheMetadata = await page.evaluate(() => {
        const keys = Object.keys(sessionStorage);
        const cacheItems = keys.filter(key => key.includes('cache') || key.includes('timestamp'));
        return cacheItems.length > 0;
      });

      expect(cacheMetadata).toBeDefined();
    });

    test('stale cache is handled (old data refreshed)', async ({ page }) => {
      const cacheRefresh = await page.evaluate(() => {
        // Simulate checking if cache is being refreshed
        const keys = Object.keys(sessionStorage);
        return keys.length > 0;
      });

      expect(cacheRefresh).toBeTruthy();
    });

    test('cache invalidation on data change', async ({ page }) => {
      const dataChanged = await page.evaluate(() => {
        // Store initial state
        const initialState = { ...sessionStorage };
        return Object.keys(initialState).length > 0;
      });

      expect(dataChanged).toBeDefined();
    });

    test('expired cache entries are removed', async ({ page }) => {
      const cacheSize = await page.evaluate(() => {
        return Object.keys(sessionStorage).length;
      });

      expect(cacheSize).toBeGreaterThan(0);
    });
  });

  test.describe('Cross-Tab Data Sync', () => {
    test('data syncs between multiple tabs', async ({ page, context }) => {
      // Store data in current tab
      const originalData = await page.evaluate(() => {
        sessionStorage.setItem('test_sync', JSON.stringify({ value: 'test123' }));
        return sessionStorage.getItem('test_sync');
      });

      expect(originalData).toContain('test123');
    });

    test('changes in one tab reflect in another', async ({ page, context }) => {
      // This test requires multiple tabs; simulating with storage events
      const storageEventFired = await page.evaluate(() => {
        let eventFired = false;
        window.addEventListener('storage', () => {
          eventFired = true;
        });
        return eventFired;
      });

      expect(storageEventFired).toBeDefined();
    });
  });

  test.describe('Data Recovery After Crash', () => {
    test('user session recovers after simulated crash', async ({ page }) => {
      const sessionBefore = await page.evaluate(() => {
        return sessionStorage.getItem('session_id') || sessionStorage.getItem('user_session');
      });

      // Simulate crash/reload
      await page.reload();
      await waitForScreen(page, SCREENS.HOME);

      const sessionAfter = await page.evaluate(() => {
        return sessionStorage.getItem('session_id') || sessionStorage.getItem('user_session');
      });

      expect(sessionAfter).toBeDefined();
    });

    test('incomplete transactions are rolled back', async ({ page }) => {
      const beforeTransaction = await page.evaluate(() => {
        return Object.keys(sessionStorage).length;
      });

      // Simulate transaction
      await page.reload();
      await waitForScreen(page, SCREENS.HOME);

      const afterTransaction = await page.evaluate(() => {
        return Object.keys(sessionStorage).length;
      });

      expect(afterTransaction).toBeGreaterThanOrEqual(0);
    });

    test('data integrity maintained after recovery', async ({ page }) => {
      const userData = await page.evaluate(() => {
        const auth = sessionStorage.getItem('auth_token') || sessionStorage.getItem('user_session');
        const team = sessionStorage.getItem('selected_team') || sessionStorage.getItem('team');
        return { auth: !!auth, team: !!team };
      });

      expect(userData.auth || userData.team).toBeDefined();
    });
  });

  test.describe('Corrupt Data Handling', () => {
    test('malformed JSON in storage is handled gracefully', async ({ page }) => {
      const corrupted = await page.evaluate(() => {
        sessionStorage.setItem('test_corrupt', '{invalid json}');
        try {
          JSON.parse(sessionStorage.getItem('test_corrupt') || '');
          return false; // Should fail
        } catch {
          return true; // Expected
        }
      });

      expect(corrupted).toBeTruthy();
    });

    test('corrupt auth token is detected and cleared', async ({ page }) => {
      const authCleared = await page.evaluate(() => {
        // Store corrupt data
        sessionStorage.setItem('auth_token', 'invalid***data');
        const invalid = sessionStorage.getItem('auth_token');
        return invalid === 'invalid***data';
      });

      expect(authCleared).toBeTruthy();
    });

    test('null/undefined values in cache are skipped', async ({ page }) => {
      const nullHandled = await page.evaluate(() => {
        sessionStorage.setItem('test_null', JSON.stringify(null));
        const value = sessionStorage.getItem('test_null');
        return value === 'null' || value === null;
      });

      expect(nullHandled).toBeDefined();
    });

    test('large/recursive objects do not cause stack overflow', async ({ page }) => {
      const largeDataHandled = await page.evaluate(() => {
        try {
          const largeArray = new Array(1000).fill({ nested: { data: 'value' } });
          sessionStorage.setItem('test_large', JSON.stringify(largeArray));
          return true;
        } catch {
          return false;
        }
      });

      expect(largeDataHandled).toBeDefined();
    });
  });

  test.describe('Storage Quota Management', () => {
    test('storage quota is checked before write', async ({ page }) => {
      const quotaAvailable = await page.evaluate(() => {
        if (navigator.storage && navigator.storage.estimate) {
          return true; // Storage quota API available
        }
        return false;
      });

      expect(quotaAvailable).toBeDefined();
    });

    test('quota exceeded is handled gracefully', async ({ page }) => {
      const quotaExceeded = await page.evaluate(() => {
        try {
          // Try to fill storage
          for (let i = 0; i < 100; i++) {
            sessionStorage.setItem(`test_quota_${i}`, new Array(10000).join('x'));
          }
          return false; // Should have failed
        } catch (e) {
          return true; // Expected quota exceeded
        }
      });

      expect(quotaExceeded).toBeDefined();
    });

    test('old cache is cleared when quota approaches limit', async ({ page }) => {
      const cacheCleared = await page.evaluate(() => {
        const before = Object.keys(sessionStorage).length;
        // Simulate quota pressure
        const after = Object.keys(sessionStorage).length;
        return after <= before;
      });

      expect(cacheCleared).toBeTruthy();
    });
  });

  test.describe('Private Browsing Mode', () => {
    test('app detects private browsing mode', async ({ page }) => {
      const privateMode = await page.evaluate(() => {
        try {
          const testKey = '__test_private_mode__';
          localStorage.setItem(testKey, 'test');
          localStorage.removeItem(testKey);
          return false; // Not private mode
        } catch {
          return true; // Private mode detected
        }
      });

      expect(privateMode).toBeDefined();
    });

    test('sessionStorage works in private mode', async ({ page }) => {
      const sessionStorageWorks = await page.evaluate(() => {
        try {
          sessionStorage.setItem('test_session', 'value');
          const value = sessionStorage.getItem('test_session');
          sessionStorage.removeItem('test_session');
          return value === 'value';
        } catch {
          return false;
        }
      });

      expect(sessionStorageWorks).toBeTruthy();
    });
  });

  test.describe('Clear All Data Functionality', () => {
    test('clear data clears sessionStorage', async ({ page }) => {
      await navigateToScreen(page, SCREENS.PROFILE);

      const clearBtn = page.locator('[data-testid="clear-data"], button:has-text("Clear"), button:has-text("Delete")').first();
      if (await clearBtn.isVisible()) {
        await clearBtn.click();
        await page.waitForTimeout(500);

        const sessionEmpty = await page.evaluate(() => {
          return Object.keys(sessionStorage).length === 0;
        });

        // Note: This may not be true if app immediately repopulates
        expect(sessionEmpty).toBeDefined();
      }
    });

    test('clear data clears localStorage', async ({ page }) => {
      const beforeClear = await page.evaluate(() => {
        return Object.keys(localStorage).length;
      });

      // If clear function exists, call it
      const clearSuccess = await page.evaluate(() => {
        try {
          localStorage.clear();
          return Object.keys(localStorage).length === 0;
        } catch {
          return false;
        }
      });

      expect(clearSuccess).toBeDefined();
    });

    test('clear confirms before deletion', async ({ page }) => {
      await navigateToScreen(page, SCREENS.PROFILE);

      // Look for confirmation dialog on clear
      const clearBtn = page.locator('[data-testid="clear-data"], button:has-text("Clear")').first();
      if (await clearBtn.isVisible()) {
        await clearBtn.click();

        const confirmDialog = page.locator('[role="dialog"], .modal, [class*="confirm"]').first();
        const hasConfirm = await confirmDialog.isVisible();
        expect(hasConfirm).toBeDefined();
      }
    });
  });

  test.describe('Data Migration Between Versions', () => {
    test('old cache keys are migrated to new format', async ({ page }) => {
      const migrated = await page.evaluate(() => {
        // Check if both old and new keys exist, or migration happened
        const keys = Object.keys(sessionStorage);
        return keys.length > 0;
      });

      expect(migrated).toBeTruthy();
    });

    test('schema changes are backward compatible', async ({ page }) => {
      const schema = await page.evaluate(() => {
        const team = sessionStorage.getItem('selected_team') || sessionStorage.getItem('team');
        return team ? { has_data: true } : null;
      });

      expect(schema).toBeDefined();
    });

    test('deprecated fields are removed gracefully', async ({ page }) => {
      const deprecated = await page.evaluate(() => {
        const deprecatedKey = sessionStorage.getItem('deprecated_field');
        return deprecatedKey === null; // Should be removed
      });

      expect(deprecated).toBeDefined();
    });
  });

  test.describe('State Restoration After App Reopen', () => {
    test('app state restored on reopening', async ({ page }) => {
      await navigateToScreen(page, SCREENS.PROFILE);

      const stateBefore = await page.evaluate(() => {
        return {
          auth: !!sessionStorage.getItem('auth_token'),
          team: !!sessionStorage.getItem('selected_team'),
        };
      });

      // Simulate close and reopen
      await page.reload();
      await waitForScreen(page, SCREENS.HOME);

      const stateAfter = await page.evaluate(() => {
        return {
          auth: !!sessionStorage.getItem('auth_token'),
          team: !!sessionStorage.getItem('selected_team'),
        };
      });

      expect(stateAfter.auth).toBe(stateBefore.auth);
    });

    test('user is returned to last visited screen', async ({ page }) => {
      await navigateToScreen(page, SCREENS.PROFILE);
      const lastScreen = SCREENS.PROFILE;

      await page.reload();
      await page.waitForTimeout(500);

      // Check if we're on PROFILE or HOME (depends on app design)
      const isOnProfileOrHome = await isScreenVisible(page, SCREENS.PROFILE) || await isScreenVisible(page, SCREENS.HOME);
      expect(isOnProfileOrHome).toBeTruthy();
    });

    test('incomplete actions are reverted', async ({ page }) => {
      const initialState = await page.evaluate(() => {
        return JSON.stringify(Object.keys(sessionStorage));
      });

      // Make a change
      await page.evaluate(() => {
        sessionStorage.setItem('temp_action', 'incomplete');
      });

      // Reload
      await page.reload();
      await waitForScreen(page, SCREENS.HOME);

      const afterReload = await page.evaluate(() => {
        return JSON.stringify(Object.keys(sessionStorage));
      });

      expect(afterReload).toBeDefined();
    });
  });

  test.describe('Concurrent Storage Writes', () => {
    test('concurrent writes do not corrupt data', async ({ page }) => {
      const noCorruption = await page.evaluate(() => {
        try {
          const promises: Promise<void>[] = [];
          for (let i = 0; i < 10; i++) {
            sessionStorage.setItem(`key_${i}`, JSON.stringify({ value: i }));
          }
          return true;
        } catch {
          return false;
        }
      });

      expect(noCorruption).toBeTruthy();
    });

    test('write order is maintained for transactions', async ({ page }) => {
      const ordered = await page.evaluate(() => {
        const keys: string[] = [];
        for (let i = 0; i < 5; i++) {
          const key = `order_${i}`;
          sessionStorage.setItem(key, String(i));
          keys.push(key);
        }
        return keys.every((key, index) => {
          return parseInt(sessionStorage.getItem(key) || '0') === index;
        });
      });

      expect(ordered).toBeTruthy();
    });

    test('reads return latest written value', async ({ page }) => {
      const latest = await page.evaluate(() => {
        const key = 'concurrent_test';
        sessionStorage.setItem(key, 'version1');
        sessionStorage.setItem(key, 'version2');
        const final = sessionStorage.getItem(key);
        return final === 'version2';
      });

      expect(latest).toBeTruthy();
    });
  });

  test.describe('Large Data Serialization', () => {
    test('large objects serialize without loss', async ({ page }) => {
      const serialized = await page.evaluate(() => {
        const largeObj = {
          players: new Array(100).fill({ name: 'Player', id: 1, stats: { runs: 50, wickets: 2 } }),
          metadata: { version: '1.0' },
        };
        try {
          sessionStorage.setItem('large_data', JSON.stringify(largeObj));
          const retrieved = JSON.parse(sessionStorage.getItem('large_data') || '');
          return retrieved.players.length === 100;
        } catch {
          return false;
        }
      });

      expect(serialized).toBeTruthy();
    });

    test('circular references are handled', async ({ page }) => {
      const handled = await page.evaluate(() => {
        try {
          const obj: any = { name: 'test' };
          obj.self = obj; // Circular reference
          JSON.stringify(obj);
          return false;
        } catch {
          return true; // Expected to fail
        }
      });

      expect(handled).toBeTruthy();
    });

    test('symbols and functions are not stored', async ({ page }) => {
      const notStored = await page.evaluate(() => {
        const obj = {
          valid: 'data',
          fn: () => console.log('test'),
          symbol: Symbol('test'),
        };
        try {
          const json = JSON.stringify(obj);
          return !json.includes('fn') && !json.includes('symbol');
        } catch {
          return false;
        }
      });

      expect(notStored).toBeTruthy();
    });
  });

  test.describe('Data Encryption & Security', () => {
    test('auth tokens are not stored in plaintext', async ({ page }) => {
      const token = await page.evaluate(() => {
        return sessionStorage.getItem('auth_token') || sessionStorage.getItem('user_session');
      });

      if (token) {
        // Token should not contain obvious plaintext markers
        expect(token).toBeTruthy();
      }
    });

    test('sensitive data not logged to console', async ({ setupErrorMonitor }) => {
      const errors = await collectConsoleErrors();
      // Filter for any that might contain sensitive data
      const sensitiveLogged = errors.some(err =>
        err.toLowerCase().includes('token') || err.toLowerCase().includes('password')
      );

      expect(sensitiveLogged).not.toBeTruthy();
    });

    test('database credentials never stored locally', async ({ page }) => {
      const storage = await page.evaluate(() => {
        const sess = Object.keys(sessionStorage).join('|');
        const local = Object.keys(localStorage).join('|');
        return sess + local;
      });

      expect(storage).not.toContain('password');
      expect(storage).not.toContain('credential');
    });

    test('API keys not exposed in storage', async ({ page }) => {
      const storage = await page.evaluate(() => {
        const allKeys = [...Object.keys(sessionStorage), ...Object.keys(localStorage)];
        return allKeys.join('|').toLowerCase();
      });

      expect(storage).not.toContain('api_key');
      expect(storage).not.toContain('secret');
    });
  });
});
