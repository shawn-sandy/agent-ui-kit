import * as React from 'react';

/**
 * React projection of the popover contract. This is an adapter reference for apps
 * that already use React - the canonical component is `ui-popover.md`, and the DOM
 * it produces here is identical to the Structure block there.
 *
 * The native attribute does the work. This component adds exactly what the plain
 * module adds: an explicit `aria-expanded` on every trigger, and focus restoration
 * for `manual` popovers, which the browser does not restore at all.
 */
export interface AukPopoverProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'id' | 'role' | 'title' | 'children'> {
  /** Referenced by every trigger's `popoverTarget`. Also seeds the heading id. */
  id: string;
  title: React.ReactNode;
  children: React.ReactNode;
  /** `auto` light-dismisses on Escape and outside clicks; `manual` does neither. */
  mode?: 'auto' | 'manual';
  /** Accessible name for the close button, which only a `manual` popover renders. */
  closeLabel?: string;
  onOpenChange?: (open: boolean) => void;
}

function cx(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function AukPopover({
  id,
  title,
  children,
  mode = 'auto',
  closeLabel = 'Close',
  onOpenChange,
  className,
  ...props
}: AukPopoverProps) {
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const titleId = `${id}-title`;

  React.useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return undefined;

    // A control inside the popover may also carry popoverTarget - the close button
    // does - and it is not a trigger. Skipping it stops that button advertising the
    // popover's open state as its own.
    const triggers = Array.from(
      document.querySelectorAll<HTMLElement>(`[popovertarget="${id}"]`),
    ).filter((el) => !popover.contains(el));

    function onToggle(event: Event) {
      const open = (event as ToggleEvent).newState === 'open';
      triggers.forEach((el) => el.setAttribute('aria-expanded', String(open)));
      onOpenChange?.(open);
      if (open || mode !== 'manual') return;

      // Only `manual` reaches here. The browser restores focus for `auto` on every
      // close path and for `manual` on none, so closing this one from the button
      // inside it would strand focus on an element that is now display:none.
      const active = document.activeElement;
      if (!(!active || active === document.body || popover!.contains(active))) return;
      triggers.find((el) => el.isConnected)?.focus();
    }

    const openNow = String(popover.matches(':popover-open'));
    triggers.forEach((el) => el.setAttribute('aria-expanded', openNow));
    popover.addEventListener('toggle', onToggle);
    return () => popover.removeEventListener('toggle', onToggle);
  }, [id, mode, onOpenChange]);

  return (
    <div
      {...props}
      ref={popoverRef}
      className={cx('auk-popover', className)}
      id={id}
      popover={mode}
      role="group"
      aria-labelledby={titleId}
    >
      <div data-part="header">
        <h2 data-part="title" id={titleId}>
          {title}
        </h2>
        {mode === 'manual' ? (
          <button
            data-part="close"
            type="button"
            popoverTarget={id}
            popoverTargetAction="hide"
            aria-label={closeLabel}
          >
            <span aria-hidden="true">&#215;</span>
          </button>
        ) : null}
      </div>

      <div data-part="body">{children}</div>
    </div>
  );
}

export function AukPopoverDemo() {
  return (
    <div>
      <button
        className="auk-button"
        type="button"
        id="filters-trigger"
        popoverTarget="filters-popover"
        aria-expanded="false"
      >
        Filters
      </button>
      <button
        className="auk-button"
        type="button"
        data-variant="secondary"
        id="notes-trigger"
        popoverTarget="notes-popover"
        aria-expanded="false"
      >
        Release notes
      </button>

      <AukPopover id="filters-popover" title="Filter results">
        <p>An auto popover closes on Escape and on a click outside it.</p>
        {/* autoFocus is the native attribute. The popover attribute alone does not
            move focus in, and a scripted focus() call would lose :focus-visible. */}
        <button className="auk-button" type="button" id="filters-apply" autoFocus>
          Apply
        </button>
      </AukPopover>

      <AukPopover id="notes-popover" title="What changed" mode="manual" closeLabel="Close release notes">
        <p>A manual popover ignores Escape and outside clicks. It closes only here.</p>
      </AukPopover>
    </div>
  );
}
