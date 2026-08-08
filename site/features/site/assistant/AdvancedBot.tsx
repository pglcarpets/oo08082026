"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatCircle as MessageCircle, ArrowRight, X } from "@phosphor-icons/react";
import { buildMailtoHref, buildWhatsAppHref } from "@/features/site/data/contact";

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

type ContactMethod = "whatsapp" | "email";

type Option<T extends string> = {
  value: T;
  label: string;
};

interface BotState {
  useCase: UseCase | null;
  companyName: string;
  seats: string;
  city: string;
  budget: string;
  timeline: Timeline | null;
  contactMethod: ContactMethod | null;
  contactValue: string;
  notes: string;
}

const initialState: BotState = {
  useCase: null,
  companyName: "",
  seats: "",
  city: "",
  budget: "",
  timeline: null,
  contactMethod: null,
  contactValue: "",
  notes: "",
};

const useCaseOptions: Array<Option<UseCase>> = [
  { value: "workstations", label: "Workstations" },
  { value: "seating", label: "Seating" },
  { value: "meeting", label: "Meeting tables" },
  { value: "storage", label: "Storage" },
  { value: "acoustics", label: "Acoustics" },
  { value: "reception", label: "Reception & lounge" },
  { value: "cafeteria", label: "Cafeteria" },
  { value: "full-office", label: "Full office" },
  { value: "other", label: "Other" },
];

const timelineOptions: Array<Option<Timeline>> = [
  { value: "immediately", label: "ASAP (0–4 weeks)" },
  { value: "one-to-three", label: "1–3 months" },
  { value: "three-to-six", label: "3–6 months" },
  { value: "exploring", label: "Just exploring" },
];

const contactMethodOptions: Array<Option<ContactMethod>> = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

const useCaseSummaryLabels: Record<UseCase, string> = {
  workstations: "Workstations",
  seating: "Seating",
  meeting: "Meeting and conference",
  storage: "Storage",
  acoustics: "Acoustic solutions",
  reception: "Reception and lounge",
  cafeteria: "Cafeteria and breakout",
  "full-office": "Full office fitout",
  other: "Other",
};

const timelineSummaryLabels: Record<Timeline, string> = {
  immediately: "Immediate (0–4 weeks)",
  "one-to-three": "1–3 months",
  "three-to-six": "3–6 months",
  exploring: "Just exploring / no fixed date",
};

function getChipClass(active: boolean, flex = false) {
  return [
    "assistant-chip assistant-focus-ring",
    flex ? "assistant-chip--flex" : "",
    active ? "assistant-chip--selected" : "assistant-chip--idle-hover",
  ]
    .filter(Boolean)
    .join(" ");
}

