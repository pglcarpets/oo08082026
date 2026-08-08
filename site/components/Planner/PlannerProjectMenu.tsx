"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";

type ProjectMenuProps = {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onAutoArrange: () => void;
  testId?: string;
  panelTestId?: string;
};

function truncateLabel(name: string, max = 28): string {
  const trimmed = name.trim();
  if (!trimmed) return "Project";
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/** Planner canvas overlay — project name + auto-arrange. */
export function ProjectMenu({
  projectName,
  onProjectNameChange,
  onAutoArrange,
  testId = "btn-project-menu",
  panelTestId = "project-menu-panel",
}: ProjectMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();

  const closeMenu = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && !root.contains(event.target)) {
        closeMenu();
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closeMenu]);

  const run = (action: () => void) => {
    closeMenu();
    action();
  };

  return (
    <div className="project-menu" ref={rootRef} data-open={open ? "true" : "false"}>
      <button
        ref={triggerRef}
        className="btn btn--sm project-menu__trigger"
        type="button"
        data-testid={testId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        title="Project name and actions"
        onClick={() => setOpen((v) => !v)}
      >
        <PhIcon name="folder" size={16} />
        <span className="project-menu__trigger-label">{truncateLabel(projectName)}</span>
        <PhIcon name="caretDown" size={16} />
      </button>
      <div
        id={panelId}
        className="project-menu__panel"
        role="dialog"
        aria-label="Project"
        data-testid={panelTestId}
        hidden={!open}
      >
        <label className="project-menu__field">
          <span className="project-menu__field-label">Name</span>
          <input
            className="input input--sm project-menu__input"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            data-testid="project-menu-name"
            placeholder="Untitled plan"
            onKeyDown={(e) => {
              // Stop keystrokes reaching global shortcut listeners (e.g. Ctrl+K)
              // while typing a name, but let Escape through so the panel-level
              // close handler below still fires — same fix class as 3b's #7
              // (PlannerAiPanel Escape-to-close).
              if (e.key !== "Escape") e.stopPropagation();
            }}
          />
        </label>
        <div className="project-menu__sep" role="separator" aria-hidden="true" />
        <button type="button" className="project-menu__item" data-testid="project-menu-auto-arrange" onClick={() => run(onAutoArrange)}>
          <PhIcon name="grid" size={16} />
          Auto-arrange
        </button>
      </div>
    </div>
  );
}

export default ProjectMenu;
