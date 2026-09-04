# Popover reference

A non-modal layer that opens above the page and leaves everything behind it usable.
Almost all of it is the native `popover` attribute: the top layer, light dismiss,
and a trigger relationship that works before any script runs. The module exists for
the two gaps that attribute leaves, both measured in a browser rather than assumed.

## Contract

| Field | Value |
| --- | --- |
| Element | `<div>` |
| Role | `group` |
| Props | `id` — string — required, referenced by triggers; `popover` — `"auto"` or `"manual"` — `"auto"`; `data-placement` — `"trigger"` or `"center"` or `"top"` or `"bottom"` or `"left"` or `"right"` — `"trigger"`; `aria-labelledby` — id reference — required, points at the popover heading; `autofocus` — boolean attribute on one descendant — absent; `popovertarget` — id reference — required, on any trigger element; `popovertargetaction` — `"show"` or `"hide"` or `"toggle"` — `"toggle"`, on a trigger; `aria-expanded` — `"true"` or `"false"` — `"false"`, on a trigger |
| Slots | `data-part="header"`; `data-part="body"` |
| Variants | `none` |
| Behaviour | `initPopover(popover)` — mirrors the open state onto every trigger's `aria-expanded` and restores focus to the trigger when a `manual` popover closes with focus stranded inside it; returns a teardown |
| WCAG | 1.4.3 Contrast (Minimum); 2.1.1 Keyboard; 2.1.2 No Keyboard Trap; 2.4.3 Focus Order; 2.4.7 Focus Visible; 4.1.2 Name, Role, Value |

Mode is the native `popover` attribute rather than a `data-variant`, so it sits in
Props. An `auto` popover closes on Escape and on a click outside it, and opening a
second one closes the first. A `manual` popover does neither and closes only from a
control that names it.

## Structure

Both modes are shown as siblings. The ids are per instance, not per component - two
popovers on one page need two id families, so `filters-popover-title` rather than
`popover-title`. The module keeps each trigger's `aria-expanded` in step with its
popover; every other attribute here is written once by hand and never rewritten.

```html
<button class="auk-button" type="button" id="filters-trigger"
        popovertarget="filters-popover" aria-expanded="false">
  Filters
</button>

<div class="auk-popover" id="filters-popover" popover="auto" data-placement="trigger"
     role="group" aria-labelledby="filters-popover-title">
  <div data-part="header">
    <h2 data-part="title" id="filters-popover-title">Filter results</h2>
  </div>
  <div data-part="body">
    <p>An auto popover closes on Escape and on a click outside it.</p>
    <button class="auk-button" type="button" id="filters-apply" autofocus>Apply</button>
  </div>
</div>

<button class="auk-button" type="button" id="notes-trigger"
        popovertarget="notes-popover" aria-expanded="false">
  Release notes
</button>

<div class="auk-popover" id="notes-popover" popover="manual" data-placement="center"
     role="group" aria-labelledby="notes-popover-title">
  <div data-part="header">
    <h2 data-part="title" id="notes-popover-title">What changed</h2>
    <button data-part="close" type="button" popovertarget="notes-popover"
            popovertargetaction="hide" aria-label="Close release notes">
      <span aria-hidden="true">&#215;</span>
    </button>
  </div>
  <div data-part="body">
    <p>A manual popover ignores Escape and outside clicks. It closes only here.</p>
  </div>
</div>
```

The close button carries `popovertargetaction="hide"`, so a `manual` popover can be
closed with no script at all. That is also the path that strands focus, which is why
the module below watches for it.

`autofocus` is the native attribute and it is the only thing that moves focus into a
popover on open - the attribute alone does not. Leaving the move to the browser is
what keeps the focus ring correct: a scripted `focus()` call does not match
`:focus-visible`, so a keyboard user would arrive with no visible ring. Set it on the
control the user most likely wants, and leave it off a popover that is purely
informational.

## Styles

Qualifiers: parts `header`, `title`, `body`, `close`; variants none; states `open`, `focus`.

