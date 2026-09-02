---
status: todo
type: feature
created: 2026-09-02
modified: 2026-09-02
repo-name: agent-ui-kit
artifact-url: https://claude.ai/code/artifact/aabf412c-2636-4254-9a21-615215b8c4ce
---

# Plan: Build vendor-neutral UI component skills

## Context

`agent-ui-kit` (github.com/shawn-sandy/agent-ui-kit) exists as structure only. The
scaffold commit `336b67a` created both plugin manifests, a marketplace manifest, an
empty `skills/` tree, and a README. No components, no format specification, no
tooling, no tests.

**What this project is.** A library of Agent Skills where each skill describes one UI
component and ships a complete, copyable reference: semantic HTML with a real
accessibility contract, plain CSS driven by custom properties, and dependency-free
JavaScript. An agent reads the reference and builds the component into the user's
project, in the user's stack. Nothing is installed into the consuming app.

**Why it is separate from `acss-plugins`.** `~/devbox/acss-plugins/plugins/acss-kit`
already has 15 `component-*` skills, but they generate React TSX plus SCSS modules
bound to `@fpkit/acss@6.5.0`. `agent-ui-kit` is bound to nothing. The decision was
extract-and-generalize, not greenfield, so this plan lifts specific assets:

- `acss-plugins/plugins/style-agent/docs/component-md/spec.md` — a 178-line alpha
  framework-neutral COMPONENT.md spec. Its core insight is correct and reusable:
  HTML structure, CSS, and the a11y contract are framework-agnostic; only template
  syntax and reactivity binding are framework-specific.
- `acss-plugins/plugins/acss-kit/skills/component-*/reference.md` — 15 references,
  161-615 lines each. **Only the accessibility contracts, prop models, and
  data-attribute variant strategy transfer. The TSX and SCSS templates do not.**

### Verified constraints from the Agent Skills spec

From agentskills.io/specification:

- `name`: max 64 chars, lowercase/digits/hyphens, no leading or trailing hyphen, no
  consecutive hyphens, **must match the parent directory name**.
- `description`: max 1024 chars, must state what the skill does *and* when to use it.
  This is the only text loaded at startup, so it is the entire discovery mechanism.
- Optional: `license`, `compatibility` (max 500), `metadata` (string→string map —
  `version` and `author` live here, not as top-level fields), `allowed-tools`.
- `SKILL.md` body under 500 lines. File references one level deep from `SKILL.md`.

From platform.claude.com skill authoring best practices:

- **Evaluations come before documentation.** Establish a baseline without the skill,
  then write the minimum needed to pass. At least three evaluations per skill.
- **Test across Haiku, Sonnet, and Opus.** What reads as sufficient to Opus can be
  too thin for Haiku.
- Descriptions in third person. Never "I can help you…" or "You can use this to…".
- Reference files over 100 lines need a table of contents, because a partial read is
  a real failure mode.

### Tooling reality

`skills-ref`, the reference validator at `github.com/agentskills/agentskills`, is a
Python package **explicitly labelled "for demonstration purposes only. It is not
meant to be used in production."** It has no PyPI release and installs via
`pip install -e .` from a clone. **It must not be a hard gate in CI.** This repo owns
its own frontmatter validator in the Vitest suite; `skills-ref` is an optional
manual cross-check only.

### Portability hazards found in `acss-kit` that must not be repeated

1. `${CLAUDE_PLUGIN_ROOT}` is a Claude Code variable. Codex does not expand it.
   All paths must be relative to the skill root.
2. `disable-model-invocation` and `hint` are Claude Code frontmatter, absent from the
   Agent Skills spec. A strict validator rejects them. Anything similar goes under
   `metadata:`.
3. `acss-kit` shells out to Python helper scripts. A cross-vendor skill cannot assume
   a Python runtime exists. Keep skills pure-markdown, or declare it in `compatibility:`.

### Prerequisites

Before step 1, the executing machine needs: Node 20+ with npm, the `claude` CLI on
`PATH` (already present — `claude plugin validate` ran during scaffolding), and
`gh` authenticated (confirmed). Python 3 and `uv` are needed only for the optional
`skills-ref` cross-check in step 10.

### Decisions already made, recorded so no future session re-litigates them

- **One skill per component.** Discovery quality beats startup token cost; ~100 tokens
  of description per skill is the accepted price.
