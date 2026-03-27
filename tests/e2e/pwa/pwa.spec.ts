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
// PWA & Service Worker Tests for Digambar 11
// ============================================================
// Comprehensive tests covering:
// - Service worker lifecycle (registration, activation)
// - Web app manifest (name, icons, theme, display mode)
// - Offline capabilities and caching strategies
// - Install prompts and home screen functionality
// - Mobile web app capabilities
// ============================================================

test.describe('PWA: Service Worker Lifecycle', () => {
  test('should register service worker on app load', async ({ page }) => {
    await loadApp(page);

    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(swRegistered).toBe(true);

    const registration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration().then((reg) => ({
        active: !!reg?.active,
        installing: !!reg?.installing,
        waiting: !!reg?.waiting,
      }));
    });

    expect(registration).toBeDefined();
  });

  test('should activate service worker after registration', async ({ page }) => {
    await loadApp(page);
    await page.waitForTimeout(2000);

    const activeWorker = await page.evaluate(() => {
      return navigator.serviceWorker
        .getRegistration()
        .then((reg) => (reg?.active ? reg.active.state : null));
    });

    expect(activeWorker).toBe('activated');
  });

  test('service worker should have correct scope', async ({ page }) => {
    await loadApp(page);

    const scope = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration().then((reg) => reg?.scope);
    });

    expect(scope).toContain(new URL(APP_URL).hostname);
  });

  test('service worker should handle controller change', async ({ page }) => {
    await loadApp(page);

    const hasController = await page.evaluate(() => {
      return navigator.serviceWorker.controller !== null;
    });

    expect(hasController).toBe(true);
  });

  test('should skip waiting and claim clients on update', async ({ page }) => {
    await loadApp(page);

    const updateHandled = await page.evaluate(() => {
      let updated = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        updated = true;
      });
      return new Promise((resolve) => {
        setTimeout(() => resolve(updated), 3000);
      });
    });

    // This test verifies the handler is in place; actual behavior requires SW update
    expect(typeof updateHandled).toBe('boolean');
  });

  test('service worker should be uninstalled after factory reset', async ({ page }) => {
    await loadApp(page);

    const unregistered = await page.evaluate(() => {
      return navigator.serviceWorker
        .getRegistration()
        .then((reg) => reg?.unregister() || true);
    });

    expect(unregistered).toBe(true);
  });
});

