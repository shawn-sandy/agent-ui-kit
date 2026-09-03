---
name: new-component
description: Scaffolds and verifies a new component skill in this repository, following docs/component-spec.md. Takes the component name as an argument.
disable-model-invocation: true
---

# New component skill

Adds one component to `skills/`, following the authoring contract. The component name
is `$ARGUMENTS`, used verbatim as the directory name, the `name` frontmatter value and
the `auk-<name>` class root.

Check the name before creating anything. It must match
`^[a-z0-9]+(?:-[a-z0-9]+)*$` - lowercase letters and digits, single inner hyphens, no
leading, trailing or doubled hyphen - and run to 64 characters or fewer, both enforced
by `tests/lib/frontmatter.ts`. If `$ARGUMENTS` is empty or fails that pattern, say
which rule it breaks and ask for a valid name. Do not silently normalise it: the name
reaches the directory, the frontmatter and the class root, and a late gate-1 failure
arrives after the files already exist.

This is the running order only. `docs/component-spec.md` holds every rule and wins
on any conflict - read it first, and do not rely on this file restating it.

## Steps

1. Read `docs/component-spec.md` in full. Section 0's settled-questions table answers
   most authoring decisions.
2. Pick the closest existing component as the working example and match its structure:
   `button` and `alert` are CSS-only, `dialog` and `tabs` ship a JavaScript module.
   `alert` has a live region, `dialog` does focus management, `tabs` does keyboard
   navigation.
3. Write `skills/$ARGUMENTS/SKILL.md` per spec section 1.
4. Write `skills/$ARGUMENTS/references/$ARGUMENTS.md` per spec section 2.
5. Create `skills/$ARGUMENTS/references/demo.html` from the demo of the component you
   picked in step 2, and take the one with the matching shape - copying a CSS-only demo
   for a component that has JavaScript leaves it with no generated script region.
   **Rename the marker comment**: it reads `Generated from <original>.md ...` and the
   build matches on that name, so a copied demo whose marker still names the original
   fails with `no generated css region` - and because the error is thrown inside the
   loop over every component, it aborts the build for all of them, not just this one.
   Then replace the hand-written parts around the markers - the markup, page chrome and
   wiring - and run `node scripts/build-demos.mjs` to fill the generated regions.
6. Write `tests/e2e/$ARGUMENTS.spec.ts` per spec section 6. Every WCAG criterion in the
   contract table needs a test whose title starts with that criterion, and any number
   stated in the reference must be measured here rather than estimated.
7. Write `evals/$ARGUMENTS.json` per spec section 4: at least three scenarios, whose
   kinds include `obvious`, `oblique` and `adjacent`. Copy the shape from
   `evals/button.json`.
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