export function AdvancedBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [state, setState] = useState<BotState>(initialState);

  const canGoNext = useMemo(() => {
    if (step === 0) {return state.useCase !== null;}
    if (step === 1) {return state.seats.trim().length > 0;}
    if (step === 2)
      {return (
        state.companyName.trim().length > 0 &&
        state.city.trim().length > 0 &&
        state.timeline !== null
      );}
    if (step === 3)
      {return (
        state.contactMethod !== null && state.contactValue.trim().length > 0
      );}
    return true;
  }, [step, state]);

  const summary = useMemo(() => {
    const lines: string[] = [];
    lines.push("Enquiry for One&Only via Website Bot");
    if (state.useCase) {
      lines.push(
        `Product family / project type: ${useCaseSummaryLabels[state.useCase]}`,
      );
    }
    if (state.companyName.trim()) {
      lines.push(`Company: ${state.companyName.trim()}`);
    }
    if (state.seats.trim())
      {lines.push(`Approx seats / units: ${state.seats.trim()}`);}
    if (state.city.trim()) {lines.push(`City: ${state.city.trim()}`);}
    if (state.timeline) {
      lines.push(`Timeline: ${timelineSummaryLabels[state.timeline]}`);
    }
    if (state.budget.trim()) {lines.push(`Budget range: ${state.budget.trim()}`);}
    if (state.contactMethod && state.contactValue.trim()) {
      const label = state.contactMethod === "whatsapp" ? "WhatsApp" : "Email";
      lines.push(`${label}: ${state.contactValue.trim()}`);
    }
    if (state.notes.trim()) {lines.push(`Notes: ${state.notes.trim()}`);}
    return lines.join("\n");
  }, [state]);

  const whatsappUrl = useMemo(() => {
    return buildWhatsAppHref(
      `One&Only workspace enquiry via website bot\n\n${summary}`,
    );
  }, [summary]);

  const mailtoUrl = useMemo(() => {
    return buildMailtoHref(
      "One&Only workspace enquiry via website bot",
      summary,
    );
  }, [summary]);

  const resetBot = () => {
    setState(initialState);
    setStep(0);
  };

  const closeBot = () => {
    setIsOpen(false);
  };

  const openBot = () => {
    setIsOpen(true);
  };

  const handleNext = () => {
    if (!canGoNext) {return;}
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 0) {
      closeBot();
      return;
    }
    setStep(step - 1);
  };

  return (
    <>
      <motion.button
        onClick={() => {
          if (!isOpen) {
            resetBot();
            openBot();
          } else {
            closeBot();
          }
        }}
        className="assistant-launcher-action assistant-launcher-action--primary assistant-focus-ring fixed bottom-20 right-3 z-40 rounded-full px-3 shadow-xl transition-colors sm:bottom-24 sm:right-6 sm:px-4"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open WhatsApp project assistant"
        title="Open WhatsApp project assistant"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden text-xs font-semibold tracking-wide sm:inline">
          WhatsApp
        </span>
        <span className="hidden h-2 w-2 rounded-full bg-[color:var(--glass-white-90)] sm:inline" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="assistant-sheet fixed bottom-32 right-3 z-40 w-[min(22rem,calc(100vw-1.5rem))] sm:bottom-40 sm:w-80"
          >
            <div className="assistant-sheet__header">
              <div className="assistant-sheet__brand">
                <span className="assistant-sheet__icon assistant-sheet__icon--primary">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="assistant-sheet__title">
                    WhatsApp Project Assistant
                  </p>
                  <p className="assistant-sheet__subtitle">
                    Share your requirement in under 60 seconds
                  </p>
                </div>
              </div>
              <button
                onClick={closeBot}
                aria-label="Close chat assistant"
                title="Close chat assistant"
                className="assistant-sheet__close assistant-focus-ring"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="assistant-log space-y-3">
              {step === 0 && (
                <div className="space-y-3">
                  <p className="text-strong">
                    Which product family or project type is this for?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {useCaseOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setState({ ...state, useCase: option.value })
                        }
                        className={getChipClass(state.useCase === option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-strong">
                    Roughly how many seats or units do you need?
                  </p>
                  <input
                    type="text"
                    value={state.seats}
                    onChange={(e) =>
                      setState({ ...state, seats: e.target.value })
                    }
                    placeholder="e.g. 12 workstations, 30 chairs"
                    className="assistant-bot-input"
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-strong">
                    Tell us about your company and project timing.
                  </p>
                  <input
                    type="text"
                    value={state.companyName}
                    onChange={(e) =>
                      setState({ ...state, companyName: e.target.value })
                    }
                    placeholder="Company name"
                    className="assistant-bot-input"
                  />
                  <input
                    type="text"
                    value={state.city}
                    onChange={(e) =>
                      setState({ ...state, city: e.target.value })
                    }
                    placeholder="City and state"
                    className="assistant-bot-input"
                  />
                  <div className="flex flex-wrap gap-2">
                    {timelineOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setState({ ...state, timeline: option.value })
                        }
                        className={getChipClass(
                          state.timeline === option.value,
                          true,
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={state.budget}
                    onChange={(e) =>
                      setState({ ...state, budget: e.target.value })
                    }
                    className="assistant-bot-input assistant-bot-input--small"
                    aria-label="Your approximate budget"
                    placeholder="e.g. ₹5,00,000"
                    title="Your approximate budget"
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-strong">How should we contact you?</p>
                  <div className="flex gap-2">
                    {contactMethodOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setState({ ...state, contactMethod: option.value })
                        }
                        className={getChipClass(
                          state.contactMethod === option.value,
                          true,
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={state.contactValue}
                    onChange={(e) =>
                      setState({ ...state, contactValue: e.target.value })
                    }
                    placeholder={
                      state.contactMethod === "email"
                        ? "Your email address"
                        : "Your WhatsApp number with country code"
                    }
                    className="assistant-bot-input"
                  />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <p className="text-strong">
                    Any additional notes or special requirements?
                  </p>
                  <textarea
                    value={state.notes}
                    onChange={(e) =>
                      setState({ ...state, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Optional details about layout, timelines, or brands."
                    className="assistant-bot-input assistant-field--textarea"
                  />
                  <div className="assistant-result-card">
                    <p className="assistant-result-title">
                      Preview of what we receive:
                    </p>
                    <pre className="assistant-result-body whitespace-pre-wrap text-[0.625rem] text-body">
                      {summary}
                    </pre>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="assistant-bot-action assistant-bot-action--primary assistant-focus-ring"
                    >
                      Send via WhatsApp
                      <ArrowRight className="w-3 h-3" />
                    </a>
                    <a
                      href={mailtoUrl}
                      className="assistant-bot-action assistant-bot-action--secondary assistant-focus-ring"
                    >
                      Send via Email
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-soft px-4 py-3">
              <button
                onClick={handleBack}
                className="text-xs font-semibold uppercase tracking-wide text-muted transition-colors hover:text-heading assistant-focus-ring"
              >
                {step === 0 ? "Close" : "Back"}
              </button>
              {step < 4 && (
                <button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className={`assistant-bot-action ${
                    canGoNext
                      ? "assistant-bot-action--primary"
                      : "assistant-bot-action--disabled"
                  } assistant-focus-ring`}
                >
                  Next
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {step === 4 && (
                <button
                  onClick={resetBot}
                  className="text-xs font-semibold uppercase tracking-wide text-muted transition-colors hover:text-strong assistant-focus-ring"
                >
                  Start over
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

