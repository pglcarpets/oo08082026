"use client";

export type DockPanelButtonDef = {
  id: string;
  label: string;
  testId?: string;
};

type DockPanelButtonsProps = {
  items: DockPanelButtonDef[];
  activeId?: string | null;
  onSelect: (id: string) => void;
};

/** Compact dock-tab shortcuts for canvas overlay chrome. */
export function DockPanelButtons({ items, activeId, onSelect }: DockPanelButtonsProps) {
  return (
    <div className="dock-panel-toggles" data-testid="dock-panel-toggles">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="btn btn--sm"
          data-active={activeId === item.id ? "true" : "false"}
          data-testid={item.testId ?? `dock-tab-${item.id}`}
          title={item.label}
          aria-pressed={activeId === item.id}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default DockPanelButtons;
