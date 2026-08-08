import "server-only";

import { env } from "@/lib/env.server";
import { SITE_URL } from "@/lib/siteUrl";

export type ServerChatMessageContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ServerChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | ServerChatMessageContentPart[];
};

export type ProviderId = "openrouter" | "gemini";

type OpenRouterProvider = {
  provider: "openrouter";
  model: string;
  apiKey: string;
  baseURL: string;
  defaultHeaders?: Record<string, string>;
};

type GeminiProvider = {
  provider: "gemini";
  model: string;
  apiKey: string;
  baseURL: string;
};

export type ResolvedProvider = OpenRouterProvider | GeminiProvider;

type RequestProviderTextOptions = {
  jsonMode?: boolean;
  signal?: AbortSignal;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  onDelta?: (delta: string) => void;
};

const DEFAULT_OPENROUTER_MODEL = env.OPENROUTER_MODEL || "openrouter/auto";

export function getBedrockMantleBaseUrl(region: string): string {
  return `https://bedrock-mantle.${region}.api.aws/v1`;
}

export function resolveProviderChain(): ResolvedProvider[] {
  const providers: ResolvedProvider[] = [];

  const geminiKey = env.GEMINI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    providers.push({
      provider: "gemini",
      apiKey: geminiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      model: env.GEMINI_MODEL || "gemini-2.5-flash",
    });
  }

  const primaryKey = env.OPENROUTER_API_KEY_PRIMARY?.trim();
  if (primaryKey) {
    providers.push({
      provider: "openrouter",
      apiKey: primaryKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": SITE_URL,
        "X-Title": "One&Only",
      },
      model: DEFAULT_OPENROUTER_MODEL,
    });
  }

  const backupKey = env.OPENROUTER_API_KEY_BACKUP?.trim();
  if (backupKey) {
    providers.push({
      provider: "openrouter",
      apiKey: backupKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": SITE_URL,
        "X-Title": "One&Only",
      },
      model: DEFAULT_OPENROUTER_MODEL,
    });
  }

  return providers;
}

function extractCompletionText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }
      if (!part || typeof part !== "object") {
        return "";
      }
      const candidate = part as { text?: string; type?: string };
      return candidate.type === "text" && typeof candidate.text === "string"
        ? candidate.text
        : "";
    })
    .join("");
}

function extractStreamChunkText(chunk: unknown): string {
  if (!chunk || typeof chunk !== "object") {
    return "";
  }
  const choices = (chunk as { choices?: Array<{ delta?: { content?: unknown } }> }).choices;
  const content = choices?.[0]?.delta?.content;
  return extractCompletionText(content);
}

async function requestOpenAiCompatibleText(
  provider: ResolvedProvider,
  messages: ServerChatMessage[],
  options: RequestProviderTextOptions,
): Promise<string> {
  const requestBody = {
    model: provider.model,
    messages,
    temperature: options.temperature ?? 0.4,
    ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
    ...(options.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
    ...(options.stream ? { stream: true } : {}),
  };

  const response = await fetch(`${provider.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
      ...(provider.provider === "openrouter" ? provider.defaultHeaders : {}),
    },
    body: JSON.stringify(requestBody),
    signal: options.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Provider ${provider.provider} failed (${response.status}): ${errorText}`);
  }

  if (!options.stream) {
    const completion = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    return extractCompletionText(completion.choices?.[0]?.message?.content);
  }

  if (!response.body) {
    throw new Error(`Provider ${provider.provider} returned an empty stream body`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let raw = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) {
        continue;
      }
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") {
        continue;
      }

      try {
        const delta = extractStreamChunkText(JSON.parse(payload));
        if (!delta) {
          continue;
        }
        raw += delta;
        options.onDelta?.(delta);
      } catch {
        continue;
      }
    }
  }

  return raw;
}

export async function requestProviderText(
  provider: ResolvedProvider,
  messages: ServerChatMessage[],
  options: RequestProviderTextOptions = {},
): Promise<string> {
  return requestOpenAiCompatibleText(provider, messages, options);
}