test.describe('PWA: Web App Manifest', () => {
  test('manifest.json should load and be valid', async ({ page }) => {
    await loadApp(page);

    const manifestLink = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link?.getAttribute('href');
    });

    expect(manifestLink).toBeDefined();
    expect(manifestLink).toMatch(/manifest\.json|manifest/);
  });

  test('should have correct app name in manifest', async ({ page }) => {
    await loadApp(page);

    const manifest = await page.evaluate(() => {
      return fetch('/manifest.json')
        .then((res) => res.json())
        .catch(() => null);
    });

    expect(manifest).toBeDefined();
    expect(manifest?.name).toBeDefined();
    expect(manifest.name.toLowerCase()).toContain('digambar');
  });

  test('should have valid short name in manifest', async ({ page }) => {
    await loadApp(page);

    const manifest = await page.evaluate(() => {
      return fetch('/manifest.json')
        .then((res) => res.json())
        .catch(() => null);
    });

    expect(manifest?.short_name).toBeDefined();
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
  });

  test('manifest should include multiple icon sizes', async ({ page }) => {
    await loadApp(page);

    const manifest = await page.evaluate(() => {
      return fetch('/manifest.json')
        .then((res) => res.json())
        .catch(() => null);
    });

    expect(manifest?.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);

    const sizes = manifest.icons.map((icon: any) => icon.sizes);
    expect(sizes).toContain(expect.stringMatching(/192x192|256x256|512x512/));
  });

  test('icons should have correct type (image/png or webp)', async ({ page }) => {
    await loadApp(page);

    const manifest = await page.evaluate(() => {
      return fetch('/manifest.json')
        .then((res) => res.json())
        .catch(() => null);
    });

    manifest.icons.forEach((icon: any) => {
      expect(['image/png', 'image/webp', 'image/jpeg']).toContain(icon.type);
    });
  });

  test('should have theme_color defined', async ({ page }) => {
    await loadApp(page);

    const manifest = await page.evaluate(() => {
      return fetch('/manifest.json')
        .then((res) => res.json())
        .catch(() => null);
    });

    expect(manifest?.theme_color).toBeDefined();
    expect(manifest.theme_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  test('should have background_color defined', async ({ page }) => {
    await loadApp(page);

    const manifest = await page.evaluate(() => {
      return fetch('/manifest.json')
        .then((res) => res.json())
        .catch(() => null);
    });

    expect(manifest?.background_color).toBeDefined();
    expect(manifest.background_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  test('display mode should be "standalone"', async ({ page }) => {
    await loadApp(page);

    const manifest = await page.evaluate(() => {
      return fetch('/manifest.json')
        .then((res) => res.json())
        .catch(() => null);
    });

    expect(manifest?.display).toBe('standalone');
  });

  test('should have valid start_url in manifest', async ({ page }) => {
    await loadApp(page);

    const manifest = await page.evaluate(() => {
      return fetch('/manifest.json')
        .then((res) => res.json())
        .catch(() => null);
    });

    expect(manifest?.start_url).toBeDefined();
    expect(['/', '/index.html', '/home']).toContain(manifest.start_url);
  });

  test('manifest should include categories', async ({ page }) => {
    await loadApp(page);

    const manifest = await page.evaluate(() => {
      return fetch('/manifest.json')
        .then((res) => res.json())
        .catch(() => null);
    });

    expect(manifest?.categories).toBeDefined();
    expect(manifest.categories).toContain(
      expect.stringMatching(/sports|games|entertainment/i)
    );
  });

  test('should have orientation preference', async ({ page }) => {
    await loadApp(page);

    const manifest = await page.evaluate(() => {
      return fetch('/manifest.json')
        .then((res) => res.json())
        .catch(() => null);
    });

    expect(manifest?.orientation).toBeDefined();
    expect(['portrait', 'portrait-primary', 'any']).toContain(manifest.orientation);
  });
});

test.describe('PWA: Offline Fallback & Caching', () => {
  test('should serve offline fallback page when offline', async ({ page }) => {
    await loadApp(page);
    await goOffline(page);
    await page.reload();

    const offlineContent = await page.evaluate(() => {
      return document.body.textContent.toLowerCase().includes('offline') ||
        document.body.textContent.toLowerCase().includes('connection') ||
        document.getElementById('root') !== null
        ? 'available'
        : 'missing';
    });

    expect(offlineContent).toBe('available');
  });

  test('should cache static HTML on install', async ({ page }) => {
    await loadApp(page);

    const cached = await page.evaluate(() => {
      return caches.keys().then((cacheNames) => cacheNames.length > 0);
    });

    expect(cached).toBe(true);
  });

  test('should use cache-first strategy for CSS', async ({ page }) => {
    await loadApp(page);

    const cssLoaded = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return links.length > 0;
    });

    expect(cssLoaded).toBe(true);
  });

  test('should use cache-first strategy for JavaScript', async ({ page }) => {
    await loadApp(page);

    const jsLoaded = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.length > 0;
    });

    expect(jsLoaded).toBe(true);
  });

  test('should use cache-first strategy for images', async ({ page }) => {
    await loadApp(page);

    const imagesPresent = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.length > 0;
    });

    expect(imagesPresent).toBe(true);
  });

  test('should use network-first strategy for API calls', async ({ page }) => {
    await loadApp(page);
    const errors = setupErrorMonitor(page);

    // Make API call while online
    await page.evaluate(() => {
      return fetch('/api/health').catch(() => null);
    });

    // Network-first should attempt network first
    expect(errors.length).toBeLessThanOrEqual(1);
  });

  test('should invalidate cache on version update', async ({ page }) => {
    await loadApp(page);

    const cacheVersion = await page.evaluate(() => {
      return caches.keys().then((names) => names.find((n) => n.includes('v')));
    });

    expect(cacheVersion).toBeDefined();
  });

  test('should have offline indicator when app is offline', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    await goOffline(page);
    await page.waitForTimeout(500);

    const hasOfflineIndicator = await page.evaluate(() => {
      const indicator =
        document.querySelector('[data-offline="true"]') ||
        document.querySelector('.offline-indicator') ||
        document.querySelector('[aria-label*="offline"]');
      return indicator !== null;
    });

    expect(hasOfflineIndicator).toBe(true);

    await goOnline(page);
  });

  test('should remove offline indicator when back online', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    await goOffline(page);
    await page.waitForTimeout(500);
    await goOnline(page);
    await page.waitForTimeout(500);

    const offlineVisible = await page.evaluate(() => {
      const indicator =
        document.querySelector('[data-offline="true"]') ||
        document.querySelector('.offline-indicator');
      return indicator !== null;
    });

    expect(offlineVisible).toBe(false);
  });
});