The user agent already places `[popover]` in the top layer with `position: fixed`,
`inset: 0` and `margin: auto`, which centres it, and sets `display: none` while it is
closed. These rules restyle the surface and take over `display` only once the popover
is open, so the closed state stays the browser's. There is deliberately no
`::backdrop` rule: the page behind a popover is not inert, and a scrim over content
that is still clickable tells the user the opposite of the truth.

With no `data-placement`, or with `data-placement="trigger"`, the `@supports` block
moves the popover next to its trigger. A popover opened through `popovertarget`
already has that trigger as its implicit anchor, so `position-area` places it with
no `anchor-name` on the button and no script. `position-try-fallbacks` is what makes
the placement dynamic: when the default position would overflow the viewport, the
browser flips the popover above the trigger, to its other side, or both, and
re-evaluates on every scroll and resize. The user agent's `inset: 0` and
`margin: auto` are reset inside the block so that neither competes with the anchor
for the same axis. A browser without anchor positioning skips the block and keeps
the browser's centred placement, so the component degrades to what it was rather
than to something broken.

The page placements are independent of anchor positioning. `data-placement="center"`
keeps the centred top-layer placement, while `top`, `bottom`, `left` and `right`
pin the popover to that viewport edge and centre it on the other axis. Trigger
placement is themeable through `--auk-popover-position-area`; the fallback order
through `--auk-popover-position-try-fallbacks`; the trigger gap through
`--auk-popover-offset`; and the page edge gap through `--auk-popover-page-offset`.

The block declares the `auk` cascade layer, so a rule written outside any layer wins
over it whatever its order or specificity. A project's own reset and base rules must
therefore sit in a layer declared before `auk`, for example `@layer reset, auk;`, with
`auk` ahead of the project's utility layers; an unlayered reset outranks the component
and strips its padding. Set a `--auk-popover-*` property on `:root` for every instance,
on an ancestor for one region, or on the element itself for one instance.

```css
@layer auk {
  .auk-popover {
    inline-size: var(--auk-popover-inline-size, min(22rem, calc(100vw - 2rem)));
    max-block-size: var(--auk-popover-max-block-size, calc(100vh - 4rem));
    padding: 0;
    border: var(--auk-popover-border-width, 1px) solid var(--auk-popover-border-color, #d1d5db);
    border-radius: var(--auk-popover-radius, 0.5rem);
    font-family: var(--auk-popover-font-family, inherit);
    color: var(--auk-popover-color, #111827);
    background-color: var(--auk-popover-bg, #ffffff);
    box-shadow: var(--auk-popover-box-shadow, 0 10px 25px rgba(17, 24, 39, 0.18));
  }

  .auk-popover:popover-open {
    display: flex;
    flex-direction: column;
  }

  .auk-popover[data-placement="center"]:popover-open {
    inset: 0;
    margin: auto;
  }

  .auk-popover[data-placement="top"]:popover-open {
    inset-block: var(--auk-popover-page-offset, 1rem) auto;
    inset-inline: 0;
    margin-block: 0 auto;
    margin-inline: auto;
  }

  .auk-popover[data-placement="bottom"]:popover-open {
    inset-block: auto var(--auk-popover-page-offset, 1rem);
    inset-inline: 0;
    margin-block: auto 0;
    margin-inline: auto;
  }

  .auk-popover[data-placement="left"]:popover-open {
    inset-block: 0;
    inset-inline: var(--auk-popover-page-offset, 1rem) auto;
    margin-block: auto;
    margin-inline: 0 auto;
  }

  .auk-popover[data-placement="right"]:popover-open {
    inset-block: 0;
    inset-inline: auto var(--auk-popover-page-offset, 1rem);
    margin-block: auto;
    margin-inline: auto 0;
  }

  @supports (position-area: block-end) {
    .auk-popover:not([data-placement]):popover-open,
    .auk-popover[data-placement="trigger"]:popover-open {
      inset: auto;
      margin: var(--auk-popover-offset, 0.25rem) 0 0;
      position-area: var(--auk-popover-position-area, block-end span-inline-end);
      position-try-fallbacks: var(--auk-popover-position-try-fallbacks, flip-block, flip-inline, flip-block flip-inline);
    }
  }

  .auk-popover [data-part="header"] {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--auk-popover-gap, 0.75rem);
    padding: var(--auk-popover-padding, 1rem);
    border-block-end: var(--auk-popover-divider-width, 1px) solid var(--auk-popover-divider-color, #e5e7eb);
  }

  .auk-popover [data-part="title"] {
    margin: 0;
    font-size: var(--auk-popover-title-size, 1rem);
    line-height: var(--auk-popover-title-line-height, 1.4);
  }

  .auk-popover [data-part="body"] {
    padding: var(--auk-popover-padding, 1rem);
    overflow-y: auto;
    color: var(--auk-popover-body-color, #374151);
    line-height: var(--auk-popover-line-height, 1.5);
  }

  .auk-popover [data-part="close"] {
    flex: none;
    min-inline-size: var(--auk-popover-close-size, 2.75rem);
    min-block-size: var(--auk-popover-close-size, 2.75rem);
    border: var(--auk-popover-close-border-width, 1px) solid var(--auk-popover-close-border-color, transparent);
    border-radius: var(--auk-popover-close-radius, 0.375rem);
    font-family: var(--auk-popover-font-family, inherit);
    font-size: var(--auk-popover-close-font-size, 1.25rem);
    color: var(--auk-popover-close-color, #1f2937);
    background-color: var(--auk-popover-close-bg, transparent);
    cursor: pointer;
  }

  .auk-popover [data-part="close"]:focus-visible,
  .auk-popover [data-part="body"] :focus-visible {
    outline: var(--auk-popover-focus-width, 3px) solid var(--auk-popover-focus-color, #111827);
    outline-offset: var(--auk-popover-focus-offset, 2px);
  }
}
```

