# Button reference

## Contract

| Field | Value |
| --- | --- |
| Element | `<button>` |
| Role | implicit `button` |
| Props | `type` — `"button" \| "submit" \| "reset"` — required, no default; `data-variant` — `"primary" \| "secondary" \| "destructive"` — `primary` when absent; `data-icon-only` — boolean attribute — absent; `aria-disabled` — `"true"` — absent; `aria-label` — string — absent, required when `data-icon-only` is present |
| Slots | `none` — the button's own children are its label; an icon child is marked `data-part="icon"` |
| Variants | `primary`; `secondary`; `destructive` |
| Behaviour | `none` |
| WCAG | 1.4.3 Contrast (Minimum); 2.1.1 Keyboard; 2.4.7 Focus Visible; 2.5.8 Target Size (Minimum); 4.1.2 Name, Role, Value |

## Structure

A native `<button>`. No `role` attribute — the element already has one, and adding it
is a chance to get it wrong. Unavailable buttons carry `aria-disabled="true"` rather
than the native `disabled` attribute, so they stay in the tab order.

```html
<button class="auk-button" type="button" data-variant="primary">Save changes</button>

<button class="auk-button" type="button" data-variant="secondary">Cancel</button>

<button class="auk-button" type="button" data-variant="destructive">Delete account</button>

<!-- Unavailable. Still focusable, still announced, does not activate. -->
<button class="auk-button" type="button" data-variant="primary" aria-disabled="true">
  Saving...
</button>

<!-- Icon only. The glyph is decorative; aria-label carries the name. -->
<button class="auk-button" type="button" data-variant="secondary" data-icon-only aria-label="Close">
  <span data-part="icon" aria-hidden="true">&times;</span>
</button>
```

## Styles

Qualifiers: parts `icon`; variants `primary`, `secondary`, `destructive`; states `hover`, `focus`, `disabled`.

Plain CSS. Every themeable value has a literal fallback, so the component renders
correctly with no custom properties defined anywhere. The unavailable state uses a
muted palette rather than reduced opacity, because opacity lowers contrast below the
1.4.3 threshold and an unavailable control still has to be readable.

```css
.auk-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--auk-button-gap, 0.5rem);
  min-block-size: var(--auk-button-min-size, 2.75rem);
  min-inline-size: var(--auk-button-min-size, 2.75rem);
  padding-block: var(--auk-button-padding-block, 0.625rem);
  padding-inline: var(--auk-button-padding-inline, 1rem);
  border: var(--auk-button-border-width, 1px) solid var(--auk-button-border-color, transparent);
  border-radius: var(--auk-button-radius, 0.375rem);
  font-family: var(--auk-button-font-family, inherit);
  font-size: var(--auk-button-font-size, 1rem);
  font-weight: var(--auk-button-font-weight, 600);
  line-height: var(--auk-button-line-height, 1.25);
  color: var(--auk-button-color, #ffffff);
  background-color: var(--auk-button-bg, #1a56db);
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.auk-button[data-variant="secondary"] {
  color: var(--auk-button-secondary-color, #1f2937);
  background-color: var(--auk-button-secondary-bg, #ffffff);
  border-color: var(--auk-button-secondary-border-color, #6b7280);
}

.auk-button[data-variant="destructive"] {
  color: var(--auk-button-destructive-color, #ffffff);
  background-color: var(--auk-button-destructive-bg, #b91c1c);
}

.auk-button[data-icon-only] {
  padding-inline: var(--auk-button-icon-padding-inline, 0.625rem);
}

.auk-button:hover:not([aria-disabled="true"]) {
  filter: brightness(var(--auk-button-hover-brightness, 0.92));
}

.auk-button:focus-visible {
  outline: var(--auk-button-focus-width, 3px) solid var(--auk-button-focus-color, #111827);
  outline-offset: var(--auk-button-focus-offset, 2px);
}

.auk-button[aria-disabled="true"] {
  color: var(--auk-button-disabled-color, #ffffff);
  background-color: var(--auk-button-disabled-bg, #6b7280);
  border-color: var(--auk-button-disabled-border-color, transparent);
  cursor: not-allowed;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .auk-button {
    transition: filter var(--auk-button-transition-duration, 120ms) ease;
  }
}
```

## Behaviour

No JavaScript.

The one thing a consumer must do is guard the handler. `pointer-events: none` stops a
mouse click on an unavailable button, but nothing in CSS stops Enter or Space, so the
handler itself has to return early: `if (el.getAttribute('aria-disabled') === 'true') return;`.
That guard is the price of keeping the control in the tab order, and it is the reason
this component prefers `aria-disabled` over the native attribute.

## Accessibility

**Keyboard**

| Key | Result |
| --- | --- |
| `Tab` | Moves focus to the button, including when it is unavailable. |
| `Enter` | Activates. Blocked by the handler guard when `aria-disabled="true"`. |
| `Space` | Activates. Blocked by the same guard. |

**ARIA**

A native `<button>` already exposes the `button` role, its label from its text
content, and its own pressed/focus state. Nothing is added except:

- `aria-disabled="true"` for the unavailable state. Screen readers announce it as
  dimmed or unavailable while the element stays focusable.
- `aria-label` on icon-only buttons. `&times;` is a glyph, not a name, and the icon
  span is `aria-hidden="true"` so it contributes nothing to the accessible name.

**Focus**

`:focus-visible` draws a 3px solid ring in a dark neutral with a 2px offset. It is a
fixed colour rather than `currentColor` so the ring stays visible against the page
behind a filled button, and the offset keeps it clear of the button's own border. The
ring is drawn for the unavailable state too, since that state is still focusable.

**WCAG 2.2 AA criteria claimed**

- **1.4.3 Contrast (Minimum)** — label on surface for every variant, including the
  unavailable state, which is why that state is a muted palette and not an opacity.
  Measured by axe-core in `tests/e2e/ui-button.spec.ts`.
- **2.1.1 Keyboard** — every variant and state is reachable and operable by keyboard.
  The unavailable state is deliberately reachable and deliberately inert.
- **2.4.7 Focus Visible** — a non-zero `:focus-visible` outline, asserted from
  computed styles rather than from the stylesheet text.
- **2.5.8 Target Size (Minimum)** — the default size measures at least 44 by 44 CSS
  pixels, well above the 24 by 24 the criterion requires. Measured from the bounding
  box in the browser suite.
- **4.1.2 Name, Role, Value** — accessible name present on every button, including
  icon-only; role and disabled state exposed correctly.

## Demo

`./demo.html` opens from disk with no server and no build step. It renders all three
variants, the unavailable state and an icon-only button, and wires a counting handler
that includes the `aria-disabled` guard.

Look for: Tab reaching the unavailable button, Enter on it changing nothing, and the
focus ring being clearly visible on every variant.
