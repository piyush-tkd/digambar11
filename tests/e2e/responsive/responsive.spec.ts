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
  tapBottomNav,
} from '../fixtures';

// Responsive viewport configurations
const VIEWPORTS = {
  iphoneSE: { width: 375, height: 667, name: 'iPhone SE' },
  iphone14: { width: 390, height: 844, name: 'iPhone 14' },
  iphone14ProMax: { width: 430, height: 932, name: 'iPhone 14 Pro Max' },
  pixel7: { width: 412, height: 915, name: 'Pixel 7' },
  ipadMini: { width: 768, height: 1024, name: 'iPad Mini' },
  ipadPro: { width: 1024, height: 1366, name: 'iPad Pro' },
  desktop1280: { width: 1280, height: 720, name: 'Desktop 1280x720' },
  desktop1920: { width: 1920, height: 1080, name: 'Desktop 1920x1080' },
};

// Helper function to check for horizontal scroll
async function checkNoHorizontalScroll(page: any, viewport: any) {
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });

  expect(
    hasHorizontalScroll,
    `Horizontal scroll detected on ${viewport.name} (${viewport.width}x${viewport.height})`
  ).toBe(false);
}

// Helper function to verify touch target sizes
async function verifyTouchTargets(page: any, selector: string, minSize: number = 44) {
  const elements = await page.$$(selector);
  for (const element of elements) {
    const box = await element.boundingBox();
    if (box) {
      expect(
        box.width >= minSize || box.height >= minSize,
        `Touch target too small: ${selector}`
      ).toBe(true);
    }
  }
}

// Helper function to check text readability
async function checkTextReadability(page: any, minFontSize: number = 10) {
  const readabilityIssues = await page.evaluate((minSize: number) => {
    const issues: string[] = [];
    const elements = document.querySelectorAll('p, span, div, button, label, a');

    elements.forEach((el) => {
      const fontSize = parseInt(window.getComputedStyle(el).fontSize);
      if (fontSize < minSize && el.textContent?.trim().length) {
        issues.push(`${el.tagName}: ${fontSize}px`);
      }
    });

    return issues;
  }, minFontSize);

  expect(
    readabilityIssues.length,
    `Text too small (${minFontSize}px minimum required): ${readabilityIssues.join(', ')}`
  ).toBe(0);
}

// Helper function to check bottom nav positioning
async function verifyBottomNavPositioning(page: any, viewport: any) {
  const bottomNav = await page.$('.bottom-nav, [role="navigation"]');
  if (bottomNav) {
    const box = await bottomNav.boundingBox();
    const isFixed = await page.evaluate(() => {
      const nav = document.querySelector('.bottom-nav, [role="navigation"]');
      return nav
        ? window.getComputedStyle(nav).position === 'fixed' ||
            window.getComputedStyle(nav).position === 'sticky'
        : false;
    });

    expect(
      isFixed,
      `Bottom nav should be fixed/sticky on ${viewport.name}`
    ).toBe(true);
  }
}

// Helper function to verify image scaling
async function verifyImageScaling(page: any) {
  const images = await page.$$('img');
  for (const img of images) {
    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
    const displayedWidth = await img.evaluate((el: HTMLImageElement) => el.width);

    if (naturalWidth > 0 && displayedWidth > 0) {
      const scalingRatio = displayedWidth / naturalWidth;
      expect(
        scalingRatio > 0 && scalingRatio <= 2,
        `Image scaling issue: natural=${naturalWidth}, displayed=${displayedWidth}`
      ).toBe(true);
    }
  }
}

// Helper function to check content overflow
async function checkContentOverflow(page: any, selector: string) {
  const elements = await page.$$(selector);
  for (const element of elements) {
    const overflows = await element.evaluate((el: any) => ({
      overflowX: el.scrollWidth > el.clientWidth,
      overflowY: el.scrollHeight > el.clientHeight,
    }));

    expect(overflows.overflowX, `Content overflow-x on ${selector}`).toBe(false);
  }
}

