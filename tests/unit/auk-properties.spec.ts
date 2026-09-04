/**
 * The parser behind docs/properties.md and the ui-theme mapping test. The cases a
 * regex gets wrong: a fallback with its own parentheses, and a name that contradicts
 * itself across two rules.
 */
import { describe, expect, it } from 'vitest';
import { parseVars } from '../../scripts/auk-properties.mjs';

describe('parseVars', () => {
  it('returns a fallback with nested parentheses whole', () => {
    const css = [
      '.x { background-color: var(--auk-x-bg, rgba(17, 24, 39, 0.6)); }',
      '.x { inline-size: var(--auk-x-inline-size, min(22rem, calc(100vw - 2rem))); }',
      '.x { border: var(--auk-x-border-width, 1px) solid var(--auk-x-border-color, transparent); }',
    ].join('\n');
    expect(parseVars(css)).toEqual([
      { property: '--auk-x-bg', fallback: 'rgba(17, 24, 39, 0.6)' },
      { property: '--auk-x-inline-size', fallback: 'min(22rem, calc(100vw - 2rem))' },
      { property: '--auk-x-border-width', fallback: '1px' },
      { property: '--auk-x-border-color', fallback: 'transparent' },
    ]);
  });

  it('names a property once when it repeats with the same fallback', () => {
    const css = '.x { min-block-size: var(--auk-x-min-size, 2.75rem); min-inline-size: var(--auk-x-min-size, 2.75rem); }';
    expect(parseVars(css)).toEqual([{ property: '--auk-x-min-size', fallback: '2.75rem' }]);
  });

  it('throws when one property carries two different fallbacks', () => {
    const css = '.x { gap: var(--auk-x-gap, 1rem); }\n.y { gap: var(--auk-x-gap, 2rem); }';
    expect(() => parseVars(css)).toThrow(/--auk-x-gap/);
  });

  it('throws on a var( that never closes', () => {
    expect(() => parseVars('.x { gap: var(--auk-x-gap, calc(1rem + 2px; }')).toThrow(/unclosed/);
  });
});
