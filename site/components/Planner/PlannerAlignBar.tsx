"use client";

import { PhIcon } from "@planner/components/ui/PlannerPhIcon";
import type { PhIconName } from "@planner/components/ui/plannerPhIconMap";
import type { AlignAction } from "@planner/lib/geometry/alignDistribute";

type AlignBarProps = {
  visible: boolean;
  onAction: (action: AlignAction) => void;
  count: number;
};

type AlignButton = {
  action: AlignAction;
  icon: PhIconName;
  title: string;
  testId: string;
};

const ALIGN_BUTTONS: AlignButton[] = [
  { action: "left", icon: "caretLeft", title: "Align left", testId: "planner-align-left" },
  { action: "centerX", icon: "minimize", title: "Center horizontally", testId: "planner-align-cx" },
  { action: "right", icon: "caretRight", title: "Align right", testId: "planner-align-right" },
];

const VERTICAL_BUTTONS: AlignButton[] = [
  { action: "top", icon: "arrowUp", title: "Align top", testId: "planner-align-top" },
  { action: "centerY", icon: "maximize", title: "Center vertically", testId: "planner-align-cy" },
  { action: "bottom", icon: "arrowDown", title: "Align bottom", testId: "planner-align-bottom" },
];

const DISTRIBUTE_BUTTONS: AlignButton[] = [
  { action: "distH", icon: "expand", title: "Distribute horizontal", testId: "planner-dist-h" },
  { action: "distV", icon: "layers", title: "Distribute vertical", testId: "planner-dist-v" },
];

const MIN_DISTRIBUTE_COUNT = 3;

export function PlannerAlignBar({ visible, onAction, count }: AlignBarProps) {
  const renderGroup = (buttons: AlignButton[]) =>
    buttons.map(({ action, icon, title, testId }) => (
      <button
        key={action}
        type="button"
        className="icon-btn"
        onClick={() => onAction(action)}
        title={title}
        aria-label={title}
        data-testid={testId}
      >
        <PhIcon name={icon} size={16} />
      </button>
    ));

  return (
    <div
      className="align-toolbar"
      data-visible={visible}
      data-testid="planner-align-toolbar"
      hidden={!visible}
    >
      {renderGroup(ALIGN_BUTTONS)}
      <div className="align-toolbar__sep" />
      {renderGroup(VERTICAL_BUTTONS)}
      {count >= MIN_DISTRIBUTE_COUNT ? (
        <>
          <div className="align-toolbar__sep" />
          {renderGroup(DISTRIBUTE_BUTTONS)}
        </>
      ) : null}
    </div>
  );
}

export default PlannerAlignBar;
