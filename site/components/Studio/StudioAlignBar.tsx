"use client";
import { PhIcon } from "@studio/components/ui/StudioPhIcon";
import React from "react";
import type { AlignAction } from "@studio/lib/studioTypes";
import type { PhIconName } from "@studio/components/ui/studioPhIconMap";

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
  { action: "left", icon: "alignLeft", title: "Align left", testId: "align-left" },
  { action: "centerX", icon: "alignCenterX", title: "Center horizontally", testId: "align-cx" },
  { action: "right", icon: "alignRight", title: "Align right", testId: "align-right" },
];

const VERTICAL_BUTTONS: AlignButton[] = [
  { action: "top", icon: "alignTop", title: "Align top", testId: "align-top" },
  { action: "centerY", icon: "alignCenterY", title: "Center vertically", testId: "align-cy" },
  { action: "bottom", icon: "alignBottom", title: "Align bottom", testId: "align-bottom" },
];

/** Distribute needs three or more objects to be meaningful. */
const DISTRIBUTE_BUTTONS: AlignButton[] = [
  { action: "distH", icon: "distH", title: "Distribute horizontal", testId: "dist-h" },
  { action: "distV", icon: "distV", title: "Distribute vertical", testId: "dist-v" },
];

const TRANSFORM_BUTTONS: AlignButton[] = [
  { action: "flipH", icon: "flipH", title: "Flip horizontal", testId: "flip-h" },
  { action: "flipV", icon: "flipV", title: "Flip vertical", testId: "flip-v" },
  { action: "rotate90", icon: "rotate", title: "Rotate 90°", testId: "rot-90" },
];

const MIN_DISTRIBUTE_COUNT = 3;

export const AlignBar = ({ visible, onAction, count }: AlignBarProps) => {
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
    <div className="align-toolbar" data-visible={visible} data-testid="align-toolbar">
      {renderGroup(ALIGN_BUTTONS)}
      <div className="align-toolbar__sep" />
      {renderGroup(VERTICAL_BUTTONS)}
      {count >= MIN_DISTRIBUTE_COUNT && (
        <>
          <div className="align-toolbar__sep" />
          {renderGroup(DISTRIBUTE_BUTTONS)}
        </>
      )}
      <div className="align-toolbar__sep" />
      {renderGroup(TRANSFORM_BUTTONS)}
    </div>
  );
};

export default AlignBar;
