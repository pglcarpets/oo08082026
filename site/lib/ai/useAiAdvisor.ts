"use client";

import { useState, useCallback } from "react";

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

  const sendMessage = useCallback(
    async (content: string) => {
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

        const result = await callPlannerAdvisor({
          mode: "chat",
          messages: chatHistory,
          context: mapLegacyAdvisorUiContext(options.context),
        });

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
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, options.context],
  );

  const clearMessages = useCallback(() => {
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
