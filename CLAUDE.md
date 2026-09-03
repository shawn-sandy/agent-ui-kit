# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Agent UI Kit ships accessible UI components as vendor-neutral Agent Skills, not as an
installable library. An agent reads `skills/<name>/references/<name>.md` and builds the
component into the user's own project; nothing is installed into the consuming app. No
framework, no build step, no runtime dependency - all deliberate.

`docs/component-spec.md` is the full authoring contract. Read it before creating or
editing anything under `skills/`.

## Commands

```
npm ci && npx playwright install chromium   # first-time setup
npm run check                               # the single local gate (six gates)
bash scripts/check.sh --prove               # what CI runs; also proves each gate can fail
npm test                                    # vitest only - the fast inner loop
npm run test:e2e                            # Playwright only
node scripts/build-demos.mjs                # regenerate demos from references
```

There is no lint, format, or typecheck script and no ESLint/Prettier/Biome config. Do not
add one. "Lint" here means `node scripts/lint-portability.mjs`, invoked from `check.sh`.

Gate 5 shells out to `claude plugin validate . --strict`, so the `claude` CLI must be on
PATH for `npm run check` to pass.

## Component code exists twice

`references/<name>.md` is the source. `references/demo.html` is generated from it - the
demo *is* the template, and `build-demos.mjs` rewrites only its marker-delimited regions.
Edit the reference, then run `node scripts/build-demos.mjs`. Never hand-edit a generated
region; the markup, page chrome and wiring outside those regions are hand-written and are
yours to edit.

## Portability rules for skills/

These keep one tree loading in both Claude Code and Codex. Each is enforced by a gate.

- No external resource loads: no `<link href>`, `src`/`srcset`, `@import`, or `url()`.
  `data:` URIs, `url(#...)` and `<a href="#...">` stay allowed. A component split across
  sibling files passes headless Chrome and then fails in a real browser opened from disk.
- No `${CLAUDE_PLUGIN_ROOT}` - Codex does not expand it. Use relative paths.
- Frontmatter takes only Agent Skills standard keys. `disable-model-invocation` and `hint`
  are Claude Code extensions and are rejected.
- No package imports and no install instructions inside a reference.
- Put disambiguating phrases early in a `description`. Codex truncates descriptions under
  a context budget, so a trailing clause is lost.

## Writing rules

- Wrap prose at 88 columns. Tables, code fences and contract cells are exempt.
- Never estimate a measured number into a reference. Either `tests/e2e/` measures it at
  runtime or the claim does not go in.
- Every WCAG criterion in a contract table needs a test in `tests/e2e/<name>.spec.ts`
  whose title starts with that criterion. A row without its test fails the build.
- `version` must agree across `package.json`, `.claude-plugin/plugin.json` and
  `.codex-plugin/plugin.json`; `tests/integration/manifests.spec.ts` asserts it.

## Tests

`tests/fixtures/` holds deliberately broken skills, kept outside `skills/` so the real
gates stay clean. They are not bugs - do not fix them. `check.sh --prove` runs them to
confirm each gate can still fail.
