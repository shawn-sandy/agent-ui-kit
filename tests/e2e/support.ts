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
