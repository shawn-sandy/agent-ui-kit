---
name: ui-tabs
description: Accessible tabs - a row of controls showing one panel at a time. Use when adding tabs, a tabbed interface, or switchable sections driven by the arrow keys, including roving tabindex so a single Tab press clears the whole row. Not navigation between pages.
license: MIT
---

# Tabs

A row of controls that shows one panel at a time from a set.

## When to use

- Several sections of related content where only one is relevant at a time and the
  user switches often.
- Content that must stay on one page and one URL.

## When not to use

- Navigating between pages or routes. That is a list of links, and dressing it as
  tabs breaks the back button and link sharing.
- Content the user needs to compare side by side, or search across. Hiding it in
  panels makes both impossible.
- Progressive steps in a sequence. That is a wizard, which has ordering rules tabs
  do not.

## Clarify when needed

Use any component description the user provides to infer contract-backed props,
tabs, selected value, panel content and defaults. If the description, missing props
or requirements leave multiple valid mappings that would change the controlled
state, labelling or keyboard model, ask targeted questions before building. If the
request already maps cleanly to the contract, proceed and state any assumptions.

## Build it

1. Read `references/ui-tabs.md` for the markup, styles, module and accessibility
   contract.
2. Copy the Structure block. Every tab needs an `id` and an `aria-controls`; every
   panel needs an `id` and an `aria-labelledby` pointing back. The pairing is what
   makes the panel announce its own name.
3. Copy the Behaviour module and call `initTabs(root)` once per tab set.
4. Copy the Styles block as-is. Override `--auk-tabs-*` to theme it.
5. In a component-based project, follow `ui-compose`: props from the contract table,
   split only on structure, compose sibling auk components, render alone.
6. Open `references/demo.html` and drive it with the keyboard only.

## Non-negotiable

- Roving tabindex: exactly one tab has `tabindex="0"` at any moment, every other tab
  has `tabindex="-1"`. Leaving them all focusable makes a user press Tab once per tab
  to get past the row.
- Arrow keys move between tabs and wrap at the ends. Home and End jump to first and
  last. Tab itself never moves between tabs.
- Each panel carries `tabindex="0"` so keyboard users can reach and scroll content
  that holds nothing focusable.
- Selection state lives in `aria-selected`, not in a class. The class follows the
  attribute, never the other way around.
