---
name: new-component
description: Scaffolds and verifies a new ui-prefixed component skill in this repository, following docs/component-spec.md. Takes the unprefixed component slug as an argument.
disable-model-invocation: true
metadata:
  internal: true
---

# New component skill

Adds one component to `skills/`, following the authoring contract. `$ARGUMENTS` is
the unprefixed component slug. The skill name is `ui-$ARGUMENTS`, used as the
directory name, the `name` frontmatter value and the reference/eval/test filename.
The component slug stays unprefixed for the public DOM contract: `auk-$ARGUMENTS`,
`--auk-$ARGUMENTS-*`, `init<Component>` and `Auk<Component>Props`.

Check the component slug before creating anything. It must match
`^[a-z0-9]+(?:-[a-z0-9]+)*$` - lowercase letters and digits, single inner hyphens, no
leading, trailing or doubled hyphen - and the final `ui-` skill name must run to 64
characters or fewer, both enforced by `tests/lib/frontmatter.ts`. If `$ARGUMENTS` is
empty, starts with `ui-`, or fails that pattern, say which rule it breaks and ask for
a valid unprefixed component slug. Do not silently normalise it: the slug reaches the
class root and the generated skill name reaches the directory and frontmatter.

This is the running order only. `docs/component-spec.md` holds every rule and wins
on any conflict - read it first, and do not rely on this file restating it.

## Steps

1. Read `docs/component-spec.md` in full. Section 0's settled-questions table answers
   most authoring decisions.
2. Pick the closest existing component as the working example and match its structure:
   `ui-button` and `ui-alert` are CSS-only, `ui-dialog` and `ui-tabs` ship a JavaScript module.
   `ui-alert` has a live region, `ui-dialog` does focus management, `ui-tabs` does keyboard
   navigation.
3. Write `skills/ui-$ARGUMENTS/SKILL.md` per spec section 1.
4. Write `skills/ui-$ARGUMENTS/references/ui-$ARGUMENTS.md` per spec section 2.
5. Create `skills/ui-$ARGUMENTS/references/demo.html` from the demo of the component you
   picked in step 2, and take the one with the matching shape - copying a CSS-only demo
   for a component that has JavaScript leaves it with no generated script region.
   **Rename the marker comment**: it reads `Generated from <original>.md ...` and the
   build matches on that name, so a copied demo whose marker still names the original
   fails with `no generated css region` - and because the error is thrown inside the
   loop over every component, it aborts the build for all of them, not just this one.
   Then replace the hand-written parts around the markers - the markup, page chrome and
   wiring - and run `node scripts/build-demos.mjs` to fill the generated regions.
6. Write `tests/e2e/ui-$ARGUMENTS.spec.ts` per spec section 6. Every WCAG criterion in the
   contract table needs a test whose title starts with that criterion, and any number
   stated in the reference must be measured here rather than estimated.
7. Write `evals/ui-$ARGUMENTS.json` per spec section 4: at least three scenarios, whose
   kinds include `obvious`, `oblique` and `adjacent`. Copy the shape from
   `evals/ui-button.json`.
8. Run `npm run check`. It must exit zero. Fix what it names; do not weaken a gate.
9. Work through the checklist in spec section 8 and report each item's status honestly,
   including anything not verified. One item cannot be closed here: "Three evaluations
   exist with a recorded baseline" needs an evaluation sweep, which this skill does not
   run - say so and leave the baseline to whoever runs it.

## Do not

- Do not add the component to any manifest by hand. `.claude-plugin/marketplace.json`
  and `.codex-plugin/plugin.json` point at `./skills/` as a whole, and the test suites
  iterate the directory.
- Do not hand-edit a generated region in `demo.html`.
- Do not run the evaluation sweep unless asked. It costs real model calls across three
  models, and `docs/evaluations.md` is written by hand.
