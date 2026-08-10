"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Robot as Bot, CheckCircle as CheckCircle2, CircleNotch as Loader2, ChatText as MessageSquareText, PaperPlaneTilt as Send, Sparkle as Sparkles, MagicWand as Wand2, X } from "@phosphor-icons/react";
import { hasConsentChoice } from "@/lib/consent";
import { sanitizeDisplayText } from "@/lib/displayText";
import { getCatalogProductHref } from '@/lib/catalog/site/categories';
import {
  type AdvisorRecommendation,
  type AdvisorResult,
  type AdvisorStreamEvent,
} from '@/features/site/advisor/aiAdvisor';
import {
  AI_ADVISOR_COPY,
  AI_ASSISTANT_REFINERS,
  AI_ASSISTANT_STARTERS,
  AI_ASSISTANT_WELCOME_MESSAGE,
  AI_CHATBOT_COPY,
  GUIDED_PLANNER_COPY,
  MOBILE_ASSISTANT_COPY,
} from "@/features/site/data/assistant";
import { browserApiFetch } from "@/lib/api/browserApi";
import { useAction } from "next-safe-action/hooks";
import { submitContactAction } from "@/features/site/contact/submitContactAction";
import type { ContactFormValues } from "@/features/site/contact/customerQuerySchema";

type UseCase =
  | "workstations"
  | "seating"
  | "meeting"
  | "storage"
  | "acoustics"
  | "reception"
  | "cafeteria"
  | "full-office"
  | "other";

type Timeline = "immediately" | "one-to-three" | "three-to-six" | "exploring";

type GuidedState = {
  useCase: UseCase | "";
  seats: string;
  company: string;
  city: string;
  timeline: Timeline | "";
  budget: string;
  notes: string;
  name: string;
  email: string;
  phone: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  result?: AdvisorResult;
  streaming?: boolean;
};

const INITIAL_GUIDED: GuidedState = {
  useCase: "",
  seats: "",
  company: "",
  city: "",
  timeline: "",
  budget: "",
  notes: "",
  name: "",
  email: "",
  phone: "",
};

const USE_CASE_LABEL: Record<UseCase, string> = {
  workstations: "Workstations",
  seating: "Seating",
  meeting: "Meeting and conference",
  storage: "Storage",
  acoustics: "Acoustics",
  reception: "Reception and lounge",
  cafeteria: "Cafeteria and breakout",
  "full-office": "Full office",
  other: "Other",
};

const TIMELINE_LABEL: Record<Timeline, string> = {
  immediately: "Immediate (0-4 weeks)",
  "one-to-three": "1-3 months",
  "three-to-six": "3-6 months",
  exploring: "Exploring options",
};

const ASSISTANT_FLOATING_PRIMARY_CLASS =
  "assistant-floating-primary assistant-focus-ring";
const ASSISTANT_LAUNCHER_PANEL_GRID_CLASS = "assistant-launcher-panel-grid";
const ASSISTANT_MODAL_GUIDED_SHEET_CLASS =
  "assistant-modal-sheet assistant-sheet assistant-sheet--guided";
const ASSISTANT_MODAL_CHAT_SHEET_CLASS =
  "assistant-modal-sheet assistant-sheet assistant-sheet--chat";
const ASSISTANT_CHIP_GROUP_CLASS = "assistant-chip-group";
const ASSISTANT_CHIP_BASE_CLASS = "assistant-chip assistant-focus-ring";
const ASSISTANT_CHIP_FLEX_CLASS = "assistant-chip--flex";
const ASSISTANT_CHIP_SELECTED_CLASS = "assistant-chip--selected";
const ASSISTANT_CHIP_IDLE_CLASS = "assistant-chip--idle";
const ASSISTANT_MODAL_ACTION_ROW_CLASS = "assistant-modal-action-row";
const ASSISTANT_TEXT_ACTION_CLASS =
  "assistant-text-action assistant-text-button assistant-focus-ring";
const ASSISTANT_TEXT_ACTION_MUTED_CLASS =
  "assistant-text-action assistant-text-action--muted assistant-text-button assistant-focus-ring";
const ASSISTANT_CHOICE_BUTTON_CLASS =
  "assistant-choice-button assistant-focus-ring";
const ASSISTANT_PRIMARY_ACTION_CLASS =
  "assistant-primary-action assistant-focus-ring";
