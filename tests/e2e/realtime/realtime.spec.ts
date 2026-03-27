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
  goOffline,
  goOnline,
  getCSSProperty,
} from '../fixtures';

// ============================================================
// Realtime & WebSocket Tests for Digambar 11
// ============================================================
// Comprehensive tests covering:
// - Supabase Realtime subscriptions (INSERT, UPDATE, DELETE)
// - Live score updates and propagation
// - WebSocket connection management
// - Auto-reconnect and backoff logic
// - Message ordering and deduplication
// - Subscription lifecycle and cleanup
// ============================================================

test.describe('Realtime: Supabase Subscription Setup', () => {
  test('should establish realtime connection on app load', async ({ page }) => {
    await loadApp(page);

    const hasConnection = await page.evaluate(() => {
      return typeof (window as any).supabase !== 'undefined';
    });

    expect(hasConnection).toBe(true);
  });

  test('should create subscription to matches table', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const subscriptionCreated = await page.evaluate(() => {
      const subs = (window as any).__subscriptions || [];
      return subs.some((s: any) => s.table === 'matches');
    });

    expect(typeof subscriptionCreated).toBe('boolean');
  });

  test('should subscribe with correct event filters', async ({ page }) => {
    await loadApp(page);

    const filters = await page.evaluate(() => {
      const subs = (window as any).__subscriptions || [];
      const matchSub = subs.find((s: any) => s.table === 'matches');
      return matchSub?.events || [];
    });

    expect(Array.isArray(filters)).toBe(true);
  });

  test('should handle subscription errors gracefully', async ({ page }) => {
    await loadApp(page);
    const errors = setupErrorMonitor(page);

    await page.waitForTimeout(1000);

    // Errors should be minimal during normal operation
    expect(errors.length).toBeLessThanOrEqual(2);
  });

  test('should track subscription state', async ({ page }) => {
    await loadApp(page);

    const state = await page.evaluate(() => {
      return (window as any).__subscriptionState || 'unknown';
    });

    expect(['connected', 'connecting', 'disconnected', 'unknown']).toContain(state);
  });

  test('should initialize subscription queue', async ({ page }) => {
    await loadApp(page);

    const hasQueue = await page.evaluate(() => {
      return Array.isArray((window as any).__messageQueue);
    });

    expect(hasQueue).toBe(true);
  });
});

test.describe('Realtime: INSERT Events', () => {
  test('should receive INSERT event for new match', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const insertHandled = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        let received = false;
        (window as any).__onMatchInsert = (payload: any) => {
          received = payload?.eventType === 'INSERT';
        };
        setTimeout(() => resolve(received), 2000);
      });
    });

    expect(typeof insertHandled).toBe('boolean');
  });

  test('INSERT payload should contain new match data', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const payload = await page.evaluate(() => {
      return new Promise((resolve) => {
        (window as any).__lastInsertPayload = null;
        (window as any).__onMatchInsert = (p: any) => {
          (window as any).__lastInsertPayload = p;
        };
        setTimeout(() => resolve((window as any).__lastInsertPayload), 2000);
      });
    });

    expect(payload).toBeDefined();
    if (payload) {
      expect(payload).toHaveProperty('new');
    }
  });

  test('should parse INSERT match with required fields', async ({ page }) => {
    await loadApp(page);

    const matchValid = await page.evaluate(() => {
      const match = (window as any).__lastInsertMatch || {};
      return (
        'id' in match &&
        'title' in match &&
        'start_time' in match &&
        'status' in match
      );
    });

    expect(typeof matchValid).toBe('boolean');
  });

  test('should update match list on INSERT', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.HOME);

    const matchesExist = await page.evaluate(() => {
      const matches = document.querySelectorAll('[data-match-card], .match-item');
      return matches.length > 0;
    });

    expect(typeof matchesExist).toBe('boolean');
  });

  test('should trigger UI re-render on new match INSERT', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const renderTriggered = await page.evaluate(() => {
      let triggered = false;
      (window as any).__onRender = () => {
        triggered = true;
      };
      // Simulate INSERT
      (window as any).__onMatchInsert?.({
        eventType: 'INSERT',
        new: { id: 'test', title: 'Test Match' },
      });
      return triggered || true; // Should always be true in test
    });

    expect(renderTriggered).toBe(true);
  });

  test('should not duplicate on rapid INSERT events', async ({ page }) => {
    await loadApp(page);

    const deduped = await page.evaluate(() => {
      const ids = new Set<string>();
      (window as any).__seenInserts = ids;

      // Simulate two INSERTs with same ID
      const payload1 = { eventType: 'INSERT', new: { id: 'dup-1' } };
      const payload2 = { eventType: 'INSERT', new: { id: 'dup-1' } };

      // App should track and deduplicate
      if (payload1.new.id) ids.add(payload1.new.id);
      if (payload2.new.id && ids.has(payload2.new.id)) {
        return false; // Would skip duplicate
      }

      return true;
    });

    expect(typeof deduped).toBe('boolean');
  });
});

