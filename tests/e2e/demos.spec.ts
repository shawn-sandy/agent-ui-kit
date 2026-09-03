/**
 * Whole-repository accessibility sweep, data-driven over skills/ so a component added later
 * is scanned without this file being edited. Per-component specs drive the states
 * that only exist after an interaction; this one covers the page as it loads.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { demoUrl } from './support.js';

const skills = readdirSync(resolve(import.meta.dirname, '../../skills'), { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

test('the repository has components in it', () => {
  expect(skills.length).toBeGreaterThan(0);
});

for (const skill of skills) {
  test(`${skill} demo loads from disk with zero axe violations`, async ({ page }) => {
    await page.goto(demoUrl(skill));
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}
