"use client";
import { useEffect, type DependencyList } from "react";

type ShortcutHandlers = {
  undo?: () => void;
  redo?: () => void;
  duplicate?: () => void;
  group?: () => void;
  save?: () => void;
  selectAll?: () => void;
  copy?: () => void;
  paste?: () => void;
  delete?: () => void;
  escape?: () => void;
  tool?: (id: string) => void;
};

export const useKeyboardShortcuts = (handlers: ShortcutHandlers, deps: DependencyList = []) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (ctrl && key === "z" && !e.shiftKey) {
        e.preventDefault();
        handlers.undo?.();
        return;
      }
      if ((ctrl && key === "y") || (ctrl && e.shiftKey && key === "z")) {
        e.preventDefault();
        handlers.redo?.();
        return;
      }
      if (ctrl && key === "d") {
        e.preventDefault();
        handlers.duplicate?.();
        return;
      }
      if (ctrl && key === "g") {
        e.preventDefault();
        handlers.group?.();
        return;
      }
      if (ctrl && key === "s") {
        e.preventDefault();
        handlers.save?.();
        return;
      }
      if (ctrl && key === "a") {
        e.preventDefault();
        handlers.selectAll?.();
        return;
      }
      if (ctrl && key === "c") {
        handlers.copy?.();
        return;
      }
      if (ctrl && key === "v") {
        handlers.paste?.();
        return;
      }

      if (inField) return;
      if (key === "delete" || key === "backspace") {
        e.preventDefault();
        handlers.delete?.();
        return;
      }
      if (key === "escape") {
        handlers.escape?.();
        return;
      }
      if (key === "v") {
        handlers.tool?.("select");
        return;
      }
      if (key === "r") {
        handlers.tool?.("rect");
        return;
      }
      if (key === "c") {
        handlers.tool?.("circle");
        return;
      }
      if (key === "l") {
        handlers.tool?.("line");
        return;
      }
      if (key === "p") {
        handlers.tool?.("polygon");
        return;
      }
      if (key === "t") {
        handlers.tool?.("text");
        return;
      }
      if (key === "w") {
        handlers.tool?.("wall");
        return;
      }
      if (key === "h") {
        handlers.tool?.("pan");
        return;
      }
      if (key === "d") {
        handlers.tool?.("dimension");
        return;
      }
      if (key === "m") {
        handlers.tool?.("freehand");
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
