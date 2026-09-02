---
status: todo
type: feature
created: 2026-09-02
repo-name: agent-ui-kit
---

# Plan: Build vendor-neutral UI component skills

## Context

`agent-ui-kit` (github.com/shawn-sandy/agent-ui-kit) exists as structure only. The
scaffold commit `336b67a` created both plugin manifests, a marketplace manifest, an
empty `skills/` tree, and a README. No components, no format specification, no tests.

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

**Verified constraints from the Agent Skills spec** (agentskills.io/specification):

- `name`: max 64 chars, lowercase/digits/hyphens, no leading or trailing hyphen, no
  consecutive hyphens, **must match the parent directory name**.
- `description`: max 1024 chars, must state what the skill does *and* when to use it.
  This is the only text loaded at startup, so it is the entire discovery mechanism.
- Optional: `license`, `compatibility` (max 500), `metadata` (string→string map —
  `version` and `author` live here, not as top-level fields), `allowed-tools`.
- `SKILL.md` body under 500 lines. File references one level deep from `SKILL.md`.
- Validator: `skills-ref validate ./skill-dir` from `github.com/agentskills/agentskills`.

**Three portability hazards found in `acss-kit` that must not be repeated here:**

1. `${CLAUDE_PLUGIN_ROOT}` is a Claude Code variable. Codex does not expand it.
   All paths must be relative to the skill root.
2. `disable-model-invocation` and `hint` are Claude Code frontmatter, absent from the
   Agent Skills spec. A strict validator rejects them. Anything similar goes under
   `metadata:`.
3. `acss-kit` shells out to Python helper scripts. A cross-vendor skill cannot assume
   a Python runtime exists. Keep skills pure-markdown, or declare it in `compatibility:`.

**Decisions already made, recorded here so no future session re-litigates them:**

- One skill per component. Discovery quality beats startup token cost; ~100 tokens of
  description per skill is the accepted price.
- Literal CSS, not token references. Every themeable value ships as
  `var(--auk-<name>, <fallback>)`. The fallback makes a component work standalone; the
  variable makes it theme cleanly. The COMPONENT.md spec's `{colors.primary}` token
  refs become an **optional** mapping block, not a requirement, so no DESIGN.md file
  is needed for a component to function.
- WCAG claims must come from a tool run. Every reference states the criteria it
  satisfies, and those statements are asserted by axe-core plus explicit keyboard
  tests. An unverified claim is a defect, not a nice-to-have.
- v1 is four components chosen to stress different parts of the format, not to be a
  useful kit: `button` (no JS), `alert` (ARIA live region), `dialog` (focus
  management and heavy JS), `tabs` (roving tabindex; deliberately absent from
  `acss-kit`, so it tests the greenfield path rather than the extraction path).

**Known environment note.** GitHub Actions is frequently billing-blocked on this
account. Every check in this plan must be runnable locally via a single script. CI is
a mirror of that script, never the only place a check exists.

## Objective

Ship a working, tested, vendor-neutral component-skill format proven by four
components that install and run correctly in both Claude Code and ChatGPT/Codex.

## Steps

1. **Write `docs/component-spec.md`** — the reference file format, extracted from
   `acss-plugins/plugins/style-agent/docs/component-md/spec.md` and decoupled from
   DESIGN.md. Define the frontmatter contract (`element`, `role`, `props` with
   `maps-to` and `a11y` notes, `slots`, `variants`, `behavior`, `a11y` as WCAG
   criteria, optional `tokens`) and the five required body sections: Structure (HTML),
   Styles (CSS), Behavior (JS), Accessibility, Demo. Specify the `--auk-` custom
   property prefix and the `var(--auk-x, fallback)` rule.
   *Why:* Every later step writes against this; drafting components first would bake
   in an accidental format.
   *Verify:* Hand the spec plus zero other context to a fresh Claude instance and ask
   it to write the `button` reference. If it asks a clarifying question about
   structure, the spec is incomplete — fix it before step 2.

2. **Build the verification harness before any component exists.** Add Vitest,
   Playwright, and axe-core. Create `scripts/check.sh` running four gates: (a)
   `skills-ref validate` on every `skills/*/`, (b) a portability lint grepping for
   `${CLAUDE_PLUGIN_ROOT}`, `disable-model-invocation`, `hint:`, and backslash paths,
   (c) `claude plugin validate . --strict`, (d) the Vitest suite.
   *Why:* Named before the work, per the verification rule. A harness written after
   components will be shaped to pass them.
   *Verify:* Add a deliberately broken fixture skill under `tests/fixtures/bad-skill/`
   with a name/directory mismatch and a `${CLAUDE_PLUGIN_ROOT}` reference. Run
   `scripts/check.sh` and confirm it exits non-zero naming both faults. Then confirm
   it exits zero once the fixture is excluded.

