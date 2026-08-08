"use client";

import { useEffect, useRef, useState } from "react";
import type {
  DockviewGroupLocation,
  IDockviewHeaderActionsProps,
  Position,
} from "dockview-react";
import { PhIcon } from "@studio/components/ui/StudioPhIcon";

const DRAG_THRESHOLD_PX = 5;
/** Below this, a rect delta on one axis is not a meaningful direction. */
const DIRECTION_EPSILON_PX = 4;

/**
 * Where a group sat in the grid before it was floated, so it can snap back.
 * Keyed by group id and held at module scope: the header component can remount
 * while the group floats, and a ref would not survive that.
 */
type DockOrigin = {
  referenceGroupId: string;
  position: Position;
};

const originByGroupId = new Map<string, DockOrigin>();

type GroupLike = {
  id: string;
  element?: HTMLElement;
  api: { location: DockviewGroupLocation };
};

function centreOf(el: HTMLElement | undefined): { x: number; y: number } | null {
  const rect = el?.getBoundingClientRect?.();
  if (!rect || (rect.width === 0 && rect.height === 0)) return null;
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/** Direction of `self` relative to `reference`, as a dockview drop Position. */
function positionOf(
  self: { x: number; y: number },
  reference: { x: number; y: number },
): Position {
  const dx = self.x - reference.x;
  const dy = self.y - reference.y;
  if (Math.abs(dx) < DIRECTION_EPSILON_PX && Math.abs(dy) < DIRECTION_EPSILON_PX) {
    return "center";
  }
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? "left" : "right";
  return dy < 0 ? "top" : "bottom";
}

/**
 * Record the docked neighbour this group should return to. Chooses the nearest
 * still-docked group so the snap-back lands next to the same panel it left.
 */
function captureOrigin(props: IDockviewHeaderActionsProps): void {
  const self = props.group as unknown as GroupLike;
  const selfCentre = centreOf(self.element);
  if (!selfCentre) return;

  const candidates = (props.containerApi.groups as unknown as GroupLike[]).filter(
    (g) => g.id !== self.id && g.api.location.type === "grid",
  );
  if (candidates.length === 0) {
    originByGroupId.delete(self.id);
    return;
  }

  let nearest: { group: GroupLike; centre: { x: number; y: number }; dist: number } | null = null;
  for (const group of candidates) {
    const centre = centreOf(group.element);
    if (!centre) continue;
    const dist = Math.hypot(centre.x - selfCentre.x, centre.y - selfCentre.y);
    if (!nearest || dist < nearest.dist) nearest = { group, centre, dist };
  }
  if (!nearest) {
    originByGroupId.delete(self.id);
    return;
  }

  originByGroupId.set(self.id, {
    referenceGroupId: nearest.group.id,
    position: positionOf(selfCentre, nearest.centre),
  });
}

/**
 * Tab-header control to float / re-dock a dockview group.
 * - Click: pop out, or dock back where it came from
 * - Drag: pop out and keep dragging (dockview `inDragMode`) — plain drag, no Shift
 * - Re-docking snaps to the group's original grid position when it still exists
 */
export function DockFloatHeaderActions(props: IDockviewHeaderActionsProps) {
  const [floating, setFloating] = useState(
    () => props.api.location.type === "floating" || props.location?.type === "floating",
  );
  const suppressClickRef = useRef(false);

  useEffect(() => {
    setFloating(props.api.location.type === "floating");
    const disposable = props.api.onDidLocationChange((event: { location: DockviewGroupLocation }) => {
      setFloating(event.location.type === "floating");
    });
    return () => {
      disposable.dispose();
    };
  }, [props.api]);

  const popOutAt = (clientX: number, clientY: number, inDragMode: boolean) => {
    captureOrigin(props);
    const rect = props.group.element?.getBoundingClientRect?.();
    const width = Math.max(280, Math.round(rect?.width || 360));
    const height = Math.max(240, Math.round(rect?.height || 420));
    // Overlay host is viewport-fixed in our CSS, so client coords map to float position.
    const x = inDragMode
      ? Math.round(clientX - width / 2)
      : rect
        ? Math.round(rect.left > window.innerWidth / 2
          ? Math.max(24, window.innerWidth - width - 24)
          : 24)
        : 24;
    const y = inDragMode ? Math.round(clientY - 16) : 56;
    const opts = {
      width,
      height,
      x: Math.max(8, x),
      y: Math.max(8, y),
      inDragMode,
    };
    props.containerApi.addFloatingGroup(props.group, opts as never);
  };

  const dockBack = () => {
    const self = props.group as unknown as GroupLike;
    const origin = originByGroupId.get(self.id);

    if (origin) {
      const reference = (props.containerApi.groups as unknown as GroupLike[]).find(
        (g) => g.id === origin.referenceGroupId && g.api.location.type === "grid",
      );
      if (reference) {
        originByGroupId.delete(self.id);
        props.group.api.moveTo({
          group: reference as never,
          position: origin.position,
        });
        return;
      }
    }

    // Origin gone (or never captured) — fall back to a fresh grid group.
    originByGroupId.delete(self.id);
    const group = props.containerApi.addGroup();
    props.group.api.moveTo({ group });
  };

  return (
    <button
      type="button"
      className="dock-float-btn"
      title={floating ? "Dock panel back" : "Drag to pop out, or click"}
      aria-label={floating ? "Dock panel back" : "Pop out panel"}
      data-testid={floating ? "dock-redock" : "dock-float"}
      data-floating={floating ? "true" : "false"}
      onPointerDown={(event) => {
        if (floating || event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const startY = event.clientY;
        let dragging = false;

        const onMove = (ev: PointerEvent) => {
          if (dragging) return;
          if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD_PX) return;
          dragging = true;
          suppressClickRef.current = true;
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          popOutAt(ev.clientX, ev.clientY, true);
        };
        const onUp = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        if (floating) {
          dockBack();
          return;
        }
        popOutAt(event.clientX, event.clientY, false);
      }}
    >
      <PhIcon name={floating ? "minimize" : "expand"} size={16} />
    </button>
  );
}

export default DockFloatHeaderActions;