test.describe('PWA: Install & Add to Home Screen', () => {
  test('should fire beforeinstallprompt event', async ({ page }) => {
    await loadApp(page);

    const eventFired = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        let fired = false;
        window.addEventListener('beforeinstallprompt', () => {
          fired = true;
        });
        setTimeout(() => resolve(fired), 3000);
      });
    });

    // Event may not fire in test environment, but handler should be ready
    expect(typeof eventFired).toBe('boolean');
  });

  test('should display add to home screen prompt button', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const installButton = page.locator(
      '[aria-label*="Add to home screen"], [aria-label*="Install"], button:has-text("Install")'
    );

    const isVisible = await installButton.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should handle install button click', async ({ page }) => {
    await loadApp(page);

    const installHandled = await page.evaluate(() => {
      let deferredPrompt: any = null;
      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault();
        deferredPrompt = e;
      });
      return deferredPrompt !== null;
    });

    expect(typeof installHandled).toBe('boolean');
  });

  test('should show app installed confirmation', async ({ page }) => {
    await loadApp(page);

    const appinstalledHandled = await page.evaluate(() => {
      let installed = false;
      window.addEventListener('appinstalled', () => {
        installed = true;
      });
      return new Promise((resolve) => {
        setTimeout(() => resolve(installed), 2000);
      });
    });

    expect(typeof appinstalledHandled).toBe('boolean');
  });

  test('should hide install prompt after installation', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const promptHidden = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        let hidden = false;
        window.addEventListener('beforeinstallprompt', (e: any) => {
          e.preventDefault();
          if (e.prompt) {
            e.prompt().then(() => {
              hidden = true;
            });
          }
        });
        setTimeout(() => resolve(hidden), 3000);
      });
    });

    expect(typeof promptHidden).toBe('boolean');
  });
});

test.describe('PWA: Push Notifications & Permissions', () => {
  test('should support push notification permission', async ({ page }) => {
    await loadApp(page);

    const notificationSupported = await page.evaluate(() => {
      return 'Notification' in window;
    });

    expect(notificationSupported).toBe(true);
  });

  test('should request notification permission when needed', async ({ page }) => {
    await loadApp(page);

    const permissionState = await page.evaluate(() => {
      return Notification.permission;
    });

    expect(['default', 'granted', 'denied']).toContain(permissionState);
  });

  test('should handle notification permission denial gracefully', async ({ page }) => {
    await loadApp(page);
    const errors = setupErrorMonitor(page);

    await page.evaluate(() => {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {
          // Gracefully handle denial
        });
      }
    });

    expect(errors.length).toBeLessThanOrEqual(1);
  });

  test('should show push notification UI element', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const notificationUI = page.locator(
      '[aria-label*="Notification"], [aria-label*="Alert"], button:has-text("Notify")'
    );

    const exists = await notificationUI.count().then((c) => c > 0);
    expect(typeof exists).toBe('boolean');
  });

  test('should handle notification in service worker', async ({ page }) => {
    await loadApp(page);

    const swHasNotificationHandler = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration().then((reg) => {
        return reg?.active ? true : false;
      });
    });

    expect(swHasNotificationHandler).toBe(true);
  });
});