- **Literal CSS, not token references.** Every themeable value ships as
  `var(--auk-<name>, <fallback>)`. The fallback makes a component work standalone; the
  variable makes it theme cleanly. The COMPONENT.md spec's `{colors.primary}` token
  refs become an **optional** mapping block, not a requirement, so no DESIGN.md file
  is needed for a component to function.
- **WCAG claims must come from a tool run.** Every reference states the criteria it
  satisfies, and those statements are asserted by axe-core plus explicit keyboard
  tests. An unverified claim is a defect.
- **v1 is four components** chosen to stress different parts of the format, not to be
  a useful kit: `button` (no JS), `alert` (ARIA live region), `dialog` (focus
  management and heavy JS), `tabs` (roving tabindex; deliberately absent from
  `acss-kit`, so it tests the greenfield path rather than the extraction path).

**Known environment note.** GitHub Actions is frequently billing-blocked on this
account. Every check must be runnable locally via a single script. CI mirrors that
script and is never the only place a check exists.

## Objective

Ship a working, tested, vendor-neutral component-skill format proven by four
components that reliably trigger across models and load correctly in both Claude Code
and ChatGPT/Codex.

## Steps

1. **Set up Node tooling.** Create `package.json` (private, type module) and install
   `vitest`, `@playwright/test`, `@axe-core/playwright`, and `gray-matter`. Add
   `.gitignore` entries for `node_modules/`, `test-results/`, `playwright-report/`.
   Add scripts: `test`, `test:e2e`, `check`.
   *Why:* Steps 3 onward all depend on a runner. The previous draft of this plan
   assumed `npm ci` would work in a repo with no `package.json`, which was wrong.
   *Verify:* `rm -rf node_modules && npm ci && npx vitest run --passWithNoTests` exits
   zero, and `npx playwright install chromium` completes.

2. **Write `docs/component-spec.md`** — the authoring contract, extracted from
   `acss-plugins/plugins/style-agent/docs/component-md/spec.md` and decoupled from
   DESIGN.md. It must define **both** halves, because the split between them is the
   core authoring decision and is currently undefined:
   - **`SKILL.md`** — frontmatter fields permitted (spec-defined keys only, third-person
     `description` stating what and when), and a body under 60 lines that orients and
     points at the reference. It must not contain the component code.
   - **`references/<name>.component.md`** — the frontmatter contract (`element`, `role`,
     `props` with `maps-to` and `a11y` notes, `slots`, `variants`, `behavior`, `a11y` as
     WCAG criteria, optional `tokens`) plus five required body sections: Structure
     (HTML), Styles (CSS), Behavior (JS), Accessibility, Demo. Reference files over 100
     lines carry a table of contents.
   - **Conventions:** the `--auk-` custom property prefix, the `var(--auk-x, fallback)`
     rule, `references/demo.html` as a standalone runnable page.
   *Why:* Every later step writes against this. Drafting components first bakes in an
   accidental format.
   *Verify:* Hand the spec plus zero other context to a fresh Claude instance and ask
   it to write the `button` reference. If it asks a clarifying question about
   structure, the spec is incomplete — fix it before step 3.

3. **Write the evaluations and establish a baseline, before any skill exists.** Create
   `evals/<skill>.json` for all four components, three scenarios each, in the shape
   Anthropic documents: `{skills, query, expected_behavior[]}`. Queries must be phrased
   the way a real user would ask, not using the skill's own vocabulary. Add
   `scripts/eval.sh` to print a scenario formatted for a run. Run all twelve against a
   session with no skills installed and record what Claude produces in
   `docs/evaluations.md` under a Baseline heading.
   *Why:* Anthropic's best-practices doc is explicit that evaluations precede
   documentation, so skills solve observed gaps rather than imagined ones. Without a
   baseline there is no evidence any skill improved anything.
   *Verify:* `docs/evaluations.md` contains twelve baseline results with concrete
   failures named — missing focus restoration, wrong `aria-live`, and so on. If a
   baseline scenario already passes without a skill, that component's scenario is too
   easy; rewrite it before continuing.

