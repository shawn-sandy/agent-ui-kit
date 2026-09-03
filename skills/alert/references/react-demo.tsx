import * as React from 'react';

export type AukAlertVariant = 'info' | 'success' | 'warning' | 'error';

type AlertRole = 'alert' | 'status';
type AlertLive = 'assertive' | 'polite';

const ALERT_META: Record<
  AukAlertVariant,
  { icon: string; severity: string; role: AlertRole; live: AlertLive }
> = {
  error: { icon: '\u26a0', severity: 'Error:', role: 'alert', live: 'assertive' },
  warning: { icon: '\u26a0', severity: 'Warning:', role: 'status', live: 'polite' },
  success: { icon: '\u2713', severity: 'Success:', role: 'status', live: 'polite' },
  info: { icon: '\u2139', severity: 'Information:', role: 'status', live: 'polite' },
};

export interface AukAlertProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'aria-atomic' | 'aria-live' | 'role'
  > {
  variant?: AukAlertVariant;
  message: React.ReactNode;
}

function cx(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function AukAlert({
  variant = 'info',
  message,
  className,
  ...props
}: AukAlertProps) {
  const meta = ALERT_META[variant];

  return (
    <div
      {...props}
      className={cx('auk-alert', className)}
      data-variant={variant}
      role={meta.role}
      aria-live={meta.live}
      aria-atomic="true"
    >
      <span data-part="icon" aria-hidden="true">
        {meta.icon}
      </span>
      <span data-part="severity">{meta.severity}</span>
      <span data-part="message">{message}</span>
    </div>
  );
}

export function AukAlertDemo() {
  const [messages, setMessages] = React.useState<Record<AukAlertVariant, string>>({
    error: '',
    warning: '',
    success: '',
    info: '',
  });

  const setMessage = (variant: AukAlertVariant, message: string) => {
    setMessages((current) => ({ ...current, [variant]: message }));
  };

  return (
    <div>
      <AukAlert variant="error" message={messages.error} />
      <AukAlert variant="warning" message={messages.warning} />
      <AukAlert variant="success" message={messages.success} />
      <AukAlert variant="info" message={messages.info} />

      <button type="button" onClick={() => setMessage('error', 'Could not save changes.')}>
        Fail the save
      </button>
      <button type="button" onClick={() => setMessage('warning', 'Storage is almost full.')}>
        Warn about the quota
      </button>
      <button type="button" onClick={() => setMessage('success', 'Upload complete.')}>
        Finish the upload
      </button>
      <button type="button" onClick={() => setMessage('info', 'Maintenance starts at 9 PM.')}>
        Mention the maintenance window
      </button>
    </div>
  );
}