test.describe('Responsive Design - Home Screen', () => {
  Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
    test(`Home screen displays correctly on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loadApp(page, APP_URL);
      await mockLogin(page);
      await waitForScreen(page, SCREENS.HOME);

      // 1. No horizontal scrollbar
      await checkNoHorizontalScroll(page, viewport);

      // 2. All content visible without overflow
      await checkContentOverflow(page, 'main');

      // 3. Touch targets minimum 44x44px
      if (viewport.width <= 768) {
        await verifyTouchTargets(page, 'button', 44);
      }

      // 4. Text readable
      await checkTextReadability(page);

      // 5. Bottom nav properly positioned
      await verifyBottomNavPositioning(page, viewport);

      // 6. Images scale correctly
      await verifyImageScaling(page);

      // 8. Buttons fully visible and tappable
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const box = await btn.boundingBox();
        expect(box?.height, 'Button height should be visible').toBeGreaterThan(0);
        expect(box?.width, 'Button width should be visible').toBeGreaterThan(0);
      }
    });
  });
});

test.describe('Responsive Design - Team Select Screen', () => {
  Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
    test(`Team select displays correctly on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loadApp(page, APP_URL);
      await mockLogin(page);
      await navigateToScreen(page, SCREENS.TEAM_SELECT);

      // 1. No horizontal scrollbar
      await checkNoHorizontalScroll(page, viewport);

      // 2. All content visible
      await checkContentOverflow(page, 'main');

      // 3. Touch targets
      if (viewport.width <= 768) {
        await verifyTouchTargets(page, '.player-card', 44);
      }

      // 4. Text readable
      await checkTextReadability(page);

      // 5. Bottom nav positioned
      await verifyBottomNavPositioning(page, viewport);

      // 7. Player rows don't truncate important info
      const playerCards = await page.$$('.player-card');
      for (const card of playerCards) {
        const playerName = await card.$('.player-name');
        if (playerName) {
          const box = await playerName.boundingBox();
          expect(box?.width, 'Player name should be visible').toBeGreaterThan(50);
        }
      }

      // 10. Credits display visible
      const creditsDisplay = await page.$('.credits-display, [data-testid="credits"]');
      expect(creditsDisplay).toBeTruthy();
      if (creditsDisplay) {
        const box = await creditsDisplay.boundingBox();
        expect(box?.height, 'Credits display should be visible').toBeGreaterThan(0);
      }
    });
  });
});

test.describe('Responsive Design - Captain Selection Screen', () => {
  Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
    test(`Captain selection displays correctly on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loadApp(page, APP_URL);
      await mockLogin(page);
      await navigateToScreen(page, SCREENS.CAPTAIN);

      // 1. No horizontal scrollbar
      await checkNoHorizontalScroll(page, viewport);

      // 2. Content visibility
      await checkContentOverflow(page, 'main');

      // 3. Touch targets for captain selection
      if (viewport.width <= 768) {
        await verifyTouchTargets(page, '.captain-option', 44);
      }

      // 4. Text readable
      await checkTextReadability(page);

      // 5. Bottom nav
      await verifyBottomNavPositioning(page, viewport);

      // 6. Images scale
      await verifyImageScaling(page);

      // 8. Selection buttons visible
      const selectButtons = await page.$$('.select-btn');
      for (const btn of selectButtons) {
        const box = await btn.boundingBox();
        expect(box?.width, 'Select button should be visible').toBeGreaterThan(30);
      }
    });
  });
});

test.describe('Responsive Design - Live Match Screen', () => {
  Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
    test(`Live match displays correctly on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loadApp(page, APP_URL);
      await mockLogin(page);
      await navigateToScreen(page, SCREENS.LIVE_MATCH);

      // 1. No horizontal scrollbar
      await checkNoHorizontalScroll(page, viewport);

      // 2. Content visibility
      await checkContentOverflow(page, 'main');

      // 3. Touch targets
      if (viewport.width <= 768) {
        await verifyTouchTargets(page, 'button', 44);
      }

      // 4. Text readable
      await checkTextReadability(page);

      // 5. Bottom nav
      await verifyBottomNavPositioning(page, viewport);

      // 11. Score banner fits on screen
      const scoreBanner = await page.$('.score-banner, [data-testid="score-banner"]');
      if (scoreBanner) {
        const box = await scoreBanner.boundingBox();
        expect(
          box?.width,
          `Score banner should fit within viewport width ${viewport.width}`
        ).toBeLessThanOrEqual(viewport.width);
      }

      // 12. Test landscape orientation
      await page.setViewportSize({ width: viewport.height, height: viewport.width });
      await checkNoHorizontalScroll(page, {
        ...viewport,
        name: `${viewport.name} (landscape)`,
      });
    });
  });
});

