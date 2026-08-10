"use client";
import React from "react";
import { PhIcon, type PhIconName } from "@studio/components/ui/StudioPhIcon";

type IconButtonProps = {
  icon: PhIconName | string;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  testId?: string;
};

export const IconButton = ({ icon, label, active, onClick, disabled, testId }: IconButtonProps) => (
  <button
    className="icon-btn"
    aria-pressed={!!active}
    data-active={!!active}
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    data-testid={testId}
    type="button"
  >
    <PhIcon name={icon} size={20} />
    <span className="icon-btn__tip">{label}</span>
  </button>
);

export default IconButton;