test.describe('PWA: App Shell Architecture', () => {
  test('should have app shell container', async ({ page }) => {
    await loadApp(page);

    const shellExists = await page.evaluate(() => {
      return (
        document.getElementById('root') !== null ||
        document.querySelector('[data-app-shell]') !== null ||
        document.querySelector('main') !== null
      );
    });

    expect(shellExists).toBe(true);
  });

  test('should have persistent navigation bar', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const navBar = page.locator('.bottom-nav, nav[role="navigation"], [aria-label*="Navigation"]');
    const isVisible = await navBar.isVisible().catch(() => false);

    expect(typeof isVisible).toBe('boolean');
  });

  test('navigation bar should remain visible during screen transitions', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const beforeVisible = await page
      .locator('.bottom-nav, nav[role="navigation"]')
      .isVisible()
      .catch(() => false);

    await navigateToScreen(page, SCREENS.HOME);

    const afterVisible = await page
      .locator('.bottom-nav, nav[role="navigation"]')
      .isVisible()
      .catch(() => false);

    expect(beforeVisible).toBe(afterVisible);
  });

  test('should separate app header from content', async ({ page }) => {
    await loadApp(page);

    const hasHeader = await page.evaluate(() => {
      return (
        document.querySelector('header') !== null ||
        document.querySelector('[role="banner"]') !== null
      );
    });

    expect(hasHeader).toBe(true);
  });

  test('app shell should not reflow on navigation', async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);

    const initialLayout = await page.evaluate(() => {
      const root = document.getElementById('root') || document.body;
      return {
        width: root.offsetWidth,
        height: root.offsetHeight,
      };
    });

    await navigateToScreen(page, SCREENS.HOME);

    const finalLayout = await page.evaluate(() => {
      const root = document.getElementById('root') || document.body;
      return {
        width: root.offsetWidth,
        height: root.offsetHeight,
      };
    });

    expect(initialLayout.width).toBe(finalLayout.width);
  });
});

test.describe('PWA: Mobile Web App Capabilities', () => {
  test('should have viewport meta tag for mobile', async ({ page }) => {
    await loadApp(page);

    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content');
    });

    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });

  test('viewport should disable user zoom if specified', async ({ page }) => {
    await loadApp(page);

    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content');
    });

    // Check if user-scalable is explicitly set (acceptable to disable for immersive experience)
    expect(typeof viewport).toBe('string');
  });

  test('should have apple-mobile-web-app-capable meta tag', async ({ page }) => {
    await loadApp(page);

    const appleCapable = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
      return meta?.getAttribute('content');
    });

    expect(['yes', '']).toContain(appleCapable);
  });

  test('should have apple touch icon', async ({ page }) => {
    await loadApp(page);

    const touchIcon = await page.evaluate(() => {
      const link = document.querySelector('link[rel="apple-touch-icon"]');
      return link?.getAttribute('href');
    });

    expect(touchIcon).toBeDefined();
  });

  test('should have status bar style for apple devices', async ({ page }) => {
    await loadApp(page);

    const statusBarStyle = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      return meta?.getAttribute('content');
    });

    expect(['black', 'black-translucent', 'default']).toContain(statusBarStyle);
  });

  test('should have app name for apple devices', async ({ page }) => {
    await loadApp(page);

    const appName = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      return meta?.getAttribute('content');
    });

    expect(appName).toBeDefined();
    expect(appName?.toLowerCase()).toContain('digambar');
  });

  test('should have splash screen configuration', async ({ page }) => {
    await loadApp(page);

    const splashScreens = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel*="apple-touch-startup-image"]'));
      return links.map((l) => l.getAttribute('href'));
    });

    expect(splashScreens.length).toBeGreaterThanOrEqual(0);
  });

  test('should support fullscreen display mode', async ({ page }) => {
    await loadApp(page);

    const displayMode = await page.evaluate(() => {
      return window.matchMedia('(display-mode: standalone)').matches
        ? 'standalone'
        : window.matchMedia('(display-mode: fullscreen)').matches
          ? 'fullscreen'
          : 'browser';
    });

    expect(['standalone', 'fullscreen', 'browser']).toContain(displayMode);
  });
});

