import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { demoUrl, activeId, tabTo, focusOutlineWidth } from './support.js';

test.beforeEach(async ({ page }) => {
  await page.goto(demoUrl('ui-button'));
});

test('1.4.3 Contrast (Minimum): every variant and the unavailable state pass', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  expect(results.violations.map((v) => v.nodes.map((n) => n.html))).toEqual([]);
});

test('2.1.1 Keyboard: Enter activates an available button', async ({ page }) => {
  expect(await tabTo(page, 'primary')).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  await expect(page.locator('#log')).toHaveAttribute('data-count', '1');
  await page.keyboard.press('Space');
  await expect(page.locator('#log')).toHaveAttribute('data-count', '2');
});

test('2.1.1 Keyboard: an unavailable button is reachable by Tab', async ({ page }) => {
  expect(await tabTo(page, 'unavailable')).toBeGreaterThan(0);
  await expect(page.locator('#unavailable')).toHaveAttribute('aria-disabled', 'true');
});

test('2.1.1 Keyboard: an unavailable button does not fire on Enter or Space', async ({ page }) => {
  expect(await tabTo(page, 'unavailable')).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(page.locator('#log')).toHaveAttribute('data-count', '0');
});

test('2.4.7 Focus Visible: every variant draws a focus ring', async ({ page }) => {
  for (const id of ['primary', 'secondary', 'destructive', 'unavailable', 'iconOnly']) {
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await tabTo(page, id), `never reached ${id}`).toBeGreaterThan(0);
    expect(await activeId(page)).toBe(id);
    expect(await focusOutlineWidth(page), `${id} has no focus ring`).toBeGreaterThan(0);
  }
});

test('2.5.8 Target Size (Minimum): the default size clears 24 by 24', async ({ page }) => {
  // The criterion's own bound, and the floor skills/ui-theme/references/auk.tokens.json
  // records for --auk-button-min-size. The shipped 2.75rem clears it by a wide margin.
  for (const id of ['primary', 'secondary', 'destructive', 'iconOnly']) {
    const box = await page.locator(`#${id}`).boundingBox();
    expect(box, `${id} has no box`).not.toBeNull();
    expect(box!.width, `${id} width`).toBeGreaterThanOrEqual(24);
    expect(box!.height, `${id} height`).toBeGreaterThanOrEqual(24);
  }
});

test('2.3.3 Animation from Interactions: the hover transition is off when a reader asks for less motion', async ({ page }) => {
  // The floor auk.tokens.json records for --auk-button-transition-duration. The
  // reference keeps the transition inside the no-preference guard, so a reader who
  // asked for less motion gets none however the duration is themed - read from
  // computed styles under both settings rather than trusted from the css text.
  const duration = () => page.locator('#primary').evaluate((el) => getComputedStyle(el).transitionDuration);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(await duration()).toBe('0.12s');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await duration()).toBe('0s');
});

test('4.1.2 Name, Role, Value: an icon-only button still has a name', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
  // The glyph itself contributes nothing to the name.
  await expect(page.locator('#iconOnly [data-part="icon"]')).toHaveAttribute('aria-hidden', 'true');
});

test('4.1.2 Name, Role, Value: unavailable is exposed without leaving the tab order', async ({ page }) => {
  const unavailable = page.getByRole('button', { name: 'Saving...' });
  await expect(unavailable).toHaveAttribute('aria-disabled', 'true');
  // The native attribute would remove it from the tree's focusable set entirely.
  await expect(unavailable).not.toHaveAttribute('disabled', /.*/);
});