4. **Build the verification harness.** Create `scripts/check.sh` running four gates in
   order: (a) the Vitest unit suite including this repo's own frontmatter validator,
   (b) a portability lint grepping every `skills/**` file for `${CLAUDE_PLUGIN_ROOT}`,
   `disable-model-invocation`, `hint:`, and backslash paths, (c) `claude plugin
   validate . --strict`, (d) the Playwright E2E suite. `skills-ref` is **not** a gate.
   *Why:* Named before the work, per the verification rule. A harness written after
   components gets shaped to pass them.
   *Verify:* Add a broken fixture at `tests/fixtures/bad-skill/` with a
   name/directory mismatch and a `${CLAUDE_PLUGIN_ROOT}` reference. Point the unit
   suite at `tests/fixtures/` and confirm it exits non-zero naming both faults
   separately. Confirm the portability lint scans only `skills/**`, so the fixture
   never trips the real gate.

5. **Write `skills/button/`** — `SKILL.md`, `references/button.component.md`,
   `references/demo.html`. No JavaScript. Lift the accessibility contract from
   `acss-kit/skills/component-button/reference.md`, specifically the `aria-disabled`
   over native `disabled` decision that keeps the element in the tab order (WCAG 2.1.1).
   Discard the TSX and SCSS entirely.
   *Why:* The simplest possible component proves the format end to end before behavior
   complexity is added.
   *Verify:* `scripts/check.sh` passes. `tests/e2e/button.spec.ts` confirms axe reports
   zero violations and that a disabled button is still reachable by Tab but does not
   activate on Enter. All three `evals/button.json` scenarios now pass.

6. **Write `skills/alert/`** — ARIA live region, still no JavaScript.
   *Why:* Proves the a11y-claim machinery on a component whose entire value is the
   accessibility contract, where a wrong `aria-live` value is invisible to the eye.
   *Verify:* `tests/e2e/alert.spec.ts` asserts axe is clean and that content injected
   after load is announced — `role="alert"` present, `aria-live` resolving to
   `assertive`, and the region present in the DOM before content arrives. All three
   `evals/alert.json` scenarios pass.

7. **Write `skills/dialog/`** — native `<dialog>` plus a vanilla ES module for focus
   management. Lift the contract from `acss-kit/skills/component-dialog/reference.md`.
   *Why:* The hardest accessibility case in the v1 set. If the format cannot express
   focus trapping, `inert`, Escape handling, and focus restoration, that must surface
   now, not at component twenty.
   *Verify:* `tests/e2e/dialog.spec.ts` asserts axe is clean, focus moves into the
   dialog on open, Tab cycles only within it, Escape closes it, and focus returns to
   the exact element that opened it. All three `evals/dialog.json` scenarios pass.

8. **Write `skills/tabs/`** — roving tabindex, no `acss-kit` source to extract from.
   *Why:* Every other v1 component is an extraction. This one tests whether the spec
   from step 2 stands on its own when there is nothing to lift.
   *Verify:* `tests/e2e/tabs.spec.ts` asserts axe is clean, exactly one tab is in the
   tab order at a time, Arrow keys move selection, Home/End jump to first and last, and
   each panel is associated via `aria-controls` and `aria-labelledby`. All three
   `evals/tabs.json` scenarios pass.

9. **Run all twelve evaluations against Haiku, Sonnet, and Opus.** Record every result
   in `docs/evaluations.md` beside the baseline, so the before/after is one table.
   *Why:* Best practices call for testing across models — a description sufficient for
   Opus can fail to trigger on Haiku, and triggering is the entire discovery mechanism.
   Skipping this ships descriptions tuned to one model.
   *Verify:* Every scenario triggers its intended skill on all three models. Any miss
   is fixed by rewriting the `description` — not by adding body text, which loads too
   late to affect triggering — and then re-run. A miss that survives two rewrites gets
   documented as a known limitation rather than hidden.

10. **Prove cross-vendor installation manually, once, and write down what happened.**
    Install into Claude Code from the local directory and confirm all four skills load
    and are invocable. Place the same `skills/` tree at `.agents/skills/` and confirm
    Codex discovers it. Optionally cross-check with `skills-ref validate` from a
    throwaway clone.
    *Why:* Every other check tests the files. This is the only step that tests the
    README's actual claim, that one tree serves two vendors.
    *Verify:* Record the result in `docs/vendor-support.md`, including anything that did
    not work. If Codex discovery fails, that is a finding to document, not a step to
    quietly skip.

11. **Update `README.md`, bump both manifests to `0.2.0`, add
    `.github/workflows/check.yml` running `scripts/check.sh`.**
    *Why:* The README currently states components do not exist. Version bumps are how
    Claude Code decides whether to hand users an update.
    *Verify:* `scripts/check.sh` passes from a clean clone in a temp directory. If the
    Actions run fails, read `gh run view --log-failed` first — a billing block fails
    every job in seconds with no test output and is not a code defect.

