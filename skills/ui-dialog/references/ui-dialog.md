# Dialog reference

## Contract

| Field | Value |
| --- | --- |
| Element | `<dialog>` |
| Role | implicit `dialog`, with implicit `aria-modal="true"` once opened by `showModal()` |
| Props | `id` — string — required, referenced by openers; `aria-labelledby` — id reference — required, points at the dialog heading; `aria-describedby` — id reference — optional; `data-dialog-open="<id>"` — on any opener element — required; `data-dialog-close` — boolean attribute on any descendant — optional; `autofocus` — boolean attribute on one descendant — optional; `data-dialog-fallback` — id reference — optional, where focus lands if the opener is gone |
| Slots | `data-part="header"`; `data-part="body"`; `data-part="footer"` |
| Variants | `none` |
| Behaviour | `initDialog(dialog)` — wires openers, closers, backdrop dismissal and focus restoration; returns a teardown |
| WCAG | 1.4.3 Contrast (Minimum); 2.1.1 Keyboard; 2.1.2 No Keyboard Trap; 2.4.3 Focus Order; 2.4.7 Focus Visible; 4.1.2 Name, Role, Value |

## Structure

The root is a native `<dialog>`. Almost everything a modal needs - the focus trap,
inertness of the page behind, Escape, the backdrop element - is browser behaviour that
arrives with `showModal()`. What the markup adds is a name and a set of hooks.

```html
<button class="auk-button" type="button" data-dialog-open="confirm-delete">
  Delete account
</button>

<dialog class="auk-dialog" id="confirm-delete" aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-body">
  <div data-part="header">
    <h2 id="confirm-delete-title">Delete this account?</h2>
    <button class="auk-dialog-close" type="button" data-dialog-close aria-label="Close dialog">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>

  <div data-part="body" id="confirm-delete-body">
    <p>This removes the account and everything in it. It cannot be undone.</p>
  </div>

  <div data-part="footer">
    <button class="auk-button" type="button" data-variant="secondary" data-dialog-close autofocus>
      Keep account
    </button>
    <button class="auk-button" type="button" data-variant="destructive" id="confirm-delete-confirm">
      Delete permanently
    </button>
  </div>
</dialog>
```

`autofocus` is the native attribute, not a hand-rolled one, and it sits on the safe
choice rather than the destructive one. `showModal()` honours it, and leaving the
focus move to the browser is what keeps the focus ring working: a scripted
`element.focus()` never matches `:focus-visible`, so a keyboard user who opened the
dialog would land somewhere with no visible ring at all. With the native attribute
the browser's own heuristic still applies - a ring for the user who arrived by
keyboard, none for the user who arrived by mouse, which is the whole point of
`:focus-visible`. Without the attribute the browser focuses the first focusable
descendant, which here is the close button: acceptable, but landing the user one
keystroke from a mistake is worse than landing them on "Keep account".

## Styles

Qualifiers: parts `header`, `title`, `body`, `footer`, `close`, `backdrop`; variants none; states `focus`.

`<dialog>` is `display: none` until opened, so the visible rules are scoped to `[open]`.
`::backdrop` is a real pseudo-element on the top layer; it needs no overlay div.

The block declares the `auk` cascade layer, so a rule written outside any layer wins
over it whatever its order or specificity. A project's own reset and base rules must
therefore sit in a layer declared before `auk`, for example `@layer reset, auk;`, with
`auk` ahead of the project's utility layers; an unlayered reset outranks the component
and strips its padding. Set a `--auk-dialog-*` property on `:root` for every instance,
on an ancestor for one region, or on the element itself for one instance.

