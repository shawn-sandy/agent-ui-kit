# Tabs reference

## Contract

| Field | Value |
| --- | --- |
| Element | `<div>` wrapping a `[role="tablist"]` and one `[role="tabpanel"]` per tab |
| Role | `tablist` on the control row; `tab` on each control; `tabpanel` on each panel |
| Props | `id` — string — required on every tab and every panel; `aria-controls` — id reference — required on each tab, names its panel; `aria-labelledby` — id reference — required on each panel, names its tab; `aria-selected` — `"true" \| "false"` — required on every tab, exactly one `true`; `tabindex` — `"0" \| "-1"` — required on every tab, exactly one `0`; `hidden` — boolean attribute — present on every unselected panel |
| Slots | `data-part="tablist"`; each panel's own children |
| Variants | `none` |
| Behaviour | `initTabs(root)` — roving tabindex, arrow/Home/End navigation, selection and panel visibility; returns a teardown |
| WCAG | 1.4.3 Contrast (Minimum); 2.1.1 Keyboard; 2.4.3 Focus Order; 2.4.7 Focus Visible; 4.1.2 Name, Role, Value |

## Structure

The markup is written in its correct initial state - one tab selected with
`tabindex="0"`, the rest `tabindex="-1"`, the other panels `hidden`. The module keeps
that state true; it does not establish it. A tab set therefore renders correctly with
JavaScript disabled or still loading, showing one panel rather than all of them.

```html
<div class="auk-tabs" id="settings-tabs">
  <div class="auk-tabs-list" data-part="tablist" role="tablist" aria-label="Settings sections">
    <button class="auk-tab" type="button" role="tab" id="tab-profile"
            aria-controls="panel-profile" aria-selected="true" tabindex="0">Profile</button>
    <button class="auk-tab" type="button" role="tab" id="tab-billing"
            aria-controls="panel-billing" aria-selected="false" tabindex="-1">Billing</button>
    <button class="auk-tab" type="button" role="tab" id="tab-notifications"
            aria-controls="panel-notifications" aria-selected="false" tabindex="-1">Notifications</button>
  </div>

  <div class="auk-tabpanel" role="tabpanel" id="panel-profile" aria-labelledby="tab-profile" tabindex="0">
    <p>Name, avatar and public handle.</p>
  </div>

  <div class="auk-tabpanel" role="tabpanel" id="panel-billing" aria-labelledby="tab-billing" tabindex="0" hidden>
    <p>Plan, payment method and invoices.</p>
  </div>

  <div class="auk-tabpanel" role="tabpanel" id="panel-notifications" aria-labelledby="tab-notifications" tabindex="0" hidden>
    <p>Email and in-app notification preferences.</p>
  </div>
</div>
```

## Styles

Qualifiers: parts `tab`, `panel`; variants none; states `selected`, `focus`.

Selection is styled from `[aria-selected="true"]`, so the visual state cannot
disagree with the announced state - there is only one source of truth.

The block declares the `auk` cascade layer, so a rule written outside any layer wins
over it whatever its order or specificity. A project's own reset and base rules must
therefore sit in a layer declared before `auk`, for example `@layer reset, auk;`, with
`auk` ahead of the project's utility layers; an unlayered reset outranks the component
and strips its padding. Set a `--auk-tabs-*` property on `:root` for every instance,
on an ancestor for one region, or on the element itself for one instance.

```css
@layer auk {
  .auk-tabs {
    font-family: var(--auk-tabs-font-family, inherit);
    color: var(--auk-tabs-color, #111827);
  }

  .auk-tabs-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--auk-tabs-gap, 0.25rem);
    border-block-end: var(--auk-tabs-border-width, 1px) solid var(--auk-tabs-border-color, #d1d5db);
  }

  .auk-tab {
    min-block-size: var(--auk-tabs-tab-min-size, 2.75rem);
    padding-block: var(--auk-tabs-tab-padding-block, 0.625rem);
    padding-inline: var(--auk-tabs-tab-padding-inline, 1rem);
    border: 0;
    border-block-end: var(--auk-tabs-tab-border-block-end-width, 3px) solid transparent;
    font-family: var(--auk-tabs-font-family, inherit);
    font-size: var(--auk-tabs-tab-font-size, 1rem);
    font-weight: var(--auk-tabs-tab-font-weight, 600);
    color: var(--auk-tabs-tab-color, #374151);
    background-color: var(--auk-tabs-tab-bg, transparent);
    cursor: pointer;
  }

  .auk-tab[aria-selected="true"] {
    color: var(--auk-tabs-selected-tab-color, #1a56db);
    border-block-end-color: var(--auk-tabs-selected-tab-border-block-end-color, #1a56db);
  }

  .auk-tab:focus-visible {
    outline: var(--auk-tabs-focus-width, 3px) solid var(--auk-tabs-focus-color, #111827);
    outline-offset: var(--auk-tabs-focus-offset, -3px);
  }

  .auk-tabpanel {
    padding-block: var(--auk-tabs-panel-padding-block, 1rem);
    padding-inline: var(--auk-tabs-panel-padding-inline, 0.25rem);
    line-height: var(--auk-tabs-panel-line-height, 1.5);
  }

  .auk-tabpanel:focus-visible {
    outline: var(--auk-tabs-focus-width, 3px) solid var(--auk-tabs-focus-color, #111827);
    outline-offset: var(--auk-tabs-focus-offset, -3px);
  }

  .auk-tabpanel[hidden] {
    display: none;
  }
}
```