## Tests

> Tier: 1 (code-touching — creates reference implementations, a JS module, and test files)

### Objective-Verification Test

- **File:** `tests/objective.spec.ts`
- **Type:** smoke test, data-driven over `skills/*/`
- **Asserts:** For every skill directory present, all three halves of the objective hold
  simultaneously: (1) its `SKILL.md` frontmatter conforms to the Agent Skills spec,
  (2) it contains no vendor-specific token (`${CLAUDE_PLUGIN_ROOT}`,
  `disable-model-invocation`, `hint:`, backslash paths), and (3) its
  `references/demo.html` returns zero axe-core violations. Iterates the directory
  rather than a hardcoded list, so every component added later is covered without
  editing the test.
- **Run:** `npx vitest run tests/objective.spec.ts`

### Skill Discovery Evaluations

- **Files:** `evals/button.json`, `alert.json`, `dialog.json`, `tabs.json`
- **Type:** triggering evaluations, three scenarios per skill, run semi-manually via
  `scripts/eval.sh`. Anthropic documents the format but ships no runner, so results are
  recorded by hand in `docs/evaluations.md`.
- **Targets:** the `description` field — whether a realistically-phrased user request
  activates the right skill.
- **Key cases:** per skill, one obvious request, one oblique request that avoids the
  skill's own vocabulary, and one adjacent request that must *not* trigger it. Run
  against Haiku, Sonnet, and Opus. Baseline results without any skill installed are
  recorded first, so improvement is measured rather than assumed.

### Unit Tests

- **File:** `tests/unit/frontmatter.spec.ts`
- **Targets:** this repo's own SKILL.md frontmatter validator, which replaces
  `skills-ref` as the enforcing gate.
- **Key cases:** `name` matches the parent directory name; `name` satisfies the spec
  regex including no-consecutive-hyphens and no-edge-hyphen; `description` is non-empty
  and ≤1024 chars; `description` is third person, rejecting a leading "I " or "You ";
  `description` contains a "use when" trigger phrase; only spec-defined keys appear at
  the top level. Each case is asserted against a fixture under `tests/fixtures/` that
  violates exactly that rule, so a passing test proves the rule can fail.

### Integration Tests

- **File:** `tests/integration/manifests.spec.ts`
- **Targets:** `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and
  `.codex-plugin/plugin.json` read together.
- **Key cases:** both plugin manifests declare the same `name` and the same `version`;
  the marketplace entry's `source: "./"` and `skills: ["./skills/"]` resolve to real
  directories; the Codex `skills` path resolves to the same directory Claude Code scans
  by default; every directory under `skills/` is reachable from both manifests.

### E2E Tests

- **Files:** `tests/e2e/button.spec.ts`, `alert.spec.ts`, `dialog.spec.ts`, `tabs.spec.ts`
- **Targets:** each component's `references/demo.html` driven in a real browser via
  Playwright, loaded from `file://` with no server and no build step.
- **Key cases:** per-component keyboard and focus behavior as listed in steps 5-8. Every
  WCAG criterion a reference claims in its `a11y:` frontmatter has a corresponding
  assertion here — a claim with no assertion fails the objective test.

## Acceptance Criteria

- [ ] `npm ci` succeeds from a clean clone and `scripts/check.sh` exits zero.
- [ ] `docs/component-spec.md` defines both the `SKILL.md` contract and the reference
      format, and a fresh agent can write a conforming component from it without asking
      a clarifying question.
- [ ] Four skills exist: `button`, `alert`, `dialog`, `tabs`.
- [ ] Every skill's frontmatter passes this repo's validator; the validator itself is
      proven by fixtures that fail each rule.
- [ ] No skill contains `${CLAUDE_PLUGIN_ROOT}`, `disable-model-invocation`, `hint:`,
      or a backslash path.
- [ ] No component's CSS, HTML, or JS references a framework, a preprocessor, or an
      external package.
- [ ] Every themeable CSS value is a `var(--auk-*, fallback)` and every component
      renders correctly with no custom properties defined at all.
- [ ] Every WCAG criterion claimed in a reference's `a11y:` frontmatter has a passing
      assertion in `tests/e2e/`.
- [ ] Each skill has at least three evaluations, with baseline results recorded before
      the skill existed.