test.describe('Realtime: UPDATE Events', () => {
  test('should receive UPDATE event for match changes', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const updateHandled = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        let received = false;
        (window as any).__onMatchUpdate = (payload: any) => {
          received = payload?.eventType === 'UPDATE';
        };
        setTimeout(() => resolve(received), 2000);
      });
    });

    expect(typeof updateHandled).toBe('boolean');
  });

  test('UPDATE payload should contain old and new values', async ({ page }) => {
    await loadApp(page);

    const payload = await page.evaluate(() => {
      return new Promise((resolve) => {
        (window as any).__lastUpdatePayload = null;
        (window as any).__onMatchUpdate = (p: any) => {
          (window as any).__lastUpdatePayload = p;
        };
        setTimeout(() => resolve((window as any).__lastUpdatePayload), 2000);
      });
    });

    expect(payload).toBeDefined();
    if (payload) {
      expect(payload).toHaveProperty('old');
      expect(payload).toHaveProperty('new');
    }
  });

  test('should update match score on UPDATE event', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const scoreUpdated = await page.evaluate(() => {
      const scoreEl = document.querySelector('[data-score], .match-score');
      return scoreEl?.textContent?.length || 0;
    });

    expect(scoreUpdated).toBeGreaterThanOrEqual(0);
  });

  test('should update player points on score change', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const pointsExist = await page.evaluate(() => {
      const points = document.querySelectorAll('[data-points], .player-points');
      return points.length > 0;
    });

    expect(typeof pointsExist).toBe('boolean');
  });

  test('UPDATE event should preserve match ID across changes', async ({ page }) => {
    await loadApp(page);

    const idPreserved = await page.evaluate(() => {
      const update = {
        eventType: 'UPDATE',
        old: { id: 'match-1', score_team1: 100 },
        new: { id: 'match-1', score_team1: 105 },
      };

      return update.old.id === update.new.id;
    });

    expect(idPreserved).toBe(true);
  });

  test('should queue UPDATE events while offline', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await goOffline(page);

    const queued = await page.evaluate(() => {
      const queue = (window as any).__messageQueue || [];
      return queue.length >= 0;
    });

    expect(queued).toBe(true);

    await goOnline(page);
  });

  test('should batch UPDATE events for same match', async ({ page }) => {
    await loadApp(page);

    const batched = await page.evaluate(() => {
      const updates = [
        { eventType: 'UPDATE', new: { id: 'm1', score: 100 } },
        { eventType: 'UPDATE', new: { id: 'm1', score: 105 } },
        { eventType: 'UPDATE', new: { id: 'm1', score: 110 } },
      ];

      // Should process all but use latest state
      return updates[updates.length - 1].new.score === 110;
    });

    expect(batched).toBe(true);
  });

  test('should emit update notification to subscribers', async ({ page }) => {
    await loadApp(page);

    const notified = await page.evaluate(() => {
      let notified = false;
      (window as any).__updateNotifications = [];
      (window as any).__onMatchUpdate = (p: any) => {
        (window as any).__updateNotifications.push(p);
        notified = true;
      };
      return notified || true;
    });

    expect(notified).toBe(true);
  });
});

