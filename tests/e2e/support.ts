import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');

/** The demo opens straight from disk: no server, no build step. That is the point. */
export function demoUrl(skill: string): string {
  return pathToFileURL(resolve(ROOT, 'skills', skill, 'references', 'demo.html')).href;
}

/** The id of whatever currently has focus, so focus can be asserted by name. */
export function activeId(page: Page): Promise<string> {
  return page.evaluate(() => document.activeElement?.id ?? '');
}

/**
 * Press Tab until the element with `id` has focus.
 *
 * @returns how many presses it took, or -1 if it was never reached
 */
export async function tabTo(page: Page, id: string, limit = 20): Promise<number> {
  for (let i = 1; i <= limit; i += 1) {
    await page.keyboard.press('Tab');
    if ((await activeId(page)) === id) return i;
  }
  return -1;
}

/** Outline width in pixels on the currently focused element. */
export function focusOutlineWidth(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return 0;
    const style = getComputedStyle(el);
    if (style.outlineStyle === 'none') return 0;
    return parseFloat(style.outlineWidth) || 0;
  });
}

/**
 * Wait for focus to settle on `id`, then assert it.
 *
 * Closing a dialog places focus one task later on purpose - the module defers it so
 * Chromium's own handling for a closing modal cannot overwrite the placement. Reading
 * activeElement immediately after the keypress therefore races that task, which is a
 * flaky test rather than a real failure.
 */
export async function expectFocus(page: Page, id: string): Promise<void> {
  await expect
    .poll(() => activeId(page), { message: `focus never settled on #${id}`, timeout: 2000 })
    .toBe(id);
}
