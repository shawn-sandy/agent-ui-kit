# Alert reference

## Contract

| Field | Value |
| --- | --- |
| Element | `<div>` |
| Role | `alert` for the error variant; `status` for every other variant |
| Props | `data-variant` — `"info" \| "success" \| "warning" \| "error"` — `info` when absent; `role` — `"alert" \| "status"` — required, paired to the variant; `aria-live` — `"assertive" \| "polite"` — required, paired to the role; `aria-atomic` — `"true"` — required |
| Slots | `data-part="message"` — the message text, empty at load |
| Variants | `info`; `success`; `warning`; `error` |
| Behaviour | `none` |
| WCAG | 1.4.1 Use of Color; 1.4.3 Contrast (Minimum); 4.1.3 Status Messages |

The pairing is not a choice per instance:

| Variant | `role` | `aria-live` | Announced |
| --- | --- | --- | --- |
| `error` | `alert` | `assertive` | Immediately, interrupting |
| `warning` | `status` | `polite` | After the current announcement |
| `success` | `status` | `polite` | After the current announcement |
| `info` | `status` | `polite` | After the current announcement |

`role="alert"` already implies an assertive live region and `role="status"` a polite
one. `aria-live` is written out anyway because older assistive technology honours the
explicit attribute more reliably than the implicit mapping, and because a reviewer
reading the markup should not have to remember the mapping.

## Structure

The region ships empty and stays in the document. Only `data-part="message"` changes.
`aria-atomic="true"` makes the whole region re-announce on change, so a message that
replaces an earlier one is read in full rather than as a diff.

```html
<!-- Error. Assertive: interrupts. Reserve for something the user must deal with. -->
<div class="auk-alert" data-variant="error" role="alert" aria-live="assertive" aria-atomic="true">
  <span data-part="icon" aria-hidden="true">&#9888;</span>
  <span data-part="severity">Error:</span>
  <span data-part="message"></span>
</div>

<!-- Success, warning and info are polite: they wait their turn. -->
<div class="auk-alert" data-variant="success" role="status" aria-live="polite" aria-atomic="true">
  <span data-part="icon" aria-hidden="true">&#10003;</span>
  <span data-part="severity">Success:</span>
  <span data-part="message"></span>
</div>

<div class="auk-alert" data-variant="warning" role="status" aria-live="polite" aria-atomic="true">
  <span data-part="icon" aria-hidden="true">&#9888;</span>
  <span data-part="severity">Warning:</span>
  <span data-part="message"></span>
</div>

<div class="auk-alert" data-variant="info" role="status" aria-live="polite" aria-atomic="true">
  <span data-part="icon" aria-hidden="true">&#8505;</span>
  <span data-part="severity">Information:</span>
  <span data-part="message"></span>
</div>
```

## Styles

Qualifiers: parts `icon`, `severity`, `message`; variants `info`, `success`, `warning`, `error`; states none.

An empty region collapses to nothing, so a page that renders all four at load shows
nothing until a message arrives. The severity label is visually hidden rather than
removed: sighted users read the icon and the colour, screen reader users hear the
word.

```css
.auk-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--auk-alert-gap, 0.625rem);
  padding-block: var(--auk-alert-padding-block, 0.75rem);
  padding-inline: var(--auk-alert-padding-inline, 1rem);
  border: var(--auk-alert-border-width, 1px) solid var(--auk-alert-border-color, #1e3a8a);
  border-radius: var(--auk-alert-radius, 0.375rem);
  font-family: var(--auk-alert-font-family, inherit);
  font-size: var(--auk-alert-font-size, 1rem);
  line-height: var(--auk-alert-line-height, 1.5);
  color: var(--auk-alert-color, #1e3a8a);
  background-color: var(--auk-alert-bg, #dbeafe);
}

.auk-alert:empty,
.auk-alert:not(:has([data-part="message"]:not(:empty))) {
  display: none;
}

.auk-alert[data-variant="success"] {
  color: var(--auk-alert-success-color, #14532d);
  background-color: var(--auk-alert-success-bg, #dcfce7);
  border-color: var(--auk-alert-success-border-color, #14532d);
}

.auk-alert[data-variant="warning"] {
  color: var(--auk-alert-warning-color, #78350f);
  background-color: var(--auk-alert-warning-bg, #fef3c7);
  border-color: var(--auk-alert-warning-border-color, #78350f);
}

.auk-alert[data-variant="error"] {
  color: var(--auk-alert-error-color, #b91c1c);
  background-color: var(--auk-alert-error-bg, #fee2e2);
  border-color: var(--auk-alert-error-border-color, #b91c1c);
}

.auk-alert [data-part="icon"] {
  flex: none;
  font-size: var(--auk-alert-icon-size, 1.125rem);
  line-height: var(--auk-alert-line-height, 1.5);
}

.auk-alert [data-part="severity"] {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

## Behaviour

No JavaScript.

Filling the region is the application's job and is one assignment:
`region.querySelector('[data-part="message"]').textContent = 'Could not save changes.'`.
Do not build the region in the same step. A live region has to be under observation
before the change happens, and an element created and populated together is never
observed changing.

## Accessibility

**Keyboard**

None. The alert is not interactive and is not focusable. That is deliberate: focus
stays wherever the user put it.

**ARIA**

- `role="alert"` (error) is an assertive live region; `role="status"` (everything
  else) is polite. The variant chooses the role, not the author.
- `aria-live` duplicates the implicit mapping for older assistive technology.
- `aria-atomic="true"` re-announces the whole region, so replacing one message with
  another reads as a complete sentence.
- The icon is `aria-hidden="true"`. It is a decorative glyph; the severity word
  carries the meaning.

**Focus**

The component never calls focus. An alert that grabs focus interrupts typing and
loses the user's position, and for a polite message that is a worse outcome than not
being heard immediately.

**WCAG 2.2 AA criteria claimed**

- **1.4.1 Use of Color** — severity is conveyed three ways: a distinct icon glyph, a
  visually hidden severity word, and the palette. Removing colour still leaves two.
  The icon and the hidden word are asserted per variant in `tests/e2e/alert.spec.ts`.
- **1.4.3 Contrast (Minimum)** — message text on its variant background, measured by
  axe-core against the populated demo.
- **4.1.3 Status Messages** — the region carries a live role, resolves to the right
  politeness, and is present in the document before any message is written into it.
  All three are asserted, including that populating the message adds no new element.

## Demo

`./demo.html` opens from disk with no server and no build step. All four regions are
in the document at load and invisible because they are empty; the buttons fill them.

Look for: the regions existing before anything is announced, and the message text
landing in the element that was already there rather than in a newly created one.
