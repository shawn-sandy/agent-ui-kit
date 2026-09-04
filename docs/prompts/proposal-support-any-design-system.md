---
type: proposal
intent: Let every auk component drop into any established design system by publishing the semantic role layer as a machine-readable contract, extending it to dimensions and modes with measured floors, and aligning names with Figma so a design-system team binds once and gets every component.
techniques: Long-context grounding, XML structure, Comparison tables, Positive framing, Output format
created: 2026-09-04
modified: 2026-09-04
status: gathering
artifact-url: https://claude.ai/code/artifact/fe77138e-4ea8-4b51-a6de-a31057fa5653
generated-sha: 2cc8f0581c655d50093dd9be8f84139f23dc8d9b6cfc56bfe3083df1e69a43d4
---

# Proposal: Support any design system by publishing the auk role layer as a contract

> This is a proposal for review, not an execution plan. It carries the
> grounded research and the decisions already made; the final instruction
> below hands off to drafting an execution plan from it.

<tldr>
- Twelve systems were surveyed (Figma's own design-system guidance, Salesforce Lightning,
  Adobe Spectrum, Material Web, IBM Carbon, Shoelace and Web Awesome, Radix, shadcn/ui, GitHub
  Primer, Atlassian, Bootstrap 5.3, Tailwind v4) alongside the W3C DTCG token format 2025.10.
  They converge on three tiers - primitive, semantic, component - and on the semantic tier as
  the surface a consumer binds. Component-level tokens as the consumer surface are being
  retired: Salesforce dropped them in SLDS 2, Carbon limits them to three components, Atlassian
  never had them, and 2024-2026 writing warns of ten-fold token growth.
- This repository has the component tier - 137 `--auk-<component>-*` properties with literal
  fallbacks, about to be wrapped in `@layer auk` by plan #27 - and a semantic tier that exists
  only as a 21-row prose table inside the ui-theme skill. A team binds up to 69 properties to
  get one brand in, and nothing in the tree is readable by a token pipeline or by Figma.
- Recommended path: publish the role layer as a contract. Generate a DTCG file and a
  `auk-roles.css` stylesheet that chains every brand property to a `--auk-role-*` property
  inside the auk layer, so binding a brand is at most 21 lines, a token build can emit it, and
  Figma can import it as one variable collection. Then extend the same layer: dimension roles
  with WCAG floors, a high-contrast mirror and a scoped-block option for multi-brand and
  density, token-file and Figma discovery in ui-theme, and generated per-component anatomy so
  Figma layer and variant names match `data-part` and `data-variant` one to one.
- Nothing installs, nothing runs at runtime, every component still works with no property
  defined anywhere, and the standalone guarantee the gates enforce stays untouched. The
  design-side record is a generated design canvas, with a Figma kit built from it only on
  request. Two decisions remain with the human (see open questions).
</tldr>

<context>
The idea, as stated: let the components integrate into any design system; look at what is out
there, what works and what does not; use Figma's approach and other design-system
documentation to standardise the repository's own rules and guidelines; and close the gaps
that stop teams with an established design system from adopting the skills.

What exists today, measured on 2026-09-04:

- Six component skills and one workflow skill under `skills/`. Every themeable value in a
  component reference is `var(--auk-<component>-<property>, <literal>)`; the grammar and the
  themeable set are fixed in `docs/component-spec.md` section 0. `tests/objective.spec.ts`
  rejects any `var()` that is not `--auk-<component>-*`, any nested `var()`, and any `--auk-*:`
  declaration in a demo, which is what guarantees a component works with nothing bound.
- 137 unique properties across the six references: 69 brand-bearing (57 colour, 7 radius, 5
  font-family) and 68 measured (23 spacing, 27 size and width, 14 type, 3 placement and
  filter, 1 motion). Counted by parsing the six css blocks; `tests/unit/ui-theme-mapping.spec.ts`
  pins the 69/68 split.
- Of the 68 measured properties, 13 carry an accessibility test or a user-setting guard: four
  minimum sizes (`--auk-button-min-size`, `--auk-tabs-tab-min-size`, `--auk-dialog-close-size`,
  `--auk-popover-close-size`), four focus-ring widths, four focus-ring offsets and one
  transition duration. `tests/e2e/ui-button.spec.ts:44` asserts 44 by 44 for the button, five
  specs assert a focus outline width above zero, and `tests/e2e/ui-theme.spec.ts:176` asserts
  the ring clears 3:1 against its surface. The other 55 - padding, gap, border widths, font
  sizes, weights, line heights, dialog and popover widths, popover placement - are not asserted
  by any test.
- `skills/ui-theme/references/ui-theme.md` maps 21 roles onto the 69 brand-bearing properties,
  discovers values by reading stylesheet sources only, emits one `:root` block of up to 69
  lines plus a mirrored dark block, and refuses every measured property. Its verification
  measures rather than estimates. The design decisions behind it are locked in
  `docs/prompts/proposal-add-ui-theme-skill.md` items 1 to 11.
- Plan #27, `docs/plans/enable-simple-component-style-overrides.md` (status todo), wraps every
  reference css block in `@layer auk`, adds a shared parser `scripts/auk-properties.mjs`, a
  generated catalog `docs/properties.md`, and a consumer guide `docs/theming.md` with three
  doors: a property at any scope, a plain rule that always wins, and ui-theme. It measured the
  layer's sharp edge: an unlayered reset such as `* { padding: 0 }` outranks the layered button
  and drops its padding-inline from 16px to 0px, so a host's reset must sit in a layer declared
  before `auk`.
- Issue #31 plans a ui-compose workflow skill (props from the contract table, compose sibling
  auk components); issue #15 plans a build layer that tests what an agent actually builds.
- Modes: no reference ships a dark value, `forced-colors` is mentioned in prose only
  (`skills/ui-box/references/ui-box.md:81`) and no reference writes a `forced-colors` block,
  `prefers-reduced-motion` guards one duration in ui-button, and every reference uses logical
  properties so right-to-left needs nothing. Dark is a theme concern: ui-theme mirrors a
  project's own dark form and never invents a value.
- Every component uses a native element or attribute where one exists (`<button>`,
  `<dialog>`, the `popover` attribute). This matters below: under forced colours the browser
  picks system colours from native element semantics, not ARIA roles.

What the survey found. Verified on the live pages on 2026-09-04; URLs in Appendix H.

Works, and nearly everyone does it the same way:

- One reserved prefix per library (`--slds`, `--spectrum`, `--md`, `--cds`, `--wa`, `--ds`,
  `--bs`), with collision avoidance stated as the reason. `--auk` is already this.
- Component properties with a fallback chain. Salesforce writes
  `var(--slds-c-button-color-background, var(--sds-c-button-color-background, transparent))`,
  Spectrum `var(--highcontrast-…, var(--mod-…, var(--spectrum-…)))`, Material Web
  `--md-filled-button-container-color` defaulting to `var(--md-sys-color-primary)`. The repo's
  `var(--auk-button-bg, #1a56db)` is the same shape with one hop fewer.
