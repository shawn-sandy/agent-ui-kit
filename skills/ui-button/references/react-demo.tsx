import * as React from 'react';

export type AukButtonVariant = 'primary' | 'secondary' | 'destructive';

type NativeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-disabled' | 'disabled' | 'type'
> & {
  type: 'button' | 'submit' | 'reset';
};

type IconOnlyProps = {
  iconOnly: true;
  'aria-label': string;
  children: React.ReactNode;
};

type TextButtonProps = {
  iconOnly?: false;
  'aria-label'?: string;
  children: React.ReactNode;
};

export type AukButtonProps = NativeButtonProps &
  (IconOnlyProps | TextButtonProps) & {
    variant?: AukButtonVariant;
    unavailable?: boolean;
  };

function cx(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function AukButton({
  variant = 'primary',
  iconOnly = false,
  unavailable = false,
  className,
  onClick,
  children,
  ...props
}: AukButtonProps) {
  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    if (unavailable) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      {...props}
      className={cx('auk-button', className)}
      data-variant={variant}
      data-icon-only={iconOnly ? '' : undefined}
      aria-disabled={unavailable ? 'true' : undefined}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}

export function AukButtonDemo() {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <p aria-live="polite">Activated {count} times</p>

      <AukButton type="button" variant="primary" onClick={() => setCount((n) => n + 1)}>
        Save changes
      </AukButton>

      <AukButton type="button" variant="secondary">
        Cancel
      </AukButton>

      <AukButton type="button" variant="destructive">
        Delete account
      </AukButton>

      <AukButton type="button" variant="primary" unavailable>
        Saving...
      </AukButton>

      <AukButton type="button" variant="secondary" iconOnly aria-label="Close">
        <span data-part="icon" aria-hidden="true">
          &times;
        </span>
      </AukButton>
    </div>
  );
}
