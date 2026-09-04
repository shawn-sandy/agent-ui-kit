# Box reference

A box is an enclosure and nothing else. It owns padding, a border, a corner radius
and a foreground and background colour that are always set together. It owns no
arrangement: nothing here says how the children sit next to each other, and nothing
here sets a font. Those belong to the content and to whatever layout component wraps
or nests inside this one.

Two properties are structural rather than decorative and stay literal. `box-sizing:
border-box` keeps padding and border inside the declared width instead of adding to
it, so a box set to 20rem occupies 20rem. `display: block` is what makes the element
a box in the first place; a component that let a theme change it would not be this
component any more.

## Contract

| Field | Value |
| --- | --- |
| Element | `<div>` root |
| Role | `generic` root |
| Props | `data-variant` — `"invert"` — absent |
| Slots | `none` |
| Variants | `invert` |
| Behaviour | `none` |
| WCAG | 1.4.3 Contrast (Minimum); 1.4.4 Resize Text; 1.4.12 Text Spacing |

The root is a `<div>` because a box carries no meaning of its own. When the content
it wraps *is* a landmark or a region, use the element that says so — `<section>`,
`<aside>`, `<article>` — and put `auk-box` on that instead. The class styles an
enclosure; it does not decide what the enclosure is.

## Structure

The plain box writes no `data-variant` at all: the base rule is the plain box, and
`data-variant="invert"` is the only value that changes anything. Boxes nest, and
that is the intended way to compose them — the outer box is the panel, the inner one
is a callout inside it.

```html
<!-- Plain. The base rule; no attribute needed. -->
<div class="auk-box">
  <h2>Delivery window</h2>
  <p>Orders placed before 4pm ship the same working day.</p>
</div>

<!-- Inverted. Foreground and background swap together, never one alone. -->
<div class="auk-box" data-variant="invert">
  <h2>Out of stock</h2>
  <p>This item is expected back in three weeks.</p>
</div>

<!-- Nested. A box inside a box is the composition story: the outer one is the
     enclosure, the inner one is a callout, and neither re-declares the other. -->
<div class="auk-box">
  <h2>Payment</h2>
  <p>Cards are charged when the order ships.</p>
  <div class="auk-box" data-variant="invert">
    <p>Refunds take up to five working days to appear.</p>
  </div>
</div>
```

## Styles

Qualifiers: parts none; variants `invert`; states none.

`color` and `background-color` are declared together in the base rule and again in
the inverted one. Setting only the background is the common shortcut and it is what
produces a box whose text is inherited from an ancestor and therefore unreadable the
moment either changes. The pair is the whole point of the component.

The border is always declared, and its colour is `transparent` by default so a plain
box shows no visible edge. That transparent border is not decoration waiting to be
switched on — it is load-bearing. When a reader turns on a forced-colours mode the
browser replaces every background with one from their own palette, and a box with no
border dissolves into the page. `border-color` is one of the properties a forced
palette overrides, so a border that is merely *declared* is repainted in the
reader's own text colour and the edge comes back. A border that was never declared
has nothing to repaint.

There is deliberately no `@media (forced-colors: active)` block here. Writing one
that sets `border-color: CanvasText` looks prudent and is measurably redundant: the
border already resolves to the forced text colour with the block and without it, and
what actually decides the outcome is the border width, not the colour. The assertion
in `tests/e2e/ui-box.spec.ts` checks width and style alongside colour for that
reason — colour alone would pass even with the border removed entirely.

There is no `height` and no `block-size`. A box is sized by what it holds.
`min-block-size` is the one dimension hook, and its default of `auto` is a no-op —
it exists so a theme can suggest a floor without this component prescribing one.

The block declares the `auk` cascade layer, so a rule written outside any layer wins
over it whatever its order or specificity. A project's own reset and base rules must
therefore sit in a layer declared before `auk`, for example `@layer reset, auk;`, with
`auk` ahead of the project's utility layers; an unlayered reset outranks the component
and strips its padding. Set a `--auk-box-*` property on `:root` for every instance,
on an ancestor for one region, or on the element itself for one instance.

```css
@layer auk {
  .auk-box {
    box-sizing: border-box;
    display: block;
    padding: var(--auk-box-padding, 1rem);
    border: var(--auk-box-border-width, 1px) solid var(--auk-box-border-color, transparent);
    border-radius: var(--auk-box-radius, 0.375rem);
    min-block-size: var(--auk-box-min-block-size, auto);
    color: var(--auk-box-color, #1f2937);
    background-color: var(--auk-box-bg, #ffffff);
  }

  .auk-box[data-variant="invert"] {
    color: var(--auk-box-invert-color, #f9fafb);
    background-color: var(--auk-box-invert-bg, #1f2937);
    border-color: var(--auk-box-invert-border-color, transparent);
  }
}
```

## Behaviour

No JavaScript.

Padding is one uniform value on all four sides. Overriding `--auk-box-padding` with
a multi-value shorthand works and is sometimes right, but reach for it deliberately:
a box padded on three sides reads as an oversight to every reader except the person
who wrote it, and the asymmetry is almost always a gap that belongs between two
boxes rather than inside one.

Nothing here sets a font. A box inherits typography from its context so that
overriding line height or letter spacing at the document level reaches the content
unopposed, which is what the text-spacing criterion below asks for.

## Accessibility

**Keyboard**

None. A box is not interactive, takes no focus and appears nowhere in the tab order.
Content inside it keeps whatever keyboard behaviour that content already had.

**ARIA**

None, deliberately. The root resolves to `generic`, which is the correct role for an
element that groups content without changing its meaning. Adding `role="group"` or
`role="region"` would announce a boundary that carries no information, and a region
without an accessible name is worse than no region at all.

When the enclosed content genuinely is a landmark, change the element rather than
adding a role: put `auk-box` on the `<section>` or `<aside>` that already says it.

**Focus management**

The component never moves focus and has no focus styles of its own. A focus ring
belongs to the control that has focus, not to the container around it.

**WCAG 2.2 AA criteria claimed**

- **1.4.3 Contrast (Minimum)** — every variant sets `color` and `background-color`
  together, so the pair a reader sees is always the pair the component chose rather
  than one colour crossed with an inherited one. Measured by axe-core against the
  demo, which renders both variants and a nested pair.
- **1.4.4 Resize Text** — no `height` and no `block-size`, and padding in `rem`, so
  the box grows with the text rather than clipping it. Asserted by resizing the
  document text to twice its size and comparing each box's scroll height against its
  client height.
- **1.4.12 Text Spacing** — the component sets no `line-height`, `letter-spacing`,
  `word-spacing` or paragraph spacing, so a reader's own overrides apply and the box
  grows to fit them. Asserted by applying the criterion's four overrides and checking
  the same no-clipping condition.

Not claimed, and worth saying so: the forced-colours border is real and is asserted
in `tests/e2e/ui-box.spec.ts`, but no Level AA criterion covers the edge of a
non-interactive container. 1.4.11 Non-text Contrast applies to user interface
components and meaningful graphics, and a decorative enclosure is neither.

## Demo

`./demo.html` opens from disk with no server and no build step. It renders a plain
box, an inverted box and a nested pair, each holding real text so contrast has
something to measure.

Look for: padding equal on all four sides, the inverted box swapping both colours
rather than one, and the boxes growing rather than clipping when the browser's own
text size is raised.