- [ ] All twelve evaluations trigger the correct skill on Haiku, Sonnet, and Opus, or
      the miss is documented in `docs/evaluations.md` as a known limitation.
- [ ] The four skills load and are invocable in Claude Code.
- [ ] Codex discovery result is recorded in `docs/vendor-support.md`, whether it worked
      or not.

## Verification

From a clean clone in a temporary directory:

1. `npm ci && npx playwright install chromium`
2. `bash scripts/check.sh` — exits zero, having run the unit suite, the portability
   lint, `claude plugin validate . --strict`, and the Playwright suite.
3. `claude --plugin-dir .` — starts, and `/help` lists all four skills under the
   `agent-ui-kit` namespace.
4. Read `docs/evaluations.md` — baseline and post-skill results are both present for
   all twelve scenarios across three models, and the delta is visible.
5. Open each `skills/*/references/demo.html` directly in a browser with no build step
   and no stylesheet beyond the reference's own CSS. Each component renders correctly
   and is fully keyboard operable.

Step 5 is the one that matters most. The whole premise is that these references work
with nothing else present. If a demo needs anything the reference did not ship, the
component is not vendor-neutral regardless of what the tests say.

## Next Steps *(optional)*

- Extend v1 into a genuinely useful kit:
  ```text
  In ~/devbox/agent-ui-kit, the component skill format is proven by button, alert,
  dialog, and tabs. Read docs/component-spec.md and the four existing skills under
  skills/, then add: combobox (ARIA 1.2 pattern with filtering), disclosure, tooltip,
  and checkbox. Follow the same structure exactly, including a references/demo.html,
  three evaluations in evals/, and matching E2E assertions for every WCAG criterion
  claimed. Run scripts/check.sh before you finish and report the result.
  ```

- Automate the evaluation runner:
  ```text
  ~/devbox/agent-ui-kit has evals/*.json holding skill-triggering scenarios in
  Anthropic's documented format, currently run by hand via scripts/eval.sh with results
  pasted into docs/evaluations.md. Investigate whether `claude -p` with --model can run
  these non-interactively and whether skill activation is reliably detectable from its
  output. If it is, build the runner and have it write docs/evaluations.md directly. If
  it is not, say so plainly and leave the manual protocol alone.
  ```

- Make `acss-kit` depend on `agent-ui-kit` instead of duplicating it:
  ```text
  ~/devbox/acss-plugins/plugins/acss-kit has 15 component-* skills whose references
  contain fpkit-bound TSX and SCSS templates plus framework-neutral accessibility
  contracts. ~/devbox/agent-ui-kit now owns the neutral contracts. Propose (do not
  implement) how acss-kit could consume agent-ui-kit's references as the neutral source
  of truth and keep only the fpkit projection layer. Identify what would break for
  existing acss-kit users and whether Claude Code plugin dependencies can express this
  relationship.
  ```

- Add an optional DESIGN.md token bridge:
  ```text
  In ~/devbox/agent-ui-kit, components ship literal CSS using var(--auk-*, fallback).
  Design and document an optional mapping layer that lets a project with a DESIGN.md
  token file bind its tokens to the --auk-* custom properties, so components pick up a
  project's theme automatically. This must stay optional — every component must keep
  working with no DESIGN.md present. Write the design to docs/ as a proposal first.
  ```

## Unresolved Questions *(optional)*

- Plugin and marketplace share the name `agent-ui-kit`:
  ```text
  The agent-ui-kit repository is both a Claude Code plugin and its own marketplace, so
  installation reads /plugin install agent-ui-kit@agent-ui-kit and skills invoke as
  /agent-ui-kit:button. Investigate whether renaming the plugin (not the repo) to
  something shorter like "ui" improves this, what the tradeoffs are for discovery and
  namespace collisions with other plugins, and whether renaming after publication
  breaks existing installs. Recommend one option.
  ```

- Whether v1 should be submitted to the public marketplaces:
  ```text
  agent-ui-kit is a public repo that is both a Claude Code plugin and its own
  marketplace. Investigate what submitting to anthropics/claude-plugins-community
  requires, what the ChatGPT/Codex universal plugin directory requires, and whether a
  four-component v1 with an alpha reference format is ready for either. Consider that
  approved Claude Code plugins are pinned to a commit SHA with CI auto-bumping the pin.
  Recommend whether to submit now or wait, and say what would need to be true first.
  ```