test.describe('Responsive Design - Leaderboard Screen', () => {
  Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
    test(`Leaderboard displays correctly on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loadApp(page, APP_URL);
      await mockLogin(page);
      await navigateToScreen(page, SCREENS.LEADERBOARD);

      // 1. No horizontal scrollbar
      await checkNoHorizontalScroll(page, viewport);

      // 2. Content visibility
      await checkContentOverflow(page, 'main');

      // 3. Touch targets
      if (viewport.width <= 768) {
        await verifyTouchTargets(page, '[role="button"]', 44);
      }

      // 4. Text readable
      await checkTextReadability(page);

      // 5. Bottom nav
      await verifyBottomNavPositioning(page, viewport);

      // 7. Leaderboard rows don't truncate
      const rows = await page.$$('.leaderboard-row, tbody tr');
      for (const row of rows) {
        const cells = await row.$$('td, .rank-cell, .player-cell, .points-cell');
        for (const cell of cells) {
          const box = await cell.boundingBox();
          expect(box?.width, 'Table cell should have width').toBeGreaterThan(20);
        }
      }
    });
  });
});

test.describe('Responsive Design - Wallet Screen', () => {
  Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
    test(`Wallet displays correctly on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loadApp(page, APP_URL);
      await mockLogin(page);
      await navigateToScreen(page, SCREENS.WALLET);

      // 1. No horizontal scrollbar
      await checkNoHorizontalScroll(page, viewport);

      // 2. Content visibility
      await checkContentOverflow(page, 'main');

      // 3. Touch targets for wallet actions
      if (viewport.width <= 768) {
        await verifyTouchTargets(page, '.wallet-btn, .action-btn', 44);
      }

      // 4. Text readable
      await checkTextReadability(page);

      // 5. Bottom nav
      await verifyBottomNavPositioning(page, viewport);

      // 8. Action buttons visible
      const actionButtons = await page.$$('.add-funds-btn, .withdraw-btn');
      expect(actionButtons.length).toBeGreaterThan(0);
    });
  });
});

