# Repository Guidelines

## Project Structure & Module Organization

This repository publishes vendor-neutral UI component skills. The canonical
component content lives under `skills/<component>/`: `SKILL.md` contains trigger
guidance, `references/<component>.md` contains the contract, HTML, CSS, JS, and
accessibility notes, and `references/demo.html` is the self-contained browser
demo. Keep shared documentation in `docs/`, evaluation scenarios in `evals/`,
automation in `scripts/`, and tests in `tests/` (`unit`, `integration`, and
`e2e`). Plugin manifests live in `.codex-plugin/` and `.claude-plugin/`.

## Build, Test, and Development Commands

- `npm ci` installs the locked Node dependencies.
- `npx playwright install chromium` installs the browser used by E2E tests.
- `npm test` runs Vitest over `tests/**/*.spec.ts`, excluding `tests/e2e/`.
- `npm run test:e2e` runs the Playwright browser suite in `tests/e2e/`.
- `node scripts/build-demos.mjs` regenerates demo code from each reference.
- `node scripts/build-demos.mjs --check` verifies demos are not stale.
- `npm run check` runs the full local gate: Vitest, portability lint, resource
  checks, demo freshness, plugin manifest validation, and Playwright.

## Coding Style & Naming Conventions

Use ESM syntax for scripts and TypeScript tests. Match the existing style:
2-space indentation, single quotes, semicolons, and concise comments only where
they explain a non-obvious constraint. Component names are lowercase directory
names with single inner hyphens. Root classes use `auk-<component>`, parts use
`data-part`, variants use `data-variant`, and custom properties use
`--auk-<component>-<property>`. Component reference prose should wrap near 88
columns; tables and code may exceed that when clearer.

## Testing Guidelines

Every new or changed component needs a matching `tests/e2e/<component>.spec.ts`
covering the WCAG claims made in its reference. Unit and integration tests use
Vitest naming like `tests/unit/frontmatter.spec.ts` and
`tests/integration/manifests.spec.ts`. Do not claim measured accessibility values
in documentation unless an E2E assertion verifies them. Keep demos self-contained:
no network resources, package imports, framework names, preprocessors, or split
CSS/JS under `skills/`.

## Commit & Pull Request Guidelines

History uses Conventional Commits, for example `docs: add component authoring
specification`, `feat: vendor-neutral UI component skills`, and `chore: scaffold
agent-ui-kit repository structure`. Use the same format for new commits. Pull
requests should summarize the affected skill or script, note contract or demo
changes, link issues when available, and report `npm run check` results. Include
screenshots or demo notes for visible component changes.

## Agent-Specific Instructions

Edit `references/<component>.md` first, then regenerate `demo.html`; do not
hand-maintain generated demo regions. Keep the `skills/` tree portable across
Codex and Claude Code, and update both plugin manifests only when their shared
contract changes.
