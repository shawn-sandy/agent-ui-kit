---
type: proposal
intent: Add a public ui-theme workflow skill that binds a consuming project's existing styles to the 69 brand-bearing --auk-* custom properties, after partitioning the gates so a non-component skill can ship under skills/.
techniques: Long-context grounding, XML structure, Comparison tables, Positive framing, Output format
created: 2026-09-03
modified: 2026-09-03
status: converged
generated-sha: 3e7c105d1bbd598acebb9f6def935cd02cd46accc330bbc247c40ac52ac6a357
---

# Proposal: Add a ui-theme skill that binds a project's styles to the auk custom properties

> This is a proposal for review, not an execution plan. It carries the
> grounded research and the decisions already made; the final instruction
> below hands off to drafting an execution plan from it.

<tldr>
- The spec already says a project "binds its tokens to the `--auk-*` properties in its own
  stylesheet" (`docs/component-spec.md:269-272`), and `docs/plans/build-ui-component-skills.md:149-152`
  asks for exactly this design as a proposal first. Nothing in the repo tells an agent how.
- All 137 properties are component-scoped. No shared palette exists, and
  `tests/objective.spec.ts:142-156` forbids one inside a reference. The skill's product is a
  mapping table: 21 project style roles onto the 69 brand-bearing properties (57 colour,
  7 radius, 5 font-family), emitted as one `:root` override block into the project's stylesheet.
- The gates treat every `skills/*` directory as a component. Shipping a workflow skill needs a
  `metadata.kind` partition in three files: `tests/objective.spec.ts`, `tests/e2e/demos.spec.ts`,
  `scripts/build-demos.mjs`.
- Resolved path: public workflow skill at `skills/ui-theme/`, static stylesheet discovery,
  brand-bearing scope, dark scheme mirrored only when the project already has one.
</tldr>

<context>
The idea: a skill an agent invokes after building auk components into a user's project, so
those components take on the project's existing colours, radius and type instead of the
shipped defaults (primary `#1a56db`, grey text, `0.375rem` radius).

What exists today:

- Six component skills under `skills/`: ui-alert, ui-box, ui-button, ui-dialog, ui-popover,
  ui-tabs. Each reference ships literal CSS as `var(--auk-<slug>-<property>, <literal>)`.
  Grammar at `docs/component-spec.md:57`; the themeable set is defined at line 97.
- 137 unique properties (alert 21, box 10, button 27, dialog 27, popover 31, tabs 21). Every
  one is scoped to its component. No `--auk-color-*` or `--auk-space-*` exists, and
  `tests/objective.spec.ts:142-156` rejects any property in a reference that does not match
  `^--auk-<slug>-`.
- Override guidance exists in exactly two sentences: `skills/ui-button/SKILL.md:38` and
  `skills/ui-box/SKILL.md:44` ("Override `--auk-button-*` to theme it"). The other four
  SKILL.md files stop at "Copy the Styles block as-is."
- Design tokens are declared an optional mapping layer at `docs/component-spec.md:269-272`.
  The sentence "A project that has tokens binds them to the `--auk-*` properties in its own
  stylesheet" is the mandate this skill implements.
- `docs/plans/build-ui-component-skills.md:149-152` lists "Add an optional design-token
  bridge" as an unbuilt item and asks for the design as a proposal in `docs/` first. This
  document is that proposal.
- Measured datapoint: `docs/vendor-support.md:51` records Codex writing 26
  `var(--auk-button-*, ...)` declarations into a project stylesheet on the ui-button-obvious
  scenario. Agents already put the properties where the override block would go.
- Dark mode is absent from `skills/`, `docs/component-spec.md`, `README.md` and `CLAUDE.md`.
  `forced-colors` appears in one reference only, to explain why no such block is written. The
  spec (line 63) deliberately keeps system colours unthemeable so a theme cannot defeat a
  user's high-contrast setting.

External prior art:

- shadcn/ui themes through CSS variables redefined in `:root` and `.dark`; every component
  updates at once. Its docs name the pitfall of overriding a token for light and forgetting dark.
