import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight of the control. */
  variant?: ButtonVariant;
  /** Unavailable, but still reachable by keyboard. */
  unavailable?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', unavailable, children, onClick, ...rest }: ButtonProps) {
  return (
    <button
      className="auk-button"
      data-variant={variant}
      aria-disabled={unavailable || undefined}
      onClick={(event) => {
        if (unavailable) return;
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
