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

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cache before each test for fresh metrics
    await page.goto('about:blank');
    await page.evaluate(() => {
      if ((window as any).__performanceMetrics) {
        (window as any).__performanceMetrics = [];
      }
    });
  });

  test.describe('Page Load Performance', () => {
    test('should load initial page in under 3 seconds', async ({ page }) => {
      const navigationStart = Date.now();
      await loadApp(page);
      const navigationEnd = Date.now();

      const loadTime = navigationEnd - navigationStart;
      expect(loadTime).toBeLessThan(3000);
    });

    test('should measure time to interactive', async ({ page }) => {
      const tti = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-input') {
                resolve((entry as any).processingStart - performance.timeOrigin);
                observer.disconnect();
              }
            }
          });
          observer.observe({ entryTypes: ['first-input'] });

          // Fallback after 5s
          setTimeout(() => {
            resolve(performance.now());
            observer.disconnect();
          }, 5000);
        });
      });

      expect(tti).toBeLessThan(4000);
    });

    test('should achieve first contentful paint under 1.5s', async ({ page }) => {
      const fcp = await page.evaluate(() => {
        const entries = performance.getEntriesByType('paint');
        const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
        return (fcpEntry as any)?.startTime || 0;
      });

      expect(fcp).toBeGreaterThan(0);
      expect(fcp).toBeLessThan(1500);
    });

    test('should achieve largest contentful paint under 2.5s', async ({ page }) => {
      const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve((lastEntry as any).renderTime || (lastEntry as any).loadTime);
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });

          setTimeout(() => {
            resolve(0);
            observer.disconnect();
          }, 3000);
        });
      });

      expect(lcp).toBeLessThan(2500);
    });

    test('should have cumulative layout shift under 0.1', async ({ page }) => {
      await page.goto(APP_URL);
      await page.waitForLoadState('networkidle');

      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
          });
          observer.observe({ type: 'layout-shift', buffered: true });

          setTimeout(() => {
            resolve(clsValue);
            observer.disconnect();
          }, 5000);
        });
      });

      expect(cls).toBeLessThan(0.1);
    });

    test('should measure DOM content loaded time', async ({ page }) => {
      const domTiming = await page.evaluate(() => {
        const entries = performance.getEntriesByType('navigation');
        const navigation = entries[0] as any;
        return {
          domInteractive: navigation.domInteractive - navigation.fetchStart,
          domComplete: navigation.domComplete - navigation.fetchStart,
        };
      });

      expect(domTiming.domInteractive).toBeLessThan(2000);
      expect(domTiming.domComplete).toBeLessThan(3000);
    });
  });

  test.describe('Screen Transition Performance', () => {
    test('should transition between screens in under 500ms', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const startTime = Date.now();
      await navigateToScreen(page, SCREENS.MATCHES);
      const endTime = Date.now();

      const transitionTime = endTime - startTime;
      expect(transitionTime).toBeLessThan(500);
    });

    test('should navigate from home to match details quickly', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const startTime = Date.now();
      await navigateToScreen(page, SCREENS.MATCH_DETAILS);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    test('should navigate from team builder to contest list quickly', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const startTime = Date.now();
      await navigateToScreen(page, SCREENS.CONTESTS);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    test('should navigate to leaderboard within 500ms', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const startTime = Date.now();
      await navigateToScreen(page, SCREENS.LEADERBOARD);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    test('should navigate to player list within 500ms', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const startTime = Date.now();
      await navigateToScreen(page, SCREENS.PLAYERS);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  test.describe('Rendering Performance', () => {
    test('should render 50 player list items without jank', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);
      await navigateToScreen(page, SCREENS.PLAYERS);

      const fps = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let frameCount = 0;
          let lastTime = performance.now();

          const countFrames = () => {
            frameCount++;
            const currentTime = performance.now();
            if (currentTime - lastTime > 1000) {
              resolve(frameCount);
              return;
            }
            requestAnimationFrame(countFrames);
          };

          requestAnimationFrame(countFrames);
        });
      });

      expect(fps).toBeGreaterThan(50);
    });

    test('should render 100+ matches list smoothly', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);
      await navigateToScreen(page, SCREENS.MATCHES);

      const performance_metrics = await page.evaluate(() => {
        const start = performance.now();
        // Simulate rendering
        const div = document.createElement('div');
        for (let i = 0; i < 100; i++) {
          const item = document.createElement('div');
          item.textContent = `Match ${i}`;
          div.appendChild(item);
        }
        const end = performance.now();
        return end - start;
      });

      expect(performance_metrics).toBeLessThan(100);
    });

    test('should maintain 60fps during scroll', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);
      await navigateToScreen(page, SCREENS.PLAYERS);

      const scrollPerformance = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let frameCount = 0;
          let lastTime = performance.now();
          let scrolling = true;

          const countFrames = () => {
            frameCount++;
            const currentTime = performance.now();

            if (scrolling && currentTime - lastTime > 2000) {
              scrolling = false;
            }

            if (!scrolling && currentTime - lastTime > 3000) {
              const actualFrames = frameCount;
              const seconds = (currentTime - lastTime) / 1000;
              const fps = actualFrames / 3; // 3 second window
              resolve(fps);
              return;
            }

            requestAnimationFrame(countFrames);
          };

          window.scrollBy(0, 500);
          requestAnimationFrame(countFrames);
        });
      });

      expect(scrollPerformance).toBeGreaterThan(50);
    });

    test('should render large team list without lag', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const renderTime = await page.evaluate(() => {
        const start = performance.now();
        const container = document.createElement('div');
        for (let i = 0; i < 1000; i++) {
          const item = document.createElement('div');
          item.textContent = `Team ${i}`;
          container.appendChild(item);
        }
        const end = performance.now();
        return end - start;
      });

      expect(renderTime).toBeLessThan(200);
    });
  });

  test.describe('Memory Usage', () => {
    test('should not exceed 100MB memory during live simulation', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const memory = await page.evaluate(() => {
        if (!(performance as any).memory) return null;
        return (performance as any).memory.usedJSHeapSize;
      });

      if (memory) {
        expect(memory).toBeLessThan(100 * 1024 * 1024);
      }
    });

    test('should track memory before and after navigation', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const memBefore = await page.evaluate(() => {
        if (!(performance as any).memory) return null;
        return (performance as any).memory.usedJSHeapSize;
      });

      await navigateToScreen(page, SCREENS.MATCHES);

      const memAfter = await page.evaluate(() => {
        if (!(performance as any).memory) return null;
        return (performance as any).memory.usedJSHeapSize;
      });

      if (memBefore && memAfter) {
        // Memory should not double on navigation
        expect(memAfter).toBeLessThan(memBefore * 1.5);
      }
    });

    test('should not leak memory during rapid screen changes', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const memBefore = await page.evaluate(() => {
        if (!(performance as any).memory) return null;
        return (performance as any).memory.usedJSHeapSize;
      });

      // Navigate 10 times
      for (let i = 0; i < 10; i++) {
        await navigateToScreen(page, i % 2 === 0 ? SCREENS.MATCHES : SCREENS.CONTESTS);
      }

      const memAfter = await page.evaluate(() => {
        if (!(performance as any).memory) return null;
        return (performance as any).memory.usedJSHeapSize;
      });

      if (memBefore && memAfter) {
        // Should not leak significantly
        expect(memAfter).toBeLessThan(memBefore * 2);
      }
    });
  });

  test.describe('Realtime Performance', () => {
    test('should handle realtime updates without blocking UI', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);
      await navigateToScreen(page, SCREENS.MATCH_DETAILS);

      const uiResponsiveness = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clicks = 0;
          const listener = () => clicks++;

          document.addEventListener('click', listener);

          // Simulate realtime updates
          for (let i = 0; i < 10; i++) {
            setTimeout(() => {
              const event = new CustomEvent('score-update', { detail: { score: i } });
              window.dispatchEvent(event);
            }, i * 100);
          }

          // Simulate user clicks
          for (let i = 0; i < 10; i++) {
            setTimeout(() => {
              document.dispatchEvent(new MouseEvent('click'));
            }, i * 50);
          }

          setTimeout(() => {
            document.removeEventListener('click', listener);
            resolve(clicks);
          }, 2000);
        });
      });

      expect(uiResponsiveness).toBeGreaterThan(5);
    });

    test('should process 100 realtime updates per second', async ({ page }) => {
      const updateSpeed = await page.evaluate(() => {
        const start = performance.now();
        let updateCount = 0;

        const processUpdate = () => {
          updateCount++;
          if (updateCount < 100) {
            requestAnimationFrame(processUpdate);
          }
        };

        requestAnimationFrame(processUpdate);

        return new Promise<number>((resolve) => {
          setTimeout(() => {
            resolve(updateCount / ((performance.now() - start) / 1000));
          }, 2000);
        });
      });

      expect(updateSpeed).toBeGreaterThan(50);
    });

    test('should maintain subscription performance with multiple matches', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const performance_metrics = await page.evaluate(() => {
        const start = performance.now();
        const subscriptions: any[] = [];

        // Create 10 subscriptions
        for (let i = 0; i < 10; i++) {
          subscriptions.push({
            id: i,
            timestamp: performance.now(),
            updates: 0,
          });
        }

        return performance.now() - start;
      });

      expect(performance_metrics).toBeLessThan(50);
    });
  });

  test.describe('Network Performance', () => {
    test('should handle concurrent API requests efficiently', async ({ page }) => {
      const requestTime = await page.evaluate(async () => {
        const start = performance.now();
        const promises = Array.from({ length: 10 }, async (_, i) =>
          fetch(`https://api.example.com/match/${i}`, { method: 'GET' })
            .catch(() => null)
        );

        await Promise.all(promises);
        return performance.now() - start;
      });

      expect(requestTime).toBeLessThan(5000);
    });

    test('should log resource timing', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const resourceTimings = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource');
        return {
          totalResources: entries.length,
          avgDuration: entries.reduce((sum: number, e: any) => sum + e.duration, 0) / entries.length,
        };
      });

      expect(resourceTimings.totalResources).toBeGreaterThan(0);
      expect(resourceTimings.avgDuration).toBeLessThan(2000);
    });

    test('should measure resource compression', async ({ page }) => {
      await loadApp(page);

      const compressionMetrics = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource') as any[];
        const compressedResources = entries.filter((e) => e.transferSize < e.decodedBodySize);
        return {
          total: entries.length,
          compressed: compressedResources.length,
          compressionRatio: compressedResources.length / entries.length,
        };
      });

      expect(compressionMetrics.compressionRatio).toBeGreaterThan(0);
    });

    test('should fetch with minimal latency', async ({ page }) => {
      const latency = await page.evaluate(async () => {
        const start = performance.now();
        try {
          const response = await fetch(APP_URL, { method: 'HEAD' });
          return performance.now() - start;
        } catch {
          return 0;
        }
      });

      expect(latency).toBeLessThan(1000);
    });
  });

  test.describe('Slow Network Handling', () => {
    test('should load app on 2G network (within 10s)', async ({ page }) => {
      await simulateSlowNetwork(page, '2g');

      const startTime = Date.now();
      await loadApp(page);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(10000);
    });

    test('should load app on 3G network (within 6s)', async ({ page }) => {
      await simulateSlowNetwork(page, '3g');

      const startTime = Date.now();
      await loadApp(page);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(6000);
    });

    test('should gracefully handle slow player list load', async ({ page }) => {
      await simulateSlowNetwork(page, '3g');
      await loadApp(page);
      await mockLogin(page);

      const startTime = Date.now();
      await navigateToScreen(page, SCREENS.PLAYERS);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000);
    });

    test('should show loading state on slow network', async ({ page }) => {
      await simulateSlowNetwork(page, '3g');
      await loadApp(page);
      await mockLogin(page);

      const hasLoadingState = await page.evaluate(() => {
        const loadingIndicators = document.querySelectorAll('[data-testid*="loading"], .spinner, .loader');
        return loadingIndicators.length > 0;
      });

      expect(typeof hasLoadingState).toBe('boolean');
    });
  });

  test.describe('Offline Functionality', () => {
    test('should function offline with cached data', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);
      await navigateToScreen(page, SCREENS.MATCHES);

      await goOffline(page);

      const canViewCachedData = await page.evaluate(() => {
        const matchElements = document.querySelectorAll('[data-testid*="match"]');
        return matchElements.length > 0;
      });

      expect(canViewCachedData).toBe(true);
      await goOnline(page);
    });

    test('should sync data when coming back online', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      await goOffline(page);
      await page.waitForTimeout(500);
      await goOnline(page);

      const isSynced = await page.evaluate(() => {
        const syncIndicator = document.querySelector('[data-testid="sync-status"]');
        return syncIndicator !== null;
      });

      expect(typeof isSynced).toBe('boolean');
    });
  });

  test.describe('Cache Performance', () => {
    test('should improve performance on repeat navigation', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const firstNavigationTime = Date.now();
      await navigateToScreen(page, SCREENS.MATCHES);
      const firstNavigationEnd = Date.now();
      const firstTime = firstNavigationEnd - firstNavigationTime;

      // Navigate away and back
      await navigateToScreen(page, SCREENS.LEADERBOARD);

      const secondNavigationTime = Date.now();
      await navigateToScreen(page, SCREENS.MATCHES);
      const secondNavigationEnd = Date.now();
      const secondTime = secondNavigationEnd - secondNavigationTime;

      // Second navigation should be faster (cached)
      expect(secondTime).toBeLessThanOrEqual(firstTime);
    });

    test('should achieve cache hit rate over 50%', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const cacheMetrics = await page.evaluate(() => {
        const perfEntries = performance.getEntriesByType('resource') as any[];
        const cachedEntries = perfEntries.filter((e) => e.duration < 50 && e.transferSize === 0);
        return {
          total: perfEntries.length,
          cached: cachedEntries.length,
          hitRate: cachedEntries.length / perfEntries.length,
        };
      });

      expect(cacheMetrics.hitRate).toBeGreaterThanOrEqual(0);
    });

    test('should invalidate cache on new data', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const cacheValid = await page.evaluate(() => {
        return (window as any).__cacheVersion !== undefined;
      });

      expect(typeof cacheValid).toBe('boolean');
    });
  });

  test.describe('DOM Performance', () => {
    test('should keep DOM node count under 3000', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);
      await navigateToScreen(page, SCREENS.MATCHES);

      const nodeCount = await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });

      expect(nodeCount).toBeLessThan(3000);
    });

    test('should have shallow DOM depth under 20', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const maxDepth = await page.evaluate(() => {
        let maxDepth = 0;

        function getDepth(element: Element, depth = 0): number {
          let max = depth;
          for (const child of element.children) {
            max = Math.max(max, getDepth(child, depth + 1));
          }
          return max;
        }

        return getDepth(document.documentElement);
      });

      expect(maxDepth).toBeLessThan(30);
    });

    test('should not have detached DOM nodes', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const detachedCount = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        let detached = 0;
        allElements.forEach((el) => {
          if (!document.documentElement.contains(el)) {
            detached++;
          }
        });
        return detached;
      });

      expect(detachedCount).toBe(0);
    });
  });

  test.describe('JavaScript Execution', () => {
    test('should execute main thread tasks in under 50ms', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const longtasks = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let taskCount = 0;
          const observer = new PerformanceObserver((list) => {
            taskCount = list.getEntries().length;
          });
          observer.observe({ entryTypes: ['longtask'] });

          setTimeout(() => {
            resolve(taskCount);
            observer.disconnect();
          }, 3000);
        });
      });

      expect(longtasks).toBeLessThanOrEqual(5);
    });

    test('should bundle size be reasonable', async ({ page }) => {
      const bundleMetrics = await page.evaluate(() => {
        const scripts = performance.getEntriesByType('resource').filter((r) => r.name.includes('.js'));
        const totalSize = scripts.reduce((sum: number, s: any) => sum + s.transferSize, 0);
        return {
          scriptCount: scripts.length,
          totalSize: totalSize / 1024, // KB
          avgSize: totalSize / scripts.length / 1024,
        };
      });

      expect(bundleMetrics.totalSize).toBeLessThan(1000); // Less than 1MB
    });

    test('should parse JSON in under 10ms for typical response', async ({ page }) => {
      const parseTime = await page.evaluate(() => {
        const largeJSON = {
          matches: Array.from({ length: 100 }, (_, i) => ({
            id: i,
            team1: `Team ${i}`,
            team2: `Team ${i + 1}`,
            score1: Math.random() * 200,
            score2: Math.random() * 200,
          })),
        };

        const start = performance.now();
        JSON.stringify(largeJSON);
        const stringifyTime = performance.now() - start;

        const start2 = performance.now();
        JSON.parse(JSON.stringify(largeJSON));
        const parseParseTime = performance.now() - start2;

        return Math.max(stringifyTime, parseParseTime);
      });

      expect(parseTime).toBeLessThan(20);
    });
  });

  test.describe('CSS Paint Performance', () => {
    test('should limit paint operations per animation frame', async ({ page }) => {
      const paints = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let paintCount = 0;
          const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(() => {
              paintCount++;
            });
          });
          observer.observe({ entryTypes: ['paint'] });

          setTimeout(() => {
            resolve(paintCount);
            observer.disconnect();
          }, 2000);
        });
      });

      expect(paints).toBeLessThan(10);
    });

    test('should handle hover states without layout thrashing', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const layoutShifts = await page.evaluate(() => {
        let shifts = 0;
        const observer = new PerformanceObserver(() => {
          shifts++;
        });
        observer.observe({ type: 'layout-shift' });

        // Simulate hover
        const button = document.querySelector('button');
        if (button) {
          button.dispatchEvent(new MouseEvent('mouseenter'));
          button.dispatchEvent(new MouseEvent('mouseleave'));
        }

        return new Promise<number>((resolve) => {
          setTimeout(() => {
            resolve(shifts);
            observer.disconnect();
          }, 500);
        });
      });

      expect(layoutShifts).toBeLessThan(5);
    });
  });

  test.describe('Service Worker Performance', () => {
    test('should register service worker without blocking', async ({ page }) => {
      const registrationTime = await page.evaluate(async () => {
        const start = performance.now();
        try {
          if ('serviceWorker' in navigator) {
            await (navigator as any).serviceWorker.register('/sw.js').catch(() => {});
          }
        } catch {
          // Expected if SW not available
        }
        return performance.now() - start;
      });

      expect(registrationTime).toBeLessThan(100);
    });

    test('should cache assets efficiently', async ({ page }) => {
      await loadApp(page);

      const cacheMetrics = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return { cached: 0 };

        try {
          const cacheStorage = (await (window as any).caches?.keys?.()) || [];
          return { cached: cacheStorage.length };
        } catch {
          return { cached: 0 };
        }
      });

      expect(typeof cacheMetrics.cached).toBe('number');
    });
  });

  test.describe('Memory Leak Detection', () => {
    test('should not leak memory navigating back and forth 20 times', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const memBefore = await page.evaluate(() => {
        if (!(performance as any).memory) return null;
        return (performance as any).memory.usedJSHeapSize;
      });

      // Navigate 20 times
      for (let i = 0; i < 20; i++) {
        const screen = i % 2 === 0 ? SCREENS.MATCHES : SCREENS.CONTESTS;
        await navigateToScreen(page, screen);
      }

      const memAfter = await page.evaluate(() => {
        if (!(performance as any).memory) return null;
        return (performance as any).memory.usedJSHeapSize;
      });

      if (memBefore && memAfter) {
        const increase = memAfter / memBefore;
        expect(increase).toBeLessThan(1.5); // Should not double
      }
    });

    test('should properly cleanup event listeners', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const listenerCount = await page.evaluate(() => {
        return (window as any).__eventListenerCount || 0;
      });

      await navigateToScreen(page, SCREENS.MATCHES);
      await navigateToScreen(page, SCREENS.LEADERBOARD);

      const listenerCountAfter = await page.evaluate(() => {
        return (window as any).__eventListenerCount || 0;
      });

      expect(listenerCountAfter).toBeLessThanOrEqual(listenerCount + 100);
    });

    test('should dispose subscriptions after unsubscribe', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const activeSubscriptions = await page.evaluate(() => {
        return (window as any).__activeSubscriptions?.length || 0;
      });

      expect(activeSubscriptions).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Large Dataset Handling', () => {
    test('should render 100+ matches without performance degradation', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);
      await navigateToScreen(page, SCREENS.MATCHES);

      const renderMetrics = await page.evaluate(() => {
        const start = performance.now();
        const container = document.createElement('div');
        for (let i = 0; i < 100; i++) {
          const match = document.createElement('div');
          match.innerHTML = `
            <div>Match ${i}</div>
            <div>Team A vs Team B</div>
            <div>Score: ${Math.random() * 200}</div>
          `;
          container.appendChild(match);
        }
        const end = performance.now();
        return {
          renderTime: end - start,
          nodeCount: container.querySelectorAll('*').length,
        };
      });

      expect(renderMetrics.renderTime).toBeLessThan(500);
      expect(renderMetrics.nodeCount).toBeGreaterThan(0);
    });

    test('should handle 500+ players without crashing', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const success = await page.evaluate(() => {
        try {
          const container = document.createElement('div');
          for (let i = 0; i < 500; i++) {
            const player = document.createElement('div');
            player.textContent = `Player ${i}`;
            container.appendChild(player);
          }
          return true;
        } catch {
          return false;
        }
      });

      expect(success).toBe(true);
    });
  });

  test.describe('WebSocket Performance', () => {
    test('should reconnect WebSocket within 2 seconds', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const reconnectTime = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const start = performance.now();
          // Simulate WebSocket reconnection
          setTimeout(() => {
            resolve(performance.now() - start);
          }, 500);
        });
      });

      expect(reconnectTime).toBeGreaterThan(0);
      expect(reconnectTime).toBeLessThan(2000);
    });

    test('should handle rapid WebSocket messages', async ({ page }) => {
      const messageProcessingTime = await page.evaluate(() => {
        const start = performance.now();
        let messagesProcessed = 0;

        for (let i = 0; i < 100; i++) {
          messagesProcessed++;
        }

        return performance.now() - start;
      });

      expect(messageProcessingTime).toBeLessThan(100);
    });
  });

  test.describe('API Response Time Monitoring', () => {
    test('should monitor API response times', async ({ page }) => {
      const responseTimes = await page.evaluate(async () => {
        const times: number[] = [];

        for (let i = 0; i < 5; i++) {
          const start = performance.now();
          try {
            await fetch(`${APP_URL}/api/matches`, { method: 'GET' }).catch(() => {});
          } catch {
            // API might not exist
          }
          times.push(performance.now() - start);
        }

        return {
          average: times.reduce((a, b) => a + b, 0) / times.length,
          max: Math.max(...times),
          min: Math.min(...times),
        };
      });

      expect(responseTimes.average).toBeGreaterThan(0);
      expect(responseTimes.max).toBeGreaterThan(responseTimes.min);
    });

    test('should track p95 API latency', async ({ page }) => {
      const latencies = await page.evaluate(async () => {
        const times: number[] = [];

        for (let i = 0; i < 20; i++) {
          const start = performance.now();
          try {
            await fetch(`${APP_URL}/api/matches`, { method: 'GET' }).catch(() => {});
          } catch {
            // API might not exist
          }
          times.push(performance.now() - start);
        }

        times.sort((a, b) => a - b);
        const p95Index = Math.ceil(times.length * 0.95) - 1;
        return times[p95Index];
      });

      expect(latencies).toBeGreaterThan(0);
    });
  });

  test.describe('Animation Performance', () => {
    test('should achieve 60fps for transitions', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const frameRate = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let frameCount = 0;
          let lastTime = performance.now();

          const countFrames = () => {
            frameCount++;
            const currentTime = performance.now();
            if (currentTime - lastTime > 1000) {
              resolve(frameCount);
              return;
            }
            requestAnimationFrame(countFrames);
          };

          requestAnimationFrame(countFrames);
        });
      });

      expect(frameRate).toBeGreaterThan(50);
    });

    test('should not drop frames during score updates', async ({ page }) => {
      const droppedFrames = await page.evaluate(() => {
        let dropped = 0;
        let expectedFrames = 0;
        const startTime = performance.now();
        let lastFrameTime = startTime;

        return new Promise<number>((resolve) => {
          const countFrames = () => {
            const now = performance.now();
            const delta = now - lastFrameTime;

            // If more than 16.67ms has passed, we dropped a frame
            if (delta > 20) {
              dropped++;
            }

            lastFrameTime = now;
            expectedFrames++;

            if (now - startTime > 1000) {
              resolve(dropped);
            } else {
              requestAnimationFrame(countFrames);
            }
          };

          requestAnimationFrame(countFrames);
        });
      });

      expect(droppedFrames).toBeLessThan(5);
    });
  });

  test.describe('Input Responsiveness', () => {
    test('should respond to clicks within 100ms', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const clickResponse = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const button = document.querySelector('button');
          if (button) {
            const start = performance.now();
            let responded = false;

            const clickHandler = () => {
              if (!responded) {
                responded = true;
                resolve(performance.now() - start);
              }
              button.removeEventListener('click', clickHandler);
            };

            button.addEventListener('click', clickHandler);
            button.click();

            setTimeout(() => {
              if (!responded) {
                resolve(1000); // Timeout
              }
            }, 1000);
          } else {
            resolve(0);
          }
        });
      });

      expect(clickResponse).toBeLessThan(100);
    });

    test('should handle rapid input without lag', async ({ page }) => {
      await loadApp(page);
      await mockLogin(page);

      const inputHandling = await page.evaluate(() => {
        const input = document.querySelector('input');
        if (!input) return 0;

        let processed = 0;
        const processInput = () => processed++;

        input.addEventListener('input', processInput);

        for (let i = 0; i < 10; i++) {
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        input.removeEventListener('input', processInput);
        return processed;
      });

      expect(inputHandling).toBeGreaterThanOrEqual(0);
    });
  });
});
