import * as React from 'react';

/** The only variant. The plain box is the base rule and writes no attribute. */
export type AukBoxVariant = 'invert';

/**
 * Typed projection of the `auk-box` DOM contract. The element is a prop because a
 * box carries no meaning of its own: when the content is a landmark, render the
 * element that says so and keep the class.
 */
export interface AukBoxProps extends React.HTMLAttributes<HTMLElement> {
  /** `invert` swaps foreground and background together, never one alone. */
  variant?: AukBoxVariant;
  /** Element to render. Defaults to `div`; use a landmark element when the content is one. */
  as?: 'div' | 'section' | 'aside' | 'article';
  children: React.ReactNode;
}

function cx(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ');
}

/** A padded enclosure with a border and a paired foreground and background colour. */
export function AukBox({ variant, as: Tag = 'div', className, children, ...props }: AukBoxProps) {
  return (
    <Tag {...props} className={cx('auk-box', className)} data-variant={variant}>
      {children}
    </Tag>
  );
}

/** Mirrors demo.html's three examples. The nested one also exercises the element prop. */
export function AukBoxDemo() {
  return (
    <div>
      <AukBox>
        <h3>Delivery window</h3>
        <p>Orders placed before 4pm ship the same working day.</p>
      </AukBox>

      <AukBox variant="invert">
        <h3>Out of stock</h3>
        <p>This item is expected back in three weeks.</p>
      </AukBox>

      <AukBox as="section" aria-labelledby="payment-heading">
        <h3 id="payment-heading">Payment</h3>
        <p>Cards are charged when the order ships.</p>
        <AukBox variant="invert">
          <p>Refunds take up to five working days to appear.</p>
        </AukBox>
      </AukBox>
    </div>
  );
}
