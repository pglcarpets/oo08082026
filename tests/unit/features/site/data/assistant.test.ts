import { describe, expect, it } from "vitest";
import {
  AI_ADVISOR_COPY,
  AI_ADVISOR_SAMPLE_QUERIES,
  AI_ASSISTANT_REFINERS,
  AI_ASSISTANT_STARTERS,
  AI_ASSISTANT_WELCOME_MESSAGE,
  AI_CHATBOT_COPY,
  GUIDED_PLANNER_COPY,
  MOBILE_ASSISTANT_COPY,
} from "@/features/site/data/assistant";

describe("assistant welcome and starters", () => {
  it("welcome message introduces the workspace assistant", () => {
    expect(AI_ASSISTANT_WELCOME_MESSAGE).toMatch(/workspace AI assistant/i);
  });

  it("starters cover seating, storage, collaboration, and budget", () => {
    expect(AI_ASSISTANT_STARTERS.length).toBeGreaterThanOrEqual(4);
    for (const starter of AI_ASSISTANT_STARTERS) {
      expect(starter.length).toBeGreaterThan(20);
    }
  });
});

describe("assistant refiners", () => {
  const sampleQuery = "60-person operations team in Patna";

  it("exposes four refiner labels", () => {
    expect(AI_ASSISTANT_REFINERS).toHaveLength(4);
    expect(AI_ASSISTANT_REFINERS.map((r) => r.label)).toEqual([
      "Lower budget",
      "Premium options",
      "Faster delivery",
      "More ergonomic",
    ]);
  });

  it("apply transforms preserve the original query context", () => {
    for (const refiner of AI_ASSISTANT_REFINERS) {
      const result = refiner.apply(sampleQuery);
      expect(result).toContain(sampleQuery);
      expect(result.length).toBeGreaterThan(sampleQuery.length);
    }
  });

  it("lower-budget refiner asks for alternatives", () => {
    const lower = AI_ASSISTANT_REFINERS.find((r) => r.label === "Lower budget");
    expect(lower?.apply(sampleQuery)).toMatch(/lower-budget alternatives/i);
  });

  it("premium refiner asks for premium alternatives", () => {
    const premium = AI_ASSISTANT_REFINERS.find((r) => r.label === "Premium options");
    expect(premium?.apply(sampleQuery)).toMatch(/premium alternatives/i);
  });
});

describe("advisor and guided planner copy", () => {
  it("advisor sample queries mention realistic project sizes", () => {
    expect(AI_ADVISOR_SAMPLE_QUERIES).toHaveLength(4);
    expect(AI_ADVISOR_COPY.placeholder).toMatch(/ergonomic/i);
    expect(AI_ADVISOR_COPY.surpriseLabel).toBe("Try a sample");
  });

  it("guided planner copy defines three steps and error messages", () => {
    expect(GUIDED_PLANNER_COPY.title).toBe("Guided Planner");
    expect(GUIDED_PLANNER_COPY.stepOneIntro).toMatch(/seats/i);
    expect(GUIDED_PLANNER_COPY.errors.saveFailed).not.toEqual("");
    expect(GUIDED_PLANNER_COPY.errors.network).toMatch(/network/i);
    expect(GUIDED_PLANNER_COPY.placeholders.email).toMatch(/email/i);
  });
});

describe("chatbot and mobile assistant copy", () => {
  it("chatbot copy includes advisor failure and network prefixes", () => {
    expect(AI_CHATBOT_COPY.advisorUnavailable).toMatch(/Unable to generate/i);
    expect(AI_CHATBOT_COPY.networkPrefix).toMatch(/could not reach/i);
    expect(AI_CHATBOT_COPY.switchToPlanner).toMatch(/guided planner/i);
  });

  it("mobile assistant exposes launcher and entry points", () => {
    expect(MOBILE_ASSISTANT_COPY.launcher).toBe("Workspace assistant");
    expect(MOBILE_ASSISTANT_COPY.planner).toMatch(/Guided Planner/i);
    expect(MOBILE_ASSISTANT_COPY.chatbot).toMatch(/AI Chatbot/i);
  });
});