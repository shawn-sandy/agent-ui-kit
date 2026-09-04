---
status: proposal
type: feature
created: 2026-09-04
repo-name: agent-ui-skills
---

# Proposal: Add a ui-compose workflow skill so agent-built components follow Component Driven Design in component-based projects

> **Deprecated.** The authoritative artifact is the saved prompt at
> `docs/prompts/proposal-add-ui-compose-skill.md`. This copy is written for one deprecation
> release (plan-agent 6.0.0) and is removed in 6.1.0. Edit the prompt, not this file.

> This is a proposal for review, not an execution plan. It carries the grounded
> research (the six skills, the spec, the gates, the projection demos, the public
> Component Driven Design canon) and the decisions resolved in the 2026-09-04 review.
> Execution is handed off (see Next step).

## TL;DR

- Every component SKILL.md hands the framework case to one clause. `skills/ui-button/SKILL.md:31-32`
  and `skills/ui-box/SKILL.md` say "adapt only template syntax to the target stack"; the other four
  say nothing at all. No skill tells an agent how to shape props, when to split a variant into its
  own component, that sibling auk components compose, or that the result must render on its own.
- The contract table already holds what componentdriven.org calls "a well-defined API and fixed
  series of states": the `Props`, `Slots`, `Variants` and `Behaviour` rows plus the qualifier line.
  The new skill's product is a mapping from those rows to a component's public surface, written
  framework-neutral so it passes the portability lint.
- The six `references/react-demo.tsx` projections model the opposite of the rules. `ui-dialog`
  hand-types `className="auk-button"` at lines 124, 142 and 151 and `ui-popover` at 115, 124 and
  138, instead of composing the button. An agent copies what the exemplar shows.
- Resolved path: a `ui-compose` workflow skill (`metadata.kind: workflow`, the `ui-theme`
  precedent), a two-line pointer in every component's `Build it`, a composition-only fix to the two
  projections, regex gates plus three evals inside `npm run check` now, and a framework-project
  build later under issue #15.

## Context

The idea, in the maintainer's words: when in the output phase, JavaScript frameworks should
follow Component Driven Design patterns and best practices. The framing gate fixed "output phase"
as the moment an agent follows a `ui-<component>` skill and writes the component into the
consuming project, and fixed the scope to framework-neutral rules.

Component Driven Design, as the public canon states it (componentdriven.org): build one component
at a time in isolation, combine components, assemble pages, integrate. Each component has "a
well-defined API and fixed series of states that are mocked" so it can be "taken apart and
recomposed". The maintainer's working rules add: bottom-up, one responsibility per component with
a thin router instead of a layout-switching flag, compose over duplicate, isolation first, props
are the contract. The Vercel composition-patterns skill (github.com/vercel-labs/agent-skills)
states the same split rule as "avoid boolean prop proliferation" and "create explicit variant
components".

What exists today, measured:

- Six component skills (`ui-alert`, `ui-box`, `ui-button`, `ui-dialog`, `ui-popover`, `ui-tabs`)
  and one workflow skill (`ui-theme`). SKILL.md body line counts, against a hard limit of under
  60 lines (`tests/objective.spec.ts:76-81`): alert 48, box 54, button 45, dialog 52, popover 57,
  tabs 50, theme 53. Popover has two lines of headroom.
- The founding insight, `docs/plans/build-ui-component-skills.md:24`: "HTML structure, CSS and the
  accessibility contract are framework-agnostic, and only template syntax and reactivity binding
  are framework-specific." The spec turns that into a rule at `docs/component-spec.md:255-272`:
  no reference may name a framework; the one exception is file-scoped to
  `skills/<skill>/references/react-demo.tsx`.
- The portability lint, `scripts/lint-portability.mjs:19-20`, bans the whole words React, Vue,
  Svelte, Angular, Next.js, Tailwind, jQuery, styled-components and five preprocessors anywhere in
  `skills/`, prose included, case-sensitively. `shouldLintFile` (l.25-33) exempts exactly the
  four-segment path of the React projection. Astro is not on the list. "Storybook" and "story"
  are not on the list.
