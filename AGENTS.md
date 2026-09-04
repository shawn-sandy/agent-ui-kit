# Repository Guidelines

## Project Structure & Module Organization

This repository publishes vendor-neutral UI component skills. `docs/component-spec.md`
is the authoring contract and wins over this file on any conflict. The canonical
component content lives under `skills/ui-<component>/`: `SKILL.md` contains trigger
guidance, `references/ui-<component>.md` contains the contract, HTML, CSS, JS, and
accessibility notes, `references/demo.html` is the self-contained browser demo, and
`references/react-demo.tsx` is the required typed React projection reference. Keep
shared documentation in `docs/`, evaluation scenarios in `evals/`, automation in
`scripts/`, and tests in `tests/` (`unit`, `integration`, and `e2e`). Plugin
manifests live in `.codex-plugin/` and `.claude-plugin/`.

A skill that performs a procedure over a project instead of shipping a component
declares `metadata.kind: workflow` in its `SKILL.md` and is exempt from the component
gates only. Anything short of that exact value is treated as a component.

## Build, Test, and Development Commands

- `npm install` installs the Node dependencies.
- `npx playwright install chromium` installs the browser used by E2E tests.
- `npm test` runs Vitest over `tests/**/*.spec.ts`, excluding `tests/e2e/`.
- `npm run test:e2e` runs the Playwright browser suite in `tests/e2e/`.
- `node scripts/build-demos.mjs` regenerates demo code from each reference.
- `node scripts/build-demos.mjs --check` verifies demos are not stale.
- `node scripts/build-properties.mjs` regenerates `docs/properties.md`.
- `node scripts/build-tokens.mjs` regenerates `skills/ui-theme/references/auk.tokens.json`
  and `auk-roles.css`.
- `node scripts/build-design.mjs` regenerates `docs/designs/components/index.html`.
- `npm run check` runs the full local gate: Vitest, portability lint, resource
  checks, demo freshness, plugin manifest validation, and Playwright.

Those four scripts own their output. Never hand-edit a generated file. Stale demo
regions fail gate 4 (`build-demos.mjs --check`); `docs/properties.md`, the two
`ui-theme` token files and the component sheet each have an integration test under
`tests/integration/` that fails when they drift. Edit the reference, then re-run the
generator.

## Coding Style & Naming Conventions

Use ESM syntax for scripts and TypeScript tests. Match the existing style:
2-space indentation, single quotes, semicolons, and concise comments only where
they explain a non-obvious constraint. Skill names and directories must be
`ui-<component>` with single inner hyphens. Component slugs stay unprefixed for
the public DOM contract: root classes use `auk-<component>`, parts use
`data-part`, variants use `data-variant`, and custom properties use
`--auk-<component>-<property>`. A reference's whole css block is wrapped in
`@layer auk { }`, so a plain rule in the consuming project beats it whatever the load
order. Component reference prose should wrap near 88 columns; tables and code may
exceed that when clearer, and a `SKILL.md` body stays under 100 lines.

## Testing Guidelines

Every new or changed component needs a matching `tests/e2e/ui-<component>.spec.ts`
covering the WCAG claims made in its reference, with each test title starting with
the criterion it proves, and an `evals/ui-<component>.json` holding at least three
scenarios whose kinds include `obvious`, `oblique` and `adjacent`. Both are asserted
by `tests/objective.spec.ts`. Unit and integration tests use Vitest naming like
`tests/unit/frontmatter.spec.ts` and `tests/integration/manifests.spec.ts`. Do not
claim measured accessibility values in documentation unless an E2E assertion verifies
them. Keep demos self-contained: no network resources, package imports, framework
names, preprocessors, or split CSS/JS under `skills/`. The one file exempt from the
portability lint is `references/react-demo.tsx`.

## Commit & Pull Request Guidelines

History uses Conventional Commits, for example `docs: add component authoring
specification`, `feat: vendor-neutral UI component skills`, and `chore: scaffold
agent-ui-skills repository structure`. Use the same format for new commits. Pull
requests should summarize the affected skill or script, note contract or demo
changes, link issues when available, and report `npm run check` results. Include
screenshots or demo notes for visible component changes.

## Agent-Specific Instructions

Edit `references/ui-<component>.md` first, then regenerate `demo.html`; do not
hand-maintain generated demo regions. Keep the `skills/` tree portable across
Codex and Claude Code, and update both plugin manifests only when their shared
contract changes.
