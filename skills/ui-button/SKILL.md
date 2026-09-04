---
name: ui-button
description: Accessible button - a clickable control that runs an action in the current page. Use when adding, styling or disabling a button or submit control that stays keyboard-reachable. Not a link.
license: MIT
---

# Button

A clickable control that performs an action in the current page.

## When to use

- A control that does something: save, submit, cancel, delete, open a dialog.
- A control that must be unavailable for a while but still discoverable by keyboard.
- An icon-only control, where the glyph carries no accessible name of its own.

## When not to use

- Navigating to another page or view. That is an anchor element, and swapping a
  button in loses the browser's own link affordances.
- Toggling a section open and closed. That needs `aria-expanded`, which is a
  disclosure, not this component.

## Clarify when needed

Use any component description the user provides to infer contract-backed props,
slots, variant, handler guard and defaults. If the description, missing props or
requirements leave multiple valid mappings that would change the element, ARIA or
state model, ask targeted questions before building. If the request already maps
cleanly to the contract, proceed and state any assumptions.

## Build it

1. Read `references/ui-button.md` for the markup, styles and accessibility contract.
2. Copy the Structure block. Keep the element, `type`, `data-variant` and the ARIA
   attributes exactly.
3. Copy the Styles block as-is. It needs no custom properties to be defined - every
   value has a literal fallback. Override `--auk-button-*` to theme it.
4. In a component-based project, follow `ui-compose`: props from the contract table,
   split only on structure, compose sibling auk components, render alone.
5. Open `references/demo.html` in a browser to check the result behaves the same.

## Non-negotiable

- Unavailable buttons use `aria-disabled="true"`, never the native `disabled`
  attribute. Native `disabled` removes the control from the tab order, so a keyboard
  user never learns the action exists.
- Any click handler attached to the button returns early when `aria-disabled` is
  `"true"`. CSS blocks the pointer; only the handler can block Enter and Space.
- An icon-only button carries an `aria-label`. The glyph is decorative and marked
  `aria-hidden="true"`.
- `type` is always set. An unset button inside a form submits it.
