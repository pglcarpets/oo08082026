"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { formatKpiValuePlus } from "@/lib/kpiFormat";

interface KpiCounterProps {
  value: number;
  className?: string;
}

export function KpiCounter({ value, className = "typ-stat text-primary" }: KpiCounterProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.45 });
  const reduceMotion = useReducedMotion();
  // Start at 0 so motion path can animate up; static paths render `value` below.
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      const id = requestAnimationFrame(() => {
        setDisplayValue(value);
      });
      return () => cancelAnimationFrame(id);
    }
    if (!isInView) {return;}

    const durationMs = 2200;
    let frameId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isInView, reduceMotion, value]);

  const renderedValue = reduceMotion || !isInView ? value : displayValue;

  return (
    <p ref={ref} className={className}>
      {formatKpiValuePlus(renderedValue)}
    </p>
  );
}