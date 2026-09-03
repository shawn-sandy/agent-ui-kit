---
status: todo
type: feature
created: 2026-09-03
repo-name: agent-ui-skills
workflow: never
artifact-url: https://claude.ai/code/artifact/dee6ed17-545d-4356-b5ba-2063e66d4436
issue: https://github.com/shawn-sandy/agent-ui-skills/issues/15
glance: The browser suite today drives a demo page the maintainer wrote by hand, so it can stay green while the reference text still misleads an agent. This keeps what the real agent builds from each skill in an ignored build folder and checks it against the component's own contract. Done means one command fills the folder, one command tests it, a deliberately broken build fails, and none of it can reach an installer.
---

# Plan: Prove each skill by testing what an agent actually builds from it

## Objective

Keep the components the real agent builds from every skill in a gitignored `build/`
folder and run contract-driven browser tests over them, so a skill is proven by the
output it produces and not only by its hand-written demo.

## Context

The repository's six gates test the files a maintainer wrote. The browser suite opens
`skills/ui-<component>/references/demo.html`, a page written by hand around the
generated component code, and drives it with the keyboard. That proves the code in the
reference works. It does not prove that an agent reading the reference produces a
correct component, and that agent-built component is the only thing a consumer of
these skills ever receives.

The generation half already exists. `scripts/run-evals.mjs` in `skills` mode starts
`claude -p --plugin-dir .` once per scenario and model inside a private workspace, lets
the agent edit files there, and records which skill fired. It already reads
`EVAL_SANDBOX` to decide where workspaces go and `EVAL_PROJECT` for the starter
project each workspace gets a fresh copy of. Three gaps remain. The workspaces land in
the system temp folder and are forgotten. Nothing looks at the files the agent wrote;
the runner only scores whether the right skill was invoked. And no starter project is
committed, so `EVAL_PROJECT` has to point at a folder that exists only on the
maintainer's machine, even though `docs/vendor-support.md` records that no skill fires
without a concrete file to edit.

The existing browser specs cannot be reused for builds. `tests/e2e/ui-popover.spec.ts`
finds elements by the demo's ids, such as `#filters-trigger`. An agent building a
column chooser for a table uses its own ids and its own copy. The build tests find the
component by its public contract instead: the `auk-<component>` root class, the
`data-part` names and the roles listed in the reference's contract table. A build with
no markers is a build where the skill failed to enforce its own contract. That is the
finding this layer exists to surface, so it counts as a failure rather than as noise.

The build folder cannot leak to an installer. The Claude Code plugin marketplace and
`npx skills add` both copy the repository as it exists on GitHub; the comment above the
lockfile rule in `.gitignore` records exactly this. Neither installer copies anything
into a user's project, because the agent writes the component there itself. A folder
that never reaches GitHub therefore never reaches an installer or a user. As a second
guard, `tests/integration/internal-skills.spec.ts` already fails on any stray
`SKILL.md` in the tree, which covers the mistake of committing the folder anyway.

Three risks shape the design. Model calls cost money and their output varies from run
to run, so the sweep is opt-in and never joins the six gates or continuous
integration, which has no signed-in `claude` CLI anyway. Haiku frequently builds
without consulting any skill, as `docs/evaluations.md` records, and such a build says
nothing about the reference; the suite skips those builds and prints the reason.
Vitest's include pattern `tests/**/*.spec.ts` would collect the new folder and try to
run browser specs under plain Node, so the folder is excluded explicitly. React output
is out of scope for this plan: nothing in the repository renders a `.tsx` file in a
browser, and doing so needs three new development dependencies.

## Decisions