3. **Write `skills/button/`** — `SKILL.md` plus `references/button.component.md` and
   `references/demo.html`. No JavaScript. Lift the accessibility contract from
   `acss-kit/skills/component-button/reference.md`, specifically the `aria-disabled`
   over native `disabled` decision that keeps the element in the tab order (WCAG 2.1.1).
   Discard the TSX and SCSS entirely.
   *Why:* The simplest possible component proves the format end to end before any
   behavior complexity is added.
   *Verify:* `scripts/check.sh` passes. `tests/e2e/button.spec.ts` confirms axe
   reports zero violations and that a disabled button is still reachable by Tab but
   does not activate on Enter.

4. **Write `skills/alert/`** — ARIA live region, still no JavaScript.
   *Why:* Proves the a11y-claim machinery on a component whose entire value is the
   accessibility contract, where a wrong `aria-live` value is invisible to the eye.
   *Verify:* `tests/e2e/alert.spec.ts` asserts axe is clean and that content injected
   after load is announced — `role="alert"` present, `aria-live` resolves to
   `assertive`, and the region exists in the DOM before content arrives.

5. **Write `skills/dialog/`** — native `<dialog>` plus a vanilla ES module for focus
   management. Lift the contract from `acss-kit/skills/component-dialog/reference.md`.
   *Why:* The hardest accessibility case in the v1 set. If the format cannot express
   focus trapping, `inert`, Escape handling, and focus restoration, it is not
   sufficient and that must surface now, not at component twenty.
   *Verify:* `tests/e2e/dialog.spec.ts` asserts axe is clean, focus moves into the
   dialog on open, Tab cycles only within it, Escape closes it, and focus returns to
   the exact element that opened it.

6. **Write `skills/tabs/`** — roving tabindex, no `acss-kit` source to extract from.
   *Why:* Every other v1 component is an extraction. This one tests whether the spec
   from step 1 stands on its own when there is nothing to lift.
   *Verify:* `tests/e2e/tabs.spec.ts` asserts axe is clean, exactly one tab is in the
   tab order at a time, Arrow keys move selection, Home/End jump to first/last, and
   each panel is correctly associated via `aria-controls` and `aria-labelledby`.

7. **Prove cross-vendor installation manually, once, and write down what happened.**
   Install the plugin into Claude Code from the local directory and confirm the four
   skills load and are invocable. Then place the same `skills/` tree at
   `.agents/skills/` and confirm Codex discovers it.
   *Why:* Every other check tests the files. This is the only step that tests the
   actual claim in the README, which is that one tree serves two vendors.
   *Verify:* Record the result in `docs/vendor-support.md`, including anything that
   did not work. If Codex discovery fails, that is a finding to document, not a step
   to quietly skip.

8. **Update `README.md`, bump both manifests to `0.2.0`, and add `scripts/check.sh`
   to a GitHub Actions workflow.**
   *Why:* The README currently says components do not exist. Version bumps are how
   Claude Code decides whether to hand users an update.
   *Verify:* `scripts/check.sh` passes from a clean clone in a temp directory. If the
   Actions run fails, read `gh run view --log-failed` first — a billing block fails
   every job in seconds with no test output and is not a code defect.

## Tests

> Tier: 1 (code-touching — creates reference implementations, a JS module, and test files)

### Objective-Verification Test

- **File:** `tests/objective.spec.ts`
- **Type:** smoke test, data-driven over `skills/*/`
- **Asserts:** For every skill directory present, all three halves of the objective
  hold simultaneously: (1) it passes `skills-ref validate`, (2) it contains no
  vendor-specific token (`${CLAUDE_PLUGIN_ROOT}`, `disable-model-invocation`, `hint:`,
  backslash paths), and (3) its `references/demo.html` returns zero axe-core
  violations. Written to iterate the directory rather than a hardcoded list, so it
  covers every component added later without being edited.
- **Run:** `npx vitest run tests/objective.spec.ts`

### Unit Tests

