/**
 * The one behaviour the `auk` cascade layer buys: a plain rule the user writes outside
 * any layer beats the shipped styles, however early it loads and whatever its
 * specificity. Each demo gets an unlayered rule prepended to <head>, so it sits BEFORE
 * the component css in source order - the position that loses without the layer.
 */
import { test, expect } from '@playwright/test';
import { demoUrl } from './support';

const OVERRIDE = 'rgb(1, 2, 3)';

/** Root class and the property its base rule declares. Tabs' root declares no background. */
const COMPONENTS: [skill: string, property: 'background-color' | 'color'][] = [
  ['ui-alert', 'background-color'],
  ['ui-box', 'background-color'],
  ['ui-button', 'background-color'],
  ['ui-dialog', 'background-color'],
  ['ui-popover', 'background-color'],
  ['ui-tabs', 'color'],
];

for (const [skill, property] of COMPONENTS) {
  const root = `.auk-${skill.replace(/^ui-/, '')}`;

  test(`${skill}: an unlayered ${root} rule loaded first still wins on ${property}`, async ({ page }) => {
    await page.goto(demoUrl(skill));
    await page.evaluate(
      ([selector, prop, value]) => {
        const style = document.createElement('style');
        style.textContent = `${selector} { ${prop}: ${value}; }`;
        document.head.prepend(style);
      },
      [root, property, OVERRIDE],
    );
    const computed = await page
      .locator(root)
      .first()
      .evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), property);
    expect(computed).toBe(OVERRIDE);
  });
}
