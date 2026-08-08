"use client";

import { type ChangeEvent } from "react";
import { hexToHsl, hslToHex } from "@planner/lib/plannerColorUtils";

type HueSliderProps = {
  value?: string;
  fallback: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
};

export function HueSlider({ value, fallback, onChange, disabled }: HueSliderProps) {
  const base = value && value !== "transparent" ? value : fallback;
  const hsl = hexToHsl(base) ?? { h: 0, s: 100, l: 50 };
  const thumbColor = hslToHex(hsl.h, 100, 50);

  const onHueChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextHue = Number(event.target.value);
    onChange(hslToHex(nextHue, hsl.s, hsl.l));
  };

  return (
    <div className="color-palette__hue-wrap">
      <div className="color-palette__hue-label">Hue</div>
      <input
        type="range"
        className="color-palette__hue"
        min={0}
        max={360}
        value={hsl.h}
        onChange={onHueChange}
        disabled={disabled}
        style={{ color: thumbColor }}
        data-testid="cp-hue"
        aria-label="Hue"
      />
    </div>
  );
}

export default HueSlider;