```css
@layer auk {
  .auk-dialog {
    padding: 0;
    border: var(--auk-dialog-border-width, 1px) solid var(--auk-dialog-border-color, #d1d5db);
    border-radius: var(--auk-dialog-radius, 0.5rem);
    inline-size: var(--auk-dialog-inline-size, min(32rem, calc(100vw - 2rem)));
    max-block-size: var(--auk-dialog-max-block-size, calc(100vh - 4rem));
    font-family: var(--auk-dialog-font-family, inherit);
    color: var(--auk-dialog-color, #111827);
    background-color: var(--auk-dialog-bg, #ffffff);
  }

  .auk-dialog::backdrop {
    background-color: var(--auk-dialog-backdrop-bg, rgba(17, 24, 39, 0.6));
  }

  .auk-dialog[open] {
    display: flex;
    flex-direction: column;
  }

  .auk-dialog [data-part="header"] {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--auk-dialog-gap, 1rem);
    padding: var(--auk-dialog-padding, 1.25rem);
    border-block-end: var(--auk-dialog-divider-width, 1px) solid var(--auk-dialog-divider-color, #e5e7eb);
  }

  .auk-dialog [data-part="header"] h2 {
    margin: 0;
    font-size: var(--auk-dialog-title-size, 1.125rem);
    line-height: var(--auk-dialog-title-line-height, 1.4);
  }

  .auk-dialog [data-part="body"] {
    padding: var(--auk-dialog-padding, 1.25rem);
    overflow-y: auto;
    color: var(--auk-dialog-body-color, #374151);
    line-height: var(--auk-dialog-line-height, 1.5);
  }

  .auk-dialog [data-part="footer"] {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--auk-dialog-gap, 1rem);
    padding: var(--auk-dialog-padding, 1.25rem);
    border-block-start: var(--auk-dialog-divider-width, 1px) solid var(--auk-dialog-divider-color, #e5e7eb);
  }

  .auk-dialog-close {
    flex: none;
    min-inline-size: var(--auk-dialog-close-size, 2.75rem);
    min-block-size: var(--auk-dialog-close-size, 2.75rem);
    border: var(--auk-dialog-close-border-width, 1px) solid var(--auk-dialog-close-border-color, transparent);
    border-radius: var(--auk-dialog-close-radius, 0.375rem);
    font-family: var(--auk-dialog-font-family, inherit);
    font-size: var(--auk-dialog-close-font-size, 1.25rem);
    color: var(--auk-dialog-close-color, #1f2937);
    background-color: var(--auk-dialog-close-bg, transparent);
    cursor: pointer;
  }

  .auk-dialog-close:focus-visible,
  .auk-dialog [data-part="footer"] .auk-button:focus-visible {
    outline: var(--auk-dialog-focus-width, 3px) solid var(--auk-dialog-focus-color, #111827);
    outline-offset: var(--auk-dialog-focus-offset, 2px);
  }
}
```

## Behaviour

The browser supplies the trap, the inertness, Escape and the initial focus. The
module supplies the three things it does not: wiring openers, dismissing on a
backdrop click, and restoring focus to the exact element that opened the dialog.

Focus restoration is written out rather than left to the browser on purpose. Native
restoration is reliable when the user closes the dialog themselves, and unreliable
when the dialog is closed from code or when the opener has been re-rendered in the
meantime. Storing the opener costs one line and removes the whole class of problem.

```js
/**
 * Wire a native <dialog> for modal use.
 *
 * Openers are any element carrying `data-dialog-open="<dialog id>"`. Closers are any
 * descendant carrying `data-dialog-close`. Initial focus is left to the browser,
 * which honours the native `autofocus` attribute and draws a focus ring for it.
 *
 * On close, focus returns to the opener. If the opener has been removed from the
 * document meanwhile, it goes to `data-dialog-fallback` instead - declare that
 * whenever an opener can disappear, because nothing else can place focus for you.
 *
 * @param {HTMLDialogElement} dialog - the dialog element, which must have an id
 * @returns {() => void} teardown that removes every listener this added
 */
export function initDialog(dialog) {
  if (!dialog || !dialog.id) throw new Error('initDialog needs a <dialog> with an id');

  const openers = Array.from(document.querySelectorAll('[data-dialog-open="' + dialog.id + '"]'));
  const closers = Array.from(dialog.querySelectorAll('[data-dialog-close]'));
  let opener = null;

  function open(event) {
    // Openers are any element, so an anchor would navigate and a submit button
    // would submit its form the moment after the dialog opened.
    event.preventDefault();
    opener = event.currentTarget;
    dialog.showModal();
  }

  function close(event) {
    if (event) event.preventDefault();
    dialog.close();
  }

  // Clicks land on the dialog itself only when they hit the backdrop: the top layer
  // gives the backdrop the dialog's own box, and any click on real content is
  // retargeted to that content.
  function onDialogClick(event) {
    if (event.target === dialog) dialog.close();
  }

  // Fires for every close path, including Escape, which the browser routes through
  // `cancel` and then `close`.
  function onClose() {
    // The opener can be removed while the dialog is open - a deleted row, a
    // re-rendered list - so it is not always there to receive focus back.
    const fallbackId = dialog.getAttribute('data-dialog-fallback');
    const target = opener && opener.isConnected
      ? opener
      : (fallbackId ? document.getElementById(fallbackId) : null);
    opener = null;

    // Deferred by one task on purpose. Chromium finishes its own focus handling for
    // a closing modal after this handler returns, and on some platforms that leaves
    // focus on the control inside the dialog that had it - now hidden, and a dead
    // end for a keyboard user. Placing focus afterwards is what makes this stick.
    setTimeout(() => {
      if (target && target.isConnected) {
        target.focus();
        return;
      }
      // Nothing was declared to catch it. Getting focus out of the closed dialog is
      // still mandatory; where it lands next is then the browser's business.
      const active = document.activeElement;
      if (active instanceof HTMLElement && dialog.contains(active)) active.blur();
    }, 0);
  }

  openers.forEach((el) => el.addEventListener('click', open));
  closers.forEach((el) => el.addEventListener('click', close));
  dialog.addEventListener('click', onDialogClick);
  dialog.addEventListener('close', onClose);

  return function teardown() {
    openers.forEach((el) => el.removeEventListener('click', open));
    closers.forEach((el) => el.removeEventListener('click', close));
    dialog.removeEventListener('click', onDialogClick);
    dialog.removeEventListener('close', onClose);
  };
}
```