- Token extractors exist (Project Wallace design-tokens analyzer, the extract-design-system
  agent skill, css-token-extractor). extract-design-system crawls a public URL with a headless
  browser and emits `tokens.json` plus `tokens.css`. None of them map extracted values onto an
  existing component library's variables.
</context>

<finding>
The repo already promises the binding layer in its spec and never delivers it. Because the
137 properties are component-scoped with no shared palette, the skill's real product is a
mapping from 21 project style roles onto 69 brand-bearing properties, and the only thing
stopping it from shipping publicly is that the gates assume every public skill is a component.
</finding>

<comparison>
| Dimension | Existing extractors (extract-design-system, Project Wallace) | ui-theme (this proposal) |
|---|---|---|
| Input | A public URL crawled by a headless browser, or pasted CSS | The project's own stylesheet sources, already on disk where the agent runs |
| Discovery | Computed styles from the rendered DOM | `:root` custom properties first, then the most frequent colour, radius and font literals |
| Output | Generic `tokens.json` plus `tokens.css` with new names | One `:root` block that sets the 69 known `--auk-*` properties, `var(--project-token)` where one exists and a literal otherwise |
| Mapping onto a component library | None | The whole deliverable (Appendix A) |
| Runtime dependency | Node 20 plus a browser | None; prose instructions and a mapping table |
| Vendor portability | Bundled CLI per vendor | Same portability rules as the six component skills (`scripts/lint-portability.mjs`) |

| Dimension | Repo today | Repo with ui-theme |
|---|---|---|
| Who binds project tokens to `--auk-*` | Nobody; one sentence in the spec | An installable skill with a procedure and a table |
| Override guidance in SKILL.md | 2 of 6 components | 6 of 6, plus one skill that performs it |
| Dark scheme | Not mentioned anywhere | Mirrored when the project defines one |
| Gate model | Every `skills/*` is a component | `metadata.kind` partitions component and workflow skills |
</comparison>

<decisions>
Locked and resolved — treat these as settled; do not reopen them:

Settled before this draft:

1. **Design tokens are optional; every component works with no properties defined.**
   (`docs/component-spec.md:269-272`; asserted by `tests/objective.spec.ts:158-161`, which
   rejects any `--auk-*:` declaration in a demo.) Consequence: ui-theme emits into the
   project, never into a reference or demo.
2. **Properties are component-scoped and carry a literal fallback; no nested `var()`.**
   (`tests/objective.spec.ts:142-156`.) Consequence: ui-theme cannot introduce shared
   `--auk-color-*` tokens inside `skills/`. Shared roles live only in the skill's mapping table
   and in the block it emits.
3. **System colours under `forced-colors` are never themeable.** (`docs/component-spec.md:63`.)
   Consequence: the emitted block never contains a `forced-colors` media query.
4. **Public skill names start with `ui-` and match the directory.**
   (`tests/lib/frontmatter.ts:71-73`.) Consequence: the skill is `skills/ui-theme/`, name
   `ui-theme`, public slug `theme`.

Resolved in the 2026-09-03 review:

5. **Ship as a public workflow skill at `skills/ui-theme/` with a `metadata.kind: workflow`
   marker, and partition the gates.** Rationale: internal placement under `.claude/skills/`
   never installs, and a fabricated component shape (reference, demo, react-demo, WCAG table)
   for a skill with no component would be noise. `metadata` is already an allowed frontmatter
   key (`tests/lib/frontmatter.ts` STANDARD_KEYS), so the marker needs no frontmatter change.
   Propagates to Workstream A, Roadmap phase 1, Appendix D.