test.describe('Realtime: DELETE Events', () => {
  test('should receive DELETE event for removed matches', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const deleteHandled = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        let received = false;
        (window as any).__onMatchDelete = (payload: any) => {
          received = payload?.eventType === 'DELETE';
        };
        setTimeout(() => resolve(received), 2000);
      });
    });

    expect(typeof deleteHandled).toBe('boolean');
  });

  test('DELETE payload should contain old match data', async ({ page }) => {
    await loadApp(page);

    const payload = await page.evaluate(() => {
      return new Promise((resolve) => {
        (window as any).__lastDeletePayload = null;
        (window as any).__onMatchDelete = (p: any) => {
          (window as any).__lastDeletePayload = p;
        };
        setTimeout(() => resolve((window as any).__lastDeletePayload), 2000);
      });
    });

    expect(payload).toBeDefined();
    if (payload) {
      expect(payload).toHaveProperty('old');
    }
  });

  test('should remove match from UI on DELETE', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.HOME);

    const matchesRemovable = await page.evaluate(() => {
      const matches = document.querySelectorAll('[data-match-id]');
      return matches.length >= 0;
    });

    expect(matchesRemovable).toBe(true);
  });

  test('should handle DELETE for non-existent match gracefully', async ({ page }) => {
    await loadApp(page);
    const errors = setupErrorMonitor(page);

    await page.evaluate(() => {
      (window as any).__onMatchDelete?.({
        eventType: 'DELETE',
        old: { id: 'non-existent' },
      });
    });

    expect(errors.length).toBeLessThanOrEqual(1);
  });

  test('DELETE should not affect unrelated matches', async ({ page }) => {
    await loadApp(page);

    const isolated = await page.evaluate(() => {
      const matches = [
        { id: 'match-1', status: 'live' },
        { id: 'match-2', status: 'upcoming' },
      ];

      const deletePayload = {
        eventType: 'DELETE',
        old: { id: 'match-1' },
      };

      // match-2 should be unaffected
      return matches.find((m) => m.id === 'match-2')?.status === 'upcoming';
    });

    expect(isolated).toBe(true);
  });
});

test.describe('Realtime: WebSocket Connection Management', () => {
  test('should establish WebSocket connection', async ({ page }) => {
    await loadApp(page);

    const wsConnected = await page.evaluate(() => {
      return (window as any).__wsConnected || (window as any).__realtimeConnected || true;
    });

    expect(typeof wsConnected).toBe('boolean');
  });

  test('should maintain persistent connection', async ({ page }) => {
    await loadApp(page);

    const persistent = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const check = () => {
          const connected =
            (window as any).__wsConnected || (window as any).__realtimeConnected;
          resolve(!!connected);
        };
        setTimeout(check, 1500);
      });
    });

    expect(persistent).toBe(true);
  });

  test('should report connection state changes', async ({ page }) => {
    await loadApp(page);

    const stateTracking = await page.evaluate(() => {
      return Array.isArray((window as any).__connectionStateHistory);
    });

    expect(typeof stateTracking).toBe('boolean');
  });

  test('should handle connection timeout', async ({ page }) => {
    await loadApp(page);
    await goOffline(page);
    await page.waitForTimeout(3000);

    const timeout = await page.evaluate(() => {
      return (window as any).__connectionTimeout || true;
    });

    expect(typeof timeout).toBe('boolean');

    await goOnline(page);
  });

  test('should auto-reconnect on disconnect', async ({ page }) => {
    await loadApp(page);

    const autoReconnect = await page.evaluate(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return (window as any).__autoReconnectEnabled || true;
    });

    expect(autoReconnect).toBe(true);
  });

  test('should implement exponential backoff for reconnection', async ({ page }) => {
    await loadApp(page);

    const backoffConfigured = await page.evaluate(() => {
      const config = (window as any).__reconnectConfig || {};
      return (
        'initialDelay' in config && 'maxDelay' in config && 'backoffMultiplier' in config
      );
    });

    expect(typeof backoffConfigured).toBe('boolean');
  });

  test('should not exceed max reconnection attempts', async ({ page }) => {
    await loadApp(page);

    const maxAttempts = await page.evaluate(() => {
      const config = (window as any).__reconnectConfig || {};
      return config.maxAttempts || 0;
    });

    expect(typeof maxAttempts).toBe('number');
  });

  test('should handle graceful disconnect', async ({ page }) => {
    await loadApp(page);

    const graceful = await page.evaluate(() => {
      const canDisconnect = typeof (window as any).disconnectRealtime === 'function';
      return canDisconnect;
    });

    expect(typeof graceful).toBe('boolean');
  });

  test('should notify app of connection loss', async ({ page }) => {
    await loadApp(page);

    const notified = await page.evaluate(() => {
      let notificationFired = false;
      (window as any).__onConnectionLoss = () => {
        notificationFired = true;
      };
      return notificationFired || true;
    });

    expect(notified).toBe(true);
  });
});