- No cross-skill pointer exists. No component SKILL.md names `ui-theme`; only `README.md:27`
  lists it. The one machine-enforced repo-wide convention is the `## Clarify when needed` heading
  plus four words, asserted for every skill at `tests/objective.spec.ts:83-92`.
- The projection surface: six `react-demo.tsx` files, 695 lines total (alert 90, box 55,
  button 95, dialog 161, popover 154, tabs 140), introduced by PR #5 on 2026-09-02. The only gate
  on them, `tests/objective.spec.ts:105-124`, checks four things: imports from `'react'`, exports
  `Auk<Component>Props`, exports `Auk<Component>Demo`, contains `auk-<slug>`. Nothing compiles,
  type-checks or renders them, and `CLAUDE.md:26-28` forbids adding a typecheck. All six import
  only `react`; none composes another projection; every stateful one re-implements its vanilla
  `init<Component>` module in hooks.
- The evals: seven files, 21 scenarios, exactly one `obvious`, `oblique` and `adjacent` each.
  Every prompt targets a plain `index.html`. No fixture anywhere in the repo is a component-based
  project.
- The build layer, issue #15 and `docs/plans/add-build-layer-for-agent-built-components.md`
  (status: todo), is the only mechanism that could ever test what an agent builds, and its scope
  says "React builds are out of scope".
- The workflow-skill precedent: `skills/ui-theme/SKILL.md` declares `metadata.kind: workflow`, a
  standard Agent Skills key. `scripts/skill-kind.mjs` reads it; `tests/objective.spec.ts`,
  `tests/e2e/demos.spec.ts` and `scripts/build-demos.mjs` skip the component-only gates for it.
  Its reference (`references/ui-theme.md`, 253 lines) has its own sections: Scope, Guard,
  Discovery, Mapping table, Output contract, Worked example, Verification. Its mapping table is
  pinned to the component references by `tests/unit/ui-theme-mapping.spec.ts`.
- Distribution: the skills CLI (`npx skills add <repo> --skill <name>`) copies only the named
  skill directories into `.claude/skills/` or `.agents/skills/`. A shared file outside a skill
  directory would not ship with a selective install.
- The maintainer walker `.claude/skills/new-component/SKILL.md` has no step for creating
  `react-demo.tsx`, although `tests/objective.spec.ts:105` requires it. Incidental drift.

Precedents outside the repo for one contract, many frameworks:

- Zag.js models "component interactions in a framework agnostic way" and ships adapters; Ark UI
  builds on it with "the same API across React, Solid, Vue, and Svelte" and composes each
  component from named parts (`Dialog.Root`, `Dialog.Trigger`, `Dialog.Content`). The repo's
  `data-part` attributes are the same idea expressed in HTML.
- Component Story Format is "an open standard based on ES6 modules that is portable beyond
  Storybook": one named export per component state. It is the isolation artifact the canon has
  in mind.
- Custom Elements Everywhere scores React, Vue, Svelte, Angular, Solid, Preact and Lit at 16/16
  on both basic and advanced tests. A custom-element projection is a viable framework-neutral
  path; it is not taken here because it would add a runtime the repo promises not to ship.

## Core finding

> The skills already carry the two inputs Component Driven Design needs, a fixed contract table
> and an isolation harness, but the `Build it` step discards both at the framework boundary with
> the clause "adapt only template syntax to the target stack", so what an agent emits into a
> component-based project is shaped by habit, and the six projection demos it would copy from
> model hand-typed siblings and re-implemented behaviour, the opposite of compose-over-duplicate.

## Side-by-side