## Accessibility

**Keyboard**

| Key | Result |
| --- | --- |
| `Enter` / `Space` on an opener | Opens the dialog and moves focus into it. |
| `Tab` | Cycles through focusable elements inside the dialog only. |
| `Shift` + `Tab` | The same cycle, backwards. |
| `Escape` | Closes the dialog. Focus returns to the opener. |

**ARIA**

- A native `<dialog>` opened with `showModal()` exposes `role="dialog"` and
  `aria-modal="true"` already. Neither is written in the markup.
- `aria-labelledby` points at the dialog's own `<h2>`, so the dialog is announced by
  name rather than as an unnamed dialog.
- `aria-describedby` points at the body, so the consequence is read along with the
  name rather than only after the user explores.
- The close button carries `aria-label="Close dialog"`; the `&times;` glyph is
  `aria-hidden="true"`.

**Focus management**

- On open, the browser moves focus to the element carrying `autofocus`, which is set
  to the non-destructive choice. Leaving this to the browser rather than calling
  `focus()` is what keeps the focus ring visible for keyboard users.
- On close, focus returns to the opener. If the opener is gone - a deleted row, a
  re-rendered list - focus goes to the element named by `data-dialog-fallback`.
  Declare that attribute on any dialog whose opener can be removed while it is open.
  With neither available the module still pulls focus out of the closed dialog,
  because focus stranded on a hidden control is a dead end for a keyboard user; where
  it lands after that is the browser's choice, not a guarantee this component makes.
- While open, the page behind is inert. That is `showModal()` doing it, not a
  hand-rolled trap, which is why `show()` is banned in this component.
- On close, focus returns to the stored opener. The `isConnected` check avoids
  focusing an element that has since been removed.

**WCAG 2.2 AA criteria claimed**

- **1.4.3 Contrast (Minimum)** — title, body and footer text on the dialog surface,
  measured by axe-core with the dialog open.
- **2.1.1 Keyboard** — the dialog opens, operates and closes without a pointer.
- **2.1.2 No Keyboard Trap** — the trap is intentional while open and releases
  completely on close; asserted by tabbing out to page content afterwards.
- **2.4.3 Focus Order** — focus enters the dialog on open and returns to the exact
  opening element on close.
- **2.4.7 Focus Visible** — a non-zero focus outline on the controls inside, asserted
  after opening the dialog from the keyboard.
- **4.1.2 Name, Role, Value** — dialog role and accessible name, and a named close
  button.

## Demo

`./demo.html` opens from disk with no server and no build step. Two openers share one
dialog, which is how the focus-restoration behaviour becomes visible.

Look for: focus landing on "Keep account" rather than the close button, with a
visible ring when the dialog was opened from the keyboard; Tab never reaching the
page behind; Escape closing; and focus returning to whichever of the two buttons
opened it.
