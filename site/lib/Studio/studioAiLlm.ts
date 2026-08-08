import { OO } from "@studio/lib/studioPalette";
/**
 * LLM helpers — port of 30072026/backend/ai.py
 * Providers (in order): Gemini → OpenRouter → Anthropic → OpenAI.
 * Keys: GEMINI_API_KEY | OPENROUTER_API_KEY_PRIMARY | OPENROUTER_API_KEY_BACKUP |
 *       ANTHROPIC_API_KEY | EMERGENT_LLM_KEY | OPENAI_API_KEY | UNIVERSAL_KEY
 */

const SYSTEM_MSG =
  "You are an expert furniture / architectural CAD symbol designer. " +
  "You output ONLY valid JSON, no prose, no code fences. " +
  `When asked for SVG, produce a clean, editable top-view symbol with strokes in ${OO.ink900}, ` +
  `fills in ${OO.ecru100} or ${OO.ecru200}, on transparent background. Use viewBox scaled to 10 units per 100 mm (so a 1000mm x 1000mm object fills 100x100 viewBox units). ` +
  "Round strokes 1.2, stroke-linejoin round. No text labels inside the SVG unless requested. Never include external images.";

export const CATEGORIES = [
  "Seating",
  "Desks",
  "Tables",
  "Storage",
  "Workstations",
  "Accessories",
  "Openings",
  "Custom",
] as const;

function getGeminiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim() || undefined;
}

function getOpenRouterKey(): string | undefined {
  return (
    process.env.OPENROUTER_API_KEY_PRIMARY ||
    process.env.OPENROUTER_API_KEY_BACKUP ||
    process.env.OPENROUTER_API_KEY ||
    undefined
  );
}

function getAnthropicKey(): string | undefined {
  return (
    process.env.ANTHROPIC_API_KEY ||
    process.env.EMERGENT_LLM_KEY ||
    process.env.UNIVERSAL_KEY ||
    undefined
  );
}

function getOpenAIKey(): string | undefined {
  return process.env.OPENAI_API_KEY || process.env.UNIVERSAL_KEY || undefined;
}

export class AiHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function callGemini(prompt: string): Promise<string> {
  const key = getGeminiKey();
  if (!key) throw new AiHttpError(500, "GEMINI_API_KEY not set");
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const base = "https://generativelanguage.googleapis.com/v1beta/openai";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_MSG },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content || "";
}

async function callOpenRouter(prompt: string): Promise<string> {
  const key = getOpenRouterKey();
  if (!key) throw new AiHttpError(500, "OPENROUTER_API_KEY_* not set");
  const base = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_MSG },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content || "";
}

async function callAnthropic(prompt: string): Promise<string> {
  const key = getAnthropicKey();
  if (!key) throw new AiHttpError(500, "EMERGENT_LLM_KEY / ANTHROPIC_API_KEY not set");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_MSG,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = (data.content || [])
    .filter((c) => c.type === "text")
    .map((c) => c.text || "")
    .join("\n");
  return text;
}

async function callOpenAI(prompt: string): Promise<string> {
  const key = getOpenAIKey();
  if (!key) throw new AiHttpError(500, "OPENAI_API_KEY not set");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1",
      messages: [
        { role: "system", content: SYSTEM_MSG },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content || "";
}

export async function runLlm(prompt: string): Promise<string> {
  const errors: string[] = [];
  if (getGeminiKey()) {
    try {
      return await callGemini(prompt);
    } catch (e) {
      errors.push(String(e));
    }
  }
  if (getOpenRouterKey()) {
    try {
      return await callOpenRouter(prompt);
    } catch (e) {
      errors.push(String(e));
    }
  }
  if (getAnthropicKey()) {
    try {
      return await callAnthropic(prompt);
    } catch (e) {
      errors.push(String(e));
    }
  }
  if (getOpenAIKey()) {
    try {
      return await callOpenAI(prompt);
    } catch (e) {
      errors.push(String(e));
    }
  }
  if (errors.length === 0) {
    throw new AiHttpError(
      500,
      "No LLM key set (GEMINI_API_KEY / OPENROUTER_API_KEY_PRIMARY / ANTHROPIC_API_KEY / OPENAI_API_KEY)",
    );
  }
  throw new AiHttpError(502, `AI error: ${errors.join(" | ")}`);
}

export function extractJson(text: string): Record<string, unknown> {
  if (!text) throw new AiHttpError(502, "Empty LLM response");
  let cleaned = text.trim();
  const fence = cleaned.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fence) cleaned = fence[1];
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    /* continue */
  }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch (e) {
      throw new AiHttpError(502, `LLM returned invalid JSON: ${String(e)}`);
    }
  }
  throw new AiHttpError(502, "LLM did not return JSON");
}

export function normalizeDimensions(
  dims: unknown,
  fallback: { width_mm: number; depth_mm: number; height_mm: number },
): {
  width_mm: number;
  depth_mm: number;
  height_mm: number;
} {
  const d = (dims && typeof dims === "object" ? dims : {}) as Record<string, unknown>;
  const out = { ...fallback };
  for (const k of ["width_mm", "depth_mm", "height_mm"] as const) {
    const v = d[k];
    if (typeof v === "number" && v > 0) out[k] = v;
  }
  return out;
}

export function normalizeCategory(category: unknown): string {
  if (typeof category === "string" && (CATEGORIES as readonly string[]).includes(category)) {
    return category;
  }
  return "Custom";
}
