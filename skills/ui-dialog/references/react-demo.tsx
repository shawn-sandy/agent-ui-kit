import * as React from 'react';

type FocusRef = { current: HTMLElement | null };

export interface AukDialogProps
  extends Omit<
    React.DialogHTMLAttributes<HTMLDialogElement>,
    'aria-describedby' | 'aria-labelledby' | 'onClose' | 'open'
  > {
  id: string;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef?: FocusRef;
  fallbackId?: string;
  closeLabel?: string;
}

function cx(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function AukDialog({
  id,
  title,
  children,
  footer,
  open,
  onOpenChange,
  returnFocusRef,
  fallbackId,
  closeLabel = 'Close dialog',
  className,
  onClick,
  ...props
}: AukDialogProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const titleId = `${id}-title`;
  const bodyId = `${id}-body`;

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!open && dialog.open) dialog.close();
  }, [open]);

  const restoreFocus = React.useCallback(() => {
    const fallback = fallbackId ? document.getElementById(fallbackId) : null;
    const target = returnFocusRef?.current?.isConnected ? returnFocusRef.current : fallback;

    window.setTimeout(() => {
      if (target?.isConnected) {
        target.focus();
        return;
      }

      const dialog = dialogRef.current;
      const active = document.activeElement;
      if (active instanceof HTMLElement && dialog?.contains(active)) active.blur();
    }, 0);
  }, [fallbackId, returnFocusRef]);

  const handleClose = React.useCallback(() => {
    onOpenChange(false);
    restoreFocus();
  }, [onOpenChange, restoreFocus]);

  const handleBackdropClick: React.MouseEventHandler<HTMLDialogElement> = (event) => {
    onClick?.(event);
    if (!event.defaultPrevented && event.target === event.currentTarget) {
      onOpenChange(false);
    }
  };

  return (
    <dialog
      {...props}
      ref={dialogRef}
      className={cx('auk-dialog', className)}
      id={id}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      data-dialog-fallback={fallbackId}
      onClick={handleBackdropClick}
      onClose={handleClose}
    >
      <div data-part="header">
        <h2 id={titleId}>{title}</h2>
        <button
          className="auk-dialog-close"
          type="button"
          data-dialog-close=""
          aria-label={closeLabel}
          onClick={() => onOpenChange(false)}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <div data-part="body" id={bodyId}>
        {children}
      </div>

      {footer ? <div data-part="footer">{footer}</div> : null}
    </dialog>
  );
}

export function AukDialogDemo() {
  const [open, setOpen] = React.useState(false);
  const openerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <div>
      <button
        className="auk-button"
        type="button"
        data-dialog-open="confirm-delete"
        ref={openerRef}
        onClick={() => setOpen(true)}
      >
        Delete account
      </button>

      <AukDialog
        id="confirm-delete"
        title="Delete this account?"
        open={open}
        onOpenChange={setOpen}
        returnFocusRef={openerRef}
        footer={
          <>
            <button
              className="auk-button"
              type="button"
              data-variant="secondary"
              data-dialog-close=""
              autoFocus
              onClick={() => setOpen(false)}
            >
              Keep account
            </button>
            <button className="auk-button" type="button" data-variant="destructive">
              Delete permanently
            </button>
          </>
        }
      >
        <p>This removes the account and everything in it. It cannot be undone.</p>
      </AukDialog>
    </div>
  );
}