- Three tiers, with the semantic tier as the consumer surface. Figma's guidance names
  `color/action/primary`; Material Web has `--md-ref-*`, `--md-sys-*` and component tokens;
  Primer forbids using base tokens directly; Atlassian hides its palette entirely. The
  semantic tier is where theming happens in every system surveyed.
- Dark as a class or data attribute on a subtree root rather than a media query, because
  per-region overrides matter. Bootstrap states the trade-off outright: the media-query mode
  "eliminates your ability to change themes on a per-component basis". Shoelace and Radix ship
  no auto-detect and say why.
- `data-part` for internals and attributes for state. Ark UI and Zag.js use `data-part` byte
  for byte as this repo does; Radix and Ark encode state as `data-state="open"`, Zag and
  Kobalte as boolean `data-expanded`. The repo's ARIA-first order sidesteps that split.
- Cascade layers for library code so unlayered consumer CSS wins by definition: Tailwind v4
  (`@layer theme, base, components, utilities`), MUI v9.4, Chakra, Open Props UI. Plan #27 is
  this.
- A vendor-neutral token file. DTCG 2025.10 shipped on 28 October 2025 as three stable modules
  (Format, Colour, Resolver). Style Dictionary v5 and Terrazzo read it; Tokens Studio, Penpot
  and Figma (native import and export since December 2025) write it. Style Dictionary's
  `outputReferenceFallbacks` emits `var(--token, #fallback)`, the exact shape the references
  already use.

Does not work, with the evidence:

- Component tokens as the thing a consumer binds. Brad Frost reports a client with "over 5,000
  tokens"; a February 2026 piece measures 200 semantic tokens ballooning to 2,000 with a
  component tier; SLDS 2 support states component-level styling hooks "aren't supported";
  Carbon ships component tokens for three components only. The repo is at 137 for six
  components, which is the same trajectory if the component tier stays the front door.
- Shadow DOM as the theming boundary. `::part()` is visible to the parent only, cannot take
  structural pseudo-classes, and cannot cross nested parts; Chris Coyier calls it "fake CSS".
  A design system loses the cascade it is built on. The repo's light-DOM choice is a
  differentiator, not a gap.
- Numeric palette scales that invert in dark mode. Shoelace's inversion meant "third-party
  components that use the design tokens have to be styled independently"; Web Awesome now
  keeps palettes constant and swaps semantic tokens instead.
