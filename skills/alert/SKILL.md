---
name: alert
description: Accessible alert - a live region that announces text appearing after page load. Use when adding an error banner, validation summary, success message, toast, notification or snackbar, or when a screen reader user must hear that something failed or finished. Not a blocking dialog.
license: MIT
---

# Alert

A message region that announces its contents to assistive technology when they change.

## When to use

- Reporting the outcome of something the user just did: a save failed, a form has
  errors, an upload finished.
- Surfacing a background event the user did not trigger, without stealing focus.

## When not to use

- A message that must be acknowledged before anything else can happen. That is a
  modal dialog.
- Static page content that is present at load and never changes. That is a plain
  region and needs no live semantics.

## Build it

1. Read `references/alert.md` for the markup, styles and accessibility contract.
2. Copy the Structure block. Pick the variant, and take the `role`, `aria-live` and
   `aria-atomic` values that go with it from the table in that file.
3. Render the region into the page **empty**, at load. Fill it later.
4. Copy the Styles block as-is. It needs no custom properties to be defined.
5. Open `references/demo.html` to compare behaviour.

## Non-negotiable

- The live region exists in the document before the message text does. Creating the
  element and its content in the same operation announces nothing - assistive
  technology only reports changes to regions it was already watching.
- Only `error` is assertive. Everything else is polite, because an assertive
  announcement interrupts whatever the user is currently hearing or typing.
- Severity is carried by the visually hidden label and the icon, never by colour
  alone.
- The alert does not take focus. Moving focus to a message the user did not ask for
  loses their place.
