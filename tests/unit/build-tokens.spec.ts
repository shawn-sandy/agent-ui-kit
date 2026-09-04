/**
 * The type mapping behind skills/ui-theme/references/auk.tokens.json. The byte-equality
 * pin in tests/integration/tokens-file.spec.ts would happily freeze a wrong shape, so
 * each fallback category states the DTCG shape it must become here - and the twelve
 * literals the format cannot type are listed by name, so that count cannot drift.
 */
import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { readProperties } from '../../scripts/auk-properties.mjs';
import { tokenFor, readRoles } from '../../scripts/build-tokens.mjs';

const ROOT = resolve(import.meta.dirname, '../..');

describe('tokenFor types a shipped fallback', () => {
  it('a hex colour becomes an sRGB colour with its hex kept', () => {
    expect(tokenFor('--auk-button-bg', '#1a56db')).toEqual({
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [0.102, 0.337, 0.859], alpha: 1, hex: '#1a56db' },
    });
  });

  it('an rgba() colour keeps its alpha', () => {
    expect(tokenFor('--auk-dialog-backdrop-bg', 'rgba(17, 24, 39, 0.6)')).toEqual({
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [0.067, 0.094, 0.153], alpha: 0.6, hex: '#111827' },
    });
  });

  it('transparent is a colour at alpha zero', () => {
    expect(tokenFor('--auk-box-border-color', 'transparent')).toEqual({
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0, hex: '#000000' },
    });
  });

  it('a rem or px length is a dimension', () => {
    expect(tokenFor('--auk-button-radius', '0.375rem')).toEqual({ $type: 'dimension', $value: { value: 0.375, unit: 'rem' } });
    expect(tokenFor('--auk-tabs-focus-offset', '-3px')).toEqual({ $type: 'dimension', $value: { value: -3, unit: 'px' } });
  });

  it('a weight, a line height, a brightness and a duration take their own types', () => {
    expect(tokenFor('--auk-button-font-weight', '600')).toEqual({ $type: 'fontWeight', $value: 600 });
    expect(tokenFor('--auk-button-line-height', '1.5')).toEqual({ $type: 'number', $value: 1.5 });
    expect(tokenFor('--auk-button-hover-brightness', '0.92')).toEqual({ $type: 'number', $value: 0.92 });
    expect(tokenFor('--auk-button-transition-duration', '120ms')).toEqual({ $type: 'duration', $value: { value: 120, unit: 'ms' } });
  });

  it('the popover shadow is a shadow composite', () => {
    expect(tokenFor('--auk-popover-box-shadow', '0 10px 25px rgba(17, 24, 39, 0.18)')).toEqual({
      $type: 'shadow',
      $value: {
        color: { colorSpace: 'srgb', components: [0.067, 0.094, 0.153], alpha: 0.18, hex: '#111827' },
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 10, unit: 'px' },
        blur: { value: 25, unit: 'px' },
        spread: { value: 0, unit: 'px' },
      },
    });
  });

  const RAW: [string, string, string][] = [
    ['--auk-alert-font-family', 'inherit', 'fontFamily'],
    ['--auk-button-font-family', 'inherit', 'fontFamily'],
    ['--auk-dialog-font-family', 'inherit', 'fontFamily'],
    ['--auk-popover-font-family', 'inherit', 'fontFamily'],
    ['--auk-tabs-font-family', 'inherit', 'fontFamily'],
    ['--auk-box-min-block-size', 'auto', 'dimension'],
    ['--auk-dialog-inline-size', 'min(32rem, calc(100vw - 2rem))', 'dimension'],
    ['--auk-popover-inline-size', 'min(22rem, calc(100vw - 2rem))', 'dimension'],
    ['--auk-dialog-max-block-size', 'calc(100vh - 4rem)', 'dimension'],
    ['--auk-popover-max-block-size', 'calc(100vh - 4rem)', 'dimension'],
    ['--auk-popover-position-area', 'block-end span-inline-end', 'string'],
    ['--auk-popover-position-try-fallbacks', 'flip-block, flip-inline, flip-block flip-inline', 'string'],
  ];

  it.each(RAW)('%s keeps %s verbatim as a raw string of the category type', (property, fallback, type) => {
    expect(tokenFor(property, fallback)).toEqual({ $type: type, $value: fallback, raw: true });
  });

  it('exactly those twelve properties are raw across the shipped references', () => {
    const raw = readProperties(resolve(ROOT, 'skills'))
      .filter((p) => tokenFor(p.property, p.fallback).raw)
      .map((p) => p.property)
      .sort();
    expect(raw).toEqual(RAW.map(([property]) => property).sort());
  });
});

describe('readRoles reads the mapping table', () => {
  const roles = readRoles();

  it('returns the twenty-three roles in table order', () => {
    expect(roles.length).toBe(23);
    expect(roles[0]).toMatchObject({ name: 'primary', meaning: 'Brand action colour' });
    expect(roles[0].properties[0]).toBe('--auk-button-bg');
    expect(roles.map((r) => r.name)).toEqual(expect.arrayContaining(['on-muted', 'on-inverse', 'font']));
    expect(roles.at(-1)?.name).toBe('font');
  });

  it('every role names at least one property', () => {
    expect(roles.filter((r) => r.properties.length === 0)).toEqual([]);
  });
});

describe('guardOf reads every reduced-motion block', () => {
  const css = [
    '@media (prefers-reduced-motion: no-preference) {',
    '  .a { transition: filter var(--auk-a-hover-duration, 100ms) ease; }',
    '}',
    '.a { gap: var(--auk-a-gap, 1rem); }',
    '@media (prefers-reduced-motion: no-preference) {',
    '  .a { transition: color var(--auk-a-color-duration, 100ms) ease; }',
    '}',
  ].join('\n');

  it('finds a property guarded only by the second block', async () => {
    const { guardOf } = await import('../../scripts/build-tokens.mjs');
    expect(guardOf(css, '--auk-a-color-duration')).toBe('prefers-reduced-motion: no-preference');
    expect(guardOf(css, '--auk-a-hover-duration')).toBe('prefers-reduced-motion: no-preference');
  });

  it('reports an unguarded property as undefined', async () => {
    const { guardOf } = await import('../../scripts/build-tokens.mjs');
    expect(guardOf(css, '--auk-a-gap')).toBeUndefined();
  });
});
