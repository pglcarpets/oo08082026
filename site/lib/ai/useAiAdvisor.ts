"use client";

import { useState, useCallback, useRef, useEffect } from "react";

import {
  callPlannerAdvisor,
  mapLegacyAdvisorUiContext,
  PlannerAdvisorClientError,
  type LegacyAdvisorUiContext,
  type PlannerAdvisorMessage,
} from "@/lib/ai/mastra/client";

export type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

/** @deprecated Use `LegacyAdvisorUiContext` from `@/lib/ai/mastra/client`. */
export type AiAdvisorContext = LegacyAdvisorUiContext;

interface UseAiAdvisorOptions {
  context?: LegacyAdvisorUiContext;
}

export function useAiAdvisor(options: UseAiAdvisorOptions = {}) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abort any in-flight request on unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      // Cancel any previous in-flight request before starting a new one.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMsg: AiMessage = {
        id: `msg-${Date.now()}-user`,
        role: "user",
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const chatHistory: PlannerAdvisorMessage[] = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const result = await callPlannerAdvisor(
          {
            mode: "chat",
            messages: chatHistory,
            context: mapLegacyAdvisorUiContext(options.context),
          },
          { signal: controller.signal },
        );

        // Ignore results from an aborted (superseded or unmounted) request.
        if (controller.signal.aborted) {
          return;
        }

        const reply = result.content.trim().length > 0 ? result.content : null;
        if (!reply) {
          throw new PlannerAdvisorClientError("Advisor returned empty content");
        }

        const assistantMsg: AiMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: "assistant",
          content: reply,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [messages, options.context],
  );

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