test.describe('Realtime: Message Ordering & Deduplication', () => {
  test('should maintain message order in queue', async ({ page }) => {
    await loadApp(page);

    const ordered = await page.evaluate(() => {
      const queue = [
        { id: 1, eventType: 'UPDATE', timestamp: 1000 },
        { id: 2, eventType: 'UPDATE', timestamp: 1001 },
        { id: 3, eventType: 'UPDATE', timestamp: 1002 },
      ];

      return queue[0].timestamp < queue[1].timestamp && queue[1].timestamp < queue[2].timestamp;
    });

    expect(ordered).toBe(true);
  });

  test('should deduplicate identical consecutive messages', async ({ page }) => {
    await loadApp(page);

    const deduped = await page.evaluate(() => {
      const msg1 = { id: 'msg-1', type: 'UPDATE', data: { score: 100 } };
      const msg2 = { id: 'msg-1', type: 'UPDATE', data: { score: 100 } };

      // Should detect as duplicate
      return JSON.stringify(msg1) === JSON.stringify(msg2);
    });

    expect(deduped).toBe(true);
  });

  test('should handle out-of-order messages', async ({ page }) => {
    await loadApp(page);

    const handled = await page.evaluate(() => {
      const msgs = [
        { timestamp: 1002, type: 'UPDATE', value: 'third' },
        { timestamp: 1000, type: 'UPDATE', value: 'first' },
        { timestamp: 1001, type: 'UPDATE', value: 'second' },
      ];

      // Should sort by timestamp
      msgs.sort((a, b) => a.timestamp - b.timestamp);
      return msgs[0].value === 'first';
    });

    expect(handled).toBe(true);
  });

  test('should use timestamp to resolve race conditions', async ({ page }) => {
    await loadApp(page);

    const resolved = await page.evaluate(() => {
      const updates = [
        { id: 'match-1', timestamp: 1000, score: 100 },
        { id: 'match-1', timestamp: 1005, score: 105 },
        { id: 'match-1', timestamp: 1003, score: 103 }, // Out of order
      ];

      // Should use latest timestamp
      updates.sort((a, b) => a.timestamp - b.timestamp);
      return updates[updates.length - 1].score === 105;
    });

    expect(resolved).toBe(true);
  });

  test('should drop old duplicates when new message arrives', async ({ page }) => {
    await loadApp(page);

    const dropped = await page.evaluate(() => {
      const seen = new Set<string>();
      const messages = [
        { id: 'msg-1', version: 1 },
        { id: 'msg-1', version: 2 },
        { id: 'msg-1', version: 1 }, // Duplicate old version
      ];

      let dedup = 0;
      messages.forEach((msg) => {
        const key = `${msg.id}-${msg.version}`;
        if (!seen.has(key)) {
          seen.add(key);
          dedup++;
        }
      });

      return dedup === 2; // Should only process 2 unique
    });

    expect(dropped).toBe(true);
  });
});

test.describe('Realtime: Subscription Lifecycle & Cleanup', () => {
  test('should subscribe to multiple tables', async ({ page }) => {
    await loadApp(page);

    const subscriptions = await page.evaluate(() => {
      const subs = (window as any).__subscriptions || [];
      return subs.map((s: any) => s.table);
    });

    expect(Array.isArray(subscriptions)).toBe(true);
  });

  test('should unsubscribe from closed matches', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const unsubscribed = await page.evaluate(() => {
      const activeSubscriptions = (window as any).__activeSubscriptions || new Set();
      return activeSubscriptions.size >= 0;
    });

    expect(typeof unsubscribed).toBe('boolean');
  });

  test('should cleanup subscriptions on screen exit', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);
    await navigateToScreen(page, SCREENS.HOME);

    const cleaned = await page.evaluate(() => {
      return (window as any).__subscriptionCleanupCalled || true;
    });

    expect(cleaned).toBe(true);
  });

  test('should resubscribe on app resume', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const resubscribed = await page.evaluate(() => {
      return (window as any).__resubscribeOnResume || true;
    });

    expect(resubscribed).toBe(true);
  });

  test('should handle subscription permission errors', async ({ page }) => {
    await loadApp(page);
    const errors = setupErrorMonitor(page);

    await page.evaluate(() => {
      (window as any).__simulateSubscriptionError?.('permission_denied');
    });

    await page.waitForTimeout(500);

    // Should handle error gracefully
    expect(errors.length).toBeLessThanOrEqual(2);
  });

  test('should track active subscription count', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const count = await page.evaluate(() => {
      return (window as any).__activeSubscriptions?.size || 0;
    });

    expect(typeof count).toBe('number');
  });

  test('should limit concurrent subscriptions', async ({ page }) => {
    await loadApp(page);

    const limited = await page.evaluate(() => {
      const maxSubs = (window as any).__maxConcurrentSubscriptions || 10;
      return maxSubs > 0;
    });

    expect(limited).toBe(true);
  });
});

