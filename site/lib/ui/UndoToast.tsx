"use client";

/**
 * UndoToast — Slides in from bottom to confirm destructive actions.
 * Shows "[action] · Undo" or "Undone · Redo" with auto-dismiss.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { ArrowCounterClockwise as Undo2, ArrowClockwise as Redo2 } from "@phosphor-icons/react";
import { Z } from "@/lib/z-index";

export interface UndoToastMessage {
  id: string;
  text: string;
  type: "undo" | "redo";
  onAction?: () => void;
}

interface UndoToastProps {
  message: UndoToastMessage | null;
  onDismiss: () => void;
  duration?: number;
}

export function UndoToast({ message, onDismiss, duration = 4000 }: UndoToastProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setVisible(true), 0);
      if (timerRef.current) {clearTimeout(timerRef.current);}
      timerRef.current = t;
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, duration);
      timerRef.current = hideTimer;
      return () => {
        clearTimeout(hideTimer);
        if (timerRef.current) {clearTimeout(timerRef.current);}
      };
    }
    const t = setTimeout(() => setVisible(false), 0);
    return () => {
      clearTimeout(t);
      if (timerRef.current) {clearTimeout(timerRef.current);}
    };
  }, [message, duration, onDismiss]);

  const handleAction = useCallback(() => {
    message?.onAction?.();
    setVisible(false);
    setTimeout(onDismiss, 300);
  }, [message, onDismiss]);

  if (!message) {return null;}

  const Icon = message.type === "undo" ? Undo2 : Redo2;
  const actionLabel = message.type === "undo" ? "Undo" : "Redo";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed bottom-6 left-1/2 pointer-events-auto transition-all duration-300 ease-out ${
        visible ? "translate-x-[-50%] translate-y-0 opacity-100" : "translate-x-[-50%] translate-y-5 opacity-0"
      }`}
      style={{ zIndex: Z.toast }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-[0.8125rem] bg-[var(--surface-elevated,var(--color-ecru-950))] text-[var(--text-on-dark,var(--color-white-50))]">
        <span>{message.text}</span>
        <span className="text-[var(--text-muted-on-dark,var(--text-inverse-subtle))]">·</span>
        <button
          onClick={handleAction}
          className="flex items-center gap-1 font-medium hover:opacity-80 transition-opacity text-[var(--color-primary,var(--color-ecru-500))]"
        >
          <Icon size={14} />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
