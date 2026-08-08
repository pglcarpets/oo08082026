import { NextResponse } from "next/server";
import {
  AiHttpError,
  CATEGORIES,
  extractJson,
  normalizeCategory,
  normalizeDimensions,
  runLlm,
} from "@studio/lib/studioAiLlm";
import { DEFAULT_AI_DIMENSIONS_MM } from "@studio/lib/studioTokens";
import { withAuth } from "@/features/shared/api/withAuth";

/** Port of POST /api/ai/suggest */
export const POST = withAuth(
  async (request) => {
    try {
      const body = (await request.json()) as {
        svg?: string;
        context?: string;
        hint_dimensions?: Record<string, number>;
      };
      const context = body.context || "";
      const hint = body.hint_dimensions || {};
      const srcDesc = body.svg ? body.svg.slice(0, 4000) : "no svg provided";
      const prompt =
        "Analyse this SVG top-view furniture symbol and infer sensible metadata. Return ONLY this JSON:\n" +
        '{"name": string, "category": one of ' +
        JSON.stringify(CATEGORIES) +
        ', "subcategory": string|null, ' +
        '"tags": string[3-6], "dimensions": {"width_mm": number, "depth_mm": number, "height_mm": number}}\n' +
        `Additional context: ${context}\nHint (may be wrong): ${JSON.stringify(hint)}\nSVG:\n${srcDesc}`;
      const reply = await runLlm(prompt);
      const data = extractJson(reply);
      data.category = normalizeCategory(data.category);
      data.dimensions = normalizeDimensions(data.dimensions, DEFAULT_AI_DIMENSIONS_MM);
      if (!Array.isArray(data.tags)) data.tags = [];
      return NextResponse.json({
        name: data.name,
        category: data.category,
        subcategory: data.subcategory ?? null,
        tags: data.tags,
        dimensions: data.dimensions,
      });
    } catch (e) {
      const err = e as AiHttpError;
      const status = typeof err.status === "number" ? err.status : 502;
      return NextResponse.json({ detail: err.message || String(e) }, { status });
    }
  },
  {
    role: "guest",
    rateLimitScope: "studio-ai-suggest",
    rateLimit: 5,
    requireCsrf: true,
  },
);
