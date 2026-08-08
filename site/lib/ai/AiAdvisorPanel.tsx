"use client";

import { useState, useRef, useEffect } from "react";
import { PaperPlaneTilt as Send, X, Sparkle as Sparkles, CircleNotch as Loader2, Trash as Trash2 } from "@phosphor-icons/react";
import { useAiAdvisor } from "./useAiAdvisor";
import type { AiAdvisorContext } from "./useAiAdvisor";

interface AiAdvisorPanelProps {
  context?: AiAdvisorContext;
  /** Position of the panel */
  position?: "bottom-right" | "right-sidebar";
}

const QUICK_PROMPTS = [
  "Suggest a layout for 8 people in 600 sq ft",
  "Best desk arrangement for collaboration",
  "How to plan zones in an open office?",
  "Recommend furniture for a meeting room",
];

export function AiAdvisorPanel({
  context,
  position = "bottom-right",
}: AiAdvisorPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, isLoading, error, sendMessage, clearMessages } =
    useAiAdvisor({ context });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) {return;}
    setInput("");
    sendMessage(text);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed z-50 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg transition-all hover:scale-105 ${
          position === "bottom-right" ? "bottom-6 right-6" : "bottom-6 right-80"
        }`}
        style={{
          background: "var(--color-primary, var(--color-ecru-500))",
          color: "white",
        }}
        aria-label="Open AI Layout Advisor"
        title="AI Layout Advisor — get furniture placement suggestions"
      >
        <Sparkles size={18} />
        <span className="text-sm font-medium hidden sm:inline">AI Advisor</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed z-50 flex flex-col rounded-xl border shadow-2xl overflow-hidden ${
        position === "bottom-right"
          ? "bottom-6 right-6 w-[23.75rem] h-[32.5rem] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]"
          : "bottom-6 right-80 w-[22.5rem] h-[30rem] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]"
      }`}
      style={{
        background: "var(--surface-page, var(--color-white-50))",
        borderColor: "var(--border-soft, var(--color-bronze-100))",
      }}
      role="dialog"
      aria-label="AI Layout Advisor"
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{
          borderColor: "var(--border-soft, var(--color-bronze-100))",
          background: "var(--surface-soft, var(--color-ecru-50))",
        }}
      >
        <Sparkles size={16} style={{ color: "var(--color-primary, var(--color-ecru-500))" }} />
        <span className="text-sm font-semibold flex-1" style={{ color: "var(--text-strong, var(--color-ecru-950))" }}>
          AI Layout Advisor
        </span>
        <button
          onClick={clearMessages}
          className="p-1 rounded hover:bg-black/5 transition-colors"
          title="Clear conversation"
          aria-label="Clear conversation"
        >
          <Trash2 size={14} style={{ color: "var(--text-muted, var(--color-bronze-700))" }} />
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded hover:bg-black/5 transition-colors"
          aria-label="Close AI Advisor"
        >
          <X size={16} style={{ color: "var(--text-muted, var(--color-bronze-700))" }} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: "var(--text-muted, var(--color-bronze-700))" }}>
              Ask me about office layouts, furniture placement, ergonomics, or zone planning.
            </p>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="w-full text-start text-xs px-3 py-2 rounded-lg border transition-colors hover:border-[var(--color-primary)]"
                  style={{
                    borderColor: "var(--border-soft, var(--color-bronze-100))",
                    color: "var(--text-body, var(--color-bronze-900))",
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
                }`}
                style={{
                  background:
                    msg.role === "user"
                      ? "var(--color-primary, var(--color-ecru-500))"
                      : "var(--surface-soft, var(--color-bronze-50))",
                  color:
                    msg.role === "user"
                      ? "white"
                      : "var(--text-body, var(--color-bronze-900))",
                }}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted, var(--color-bronze-700))" }}>
            <Loader2 size={14} className="animate-spin" />
            Thinking...
          </div>
        )}
        {error && (
          <div className="text-xs px-3 py-2 rounded-lg bg-danger-soft text-danger">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-3 py-3 border-t flex gap-2"
        style={{ borderColor: "var(--border-soft, var(--color-bronze-100))" }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about layout, furniture, zones..."
          disabled={isLoading}
          className="flex-1 text-xs px-3 py-2 rounded-lg border outline-none transition-colors focus:border-[var(--color-primary)]"
          style={{
            borderColor: "var(--border-soft, var(--color-bronze-100))",
            background: "var(--surface-page, var(--color-white-50))",
            color: "var(--text-body, var(--color-bronze-900))",
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2 rounded-lg transition-colors disabled:opacity-40"
          style={{ background: "var(--color-primary, var(--color-ecru-500))", color: "white" }}
          aria-label="Send message"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

// Floating trigger for pages that want a minimal footprint
export function AiAdvisorTrigger({ context }: { context?: AiAdvisorContext }) {
  return <AiAdvisorPanel context={context} position="bottom-right" />;
}