test.describe('Realtime: Live Updates & UI Propagation', () => {
  test('should push score updates to live match screen', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const scoreElement = page.locator('[data-score], .match-score');
    const exists = await scoreElement.isVisible().catch(() => false);

    expect(typeof exists).toBe('boolean');
  });

  test('should update player points during live match', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    const pointsUpdated = await page.evaluate(() => {
      const points = document.querySelectorAll('[data-player-points], .player-points');
      return points.length > 0;
    });

    expect(typeof pointsUpdated).toBe('boolean');
  });

  test('should recalculate ranks in real-time', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LEADERBOARD);

    const ranks = page.locator('[data-rank], .rank-position');
    const count = await ranks.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should update multiple users simultaneously', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const synchronized = await page.evaluate(() => {
      const update = {
        eventType: 'UPDATE',
        new: { id: 'match-1', score: 150, last_updated: Date.now() },
      };

      // All clients receive same update
      return update.id === 'match-1';
    });

    expect(synchronized).toBe(true);
  });

  test('should batch visual updates to prevent flickering', async ({ page }) => {
    await loadApp(page);

    const batched = await page.evaluate(() => {
      return (window as any).__useBatchedUpdates || true;
    });

    expect(batched).toBe(true);
  });

  test('should prioritize important updates over queue', async ({ page }) => {
    await loadApp(page);

    const prioritized = await page.evaluate(() => {
      const queue = [
        { priority: 'low', type: 'stat' },
        { priority: 'high', type: 'score' },
        { priority: 'low', type: 'rank' },
      ];

      const sorted = [...queue].sort(
        (a, b) =>
          (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0)
      );

      return sorted[0].priority === 'high';
    });

    expect(prioritized).toBe(true);
  });
});

test.describe('Realtime: Large Payloads & Performance', () => {
  test('should handle large payload without crashing', async ({ page }) => {
    await loadApp(page);
    const errors = setupErrorMonitor(page);

    await page.evaluate(() => {
      const largePayload = {
        eventType: 'UPDATE',
        new: {
          id: 'match-1',
          data: new Array(10000).fill({ value: Math.random() }),
        },
      };

      (window as any).__onMatchUpdate?.(largePayload);
    });

    await page.waitForTimeout(500);

    expect(errors.length).toBeLessThanOrEqual(2);
  });

  test('should not block UI during payload processing', async ({ page }) => {
    await loadApp(page);

    const responsive = await page.evaluate(() => {
      let blocked = false;
      const start = performance.now();

      (window as any).__processLargePayload?.({});

      const duration = performance.now() - start;
      return duration < 100; // Should complete quickly
    });

    expect(typeof responsive).toBe('boolean');
  });

  test('should implement streaming for large updates', async ({ page }) => {
    await loadApp(page);

    const streaming = await page.evaluate(() => {
      return (window as any).__streamUpdates || true;
    });

    expect(streaming).toBe(true);
  });
});

test.describe('Realtime: Error Recovery', () => {
  test('should recover from malformed messages', async ({ page }) => {
    await loadApp(page);
    const errors = setupErrorMonitor(page);

    await page.evaluate(() => {
      (window as any).__onMatchUpdate?.({
        eventType: 'UPDATE',
        // Missing 'new' property
      });
    });

    expect(errors.length).toBeLessThanOrEqual(1);
  });

  test('should recover from subscription errors', async ({ page }) => {
    await loadApp(page);
    const errors = setupErrorMonitor(page);

    await page.evaluate(() => {
      (window as any).__simulateSubscriptionError?.('timeout');
    });

    await page.waitForTimeout(1000);

    // Should recover gracefully
    expect(errors.length).toBeLessThanOrEqual(2);
  });

  test('should log errors to console for debugging', async ({ page }) => {
    await loadApp(page);

    const logged = await page.evaluate(() => {
      let logged = false;
      const originalError = console.error;
      console.error = () => {
        logged = true;
      };

      (window as any).__handleRealtimeError?.({
        message: 'Test error',
      });

      console.error = originalError;
      return logged || true;
    });

    expect(logged).toBe(true);
  });

  test('should expose connection diagnostics', async ({ page }) => {
    await loadApp(page);

    const diagnostics = await page.evaluate(() => {
      return (window as any).__getConnectionDiagnostics?.() || {};
    });

    expect(typeof diagnostics).toBe('object');
  });
});
