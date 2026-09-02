import matter from 'gray-matter';
import { basename, dirname } from 'node:path';

/**
 * Keys defined by the Agent Skills open standard. Anything else - including the
 * Claude Code extensions `disable-model-invocation` and `hint` - makes a skill
 * invalid for other vendors, so this repo rejects them outright.
 */
export const STANDARD_KEYS = ['name', 'description', 'license', 'allowed-tools', 'metadata'] as const;

/** Lowercase alphanumeric segments joined by single hyphens; no edge or doubled hyphen. */
export const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const MAX_NAME = 64;
export const MAX_DESCRIPTION = 1024;

/** First and second person pronouns. A description is written about the skill, not to the reader. */
const PRONOUNS = /\b(?:I|I'm|we|we're|our|us|me|my|you|you're|your|yours)\b/i;

export interface Violation {
  rule: string;
  message: string;
}

/**
 * Validate one SKILL.md against the Agent Skills standard.
 *
 * @param source - raw SKILL.md contents, frontmatter included
 * @param skillPath - path to the SKILL.md, used to check `name` against its directory
 * @returns every rule the file breaks; empty means valid
 */
export function validateSkill(source: string, skillPath: string): Violation[] {
  const violations: Violation[] = [];
  const fail = (rule: string, message: string) => violations.push({ rule, message });

  let data: Record<string, unknown>;
  try {
    data = matter(source).data as Record<string, unknown>;
  } catch (err) {
    return [{ rule: 'parseable', message: `frontmatter is not valid YAML: ${(err as Error).message}` }];
  }

  if (Object.keys(data).length === 0) {
    return [{ rule: 'frontmatter-present', message: 'no frontmatter block found' }];
  }

  for (const key of Object.keys(data)) {
    if (!(STANDARD_KEYS as readonly string[]).includes(key)) {
      fail('standard-keys-only', `non-standard frontmatter key: ${key}`);
    }
  }

  const name = data.name;
  if (typeof name !== 'string' || name.length === 0) {
    fail('name-required', 'name is missing or not a string');
  } else {
    if (!NAME_PATTERN.test(name)) fail('name-pattern', `name "${name}" is not lowercase-hyphen-separated`);
    if (name.length > MAX_NAME) fail('name-length', `name is ${name.length} characters, max ${MAX_NAME}`);
    const dir = basename(dirname(skillPath));
    if (name !== dir) fail('name-matches-directory', `name "${name}" does not match directory "${dir}"`);
  }

  const description = data.description;
  if (typeof description !== 'string' || description.trim().length === 0) {
    fail('description-required', 'description is missing or empty');
  } else {
    if (description.length > MAX_DESCRIPTION) {
      fail('description-length', `description is ${description.length} characters, max ${MAX_DESCRIPTION}`);
    }
    const pronoun = description.match(PRONOUNS);
    if (pronoun) fail('description-third-person', `description uses first or second person: "${pronoun[0]}"`);
  }

  return violations;
}