6. **Discovery reads the project's stylesheet sources statically.** Order: `:root` and `:host`
   custom properties; then the most frequent colour literals, `border-radius` values and
   `font-family` stacks; then a short interview for anything still unknown (the "Clarify when
   needed" heading). No browser, no rendered page. Propagates to Workstream B, Appendix B.
7. **Mapping scope is the 69 brand-bearing properties: 57 colour, 7 radius, 5 font-family.**
   The 68 size, spacing, duration and placement properties keep their fallbacks, so the 24px
   minimum targets and the values measured in `tests/e2e/` stay untouched. Propagates to
   Workstream B, Appendix A, Risk 2.
8. **Dark scheme is mirrored, never invented.** If the project has a
   `prefers-color-scheme: dark` block or a class/attribute toggle (`.dark`,
   `[data-theme="dark"]`), the skill emits a second override block under that same selector
   using the project's dark values. If the project has no dark scheme, nothing dark is emitted.
   Propagates to Workstream B, Appendix C, Risk 3.
9. **Output placement default.** The block is appended to the stylesheet that already declares
   the project's `:root` custom properties. If none exists, it goes in a new `auk-theme.css`
   beside the first stylesheet that contains an `auk-` selector. (Author default; the plan may
   override for an unusual layout.)
10. **No bundled scanner script in the first release.** Discovery is prose heuristics an agent
    runs with its own file tools. A zero-dependency script is a later phase if evals show
    agents missing tokens. (Author default.)
11. **Skill name `ui-theme`.** `ui-brand` and `ui-style` were considered; "theme" is the verb
    the existing SKILL.md files already use. (Author default.)
</decisions>

<workstreams>
**A — Gate partition for workflow skills.** Let a `skills/*` directory declare
`metadata.kind: workflow` and have the component-only assertions skip it, while portability,
frontmatter, evals and SKILL.md-body rules still apply.

- `tests/objective.spec.ts`: read `metadata.kind` from frontmatter. For workflow skills skip
  the assertions at lines 50-54 (reference and demo exist), 92-111 (react-demo.tsx), 121-161
  (contract table, section order, Qualifiers line, css var rules, demo has no `--auk-*:`),
  173-212 (demo style and script match), 214-236 (WCAG rows and e2e spec). Keep 56-90 (name,
  frontmatter, body length, no code fences, Clarify heading, portability rules) and 238-247
  (evals). Table in Appendix D.
- `tests/e2e/demos.spec.ts:10-27`: skip workflow skills, which have no `references/demo.html`.
- `scripts/build-demos.mjs:50-56`: skip workflow skills instead of throwing on the missing
  reference and demo pair (the throw currently aborts gate 4 for every skill).
- `tests/fixtures/`: add one broken workflow skill (for example, one missing `evals/`) so
  `check.sh --prove` can still show the partition failing.
- `docs/component-spec.md`: a short section defining a workflow skill and what the contract
  does and does not require of it.

**B — The ui-theme skill.** `skills/ui-theme/SKILL.md` (under 60 lines, no code fences) and
`skills/ui-theme/references/ui-theme.md` carrying the procedure and the mapping table.

- Discovery procedure (Appendix B), ending in the "Clarify when needed" interview for roles
  with no evidence.
- Mapping table (Appendix A): 21 roles to 69 properties.
- Output contract (Appendix C): one `:root` block, `var(--project-token)` where the project
  has a matching custom property, literal otherwise; an optional dark block mirrored from the
  project's own dark selector.
- Verification step: after writing the block, reopen the page and confirm text contrast and
  focus visibility did not regress. The reference names which `tests/e2e/` specs measure those
  values; it never estimates a ratio.
- Writing constraints: description in third person with no first- or second-person pronouns
  ("your project" fails `tests/lib/frontmatter.ts`); no framework or preprocessor names
  anywhere in the file; no `url(`, `@import` or `src=`; prose wrapped at 88 columns.

**C — Evals and one regression test.**

- `evals/ui-theme.json`: at least three scenarios. obvious: "make these components match our
  brand". oblique: "the buttons look off next to the rest of the page". adjacent: a request to
  restyle a non-auk element, where the skill must stay quiet.
- `tests/e2e/ui-theme.spec.ts`: inject a fixed test palette as an override block into each of
  the six demos and assert the existing contrast and target-size checks still pass. Add one
  case where a referenced project token is undefined, asserting the component's own literal
  fallback wins. This is the one runnable check the skill leaves behind.

**D — Docs and consistency.**

- Add the "Override `--auk-<slug>-*` to theme it" sentence to `skills/ui-alert`, `ui-dialog`,
  `ui-popover` and `ui-tabs` SKILL.md so all six point at the same mechanism.
- `README.md:18-23` and `:40` say "six"; update to seven and list ui-theme.
- Close the wish-list item at `docs/plans/build-ui-component-skills.md:149-152` by linking
  this proposal.
- Fix the spec example at `docs/component-spec.md:57`: `--auk-tab-selected-indicator-color`
  matches no shipped property; ui-tabs ships `--auk-tabs-selected-tab-border-block-end-color`.
</workstreams>

<risks>
- **The gate partition is the only structural change, and it loosens a deliberately strict
  contract.** Mitigation: the partition keys on an explicit `metadata.kind` value, defaults to
  component, and gets a fixture under `tests/fixtures/` so `check.sh --prove` demonstrates it
  can fail.
- **Mapping project colours onto the wrong roles can break contrast.** A project's primary may
  fail 4.5:1 against its own surface. Mitigation: Workstream C's e2e test with a fixed palette,
  plus a verification step in the reference that tells the agent to re-measure contrast after
  emitting. The skill never estimates a ratio.
- **Dark mirroring depends on recognising the project's dark selector.** Class names vary.
  Mitigation: recognise the three common shapes (media query, `.dark`, `[data-theme]`) and
  otherwise ask; never generate dark values.
- **Portability lint bans the words a stylesheet-reading skill naturally uses.** The skill
  cannot name any preprocessor or framework, cannot write `url(` or `@import`, and cannot say
  "your project". Mitigation: the reference speaks of "stylesheet sources" and names file
  extensions rather than tools; eval scenarios exercise discovery on plain CSS.
- **Utility-class projects expose few custom properties.** Static discovery may find only
  literals. Mitigation: frequency ranking of literals still yields a primary colour and radius;
  the interview covers the rest. A rendered-page discovery mode was considered and rejected
  for the first release as non-portable.
</risks>

<open-questions>
Decisions still owned by the human — surface them, do not answer them:
- None remaining. Items 5 to 11 resolved every decision this round surfaced. Anything that
  reopens belongs in the implementation plan's clarify step.
</open-questions>

<roadmap>
| Phase | Work | Size | Depends on |
|---|---|---|---|
| 1 | Workstream A: `metadata.kind` partition in three gate files, one fixture, one spec section | S | — |
| 2 | Workstream B: SKILL.md and reference carrying Appendix A, B and C | M | 1 |
| 3 | Workstream C: `evals/ui-theme.json` and `tests/e2e/ui-theme.spec.ts` | M | 2 |
| 4 | Workstream D: override sentences, README count, wish-list link, spec example fix | S | 2 |
| 5 | Optional: zero-dependency scanner script, only if evals show missed tokens | S | 3 |
</roadmap>

<appendices>
Appendix A — Role to property mapping (21 roles, 69 properties)

The fallback column is the shipped literal, measured from the references on 2026-09-03.

| Role | Meaning | Properties | Shipped fallback |
|---|---|---|---|
| primary | Brand action colour | `--auk-button-bg`, `--auk-button-border-color`, `--auk-tabs-selected-tab-color`, `--auk-tabs-selected-tab-border-block-end-color` | `#1a56db` (button border: `transparent`) |
| on-primary | Text on primary | `--auk-button-color`, `--auk-button-destructive-color` | `#ffffff` |
| text | Body text | `--auk-box-color`, `--auk-button-secondary-color`, `--auk-dialog-color`, `--auk-dialog-body-color`, `--auk-dialog-close-color`, `--auk-popover-color`, `--auk-popover-body-color`, `--auk-popover-close-color`, `--auk-tabs-color`, `--auk-tabs-tab-color` | `#111827`, `#1f2937`, `#374151` |
| surface | Card and page background | `--auk-box-bg`, `--auk-button-secondary-bg`, `--auk-dialog-bg`, `--auk-dialog-close-bg`, `--auk-popover-bg`, `--auk-popover-close-bg`, `--auk-tabs-tab-bg` | `#ffffff` (close, tab: `transparent`) |
| border | Default border | `--auk-box-border-color`, `--auk-button-secondary-border-color`, `--auk-dialog-border-color`, `--auk-dialog-close-border-color`, `--auk-popover-border-color`, `--auk-popover-close-border-color`, `--auk-tabs-border-color` | `#d1d5db`, `#6b7280`, `transparent` |
| divider | Hairline inside a surface | `--auk-dialog-divider-color`, `--auk-popover-divider-color` | `#e5e7eb` |
| focus | Focus ring | `--auk-button-focus-color`, `--auk-dialog-focus-color`, `--auk-popover-focus-color`, `--auk-tabs-focus-color` | `#111827` |
| info | Default alert text and border | `--auk-alert-color`, `--auk-alert-border-color` | `#1e3a8a` |
| info-surface | Default alert background | `--auk-alert-bg` | `#dbeafe` |
| danger | Error text, border, destructive action | `--auk-alert-error-color`, `--auk-alert-error-border-color`, `--auk-button-destructive-bg` | `#b91c1c` |
| danger-surface | Error background | `--auk-alert-error-bg` | `#fee2e2` |
| success | Success text and border | `--auk-alert-success-color`, `--auk-alert-success-border-color` | `#14532d` |
| success-surface | Success background | `--auk-alert-success-bg` | `#dcfce7` |
| warning | Warning text and border | `--auk-alert-warning-color`, `--auk-alert-warning-border-color` | `#78350f` |
| warning-surface | Warning background | `--auk-alert-warning-bg` | `#fef3c7` |
| muted | Unavailable control | `--auk-button-disabled-bg`, `--auk-button-disabled-border-color`, `--auk-button-disabled-color` | `#6b7280`, `transparent`, `#ffffff` |
| inverse | Inverted box | `--auk-box-invert-bg`, `--auk-box-invert-color`, `--auk-box-invert-border-color` | `#1f2937`, `#f9fafb`, `transparent` |
| overlay | Dialog backdrop | `--auk-dialog-backdrop-bg` | `rgba(17, 24, 39, 0.6)` |
| shadow | Floating surface shadow | `--auk-popover-box-shadow` | `0 10px 25px rgba(17, 24, 39, 0.18)` |
| radius | Corner radius | `--auk-alert-radius`, `--auk-box-radius`, `--auk-button-radius`, `--auk-dialog-radius`, `--auk-dialog-close-radius`, `--auk-popover-radius`, `--auk-popover-close-radius` | `0.375rem` (dialog, popover: `0.5rem`) |
| font | Type family | `--auk-alert-font-family`, `--auk-button-font-family`, `--auk-dialog-font-family`, `--auk-popover-font-family`, `--auk-tabs-font-family` | `inherit` |

Row counts: 4 + 2 + 10 + 7 + 7 + 2 + 4 + 2 + 1 + 3 + 1 + 2 + 1 + 2 + 1 + 3 + 3 + 1 + 1 + 7 + 5 = 69.

Appendix B — Discovery procedure

Ordered. For each role, stop at the first step that yields a value.

1. Find stylesheet sources: files ending `.css` under the project, excluding dependency and
   build-output directories. If none, files whose extension marks them as compiling to CSS,
   named by extension only.
2. Read every `:root`, `:host` and `html` rule and collect custom properties. Match names
   against role words: primary, brand, accent; text, foreground, fg; background, surface, bg;
   border; ring, focus; danger, error, destructive; success; warning; muted, disabled; radius,
   rounded; font, family. A match binds the role to `var(--that-property)`.
3. For roles still unbound, count colour literals (hex, rgb, hsl, oklch, named) across the
   stylesheets. The most frequent saturated colour becomes primary; the most frequent
   near-black becomes text; the most frequent near-white becomes surface; the most frequent
   low-contrast grey becomes border.
4. Repeat frequency ranking for `border-radius` (radius) and `font-family` (font).
5. Detect a dark scheme: a `prefers-color-scheme: dark` media query, or a `.dark`,
   `[data-theme="dark"]` or `[data-mode="dark"]` selector that redeclares the same custom
   properties. Record the selector shape verbatim.
6. Roles still unbound go to the "Clarify when needed" interview, one question per role, with
   the shipped fallback offered as the default answer.

Appendix C — Output contract (worked example)

A project with `--color-primary`, `--color-text`, `--color-bg`, `--color-border`,
`--radius-md`, `--font-sans` and a `[data-theme="dark"]` toggle.

```css
/* auk theme: binds project tokens to component properties */
:root {
  --auk-button-bg: var(--color-primary);
  --auk-button-border-color: var(--color-primary);
  --auk-tabs-selected-tab-color: var(--color-primary);
  --auk-tabs-selected-tab-border-block-end-color: var(--color-primary);
  --auk-box-color: var(--color-text);
  --auk-dialog-color: var(--color-text);
  /* remaining text, surface, border rows from Appendix A */
  --auk-button-radius: var(--radius-md);
  --auk-box-radius: var(--radius-md);
  --auk-button-font-family: var(--font-sans);
  --auk-alert-error-color: #b91c1c; /* no project danger token; shipped literal kept */
}

[data-theme="dark"] {
  --auk-dialog-backdrop-bg: rgba(0, 0, 0, 0.7);
  --auk-popover-box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  /* only properties whose project token changes under the dark selector */
}
```

Rules the block obeys:

- Sets only properties from Appendix A; never a size, spacing, duration or placement property.
- Uses `var(--project-token)` with no fallback when the project defines the token. If that
  token is later removed, the custom property becomes invalid at computed-value time and the
  component's own `var(--auk-*, literal)` fallback applies (CSS Custom Properties, section 3).
  Workstream C asserts this with an undefined-token case rather than trusting the spec.
- The no-nested-`var()` rule binds references only (`tests/objective.spec.ts:156`); a project
  stylesheet may nest freely.
- Contains no `forced-colors` query, no `url(`, no `@import`.
- The dark block exists only when Appendix B step 5 found a selector, and repeats that
  selector verbatim.

Appendix D — Gate partition: what a workflow skill keeps and skips

| `tests/objective.spec.ts` lines | Assertion | Workflow skill |
|---|---|---|
| 50-54 | SKILL.md, `references/<name>.md`, `references/demo.html` exist | SKILL.md only |
| 56-63 | name pattern, frontmatter valid | keep |
| 65-70 | body under 60 lines, no html/css/js fences | keep |
| 72-81 | "Clarify when needed" heading and vocabulary | keep |
| 83-90 | portability RULES over SKILL.md, reference, demo | keep, over the files that exist |
| 92-111 | `react-demo.tsx` shape | skip |
| 121-161 | contract table, section order, Qualifiers, css var rules, demo has no `--auk-*:` | skip |
| 173-212 | demo style and script match the reference | skip |
| 214-236 | WCAG rows and e2e spec titles | skip; Workstream C adds its own e2e spec by convention |
| 238-247 | evals with obvious, oblique, adjacent | keep |

Also: `tests/e2e/demos.spec.ts` and `scripts/build-demos.mjs` skip workflow skills.
`tests/integration/internal-skills.spec.ts` is unchanged; a workflow skill under `skills/`
stays public and must not set `metadata.internal`.

Appendix E — Incidental findings

- `skills/ui-alert`, `ui-dialog`, `ui-popover`, `ui-tabs` SKILL.md lack the override sentence
  present in ui-button and ui-box.
- `docs/component-spec.md:57` example `--auk-tab-selected-indicator-color` matches no shipped
  property.
- `README.md:18-23` and `:40` hard-code "six".
- No eval scenario touches styling or theming; the only "styled" mention is a negative
  scenario in `evals/ui-button.json`.
- Dark mode and `prefers-color-scheme` appear nowhere in `skills/`.
</appendices>

Author an execution plan that delivers Workstreams A through D in roadmap order; phase 5
stays optional and lands only when the evals in phase 3 show missed tokens. Draft real,
actionable steps naming the files each one touches, and keep the headings above as inputs
rather than steps. Treat the locked decisions as settled. Phase 1 lands before any file under
`skills/ui-theme/` is written, because every gate fails the skill until the partition exists.
Every measured number that reaches the skill's reference comes from a test run in
`tests/e2e/`, never from an estimate.

`/plan-agent:implementation-plan Add the ui-theme workflow skill that binds a project's styles to the auk custom properties --from-prompt docs/prompts/proposal-add-ui-theme-skill.md`