## Behaviour

The browser supplies the top layer, light dismiss for `auto`, Escape, and - for
`auto` only - returning focus to the trigger on close. The module supplies the two
things it does not, and nothing else.

The first is an explicit `aria-expanded`. Pointing `popovertarget` at a popover
establishes that relationship implicitly in the accessibility tree, but it never
appears as an attribute: reading `getAttribute('aria-expanded')` on a trigger returns
`null`. Implicit-only state is uneven across assistive technology and invisible to
any code that wants to read it, so the module writes it.

The second is focus restoration for `manual`. An `auto` popover restores focus to its
trigger on every close path, scripted and light-dismissed alike. A `manual` popover
restores nothing, so closing one from a button inside it leaves focus on a control
that is now `display: none` - a dead end a keyboard user cannot tab out of. The
module moves focus back to the trigger in exactly that case, and leaves every other
case to the browser.

Both hang off `toggle` rather than `beforetoggle`. `beforetoggle` fires inline but is
cancelable on the way open, so acting on it would sometimes write state for a
transition another listener then prevented. `toggle` fires only once the state has
actually changed. The cost is that the platform queues it as a task, so
`aria-expanded` lands one task after the popover appears - correct rather than
instantaneous, and the reason any test reading that attribute has to retry rather
than sample it once.

```js
/**
 * Wire a native popover for accessible use.
 *
 * Triggers are any element outside the popover carrying
 * `popovertarget="<popover id>"`. A control inside the popover that carries the same
 * attribute - a close button using `popovertargetaction="hide"` - is not a trigger
 * and is skipped, so it never advertises the popover's open state as its own.
 *
 * @param {HTMLElement} popover - the popover element, which must have an id
 * @returns {() => void} teardown that removes every listener this added
 */
export function initPopover(popover) {
  if (!popover || !popover.id) throw new Error('initPopover needs an element with an id');

  const triggers = Array.from(
    document.querySelectorAll('[popovertarget="' + popover.id + '"]'),
  ).filter((el) => !popover.contains(el));

  function onToggle(event) {
    const open = event.newState === 'open';
    triggers.forEach((el) => el.setAttribute('aria-expanded', String(open)));
    if (open || popover.popover !== 'manual') return;

    // Only `manual` reaches here. Closing one from a control inside it leaves focus
    // on that control, which the close has just made `display: none`; closing one
    // any other way can drop focus on the body. Both are dead ends for a keyboard
    // user. Focus landing anywhere else means the user moved it deliberately, and
    // moving it again would be the component fighting them.
    const active = document.activeElement;
    const stranded = !active || active === document.body || popover.contains(active);
    if (!stranded) return;

    const target = triggers.find((el) => el.isConnected);
    if (target) target.focus();
  }

  // Match the markup to reality before the first toggle, so a popover that is
  // already open on load does not advertise itself as closed.
  const openNow = String(popover.matches(':popover-open'));
  triggers.forEach((el) => el.setAttribute('aria-expanded', openNow));
  popover.addEventListener('toggle', onToggle);

  return function teardown() {
    popover.removeEventListener('toggle', onToggle);
  };
}
```