- **File:** `tests/unit/frontmatter.spec.ts`
- **Targets:** SKILL.md frontmatter parsing and Agent Skills spec conformance.
- **Key cases:** `name` matches the parent directory name; `name` satisfies the spec
  regex including the no-consecutive-hyphens and no-edge-hyphen rules; `description`
  is non-empty and ≤1024 chars; `description` contains a "use when" trigger phrase;
  only spec-defined keys appear at the top level. Each case must fail if the rule is
  violated — asserted against fixtures under `tests/fixtures/`.

### Integration Tests

- **File:** `tests/integration/manifests.spec.ts`
- **Targets:** `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and
  `.codex-plugin/plugin.json` read together.
- **Key cases:** Both plugin manifests declare the same `name` and the same `version`;
  the marketplace entry's `source: "./"` and `skills: ["./skills/"]` resolve to real
  directories; the Codex `skills` path resolves to the same directory Claude Code
  scans by default; every directory under `skills/` is reachable from both manifests.

### E2E Tests

- **File:** `tests/e2e/button.spec.ts`, `alert.spec.ts`, `dialog.spec.ts`, `tabs.spec.ts`
- **Targets:** Each component's `references/demo.html` driven in a real browser via
  Playwright.
- **Key cases:** Per-component keyboard and focus behavior as listed in steps 3-6.
  Every WCAG criterion a reference claims in its `a11y:` frontmatter has a
  corresponding assertion here — a claim with no assertion fails the objective test.

## Acceptance Criteria

- [ ] `docs/component-spec.md` exists and a fresh agent can write a conforming
      component from it without asking a clarifying question.
- [ ] Four skills exist: `button`, `alert`, `dialog`, `tabs`.
- [ ] Every skill passes `skills-ref validate` against the Agent Skills spec.
- [ ] No skill contains `${CLAUDE_PLUGIN_ROOT}`, `disable-model-invocation`, `hint:`,
      or a backslash path.
- [ ] No component's CSS, HTML, or JS references a framework, a preprocessor, or an
      external package.
- [ ] Every themeable CSS value is a `var(--auk-*, fallback)` and every component
      renders correctly with no custom properties defined at all.
- [ ] Every WCAG criterion claimed in a reference's `a11y:` frontmatter has a passing
      assertion in `tests/e2e/`.
- [ ] `scripts/check.sh` exits zero from a clean clone.
- [ ] The four skills load and are invocable in Claude Code.
- [ ] Codex discovery result is recorded in `docs/vendor-support.md`, whether it
      worked or not.

## Verification

From a clean clone in a temporary directory:

1. `npm ci && npx playwright install --with-deps chromium`
2. `bash scripts/check.sh` — exits zero, having run spec validation, the portability
   lint, `claude plugin validate . --strict`, and the full Vitest and Playwright suites.
3. `claude --plugin-dir .` — starts, and `/help` lists all four skills under the
   `agent-ui-kit` namespace.
4. Open each `skills/*/references/demo.html` directly in a browser with no build step
   and no stylesheet beyond the reference's own CSS. Each component renders correctly
   and is fully keyboard operable.

Step 4 is the one that matters most. The whole premise is that these references work
with nothing else present. If a demo needs anything the reference did not ship, the
component is not vendor-neutral regardless of what the tests say.

## Next Steps *(optional)*

- Extend v1 into a genuinely useful kit:
  ```text
  In ~/devbox/agent-ui-kit, the component skill format is proven by button, alert,
  dialog, and tabs. Read docs/component-spec.md and the four existing skills under
  skills/, then add: combobox (ARIA 1.2 pattern with filtering), disclosure, tooltip,
  and checkbox. Follow the same structure exactly, including a references/demo.html
  and matching E2E assertions for every WCAG criterion claimed. Run scripts/check.sh
  before you finish and report the result.
  ```

- Make `acss-kit` depend on `agent-ui-kit` instead of duplicating it:
  ```text
  ~/devbox/acss-plugins/plugins/acss-kit has 15 component-* skills whose references
  contain fpkit-bound TSX and SCSS templates plus framework-neutral accessibility
  contracts. ~/devbox/agent-ui-kit now owns the neutral contracts. Propose (do not
  implement) how acss-kit could consume agent-ui-kit's references as the neutral
  source of truth and keep only the fpkit projection layer. Identify what would break
  for existing acss-kit users and whether Claude Code plugin dependencies can express
  this relationship.
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
  The agent-ui-kit repository is both a Claude Code plugin and its own marketplace,
  so installation reads /plugin install agent-ui-kit@agent-ui-kit and skills invoke as
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
  approved Claude Code plugins are pinned to a commit SHA with CI auto-bumping the
  pin. Recommend whether to submit now or wait, and say what would need to be true
  first.
  ```
