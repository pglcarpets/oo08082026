import "server-only";

import type { Agent } from "@mastra/core/agent";

import { getAdvisorAgent } from "./advisorAgent";
import { getCatalogAdvisorAgent } from "./catalogAdvisorAgent";
import type { AdvisorModelTarget } from "./providers";

export type AdvisorChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type RequestAdvisorMessagesOptions = {
  signal?: AbortSignal;
  stream?: boolean;
  onDelta?: (delta: string) => void;
  temperature?: number;
  jsonMode?: boolean;
};

type RequestAdvisorTextOptions = RequestAdvisorMessagesOptions;

type MastraMessageListInput = Parameters<Agent["generate"]>[0];

function toMastraMessages(messages: AdvisorChatMessage[]): MastraMessageListInput {
  return messages.map((message) => {
    switch (message.role) {
      case "system":
        return { role: "system", content: message.content };
      case "user":
        return { role: "user", content: message.content };
      case "assistant":
        return { role: "assistant", content: message.content };
      default: {
        const exhaustive: never = message.role;
        return exhaustive;
      }
    }
  });
}

async function requestAgentText(
  agent: Agent,
  target: AdvisorModelTarget,
  messages: AdvisorChatMessage[],
  options: RequestAdvisorMessagesOptions = {},
): Promise<string> {
  const executionOptions = {
    model: target,
    abortSignal: options.signal,
    modelSettings: {
      temperature: options.temperature ?? 0.4,
    },
    ...(options.jsonMode
      ? {
          providerOptions: {
            google: {
              responseMimeType: "application/json",
            },
            openrouter: {
              response_format: { type: "json_object" as const },
            },
          },
        }
      : {}),
  };

  const mastraMessages = toMastraMessages(messages);

  if (options.stream) {
    const output = await agent.stream(mastraMessages, executionOptions);
    let raw = "";

    for await (const chunk of output.fullStream) {
      if (chunk.type !== "text-delta") {
        continue;
      }

      const delta = chunk.payload.text;
      if (!delta) {
        continue;
      }

      raw += delta;
      options.onDelta?.(delta);
    }

    return raw || (await output.text);
  }

  const output = await agent.generate(mastraMessages, executionOptions);
  return await output.text;
}

export async function requestAdvisorMessages(
  target: AdvisorModelTarget,
  messages: AdvisorChatMessage[],
  options: RequestAdvisorMessagesOptions = {},
): Promise<string> {
  const agent = await getAdvisorAgent();
  return requestAgentText(agent, target, messages, options);
}

export async function requestAdvisorText(
  target: AdvisorModelTarget,
  systemPrompt: string,
  query: string,
  options: RequestAdvisorTextOptions = {},
): Promise<string> {
  const agent = await getCatalogAdvisorAgent();
  return requestAgentText(
    agent,
    target,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ],
    { ...options, jsonMode: options.jsonMode ?? true },
  );
}
