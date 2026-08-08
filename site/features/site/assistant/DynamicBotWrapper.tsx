"use client";

import { useEffect, useState, type ComponentType } from "react";

/**
 * Lazy-load the chat assistant only after mount.
 * Avoids `next/dynamic({ ssr: false })`, which throws BailoutToCSR during SSR
 * and floods the Next 16 dev console with a stack that looks like a real error.
 */
export default function DynamicBotWrapper() {
  const [Assistant, setAssistant] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("@/features/site/assistant/UnifiedAssistant").then((m) => {
      if (!cancelled) {
        setAssistant(() => m.UnifiedAssistant);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Assistant) {
    return null;
  }
  return <Assistant />;
}