- The `build` command is `run-evals.mjs` in `skills` mode with `EVAL_SANDBOX` pointed at `build/`, not a second runner. The existing runner already starts the agent, isolates each run in its own folder and records which skill fired; a copy would drift from it.
- Contract specs locate a component by its contract markers (`auk-<component>` root class, `data-part`, roles) and never by ids. Agent output carries its own ids, and the markers are the contract the reference promises.
- A build whose run is recorded as `correct: false` in `evals/results/skills-isolated.json` is skipped with the reason "skill did not fire". Such a build measures triggering, which the evaluations already measure; testing it would blame the reference for a decision the model made before reading it.
- Adjacent scenarios never enter the build suite. They assert the skill stays quiet, so the component is not expected to exist in that build.
- The sweep is opt-in and stays out of `scripts/check.sh` gates and CI. It needs a signed-in `claude` CLI and costs model calls, and a red CI run caused by model variance would say nothing about the code.
- The self-test, a good fixture that passes and a broken fixture that fails, joins `scripts/check.sh --prove`. It needs no model call, and the repository's rule is that every gate must be shown able to fail.
- Steps are single-pass rather than red-green-verify phases. The deliverable is the tests and their fixtures; the broken-fixture step is the red run.
- Only plain HTML builds are tested in this plan. React builds need `esbuild`, `react` and `react-dom` plus a harness page, and are listed under Next Steps.
- The `.gitignore` rule is `/build/`, anchored at the root. An unanchored `build/` would also hide a future folder of that name anywhere in the tree.

## Files

