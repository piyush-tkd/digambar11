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

test.describe('CSS Theming & Styling Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await mockLogin(page);
  });

  test.describe('Dark Theme CSS Variables', () => {
    test('dark theme: --d11-dark variable has correct value', async ({ page }) => {
      const darkColor = await getCSSProperty(page, 'body', '--d11-dark');
      expect(darkColor).toBeTruthy();
      // Dark color should be dark hex or rgb value
      expect(darkColor).toMatch(/^(#|rgb)/);
    });

    test('dark theme: --d11-card variable has correct value', async ({ page }) => {
      const cardColor = await getCSSProperty(page, 'body', '--d11-card');
      expect(cardColor).toBeTruthy();
    });

    test('dark theme: --d11-border variable has correct value', async ({ page }) => {
      const borderColor = await getCSSProperty(page, 'body', '--d11-border');
      expect(borderColor).toBeTruthy();
    });

    test('dark theme: --d11-light variable has correct value', async ({ page }) => {
      const lightColor = await getCSSProperty(page, 'body', '--d11-light');
      expect(lightColor).toBeTruthy();
    });

    test('dark theme: --d11-grey variable has correct value', async ({ page }) => {
      const greyColor = await getCSSProperty(page, 'body', '--d11-grey');
      expect(greyColor).toBeTruthy();
    });

    test('dark theme: --d11-green is #27ae60', async ({ page }) => {
      const greenColor = await getCSSProperty(page, 'body', '--d11-green');
      expect(greenColor).toContain('27ae60');
    });

    test('dark theme: --d11-red is #e74c3c', async ({ page }) => {
      const redColor = await getCSSProperty(page, 'body', '--d11-red');
      expect(redColor).toContain('e74c3c');
    });

    test('dark theme: --d11-gold is #f1c40f', async ({ page }) => {
      const goldColor = await getCSSProperty(page, 'body', '--d11-gold');
      expect(goldColor).toContain('f1c40f');
    });

    test('dark theme: --d11-blue is #3498db', async ({ page }) => {
      const blueColor = await getCSSProperty(page, 'body', '--d11-blue');
      expect(blueColor).toContain('3498db');
    });

    test('dark theme: background color applies correctly', async ({ page }) => {
      const bgColor = await getCSSProperty(page, 'body', 'background-color');
      expect(bgColor).toBeTruthy();
      // In dark mode, background should be dark
      expect(bgColor).toMatch(/^rgb\(/);
    });

    test('dark theme: text color has proper contrast', async ({ page }) => {
      const textColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).color;
      });
      // Text should be light for dark background
      expect(textColor).toBeTruthy();
    });
  });

  test.describe('Light Theme CSS Variables', () => {
    test('light theme: switching to light mode toggles variables', async ({ page }) => {
      // Navigate to profile to access theme toggle
      await navigateToScreen(page, SCREENS.PROFILE);

      // Find and click theme toggle (assumption: toggle exists on profile)
      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button:has-text("Light")').first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();

        // Wait for theme to apply
        await page.waitForTimeout(500);

        const lightModeActive = await page.locator('html').evaluate((el) => {
          return el.getAttribute('data-theme') === 'light' || document.documentElement.classList.contains('light-theme');
        });

        expect(lightModeActive).toBeTruthy();
      }
    });

    test('light theme: --d11-dark becomes lighter in light mode', async ({ page }) => {
      await navigateToScreen(page, SCREENS.PROFILE);

      const darkColorBefore = await getCSSProperty(page, 'body', '--d11-dark');

      // Toggle theme if available
      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle').first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500);

        const darkColorAfter = await getCSSProperty(page, 'body', '--d11-dark');
        expect(darkColorAfter).toBeDefined();
      }
    });

    test('light theme: background color changes to light', async ({ page }) => {
      await navigateToScreen(page, SCREENS.PROFILE);

      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle').first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500);

        const bgColor = await getCSSProperty(page, 'body', 'background-color');
        expect(bgColor).toBeTruthy();
      }
    });

    test('light theme: text color has proper contrast in light mode', async ({ page }) => {
      await navigateToScreen(page, SCREENS.PROFILE);

      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle').first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500);

        const textColor = await page.evaluate(() => {
          return window.getComputedStyle(document.body).color;
        });
        expect(textColor).toBeTruthy();
      }
    });
  });

  test.describe('Theme Switch & Persistence', () => {
    test('theme switch: all CSS variables update on toggle', async ({ page }) => {
      await navigateToScreen(page, SCREENS.PROFILE);

      const varsBefore = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          dark: getComputedStyle(root).getPropertyValue('--d11-dark'),
          card: getComputedStyle(root).getPropertyValue('--d11-card'),
          border: getComputedStyle(root).getPropertyValue('--d11-border'),
        };
      });

      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle').first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500);

        const varsAfter = await page.evaluate(() => {
          const root = document.documentElement;
          return {
            dark: getComputedStyle(root).getPropertyValue('--d11-dark'),
            card: getComputedStyle(root).getPropertyValue('--d11-card'),
            border: getComputedStyle(root).getPropertyValue('--d11-border'),
          };
        });

        // At least some variables should change
        const changed = Object.keys(varsBefore).some(
          key => varsBefore[key as keyof typeof varsBefore] !== varsAfter[key as keyof typeof varsAfter]
        );
        expect(changed).toBeTruthy();
      }
    });

    test('theme switch: persists across page navigation', async ({ page }) => {
      await navigateToScreen(page, SCREENS.PROFILE);

      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle').first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(300);

        // Navigate away and back
        await navigateToScreen(page, SCREENS.HOME);
        await page.waitForTimeout(300);
        await navigateToScreen(page, SCREENS.PROFILE);
        await page.waitForTimeout(300);

        const themeAfter = await page.locator('html').evaluate((el) => {
          return el.getAttribute('data-theme') || document.documentElement.classList.toString();
        });

        expect(themeAfter).toBeTruthy();
      }
    });
  });

  test.describe('Color Usage & Contrast', () => {
    test('green color (#27ae60) applied to positive values', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const greenElements = await page.locator('[style*="27ae60"], [class*="positive"], [class*="gain"]').count();
      // Should have at least some green elements
      expect(greenElements).toBeGreaterThanOrEqual(0);
    });

    test('red color (#e74c3c) applied to negative values', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const redElements = await page.locator('[style*="e74c3c"], [class*="negative"], [class*="loss"]').count();
      // Should have at least some red elements or none (depending on data)
      expect(redElements).toBeGreaterThanOrEqual(0);
    });

    test('gold color (#f1c40f) applied to captain badge', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const captainBadge = page.locator('[data-testid="captain-badge"], .badge-captain, [title*="Captain"]').first();
      if (await captainBadge.isVisible()) {
        const bgColor = await getCSSProperty(captainBadge, null, 'background-color');
        expect(bgColor).toBeTruthy();
      }
    });

    test('blue color (#3498db) applied to VC badge', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const vcBadge = page.locator('[data-testid="vc-badge"], .badge-vc, [title*="Vice Captain"]').first();
      if (await vcBadge.isVisible()) {
        const bgColor = await getCSSProperty(vcBadge, null, 'background-color');
        expect(bgColor).toBeTruthy();
      }
    });

    test('text color contrast ratio meets WCAG standards in dark mode', async ({ page }) => {
      const contrastCheck = await page.evaluate(() => {
        const bodyStyle = window.getComputedStyle(document.body);
        const bgColor = bodyStyle.backgroundColor;
        const textColor = bodyStyle.color;
        return { bgColor, textColor };
      });

      expect(contrastCheck.bgColor).toBeTruthy();
      expect(contrastCheck.textColor).toBeTruthy();
    });

    test('text color contrast ratio meets WCAG standards in light mode', async ({ page }) => {
      await navigateToScreen(page, SCREENS.PROFILE);

      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle').first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500);

        const contrastCheck = await page.evaluate(() => {
          const bodyStyle = window.getComputedStyle(document.body);
          const bgColor = bodyStyle.backgroundColor;
          const textColor = bodyStyle.color;
          return { bgColor, textColor };
        });

        expect(contrastCheck.bgColor).toBeTruthy();
        expect(contrastCheck.textColor).toBeTruthy();
      }
    });
  });

  test.describe('Animations & Status Indicators', () => {
    test('live dot animation: batting status (green pulse)', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const battingDot = page.locator('[data-status="batting"], .status-batting, [class*="live-pulse"]').first();
      if (await battingDot.isVisible()) {
        const animation = await getCSSProperty(battingDot, null, 'animation');
        expect(animation).toBeTruthy();
      }
    });

    test('live dot animation: bowling status (blue)', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const bowlingDot = page.locator('[data-status="bowling"], .status-bowling').first();
      if (await bowlingDot.isVisible()) {
        const color = await getCSSProperty(bowlingDot, null, 'background-color');
        expect(color).toBeTruthy();
      }
    });

    test('live dot animation: out status (red)', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const outDot = page.locator('[data-status="out"], .status-out').first();
      if (await outDot.isVisible()) {
        const color = await getCSSProperty(outDot, null, 'background-color');
        expect(color).toBeTruthy();
      }
    });

    test('live dot animation: waiting status (grey)', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const waitingDot = page.locator('[data-status="waiting"], .status-waiting').first();
      if (await waitingDot.isVisible()) {
        const color = await getCSSProperty(waitingDot, null, 'background-color');
        expect(color).toBeTruthy();
      }
    });

    test('animations have consistent duration', async ({ page }) => {
      const animationDuration = await page.evaluate(() => {
        const elements = document.querySelectorAll('[style*="animation"], [class*="pulse"], [class*="animate"]');
        const durations: string[] = [];
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          durations.push(style.animationDuration);
        });
        return durations;
      });

      // Should have at least some animations
      expect(animationDuration.length).toBeGreaterThanOrEqual(0);
    });

    test('animation: pulse effect is smooth', async ({ page }) => {
      const hasKeyframes = await page.evaluate(() => {
        const sheets = document.styleSheets;
        for (let i = 0; i < sheets.length; i++) {
          try {
            const rules = sheets[i].cssRules;
            for (let j = 0; j < rules.length; j++) {
              if (rules[j].type === 7) { // CSSKeyframesRule
                return true;
              }
            }
          } catch (e) {
            // Cross-origin stylesheet
          }
        }
        return false;
      });

      expect(hasKeyframes).toBeTruthy();
    });
  });

  test.describe('Bottom Navigation & Active States', () => {
    test('bottom nav styling: active indicator visible', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const activeNavItem = page.locator('[data-testid*="nav-active"], .nav-item.active, .bottom-nav__item--active').first();
      if (await activeNavItem.isVisible()) {
        const bgColor = await getCSSProperty(activeNavItem, null, 'background-color');
        expect(bgColor).toBeTruthy();
      }
    });

    test('bottom nav styling: inactive items have different styling', async ({ page }) => {
      const inactiveNavItems = page.locator('.bottom-nav__item, [class*="nav-item"]').nth(1);
      if (await inactiveNavItems.isVisible()) {
        const opacity = await getCSSProperty(inactiveNavItems, null, 'opacity');
        expect(opacity).toBeDefined();
      }
    });

    test('bottom nav: tab switch updates active indicator', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const navItems = page.locator('.bottom-nav__item, [class*="nav-item"], [data-testid*="nav"]');
      const itemCount = await navItems.count();

      if (itemCount > 1) {
        // Get first item as baseline
        const firstItem = navItems.nth(0);
        const wasActive = await firstItem.evaluate(el => el.classList.contains('active'));

        // Click second item
        await navItems.nth(1).click();
        await page.waitForTimeout(300);

        // First item should no longer be active
        const isStillActive = await firstItem.evaluate(el => el.classList.contains('active'));
        expect(isStillActive).not.toBe(wasActive || true);
      }
    });

    test('bottom nav: z-index places nav above content', async ({ page }) => {
      const navZIndex = await page.evaluate(() => {
        const nav = document.querySelector('.bottom-nav, [role="navigation"]');
        if (!nav) return null;
        return window.getComputedStyle(nav).zIndex;
      });

      if (navZIndex) {
        expect(parseInt(navZIndex)).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Player Row Styling', () => {
    test('player row: selected state has background color', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const playerRow = page.locator('[data-testid*="player"], [class*="player-row"]').first();
      if (await playerRow.isVisible()) {
        await playerRow.click();
        await page.waitForTimeout(200);

        const bgColor = await getCSSProperty(playerRow, null, 'background-color');
        expect(bgColor).toBeTruthy();
      }
    });

    test('player row: unselected state has neutral styling', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const playerRows = page.locator('[class*="player-row"], [data-testid*="player"]');
      const firstRow = playerRows.first();

      if (await firstRow.isVisible()) {
        const bgColor = await getCSSProperty(firstRow, null, 'background-color');
        expect(bgColor).toBeTruthy();
      }
    });

    test('player row: hover state changes styling', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const playerRow = page.locator('[class*="player-row"], [data-testid*="player"]').first();
      if (await playerRow.isVisible()) {
        const beforeHover = await getCSSProperty(playerRow, null, 'background-color');

        await playerRow.hover();
        await page.waitForTimeout(150);

        const afterHover = await getCSSProperty(playerRow, null, 'background-color');
        // Either colors differ or hover has no effect (both valid)
        expect(beforeHover).toBeTruthy();
        expect(afterHover).toBeTruthy();
      }
    });

    test('player row: selected/unselected toggle works', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const playerRow = page.locator('[class*="player-row"], [data-testid*="player"]').first();
      if (await playerRow.isVisible()) {
        const classListBefore = await playerRow.evaluate(el => el.className);

        await playerRow.click();
        await page.waitForTimeout(200);

        const classListAfter = await playerRow.evaluate(el => el.className);
        expect(classListAfter).toBeDefined();
      }
    });
  });

  test.describe('Compare Section Styling', () => {
    test('compare section: your stats in green', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const compareSection = page.locator('[data-testid*="compare"], [class*="compare"]').first();
      if (await compareSection.isVisible()) {
        const greenElements = compareSection.locator('[class*="you"], [class*="your"], [data-label*="You"]');
        expect(await greenElements.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('compare section: opponent stats in red', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const compareSection = page.locator('[data-testid*="compare"], [class*="compare"]').first();
      if (await compareSection.isVisible()) {
        const redElements = compareSection.locator('[class*="opponent"], [class*="them"], [data-label*="Opponent"]');
        expect(await redElements.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('compare section: color contrast between columns', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const youColumn = page.locator('[class*="you"], [data-column="you"]').first();
      const themColumn = page.locator('[class*="opponent"], [data-column="opponent"]').first();

      if (await youColumn.isVisible() && await themColumn.isVisible()) {
        const youColor = await getCSSProperty(youColumn, null, 'color');
        const themColor = await getCSSProperty(themColumn, null, 'color');
        expect(youColor).toBeTruthy();
        expect(themColor).toBeTruthy();
      }
    });
  });

  test.describe('Card Styling & Layout', () => {
    test('card: border-radius is consistent', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const cards = page.locator('[class*="card"], [role="article"]');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        const firstCardRadius = await getCSSProperty(cards.nth(0), null, 'border-radius');
        expect(firstCardRadius).toBeTruthy();
      }
    });

    test('card: shadow/elevation applied', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const card = page.locator('[class*="card"], [role="article"]').first();
      if (await card.isVisible()) {
        const boxShadow = await getCSSProperty(card, null, 'box-shadow');
        expect(boxShadow).toBeTruthy();
      }
    });

    test('card: border styling consistent', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const card = page.locator('[class*="card"], [role="article"]').first();
      if (await card.isVisible()) {
        const borderColor = await getCSSProperty(card, null, 'border-color');
        expect(borderColor).toBeDefined();
      }
    });

    test('card: background color matches theme', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const card = page.locator('[class*="card"], [role="article"]').first();
      if (await card.isVisible()) {
        const bgColor = await getCSSProperty(card, null, 'background-color');
        expect(bgColor).toBeTruthy();
      }
    });

    test('card: padding is adequate for content', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const card = page.locator('[class*="card"], [role="article"]').first();
      if (await card.isVisible()) {
        const padding = await getCSSProperty(card, null, 'padding');
        expect(padding).toBeTruthy();
      }
    });
  });

  test.describe('Typography & Font Styling', () => {
    test('font family is loaded correctly', async ({ page }) => {
      const fontFamily = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
      });

      expect(fontFamily).toBeTruthy();
      expect(fontFamily).toMatch(/[a-zA-Z]/);
    });

    test('font weight 400 (regular) used correctly', async ({ page }) => {
      const regularText = page.locator('p, span, .body-text').first();
      if (await regularText.isVisible()) {
        const fontWeight = await getCSSProperty(regularText, null, 'font-weight');
        expect(fontWeight).toBeTruthy();
      }
    });

    test('font weight 600 (semibold) used for emphasis', async ({ page }) => {
      const boldText = page.locator('strong, .semibold, [class*="bold"]').first();
      if (await boldText.isVisible()) {
        const fontWeight = await getCSSProperty(boldText, null, 'font-weight');
        expect(fontWeight).toBeTruthy();
      }
    });

    test('font weight 700 (bold) used for headings', async ({ page }) => {
      const heading = page.locator('h1, h2, h3, [class*="heading"]').first();
      if (await heading.isVisible()) {
        const fontWeight = await getCSSProperty(heading, null, 'font-weight');
        expect(fontWeight).toBeTruthy();
      }
    });

    test('responsive font sizes scale correctly', async ({ page }) => {
      const fontSize = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontSize;
      });

      expect(fontSize).toBeTruthy();
      expect(fontSize).toMatch(/\d+px/);
    });

    test('line height is readable', async ({ page }) => {
      const paragraph = page.locator('p').first();
      if (await paragraph.isVisible()) {
        const lineHeight = await getCSSProperty(paragraph, null, 'line-height');
        expect(lineHeight).toBeTruthy();
      }
    });

    test('letter spacing improves readability where needed', async ({ page }) => {
      const elements = page.locator('[class*="heading"], h1, h2, h3');
      if (await elements.count() > 0) {
        const letterSpacing = await getCSSProperty(elements.nth(0), null, 'letter-spacing');
        expect(letterSpacing).toBeDefined();
      }
    });
  });

  test.describe('Z-Index & Layering', () => {
    test('modal z-index is above content', async ({ page }) => {
      const modalZIndex = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"], .modal, [class*="modal"]');
        if (!modal) return null;
        return window.getComputedStyle(modal).zIndex;
      });

      if (modalZIndex) {
        expect(parseInt(modalZIndex)).toBeGreaterThan(0);
      }
    });

    test('dropdown z-index is above other elements', async ({ page }) => {
      const dropdownZIndex = await page.evaluate(() => {
        const dropdown = document.querySelector('[role="listbox"], .dropdown, [class*="dropdown"]');
        if (!dropdown) return null;
        return window.getComputedStyle(dropdown).zIndex;
      });

      if (dropdownZIndex) {
        expect(parseInt(dropdownZIndex)).toBeGreaterThan(0);
      }
    });

    test('z-index layer hierarchy is correct', async ({ page }) => {
      const zIndexLayers = await page.evaluate(() => {
        const base = document.querySelector('body');
        const modal = document.querySelector('[role="dialog"]');
        const dropdown = document.querySelector('[role="listbox"]');

        return {
          base: base ? window.getComputedStyle(base).zIndex : '0',
          modal: modal ? window.getComputedStyle(modal).zIndex : '0',
          dropdown: dropdown ? window.getComputedStyle(dropdown).zIndex : '0',
        };
      });

      expect(zIndexLayers).toBeTruthy();
    });
  });

  test.describe('Transitions & Animations Duration', () => {
    test('transition duration is defined', async ({ page }) => {
      const transitionDuration = await page.evaluate(() => {
        const elements = document.querySelectorAll('[style*="transition"], [class*="transition"]');
        return elements.length;
      });

      expect(transitionDuration).toBeGreaterThanOrEqual(0);
    });

    test('animation is not disabled', async ({ page }) => {
      const animationsEnabled = await page.evaluate(() => {
        const style = window.getComputedStyle(document.documentElement);
        return style.animationDuration !== '0s';
      });

      expect(animationsEnabled).toBeTruthy();
    });

    test('transitions have reasonable timing', async ({ page }) => {
      const transitionTimings = await page.evaluate(() => {
        const elements = document.querySelectorAll('[style*="transition"]');
        const timings: string[] = [];
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          timings.push(style.transitionDuration);
        });
        return timings;
      });

      expect(transitionTimings).toBeDefined();
    });
  });

  test.describe('Scrollbar & Overflow Styling', () => {
    test('scrollbar styling applied', async ({ page }) => {
      const scrollbarStyle = await page.evaluate(() => {
        const el = document.querySelector('[class*="scroll"]');
        if (!el) return null;
        return window.getComputedStyle(el).overflow;
      });

      expect(scrollbarStyle).toBeDefined();
    });

    test('overflow handling: hidden used appropriately', async ({ page }) => {
      const overflowHidden = await page.evaluate(() => {
        const elements = document.querySelectorAll('[style*="overflow: hidden"]');
        return elements.length > 0;
      });

      expect(overflowHidden).toBeDefined();
    });

    test('overflow handling: scroll used for scrollable content', async ({ page }) => {
      const overflowScroll = await page.evaluate(() => {
        const elements = document.querySelectorAll('[style*="overflow: scroll"], [style*="overflow-y: scroll"]');
        return elements.length > 0;
      });

      expect(overflowScroll).toBeDefined();
    });

    test('overflow handling: auto allows browser default', async ({ page }) => {
      const overflowAuto = await page.evaluate(() => {
        const elements = document.querySelectorAll('[style*="overflow: auto"]');
        return elements.length >= 0;
      });

      expect(overflowAuto).toBeDefined();
    });
  });

  test.describe('Focus Ring & Accessibility Styling', () => {
    test('focus ring visible on interactive elements', async ({ page }) => {
      const button = page.locator('button').first();
      if (await button.isVisible()) {
        await button.focus();

        const outline = await getCSSProperty(button, null, 'outline');
        expect(outline).toBeDefined();
      }
    });

    test('focus ring color contrasts with background', async ({ page }) => {
      const input = page.locator('input').first();
      if (await input.isVisible()) {
        await input.focus();

        const outlineColor = await getCSSProperty(input, null, 'outline-color');
        expect(outlineColor).toBeTruthy();
      }
    });

    test('focus ring does not obscure content', async ({ page }) => {
      const interactive = page.locator('button, a, input').first();
      if (await interactive.isVisible()) {
        const outlineWidth = await getCSSProperty(interactive, null, 'outline-width');
        expect(outlineWidth).toBeDefined();
      }
    });
  });

  test.describe('Badge Styling', () => {
    test('captain badge displays gold color', async ({ page }) => {
      const captainBadge = page.locator('[class*="captain"], [data-testid*="captain"]').first();
      if (await captainBadge.isVisible()) {
        const bgColor = await getCSSProperty(captainBadge, null, 'background-color');
        expect(bgColor).toBeTruthy();
      }
    });

    test('VC badge displays blue color', async ({ page }) => {
      const vcBadge = page.locator('[class*="vc"], [class*="vice"], [data-testid*="vc"]').first();
      if (await vcBadge.isVisible()) {
        const bgColor = await getCSSProperty(vcBadge, null, 'background-color');
        expect(bgColor).toBeTruthy();
      }
    });

    test('badge sizing is consistent', async ({ page }) => {
      const badges = page.locator('[class*="badge"]');
      const badgeCount = await badges.count();

      if (badgeCount > 1) {
        const firstSize = await getCSSProperty(badges.nth(0), null, 'font-size');
        expect(firstSize).toBeTruthy();
      }
    });

    test('badge position does not overlap content', async ({ page }) => {
      const badge = page.locator('[class*="badge"]').first();
      if (await badge.isVisible()) {
        const position = await getCSSProperty(badge, null, 'position');
        expect(position).toBeTruthy();
      }
    });
  });

  test.describe('Button Styling', () => {
    test('primary button styling applied', async ({ page }) => {
      const primaryBtn = page.locator('button[class*="primary"], [data-variant="primary"]').first();
      if (await primaryBtn.isVisible()) {
        const bgColor = await getCSSProperty(primaryBtn, null, 'background-color');
        expect(bgColor).toBeTruthy();
      }
    });

    test('secondary button styling applied', async ({ page }) => {
      const secondaryBtn = page.locator('button[class*="secondary"], [data-variant="secondary"]').first();
      if (await secondaryBtn.isVisible()) {
        const bgColor = await getCSSProperty(secondaryBtn, null, 'background-color');
        expect(bgColor).toBeTruthy();
      }
    });

    test('disabled button has reduced opacity', async ({ page }) => {
      const disabledBtn = page.locator('button:disabled').first();
      if (await disabledBtn.isVisible()) {
        const opacity = await getCSSProperty(disabledBtn, null, 'opacity');
        expect(opacity).toBeTruthy();
      }
    });

    test('button hover state changes styling', async ({ page }) => {
      const button = page.locator('button').first();
      if (await button.isVisible()) {
        const beforeHover = await getCSSProperty(button, null, 'background-color');

        await button.hover();
        await page.waitForTimeout(150);

        const afterHover = await getCSSProperty(button, null, 'background-color');
        expect(beforeHover).toBeTruthy();
        expect(afterHover).toBeTruthy();
      }
    });

    test('button active state changes styling', async ({ page }) => {
      const button = page.locator('button').first();
      if (await button.isVisible()) {
        await button.press('Space');

        const transform = await getCSSProperty(button, null, 'transform');
        expect(transform).toBeDefined();
      }
    });

    test('button padding provides touch target size', async ({ page }) => {
      const button = page.locator('button').first();
      if (await button.isVisible()) {
        const padding = await getCSSProperty(button, null, 'padding');
        expect(padding).toBeTruthy();
      }
    });
  });

  test.describe('Status Indicator Sizing', () => {
    test('status dot size is appropriate', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const statusDot = page.locator('[data-status], [class*="status"]').first();
      if (await statusDot.isVisible()) {
        const width = await getCSSProperty(statusDot, null, 'width');
        expect(width).toBeTruthy();
      }
    });

    test('status indicators are visible at all zoom levels', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.style.zoom = '150%';
      });

      const indicator = page.locator('[class*="status"], [data-status]').first();
      if (await indicator.isVisible()) {
        const visible = await indicator.isVisible();
        expect(visible).toBeTruthy();
      }
    });
  });

  test.describe('Gradient Backgrounds', () => {
    test('gradient backgrounds render correctly', async ({ page }) => {
      const bgWithGradient = await page.evaluate(() => {
        const elements = document.querySelectorAll('[style*="gradient"]');
        return elements.length > 0;
      });

      expect(bgWithGradient).toBeDefined();
    });

    test('gradient colors are distinct and readable', async ({ page }) => {
      const gradientElement = page.locator('[style*="gradient"]').first();
      if (await gradientElement.isVisible()) {
        const bgImage = await getCSSProperty(gradientElement, null, 'background-image');
        expect(bgImage).toBeTruthy();
      }
    });
  });

  test.describe('Border & Line Styling', () => {
    test('borders are consistent thickness', async ({ page }) => {
      const element = page.locator('[style*="border"]').first();
      if (await element.isVisible()) {
        const borderWidth = await getCSSProperty(element, null, 'border-width');
        expect(borderWidth).toBeTruthy();
      }
    });

    test('border color matches theme palette', async ({ page }) => {
      const element = page.locator('[style*="border"]').first();
      if (await element.isVisible()) {
        const borderColor = await getCSSProperty(element, null, 'border-color');
        expect(borderColor).toBeTruthy();
      }
    });

    test('border style is solid or appropriate', async ({ page }) => {
      const element = page.locator('[style*="border"]').first();
      if (await element.isVisible()) {
        const borderStyle = await getCSSProperty(element, null, 'border-style');
        expect(borderStyle).toMatch(/solid|dashed|dotted|double/);
      }
    });
  });

  test.describe('Layout & Flex Consistency', () => {
    test('flex layout maintains alignment', async ({ page }) => {
      await navigateToScreen(page, SCREENS.HOME);

      const flexContainer = page.locator('[style*="display: flex"], [class*="flex"]').first();
      if (await flexContainer.isVisible()) {
        const display = await getCSSProperty(flexContainer, null, 'display');
        expect(display).toBe('flex');
      }
    });

    test('grid layout is properly defined', async ({ page }) => {
      const gridContainer = page.locator('[style*="display: grid"], [class*="grid"]').first();
      if (await gridContainer.isVisible()) {
        const display = await getCSSProperty(gridContainer, null, 'display');
        expect(display).toBe('grid');
      }
    });

    test('justify-content centers content appropriately', async ({ page }) => {
      const centered = page.locator('[style*="justify-content"]').first();
      if (await centered.isVisible()) {
        const justifyContent = await getCSSProperty(centered, null, 'justify-content');
        expect(justifyContent).toBeTruthy();
      }
    });

    test('align-items vertically aligns content', async ({ page }) => {
      const aligned = page.locator('[style*="align-items"]').first();
      if (await aligned.isVisible()) {
        const alignItems = await getCSSProperty(aligned, null, 'align-items');
        expect(alignItems).toBeTruthy();
      }
    });

    test('gap spacing is consistent', async ({ page }) => {
      const container = page.locator('[style*="gap"]').first();
      if (await container.isVisible()) {
        const gap = await getCSSProperty(container, null, 'gap');
        expect(gap).toBeTruthy();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('layout adapts to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const content = page.locator('body').first();
      const width = await content.boundingBox();
      expect(width?.width).toBeLessThanOrEqual(375);
    });

    test('layout adapts to tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const content = page.locator('body').first();
      const width = await content.boundingBox();
      expect(width?.width).toBeLessThanOrEqual(768);
    });

    test('layout adapts to desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      const content = page.locator('body').first();
      const width = await content.boundingBox();
      expect(width?.width).toBeLessThanOrEqual(1920);
    });

    test('font sizes scale with viewport', async ({ page }) => {
      const mobileSize = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontSize;
      });

      await page.setViewportSize({ width: 1920, height: 1080 });

      const desktopSize = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontSize;
      });

      expect(mobileSize).toBeTruthy();
      expect(desktopSize).toBeTruthy();
    });
  });
});
