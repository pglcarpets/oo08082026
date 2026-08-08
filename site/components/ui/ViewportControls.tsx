"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CornersOut,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
} from "@phosphor-icons/react";

import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Toolbar } from "@/components/ui/Toolbar";
import { cn } from "@/lib/utils";

export interface ViewportControlContract {
  readonly position: {
    readonly x: number;
    readonly y: number;
    readonly unit: string;
  };
  readonly zoomPercent: number;
  readonly setPosition: (x: number, y: number) => void;
  readonly panBy: (deltaXPx: number, deltaYPx: number) => void;
  readonly zoomBy: (factor: number) => void;
  readonly fit: () => void;
}

interface ViewportControlsProps {
  readonly controller: ViewportControlContract;
  readonly testIdPrefix: string;
  readonly className?: string;
}

const PAN_STEP_PX = 48;

export function ViewportControls({
  controller,
  testIdPrefix,
  className,
}: ViewportControlsProps) {
  const { position, zoomPercent } = controller;

  return (
    <Toolbar
      aria-label="Viewport controls"
      data-testid={`${testIdPrefix}-viewport-controls`}
      className={cn(
        "absolute right-3 bottom-3 z-[12] max-w-[calc(100%-1.5rem)] gap-0.5 rounded-lg border border-border bg-background/95 shadow-lg backdrop-blur-sm",
        className,
      )}
    >
      <div
        className="flex items-center gap-1 px-1 text-[0.65rem] tabular-nums text-muted-foreground"
        data-testid={`${testIdPrefix}-viewport-position`}
      >
        <label className="flex items-center gap-0.5" htmlFor={`${testIdPrefix}-viewport-x`}>
          <span aria-hidden>X</span>
          <Input
            id={`${testIdPrefix}-viewport-x`}
            key={`x-${position.x}`}
            type="number"
            defaultValue={position.x}
            aria-label={`Viewport X position in ${position.unit}`}
            data-testid={`${testIdPrefix}-viewport-position-x`}
            className="h-6 w-14 rounded-[min(var(--radius-md),10px)] px-1 text-[0.65rem] tabular-nums"
            onBlur={(event) => {
              const x = Number(event.currentTarget.value);
              if (Number.isFinite(x)) {controller.setPosition(x, position.y);}
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {event.currentTarget.blur();}
            }}
          />
        </label>
        <label className="flex items-center gap-0.5" htmlFor={`${testIdPrefix}-viewport-y`}>
          <span aria-hidden>Y</span>
          <Input
            id={`${testIdPrefix}-viewport-y`}
            key={`y-${position.y}`}
            type="number"
            defaultValue={position.y}
            aria-label={`Viewport Y position in ${position.unit}`}
            data-testid={`${testIdPrefix}-viewport-position-y`}
            className="h-6 w-14 rounded-[min(var(--radius-md),10px)] px-1 text-[0.65rem] tabular-nums"
            onBlur={(event) => {
              const y = Number(event.currentTarget.value);
              if (Number.isFinite(y)) {controller.setPosition(position.x, y);}
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {event.currentTarget.blur();}
            }}
          />
        </label>
        <span aria-hidden>{position.unit}</span>
      </div>
      <div className="grid grid-cols-3 grid-rows-2 gap-0.5" role="group" aria-label="Pan viewport">
        <IconButton
          label="Pan left"
          size="icon-xs"
          data-testid={`${testIdPrefix}-viewport-pan-left`}
          onClick={() => controller.panBy(-PAN_STEP_PX, 0)}
        >
          <ArrowLeft aria-hidden />
        </IconButton>
        <IconButton
          label="Pan up"
          size="icon-xs"
          data-testid={`${testIdPrefix}-viewport-pan-up`}
          onClick={() => controller.panBy(0, -PAN_STEP_PX)}
        >
          <ArrowUp aria-hidden />
        </IconButton>
        <IconButton
          label="Pan right"
          size="icon-xs"
          data-testid={`${testIdPrefix}-viewport-pan-right`}
          onClick={() => controller.panBy(PAN_STEP_PX, 0)}
        >
          <ArrowRight aria-hidden />
        </IconButton>
        <span aria-hidden />
        <IconButton
          label="Pan down"
          size="icon-xs"
          data-testid={`${testIdPrefix}-viewport-pan-down`}
          onClick={() => controller.panBy(0, PAN_STEP_PX)}
        >
          <ArrowDown aria-hidden />
        </IconButton>
      </div>
      <IconButton
        label="Zoom out"
        size="icon-xs"
        data-testid={`${testIdPrefix}-viewport-zoom-out`}
        onClick={() => controller.zoomBy(0.8)}
      >
        <MagnifyingGlassMinus aria-hidden />
      </IconButton>
      <span
        className="min-w-10 text-center text-[0.65rem] tabular-nums"
        aria-label={`Zoom ${zoomPercent}%`}
        data-testid={`${testIdPrefix}-viewport-zoom`}
      >
        {zoomPercent}%
      </span>
      <IconButton
        label="Zoom in"
        size="icon-xs"
        data-testid={`${testIdPrefix}-viewport-zoom-in`}
        onClick={() => controller.zoomBy(1.25)}
      >
        <MagnifyingGlassPlus aria-hidden />
      </IconButton>
      <IconButton
        label="Fit viewport"
        size="icon-xs"
        data-testid={`${testIdPrefix}-viewport-fit`}
        onClick={controller.fit}
      >
        <CornersOut aria-hidden />
      </IconButton>
    </Toolbar>
  );
}
