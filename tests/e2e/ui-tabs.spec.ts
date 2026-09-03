import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { demoUrl, activeId, tabTo, focusOutlineWidth } from './support.js';

const TABS = ['tab-profile', 'tab-billing', 'tab-notifications'];
const PANELS = ['panel-profile', 'panel-billing', 'panel-notifications'];

test.beforeEach(async ({ page }) => {
  await page.goto(demoUrl('ui-tabs'));
});

/** ids of every tab currently in the page's tab order. */
const inTabOrder = (page: import('@playwright/test').Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('[role="tab"]'))
      .filter((t) => t.getAttribute('tabindex') === '0')
      .map((t) => t.id),
  );

test('2.4.3 Focus Order: exactly one tab is in the tab order at a time', async ({ page }) => {
  expect(await inTabOrder(page)).toEqual(['tab-profile']);

  await page.locator('#tab-billing').click();
  expect(await inTabOrder(page)).toEqual(['tab-billing']);

  await page.keyboard.press('End');
  expect(await inTabOrder(page)).toEqual(['tab-notifications']);
});

test('2.4.3 Focus Order: one Tab press carries past the whole row', async ({ page }) => {
  await page.locator('#before').focus();
  await page.keyboard.press('Tab');
  expect(await activeId(page)).toBe('tab-profile');

  // The next press must land in the panel, not on the second tab.
  await page.keyboard.press('Tab');
  expect(await activeId(page)).toBe('panel-profile');
});

test('2.1.1 Keyboard: arrow keys move selection and wrap at both ends', async ({ page }) => {
  await page.locator('#tab-profile').focus();

  await page.keyboard.press('ArrowRight');
  expect(await activeId(page)).toBe('tab-billing');
  await expect(page.locator('#tab-billing')).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('ArrowRight');
  expect(await activeId(page)).toBe('tab-notifications');

  // Wraps forward from the last tab to the first...
  await page.keyboard.press('ArrowRight');
  expect(await activeId(page)).toBe('tab-profile');

  // ...and backward from the first to the last.
  await page.keyboard.press('ArrowLeft');
  expect(await activeId(page)).toBe('tab-notifications');
});

test('2.1.1 Keyboard: Home and End jump to the ends', async ({ page }) => {
  await page.locator('#tab-billing').focus();

  await page.keyboard.press('Home');
  expect(await activeId(page)).toBe('tab-profile');
  await expect(page.locator('#panel-profile')).toBeVisible();

  await page.keyboard.press('End');
  expect(await activeId(page)).toBe('tab-notifications');
  await expect(page.locator('#panel-notifications')).toBeVisible();
});

test('2.1.1 Keyboard: exactly one panel is visible at a time', async ({ page }) => {
  for (const [index, tab] of TABS.entries()) {
    await page.locator(`#${tab}`).click();
    for (const [panelIndex, panel] of PANELS.entries()) {
      const locator = page.locator(`#${panel}`);
      if (panelIndex === index) await expect(locator).toBeVisible();
      else await expect(locator).toBeHidden();
    }
  }
});

test('2.4.7 Focus Visible: tabs and panels both draw a focus ring', async ({ page }) => {
  await page.locator('#before').focus();
  expect(await tabTo(page, 'tab-profile')).toBeGreaterThan(0);
  expect(await focusOutlineWidth(page)).toBeGreaterThan(0);

  expect(await tabTo(page, 'panel-profile')).toBeGreaterThan(0);
  expect(await focusOutlineWidth(page)).toBeGreaterThan(0);
});

test('4.1.2 Name, Role, Value: every tab is paired to its panel both ways', async ({ page }) => {
  for (const [index, tab] of TABS.entries()) {
    await expect(page.locator(`#${tab}`)).toHaveAttribute('aria-controls', PANELS[index]);
    await expect(page.locator(`#${PANELS[index]}`)).toHaveAttribute('aria-labelledby', tab);
  }
  await expect(page.getByRole('tablist')).toHaveAttribute('aria-label', 'Settings sections');
  await expect(page.getByRole('tab', { selected: true })).toHaveCount(1);
});

test('a panel id that is not a legal CSS selector still resolves', async ({ page }) => {
  // "panel:billing" is legal HTML but querySelector('#panel:billing') throws, which
  // would take out the whole tab set rather than just missing the panel.
  await page.goto(demoUrl('ui-tabs'));
  const rewired = await page.evaluate(() => {
    const panel = document.getElementById('panel-billing')!;
    const tab = document.querySelector('[aria-controls="panel-billing"]')!;
    panel.id = 'panel:billing';
    tab.setAttribute('aria-controls', 'panel:billing');
    try {
      (window as unknown as { initTabs: (el: Element) => void }).initTabs(
        document.getElementById('settings-tabs')!,
      );
      return { threw: false };
    } catch (error) {
      return { threw: true, message: String(error) };
    }
  });
  expect(rewired.threw, `initTabs threw: ${rewired.message ?? ''}`).toBe(false);

  await page.locator('#tab-profile').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#panel\\:billing')).toBeVisible();
});

test('1.4.3 Contrast (Minimum): selected and unselected tabs both pass', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  expect(results.violations.map((v) => v.nodes.map((n) => n.html))).toEqual([]);
});