- Generic token names. shadcn's `--primary` and `--background` collide with other libraries,
  and its `cn()` merge silently drops custom colour utilities (discussion #6939).
- Duplication and renames. Primer re-declares the same 25 variables across every mode
  selector (issue #2729) and its v8 rename from `--color-*` to `--fgColor-*` was breaking;
  Salesforce's `--sds` to `--slds` rename is why every declaration carries a double fallback.
- Tooling gaps at the token boundary. Style Dictionary v5.5.2 has no resolver support, so a
  token file that needs the DTCG resolver module to make sense cannot be built by the most
  common pipeline; Figma's native export emits one JSON per mode and drops `$description`;
  no generator emits `@property`, so typed defaults cannot be expected from upstream.
- Invisible failure when a token is missing. Per MDN, a `var()` with no fallback whose
  reference is undefined makes the declaration invalid at computed-value time and the
  property behaves as `unset`, so `background: var(--token)` paints nothing. The repo's
  literal fallback is the mitigation every surveyed system that lacks it regrets.

Figma's approach, from the guidance the Figma MCP server ships (`figma-generate-library`,
`figma-code-connect`) and the help centre: variables before components; primitives in one
collection with one mode, semantic variables aliased to primitives and mode-aware,
components bound to semantics; a scope on every variable and a code syntax per platform, the
web one being the `var()` wrapper such as `var(--color-bg-primary)`; names slash-separated
(`color/action/primary`, `spacing/md`, `radius/md`); variants as `Property=Value` pairs
(`Size=Medium, Style=Primary, State=Default`); a variant matrix capped at 30 combinations;
"Semantic tokens should always point to primitives, not to other semantic tokens". Modes per
collection are plan-limited (10 on Professional, 20 on Organization, unlimited on
Enterprise); the Variables REST API is Enterprise-only; Code Connect needs an Organization or
Enterprise plan and a published library, and its v2 (18 August 2026) makes template files the
maintained path, with HTML supported; the MCP server's `get_variable_defs` works on every plan
and returns the variables a selection uses. Dev Mode prints a variable's code syntax next to
the design, which is the moment a `--auk-*` name becomes visible to a designer.
</context>

<finding>
Design-system teams bind at the semantic tier, and this repository already has one - the 21
roles inside ui-theme - but keeps it as prose only an agent can act on; publishing that tier
as a machine-readable contract (a DTCG file and a generated role-binding stylesheet) is the
whole integration, and every remaining gap - dimension roles with floors, contrast and scoped
modes, Figma-aligned anatomy names, token-file and Figma discovery - is an extension of that
one layer rather than a new mechanism.
</finding>

<comparison>
| What a design-system team brings | Repo today | Repo with this proposal |
|---|---|---|
| A semantic token set (`color/action/primary`, `--md-sys-color-primary`, `--ds-background-brand-bold`) | 21 roles in a prose table an agent reads; a human binds up to 69 component properties | `--auk-role-*` properties in a generated `auk-roles.css`; a brand is at most 21 lines |
| A token file and a build (DTCG, Style Dictionary, Terrazzo, Tokens Studio, Penpot) | Nothing machine-readable; `docs/properties.md` planned by #27 is a table for humans | `auk.tokens.json` (DTCG 2025.10), generated from the references and pinned by a test; a pipeline aliases 21 roles and emits the rest |
| A Figma library with variables, modes and code syntax | No Figma artefact; names exist only in code | The same token file imports as one `auk` collection; code syntax `var(--auk-role-…)`; variant and layer names match `data-variant` and `data-part` by rule |
| Modes: light, dark, high contrast, density, brand | Dark mirrored; forced-colours honoured; nothing for `prefers-contrast`, density or multi-brand | Contrast mirrored like dark; scoped block option (`[data-brand]`, `[data-density]`) with floors re-measured |
| A spacing, type and radius scale | Radius and font-family bindable; spacing, sizes and type refused outright | Dimension roles, bound on request, each with a WCAG floor the tests measure |
| Per-component documentation: anatomy, variants, states, tokens, accessibility | Reference: contract, structure, styles, behaviour, accessibility; anatomy implicit in the qualifier line | Generated anatomy section per component, from the qualifier line and the tokens file, in the same catalog #27 generates |
| Overrides that survive load order | Specificity and order today; `@layer auk` in #27 | Unchanged; the roles file joins the same layer |
| A way to verify the brand still passes | ui-theme measures contrast, focus width, ring contrast | Same measurements, plus floors for target size and motion when dimension roles are bound |

| Mechanism | The convergent pattern in the survey | This repo's choice |
|---|---|---|
| Consumer binding surface | Semantic tier (all twelve) | Roles, made concrete as `--auk-role-*` |
| Component tier | Present in SLDS 1, Spectrum, Material, Primer, Carbon, Bootstrap; retired or absent in SLDS 2, Atlassian, Radix, shadcn, Web Awesome | Present, generated, documented, never the front door |
| Fallback | Chain ending in a literal (SLDS, Spectrum, Material) | One hop in the reference, one more in the optional roles file |
| Mode switch | Class or attribute on a subtree root; media query where the project already uses one | Mirror the project's own form; never invent |
| Overrides | Unlayered consumer CSS wins (Tailwind v4, MUI, Chakra, Open Props UI) | `@layer auk` (#27), roles file in the same layer |
| Anatomy naming | `data-part` (Ark, Zag); Figma layer names | Same names in both, by rule |
| High contrast | Spectrum `--highcontrast-*` first in chain; Primer separate themes; most silent | System colours under `forced-colors` stay untouchable; `prefers-contrast: more` mirrored from the project |
| Typed properties (`@property`) | No generator emits it; Open Props "coming soon" | Not adopted; a registered initial value would defeat the `var()` fallback |
</comparison>

<decisions>
Locked and resolved - treat these as settled; do not reopen them:

Settled before this draft:

1. **Every component works with no custom property defined anywhere.** `docs/component-spec.md`
   section 2, asserted by `tests/objective.spec.ts` (literal fallback on every `var()`, no
   `--auk-*:` in a demo). Consequence: nothing in this proposal touches a component's css
   block, and the roles file is optional.
2. **Component references read only `--auk-<component>-*`, with a literal fallback and no nested
   `var()`.** `tests/objective.spec.ts`. Consequence: the role layer lives in a separate file
   and in the block ui-theme emits; a reference never reads a role directly.
3. **System colours under `forced-colors` are never themeable; values that honour a user setting
   stay literal.** `docs/component-spec.md` settled questions. Consequence: no theme block ever
   carries a `forced-colors` query, and the reduced-motion `0s` is not a token.
4. **Measured numbers are never estimated.** Contrast, target size and focus width come from
   `tests/e2e/`; a claim without an assertion is a defect. Consequence: every floor in Appendix
   B is enforced by a test before it is written into a reference or a token file.
5. **Dark is mirrored from the project's own form, never invented.** ui-theme proposal item 8.
   Consequence: no reference ships a dark value and no `light-dark()` default (open question 3
   asks whether to revisit).
6. **Every reference css block is wrapped in `@layer auk`, and a host's reset must sit in a
   layer declared before it.** Plan #27, decided 2026-09-04 after the prototype measured the
   reset hazard. Consequence: the roles file joins that layer so an unlayered override of one
   component property still wins.
7. **Public skills are `ui-` prefixed; `skills/` stays portable.** `tests/lib/frontmatter.ts`,
   `scripts/lint-portability.mjs`. Consequence: no package import, no install instruction, no
   framework name in anything this proposal adds under `skills/`; a Code Connect example, which
   imports a package, lives under `docs/`.

Resolved in the 2026-09-04 draft (author defaults, reversible at plan time):

8. **The integration contract is the role layer, published in two generated forms.**
   `skills/ui-theme/references/auk.tokens.json` (DTCG 2025.10: roles as tokens with the shipped
   fallback as value, component properties as tokens aliased to roles, `$extensions` carrying
   the CSS name, kind and floor) and `skills/ui-theme/references/auk-roles.css` (inside
   `@layer auk`, one `:root` rule that sets each brand-bearing component property to
   `var(--auk-role-<name>)`). Both are generated by one script from the references and the
   mapping table, and pinned by a vitest assertion exactly as `docs/properties.md` is in #27.
   Rationale: a chain that ends in the shipped literal keeps decision 1 (unbound role, invalid
   at computed-value time, literal applies - already proven for one hop by
   `tests/e2e/ui-theme.spec.ts`), and 21 lines replace 69. Propagates to Workstreams A and B,
   Appendix C and D.
9. **`role` is a reserved component slug.** `--auk-role-<name>` parses under the existing grammar
   as component `role`, so no component may take that name. One line in
   `docs/component-spec.md` and one assertion in `tests/objective.spec.ts`.
10. **Roles are the front door; component properties are the escape hatch.** Documentation,
    ui-theme output and the README example bind roles. A component property is set by hand
    only to make one component differ from the role, which is the pattern Material Web and
    Spectrum document. Propagates to Workstream E.
11. **ui-theme discovery gains two sources ahead of stylesheets: a DTCG token file on disk
    (`*.tokens`, `*.tokens.json`) and, when the request names a Figma file and a Figma MCP
    server is connected, the variables `get_variable_defs` returns.** Role words extend to
    slash-separated names (`color/action/primary`). Naming Figma is allowed by the portability
    lint; naming a token build tool is avoided. Propagates to Workstream B, Appendix E.
12. **A crosswalk table for known systems makes discovery deterministic.** For each surveyed
    system that exposes custom properties, the reference lists the token that fills each role
    (Appendix D shows the verified cells; the plan fills the rest from each system's live docs
    and never from memory). Propagates to Workstream B.
13. **Modes: `prefers-contrast: more` is mirrored the way dark is; density and brand are scoped
    blocks.** ui-theme's output contract gains a `scope` selector (default `:root`) so a block
    can target `[data-brand="b"]` or `[data-density="compact"]`, and the reference documents
    both recipes. `color-scheme` is never set by a component or a theme block. Propagates to
    Workstream C.
14. **Anatomy names are shared with Figma by rule.** `data-part` values are the layer names,
    `data-variant` values are the `Variant` property values, ARIA and native states are the
    `State` property values, and the `Variant` property is `Variant` not `Style`. Written into
    `docs/component-spec.md` and rendered per component by the catalog generator. Propagates to
    Workstream D.
15. **Rejected for this repository, with reasons recorded in Appendix F:** shadow DOM and
    `::part()`, `@property` registration, a JavaScript theme provider, utility-class-only
    theming, `data-size` variants in contract tables, and shipped dark defaults via
    `light-dark()` (pending open question 2).

Resolved with the maintainer on 2026-09-04:

16. **The design-side record is a generated design canvas, not a Figma kit.** A generator
    renders one `.dc.html` artboard per component - anatomy, variants and states, tokens -
    plus a Foundations artboard from the tokens file, into `docs/designs/components/`, from
    the same block extraction the demo builder uses and the same property parser the tokens
    file uses. Artboards are HTML, so the real shipped CSS paints the real component and a
    check can prove the canvas matches the references; a Figma kit has to translate that CSS
    into nodes, which the Figma MCP server's own procedure sizes at 20 to 100 write calls per
    build, and drifts on the next reference edit. An internal skill under `.claude/skills/`
    runs the generator, publishes through the built-in design skill and lets the artifacts
    hook record the URL, exactly as the existing canvas under `docs/designs/` was recorded.
    Nothing about the canvas goes under `skills/`: the artboard format is vendor-specific and
    the public tree stays vendor-neutral; the tokens file remains the design-side contract.
    A Figma kit, if a team asks for one, is built later from the canvas with the Figma MCP
    server's `figma-generate-design` procedure, which takes an HTML page as its input.
    Propagates to Workstreams D and G, Roadmap phases 7 and 8, Appendix E and F; closes the
    former open question on a Figma kit.
</decisions>

<workstreams>
**A - The tokens contract.** One generator, two outputs, one test.

- `scripts/build-tokens.mjs` reads the references through `scripts/auk-properties.mjs` (from
  #27) and the role table in `skills/ui-theme/references/ui-theme.md`, and writes
  `skills/ui-theme/references/auk.tokens.json` and `skills/ui-theme/references/auk-roles.css`.
  Shape in Appendix C and D.
- DTCG mapping: colour properties to `$type: color` with the sRGB object and `hex`; radius,
  spacing, sizes and offsets to `dimension`; font families to `fontFamily`; weights to
  `fontWeight`; line heights to `number`; durations to `duration`; the popover box-shadow to
  `shadow`. Fallbacks that DTCG cannot type - `transparent` (encodable as alpha 0), `inherit`,
  `auto`, `min()` and `calc()` expressions, the popover `position-area` and
  `position-try-fallbacks` values - keep `$type` by category and carry the literal verbatim in
  `$extensions`; the plan's generator tests settle each case.
- `$extensions` under a reverse-domain key, per the format module's guidance: `css` (the
  property name), `component`, `part`, `variant`, `state`, `kind` (`brand` or `measured`),
  `role` (for component tokens), and `floor` (`{ criterion, min }` or `none`) for measured ones.
- `tests/integration/tokens-file.spec.ts` asserts both files equal the generator's output byte
  for byte, that every brand-bearing property aliases exactly one role, that every measured
  property declares a floor or `none`, and that no role name collides with a component slug.
- The mapping table in `ui-theme.md` stays the human source; `tests/unit/ui-theme-mapping.spec.ts`
  keeps pinning it, and the tokens file is downstream of it. Nothing is hand-maintained twice.

**B - ui-theme version two.** The skill binds roles instead of properties.

- Output contract: copy `auk-roles.css` beside the first stylesheet that contains an `auk-`
  selector (or say where it must load), then emit one block of `--auk-role-*` bindings - at
  most the number of roles - under the `scope` selector, plus the mirrored dark and contrast
  blocks. A role bound to a project token is `var(--project-token)` with no fallback, exactly
  as today.
- Discovery order: DTCG token file, Figma variables via the MCP server when a file is named and
  the server is connected, then the existing stylesheet procedure. Each source feeds the same
  role matcher; the crosswalk table short-circuits it for known systems.
- `tests/e2e/ui-theme.spec.ts` gains the two-hop case: the roles file loaded, a role left
  unbound, the component's literal applies; and the override case: an unlayered
  `--auk-button-bg` set on the page beats the layered roles file.
- The reference's Verification section corrects the load-order sentence #27's next-steps
  already flag (custom properties on `:root` are read by inheritance, so load order is not the
  cause of a still-blue button).

**C - Dimension roles with floors.** Conditional on open question 1.

- Add the roles in Appendix B (spacing steps, type sizes and weights, line heights, border
  width, focus width and offset, target size, duration, floating-surface widths) and map the
  55 unasserted measured properties plus the 13 guarded ones onto them.
- Each guarded role carries a floor: target size at least 24 by 24 CSS pixels (2.5.8), focus
  width above zero and ring contrast at least 3:1 (2.4.7, 1.4.11), a duration that stays inside
  the `prefers-reduced-motion: no-preference` guard. The plan adds the missing assertions
  (tabs, dialog close, popover close target size) before any reference names the floor.
- ui-theme binds dimension roles only when the request asks or the project's token file
  declares a matching scale, then re-measures. The default stays brand-only, which keeps
  decision 7 of the ui-theme proposal as the default rather than the ceiling.
- `tests/e2e/ui-theme.spec.ts` gains a compact palette that sets every dimension role to its
  floor and asserts the measurements still pass, and one below-floor case that fails, so the
  floor is proven to bite.

**D - Anatomy and Figma alignment.** Documentation generated, never hand-written.

- Extend #27's `scripts/build-properties.mjs` so each component section opens with an anatomy
  block rendered from the qualifier line and the tokens file: parts, variants, states, the
  Figma layer, `Variant` and `State` names they map to, and the code syntax of each role the
  component reads.
- `docs/theming.md` gains a "Figma" section: import `auk.tokens.json` as a collection, set the
  web code syntax to `var(--auk-role-…)` on each variable (the import does not set it), bind
  component fills and strokes to the role variables, and, on an Organization or Enterprise
  plan, a Code Connect template for the button that maps `Variant` to `data-variant` and
  `State=Disabled` to `aria-disabled="true"`. The template lives in `docs/`, not `skills/`,
  because it imports a package.
- The design-side record is the generated canvas in Workstream G. The `figma-generate-library`
  procedure the Figma MCP server ships can still build a variable collection and component
  set from the tokens file; the proposal records the procedure and builds a published Figma
  kit only when a team asks, from the canvas (decision 16).

**E - Rules and guidelines.** The standard the ask requests, written once each.

- `docs/component-spec.md`: `role` is a reserved slug; every new brand-bearing property maps to
  exactly one role; every measured property declares a floor or `none`; part, variant and
  state names double as Figma names; no reference sets `color-scheme`, ships a dark value or
  reads a role; a settled-questions row "How does a design-system team bind tokens?" pointing
  at the roles file. A checklist line for each.
- `docs/theming.md` (from #27): the integration checklist in Appendix G, the four doors (role,
  property, plain rule, ui-theme), the scoped-block recipes, the floors table, and what a
  theme must never do.
- `README.md`: a "Fits your design system" section with the 21-line binding example, the
  token-file sentence, and the Figma import sentence. Keep it under 20 lines.
- `CLAUDE.md`: the generator command and the sentence that both generated files are never
  hand-edited.

**F - Evals.** `evals/ui-theme.json` gains scenarios that name a known system ("we use
shadcn", "our tokens are in Figma", "bind our Style Dictionary output") and one adjacent
scenario that asks for a component-level override and must not bind a role. Recorded in
`docs/evaluations.md` after a run, failures included.

**G - The design canvas.** Generated from the references, published as a canvas, checked
like every other generated file.

- `scripts/build-design.mjs` reads each component reference through the demo builder's
  block extraction and `scripts/auk-properties.mjs`, and writes
  `docs/designs/components/<slug>.dc.html` with three panels: anatomy (the Structure block
  with each `data-part` labelled), variants and states (the instances the demo renders, with
  dialog and popover shown open by inlining the reference's script the way the demos do), and
  tokens (the roles the component reads, its properties, the shipped fallbacks). It also
  writes `foundations.dc.html` from the tokens file - the roles as chips with their shipped
  values - and `canvas.json` laying the artboards out Foundations first, then components.
- Two modes. Default renders the shipped fallbacks. `--roles <file>` binds a roles block over
  the same artboards, so a design-system team reviews its own brand on the canvas without
  opening Figma, and the specimen on the proposal page becomes an artboard pair.
- `.claude/skills/design-kit/SKILL.md`, internal and not model-invocable like
  `new-component`: runs the generator, hands the artboards to the built-in design skill to
  publish, and moves the row the artifacts hook appends into the Designs table of
  `docs/artifacts.md`.
- `tests/integration/design-canvas.spec.ts` asserts every generated artboard and
  `canvas.json` equal the generator's output byte for byte, the same pattern as
  `docs/properties.md` and the tokens file.
- Nothing under `skills/` names the canvas or its format. The public, vendor-neutral
  design-side contract is the tokens file (Workstream A); the canvas is the maintainer's
  record and review surface.
- Bridge: `figma-generate-design` takes an HTML page and builds it in Figma, so a Figma kit
  starts from the canvas rather than from scratch when one is wanted.
</workstreams>

<risks>
- **The roles file is a shared token file inside `skills/`, which decision 2 of the ui-theme
  proposal read as forbidden.** That decision protected the standalone guarantee, and this
  design keeps it: no component reference reads a role, the objective suite still rejects any
  non-component `var()` in a reference, and the roles file is a separate optional file the
  workflow skill ships. Open question 1 asks the human to confirm that reading.
- **A two-hop chain adds a resolution point where things go wrong silently.** An unbound role
  makes the component property invalid at computed-value time and the literal applies, which
  is the intended behaviour; a misspelled role name does the same and looks like "the theme
  did nothing". Mitigation: the two-hop e2e case, and the verification step's instruction to
  check computed styles, never the eye.
- **Figma's own guidance says semantic tokens should not alias other semantic tokens.** A
  project that maps `color/action/primary` to `auk/role/primary` is one hop deeper than Figma
  recommends. The trade is 21 bindings instead of 137 and one place to change; the reference
  says so plainly and offers binding component tokens directly as the alternative.
- **DTCG cannot type every shipped fallback, and no consumer implements the whole
  specification.** Style Dictionary v5 has no resolver support, Figma drops `$description` and
  exports one file per mode, Tokens Studio and Penpot emit non-spec types. Mitigation: the
  tokens file is modeless (shipped defaults only) so Style Dictionary v5 builds it today;
  untypeable literals ride in `$extensions`; nothing depends on `$description` surviving.
- **Dimension roles reopen a locked scope decision and can move measured values.** Mitigation:
  brand-only stays the default, every guarded role has a floor with an assertion, the compact
  palette proves the floors hold, and the below-floor case proves they bite. Conditional on
  open question 1.
- **Token explosion is the failure the survey warns about, and 137 grows with every
  component.** Mitigation: the front door is 21 roles; component properties are generated,
  catalogued and documented as exceptions; the anatomy generator makes them visible without
  making them the binding surface.
- **Renames are the pain every surveyed system paid for.** `--sds` to `--slds`, Primer v8.
  The repo says "pin a commit" today. The tokens file's `$deprecated` key is the place to
  record a rename; a deprecation policy is a next step, not this scope.
- **The artboard format is one vendor's and may change.** The generator is its only writer
  and the check its only reader, so a format change costs one script edit and one
  regeneration; nothing a consumer installs depends on it, and the tokens file, not the
  canvas, is the contract.
- **Portability lint bans words a design-system guide naturally uses.** Nothing under `skills/`
  may name a framework, preprocessor or package; the Code Connect example and the tool names
  in the crosswalk footnotes live under `docs/`. The crosswalk cells themselves are custom
  property names, which the lint allows.
</risks>

<open-questions>
Decisions still owned by the human - surface them, do not answer them:
- **Dimension roles, and the roles file inside `skills/`.** Recommended: adopt both - bind
  dimensions only on request with the floors in Appendix B measured, and ship `auk-roles.css`
  and `auk.tokens.json` under `skills/ui-theme/references/` so an installed skill carries them.
  The alternative keeps ui-theme brand-only and puts the two files under a repo-root `tokens/`
  directory that installers never copy.
- **Shipped dark defaults via `light-dark()`.** Recommended: no. It would put an invented dark
  palette into every reference, contradict decision 5, need `color-scheme` set somewhere, and
  `light-dark()` reached Baseline in May 2024, so it is newer than the March 2022 layer
  support #27 already leans on. A project with a dark scheme gets it mirrored; a project
  without one gets nothing, which is what Shoelace and Radix chose on purpose.
</open-questions>

<roadmap>
| Phase | Work | Size | Depends on |
|---|---|---|---|
| 1 | Land plan #27 (layer, shared parser, `docs/properties.md`, `docs/theming.md`) | M | - |
| 2 | Workstream A: `build-tokens.mjs`, the two generated files, the pinning test, the reserved slug | M | 1 |
| 3 | Workstream B: ui-theme v2 output, discovery sources, crosswalk, two-hop and override e2e cases | M | 2 |
| 4 | Workstream C: dimension roles, floors, missing target-size assertions, compact palette | M | 3, open question 1 |
| 5 | Workstream D: anatomy generator, Figma section, Code Connect example | S | 2 |
| 6 | Workstream E and F: spec rows, README section, CLAUDE.md line, evals run and recorded | S | 3 |
| 7 | Workstream G: design generator, internal skill, canvas check, first published canvas | M | 2, 5 |
| 8 | Only on request: a Figma kit built from the canvas with `figma-generate-design` | L | 7 |
</roadmap>

<appendices>
Appendix A - Survey: how twelve systems expose theming (verified 2026-09-04)

| System | Grammar example | Tiers | Consumer override | Modes | Notable pitfall |
|---|---|---|---|---|---|
| Figma guidance | `color/action/primary`; code syntax `var(--color-bg-primary)` | primitive, semantic, component | bind variables; Code Connect maps `Variant=Primary` to a prop | modes per collection, plan-limited | semantic must not alias semantic; REST API Enterprise-only |
| Salesforce SLDS | `var(--slds-c-button-color-background, var(--sds-c-button-color-background, transparent))` | global `-g-`, shared `-s-`, component `-c-` | set the hook in component CSS; generated per-component table | global hooks re-valued per mode; Comfy and Compact density | SLDS 2 drops component hooks; `--sds` rename forces double fallbacks |
| Adobe Spectrum | `var(--highcontrast-…, var(--mod-…, var(--spectrum-…)))` | global, component, `--mod` | `--mod-*` in context; `<sp-theme>` | `.spectrum--dark`, scale medium and large, `forced-colors` | three visual languages; `--system-*` names unstable by design |
| Material Web | `--md-filled-button-container-color` defaults to `var(--md-sys-color-primary)` | `--md-ref-*`, `--md-sys-*`, component (unprefixed) | set a token on `:root` or a selector | light and dark shown, no switch documented | no palette or motion tokens |
| IBM Carbon | `var(--cds-background)`, `--cds-layer-01`, `--cds-button-primary` | theme groups, layer sets, three component groups | Sass `theme()` mixin, `<Layer>` | four themes, `prefers-color-scheme` | layer and field numbering off by one; Sass required |
| Shoelace, Web Awesome | `--wa-color-brand-fill-normal`, `--wa-color-brand-on-normal`, `--wa-space-scale` | palette, semantic, component props | `:root` tokens, `::part()`, `:state()` | `.sl-theme-dark`, `.wa-dark`, no auto-detect | scale inversion broke third parties; parts are "fake CSS" |
| Radix | `--accent-9`, `--accent-contrast`, `--accent-surface` | twelve-step scales plus aliases | `<Theme>` props, `data-accent-color`, CSS on `.radix-themes` | `.dark` class, `appearance`; no media query | dark mode under SSR is "deceptively complex" |
| shadcn/ui | `--primary`, `--primary-foreground`, `--radius`, `@theme inline` | one semantic tier | edit the copied source; `cn()` | `.dark` | `twMerge` drops custom colours; generic names collide |
| GitHub Primer | `--fgColor-default`, `--bgColor-muted`, `--control-bgColor-rest` | base (never used directly), functional, component | theme CSS file plus data attributes | `data-color-mode`, nine themes including high contrast, three densities | v8 rename; 25 variables duplicated per selector |
| Atlassian | `token('space.200')` emits `var(--ds-space-200)` | semantic only | none; lint-enforced | `data-theme` and `data-color-mode` set by JavaScript | inert until the theme mounts |
| Bootstrap 5.3 | `--bs-btn-bg`, `--bs-btn-border-color` | root and component variables | modifier classes rewrite variables; `data-bs-theme` on any subtree | attribute or media query | media-query mode removes per-component theming |
| Tailwind v4, Open Props | `@theme { --color-mint-500: … }`; `--size-3`, `--gray-5` | one namespace tier | `@theme inline`; unlayered props | user-defined | a value that references a variable needs `@theme inline` or a descendant override is ignored |

Headless conventions for reference: Radix Primitives and Ark UI encode state as
`data-state="open"`, Zag.js and Kobalte as boolean `data-expanded`; Ark and Zag use
`data-part` exactly as this repo does. USWDS is Sass-only with no custom-property surface and
is not a binding target.

Appendix B - The role layer, version two

Brand roles (unchanged from ui-theme, 21 roles onto 69 properties): primary, on-primary, text,
surface, border, divider, focus, info, info-surface, danger, danger-surface, success,
success-surface, warning, warning-surface, muted, inverse, overlay, shadow, radius, font. The
full property lists are in `skills/ui-theme/references/ui-theme.md` and are pinned by
`tests/unit/ui-theme-mapping.spec.ts`.

Candidate dimension roles (Workstream C). Shipped values are the fallbacks measured from the
references on 2026-09-04; the plan settles the exact grouping and every count with a test.

| Role | Shipped value | Properties it covers (examples) | Floor | Asserted today |
|---|---|---|---|---|
| space-1 | 0.25rem | `--auk-tabs-gap`, `--auk-popover-offset`, `--auk-tabs-panel-padding-inline` | none | no |
| space-2 | 0.5rem | `--auk-button-gap` | none | no |
| space-3 | 0.625rem and 0.75rem | `--auk-button-padding-block`, `--auk-alert-gap`, `--auk-alert-padding-block`, `--auk-popover-gap` | none | no |
| space-4 | 1rem | `--auk-button-padding-inline`, `--auk-box-padding`, `--auk-dialog-gap`, `--auk-popover-padding` | none | no |
| space-5 | 1.25rem | `--auk-dialog-padding` | none | no |
| border-width | 1px | seven `*-border-width` and `*-divider-width` properties | none | no |
| text-base | 1rem | `--auk-button-font-size`, `--auk-alert-font-size`, `--auk-tabs-tab-font-size` | none | no |
| text-lg | 1.125rem to 1.25rem | `--auk-dialog-title-size`, `--auk-dialog-close-font-size`, `--auk-alert-icon-size` | none | no |
| weight-strong | 600 | `--auk-button-font-weight`, `--auk-tabs-tab-font-weight` | none | no |
| leading-tight | 1.25 to 1.4 | `--auk-button-line-height`, `--auk-dialog-title-line-height` | none | no |
| leading-normal | 1.5 | `--auk-alert-line-height`, `--auk-dialog-line-height`, `--auk-tabs-panel-line-height` | none | no |
| target | 2.75rem | `--auk-button-min-size`, `--auk-tabs-tab-min-size`, `--auk-dialog-close-size`, `--auk-popover-close-size` | 24 by 24 CSS px (2.5.8) | button only, at 44 |
| focus-width | 3px | four `*-focus-width` properties | above 0 (2.4.7), ring 3:1 (1.4.11) | yes, five specs and ui-theme |
| focus-offset | 2px (tabs -3px) | four `*-focus-offset` properties | none measured; ring contrast covers it | no |
| duration | 120ms | `--auk-button-transition-duration` | inside the reduced-motion guard | guard is in the reference |
| surface-width | 32rem dialog, 22rem popover | `--auk-dialog-inline-size`, `--auk-popover-inline-size` | none | no |
| hover-brightness, placement | 0.92; `block-end span-inline-end` | `--auk-button-hover-brightness`, the two popover position properties | none | placement measured in ui-popover spec |

Appendix C - `auk.tokens.json`, excerpt of the generated shape

```json
{
  "auk": {
    "role": {
      "$description": "Semantic roles. Bind these; every component property below aliases one.",
      "primary": {
        "$type": "color",
        "$value": { "colorSpace": "srgb", "components": [0.102, 0.337, 0.859], "hex": "#1a56db" },
        "$description": "Brand action colour",
        "$extensions": { "<reverse-domain>.auk": { "css": "--auk-role-primary", "kind": "brand" } }
      },
      "radius": {
        "$type": "dimension",
        "$value": { "value": 0.375, "unit": "rem" },
        "$extensions": { "<reverse-domain>.auk": { "css": "--auk-role-radius", "kind": "brand" } }
      }
    },
    "button": {
      "bg": {
        "$type": "color",
        "$value": "{auk.role.primary}",
        "$extensions": { "<reverse-domain>.auk": { "css": "--auk-button-bg", "component": "button", "kind": "brand", "role": "primary" } }
      },
      "min-size": {
        "$type": "dimension",
        "$value": { "value": 2.75, "unit": "rem" },
        "$extensions": { "<reverse-domain>.auk": { "css": "--auk-button-min-size", "component": "button", "kind": "measured", "floor": { "criterion": "2.5.8", "min": { "value": 24, "unit": "px" } } } }
      }
    }
  }
}
```

The file has no modes and no resolver, so Style Dictionary v5 and Terrazzo both build it
today. Colour components are the sRGB fractions of the shipped hex, computed by the generator.

Appendix D - `auk-roles.css` and the four binding routes

The generated roles file, excerpt. It lives in the auk layer so any unlayered rule beats it:

```css
/* Generated from the component references. Do not edit. See ui-theme. */
@layer auk {
  :root {
    --auk-button-bg: var(--auk-role-primary);
    --auk-button-border-color: var(--auk-role-primary);
    --auk-tabs-selected-tab-color: var(--auk-role-primary);
    --auk-button-color: var(--auk-role-on-primary);
    --auk-box-color: var(--auk-role-text);
    --auk-dialog-bg: var(--auk-role-surface);
    --auk-button-radius: var(--auk-role-radius);
    --auk-button-font-family: var(--auk-role-font);
    /* … one line per brand-bearing property, 69 in total … */
  }
}
```

Route 1, by hand. A team with its own tokens writes only the roles it has:

```css
:root {
  --auk-role-primary: var(--color-action-primary);
  --auk-role-on-primary: var(--color-action-on-primary);
  --auk-role-text: var(--color-text-default);
  --auk-role-surface: var(--color-surface-default);
  --auk-role-border: var(--color-border-default);
  --auk-role-radius: var(--radius-md);
  --auk-role-font: var(--font-sans);
}
[data-theme="dark"] {
  --auk-role-overlay: var(--overlay-strong);
}
```

Route 2, from a token build. In the project's token source, alias the roles once:

```json
{ "auk": { "role": { "primary": { "$value": "{color.action.primary}" } } } }
```

With `auk.tokens.json` as a second source, Style Dictionary's `css/variables` format with
`outputReferences` emits the role bindings and the component chain in one file; Terrazzo does
the same through its CSS plugin and can lint the foreground and background pairs for
contrast before the browser ever sees them.

Route 3, a known system. The crosswalk row makes the block deterministic. Cells shown are the
names verified on 2026-09-04; blank cells are filled by the plan from each system's live docs.

| Role | shadcn/ui | Material Web | Primer | Atlassian | Bootstrap 5.3 |
|---|---|---|---|---|---|
| primary | `--primary` | `--md-sys-color-primary` | `--bgColor-accent-emphasis` | | `--bs-primary` |
| on-primary | `--primary-foreground` | `--md-sys-color-on-primary` | | | |
| text | `--foreground` | `--md-sys-color-on-surface` | `--fgColor-default` | | `--bs-body-color` |
| surface | `--background` | `--md-sys-color-surface` | `--bgColor-default` | | `--bs-body-bg` |
| border | `--border` | | `--borderColor-default` | | `--bs-border-color` |
| focus | `--ring` | | | | `--bs-focus-ring-color` |
| danger | | `--md-sys-color-error` | | | `--bs-danger` |
| radius | `--radius` | | | | `--bs-border-radius` |
| font | | | | | `--bs-body-font-family` |
| space (dimension) | | | | `--ds-space-200` | |

Route 4, a scoped block for density or a second brand. Custom properties inherit, so a block
under any selector themes that subtree only:

```css
[data-density="compact"] {
  --auk-role-target: 2rem;        /* floor: 24 by 24 CSS px, re-measured */
  --auk-role-space-4: 0.75rem;
}
[data-brand="acme"] {
  --auk-role-primary: var(--acme-red);
  --auk-role-on-primary: var(--acme-white);
}
```

Appendix E - Figma alignment

| Figma concept | auk concept | Rule or mechanism |
|---|---|---|
| Variable collection with primitives, semantics and components | `auk.tokens.json`: `auk.role.*` are the semantics, `auk.<component>.*` alias them; the project's primitives stay the project's | Import the file as an `auk` collection; alias each role to a project variable |
| Mode (light, dark, contrast, density) | The project's own dark or contrast selector, mirrored; a scoped block for density and brand | ui-theme mirrors, never invents; scope selector option |
| Scope on a variable (fill, stroke, text, gap, radius) | `$type` and `$extensions.kind` on each token | Generator emits the type; the Figma import maps type to scope |
| Code syntax, web | `var(--auk-role-<name>)` on a role variable; `var(--auk-<component>-<property>)` on a component variable | Set after import (import does not set it); documented in `docs/theming.md` |
| Component `Variant` property, values `Primary`, `Secondary` | `data-variant="primary"`, `"secondary"` | Same words, Title Case in Figma, lowercase in code; the property is named `Variant` |
| Component `State` property, values `Default`, `Hover`, `Focus`, `Disabled` | `:hover`, `:focus-visible`, `aria-disabled="true"`, `aria-selected`, `open` | Same words; the qualifier line's states are the `State` values |
| Layer names inside a component | `data-part` values (`icon`, `tablist`, `panel`, `close`) | Same words, Title Case in Figma |
| Variant matrix cap of 30 | Contract tables stay small (button: 3 variants, 3 states) | Existing scope rule in the spec |
| Code Connect template | `.figma.ts` mapping `Variant` and `State` to the HTML attributes | Example under `docs/`; Organization or Enterprise plan and a published library required |
| Dev Mode and MCP `get_variable_defs` | ui-theme discovery source | Any plan; the agent reads names and values, never a rendered page |
| A published component kit | The generated design canvas (Workstream G): HTML artboards painted by the shipped CSS | Pushed into Figma with `figma-generate-design` only when a team asks |

Appendix F - Mechanisms considered and rejected

| Mechanism | Why not here | Evidence |
|---|---|---|
| Shadow DOM with `::part()` | Parts are visible to the parent only, take no structural pseudo-classes and do not nest; the host loses the cascade and layers | MDN `::part`; Shoelace docs; Coyier, "It's fake CSS" |
| `@property` registration | A registered initial value means the `var()` fallback never triggers, which breaks decision 1; `inherits: false` would break subtree theming; no generator emits it | MDN `@property`; Terrazzo and Open Props docs |
| JavaScript theme provider | Atlassian's tokens are inert until the theme mounts; Radix documents SSR dark-mode pain; the repo ships no runtime | Atlassian tokens docs; Radix dark-mode docs |
| Utility-class-only theming | shadcn's merge drops custom colours; Tailwind's `@theme inline` trap; a utility set is a framework choice | shadcn discussion #6939; Tailwind v4 theme docs |
| `data-size` variants in contract tables | Every surveyed system does density as a scope (Spectrum scale, Radix scaling, Primer density, Web Awesome `--wa-space-scale`); a size axis multiplies properties | Survey, Appendix A |
| Shipped dark defaults via `light-dark()` | Invents a palette the project did not choose; needs `color-scheme`; newer than the layer baseline | Decision 5; MDN `light-dark()` |
| A component tier as the binding surface | Token explosion; SLDS 2 removed it; Carbon limits it | Brad Frost; Trailhead SLDS 2; Carbon button tokens |
| A `forced-colors` theme block | Would let a theme defeat a reader's high-contrast setting | Decision 3 |
| A hand-built Figma kit now | Translates CSS into nodes at 20 to 100 write calls per build and drifts on the next reference edit; Code Connect needs an Organization plan | `figma-generate-library` procedure; decision 16 |

Appendix G - Design-system integration checklist (the rules and guidelines)

For a component author, enforced by the gates:

1. Every themeable value is `var(--auk-<component>-<property>, <literal>)`; no nested `var()`,
   no role read in a reference, no `color-scheme`, no dark value, no `light-dark()`.
2. Every brand-bearing property maps to exactly one role in the tokens file; every measured
   property declares a floor or `none`.
3. Part, variant and state names are lowercase kebab-case and double as the Figma layer,
   `Variant` and `State` names; `role` is not a component slug.
4. The css block lives in `@layer auk`; values that honour a user setting stay literal.
5. A measured number appears in a reference or a token file only after `tests/e2e/` asserts it.

For a team integrating the components, written into `docs/theming.md`:

1. Declare layer order first: `@layer reset, auk, <your layers>;` before any stylesheet, and put
   the reset in its layer. Skipping this is the one way the components lose their padding.
2. Copy `auk-roles.css` in, then bind roles, not properties: `--auk-role-primary:
   var(--your-token)` with no fallback, so removing the token falls back to the shipped literal.
3. Bind a component property only to make one component differ from its role.
4. Modes: redeclare roles under your own dark or contrast selector; never write a value your
   system does not have; never write a `forced-colors` block.
5. Density and brands: a scoped block on a subtree root; a target size never below 24 by 24
   CSS pixels, a focus ring never below 3:1 against its surface.
6. Measure after binding: an accessibility scan for text contrast, a computed-style read of the
   focus outline, and the ring's contrast; never estimate a ratio.
7. Figma: import `auk.tokens.json` as a collection, set the web code syntax, alias roles to
   your variables, name variants and layers as the anatomy section says, and add Code Connect
   templates if your plan allows.

Appendix H - Sources

Repository: `docs/component-spec.md`; `skills/ui-theme/references/ui-theme.md`;
`docs/prompts/proposal-add-ui-theme-skill.md`; `docs/plans/enable-simple-component-style-overrides.md`;
`tests/objective.spec.ts`; `tests/unit/ui-theme-mapping.spec.ts`; `tests/e2e/ui-theme.spec.ts`;
`tests/e2e/ui-button.spec.ts`; issues #15, #27, #31. Figma MCP server skills read on
2026-09-04: `skill://figma/figma-generate-library/SKILL.md`, `skill://figma/figma-code-connect/SKILL.md`.

Standards and tools: https://www.designtokens.org/tr/2025.10/format/ ;
https://www.designtokens.org/tr/2025.10/color/ ; https://www.designtokens.org/tr/2025.10/resolver/ ;
https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/ ;
https://styledictionary.com/reference/hooks/formats/predefined/ ; https://styledictionary.com/info/dtcg/ ;
https://github.com/style-dictionary/style-dictionary/issues/1590 ; https://terrazzo.app/docs/integrations/css/ ;
https://terrazzo.app/docs/guides/resolvers/ ; https://terrazzo.app/docs/linting/ ;
https://docs.tokens.studio/manage-settings/token-format ; https://help.penpot.app/user-guide/design-tokens/

Figma: https://help.figma.com/hc/en-us/articles/15145852043927-Create-and-manage-variables-and-collections ;
https://help.figma.com/hc/en-us/articles/360040328273 ; https://developers.figma.com/docs/rest-api/variables/ ;
https://www.figma.com/blog/schema-2025-design-systems-recap/ ;
https://forum.figma.com/ask-the-community-7/native-variable-export-feature-47831 ;
https://developers.figma.com/docs/code-connect/ ; https://developers.figma.com/docs/code-connect/html ;
https://github.com/figma/code-connect/blob/main/CHANGELOG.md ;
https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts ;
https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server ;
https://www.figma.com/resource-library/design-tokens/

Systems: https://trailhead.salesforce.com/content/learn/modules/salesforce-lightning-design-system-2-for-developers/get-help-and-support-with-slds-2 ;
https://raw.githubusercontent.com/salesforce-ux/design-system/main/ui/components/buttons/base/_index.scss ;
https://raw.githubusercontent.com/adobe/spectrum-css/main/components/button/index.css ;
https://opensource.adobe.com/spectrum-web-components/tools/theme/ ; https://material-web.dev/theming/material-theming/ ;
https://material-web.dev/components/button/ ; https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/styles/docs/sass.md ;
https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/styles/scss/components/button/_tokens.scss ;
https://github.com/carbon-design-system/carbon/discussions/7743 ; https://shoelace.style/getting-started/themes ;
https://webawesome.com/docs/tokens/ ; https://github.com/shoelace-style/shoelace/issues/381 ;
https://github.com/shoelace-style/webawesome/discussions/1637 ; https://www.radix-ui.com/themes/docs/theme/dark-mode ;
https://www.radix-ui.com/colors/docs/overview/usage ; https://ark-ui.com/docs/guides/styling ; https://zagjs.com/guides/styling ;
https://kobalte.dev/docs/core/overview/styling ; https://ui.shadcn.com/docs/theming ;
https://github.com/shadcn-ui/ui/discussions/6939 ; https://primer.style/product/primitives/token-names/ ;
https://github.com/primer/css/issues/2729 ; https://atlassian.design/foundations/tokens/use-tokens-in-code/ ;
https://atlassian.design/foundations/tokens/design-tokens/ ; https://designsystem.digital.gov/design-tokens/ ;
https://getbootstrap.com/docs/5.3/customize/color-modes/ ; https://getbootstrap.com/docs/5.3/customize/css-variables/ ;
https://getbootstrap.com/docs/5.3/components/buttons/ ;
https://tailwindcss.com/docs/theme ; https://open-props.style/ ; https://nerdy.dev/open-props-ui ;
https://mui.com/material-ui/customization/css-layers/ ; https://chakra-ui.com/docs/styling/cascade-layers

Platform and commentary: https://developer.mozilla.org/en-US/docs/Web/CSS/@layer ;
https://developer.mozilla.org/en-US/docs/Web/CSS/@property ; https://developer.mozilla.org/en-US/docs/Web/CSS/::part ;
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/var ;
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark ;
https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors ;
https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast ;
https://moderncss.dev/how-custom-property-values-are-computed/ ; https://bradfrost.com/blog/post/design-systems-qa/ ;
https://sujeet.pro/articles/design-tokens-and-theming ;
https://blog.master.dev/a-modest-web-components-styling-proposal-an-i-know-what-im-doing-selector/ ;
https://gomakethings.com/design-systems-are-bad-use-case-for-the-shadow-dom-in-web-components-actually/

Not verified because the pages block fetching, and therefore not relied on above: the
Salesforce LWC styling-hooks page, the Nathan Curtis interview, and the JavaScript-rendered
Spectrum tokens site (the GitHub repository was read instead).
</appendices>

Author an execution plan that delivers Workstreams A, B, D, E, F and G in roadmap order, with
Workstream C included only if open question 1 is answered yes. Draft real, actionable steps
naming the files each one touches - the two generators, the generated files, the pinning
tests, the internal design-kit skill, the ui-theme reference sections, the spec rows, the
theming guide sections, the README section, the e2e cases and the evals - and write each test
before the change it proves. Treat the locked decisions as settled inputs, carry the two open
questions into the plan's unresolved-questions section rather than answering them, and verify every crosswalk cell and
every count against a live source or a parser run, never from memory.
