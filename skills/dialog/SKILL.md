---
name: dialog
description: Accessible modal dialog - an overlay that blocks the page until dismissed. Use when adding a modal, a confirmation step, a blocking popup, or an overlay the keyboard must not escape, including focus trapping, Escape handling, and returning focus to the opener. Not a non-blocking alert.
license: MIT
---

# Dialog

A modal overlay that blocks interaction with the rest of the page until it closes.

## When to use

- Confirming something destructive or irreversible.
- A short form or choice that must be completed or abandoned before continuing.
- Any layer where the content behind it must become unreachable, including by
  keyboard and by screen reader cursor.

## When not to use

- A message that does not block the page. That is an alert.
- A menu, popover or tooltip anchored to a control. Those stay non-modal, and making
  them modal traps the user for no reason.

## Clarify when needed

Use any component description the user provides to infer contract-backed props,
slots, open state, close triggers, focus targets and defaults. If the description,
missing props or requirements leave multiple valid mappings that would change the
labelled content or focus model, ask targeted questions before building. If the
request already maps cleanly to the contract, proceed and state any assumptions.

## Build it

1. Read `references/dialog.md` for the markup, styles, module and accessibility
   contract.
2. Copy the Structure block. The root is a native `<dialog>` with an `id`; openers
   reference it with `data-dialog-open="<id>"`.
3. Copy the Behaviour module and call `initDialog(dialogElement)` once per dialog.
4. Copy the Styles block as-is, including the `::backdrop` rule.
5. Open `references/demo.html` and check the four behaviours listed there.

## Non-negotiable

- Open with `showModal()`, never `show()`. Only `showModal()` makes the rest of the
  page inert; `show()` looks identical and traps nothing.
- The dialog is labelled by `aria-labelledby` pointing at its own heading. Without it
  a screen reader announces an unnamed dialog.
- Never add `role="dialog"` or `aria-modal="true"` by hand. A native `<dialog>`
  opened with `showModal()` already exposes both, and a hand-written duplicate is a
  chance to disagree with the browser.
- Focus returns to the element that opened the dialog. If that element can be removed
  while the dialog is open, declare `data-dialog-fallback` so focus has somewhere
  deliberate to land. Either way focus never stays inside the closed dialog.
- Initial focus is set with the native `autofocus` attribute, not with a `focus()`
  call. A scripted focus move does not match `:focus-visible`, so a mouse user would
  open the dialog and see no focus ring anywhere.
