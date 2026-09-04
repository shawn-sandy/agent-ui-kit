/**
 * Is a reference css block wholly inside `@layer auk { }`?
 *
 * Returns null when it is, otherwise one sentence naming the first problem. Shared
 * by tests/objective.spec.ts, which runs it over every shipped reference, and
 * tests/unit/layer.spec.ts, which pins the cases it must reject.
 *
 * Indentation is not nesting. A stray "  }" closes the layer early and leaves every
 * rule after it unlayered while still looking indented, so this counts braces and
 * demands the depth stay above zero until the final line.
 */
export function layerProblem(css: string): string | null {
  const lines = css.split('\n').filter((line) => line.trim() !== '');
  if (lines[0] !== '@layer auk {') return 'css block must open with "@layer auk {"';
  if (lines.at(-1) !== '}') return 'css block must end by closing the auk layer';
  let depth = 0;
  for (const [index, line] of lines.entries()) {
    depth += (line.match(/{/g) ?? []).length - (line.match(/}/g) ?? []).length;
    if (index === lines.length - 1) break;
    if (depth <= 0) return `line ${index + 1} closes the auk layer early: ${line}`;
    if (index > 0 && !/^  /.test(line)) return `a rule outside the two-space indent: ${line}`;
  }
  if (depth !== 0) return 'braces do not balance';
  return null;
}
