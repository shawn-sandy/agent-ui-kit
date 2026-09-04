---
name: ui-box
description: Accessible box - a padded, bordered container with paired text and background. Use when wrapping content in a card, panel or tile, or when it must survive forced colours. Not for arranging siblings.
license: MIT
---

# Box

A padded enclosure with a border and a foreground and background colour that always
travel together. It is the primitive a bare `<div>` should have been.

## When to use

- Wrapping content so it has room to breathe: a card, a panel, a callout, a well.
- Any container that must survive an inverted colour scheme without stranding text
  on an unreadable background.
- Any container that must keep a visible edge when a reader replaces the page
  palette with one of their own.
- As the enclosure a layout component nests inside or wraps around.

## When not to use

- Arranging or spacing sibling elements. A box says nothing about how its children
  sit next to each other; that is a separate layout component, and this kit does not
  ship one yet.
- Constraining line length. That is a measure or centring layout, not an enclosure.
- Grouping form controls that need a shared label. That is a fieldset with a legend,
  and swapping a box in loses the grouping that assistive technology reads.

## Clarify when needed

Use any component description the user provides to infer the variant, the element
the box should be, and any themed values. If the description, missing props or
requirements leave it unclear whether the content is a plain grouping or a landmark
that should be a `<section>` or `<aside>`, ask before building. If the request maps
cleanly onto the contract, proceed and state any assumptions.

## Build it

1. Read `references/ui-box.md` for the markup, styles and accessibility contract.
2. Copy the Structure block. Keep the element and `data-variant` exactly.
3. Copy the Styles block as-is. It needs no custom properties to be defined - every
   value has a literal fallback. Override `--auk-box-*` to theme it.
4. In a component-based project, follow `ui-compose`: props from the contract table,
   split only on structure, compose sibling auk components, render alone.
5. Open `references/demo.html` in a browser to check the result behaves the same.

## Non-negotiable

- `color` and `background-color` are set together, in every variant. Setting one
  alone is how a box ends up with dark text on a dark inherited background.
- The border is always declared, even when its colour is `transparent`. A forced
  colours mode paints that border, and it is the only thing keeping the box's edge
  when the background is stripped away.
- No `height`, no `block-size`. A box is sized by what it holds. `min-block-size` is
  available to suggest a floor and is `auto` unless a theme sets it.
- `box-sizing: border-box`, so padding and border sit inside the declared width
  rather than adding to it.
- Padding is uniform on all four sides by default. A box with padding on three sides
  reads as a mistake to everyone except the person who wrote it.