- .gitignore (modified) — ignore /build/
- tests/integration/internal-skills.spec.ts (modified) — add build to the walk's skip pattern
- evals/project/index.html (new) — the starter page every build run gets its own copy of
- scripts/run-evals.mjs (modified) — default EVAL_PROJECT to evals/project
- scripts/eval.sh (modified) — build subcommand and usage text
- package.json (modified) — test:build script
- playwright.build.config.ts (new) — Playwright config whose testDir is tests/build
- vitest.config.ts (modified) — exclude tests/build/**
- tests/build/support.ts (new) — pagesFor(skill): find builds, skip non-firing ones, reuse the e2e helpers
- tests/build/ui-popover.spec.ts (new) — popover contract spec, the worked example
- tests/build/ui-button.spec.ts (new) — button contract spec
- tests/build/ui-alert.spec.ts (new) — alert contract spec
- tests/build/ui-dialog.spec.ts (new) — dialog contract spec
- tests/build/ui-tabs.spec.ts (new) — tabs contract spec
- tests/build/ui-box.spec.ts (new) — box contract spec
- tests/fixtures/builds/run-good-ui-popover-obvious/index.html (new) — a build that honours the popover contract
- tests/fixtures/builds/run-bad-ui-popover-oblique/index.html (new) — the same page with role="group" removed
- tests/objective.spec.ts (modified) — every component needs tests/build/<name>.spec.ts
- scripts/check.sh (modified) — --prove block for the build suite
- docs/component-spec.md (modified) — sections 6, 7 and the section 8 checklist name the build spec
- .claude/skills/new-component/SKILL.md (modified) — step 6 also writes the build spec
- README.md (modified) — Verifying it section describes the sweep
- CLAUDE.md (modified) — commands block and a note that build/ is ignored and never installed
- docs/evaluations.md (modified) — Build row in the run table and the first sweep's results

## Steps

1. Add `/build/` to `.gitignore` and add `build` to the `SKIP` pattern in
   `tests/integration/internal-skills.spec.ts`. Why: the build folder holds agent output
   that must never reach GitHub, and so never reach either installer; the skip keeps the
   whole-repository `SKILL.md` walk out of workspaces that may hold a copied
   `node_modules`. Verify: `git check-ignore -v build/anything` prints the `.gitignore`
   rule and `npx vitest run tests/integration` exits 0.
2. Commit `evals/project/index.html`, a plain page with a heading, a table under a
   toolbar, a short form with a save button and a "Delete workspace" button, and make
   `scripts/run-evals.mjs` default `FIXTURE_PROJECT` to that folder when `EVAL_PROJECT`
   is unset. Why: every scenario prompt names `index.html`, and `docs/vendor-support.md`
   records that no skill fires without a concrete file to edit; today that file exists
   only on the maintainer's machine. Verify: `test -f evals/project/index.html` and
   `node --check scripts/run-evals.mjs` both exit 0, and `grep -n "evals/project"
   scripts/run-evals.mjs` shows the default.
3. Add a `build` subcommand to `scripts/eval.sh` that runs `EVAL_SANDBOX="$PWD/build"
   node scripts/run-evals.mjs skills`, and list it in the usage text. Why: one
   remembered command fills `build/` and still writes
   `evals/results/skills-isolated.json`, which the build suite reads to know which runs
   actually used the skill. Verify: `scripts/eval.sh` with no argument prints usage
   naming `build`; then `EVAL_MODELS=sonnet scripts/eval.sh build` (eighteen model calls)
   leaves one `build/run-sonnet-<scenario>` folder per scenario, each holding
   `index.html`, and `evals/results/skills-isolated.json` lists eighteen rows.
4. Add `playwright.build.config.ts` with `testDir: './tests/build'`, add
   `"test:build": "playwright test -c playwright.build.config.ts"` to `package.json`,
   and add `tests/build/**` to the exclude list in `vitest.config.ts`. Why: the default
   Playwright config is gate 6 and must keep running only `tests/e2e`; vitest's include
   pattern would otherwise try to run browser specs under plain Node and fail. Verify:
   `npm test` exits 0 and its output never mentions `tests/build`, and `npx playwright
   test --list` prints the same test count as before this step.
5. Write the two fixture builds under `tests/fixtures/builds/`:
   `run-good-ui-popover-obvious/index.html` holding the Structure block from
   `skills/ui-popover/references/ui-popover.md` with its CSS and module inlined, and
   `run-bad-ui-popover-oblique/index.html` as the same page with `role="group"` deleted
   from the popover root. Why: the repository's rule is that a gate must be shown able to
   fail, and the good twin guards against a spec so broken that it fails everything.
   Verify: `grep -c 'role="group"'` prints 1 for the good file and 0 for the bad one,
   and neither file matches the `no_external_refs` pattern in `scripts/check.sh`.
6. Write `tests/build/support.ts` exporting `pagesFor(skill)`, which lists
   `<BUILD_DIR or build>/run-*-<skill>-{obvious,oblique}/index.html` as `file://` URLs,
   marks a page skipped with the reason "skill did not fire" when
   `evals/results/skills-isolated.json` records `correct: false` for that run, and
   re-exports `tabTo`, `activeId`, `expectFocus` and `focusOutlineWidth` from
   `tests/e2e/support.ts`; then write `tests/build/ui-popover.spec.ts`, which for each
   page asserts that every `.auk-popover` root carries the `popover` attribute,
   `role="group"` and an `aria-labelledby` that resolves to an element, that at least one
   `[popovertarget]` trigger sits outside the root, that clicking it opens the popover
   (`:popover-open`) and sets `aria-expanded="true"`, that Escape closes an `auto`
   popover and returns focus to the trigger, and that axe reports no violations with the
   popover open. Why: the popover is the worked example because its contract has the
   most markers, and the step 5 fixtures let the spec be proven with no model call.
   Verify: `BUILD_DIR=tests/fixtures/builds npm run test:build` exits non-zero, the
   run-good group passes, and the run-bad group fails on the `role="group"` assertion,
   which is named in the output.
7. Port the same shape to `tests/build/ui-button.spec.ts`, `ui-alert.spec.ts`,
   `ui-dialog.spec.ts`, `ui-tabs.spec.ts` and `ui-box.spec.ts`, each keying on its own
   contract row: the button is a `<button>` with `auk-button`, is reachable by Tab, and
   never uses the native `disabled` attribute for an unavailable state; the alert has
   `auk-alert` with `role="alert"` or `role="status"` present in the markup at load; the
   dialog is a `<dialog>` with `auk-dialog` that an opener shows modally, closes on Escape
   and returns focus to the opener; the tabs expose `tablist`, `tab` and `tabpanel`
   roles with exactly one tab at `tabindex="0"` and ArrowRight moving selection; the box
   has an `auk-box` root; and every spec runs axe. Why: each spec asserts only the rows of
   its contract table, so a build that passes has honoured the reference and a build that
   fails names the row it missed. Verify: `npx playwright test -c
   playwright.build.config.ts --list` shows one group per obvious and oblique build folder
   for each of the six skills, and `npm run test:build` against the step 3 sweep finishes
   with a per-build report of passes, failures and skips, whatever the numbers are.
8. Add an `it` to `tests/objective.spec.ts` asserting `tests/build/<name>.spec.ts` exists
   and contains at least one `test(` call, then state the requirement in
   `docs/component-spec.md` sections 6 and 7 and the section 8 checklist, and in step 6
   of `.claude/skills/new-component/SKILL.md`. Why: the suite is data-driven over
   `skills/`, so a seventh component would otherwise ship with no build spec and nothing
   would notice. Verify: `npx vitest run tests/objective.spec.ts` exits 0; moving one
   build spec aside makes it fail naming the missing file, and restoring the file makes
   it pass again.
9. Add a `--prove` block to `scripts/check.sh` that runs the build suite with
   `BUILD_DIR=tests/fixtures/builds` and `--reporter=list`, capturing output rather than
   piping it, and passes only when the exit status is non-zero, the run-good group is
   reported passed, and the run-bad group is reported failed with `role="group"` in its
   message. Why: this is the same proof the other gates carry, and without it a build spec
   that stopped asserting anything would go unnoticed for good. Verify: `bash
   scripts/check.sh --prove` prints "ok: the build suite fails a build that drops the
   popover role" and the six gates above it report the same results as before.
10. Document the sweep: add a paragraph to the README's "Verifying it" section, add
    `scripts/eval.sh build` and `npm run test:build` to the CLAUDE.md commands block with
    a line that `build/` is ignored and never installed, add a Build row to the run table
    in `docs/evaluations.md`, and after the first sweep record its per-skill results
    there by hand, failures and skips included. Why: the layer is opt-in, so it only
    gets run if the docs say when and how, and the repository's convention is that the
    reviewable record is prose in `docs/evaluations.md` rather than the raw results
    folder. Verify: `grep -n "test:build" README.md CLAUDE.md` and `grep -n "Build"
    docs/evaluations.md` each hit, and the recorded table matches the sweep's terminal
    output line for line.

## Tests

Tier 1 — This plan changes application code
- Objective: the contract suite passes a build that honours the popover contract and fails one that drops its role. File: tests/build/ui-popover.spec.ts; Type: smoke; Asserts: with BUILD_DIR=tests/fixtures/builds the run-good group passes and the run-bad group fails naming role="group"; Run: BUILD_DIR=tests/fixtures/builds npx playwright test -c playwright.build.config.ts
- E2E: one contract spec per component over every kept build. File: tests/build/ui-<component>.spec.ts; Targets: build/run-*-<component>-{obvious,oblique}/index.html; Key cases: contract markers present, keyboard open and close, focus return, zero axe violations, skipped with reason when the skill did not fire
- Integration: every component ships a build spec. File: tests/objective.spec.ts; Targets: tests/build/; Key cases: missing spec file, spec file with no test( call
- Integration: the prove path can fail. File: scripts/check.sh; Targets: the --prove block; Key cases: non-zero exit, run-good reported passed, run-bad reported failed with role="group" named

## Acceptance Criteria

- [ ] `git check-ignore build/anything` exits 0, and `git status` after a sweep lists nothing under build/.
- [ ] `EVAL_MODELS=sonnet scripts/eval.sh build` leaves one `build/run-sonnet-<scenario>/index.html` per scenario and writes `evals/results/skills-isolated.json`.
- [ ] `npm run test:build` reports one group per obvious and oblique build folder for all six skills, and skips a build whose skill did not fire while printing that reason.
- [ ] `BUILD_DIR=tests/fixtures/builds npm run test:build` exits non-zero with the run-good group passed and the run-bad group failed on the `role="group"` assertion.
- [ ] `bash scripts/check.sh --prove` prints the build-suite ok line, and all six gates pass with `build/` populated.
- [ ] `npm test` passes and never collects a file under `tests/build/`.
- [ ] `npx vitest run tests/objective.spec.ts` fails when any `tests/build/ui-<component>.spec.ts` is missing.
- [ ] README.md, CLAUDE.md, docs/component-spec.md and docs/evaluations.md name the build sweep, and docs/evaluations.md holds the first sweep's per-skill results.

## Verification

Run the whole loop once on a clean tree. `EVAL_MODELS=sonnet scripts/eval.sh build`
must finish with eighteen `build/run-sonnet-*` folders and a fresh
`evals/results/skills-isolated.json`. `npm run test:build` must then print one group per
obvious and oblique build, twelve in all, each either passed, failed with the contract
row named, or skipped with "skill did not fire". Record that report in
`docs/evaluations.md` exactly as printed.

With `build/` still populated, `bash scripts/check.sh --prove` must exit 0, print the
same results for the six gates as before this plan, and print the new ok line for the
build suite. `git status` must show only the files this plan changed and nothing under
`build/`.

Open one kept build in a real browser, for example
`build/run-sonnet-ui-popover-obvious/index.html`, click its trigger and press Escape.
The popover must open beside the trigger and close on Escape, matching what the demo
does. This is the human check that the automated suite is meant to stand in for, and it
is worth doing once by hand.

## Next Steps

- Test React builds too
  Needs `esbuild`, `react` and `react-dom` as development dependencies and a harness page that mounts each `Auk<Component>Demo` from `references/react-demo.tsx`, so the same contract specs can run over a React projection. Wish list until plain HTML builds have been swept a few times.
  ```text
  In the agent-ui-kit repository, extend the build layer from
  docs/plans/add-build-layer-for-agent-built-components.md to React output. Add
  esbuild, react and react-dom as devDependencies, add scripts/build-react.mjs that
  bundles each skills/ui-<component>/references/react-demo.tsx into
  build/react-<component>/index.html mounting Auk<Component>Demo, and teach
  tests/build/support.ts to include those pages in pagesFor(skill). Do not change
  the contract specs. Verify with npm run test:build showing a react-<component>
  group per skill, all passing, and bash scripts/check.sh --prove still green.
  ```
- Skip adjacent scenarios in build mode
  Adjacent scenarios assert that a skill stays quiet, so their builds are never tested; skipping them in `scripts/eval.sh build` cuts each sweep by a third. Add a `--skill` filter at the same time so one component can be rebuilt alone.
  ```text
  In the agent-ui-kit repository, add an EVAL_KINDS environment variable to
  scripts/run-evals.mjs that filters scenarios by kind, and an EVAL_SKILL variable
  that filters by skill id. Make scripts/eval.sh build set EVAL_KINDS=obvious,oblique
  and pass an optional skill argument through as EVAL_SKILL. Keep scripts/eval.sh
  skills unfiltered so evaluations still measure adjacent scenarios. Verify with
  EVAL_MODELS=sonnet scripts/eval.sh build ui-popover leaving exactly two
  build/run-sonnet-ui-popover-* folders, and npm test still green.
  ```
- Consumer-side check after a skill builds a component
  A dependency-free Node script that statically checks the file an agent just wrote for the contract markers, shipped as an internal skill under `.claude/skills/` so it stays out of the portability lint and the public install list. Claude Code only, by construction.
  ```text
  In the agent-ui-kit repository, add .claude/skills/check-build/SKILL.md with
  metadata.internal: true and a scripts/check-build.mjs that takes a file path and a
  component slug, reads the file, and exits non-zero if the auk-<slug> root class or
  any role from that component's contract table in
  skills/ui-<slug>/references/ui-<slug>.md is missing. No package imports. Verify
  with npx vitest run tests/integration passing, node scripts/check-build.mjs
  skills/ui-popover/references/demo.html popover exiting 0, and the same command
  against tests/fixtures/builds/run-bad-ui-popover-oblique/index.html exiting 1.
  ```

## Unresolved Questions

- Default model list for the build sweep
  ```text
  In the agent-ui-kit repository, scripts/run-evals.mjs defaults EVAL_MODELS to
  haiku,sonnet,opus, which makes a full build sweep fifty-four model calls. Read
  docs/evaluations.md for the per-model triggering results and recommend whether
  scripts/eval.sh build should default to sonnet alone, with the three-model sweep
  behind an explicit EVAL_MODELS. State the cost and the coverage lost either way.
  ```
- Whether a failing build sweep blocks a release
  ```text
  In the agent-ui-kit repository, read docs/evaluations.md and
  docs/plans/add-build-layer-for-agent-built-components.md, then recommend whether a
  failing build sweep should block a version bump or only be recorded in
  docs/evaluations.md the way triggering results are today. Consider that model
  output varies run to run and that the sweep cannot run in CI.
  ```

## Resources

- scripts/run-evals.mjs — the runner this plan reuses; `EVAL_SANDBOX`, `EVAL_PROJECT` and `workspaceFor` are the hooks it already has
- docs/evaluations.md — the reproduction section and the finding that Haiku often consults no skill at all
- docs/vendor-support.md — the finding that no skill fires without a concrete file to edit, which is why the starter project must be committed
- tests/e2e/ui-popover.spec.ts and tests/e2e/support.ts — the id-bound spec the contract spec replaces for builds, and the helpers it reuses
- tests/objective.spec.ts — the data-driven pattern the new assertion extends
- .gitignore — the lockfile comment recording that plugin install copies the repository
- scripts/check.sh — the --prove pattern the new self-test copies
