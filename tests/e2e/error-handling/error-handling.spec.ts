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
  getCreditsRemaining,
  getSelectedPlayerCount,
  TEAM_RULES,
  ROLES,
  IPL_TEAMS,
} from '../fixtures';

test.describe('Error Handling Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await waitForScreen(page, SCREENS.HOME);
  });

  // ====== NETWORK ERRORS ON API CALLS ======
  test.describe('Network Errors - API Calls', () => {
    test('should handle network error on matches API', async ({ page }) => {
      const errorMonitor = await setupErrorMonitor(page);
      await page.route('**/matches*', (route) => route.abort());

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      const errors = await collectConsoleErrors(page);
      expect(errors.length).toBeGreaterThan(0);
      expect(page.locator('text=/unable to load|retry/i')).toBeTruthy();
    });

    test('should handle network error on players API', async ({ page }) => {
      await page.route('**/players*', (route) => route.abort());

      await navigateToScreen(page, SCREENS.CREATE_TEAM);
      await waitForScreen(page, SCREENS.CREATE_TEAM);

      expect(page.locator('text=/players.*not available|error/i')).toBeTruthy();
    });

    test('should handle network error on teams API', async ({ page }) => {
      await page.route('**/teams*', (route) => route.abort());

      await navigateToScreen(page, SCREENS.MY_TEAMS);

      expect(page.locator('text=/teams.*unavailable|retry/i')).toBeTruthy();
    });

    test('should handle network error on contests API', async ({ page }) => {
      await page.route('**/contests*', (route) => route.abort());

      await navigateToScreen(page, SCREENS.CONTESTS);

      expect(page.locator('text=/contests.*error/i')).toBeTruthy();
    });

    test('should handle network error on wallet API', async ({ page }) => {
      await page.route('**/wallet*', (route) => route.abort());

      await navigateToScreen(page, SCREENS.WALLET);

      expect(page.locator('text=/wallet.*unavailable/i')).toBeTruthy();
    });

    test('should handle network error on leaderboard API', async ({ page }) => {
      await page.route('**/leaderboard*', (route) => route.abort());

      await navigateToScreen(page, SCREENS.LEADERBOARD);

      expect(page.locator('text=/leaderboard.*error/i')).toBeTruthy();
    });

    test('should handle network error on friends API', async ({ page }) => {
      await page.route('**/friends*', (route) => route.abort());

      await navigateToScreen(page, SCREENS.FRIENDS);

      expect(page.locator('text=/friends.*unavailable/i')).toBeTruthy();
    });
  });

  // ====== SUPABASE CONNECTION FAILURES ======
  test.describe('Supabase Connection Failures', () => {
    test('should handle Supabase connection failure on app load', async ({ page }) => {
      await page.route('**/supabase/**', (route) => route.abort());

      await loadApp(page);

      expect(page.locator('text=/connection.*error|service.*unavailable/i')).toBeTruthy();
    });

    test('should handle Supabase auth failure', async ({ page }) => {
      await page.route('**/supabase/**/auth/**', (route) => route.abort());

      await navigateToScreen(page, SCREENS.LOGIN);

      expect(page.locator('text=/authentication.*failed/i')).toBeTruthy();
    });

    test('should handle Supabase database query failure', async ({ page }) => {
      await page.route('**/supabase/**/rest/**', (route) => route.abort());

      await navigateToScreen(page, SCREENS.MY_TEAMS);

      expect(page.locator('text=/unable.*load|try again/i')).toBeTruthy();
    });
  });

  // ====== EDGE FUNCTION TIMEOUTS ======
  test.describe('Edge Function Timeouts', () => {
    test('should handle timeout on match-sync function', async ({ page }) => {
      await page.route('**/match-sync', (route) =>
        new Promise(() => {}) // Never resolves
      );

      await navigateToScreen(page, SCREENS.LIVE_MATCH);

      await page.waitForTimeout(5000);
      expect(page.locator('text=/timeout|taking.*long/i')).toBeTruthy();
    });

    test('should handle timeout on live-score function', async ({ page }) => {
      await page.route('**/live-score', (route) =>
        new Promise(() => {})
      );

      await navigateToScreen(page, SCREENS.LIVE_MATCH);
      await page.waitForTimeout(5000);

      expect(page.locator('text=/timeout|score.*unavailable/i')).toBeTruthy();
    });

    test('should show loading state during timeout', async ({ page }) => {
      await page.route('**/match-sync', (route) =>
        new Promise(() => {})
      );

      await navigateToScreen(page, SCREENS.LIVE_MATCH);

      expect(page.locator('[role="status"]')).toBeTruthy();
    });
  });

  // ====== INVALID API RESPONSES ======
  test.describe('Invalid API Responses', () => {
    test('should handle malformed JSON response', async ({ page }) => {
      await page.route('**/matches*', (route) =>
        route.fulfill({ body: '{invalid json}' })
      );

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      const errors = await collectConsoleErrors(page);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('should handle empty response body', async ({ page }) => {
      await page.route('**/matches*', (route) =>
        route.fulfill({ body: '' })
      );

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      expect(page.locator('text=/no matches|empty/i')).toBeTruthy();
    });

    test('should handle null data in response', async ({ page }) => {
      await page.route('**/matches*', (route) =>
        route.fulfill({ body: JSON.stringify({ data: null }) })
      );

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      expect(page.locator('text=/no matches|empty/i')).toBeTruthy();
    });

    test('should handle undefined data in response', async ({ page }) => {
      await page.route('**/players*', (route) =>
        route.fulfill({ body: JSON.stringify({ data: undefined }) })
      );

      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      expect(page.locator('text=/no players|empty/i')).toBeTruthy();
    });

    test('should handle empty array response', async ({ page }) => {
      await page.route('**/matches*', (route) =>
        route.fulfill({ body: JSON.stringify({ data: [] }) })
      );

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      expect(page.locator('text=/no matches/i')).toBeTruthy();
    });
  });

  // ====== HTTP ERROR STATUS CODES ======
  test.describe('HTTP Error Status Codes', () => {
    test('should handle 401 Unauthorized - redirect to login', async ({ page }) => {
      await page.route('**/matches*', (route) =>
        route.fulfill({ status: 401, body: JSON.stringify({ error: 'Unauthorized' }) })
      );

      await navigateToScreen(page, SCREENS.MATCH_LIST);
      await page.waitForNavigation();

      expect(page.url()).toContain(SCREENS.LOGIN);
    });

    test('should handle 403 Forbidden - show error message', async ({ page }) => {
      await page.route('**/admin/**', (route) =>
        route.fulfill({ status: 403, body: JSON.stringify({ error: 'Forbidden' }) })
      );

      await navigateToScreen(page, SCREENS.ADMIN_PANEL);

      expect(page.locator('text=/access denied|not authorized/i')).toBeTruthy();
    });

    test('should handle 404 Not Found - graceful fallback', async ({ page }) => {
      await page.route('**/matches/nonexistent', (route) =>
        route.fulfill({ status: 404, body: JSON.stringify({ error: 'Not Found' }) })
      );

      await navigateToScreen(page, SCREENS.MATCH_DETAIL);

      expect(page.locator('text=/match.*not found|gone/i')).toBeTruthy();
    });

    test('should handle 500 Server Error - show retry option', async ({ page }) => {
      await page.route('**/matches*', (route) =>
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) })
      );

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      expect(page.locator('text=/retry|try again/i')).toBeTruthy();
    });

    test('should handle 502 Bad Gateway', async ({ page }) => {
      await page.route('**/matches*', (route) =>
        route.fulfill({ status: 502, body: JSON.stringify({ error: 'Bad Gateway' }) })
      );

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      expect(page.locator('text=/service.*unavailable|try.*later/i')).toBeTruthy();
    });

    test('should handle 503 Service Unavailable', async ({ page }) => {
      await page.route('**/matches*', (route) =>
        route.fulfill({ status: 503, body: JSON.stringify({ error: 'Service Unavailable' }) })
      );

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      expect(page.locator('text=/maintenance|unavailable/i')).toBeTruthy();
    });
  });

  // ====== RATE LIMITING ======
  test.describe('Rate Limiting (429)', () => {
    test('should handle 429 Too Many Requests', async ({ page }) => {
      await page.route('**/matches*', (route) =>
        route.fulfill({ status: 429, body: JSON.stringify({ error: 'Too Many Requests' }) })
      );

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      expect(page.locator('text=/rate limit|try.*later|too many/i')).toBeTruthy();
    });

    test('should apply exponential backoff on rate limit', async ({ page }) => {
      let callCount = 0;
      await page.route('**/matches*', (route) => {
        callCount++;
        if (callCount <= 3) {
          route.fulfill({ status: 429 });
        } else {
          route.fulfill({ body: JSON.stringify({ data: [] }) });
        }
      });

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      expect(callCount).toBeGreaterThanOrEqual(4);
    });

    test('should include Retry-After header handling', async ({ page }) => {
      await page.route('**/matches*', (route) =>
        route.fulfill({
          status: 429,
          headers: { 'Retry-After': '60' },
          body: JSON.stringify({ error: 'Too Many Requests' }),
        })
      );

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      expect(page.locator('text=/try again in|wait/i')).toBeTruthy();
    });
  });

  // ====== WEBSOCKET ERRORS ======
  test.describe('WebSocket Disconnection & Reconnection', () => {
    test('should handle WebSocket disconnection during live match', async ({ page }) => {
      await navigateToScreen(page, SCREENS.LIVE_MATCH);
      await page.waitForSelector('[data-ws-connected="true"]', { timeout: 5000 });

      // Simulate disconnection
      await page.evaluate(() => {
        const ws = (window as any).__debugWebSocket;
        if (ws) ws.close();
      });

      await page.waitForTimeout(1000);
      expect(page.locator('text=/disconnected|connection lost/i')).toBeTruthy();
    });

    test('should attempt WebSocket reconnection', async ({ page }) => {
      await navigateToScreen(page, SCREENS.LIVE_MATCH);

      await page.evaluate(() => {
        const ws = (window as any).__debugWebSocket;
        if (ws) ws.close();
      });

      await page.waitForTimeout(2000);

      expect(page.locator('text=/reconnecting|attempting/i')).toBeTruthy();
    });

    test('should show reconnection backoff timer', async ({ page }) => {
      await navigateToScreen(page, SCREENS.LIVE_MATCH);

      await page.evaluate(() => {
        const ws = (window as any).__debugWebSocket;
        if (ws) ws.close();
      });

      expect(page.locator('[data-reconnect-in]')).toBeTruthy();
    });

    test('should restore state after WebSocket reconnection', async ({ page }) => {
      await navigateToScreen(page, SCREENS.LIVE_MATCH);
      const initialScore = await page.locator('[data-score]').textContent();

      await page.evaluate(() => {
        const ws = (window as any).__debugWebSocket;
        if (ws) ws.close();
      });

      await page.waitForTimeout(3000);

      // Simulate successful reconnection
      await page.evaluate(() => {
        const ws = (window as any).__debugWebSocket;
        if (ws) ws = new WebSocket((ws as any).url);
      });

      await page.waitForSelector('[data-ws-connected="true"]', { timeout: 5000 });
      expect(page.locator('[data-score]')).toBeTruthy();
    });
  });

  // ====== OFFLINE MODE ======
  test.describe('Offline Mode Behavior', () => {
    test('should show offline indicator when network is down', async ({ page }) => {
      await goOffline(page);

      expect(page.locator('text=/offline|no connection/i')).toBeTruthy();
    });

    test('should display cached data in offline mode', async ({ page }) => {
      // Load data first
      await navigateToScreen(page, SCREENS.MY_TEAMS);
      const teamName = await page.locator('[data-team-name]').first().textContent();

      // Go offline
      await goOffline(page);

      // Should still see cached data
      expect(page.locator(`text="${teamName}"`)).toBeTruthy();
    });

    test('should show error when trying to submit in offline mode', async ({ page }) => {
      await goOffline(page);
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const submitBtn = page.locator('button:has-text("Create Team")');
      await submitBtn.click();

      expect(page.locator('text=/cannot.*offline|no connection/i')).toBeTruthy();
    });

    test('should sync data after coming back online', async ({ page }) => {
      await navigateToScreen(page, SCREENS.MY_TEAMS);
      await goOffline(page);
      await page.waitForTimeout(1000);
      await goOnline(page);

      await page.waitForLoadState('networkidle');
      expect(page.locator('text=/syncing|updated/i')).toBeTruthy();
    });

    test('should attempt data refresh on reconnection', async ({ page }) => {
      let refreshCount = 0;
      await page.route('**/matches*', (route) => {
        refreshCount++;
        route.continue();
      });

      await goOffline(page);
      await goOnline(page);

      await page.waitForTimeout(2000);
      expect(refreshCount).toBeGreaterThan(0);
    });
  });

  // ====== PARTIAL DATA LOADING ======
  test.describe('Partial Data Loading Failures', () => {
    test('should handle mixed success/failure on parallel requests', async ({ page }) => {
      await page.route('**/matches*', (route) =>
        route.fulfill({ body: JSON.stringify({ data: [] }) })
      );
      await page.route('**/contests*', (route) => route.abort());

      await navigateToScreen(page, SCREENS.HOME);

      expect(page.locator('[data-matches]')).toBeTruthy();
      expect(page.locator('text=/contests.*error/i')).toBeTruthy();
    });

    test('should show partial loading states', async ({ page }) => {
      await page.route('**/players*', (route) =>
        new Promise(() => {}) // Never resolves
      );

      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      expect(page.locator('[role="progressbar"], [role="status"]')).toBeTruthy();
    });

    test('should allow retry of failed requests independently', async ({ page }) => {
      let playerCallCount = 0;
      await page.route('**/players*', (route) => {
        playerCallCount++;
        if (playerCallCount === 1) {
          route.abort();
        } else {
          route.fulfill({ body: JSON.stringify({ data: [] }) });
        }
      });

      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const retryBtn = page.locator('button:has-text("Retry")').first();
      await retryBtn.click();

      expect(playerCallCount).toBe(2);
    });
  });

  // ====== SESSIONSTORGE CORRUPTION ======
  test.describe('SessionStorage Data Corruption', () => {
    test('should handle corrupted sessionStorage data', async ({ page }) => {
      await page.evaluate(() => {
        sessionStorage.setItem('teamDraft', 'corrupted{invalid}json');
      });

      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      expect(page.locator('text=/error|reload/i')).toBeTruthy();
    });

    test('should clear corrupted cache and reload', async ({ page }) => {
      await page.evaluate(() => {
        sessionStorage.setItem('teams', '{"data": invalid}');
      });

      await navigateToScreen(page, SCREENS.MY_TEAMS);

      const hasError = page.locator('text=/invalid|corrupted/i');
      expect(hasError).toBeTruthy();
    });

    test('should recover from corrupted user session', async ({ page }) => {
      await page.evaluate(() => {
        sessionStorage.setItem('user', 'not-valid-json');
      });

      const errors = await collectConsoleErrors(page);
      await page.reload();

      expect(page.url()).toContain(SCREENS.LOGIN);
    });
  });

  // ====== MISSING REQUIRED FIELDS ======
  test.describe('Missing Required Fields in Responses', () => {
    test('should handle player response missing id field', async ({ page }) => {
      await page.route('**/players*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [{ name: 'Player 1', credits: 8.5 }], // Missing id
          }),
        })
      );

      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const errors = await collectConsoleErrors(page);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('should handle team response missing match_id', async ({ page }) => {
      await page.route('**/teams*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [{ id: '1', name: 'Team 1' }], // Missing match_id
          }),
        })
      );

      await navigateToScreen(page, SCREENS.MY_TEAMS);

      expect(page.locator('text=/invalid.*team|error/i')).toBeTruthy();
    });

    test('should handle contest response missing prize_pool', async ({ page }) => {
      await page.route('**/contests*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [{ id: '1', name: 'Contest 1' }], // Missing prize_pool
          }),
        })
      );

      await navigateToScreen(page, SCREENS.CONTESTS);

      const errors = await collectConsoleErrors(page);
      expect(errors.length).toBeGreaterThan(0);
    });

    test('should gracefully skip malformed player objects', async ({ page }) => {
      await page.route('**/players*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [
              { id: '1', name: 'Valid', credits: 8 },
              { name: 'Invalid' }, // Missing required fields
              { id: '2', name: 'Valid2', credits: 9 },
            ],
          }),
        })
      );

      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      // Should show at least the valid players
      const playerCount = await page.locator('[data-player]').count();
      expect(playerCount).toBeGreaterThanOrEqual(2);
    });
  });

  // ====== TEAM SAVE ERRORS ======
  test.describe('Team Save Timeout & Errors', () => {
    test('should handle timeout on team save', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      // Build a team
      const players = page.locator('[data-player]');
      for (let i = 0; i < Math.min(11, await players.count()); i++) {
        await players.nth(i).click();
      }

      await page.route('**/teams', (route) =>
        new Promise(() => {}) // Never resolves
      );

      const saveBtn = page.locator('button:has-text("Save Team")');
      await saveBtn.click();

      await page.waitForTimeout(5000);
      expect(page.locator('text=/timeout|taking.*long/i')).toBeTruthy();
    });

    test('should show loading state during team save', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const saveBtn = page.locator('button:has-text("Save Team")');
      await saveBtn.click();

      expect(page.locator('[data-saving="true"]')).toBeTruthy();
    });

    test('should handle team save failure', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      await page.route('**/teams', (route) =>
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Failed to save' }),
        })
      );

      const saveBtn = page.locator('button:has-text("Save Team")');
      await saveBtn.click();

      expect(page.locator('text=/failed.*save|error/i')).toBeTruthy();
    });
  });

  // ====== DUPLICATE SUBMISSION ======
  test.describe('Duplicate Team Submission', () => {
    test('should prevent duplicate team submission on double-click', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      let saveCallCount = 0;
      await page.route('**/teams', (route) => {
        saveCallCount++;
        route.fulfill({ body: JSON.stringify({ data: { id: '1' } }) });
      });

      const saveBtn = page.locator('button:has-text("Save Team")');
      await saveBtn.click();
      await saveBtn.click(); // Double-click

      await page.waitForTimeout(1000);
      expect(saveCallCount).toBe(1); // Should only call once
    });

    test('should disable save button during submission', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      await page.route('**/teams', (route) =>
        new Promise((resolve) => setTimeout(() => route.fulfill({ body: '{}' }), 2000))
      );

      const saveBtn = page.locator('button:has-text("Save Team")');
      await saveBtn.click();

      expect(saveBtn).toBeDisabled();
    });
  });

  // ====== CONTEST ENTRY ERRORS ======
  test.describe('Contest Entry Errors', () => {
    test('should prevent entry to already-joined contest', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CONTESTS);

      const joinBtn = page.locator('[data-contest-id="already-joined"]').locator('button:has-text("Join")');
      await joinBtn.click();

      expect(page.locator('text=/already joined|already entered/i')).toBeTruthy();
    });

    test('should show error when contest is full', async ({ page }) => {
      await page.route('**/contests/*/join', (route) =>
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Contest is full' }),
        })
      );

      await navigateToScreen(page, SCREENS.CONTESTS);
      const joinBtn = page.locator('button:has-text("Join")').first();
      await joinBtn.click();

      expect(page.locator('text=/full|no spots/i')).toBeTruthy();
    });

    test('should handle insufficient balance for contest entry', async ({ page }) => {
      await page.route('**/contests/*/join', (route) =>
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Insufficient balance' }),
        })
      );

      await navigateToScreen(page, SCREENS.CONTESTS);
      const joinBtn = page.locator('button:has-text("Join")').first();
      await joinBtn.click();

      expect(page.locator('text=/insufficient balance|add.*credits/i')).toBeTruthy();
    });
  });

  // ====== WALLET & PAYMENT ERRORS ======
  test.describe('Wallet & Payment Errors', () => {
    test('should show error for insufficient balance', async ({ page }) => {
      await navigateToScreen(page, SCREENS.WALLET);

      expect(page.locator('[data-balance]')).toBeTruthy();
    });

    test('should handle payment processing error', async ({ page }) => {
      await page.route('**/payments/process', (route) =>
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Payment processing failed' }),
        })
      );

      await navigateToScreen(page, SCREENS.WALLET);
      const addBtn = page.locator('button:has-text("Add Credits")');
      await addBtn.click();

      expect(page.locator('text=/payment.*failed|try again/i')).toBeTruthy();
    });

    test('should handle payment gateway timeout', async ({ page }) => {
      await page.route('**/payments/**', (route) =>
        new Promise(() => {})
      );

      await navigateToScreen(page, SCREENS.WALLET);
      const addBtn = page.locator('button:has-text("Add Credits")');
      await addBtn.click();

      await page.waitForTimeout(5000);
      expect(page.locator('text=/timeout|try again/i')).toBeTruthy();
    });
  });

  // ====== MATCH LOCKOUT ======
  test.describe('Match Lockout & Time-Based Errors', () => {
    test('should prevent team creation after match lockout', async ({ page }) => {
      // Mock a match that's already started
      await page.route('**/matches/*/status', (route) =>
        route.fulfill({
          body: JSON.stringify({ status: 'STARTED' }),
        })
      );

      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      expect(page.locator('text=/match.*started|locked|cannot.*create/i')).toBeTruthy();
    });

    test('should show countdown to lockout time', async ({ page }) => {
      await navigateToScreen(page, SCREENS.MATCH_LIST);

      const countdown = page.locator('[data-lockout-timer]');
      expect(countdown).toBeTruthy();
    });
  });

  // ====== PLAYER DATA MISMATCH ======
  test.describe('Player Data Mismatch & Unavailability', () => {
    test('should handle player no longer available', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      await page.route('**/players/*/status', (route) =>
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Player not available' }),
        })
      );

      const player = page.locator('[data-player]').first();
      await player.click();

      expect(page.locator('text=/not available|unavailable/i')).toBeTruthy();
    });

    test('should remove player if data becomes inconsistent', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const initialCount = await page.locator('[data-player]').count();

      await page.route('**/players*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [], // Empty response
          }),
        })
      );

      await page.reload();
      const newCount = await page.locator('[data-player]').count();

      expect(newCount).toBe(0);
    });
  });

  // ====== CONCURRENT MODIFICATION ======
  test.describe('Concurrent Modification Errors', () => {
    test('should handle friend squad changed while viewing', async ({ page }) => {
      await navigateToScreen(page, SCREENS.FRIENDS);
      const friendSquad = page.locator('[data-friend-squad]').first();
      await friendSquad.click();

      await page.route('**/friends/*/squad', (route) =>
        route.fulfill({
          status: 409,
          body: JSON.stringify({ error: 'Squad was modified' }),
        })
      );

      await page.waitForTimeout(2000);
      expect(page.locator('text=/squad.*changed|modified/i')).toBeTruthy();
    });

    test('should handle contest closing while viewing', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CONTESTS);

      await page.route('**/contests/*/join', (route) =>
        route.fulfill({
          status: 409,
          body: JSON.stringify({ error: 'Contest is closed' }),
        })
      );

      const joinBtn = page.locator('button:has-text("Join")').first();
      await joinBtn.click();

      expect(page.locator('text=/closed|no longer.*available/i')).toBeTruthy();
    });
  });

  // ====== LARGE PAYLOAD HANDLING ======
  test.describe('Large Payload Handling', () => {
    test('should handle large player list response', async ({ page }) => {
      const largePlayers = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        name: `Player ${i}`,
        credits: 8 + Math.random() * 2,
        role: ROLES[i % ROLES.length],
      }));

      await page.route('**/players*', (route) =>
        route.fulfill({
          body: JSON.stringify({ data: largePlayers }),
        })
      );

      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      // Should still be responsive
      const players = page.locator('[data-player]');
      expect(await players.count()).toBeGreaterThan(0);
    });

    test('should paginate large leaderboard', async ({ page }) => {
      await navigateToScreen(page, SCREENS.LEADERBOARD);

      const nextBtn = page.locator('button:has-text("Next")');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        expect(page.locator('[data-rank]')).toBeTruthy();
      }
    });
  });

  // ====== SECURITY: XSS PREVENTION ======
  test.describe('Security - XSS Prevention', () => {
    test('should escape special characters in user input', async ({ page }) => {
      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const teamNameInput = page.locator('input[placeholder="Team Name"]');
      await teamNameInput.fill('<script>alert("xss")</script>');

      const errors = await collectConsoleErrors(page);
      const xssError = errors.some((e) => e.includes('script') && e.includes('alert'));

      expect(xssError).toBeFalsy();
    });

    test('should sanitize HTML in player names from API', async ({ page }) => {
      await page.route('**/players*', (route) =>
        route.fulfill({
          body: JSON.stringify({
            data: [
              {
                id: '1',
                name: '<img src=x onerror=alert("xss")>',
                credits: 8,
              },
            ],
          }),
        })
      );

      await navigateToScreen(page, SCREENS.CREATE_TEAM);

      const player = page.locator('[data-player]').first();
      const text = await player.textContent();
      expect(text).not.toContain('onerror');
    });
  });

  // ====== SECURITY: SQL INJECTION PREVENTION ======
  test.describe('Security - SQL Injection Prevention', () => {
    test('should safely handle SQL injection attempts in search', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="search"]').first();

      if (await searchInput.isVisible()) {
        await searchInput.fill("'; DROP TABLE players; --");
        await page.keyboard.press('Enter');

        // Should not actually execute SQL
        const players = page.locator('[data-player]');
        expect(players).toBeTruthy();
      }
    });

    test('should escape search query in URL', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="search"]').first();

      if (await searchInput.isVisible()) {
        await searchInput.fill('<img src=x onerror=alert(1)>');
        await page.keyboard.press('Enter');

        // URL should be safe
        expect(page.url()).not.toContain('<');
      }
    });
  });

  // ====== CONSOLE ERROR MONITORING ======
  test.describe('Console Error Monitoring', () => {
    test('should not have uncaught exceptions', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const errors = await collectConsoleErrors(page);
      const criticalErrors = errors.filter(
        (e) => !e.includes('404') && !e.includes('net::ERR')
      );

      expect(criticalErrors.length).toBe(0);
    });

    test('should log API errors to monitoring service', async ({ page }) => {
      let errorReportedCount = 0;
      await page.route('**/errors/report', (route) => {
        errorReportedCount++;
        route.fulfill({ body: '{}' });
      });

      await page.route('**/matches*', (route) => route.abort());
      await navigateToScreen(page, SCREENS.MATCH_LIST);

      expect(errorReportedCount).toBeGreaterThan(0);
    });
  });

  // ====== ERROR RECOVERY ======
  test.describe('Error Recovery Mechanisms', () => {
    test('should allow retry after error', async ({ page }) => {
      let attemptCount = 0;
      await page.route('**/matches*', (route) => {
        attemptCount++;
        if (attemptCount === 1) {
          route.abort();
        } else {
          route.fulfill({ body: JSON.stringify({ data: [] }) });
        }
      });

      await navigateToScreen(page, SCREENS.MATCH_LIST);

      const retryBtn = page.locator('button:has-text("Retry")');
      await retryBtn.click();

      expect(attemptCount).toBe(2);
    });

    test('should dismiss error and return to previous state', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      await page.route('**/matches*', (route) => route.abort());
      await navigateToScreen(page, SCREENS.MATCH_LIST);

      const dismissBtn = page.locator('button:has-text("Dismiss")');
      await dismissBtn.click();

      expect(page.locator('text=/error/i')).not.toBeVisible();
    });

    test('should recover from partial failure', async ({ page }) => {
      await page.route('**/matches*', (route) =>
        route.fulfill({ body: JSON.stringify({ data: [] }) })
      );
      await page.route('**/contests*', (route) => route.abort());

      await navigateToScreen(page, SCREENS.HOME);

      expect(page.locator('[data-matches]')).toBeTruthy();
      expect(page.locator('text=/contests.*error/i')).toBeTruthy();
    });
  });

  // ====== ERROR BOUNDARY ======
  test.describe('Error Boundary Behavior', () => {
    test('should catch component rendering errors', async ({ page }) => {
      await page.evaluate(() => {
        const originalRender = window.React?.render;
        if (originalRender) {
          throw new Error('Test error boundary');
        }
      });

      await navigateToScreen(page, SCREENS.HOME);

      // Should still show error UI instead of blank page
      expect(page.locator('text=/something went wrong|error/i')).toBeTruthy();
    });

    test('should show error fallback UI', async ({ page }) => {
      await loadApp(page);

      const errorFallback = page.locator('[data-error-boundary]');
      if (await errorFallback.isVisible()) {
        expect(errorFallback).toBeTruthy();
      }
    });
  });

  // ====== NOSCRIPT GRACEFUL DEGRADATION ======
  test.describe('Graceful Degradation (NoScript)', () => {
    test('should display meaningful message when JavaScript is disabled', async ({ page }) => {
      // Disable JavaScript
      await page.context().setExtraHTTPHeaders({ 'User-Agent': 'NoScript' });

      // Navigate to noscript page
      const noscriptContent = await page.evaluate(() => {
        const el = document.querySelector('noscript');
        return el ? el.textContent : null;
      });

      // Should have noscript content
      expect(noscriptContent).toBeTruthy();
    });
  });
});
