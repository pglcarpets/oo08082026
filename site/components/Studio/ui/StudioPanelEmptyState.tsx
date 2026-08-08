import { PhIcon, type PhIconName } from "@studio/components/ui/StudioPhIcon";

type PanelEmptyStateProps = {
  icon: PhIconName;
  title: string;
  body: string;
  testId?: string;
};

/** Centered dock-panel empty state — shared by Properties, Layers, etc. */
export function PanelEmptyState({ icon, title, body, testId }: PanelEmptyStateProps) {
  return (
    <div className="panel-empty-state" data-testid={testId}>
      <div className="panel-empty-state__icon" aria-hidden="true">
        <PhIcon name={icon} size={20} />
      </div>
      <p className="panel-empty-state__title">{title}</p>
      <p className="panel-empty-state__body">{body}</p>
    </div>
  );
}

export default PanelEmptyState;
