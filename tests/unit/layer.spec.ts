/**
 * The layer check must read nesting, not indentation. A stray "  }" closes the
 * layer early and leaves every rule after it unlayered while still looking indented.
 */
import { describe, expect, it } from 'vitest';
import { layerProblem } from '../lib/layer.js';

const good = ['@layer auk {', '  .a { color: red; }', '', '  @media (x) {', '    .b { gap: 0; }', '  }', '}'].join('\n');

describe('layerProblem', () => {
  it('accepts a block wholly inside the layer, nested at-rules included', () => {
    expect(layerProblem(good)).toBeNull();
  });

  it('rejects a block that never opens the layer', () => {
    expect(layerProblem('.a { color: red; }')).toMatch(/open with/);
  });

  it('rejects a block that closes the layer early and keeps indenting', () => {
    const early = ['@layer auk {', '  .a { color: red; }', '  }', '  .b { color: blue; }', '}'].join('\n');
    expect(layerProblem(early)).toMatch(/early/);
  });

  it('rejects unbalanced braces', () => {
    expect(layerProblem(['@layer auk {', '  .a { color: red;', '}'].join('\n'))).toMatch(/balance/);
  });
});
