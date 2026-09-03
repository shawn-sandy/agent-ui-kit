---
name: ui-popover
description: Accessible non-modal popover on the native HTML popover attribute - a panel that opens above the page without blocking it. Use when adding a filter panel, a disclosure card, a settings flyout, an inline notice, a dropdown surface, or any layer that closes on Escape or an outside click while the page behind stays clickable and tabbable. Covers auto and manual modes, trigger-adjacent and viewport placements, top-layer placement that no overflow or z-index can clip, and trigger state. Not a modal.
license: MIT
---

# Popover

A layer that opens above the page in the top layer and leaves everything behind it
fully usable.

## When to use

- A panel hung off a control: filters, a settings flyout, a column chooser.
- Supplementary detail that should close as soon as attention moves elsewhere.
- Any layer that must not be clipped by an ancestor's `overflow` or lose a `z-index`
  fight, and must not take the page hostage while it is open.

## When not to use

- Anything the user must answer before continuing. That is `ui-dialog`, which is
  modal by construction and makes the page behind inert.
- A message that sits in the page flow rather than above it. That is `ui-alert`.
- A destructive confirmation. Non-modal means the confirmation can be ignored, which
  is the opposite of what a confirmation is for.

## Clarify when needed

Use any component description provided to infer contract-backed props, slots, open
state, dismissal behaviour, focus targets and defaults. If the description, missing
props or requirements leave more than one valid mapping - most often whether the
layer should be dismissible or must stay open until answered, which decides `auto`
versus `manual` and sometimes decides against this component entirely - ask targeted
questions before building. If the request already maps cleanly to the contract,
proceed and state any assumptions.

## Build it

1. Read `references/ui-popover.md` for the markup, styles, module and accessibility contract.
2. Copy the Structure block. The root is a `<div>` with an `id`, a `popover`
   attribute and `role="group"`; triggers reference it with `popovertarget`.
3. Choose the mode: `auto` for anything dismissible, `manual` only when the layer
   must survive Escape and outside clicks. A `manual` popover needs its own close
   control carrying `popovertargetaction="hide"`.
4. Choose placement: omit `data-placement` or use `trigger`, or set a viewport placement.
5. Copy the Behaviour module and call `initPopover(popoverElement)` once per popover.
6. Copy the Styles block as-is.
7. Open `references/demo.html` and check the behaviours listed there.

## Non-negotiable

- The root carries `role="group"` and `aria-labelledby` pointing at its own heading.
  A `popover` attribute supplies no role at all, so without both the layer is an
  unnamed generic container that announces nothing.
- Never hand-write `aria-expanded` state onto a trigger and leave it there. The
  module keeps it in step with the popover; a hard-coded value goes stale the first
  time the popover opens.
- Initial focus is set with the native `autofocus` attribute, never a `focus()` call.
  A scripted focus move does not match `:focus-visible`, so a keyboard user would
  arrive with no focus ring at all.
- Never add a `::backdrop` scrim. The page behind stays interactive, and dimming
  content that is still clickable tells the user the opposite of the truth.