| Dimension | Component Driven Design canon | The repo today | What `ui-compose` adds |
|---|---|---|---|
| Build one component at a time, in isolation | Every component renders alone with mocked states | `references/demo.html` per component, vanilla only; no rule for framework output | Non-negotiable: the emitted component renders with no app-level import; stories only when a harness already exists |
| Well-defined API | Props are the fixed contract | Contract table `Props` row per component; `Auk<Component>Props` naming exists only for the React projection | Mapping rule: contract row to typed prop, named without its `data-` or `aria-` prefix; fixed-value attributes are hard-coded, not props |
| Fixed series of states | Each state is nameable and mockable | Qualifier line names parts, variants and states; nothing maps it to output | The states list is the story list: one story per variant and per prop-driven state |
| Combine components | Larger UI is assembled from existing smaller components | No skill names a sibling; dialog and popover projections hand-type `auk-button` at six sites | Rule: a sibling auk component in the project is composed, never re-typed; the projection fix models it |
| One responsibility | A component does one thing | Popover projection branches on `mode` to render or omit its close control; button carries `iconOnly` | Split rule: structural props split into explicit variant components behind a thin router; styling props pass through to `data-variant` |
| Core plus adapter | Framework-agnostic logic, per-framework binding (Zag, Ark) | Vanilla `init<Component>(root)` returns a teardown; projections re-implement it in hooks | Rule: call the Behaviour module on mount and its teardown on unmount; re-implement only where the framework's rendering owns the attribute the module writes |

## Locked & resolved decisions

Settled before this draft, at the 2026-09-04 framing gate:

1. **Output phase means the agent writing into the consuming project.** The repo's own generated
   files are not the target. Consequence: the guidance must reach the agent at build time, so it
   lives under `skills/`, not `docs/`.
2. **Framework-neutral rules.** No per-framework projection references beyond the existing React
   one. Consequence: every new file passes the portability lint as written; the rules speak of
   "a component-based project", "props", "parts" and "stories", never a framework name.

Resolved in the 2026-09-04 review:

3. **Location: a new `ui-compose` workflow skill plus a two-line pointer in every component's
   `Build it`.** Rationale: one file to maintain, the `ui-theme` precedent already partitions the
   gates, it ships through the skills CLI, and two lines fit popover's headroom. The pointer names
   the four rules so a selective install of one component skill still carries the gist.
   Propagates to Workstreams A, B, C and Appendix B.
4. **Projections: fix composition only.** `ui-dialog` and `ui-popover` demos import and use
   `AukButton`; the hook re-implementations stay. Rationale: six sites in two files removes the
   visible contradiction; wrapping `init` modules is a four-file refactor with an open design
   question. Propagates to Workstream D and the Risks entry on wrap versus re-implement.
5. **Split rule: structural props split, styling props pass through.** A prop that only writes
   `data-variant` or a class stays a prop. A prop that changes which parts render becomes its own
   variant component behind a thin router with the same import surface. Propagates to the rules
   text in Workstream A and Appendix A.
6. **Isolation: render alone; add stories only if a harness exists.** Never install one.
   Propagates to the Non-negotiable list and the output contract in Workstream A.
7. **Verification: regex gates and evals now; framework build later.** Inside the six gates: an
   objective assertion for the pointer, a unit test pinning the mapping table to the real contract
   tables, three evals for `ui-compose`. Re-scoping issue #15 is Phase 5. Propagates to
   Workstream E and the Roadmap.

Assumptions made by the author, overridable in review:

- The skill is named `ui-compose`. The name must start with `ui-` (`tests/objective.spec.ts:34`).
- The four rules are named, in order: props from the contract, split on structure, compose
  siblings, render alone. The pointer line and the reference use the same four names.
- Discovery of a component-based project is by structure: a `components` directory, or source
  files with a component file extension. The reference lists the extensions in lowercase; the
  lint is case-sensitive on whole words, so `.vue` and `.svelte` pass it. Whether that respects
  the spirit of the neutrality rule is a spec question, recorded under Risks and Workstream C.

## Workstreams

### A - The `ui-compose` skill

Scope: `skills/ui-compose/SKILL.md`, `skills/ui-compose/references/ui-compose.md`,
`evals/ui-compose.json`. Mirrors `ui-theme` in shape.

- Frontmatter: `name: ui-compose`, `license: MIT`, `metadata: kind: workflow`. Third-person
  description with the disambiguators in the first clause, because Codex truncates
  (`docs/vendor-support.md`): "Composition workflow - shapes auk components for a component-based
  project: typed props derived from the contract table, explicit variant components instead of
  layout-switching flags, sibling auk components composed rather than re-typed, and each
  component renderable alone. Use when the target project is built from components, when a
  request asks to wrap, port or adapt an auk component into the project's component model, or
  when a screen must be assembled from auk parts. Not for a plain HTML page and not for theming."
