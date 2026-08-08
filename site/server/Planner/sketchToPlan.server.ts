/**
 * Server-side sketch-to-plan conversion (provider chain).
 * Client/editor code must import from `@planner/lib/ai/sketchToPlanShared` only.
 */

import "server-only";

import {
  requestProviderText,
  resolveProviderChain,
} from "@/lib/ai/mastra";
import {
  SKETCH_TO_PLAN_SYSTEM_PROMPT,
  SketchToPlanResponseSchema,
  classifySketchConversionError,
  createSketchConversionError,
  getSketchRecoveryMessage,
  normalizeSketchObjects,
  type SketchToPlanRequest,
  type SketchToPlanResponse,
} from "@planner/lib/ai/sketchToPlanShared";

export {
  SKETCH_RECOVERY_MESSAGES,
  SKETCH_TO_PLAN_SYSTEM_PROMPT,
  SketchConversionError,
  buildSketchPlanFabricDraft,
  classifySketchConversionError,
  getSketchRecoveryMessage,
  normalizeSketchObjects,
  sketchObjectsToApplyPayload,
  type SketchToPlanRequest,
  type SketchToPlanResponse,
} from "@planner/lib/ai/sketchToPlanShared";

function buildUserContent(request: SketchToPlanRequest) {
  return [
    {
      type: "text" as const,
      text: [
        `Sketch file: ${request.fileName}`,
        `User prompt: ${request.prompt}`,
        `Include rooms: ${request.includeRooms ? "yes" : "no"}`,
        "Convert the sketch into editable walls and rooms in millimetres.",
        "Use the simplest geometry that preserves the sketch intent.",
      ].join("\n"),
    },
    {
      type: "image_url" as const,
      image_url: { url: request.imageDataUrl },
    },
  ];
}

export function parseSketchResponse(raw: string): SketchToPlanResponse | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    return null;
  }
  try {
    const parsed = SketchToPlanResponseSchema.parse(
      JSON.parse(raw.slice(start, end + 1)),
    );
    return {
      objects: normalizeSketchObjects(parsed.objects),
      warnings: parsed.warnings,
    };
  } catch {
    return null;
  }
}

async function withSketchTimeout<T>(
  work: Promise<T>,
  fileName: string,
  timeoutMs = 30_000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(createSketchConversionError("timeout", fileName));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function requestSketchToPlan(
  request: SketchToPlanRequest,
): Promise<SketchToPlanResponse> {
  const provider = resolveProviderChain()[0];
  if (!provider) {
    throw createSketchConversionError("missing_provider", request.fileName);
  }

  let raw: string;
  try {
    raw = await withSketchTimeout(
      requestProviderText(
        provider,
        [
          { role: "system", content: SKETCH_TO_PLAN_SYSTEM_PROMPT },
          { role: "user", content: buildUserContent(request) },
        ],
        {
          jsonMode: true,
          temperature: 0.2,
        },
      ),
      request.fileName,
    );
  } catch (error) {
    throw classifySketchConversionError(error, request.fileName);
  }

  const parsed = parseSketchResponse(raw);
  if (!parsed) {
    throw createSketchConversionError("invalid_response", request.fileName);
  }
  if (parsed.objects.length === 0) {
    throw createSketchConversionError("low_confidence", request.fileName);
  }
  if (
    parsed.warnings.some((warning) =>
      /low confidence|uncertain|not confident/i.test(warning),
    )
  ) {
    throw createSketchConversionError(
      "low_confidence",
      request.fileName,
      parsed.warnings[0] ?? getSketchRecoveryMessage("low_confidence"),
    );
  }

  return parsed;
}
