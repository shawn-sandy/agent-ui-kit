import * as React from 'react';

export interface AukTabItem {
  id: string;
  label: React.ReactNode;
  panel: React.ReactNode;
}

export interface AukTabsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  id: string;
  ariaLabel: string;
  tabs: readonly [AukTabItem, ...AukTabItem[]];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

function cx(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function AukTabs({
  id,
  ariaLabel,
  tabs,
  value,
  defaultValue,
  onValueChange,
  className,
  ...props
}: AukTabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? tabs[0].id);
  const selectedValue = value ?? internalValue;
  const selectedIndex = Math.max(0, tabs.findIndex((tab) => tab.id === selectedValue));
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  React.useEffect(() => {
    if (value !== undefined) return;
    if (tabs.some((tab) => tab.id === internalValue)) return;
    setInternalValue(tabs[0].id);
  }, [internalValue, tabs, value]);

  const selectIndex = (index: number, moveFocus: boolean) => {
    const next = tabs[index];
    if (!next) return;
    if (value === undefined) setInternalValue(next.id);
    onValueChange?.(next.id);

    if (moveFocus) {
      window.requestAnimationFrame(() => tabRefs.current[next.id]?.focus());
    }
  };

  const handleKeyDown =
    (index: number): React.KeyboardEventHandler<HTMLButtonElement> =>
    (event) => {
      const last = tabs.length - 1;
      let next: number | null = null;

      if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
      else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = last;
      else return;

      event.preventDefault();
      selectIndex(next, true);
    };

  return (
    <div {...props} className={cx('auk-tabs', className)} id={id}>
      <div className="auk-tabs-list" data-part="tablist" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab, index) => {
          const selected = index === selectedIndex;
          const tabId = `${id}-tab-${tab.id}`;
          const panelId = `${id}-panel-${tab.id}`;

          return (
            <button
              className="auk-tab"
              type="button"
              role="tab"
              id={tabId}
              key={tab.id}
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              aria-controls={panelId}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectIndex(index, true)}
              onKeyDown={handleKeyDown(index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab, index) => {
        const selected = index === selectedIndex;
        const tabId = `${id}-tab-${tab.id}`;
        const panelId = `${id}-panel-${tab.id}`;

        return (
          <div
            className="auk-tabpanel"
            role="tabpanel"
            id={panelId}
            key={tab.id}
            aria-labelledby={tabId}
            tabIndex={0}
            hidden={!selected}
          >
            {tab.panel}
          </div>
        );
      })}
    </div>
  );
}

export function AukTabsDemo() {
  return (
    <AukTabs
      id="settings-tabs"
      ariaLabel="Settings sections"
      tabs={[
        { id: 'profile', label: 'Profile', panel: <p>Name, avatar and public handle.</p> },
        { id: 'billing', label: 'Billing', panel: <p>Plan, payment method and invoices.</p> },
        {
          id: 'notifications',
          label: 'Notifications',
          panel: <p>Email and in-app notification preferences.</p>,
        },
      ]}
    />
  );
}