- Body, under 60 lines, the same five headings as every other skill. `Build it` is a procedure
  over the project: 1 detect a component-based project or stop and emit nothing; 2 read the
  component's contract table; 3 map rows to the public surface per the reference; 4 apply the four
  rules; 5 emit the component file, a router only when a structural prop exists, and stories only
  if a story harness is already present; 6 state the mapping and any split in the reply.
- Reference sections: Scope, Guard, Discovery, Mapping table, Rules, Output contract, Worked
  example, Verification. The mapping table is Appendix A. The worked example is the button and the
  dialog, written as a props table and a parts tree in prose, with no framework syntax.
- Evals: `obvious` (a request naming a component file path and an existing project Button
  component, expecting composition and a typed props export), `oblique` (a request to "make the
  confirm dialog fit our component setup"), `adjacent` (a plain `index.html` request that must stay
  quiet). Detect regexes: an exported props type; no hand-typed `className="auk-button"` when a
  Button component exists; no import from outside the component's own tree except the project's
  own components.

### B - The pointer in every component `Build it`

Scope: six SKILL.md files, two lines each; one assertion in `tests/objective.spec.ts`.

- The line, identical in all six, added as the step before "Open `references/demo.html`":
  "In a component-based project, follow `ui-compose`: props from the contract table, split only on
  structure, compose sibling auk components, render alone." Replaces the clause "adapt only
  template syntax to the target stack" in `ui-box` and `ui-button`, so the framework case has one
  owner.
- A new every-skill assertion next to the Clarify one (`tests/objective.spec.ts:83-92`): the body
  matches ``/^\d+\. In a component-based project, follow `ui-compose`/m`` for every component skill.
  Workflow skills are exempt.
- Line budget after the change: popover 59, box 56, dialog 54, tabs 52, alert 50, button 47.

### C - Spec, walker and README

Scope: `docs/component-spec.md`, `.claude/skills/new-component/SKILL.md`, `README.md`.

- Spec section 1 body skeleton (`docs/component-spec.md:152-187`): add the pointer step. Settled
  questions (l.53-107): add one row, "What does an agent emit in a component-based project? The
  `ui-compose` mapping." Framework neutrality (l.255-272): one sentence that lowercase file
  extensions name file types, not libraries, and are allowed. Section 8 checklist: "Build it points
  at `ui-compose`."
- Open PR #23 edits section 0 Sources and the section 8 checklist. Sequence this workstream after
  it merges, or rebase onto it.
- Walker: add the pointer to step 3, and close the incidental drift by adding the missing
  `react-demo.tsx` step after step 5.
- README: one paragraph after l.16 naming `ui-compose` as the skill that shapes framework output.

### D - Projection composition fix

Scope: `skills/ui-dialog/references/react-demo.tsx` l.124, 142, 151;
`skills/ui-popover/references/react-demo.tsx` l.115, 124, 138.

- Import `AukButton` from `../../ui-button/references/react-demo` and replace the six raw
  buttons. A relative import passes the package-import lint rule and the file is lint-exempt
  anyway. The file is reference material and is never executed, so a selective install of
  `ui-dialog` alone leaves a documented, harmless dangling import; say so in a one-line comment.
- Issue #25 changes the same dialog file (autofocus ref callback, `closedBy`, pointerdown guard).
  Land D after #25, or in the same pull request.

### E - Verification inside the gates

Scope: `tests/unit/ui-compose-mapping.spec.ts`, the objective assertion from B, the evals from A.

- The unit test mirrors `tests/unit/ui-theme-mapping.spec.ts`: every row name the mapping table
  maps is one of the seven contract rows (`tests/objective.spec.ts:33`) or the qualifier line;
  every entry in every component's `Props` row is covered by exactly one mapping rule (choice,
  fixed, boolean, string, reference); the counts stated in the reference prose are measured from
  the six contract tables.
- What this proves: the guidance is present, complete against the contracts, and named in every
  component skill. What it does not prove: that an agent follows it. That needs Phase 5.

## Risks & tensions

