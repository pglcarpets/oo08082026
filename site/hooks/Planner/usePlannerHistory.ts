"use client";
import { useEffect, useRef, useCallback, useState, type MutableRefObject } from "react";
import type { Canvas } from "fabric";
import {
  serializeFabricCanvasJson,
  PLANNER_FABRIC_OBJECT_PROPS,
} from "@planner/lib/plannerFabricSerialize";

const MAX_STACK = 60;

export const useHistory = (
  fabricRef: MutableRefObject<Canvas | null>,
  ready: boolean,
  // A stable reference (not `[...PLANNER_FABRIC_OBJECT_PROPS]`, which
  // allocates a brand-new array — and therefore a new `commit` identity —
  // on every render). An unstable `commit` made the listener-registration
  // effect below re-run on every React render, which called `commit()`
  // unconditionally each time; combined with `o.selectable`/`o.evented`
  // being mutated directly (no Fabric event) whenever the active tool
  // changes, this pushed a spurious "tool switched" history entry on top
  // of the real one for every step/tool change — so a single Undo would
  // remove that noise entry and land right back on the same object count,
  // looking exactly like "Undo did nothing" for whichever action preceded
  // the next tool change.
  propsToInclude: readonly string[] = PLANNER_FABRIC_OBJECT_PROPS,
  onRestore?: () => void,
) => {
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const suppress = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const snapshot = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return null;
    return serializeFabricCanvasJson(c, propsToInclude);
  }, [fabricRef, propsToInclude]);

  const commit = useCallback(() => {
    const c = fabricRef.current;
    if (!c || suppress.current) return;
    const snap = serializeFabricCanvasJson(c, propsToInclude);
    const last = past.current[past.current.length - 1];
    if (last === snap) return;
    past.current.push(snap);
    if (past.current.length > MAX_STACK) past.current.shift();
    future.current = [];
    setCanUndo(past.current.length > 1);
    setCanRedo(false);
  }, [fabricRef, propsToInclude]);

  const loadJson = useCallback(
    (json: string) => {
      const c = fabricRef.current;
      if (!c) return;
      suppress.current = true;
      void c.loadFromJSON(JSON.parse(json) as object).then(() => {
        c.requestRenderAll();
        suppress.current = false;
        // loadFromJSON replaces the entire object list, which discards
        // canvas-managed decorations (grid lines, sheet outline) that are
        // deliberately excluded from the serialized snapshot. Let the
        // caller re-draw those and refresh any derived UI state (layers
        // list, scene version) so undo/redo doesn't visually corrupt the
        // canvas even though the underlying restore was correct.
        onRestore?.();
      });
    },
    [fabricRef, onRestore],
  );

  /** Suspend history commits for the duration of a multi-step user gesture
   * (e.g. drag-to-draw), so intermediate object:added/object:modified events
   * don't each push their own history entry. Call `resume` before the final
   * commit for the gesture. */
  const suspend = useCallback(() => {
    suppress.current = true;
  }, []);

  const resume = useCallback(() => {
    suppress.current = false;
  }, []);

  const undo = useCallback(() => {
    if (past.current.length < 2) return;
    const current = past.current.pop();
    if (current === undefined) return;
    future.current.push(current);
    const prev = past.current[past.current.length - 1];
    if (prev) loadJson(prev);
    setCanUndo(past.current.length > 1);
    setCanRedo(future.current.length > 0);
  }, [loadJson]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current.pop();
    if (next === undefined) return;
    past.current.push(next);
    loadJson(next);
    setCanUndo(past.current.length > 1);
    setCanRedo(future.current.length > 0);
  }, [loadJson]);

  const reset = useCallback(() => {
    past.current = [];
    future.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const c = fabricRef.current;
    if (!c) return;
    const onChange = () => commit();
    c.on("object:added", onChange);
    c.on("object:modified", onChange);
    c.on("object:removed", onChange);
    c.on("path:created", onChange);
    commit();
    return () => {
      c.off("object:added", onChange);
      c.off("object:modified", onChange);
      c.off("object:removed", onChange);
      c.off("path:created", onChange);
    };
  }, [ready, fabricRef, commit]);

  return { commit, undo, redo, reset, canUndo, canRedo, snapshot, suspend, resume };
};