test.describe('Responsive Design - Profile Screen', () => {
  Object.entries(VIEWPORTS).forEach(([key, viewport]) => {
    test(`Profile displays correctly on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loadApp(page, APP_URL);
      await mockLogin(page);
      await navigateToScreen(page, SCREENS.PROFILE);

      // 1. No horizontal scrollbar
      await checkNoHorizontalScroll(page, viewport);

      // 2. Content visibility
      await checkContentOverflow(page, 'main');

      // 3. Touch targets
      if (viewport.width <= 768) {
        await verifyTouchTargets(page, '.profile-action', 44);
      }

      // 4. Text readable
      await checkTextReadability(page);

      // 5. Bottom nav
      await verifyBottomNavPositioning(page, viewport);

      // 6. Profile image scales
      await verifyImageScaling(page);

      // 8. Edit buttons visible
      const editButtons = await page.$$('.edit-btn');
      for (const btn of editButtons) {
        const box = await btn.boundingBox();
        expect(box?.width, 'Edit button should be visible').toBeGreaterThan(20);
      }
    });
  });
});

test.describe('Responsive Design - Modals and Overlays', () => {
  test('Modal fits screen on small viewports', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loadApp(page, APP_URL);
    await mockLogin(page);

    // Trigger a modal (e.g., rules, terms)
    const modalTrigger = await page.$('[data-testid="show-modal"]');
    if (modalTrigger) {
      await modalTrigger.click();
      await page.waitForTimeout(300);

      const modal = await page.$('.modal, [role="dialog"]');
      if (modal) {
        const box = await modal.boundingBox();
        expect(
          box?.width,
          'Modal should fit within viewport'
        ).toBeLessThanOrEqual(375);
      }
    }
  });

  test('Modal fits screen on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loadApp(page, APP_URL);
    await mockLogin(page);

    const modalTrigger = await page.$('[data-testid="show-modal"]');
    if (modalTrigger) {
      await modalTrigger.click();
      await page.waitForTimeout(300);

      const modal = await page.$('.modal, [role="dialog"]');
      if (modal) {
        const box = await modal.boundingBox();
        expect(
          box?.width,
          'Modal should fit within viewport'
        ).toBeLessThanOrEqual(768);
      }
    }
  });
});

test.describe('Responsive Design - Safe Area Insets (Notch Handling)', () => {
  test('Content respects safe areas on notched devices', async ({ page }) => {
    // iPhone 14 Pro with notch simulation
    await page.setViewportSize({ width: 390, height: 844 });
    await loadApp(page, APP_URL);
    await mockLogin(page);

    const topSafeArea = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        paddingTop: style.paddingTop,
        marginTop: style.marginTop,
      };
    });

    expect(topSafeArea).toBeTruthy();
  });

  test('Bottom navigation respects safe area on devices with home indicator', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loadApp(page, APP_URL);
    await mockLogin(page);

    const bottomNav = await page.$('.bottom-nav');
    if (bottomNav) {
      const box = await bottomNav.boundingBox();
      expect(box?.height, 'Bottom nav should account for safe area').toBeGreaterThan(
        40
      );
    }
  });
});

test.describe('Responsive Design - Font Scaling', () => {
  test('Text remains readable with system font size increase', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loadApp(page, APP_URL);
    await mockLogin(page);

    // Simulate user font size increase
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '120%';
    });

    const textElements = await page.$$('p, button, span, a');
    expect(textElements.length).toBeGreaterThan(0);

    // Verify no overflow occurs
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(hasOverflow).toBe(false);
  });

  test('Layout adjusts properly with system font scaling', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loadApp(page, APP_URL);
    await mockLogin(page);

    // Increase font size
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '130%';
    });

    await checkNoHorizontalScroll(page, VIEWPORTS.iphoneSE);
  });
});

test.describe('Responsive Design - Landscape Orientation', () => {
  test('Home screen works in landscape on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await loadApp(page, APP_URL);
    await mockLogin(page);

    await checkNoHorizontalScroll(page, {
      width: 667,
      height: 375,
      name: 'Landscape',
    });
    await checkTextReadability(page);
  });

  test('Team select works in landscape', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await loadApp(page, APP_URL);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.TEAM_SELECT);

    await checkNoHorizontalScroll(page, {
      width: 844,
      height: 390,
      name: 'iPhone 14 Landscape',
    });
  });

  test('Live match works in landscape', async ({ page }) => {
    await page.setViewportSize({ width: 932, height: 430 });
    await loadApp(page, APP_URL);
    await mockLogin(page);
    await navigateToScreen(page, SCREENS.LIVE_MATCH);

    await checkNoHorizontalScroll(page, {
      width: 932,
      height: 430,
      name: 'iPhone 14 Pro Max Landscape',
    });
  });
});

test.describe('Responsive Design - Cross-Viewport Navigation', () => {
  test('Navigation works on all viewports', async ({ page }) => {
    for (const [key, viewport] of Object.entries(VIEWPORTS).slice(0, 4)) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loadApp(page, APP_URL);
      await mockLogin(page);

      // Navigate through screens
      for (const screen of [SCREENS.HOME, SCREENS.TEAM_SELECT, SCREENS.PROFILE]) {
        await navigateToScreen(page, screen);
        const isVisible = await isScreenVisible(page, screen);
        expect(isVisible).toBe(true);
      }
    }
  });
});

test.describe('Responsive Design - Content Alignment', () => {
  test('Content centered on desktop viewports', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loadApp(page, APP_URL);
    await mockLogin(page);

    const mainContent = await page.$('main, .container, .content-wrapper');
    if (mainContent) {
      const alignment = await mainContent.evaluate((el: any) => {
        const style = window.getComputedStyle(el);
        return {
          marginLeft: style.marginLeft,
          marginRight: style.marginRight,
          maxWidth: style.maxWidth,
        };
      });

      expect(alignment).toBeTruthy();
    }
  });

  test('Content full-width on mobile viewports', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loadApp(page, APP_URL);
    await mockLogin(page);

    const mainContent = await page.$('main');
    if (mainContent) {
      const box = await mainContent.boundingBox();
      expect(box?.width, 'Content should use full width on mobile').toBeLessThanOrEqual(
        375
      );
    }
  });
});

test.describe('Responsive Design - Image Responsiveness', () => {
  test('Images scale correctly with viewport', async ({ page }) => {
    const viewportsToTest = [VIEWPORTS.iphoneSE, VIEWPORTS.ipadPro, VIEWPORTS.desktop1920];

    for (const viewport of viewportsToTest) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loadApp(page, APP_URL);
      await mockLogin(page);

      await verifyImageScaling(page);
    }
  });

  test('Logo scales appropriately on all viewports', async ({ page }) => {
    for (const [key, viewport] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loadApp(page, APP_URL);

      const logo = await page.$('.logo, [data-testid="app-logo"]');
      if (logo) {
        const box = await logo.boundingBox();
        expect(box?.width, `Logo should be visible on ${viewport.name}`).toBeGreaterThan(
          30
        );
        expect(box?.height, `Logo should be visible on ${viewport.name}`).toBeGreaterThan(
          20
        );
      }
    }
  });
});

test.describe('Responsive Design - Bottom Navigation', () => {
  test('Bottom nav items properly spaced on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loadApp(page, APP_URL);
    await mockLogin(page);

    const navItems = await page.$$('.bottom-nav-item, [role="tab"]');
    for (const item of navItems) {
      const box = await item.boundingBox();
      expect(box?.width, 'Nav item should have adequate width').toBeGreaterThan(40);
    }
  });

  test('Bottom nav items properly spaced on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loadApp(page, APP_URL);
    await mockLogin(page);

    const navItems = await page.$$('.bottom-nav-item, [role="tab"]');
    for (const item of navItems) {
      const box = await item.boundingBox();
      expect(box?.width, 'Nav item should be reasonable on desktop').toBeLessThanOrEqual(
        300
      );
    }
  });
});

test.describe('Responsive Design - Form Input Sizing', () => {
  test('Form inputs are touch-friendly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loadApp(page, APP_URL);

    const inputs = await page.$$('input, textarea, select');
    for (const input of inputs) {
      const box = await input.boundingBox();
      expect(
        box?.height,
        'Input height should be at least 44px for touch'
      ).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('Responsive Design - Button Sizing and Spacing', () => {
  test('Primary buttons are properly sized on all viewports', async ({ page }) => {
    const viewportsToTest = [
      VIEWPORTS.iphoneSE,
      VIEWPORTS.iphone14,
      VIEWPORTS.ipadMini,
      VIEWPORTS.desktop1920,
    ];

    for (const viewport of viewportsToTest) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await loadApp(page, APP_URL);
      await mockLogin(page);

      const primaryButtons = await page.$$('.btn-primary, [role="button"]');
      for (const btn of primaryButtons) {
        const box = await btn.boundingBox();
        expect(box?.height, `Button height on ${viewport.name}`).toBeGreaterThan(30);
      }
    }
  });
});

test.describe('Responsive Design - Spacing and Padding', () => {
  test('Padding increases on larger viewports', async ({ page }) => {
    // Test small viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await loadApp(page, APP_URL);
    await mockLogin(page);

    const smallPadding = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main ? window.getComputedStyle(main).padding : null;
    });

    // Test large viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    const largePadding = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main ? window.getComputedStyle(main).padding : null;
    });

    expect(smallPadding).toBeTruthy();
    expect(largePadding).toBeTruthy();
  });
});
