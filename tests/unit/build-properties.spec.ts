/**
 * The anatomy renderer behind docs/properties.md: the Figma-facing half of the
 * contract. The qualifier line declares parts the markup addresses by class, ARIA
 * role or pseudo-element as well as by data-part, so the renderer's claim that a name
 * is an attribute is tested rather than assumed.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { anatomy, render } from '../../scripts/build-properties.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const reference = (name: string) => readFileSync(resolve(ROOT, 'skills', name, 'references', `${name}.md`), 'utf8');

describe('anatomy', () => {
  it('button: parts, variants and states with their Figma names and code forms', () => {
    const a = anatomy(reference('ui-button'));
    expect(a.parts).toEqual([{ name: 'icon', attribute: true, code: 'data-part="icon"', figma: 'Icon' }]);
    expect(a.variants).toEqual([
      { name: 'primary', code: 'data-variant="primary"', figma: 'Variant=Primary' },
      { name: 'secondary', code: 'data-variant="secondary"', figma: 'Variant=Secondary' },
      { name: 'destructive', code: 'data-variant="destructive"', figma: 'Variant=Destructive' },
    ]);
    expect(a.states).toEqual([
      { name: 'default', code: 'no attribute', figma: 'State=Default' },
      { name: 'hover', code: ':hover', figma: 'State=Hover' },
      { name: 'focus', code: ':focus-visible', figma: 'State=Focus' },
      { name: 'disabled', code: 'aria-disabled="true"', figma: 'State=Disabled' },
    ]);
  });

  it('dialog: title, close and backdrop are parts the Structure block addresses without data-part', () => {
    const { parts } = anatomy(reference('ui-dialog'));
    expect(parts.filter((p) => !p.attribute).map((p) => p.name)).toEqual(['title', 'close', 'backdrop']);
    expect(parts.find((p) => p.name === 'header')).toEqual({ name: 'header', attribute: true, code: 'data-part="header"', figma: 'Header' });
    expect(parts.find((p) => p.name === 'title')).toMatchObject({ attribute: false, code: '<h2>' });
    expect(parts.find((p) => p.name === 'close')).toMatchObject({ attribute: false, code: 'class="auk-dialog-close"' });
    expect(parts.find((p) => p.name === 'backdrop')).toMatchObject({ attribute: false, code: '::backdrop' });
  });

  it('tabs: tab and panel are addressed by ARIA role, and selected by aria-selected', () => {
    const a = anatomy(reference('ui-tabs'));
    expect(a.parts.find((p) => p.name === 'tab')).toMatchObject({ attribute: false, code: 'role="tab"', figma: 'Tab' });
    expect(a.parts.find((p) => p.name === 'panel')).toMatchObject({ attribute: false, code: 'role="tabpanel"', figma: 'Panel' });
    expect(a.states.find((s) => s.name === 'selected')).toEqual({ name: 'selected', code: 'aria-selected="true"', figma: 'State=Selected' });
  });

  it('popover: the open state is the :popover-open pseudo-class', () => {
    expect(anatomy(reference('ui-popover')).states.find((s) => s.name === 'open')).toEqual({ name: 'open', code: ':popover-open', figma: 'State=Open' });
  });

  it('box: no parts, one variant, only the default state', () => {
    const a = anatomy(reference('ui-box'));
    expect(a.parts).toEqual([]);
    expect(a.variants.map((v) => v.figma)).toEqual(['Variant=Invert']);
    expect(a.states.map((s) => s.figma)).toEqual(['State=Default']);
  });

  it('a state the css never addresses falls back to data-state', () => {
    const md = 'Qualifiers: parts none; variants none; states `busy`.\n```html\n<div class="auk-x"></div>\n```\n```css\n.auk-x {}\n```\n';
    expect(anatomy(md).states.at(-1)).toEqual({ name: 'busy', code: 'data-state="busy"', figma: 'State=Busy' });
  });
});

describe('render() opens every component section with its anatomy', () => {
  const out = render();

  it('carries one Anatomy table per component, before the property table', () => {
    const sections = out.split(/^## /m).slice(1);
    expect(sections.length).toBe(6);
    for (const section of sections) {
      expect(section.indexOf('| Kind | Name | In code | Figma name |'), section.split('\n')[0]).toBeGreaterThan(0);
      expect(section.indexOf('| Kind | Name |')).toBeLessThan(section.indexOf('| Property | Fallback | Kind |'));
    }
  });

  it('writes the rows the Figma section of docs/theming.md relies on', () => {
    expect(out).toMatch(/^\| variant \| primary \| `data-variant="primary"` \| `Variant=Primary` \|$/m);
    expect(out).toMatch(/^\| state \| disabled \| `aria-disabled="true"` \| `State=Disabled` \|$/m);
    expect(out).toMatch(/^\| state \| default \| no attribute \| `State=Default` \|$/m);
  });

  it('names the roles each component reads with their code syntax', () => {
    expect(out).toMatch(/^Reads roles: `var\(--auk-role-primary\)`, `var\(--auk-role-on-primary\)`/m);
  });
});
