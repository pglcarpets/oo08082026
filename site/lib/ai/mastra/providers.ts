import "server-only";

import { env } from "@/lib/env.server";
import { SITE_URL } from "@/lib/siteUrl";

export type AdvisorProviderId = "gemini" | "openrouter";

export type AdvisorModelTarget =
  | {
      provider: AdvisorProviderId;
      label: string;
      id: `${string}/${string}`;
      url?: string;
      apiKey?: string;
      headers?: Record<string, string>;
    }
  | {
      provider: AdvisorProviderId;
      label: string;
      providerId: string;
      modelId: string;
      url?: string;
      apiKey?: string;
      headers?: Record<string, string>;
    };

const DEFAULT_OPENROUTER_MODEL = env.OPENROUTER_MODEL || "openrouter/auto";

function toOpenRouterModelId(model: string): `${string}/${string}` {
  return model.includes("/") ? (model as `${string}/${string}`) : `openrouter/${model}`;
}

function pushOpenRouterTarget(
  chain: AdvisorModelTarget[],
  apiKey: string,
  label: string,
) {
  chain.push({
    provider: "openrouter",
    label,
    id: toOpenRouterModelId(DEFAULT_OPENROUTER_MODEL),
    url: "https://openrouter.ai/api/v1",
    apiKey,
    headers: {
      "HTTP-Referer": SITE_URL,
      "X-Title": "One&Only",
    },
  });
}

export function resolveAdvisorModelChain(): AdvisorModelTarget[] {
  const chain: AdvisorModelTarget[] = [];

  const geminiKey = env.GEMINI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    chain.push({
      provider: "gemini",
      label: "gemini",
      providerId: "google",
      modelId: env.GEMINI_MODEL || "gemini-2.5-flash",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/",
      apiKey: geminiKey,
    });
  }

  const primaryKey = env.OPENROUTER_API_KEY_PRIMARY?.trim();
  if (primaryKey) {
    pushOpenRouterTarget(chain, primaryKey, "openrouter");
  }

  const backupKey = env.OPENROUTER_API_KEY_BACKUP?.trim();
  if (backupKey) {
    pushOpenRouterTarget(chain, backupKey, "openrouter-backup");
  }

  return chain;
}
