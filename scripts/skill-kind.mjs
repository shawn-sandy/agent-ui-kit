/**
 * Which kind of skill a skills/<name> directory holds.
 *
 * Every gate that walks skills/ used to assume each directory is a component. A
 * workflow skill - one that performs a procedure over a project instead of shipping
 * a component - declares `metadata.kind: workflow` in its SKILL.md, and the gates
 * that only make sense for a component skip it. Three gates need this one answer, so
 * it lives here rather than in any of them; scripts/build-demos.mjs in particular
 * runs its main body on import, so it could never host a shared helper.
 *
 * Anything short of an explicit string value - no SKILL.md, no metadata, no kind, or
 * frontmatter that does not parse - is a component. A broken file must land in the
 * strict gates, never slip past them by being unreadable.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

export const DEFAULT_KIND = 'component';

/** The kind one SKILL.md source declares, or the default. */
export function kindOf(source) {
  try {
    const kind = matter(source).data?.metadata?.kind;
    return typeof kind === 'string' && kind.length > 0 ? kind : DEFAULT_KIND;
  } catch {
    return DEFAULT_KIND;
  }
}

/** The kind of the skill in `skillDir`, read from its SKILL.md. */
export function skillKind(skillDir) {
  let source;
  try {
    source = readFileSync(join(skillDir, 'SKILL.md'), 'utf8');
  } catch {
    return DEFAULT_KIND;
  }
  return kindOf(source);
}