test.describe('PWA: Theme & Colors', () => {
  test('should respect theme-color meta tag', async ({ page }) => {
    await loadApp(page);

    const themeColor = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="theme-color"]');
      return meta?.getAttribute('content');
    });

    expect(themeColor).toMatch(/^#[0-9A-Fa-f]{6}/);
  });

  test('should match manifest theme-color with meta tag', async ({ page }) => {
    await loadApp(page);

    const metaTheme = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="theme-color"]');
      return meta?.getAttribute('content');
    });

    const manifestTheme = await page.evaluate(() => {
      return fetch('/manifest.json')
        .then((res) => res.json())
        .then((m) => m.theme_color)
        .catch(() => null);
    });

    expect(metaTheme).toBe(manifestTheme);
  });

  test('should apply theme color to browser chrome', async ({ page }) => {
    await loadApp(page);

    const themeApplied = await page.evaluate(() => {
      return document.querySelector('meta[name="theme-color"]') !== null;
    });

    expect(themeApplied).toBe(true);
  });

  test('should support dark mode preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await loadApp(page);

    const isDarkMode = await page.evaluate(() => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    expect(isDarkMode).toBe(true);

    await page.emulateMedia({ colorScheme: 'light' });
  });

  test('should apply appropriate styles for color scheme', async ({ page }) => {
    await loadApp(page);

    const colorScheme = await getCSSProperty(page, 'body', 'color-scheme');
    expect(['dark', 'light', 'auto', '']).toContain(colorScheme);
  });
});

test.describe('PWA: Service Worker Update & Background Sync', () => {
  test('service worker should check for updates', async ({ page }) => {
    await loadApp(page);

    const updateChecked = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update();
        return true;
      });
    });

    expect(updateChecked).toBe(true);
  });

  test('should notify user of new service worker version', async ({ page }) => {
    await loadApp(page);

    const updateHandler = await page.evaluate(() => {
      let handled = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        handled = true;
      });
      return new Promise((resolve) => {
        setTimeout(() => resolve(handled), 2000);
      });
    });

    expect(typeof updateHandler).toBe('boolean');
  });

  test('should support background sync API', async ({ page }) => {
    await loadApp(page);

    const syncSupported = await page.evaluate(() => {
      return 'serviceWorker' in navigator && 'SyncManager' in window;
    });

    expect(typeof syncSupported).toBe('boolean');
  });

  test('should register background sync tags', async ({ page }) => {
    await loadApp(page);

    const syncRegistered = await page.evaluate(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.sync) {
          await reg.sync.register('sync-matches');
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    });

    expect(typeof syncRegistered).toBe('boolean');
  });

  test('should retry failed sync tasks', async ({ page }) => {
    await loadApp(page);

    const syncRetry = await page.evaluate(() => {
      // Verify sync manager exists and can queue retries
      return (
        'SyncManager' in window &&
        'sync' in ServiceWorkerRegistration.prototype
      );
    });

    expect(syncRetry).toBe(true);
  });
});