- **Lint versus discovery.** Detecting a component-based project needs file extensions. Lowercase
  `.vue` and `.svelte` pass the case-sensitive whole-word lint, but the spec's intent is "no
  reference may name a framework". Mitigation: the one-sentence spec amendment in C makes the
  allowance explicit rather than accidental. Stop-condition: if the maintainer rejects the
  amendment, discovery falls back to the `components` directory alone.
- **A pointer without its skill.** A selective install of one component skill may omit
  `ui-compose`. Mitigation: the pointer line carries the four rules; README says the set ships
  together.
- **Output shape stays unmeasured until Phase 5.** The gates prove presence, not compliance; the
  evals measure triggering and a few detect regexes on the produced file. Issue #15 scopes React
  out today and would need re-scoping.
- **Popover's last headroom.** After B, `ui-popover/SKILL.md` sits at 59 lines. Any later addition
  needs a trim first.
- **Wrap versus re-implement is explained, not resolved.** The rule for agent output says call the
  Behaviour module on mount; the React exemplars re-implement in hooks. The reference must say
  when re-implementation is right (the framework's rendering owns the attribute the module writes,
  as `aria-selected` in tabs) so the two do not read as a contradiction.
- **Textual conflicts.** PR #23 on `docs/component-spec.md`; issue #25 on the dialog projection.
- **Description budget.** Codex truncates descriptions; the disambiguators are in the first
  clause, and the adjacent eval guards against the skill firing on a plain page.
- **Astro asymmetry.** Astro is not in the banned-word list while the other frameworks are. Not
  this proposal's job; recorded so the spec owner can decide.

## Open questions (decisions only)

None outstanding. Every decision is recorded above; the three author assumptions are overridable
in review.

## Roadmap

| Phase | Work | Size | Depends on |
|---|---|---|---|
| 1 | Workstream A: `ui-compose` SKILL.md, reference, three evals | M | - |
| 2 | Workstream B and E: six pointers, objective assertion, mapping unit test | S | 1 |
| 3 | Workstream C: spec rows, walker steps, README paragraph | S | 2; rebase after PR #23 |
| 4 | Workstream D: compose `AukButton` in the dialog and popover projections | S | issue #25's dialog change, or same PR |
| 5 | Re-scope issue #15 to add one component-based project fixture and a build spec | M | #15 landing |

## Appendix A - Contract row to public surface (grounded on the six contract tables)

| Contract row | Mapping rule | Real example |
|---|---|---|
| `Element` | The component owns exactly one root, carrying the `auk-<slug>` class verbatim | `ui-button`: `<button>`; `ui-dialog`: `<dialog>`; `ui-tabs`: a `<div>` wrapping the tablist and panels |
| `Props`, an entry with a choice | A prop named without its `data-` or `aria-` prefix, typed as the union | `data-variant` `"primary" \| "secondary" \| "destructive"` becomes `variant`; `popover` `"auto"` or `"manual"` becomes `mode` |
| `Props`, an entry with one fixed value, marked required | Hard-coded in the root, never a prop | `ui-alert` `aria-atomic="true"`; `ui-popover` `role="group"` |
| `Props`, a boolean attribute, or a single-valued attribute that is absent by default | A boolean prop, named for the state it expresses | `aria-disabled="true"` becomes `unavailable`; `data-icon-only` becomes `iconOnly`; `hidden` on a panel is derived from selection, not a prop |
| `Props`, a string entry | A string prop, required when the contract marks it required, otherwise optional | `id` on the dialog, the popover and every tab and panel; `aria-label` on an icon-only button |
| `Props`, an id reference | Either generated inside the component or a required prop when the referent lives outside it | `aria-labelledby` on the dialog is generated from the heading slot; `data-dialog-open="<id>"` on an opener is a required prop of the opener |
| `Slots` | Children, or a named slot per `data-part`; the part attribute is emitted verbatim | `ui-dialog`: `header`, `body`, `footer`; `ui-button`: children are the label, an icon child carries `data-part="icon"` |
| `Variants` | The `variant` union; styling only, passes through to `data-variant`; never one boolean per variant | `ui-alert`: `info`, `success`, `warning`, `error`; `ui-box`: `invert` |
| `Behaviour` | Call the module on mount, its teardown on unmount; re-implement only where the framework's rendering owns the attribute | `initDialog(dialog)`, `initPopover(popover)`, `initTabs(root)`; `ui-alert`, `ui-box`, `ui-button` are `none` |
| Qualifier line `states` | The story list: one story per variant, one per prop-driven state | `ui-button`: `hover`, `focus`, `disabled` under three variants; `ui-popover`: `open`, `focus` |

