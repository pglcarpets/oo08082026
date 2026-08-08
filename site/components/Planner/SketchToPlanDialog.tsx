"use client";

import { useEffect, useId, useRef } from "react";
import {
  getSketchRecoveryMessage,
  type SketchToPlanUiState,
} from "@planner/lib/ai/sketchToPlanShared";

type SketchToPlanDialogProps = {
  state: SketchToPlanUiState;
  onAccept: () => void;
  onReject: () => void;
  onDismiss: () => void;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Preview / fallback dialog for sketch → walls conversion. */
export function SketchToPlanDialog({
  state,
  onAccept,
  onReject,
  onDismiss,
}: SketchToPlanDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const open = state.status !== "idle";

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const dialog = dialogRef.current;
    const focusInitial = () => {
      if (!dialog) return;
      const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      (focusables[0] ?? dialog).focus();
    };
    const frame = window.requestAnimationFrame(focusInitial);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onDismiss();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
      if (focusables.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.();
      previouslyFocused.current = null;
    };
  }, [open, onDismiss, state.status]);

  if (state.status === "idle") return null;

  const wallCount =
    state.status === "preview"
      ? state.objects.filter((object) => object.type === "wall").length
      : 0;
  const roomCount =
    state.status === "preview"
      ? state.objects.filter((object) => object.type === "room").length
      : 0;

  return (
    <div className="dialog-scrim" role="presentation" data-testid="sketch-to-plan-scrim">
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid="sketch-to-plan-dialog"
      >
        <header className="dialog__actions" style={{ justifyContent: "space-between", marginTop: 0, marginBottom: 12 }}>
          <h2 id={titleId} className="dialog__title" style={{ margin: 0 }}>
            Sketch to plan
          </h2>
          <button type="button" className="btn btn--sm" onClick={onDismiss} aria-label="Close">
            Close
          </button>
        </header>

        <div className="dialog__sub" style={{ marginBottom: 12 }}>
          {state.status === "converting" ? (
            <p role="status">Converting {state.fileName}…</p>
          ) : null}

          {state.status === "preview" ? (
            <>
              <p>
                Preview for <strong>{state.fileName}</strong>: {wallCount} wall
                {wallCount === 1 ? "" : "s"}
                {roomCount > 0 ? `, ${roomCount} room${roomCount === 1 ? "" : "s"}` : ""} ready
                to apply.
              </p>
              <p className="dialog__sub">
                Converted geometry is a drafting aid, not construction-authoritative. Coordinates
                are millimetres from the sheet origin.
              </p>
              {state.warnings.length > 0 ? (
                <ul data-testid="sketch-to-plan-warnings">
                  {state.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}

          {state.status === "fallback" ? (
            <p role="status" data-testid="sketch-to-plan-fallback">
              {state.message || getSketchRecoveryMessage(state.reason)}
            </p>
          ) : null}

          {state.status === "error" ? (
            <p role="alert" data-testid="sketch-to-plan-error">
              {state.message}
            </p>
          ) : null}
        </div>

        <footer className="dialog__actions">
          {state.status === "preview" ? (
            <>
              <button type="button" className="btn btn--sm" onClick={onReject} data-testid="sketch-to-plan-reject">
                Reject
              </button>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={onAccept}
                data-testid="sketch-to-plan-accept"
              >
                Accept geometry
              </button>
            </>
          ) : null}
          {state.status === "fallback" || state.status === "error" ? (
            <button type="button" className="btn btn--primary btn--sm" onClick={onDismiss} data-testid="sketch-to-plan-dismiss">
              OK
            </button>
          ) : null}
          {state.status === "converting" ? (
            <button type="button" className="btn btn--sm" onClick={onDismiss} data-testid="sketch-to-plan-cancel">
              Cancel
            </button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

export default SketchToPlanDialog;
