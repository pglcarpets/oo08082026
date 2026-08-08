"use client";
import { useEffect, useRef, useState } from "react";
import { usePlannerUIStore } from "@planner/store/plannerUiStore";

/** Matches the `toast-out` keyframe duration in `focss/planner/chrome.css`. */
const EXIT_MS = 180;

export const Toast = () => {
  const toast = usePlannerUIStore((s) => s.toast);
  const [shown, setShown] = useState(toast);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (toast) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShown(toast);
      setLeaving(false);
      return;
    }
    if (shown) {
      setLeaving(true);
      timerRef.current = setTimeout(() => {
        setShown(null);
        setLeaving(false);
      }, EXIT_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast]);

  if (!shown) return null;
  return (
    <div className="toast-viewport">
      <div className={`toast toast--${shown.kind}${leaving ? " toast--leaving" : ""}`}>{shown.message}</div>
    </div>
  );
};

export default Toast;
