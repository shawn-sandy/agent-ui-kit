# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

`docs/component-spec.md` is the authoring contract and wins over this file on any
conflict. Read it before creating or editing anything under `skills/`.

## What this is

Agent UI Skills ships accessible UI components as vendor-neutral Agent Skills, not as an
installable library. An agent reads `skills/ui-<component>/references/ui-<component>.md`
and builds the component into the user's own project; nothing is installed into the
consuming app. No framework, no build step, no runtime dependency - all deliberate.

## Commands

```
npm install && npx playwright install chromium   # first-time setup
npm run check                               # the single local gate (six gates)
bash scripts/check.sh --prove               # what CI runs; adds failure proofs for gates 1-4
npm test                                    # vitest only - the fast inner loop
npm run test:e2e                            # Playwright only
node scripts/build-demos.mjs                # regenerate demos from references
```

There is no lint, format, or typecheck script and no ESLint/Prettier/Biome config.
Do not add one. "Lint" here means `node scripts/lint-portability.mjs`, run from
`check.sh`.

Gate 5 shells out to `claude plugin validate . --strict`, so the `claude` CLI must be on
PATH for `npm run check` to pass. `--prove` re-runs gates 1-4 against the broken
fixtures; gates 5 and 6 have no failure proof, so a silently weakened Playwright suite
or manifest check would not be caught by it.

## Component code exists twice

`references/<name>.md` is the source. `references/demo.html` is generated from it - the
demo *is* the template, and `build-demos.mjs` rewrites only the regions delimited by the
`Generated from <name>.md` marker comment. Edit the reference, then run
`node scripts/build-demos.mjs`. Never hand-edit a generated region; the markup, page
chrome and wiring outside those markers are hand-written and are yours to edit.

The marker embeds the component's own name, so a demo copied from another component must
have its marker line renamed before the build can find the region.

## Adding a component

Skill names and directories use `ui-<component>`. The public component slug stays
unprefixed, so `skills/ui-button/` still ships `auk-button`, `--auk-button-*`,
`initButton` and `AukButtonProps`.

Beyond `SKILL.md`, the reference and the demo, two files are required and easy to miss:

- `tests/e2e/ui-<component>.spec.ts` - every WCAG criterion in the contract table needs a test
  whose title starts with that criterion, matched by prefix in
  `tests/objective.spec.ts`.
- `evals/ui-<component>.json` - at least three scenarios whose kinds include `obvious`,
  `oblique` and `adjacent`. Asserted by `tests/objective.spec.ts`.

`/new-component` walks the whole running order.

## Portability rules for skills/

These keep one tree loading in both Claude Code and Codex. They apply to the top-level
`skills/` tree only - `scripts/lint-portability.mjs` and `tests/objective.spec.ts` both
resolve `skills/` from the repo root, so files under `.claude/` are out of scope.

`scripts/lint-portability.mjs` rejects, anywhere in a file including prose:

- `${CLAUDE_PLUGIN_ROOT}` - Codex does not expand it. Use relative paths.
- The `disable-model-invocation` and `hint` frontmatter keys - Claude Code extensions.
- Windows backslash paths.
- The words React, Vue, Svelte, Angular, Next.js, Tailwind, jQuery, styled-components,
  SCSS, Sass, LESS, Stylus, PostCSS. A sentence like "unlike React's controlled inputs"
  fails the build.
- Package imports, and any `npm`/`yarn`/`pnpm` install instruction.

Separately, the `no_external_refs` grep in `check.sh` rejects `<link ... href=`,
`src=`, `srcset=`, `@import` and `url(`. Only three exact spellings are exempt:
`src="data:`, `url(data:` and `url(#` - so `href="data:...` and a quoted
`url("#grad")` still fail. An `<a href="#...">` is fine.

Put disambiguating phrases early in a `description`. Codex truncates descriptions
under a context budget, so a trailing clause is lost.

## Writing rules for skills/

- `description` must be third person and free of first- and second-person pronouns
  (`tests/lib/frontmatter.ts`). The reflex phrasing "Use when you need..." fails.
- `name` must match the directory and start with `ui-`.
- `SKILL.md` body under 100 lines, with no component code fences.
- Wrap reference prose at 88 columns. Tables, code fences, contract cells and the
  qualifier line are exempt.
- Never estimate a measured number into a reference. Either `tests/e2e/` measures it at
  runtime or the claim does not go in.

`version` must agree across `package.json`, `.claude-plugin/plugin.json` and
`.codex-plugin/plugin.json`; `tests/integration/manifests.spec.ts` asserts it.

## Tests

`tests/fixtures/` holds deliberately broken skills, kept outside `skills/` so the real
gates stay clean. They are not bugs - do not fix them. `check.sh --prove` runs them to
confirm gates 1-4 can still fail.

## Project overview artifact

A living overview of the project - goal, how the format works, what ships, gates,
evidence, status and roadmap - is published as a claude.ai artifact at
https://claude.ai/code/artifact/3474b8f0-f906-4f3a-95f7-45c9cf539de3. It is private
to the maintainer's account unless shared from the page.

Refresh it when the project moves: a merge that adds or changes a skill, a version
bump, a plan changing status, or a new issue or pull request worth showing. Read the
artifact with the Artifact tool, then update the meta strip (version, skill count,
main SHA, CI state on main, open issue count, date), re-source each section from
README, `docs/plans/*.md` frontmatter, `docs/evaluations.md`, `docs/vendor-support.md`
and the GitHub issues and pull requests, add a row to the page-history table at the
bottom, and republish to the same URL so the link never changes.
