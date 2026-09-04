import type { ReactNode } from 'react';

export interface TabsPanel {
  /** Stable id, used to pair the tab with its panel. */
  id: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  id: string;
  panels: TabsPanel[];
  /** Panel shown on first render. Defaults to the first. */
  initial?: string;
}

export function Tabs({ id, panels, initial }: TabsProps) {
  const selected = initial ?? panels[0]?.id;
  return (
    <div className="auk-tabs" id={id}>
      <div data-part="list" role="tablist">
        {panels.map((panel) => (
          <button
            key={panel.id}
            role="tab"
            id={`${panel.id}-tab`}
            aria-controls={panel.id}
            aria-selected={panel.id === selected}
            tabIndex={panel.id === selected ? 0 : -1}
          >
            {panel.label}
          </button>
        ))}
      </div>
      {panels.map((panel) => (
        <div
          key={panel.id}
          role="tabpanel"
          id={panel.id}
          aria-labelledby={`${panel.id}-tab`}
          hidden={panel.id !== selected}
          tabIndex={0}
        >
          {panel.content}
        </div>
      ))}
    </div>
  );
}