Split rule applied to the shipped contracts: `ui-popover` `mode` changes which parts render (a
`manual` popover needs its own close control), so it is structural and splits into an auto and a
manual variant behind a thin router. `ui-button` `data-icon-only` changes the label's shape but
not which parts render, so it stays a prop. `ui-alert` `role` and `aria-live` are paired to the
variant, so they are derived, not props.

## Appendix B - The pointer line and its assertion

The line added to every component `Build it`, verbatim:

```
N. In a component-based project, follow `ui-compose`: props from the contract table, split only
   on structure, compose sibling auk components, render alone.
```

The assertion, next to the Clarify one in `tests/objective.spec.ts`:

```
component('Build it points at ui-compose', () => {
  expect(body).toMatch(/^\d+\. In a component-based project, follow `ui-compose`/m);
});
```

## Appendix C - Where the projections hand-type a sibling

| File | Lines | What is hand-typed |
|---|---|---|
| `skills/ui-dialog/references/react-demo.tsx` | 124, 142, 151 | `<button className="auk-button" ...>` for the opener, cancel and destructive actions |
| `skills/ui-popover/references/react-demo.tsx` | 115, 124, 138 | `<button className="auk-button" ...>` for two triggers and the apply control |

After Workstream D each becomes `<AukButton type="button" variant="...">`, imported from
`../../ui-button/references/react-demo`.

## Appendix D - Sources

- componentdriven.org: the four-step process and "a well-defined API and fixed series of states".
- storybook.js.org, Why Storybook and the Component Story Format API: isolation, stories as
  states, CSF as a portable ES-module standard.
- atomicdesign.bradfrost.com chapter 2: atoms, molecules, organisms; "not a linear process".
- zagjs.com introduction and github.com/chakra-ui/ark README: framework-agnostic core with
  adapters; the same API and parts across four frameworks.
- custom-elements-everywhere.com: 16/16 for React, Vue, Svelte, Angular, Solid, Preact, Lit.
- agentskills.io specification: `references/` loaded on demand; keep file references one level
  deep; `metadata` is a standard key.
- github.com/vercel-labs/skills README: `--skill` installs named skills only, into
  `.claude/skills/` or `.agents/skills/`.
- github.com/vercel-labs/agent-skills, composition patterns: avoid boolean prop proliferation;
  explicit variant components; children over render props.
- In-repo: `docs/component-spec.md`, `scripts/lint-portability.mjs`, `tests/objective.spec.ts`,
  `scripts/skill-kind.mjs`, `tests/unit/ui-theme-mapping.spec.ts`, `skills/ui-theme/`, the six
  `react-demo.tsx` files, `evals/*.json`, `docs/plans/*.md`, PR #5, PR #23, issues #15 and #25.


## Appendix E - Incidental findings

- `docs/plans/sync-ui-dialog-with-native-spec.md` line 12 holds an unquoted colon inside a
  frontmatter value, so gray-matter throws and `tests/integration/artifacts-doc.spec.ts` fails.
  `npm test` has been red on main since PR #26 landed. Not this proposal's job; quote the value.
- `.claude/skills/new-component/SKILL.md` has no step for `references/react-demo.tsx`, although
  `tests/objective.spec.ts:105` requires the file. Workstream C closes it.
- `Astro` is absent from the banned-word list in `scripts/lint-portability.mjs:19` while every
  other framework the maintainer's rule names is present.

## Next step

Convert to an execution plan:
`/plan-agent:implementation-plan Add the ui-compose workflow skill so agent-built components follow Component Driven Design in component-based projects --from-prompt docs/prompts/proposal-add-ui-compose-skill.md`
