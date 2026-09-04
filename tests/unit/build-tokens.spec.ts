/**
 * The typing half of scripts/build-tokens.mjs. Byte equality in
 * tests/integration/tokens-file.spec.ts would happily pin a wrong type, so each value
 * category gets a case that states the DTCG 2025.10 shape it must produce - and the
 * twelve shipped fallbacks the format cannot type are named one by one, so the list
 * cannot grow without this file knowing.
 */
import { describe, expect, it } from 'vitest';
import { readProperties } from '../../scripts/auk-properties.mjs';
import { readRoles, tokenFor } from '../../scripts/build-tokens.mjs';
import { resolve } from 'node:path';

const SKILLS = resolve(import.meta.dirname, '../../skills');

describe('tokenFor types a shipped fallback by its value and its property', () => {
  it('a hex colour becomes an sRGB colour with its hex kept', () => {
    expect(tokenFor('--auk-button-bg', '#1a56db')).toEqual({
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [0.102, 0.337, 0.859], hex: '#1a56db' },
      raw: false,
    });
  });

  it('an rgba() colour carries its alpha', () => {
    expect(tokenFor('--auk-dialog-backdrop-bg', 'rgba(17, 24, 39, 0.6)')).toEqual({
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [0.067, 0.094, 0.153], alpha: 0.6, hex: '#111827' },
      raw: false,
    });
  });

  it('transparent is a colour at alpha zero', () => {
    expect(tokenFor('--auk-box-border-color', 'transparent')).toEqual({
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0, hex: '#000000' },
      raw: false,
    });
  });

  it('a length becomes a dimension in rem or px, sign kept', () => {
    expect(tokenFor('--auk-button-radius', '0.375rem')).toEqual({ $type: 'dimension', $value: { value: 0.375, unit: 'rem' }, raw: false });
    expect(tokenFor('--auk-tabs-focus-offset', '-3px')).toEqual({ $type: 'dimension', $value: { value: -3, unit: 'px' }, raw: false });
  });

  it('a weight, a line height, a brightness and a duration take their own types', () => {
    expect(tokenFor('--auk-button-font-weight', '600')).toEqual({ $type: 'fontWeight', $value: 600, raw: false });
    expect(tokenFor('--auk-alert-line-height', '1.5')).toEqual({ $type: 'number', $value: 1.5, raw: false });
    expect(tokenFor('--auk-button-hover-brightness', '0.92')).toEqual({ $type: 'number', $value: 0.92, raw: false });
    expect(tokenFor('--auk-button-transition-duration', '120ms')).toEqual({ $type: 'duration', $value: { value: 120, unit: 'ms' }, raw: false });
  });

  it('a box shadow becomes a shadow object', () => {
    expect(tokenFor('--auk-popover-box-shadow', '0 10px 25px rgba(17, 24, 39, 0.18)')).toEqual({
      $type: 'shadow',
      $value: {
        color: { colorSpace: 'srgb', components: [0.067, 0.094, 0.153], alpha: 0.18, hex: '#111827' },
        offsetX: { value: 0, unit: 'px' },
        offsetY: { value: 10, unit: 'px' },
        blur: { value: 25, unit: 'px' },
        spread: { value: 0, unit: 'px' },
      },
      raw: false,
    });
  });

  it('a font stack is a fontFamily list', () => {
    expect(tokenFor('--auk-x-font-family', 'Georgia, "Times New Roman", serif')).toEqual({
      $type: 'fontFamily',
      $value: ['Georgia', 'Times New Roman', 'serif'],
      raw: false,
    });
  });

  describe('the twelve fallbacks DTCG cannot type keep the category type and the literal, flagged raw', () => {
    const raw = (property: string, fallback: string, type?: string) =>
      expect(tokenFor(property, fallback), `${property}: ${fallback}`).toEqual(
        type ? { $type: type, $value: fallback, raw: true } : { $value: fallback, raw: true },
      );

    it('inherit on the five font-family properties', () => {
      for (const c of ['alert', 'button', 'dialog', 'popover', 'tabs']) raw(`--auk-${c}-font-family`, 'inherit', 'fontFamily');
    });

    it('auto, the two min() sizes and the two calc() sizes are raw dimensions', () => {
      raw('--auk-box-min-block-size', 'auto', 'dimension');
      raw('--auk-dialog-inline-size', 'min(32rem, calc(100vw - 2rem))', 'dimension');
      raw('--auk-popover-inline-size', 'min(22rem, calc(100vw - 2rem))', 'dimension');
      raw('--auk-dialog-max-block-size', 'calc(100vh - 4rem)', 'dimension');
      raw('--auk-popover-max-block-size', 'calc(100vh - 4rem)', 'dimension');
    });

    it('the two popover placement values have no DTCG type at all', () => {
      raw('--auk-popover-position-area', 'block-end span-inline-end');
      raw('--auk-popover-position-try-fallbacks', 'flip-block, flip-inline, flip-block flip-inline');
    });

    it('and they are exactly the raw ones the shipped references carry', () => {
      const shipped = readProperties(SKILLS).filter((p) => tokenFor(p.property, p.fallback).raw);
      expect(shipped.map((p) => p.property).sort()).toEqual(
        [
          '--auk-alert-font-family', '--auk-button-font-family', '--auk-dialog-font-family',
          '--auk-popover-font-family', '--auk-tabs-font-family', '--auk-box-min-block-size',
          '--auk-dialog-inline-size', '--auk-popover-inline-size', '--auk-dialog-max-block-size',
          '--auk-popover-max-block-size', '--auk-popover-position-area', '--auk-popover-position-try-fallbacks',
        ].sort(),
      );
    });
  });
});

describe('readRoles reads the mapping table in ui-theme.md', () => {
  const roles = readRoles();

  it('returns the 23 roles in table order with their properties and first fallback', () => {
    expect(roles.map((r) => r.name)).toEqual([
      'primary', 'on-primary', 'text', 'surface', 'border', 'divider', 'focus', 'info', 'info-surface',
      'danger', 'danger-surface', 'success', 'success-surface', 'warning', 'warning-surface',
      'muted', 'on-muted', 'inverse', 'on-inverse', 'overlay', 'shadow', 'radius', 'font',
    ]);
    expect(roles[0]).toMatchObject({ name: 'primary', meaning: 'Brand action colour', fallback: '#1a56db' });
    expect(roles[0].properties[0]).toBe('--auk-button-bg');
    expect(roles.find((r) => r.name === 'on-muted')!.properties).toEqual(['--auk-button-disabled-color']);
    expect(roles.find((r) => r.name === 'on-inverse')!.properties).toEqual(['--auk-box-invert-color']);
  });

  it('together the rows cover every brand-bearing property exactly once', () => {
    const all = roles.flatMap((r) => r.properties).sort();
    expect(all).toEqual(readProperties(SKILLS).filter((p) => p.brand).map((p) => p.property).sort());
  });
});