const ASSISTANT_PRIMARY_COMPACT_ACTION_CLASS =
  "assistant-primary-action assistant-primary-action--compact assistant-focus-ring";
const ASSISTANT_FIELD_CLASS = "assistant-field";
const ASSISTANT_TEXTAREA_FIELD_CLASS = "assistant-field assistant-field--textarea";
const ASSISTANT_SURPRISE_ACTION_CLASS =
  "assistant-surprise-action assistant-focus-ring";
const ASSISTANT_CHAT_FOOTER_CLASS = "assistant-chat-footer";
const ASSISTANT_CHAT_FORM_CLASS = "assistant-chat-form";
const ASSISTANT_REFINER_BAR_CLASS = "assistant-refiner-bar";

function assistantChipClass(isSelected: boolean, flex = false) {
  return [
    ASSISTANT_CHIP_BASE_CLASS,
    flex ? ASSISTANT_CHIP_FLEX_CLASS : "",
    isSelected ? ASSISTANT_CHIP_SELECTED_CLASS : ASSISTANT_CHIP_IDLE_CLASS,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildGuidedSummary(guided: GuidedState) {
  const lines = ["Guided planner intake"];
  if (guided.useCase) {lines.push(`Use case: ${USE_CASE_LABEL[guided.useCase]}`);}
  if (guided.seats.trim()) {lines.push(`Seats/units: ${guided.seats.trim()}`);}
  if (guided.company.trim()) {lines.push(`Company: ${guided.company.trim()}`);}
  if (guided.city.trim()) {lines.push(`City: ${guided.city.trim()}`);}
  if (guided.timeline) {lines.push(`Timeline: ${TIMELINE_LABEL[guided.timeline]}`);}
  if (guided.budget.trim()) {lines.push(`Budget: ${guided.budget.trim()}`);}
  if (guided.notes.trim()) {lines.push(`Notes: ${guided.notes.trim()}`);}
  return lines.join("\n");
}

function recommendationHref(rec: AdvisorRecommendation) {
  const key = rec.productUrlKey || rec.productId || "";
  return getCatalogProductHref(String(rec.category || "").trim().toLowerCase(), key);
}

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function extractSummaryFromStream(raw: string): string {
  const match = raw.match(/"summary"\s*:\s*"/);
  if (!match || match.index === undefined) {return "";}

  let value = "";
  let escaped = false;

  for (let index = match.index + match[0].length; index < raw.length; index += 1) {
    const character = raw[index];
    if (character === "\"" && !escaped) {break;}
    value += character;
    if (escaped) {
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    }
  }

  return value
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, "\"")
    .replace(/\\\\/g, "\\")
    .trim();
}

export function UnifiedAssistant() {
  const pathname = usePathname();
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileLauncherOpen, setMobileLauncherOpen] = useState(false);
  const [consentChosen, setConsentChosen] = useState(true);

  const [guidedStep, setGuidedStep] = useState(0);
  const [guided, setGuided] = useState<GuidedState>(INITIAL_GUIDED);
  const [guidedSaving, setGuidedSaving] = useState(false);
  const [guidedError, setGuidedError] = useState("");
  const [guidedSubmittedId, setGuidedSubmittedId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: generateId("assistant"),
      role: "assistant",
      text: AI_ASSISTANT_WELCOME_MESSAGE,
    },
  ]);

  // Both sheets render as role="dialog" aria-modal="true", so Escape must dismiss them.
  // Without this a keyboard user who opens the assistant has no way out except finding
  // the close button by pointer — the modal traps them.
  useEffect(() => {
    if (!chatOpen && !guidedOpen) {
      return;
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.stopPropagation();
      // Chat sits above guided when both are open, so it closes first.
      if (chatOpen) {
        setChatOpen(false);
      } else {
        setGuidedOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [chatOpen, guidedOpen]);

  useEffect(() => {
    function initConsent() {
      setConsentChosen(hasConsentChoice());
    }
    initConsent();

    const handleGuidedOpen = (event: Event) => {
      const custom = event as CustomEvent<{ tab?: "guided" | "ai" }>;
      if (custom.detail?.tab === "ai") {
        setChatOpen(true);
      } else {
        setGuidedOpen(true);
      }
    };
    const handleChatbotOpen = () => setChatOpen(true);
    const handleConsent = () => setConsentChosen(true);

    window.addEventListener("oando-assistant:open", handleGuidedOpen as EventListener);
    window.addEventListener("oando-chatbot:open", handleChatbotOpen as EventListener);
    window.addEventListener("oando-cookie-consent", handleConsent as EventListener);
    return () => {
      window.removeEventListener("oando-assistant:open", handleGuidedOpen as EventListener);
      window.removeEventListener("oando-chatbot:open", handleChatbotOpen as EventListener);
      window.removeEventListener("oando-cookie-consent", handleConsent as EventListener);
    };
  }, []);

  const stepValid = useMemo(() => {
    if (guidedStep === 0) {return Boolean(guided.useCase && guided.seats.trim());}
    if (guidedStep === 1) {return Boolean(guided.city.trim() && guided.timeline);}
    return Boolean(guided.name.trim() && guided.email.trim());
  }, [guided, guidedStep]);

  const guidedSummary = useMemo(() => buildGuidedSummary(guided), [guided]);
  const lastUserQuery = useMemo(() => {
    const userMessages = chatMessages.filter((message) => message.role === "user");
    return userMessages.length > 0 ? userMessages[userMessages.length - 1].text : "";
  }, [chatMessages]);

  const { executeAsync: executeContactAction } = useAction(submitContactAction);

  function updateChatMessage(
    messageId: string,
    updater: (message: ChatMessage) => ChatMessage,
  ) {
    setChatMessages((prev) =>
      prev.map((message) => (message.id === messageId ? updater(message) : message)),
    );
  }

  function resetChatbot() {
    setQuery("");
    setAiError("");
    setChatMessages([
      {
        id: generateId("assistant"),
        role: "assistant",
        text: AI_ASSISTANT_WELCOME_MESSAGE,
      },
    ]);
  }

  async function completeGuidedFlow() {
    if (guidedSaving || guidedSubmittedId) {return;}
    setGuidedSaving(true);
    setGuidedError("");

    const payload: ContactFormValues = {
      name: guided.name,
      company: guided.company,
      email: guided.email,
      phone: guided.phone,
      preferredContact: guided.phone.trim() ? "phone" : "email",
      message: guidedSummary,
      website: "",
      consent: true,
      requirement: guided.useCase || undefined,
      budget: guided.budget || undefined,
      timeline: guided.timeline ? TIMELINE_LABEL[guided.timeline] : undefined,
      source: "homepage-chatbot",
      sourcePath: pathname,
    };

    try {
      const actionResult = await executeContactAction(payload);

      if (actionResult?.serverError) {
        setGuidedError(actionResult.serverError);
        return;
      }

      if (actionResult?.validationErrors) {
        setGuidedError(GUIDED_PLANNER_COPY.errors.saveFailed);
        return;
      }

      if (!actionResult?.data?.queryId) {
        setGuidedError(GUIDED_PLANNER_COPY.errors.saveFailed);
        return;
      }

      setGuidedSubmittedId(actionResult.data.queryId);
    } catch {
      setGuidedError(GUIDED_PLANNER_COPY.errors.network);
    } finally {
      setGuidedSaving(false);
    }
  }

  function handleGuidedNext() {
    if (!stepValid || guidedSaving) {return;}
    if (guidedStep < 2) {
      setGuidedStep((prev) => prev + 1);
      return;
    }
    void completeGuidedFlow();
  }

  function resetGuided() {
    setGuided(INITIAL_GUIDED);
    setGuidedStep(0);
    setGuidedError("");
    setGuidedSubmittedId(null);
  }

  async function submitAiQuery(inputQuery: string) {
    const trimmed = inputQuery.trim();
    if (!trimmed || aiLoading) {return;}

    const assistantMessageId = generateId("assistant");
    setAiLoading(true);
    setAiError("");
    setQuery("");
    setChatMessages((prev) => [
      ...prev,
      {
        id: generateId("user"),
        role: "user",
        text: trimmed,
      },
      {
        id: assistantMessageId,
        role: "assistant",
        text: "",
        streaming: true,
      },
    ]);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10_000);

    try {
      // browserApiFetch attaches CSRF (route requires requireCsrf) and retries on reject.
      const response = await browserApiFetch("/api/ai-advisor/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          query: trimmed,
          context: {
            source: "global",
            sourcePath: pathname,
          },
          stream: true,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/x-ndjson") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let raw = "";
        let finalResult: AdvisorResult | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {break;}

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) {continue;}
            const event = JSON.parse(line) as AdvisorStreamEvent;

            if (event.type === "delta") {
              raw += event.text;
              const streamedSummary =
                extractSummaryFromStream(raw) ||
                (raw.trimStart().startsWith("{") ? "" : raw.trim());
              if (streamedSummary) {
                updateChatMessage(assistantMessageId, (message) => ({
                  ...message,
                  text: streamedSummary,
                  streaming: true,
                }));
              }
            }

            if (event.type === "result") {
              finalResult = event.result;
              updateChatMessage(assistantMessageId, (message) => ({
                ...message,
                text: event.result.summary || AI_CHATBOT_COPY.summaryFallback,
                result: event.result,
                streaming: false,
              }));
            }

            if (event.type === "error") {
              throw new Error(event.message);
            }
          }
        }

        if (!finalResult) {
          throw new Error(AI_CHATBOT_COPY.advisorUnavailable);
        }

        return;
      }

      const json = (await response.json()) as AdvisorResult & { error?: string };
      if (!response.ok || !json.recommendations) {
        throw new Error(json.error || AI_CHATBOT_COPY.advisorUnavailable);
      }

      updateChatMessage(assistantMessageId, (message) => ({
        ...message,
        text: json.summary || AI_CHATBOT_COPY.summaryFallback,
        result: {
          recommendations: json.recommendations,
          totalBudget: json.totalBudget,
          summary: json.summary,
          nextActions: json.nextActions,
          warnings: json.warnings,
          pricingMode: json.pricingMode,
          fallbackUsed: json.fallbackUsed,
        },
        streaming: false,
      }));
    } catch (error) {
      const errorText =
        error instanceof DOMException && error.name === "AbortError"
          ? "The advisor timed out after 10 seconds. Please try a shorter prompt."
          : error instanceof Error && error.message
            ? error.message
            : AI_CHATBOT_COPY.advisorNetwork;

      setAiError(errorText);
      updateChatMessage(assistantMessageId, (message) => ({
        ...message,
        text: `${AI_CHATBOT_COPY.networkPrefix} ${errorText}`,
        streaming: false,
      }));
    } finally {
      window.clearTimeout(timeoutId);
      setAiLoading(false);
    }
  }

  async function handleAiSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await submitAiQuery(query);
  }

  function applyStarter(text: string) {
    setAiError("");
    void submitAiQuery(text);
  }

  function useSurprisePrompt() {
    const index = Math.floor(Math.random() * AI_ASSISTANT_STARTERS.length);
    applyStarter(AI_ASSISTANT_STARTERS[index]);
  }

  function handleAssistantLauncherClick() {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches) {
      setMobileLauncherOpen((prev) => !prev);
      return;
    }
    setChatOpen(true);
  }

  const suppressFloatingLauncher =
    pathname.startsWith("/products") ||
    pathname === "/compare";
  const mobileFabAnchor = consentChosen
    ? "site-fab-anchor site-fab-anchor--left site-fab-anchor--bottom"
    : "site-fab-anchor site-fab-anchor--left site-fab-anchor--bottom-raised";
  const mobilePanelAnchor = consentChosen
    ? "site-fab-anchor site-fab-anchor--inset-x site-fab-anchor--panel"
    : "site-fab-anchor site-fab-anchor--inset-x site-fab-anchor--panel-raised";
  const desktopFabAnchor = consentChosen
    ? "site-fab-anchor site-fab-anchor--left site-fab-anchor--bottom"
    : "site-fab-anchor site-fab-anchor--left site-fab-anchor--bottom-raised";

  return (
    <>
      <div className="sm:hidden">
        {!suppressFloatingLauncher ? (
          <button
            type="button"
            onClick={handleAssistantLauncherClick}
            aria-label={MOBILE_ASSISTANT_COPY.launcher}
            aria-expanded={mobileLauncherOpen}
            className={`site-fab-launcher site-fab-launcher--assistant ${mobileFabAnchor} ${ASSISTANT_FLOATING_PRIMARY_CLASS}`}
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}

        {mobileLauncherOpen && !suppressFloatingLauncher ? (
          <div className={`${mobilePanelAnchor} assistant-launcher-panel`}>
            <div className={ASSISTANT_LAUNCHER_PANEL_GRID_CLASS}>
              <button
                type="button"
                onClick={() => {
                  setMobileLauncherOpen(false);
                  setGuidedOpen(true);
                }}
                className="assistant-launcher-action assistant-launcher-action--dark assistant-focus-ring"
              >
                <MessageSquareText className="h-4 w-4" />
                {MOBILE_ASSISTANT_COPY.planner}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileLauncherOpen(false);
                  setChatOpen(true);
                }}
                className="assistant-launcher-action assistant-launcher-action--primary assistant-focus-ring"
              >
                <Sparkles className="h-4 w-4" />
                {MOBILE_ASSISTANT_COPY.chatbot}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="hidden sm:block">
        {!suppressFloatingLauncher ? (
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            aria-label="Open AI chatbot"
            className={`site-fab-launcher site-fab-launcher--assistant ${desktopFabAnchor} ${ASSISTANT_FLOATING_PRIMARY_CLASS}`}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span className="site-fab-launcher__label hidden xl:inline">
              {AI_CHATBOT_COPY.title}
            </span>
          </button>
        ) : null}
      </div>

      {guidedOpen ? (
        <div
          className="assistant-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Guided planner"
        >
          <div className={ASSISTANT_MODAL_GUIDED_SHEET_CLASS}>
            <div className="assistant-sheet__header">
              <div className="assistant-sheet__brand">
                <span className="assistant-sheet__icon assistant-sheet__icon--dark">
                  <Bot className="h-5 w-5" />
                </span>
                <div className="assistant-sheet__brand-text">
                  <p className="assistant-sheet__title">{GUIDED_PLANNER_COPY.title}</p>
                  <p className="assistant-sheet__subtitle">{GUIDED_PLANNER_COPY.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuidedOpen(false)}
                className="assistant-sheet__close assistant-focus-ring"
                aria-label="Close guided planner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="assistant-log">
              {guidedSubmittedId ? (
                <div className="rounded-xl border border-accent bg-success-soft p-4">
                  <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    {GUIDED_PLANNER_COPY.submittedTitle}
                  </p>
                  <p className="text-sm text-body">Reference: {guidedSubmittedId}</p>
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setGuidedOpen(false);
                        setChatOpen(true);
                      }}
                      className={ASSISTANT_TEXT_ACTION_CLASS}
                    >
                      {GUIDED_PLANNER_COPY.submittedFollowUp}
                    </button>
                    <button
                      type="button"
                      onClick={resetGuided}
                      className={ASSISTANT_TEXT_ACTION_MUTED_CLASS}
                    >
                      {GUIDED_PLANNER_COPY.submittedReset}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {guidedStep === 0 ? (
                    <>
                      <p className="text-sm text-body">{GUIDED_PLANNER_COPY.stepOneIntro}</p>
                      <div className={ASSISTANT_CHIP_GROUP_CLASS}>
                        {(Object.keys(USE_CASE_LABEL) as UseCase[]).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setGuided({ ...guided, useCase: key })}
                            className={assistantChipClass(guided.useCase === key)}
                          >
                            {USE_CASE_LABEL[key]}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder={GUIDED_PLANNER_COPY.placeholders.seats}
                        value={guided.seats}
                        onChange={(event) => setGuided({ ...guided, seats: event.target.value })}
                        className={ASSISTANT_FIELD_CLASS}
                      />
                    </>
                  ) : null}

                  {guidedStep === 1 ? (
                    <>
                      <p className="text-sm text-body">{GUIDED_PLANNER_COPY.stepTwoIntro}</p>
                      <input
                        type="text"
                        placeholder={GUIDED_PLANNER_COPY.placeholders.company}
                        value={guided.company}
                        onChange={(event) => setGuided({ ...guided, company: event.target.value })}
                        className={ASSISTANT_FIELD_CLASS}
                      />
                      <input
                        type="text"
                        placeholder={GUIDED_PLANNER_COPY.placeholders.city}
                        value={guided.city}
                        onChange={(event) => setGuided({ ...guided, city: event.target.value })}
                        className={ASSISTANT_FIELD_CLASS}
                      />
                      <div className={ASSISTANT_CHIP_GROUP_CLASS}>
                        {(Object.keys(TIMELINE_LABEL) as Timeline[]).map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setGuided({ ...guided, timeline: key })}
                            className={assistantChipClass(guided.timeline === key)}
                          >
                            {TIMELINE_LABEL[key]}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder={GUIDED_PLANNER_COPY.placeholders.budget}
                        value={guided.budget}
                        onChange={(event) => setGuided({ ...guided, budget: event.target.value })}
                        className={ASSISTANT_FIELD_CLASS}
                      />
                      <textarea
                        rows={3}
                        placeholder={GUIDED_PLANNER_COPY.placeholders.notes}
                        value={guided.notes}
                        onChange={(event) => setGuided({ ...guided, notes: event.target.value })}
                        className={ASSISTANT_TEXTAREA_FIELD_CLASS}
                      />
                    </>
                  ) : null}

                  {guidedStep === 2 ? (
                    <>
                      <p className="text-sm text-body">{GUIDED_PLANNER_COPY.stepThreeIntro}</p>
                      <input
                        type="text"
                        placeholder={GUIDED_PLANNER_COPY.placeholders.name}
                        value={guided.name}
                        onChange={(event) => setGuided({ ...guided, name: event.target.value })}
                        className={ASSISTANT_FIELD_CLASS}
                      />
                      <input
                        type="email"
                        placeholder={GUIDED_PLANNER_COPY.placeholders.email}
                        value={guided.email}
                        onChange={(event) => setGuided({ ...guided, email: event.target.value })}
                        className={ASSISTANT_FIELD_CLASS}
                      />
                      <input
                        type="tel"
                        placeholder={GUIDED_PLANNER_COPY.placeholders.phone}
                        value={guided.phone}
                        onChange={(event) => setGuided({ ...guided, phone: event.target.value })}
                        className={ASSISTANT_FIELD_CLASS}
                      />
                    </>
                  ) : null}

                  {guidedError ? <p className="text-sm text-danger" aria-live="polite">{guidedError}</p> : null}

                  <div className={ASSISTANT_MODAL_ACTION_ROW_CLASS}>
                    <button
                      type="button"
                      onClick={() => setGuidedStep((prev) => (prev > 0 ? prev - 1 : prev))}
                      className={ASSISTANT_TEXT_ACTION_MUTED_CLASS}
                      disabled={guidedStep === 0 || guidedSaving}
                    >
                      {GUIDED_PLANNER_COPY.back}
                    </button>
                    <button
                      type="button"
                      onClick={handleGuidedNext}
                      disabled={!stepValid || guidedSaving}
                      className={ASSISTANT_PRIMARY_ACTION_CLASS}
                    >
                      {guidedSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {GUIDED_PLANNER_COPY.saving}
                        </>
                      ) : guidedStep === 2 ? (
                        <>
                          {GUIDED_PLANNER_COPY.finish}
                          <CheckCircle2 className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          {GUIDED_PLANNER_COPY.continue}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {chatOpen ? (
        <div
          className="assistant-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="AI chatbot"
        >
          <div className={ASSISTANT_MODAL_CHAT_SHEET_CLASS}>
            <div className="assistant-sheet__header">
              <div className="assistant-sheet__brand">
                <span className="assistant-sheet__icon assistant-sheet__icon--primary">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div className="assistant-sheet__brand-text">
                  <p className="assistant-sheet__title">{AI_CHATBOT_COPY.title}</p>
                  <p className="assistant-sheet__subtitle">{AI_CHATBOT_COPY.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="assistant-sheet__close assistant-focus-ring"
                aria-label="Close AI chatbot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="assistant-toolbar">
              <div className={ASSISTANT_CHIP_GROUP_CLASS}>
                {AI_ASSISTANT_STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => applyStarter(starter)}
                    className={ASSISTANT_CHOICE_BUTTON_CLASS}
                  >
                    {starter}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={useSurprisePrompt}
                className={ASSISTANT_SURPRISE_ACTION_CLASS}
              >
                <Wand2 className="h-3.5 w-3.5" />
                {AI_ADVISOR_COPY.surpriseLabel}
              </button>
            </div>

            <div
              className="assistant-log space-y-4"
              role="log"
              aria-live="polite"
              aria-relevant="additions text"
              aria-label="Assistant conversation"
            >
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`assistant-message-row ${
                    message.role === "user"
                      ? "assistant-message-row--user"
                      : "assistant-message-row--assistant"
                  }`}
                >
                  <div
                    className={`assistant-message ${
                      message.role === "user"
                        ? "assistant-message--user"
                        : "assistant-message--assistant"
                    }`}
                  >
                    {message.streaming && !message.text && !message.result ? (
                      <div className="assistant-message__skeleton space-y-2" aria-hidden="true">
                        <div className="assistant-message__skeleton-line assistant-message__skeleton-line--short" />
                        <div className="assistant-message__skeleton-line assistant-message__skeleton-line--medium" />
                        <div className="assistant-message__skeleton-line assistant-message__skeleton-line--long" />
                      </div>
                    ) : (
                      <p>{sanitizeDisplayText(message.text)}</p>
                    )}

                    {message.streaming && message.text && !message.result ? (
                      <p className="assistant-message__streaming">
                        Streaming reply
                      </p>
                    ) : null}

                    {message.result ? (
                      <div className="mt-3 space-y-3">
                        <div className="assistant-result-card">
                          <p className="assistant-result-title">
                            {message.result.pricingMode === "band"
                              ? AI_CHATBOT_COPY.bandLabel
                              : AI_CHATBOT_COPY.totalLabel}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-heading">
                            {message.result.totalBudget}
                          </p>
                        </div>

                        {message.result.warnings?.length ? (
                          <div className="assistant-result-card assistant-result-card--warning">
                            <p className="assistant-result-title assistant-result-title--warning">
                              {AI_CHATBOT_COPY.warningsTitle}
                            </p>
                            <div className="assistant-result-body text-amber-900">
                              {message.result.warnings.map((warning) => (
                                <p key={warning}>{warning}</p>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {message.result.recommendations.map((item) => (
                          <div
                            key={`${message.id}-${item.productId}`}
                            className="assistant-result-card"
                          >
                            <div className="mb-1 flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-heading">
                                {item.productName}
                              </p>
                              <Link
                                href={recommendationHref(item)}
                                className="assistant-text-button assistant-focus-ring assistant-result-link"
                              >
                                View
                              </Link>
                            </div>
                            <p className="text-xs text-body">{item.why}</p>
                          </div>
                        ))}

                        {message.result.nextActions?.length ? (
                          <div className="assistant-result-card">
                            <p className="assistant-result-title">
                              {AI_CHATBOT_COPY.nextActionsTitle}
                            </p>
                            <div className="assistant-result-body text-body">
                              {message.result.nextActions.map((action) => (
                                <p key={action}>{action}</p>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className={ASSISTANT_CHAT_FOOTER_CLASS}>
              {lastUserQuery ? (
                <div className={ASSISTANT_REFINER_BAR_CLASS}>
                  {AI_ASSISTANT_REFINERS.map((refiner) => (
                    <button
                      key={refiner.label}
                      type="button"
                      onClick={() => void submitAiQuery(refiner.apply(lastUserQuery))}
                      className={ASSISTANT_CHOICE_BUTTON_CLASS}
                    >
                      {refiner.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setChatOpen(false);
                      setGuidedOpen(true);
                    }}
                    className={ASSISTANT_CHOICE_BUTTON_CLASS}
                  >
                    {AI_CHATBOT_COPY.switchToPlanner}
                  </button>
                  <button
                    type="button"
                    onClick={resetChatbot}
                    className={ASSISTANT_CHOICE_BUTTON_CLASS}
                  >
                    {AI_CHATBOT_COPY.reset}
                  </button>
                </div>
              ) : null}

              <form onSubmit={handleAiSubmit} className={ASSISTANT_CHAT_FORM_CLASS}>
                <textarea
                  rows={2}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    // Enter without Shift submits (conventional chat UX).
                    // Shift+Enter inserts a newline as usual.
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleAiSubmit();
                    }
                  }}
                  placeholder={AI_CHATBOT_COPY.placeholder}
                  className={`${ASSISTANT_TEXTAREA_FIELD_CLASS} min-h-11 flex-1`}
                />
                <button
                  type="submit"
                  disabled={!query.trim() || aiLoading}
                  className={ASSISTANT_PRIMARY_COMPACT_ACTION_CLASS}
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {AI_CHATBOT_COPY.send}
                </button>
              </form>
              {aiError ? <p className="mt-2 text-xs text-danger" aria-live="polite">{aiError}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