## Accessibility

**Keyboard**

| Key | Result |
| --- | --- |
| `Enter` / `Space` on a trigger | Toggles the popover. Focus stays on the trigger unless a descendant carries `autofocus`. |
| `Tab` | Moves into the open popover, then on to the content after it. The page behind stays reachable throughout. |
| `Escape` | Closes an `auto` popover and returns focus to its trigger. A `manual` popover ignores it. |
| `Enter` / `Space` on the close button | Closes a `manual` popover and returns focus to its trigger. |

**ARIA**

- A `<div>` carrying `popover` has no implicit role, so the root is given
  `role="group"`. Without it the popover is an unnamed generic container and a screen
  reader announces nothing on entering it.
- `aria-labelledby` points at the popover's own heading, which is what gives that
  group a name.
- `aria-expanded` on each trigger is written by the module, not by hand. The
  `popovertarget` relationship supplies it implicitly to the accessibility tree only.
- The close button carries `aria-label`; its glyph is `aria-hidden="true"`.
- Where non-modal *dialog* semantics are genuinely wanted rather than a named panel,
  the same attribute works on a `<dialog>` element, which brings an implicit `dialog`
  role and needs no `role` of its own. Everything else in this contract is unchanged.

**Focus management**

- On open, focus does not move into the popover. It becomes next in the tab order
  instead. The native `autofocus` attribute on one descendant is what moves it, and
  leaving the move to the browser is what keeps `:focus-visible` working.
- On close, an `auto` popover returns focus to its trigger on every path - Escape, an
  outside click, or a scripted `hidePopover()`. That is browser behaviour and the
  module does not touch it.
- A `manual` popover restores nothing on close. When focus is stranded - inside the
  popover that just became `display: none`, or dropped on the body - the module moves
  it to the trigger. Focus anywhere else is left alone, because the user put it there.
- The page behind an open popover is never inert. That is the point of the component
  and the difference from `ui-dialog`: content behind stays clickable, tabbable and
  reachable by a screen reader cursor.

**WCAG 2.2 AA criteria claimed**

- **1.4.3 Contrast (Minimum)** — title, body and close-button text on the popover
  surface, measured by axe-core with a popover open.
- **2.1.1 Keyboard** — the popover opens, operates and closes without a pointer, in
  both modes.
- **2.1.2 No Keyboard Trap** — the popover never traps focus; tabbing on from inside
  an open one reaches the page content behind it.
- **2.4.3 Focus Order** — focus reaches the popover's contents in document order, and
  returns to the trigger when either mode closes.
- **2.4.7 Focus Visible** — a non-zero focus outline on the controls inside, asserted
  after opening the popover from the keyboard.
- **4.1.2 Name, Role, Value** — the group role and its accessible name, a named close
  button, and `aria-expanded` on the trigger tracking the popover's real state.

## Demo

`./demo.html` opens from disk with no server and no build step. It renders both
modes, page placement controls, and page content behind them, which is how the
non-modal behaviour becomes visible.

Look for: the trigger placement opening directly under its trigger with their left
edges aligned, and flipping above it once the window is short enough that there is
no room below; `center`, `top`, `bottom`, `left` and `right` opening against the
viewport instead of the trigger; the `auto` popover closing on Escape and on a click
anywhere outside it; the `manual` popover ignoring both and closing only from its
own button; a link behind an open popover still responding to a click; and each
trigger's `aria-expanded` flipping to `true` while its own popover is open.
