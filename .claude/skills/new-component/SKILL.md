---
name: new-component
description: Scaffolds and verifies a new component skill in this repository, following docs/component-spec.md. Takes the component name as an argument.
disable-model-invocation: true
---

# New component skill

Adds one component to `skills/`, following the authoring contract. The component name is
`$ARGUMENTS` (lowercase, single word, used verbatim as the directory name, the `name`
frontmatter value, and the `auk-<name>` class root).

If `$ARGUMENTS` is empty, ask which component to add before doing anything else.

## Steps

1. Read `docs/component-spec.md` in full. It is the contract; this skill is only the
   running order. Section 0's settled-questions table answers most authoring decisions.
2. Read an existing component of similar shape as the working example - `button` (no
   JavaScript), `alert` (live region), `dialog` (focus management), `tabs` (keyboard
   navigation). Match its structure exactly.
3. Create `skills/$ARGUMENTS/SKILL.md`. Standard frontmatter keys only, `name` equal to
   the directory name, third-person pronoun-free description with the disambiguating
   phrase early, body under 60 lines, no component code.
4. Create `skills/$ARGUMENTS/references/$ARGUMENTS.md`: five sections in the fixed order,
   one fenced block each, seven contract rows in order, every themeable CSS value written
   as `var(--auk-$ARGUMENTS-*, <literal>)` with no nested `var()` in a fallback, and a
   named `init<Component>(root)` export returning a teardown.
5. Create `skills/$ARGUMENTS/references/demo.html` by copying the closest existing demo
   and replacing the hand-written parts - the markup, page chrome and wiring. Leave the
   marker-delimited regions alone, then run `node scripts/build-demos.mjs` to fill them
   from the reference.
6. Write `tests/e2e/$ARGUMENTS.spec.ts`. Every WCAG criterion claimed in the contract
   table needs a test whose title starts with that criterion, and any number stated in
   the reference must be measured here rather than estimated.
7. Write `evals/$ARGUMENTS.json` with three scenarios: `obvious`, `oblique`, `adjacent`.
   Copy the shape from `evals/button.json`.
8. Run `npm run check`. It must exit zero. Fix what it names; do not weaken a gate.
9. Work through the checklist in section 8 of the spec and report each item's status
   honestly, including anything you could not verify.

## Do not

- Do not add the component to any manifest by hand. `.claude-plugin/marketplace.json` and
  `.codex-plugin/plugin.json` point at `./skills/` as a whole.
- Do not hand-edit a generated region in `demo.html`.
- Do not run the evaluation sweep unless asked. It costs real model calls across three
  models, and `docs/evaluations.md` is written by hand.