## Behaviour

Roving tabindex is the whole mechanism: exactly one tab is in the page's tab order,
and the arrow keys move which one that is. The alternative - leaving every tab
focusable - makes a keyboard user press Tab once per tab to get past the row, which
is the single most common way a tab set is built wrong.

Selection follows focus. Arrowing onto a tab selects it immediately, which is correct
when panels are already in the document and switching is free.

```js
/**
 * Wire a tab set for roving-tabindex keyboard navigation.
 *
 * Reads its structure from ARIA, not from classes: tabs are `[role="tab"]` inside
 * the root, and each tab's panel is the element its `aria-controls` names. The
 * markup is expected to start in a valid state; this keeps it valid.
 *
 * @param {HTMLElement} root - the element wrapping the tablist and its panels
 * @returns {() => void} teardown that removes every listener this added
 */
export function initTabs(root) {
  const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
  if (tabs.length === 0) throw new Error('initTabs found no [role="tab"] inside the root');

  // getElementById, not querySelector('#' + id): ids are document-unique, and an id
  // that is legal HTML but not a legal CSS selector - "panel:billing", "2fa" - makes
  // the selector form throw rather than miss.
  const panelFor = (tab) => document.getElementById(tab.getAttribute('aria-controls'));

  /**
   * Make one tab the selected tab and the only one in the page's tab order.
   *
   * @param {number} index - position in the tab list
   * @param {boolean} moveFocus - whether to move focus as well as selection
   */
  function select(index, moveFocus) {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.setAttribute('tabindex', selected ? '0' : '-1');
      const panel = panelFor(tab);
      if (panel) panel.hidden = !selected;
    });
    if (moveFocus) tabs[index].focus();
  }

  function onKeydown(event) {
    const current = tabs.indexOf(event.currentTarget);
    const last = tabs.length - 1;
    let next = null;

    // Arrow keys wrap, so the row has no dead end in either direction.
    if (event.key === 'ArrowRight') next = current === last ? 0 : current + 1;
    else if (event.key === 'ArrowLeft') next = current === 0 ? last : current - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else return;

    // Home and End otherwise scroll the page out from under the user.
    event.preventDefault();
    select(next, true);
  }

  function onClick(event) {
    select(tabs.indexOf(event.currentTarget), true);
  }

  tabs.forEach((tab) => {
    tab.addEventListener('keydown', onKeydown);
    tab.addEventListener('click', onClick);
  });

  return function teardown() {
    tabs.forEach((tab) => {
      tab.removeEventListener('keydown', onKeydown);
      tab.removeEventListener('click', onClick);
    });
  };
}
```

## Accessibility

**Keyboard**

| Key | Result |
| --- | --- |
| `Tab` | Enters the row at the selected tab, then leaves the row entirely on the next press. |
| `ArrowRight` | Selects and focuses the next tab, wrapping from last to first. |
| `ArrowLeft` | Selects and focuses the previous tab, wrapping from first to last. |
| `Home` | Selects and focuses the first tab. |
| `End` | Selects and focuses the last tab. |
| `Enter` / `Space` | Selects the focused tab. Already selected by arrow navigation, so this only matters after a pointer interaction. |

**ARIA**

- `role="tablist"` on the row, with `aria-label` naming what the tabs switch between.
  Without the label the row is announced as an unnamed tab list.
- `role="tab"` with `aria-controls` naming its panel, and `aria-selected` carrying the
  state. Exactly one tab is `true`.
- `role="tabpanel"` with `aria-labelledby` naming its tab, so entering the panel
  announces which section it is.
- Unselected panels use the `hidden` attribute, which removes them from the
  accessibility tree as well as from view.

**Focus management**

- Exactly one tab has `tabindex="0"`; it is always the selected one. Every other tab
  has `tabindex="-1"` and is reachable only by arrow key.
- Each panel has `tabindex="0"` so a panel whose content holds nothing focusable can
  still be reached and scrolled from the keyboard.
- `Home` and `End` call `preventDefault()`; without it the page scrolls to top or
  bottom while the tab changes.

**WCAG 2.2 AA criteria claimed**

- **1.4.3 Contrast (Minimum)** — tab labels in both selected and unselected states,
  and panel body text, measured by axe-core.
- **2.1.1 Keyboard** — every tab and panel is reachable and operable by keyboard.
- **2.4.3 Focus Order** — roving tabindex gives the row exactly one stop, and the next
  Tab press moves into the page rather than to the next tab.
- **2.4.7 Focus Visible** — a non-zero focus outline on tabs and on panels.
- **4.1.2 Name, Role, Value** — the tab/panel pairing through `aria-controls` and
  `aria-labelledby`, plus `aria-selected` reflecting the current state.

## Demo

`./demo.html` opens from disk with no server and no build step.

Look for: pressing Tab once from the field above the tabs landing on the selected tab,
pressing it again landing in the panel rather than on the next tab, and arrow keys
wrapping around both ends of the row.
