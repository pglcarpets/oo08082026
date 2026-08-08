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
import { OO } from "@studio/lib/studioPalette";
import { withAuth } from "@/features/shared/api/withAuth";

/** Port of POST /api/ai/generate */
export const POST = withAuth(
  async (request) => {
    try {
      const body = (await request.json()) as { prompt?: string };
      const promptText = (body.prompt || "").trim();
      if (promptText.length < 2) {
        return NextResponse.json({ detail: "prompt too short" }, { status: 400 });
      }
      const prompt =
        "Design a furniture item from the user's description below. " +
        "Return ONLY this JSON schema (no prose, no fences):\n" +
        '{"name": string, "category": one of ' +
        JSON.stringify(CATEGORIES) +
        ', "subcategory": string|null, ' +
        '"tags": string[3-6], "dimensions": {"width_mm": number, "depth_mm": number, "height_mm": number}, ' +
        '"svg": string, "notes": string|null}\n' +
        "Rules for svg field: single <svg xmlns=... viewBox> element with the top-view. " +
        "viewBox width and height are dimensions.width_mm/10 and depth_mm/10 respectively (1 unit = 10 mm). " +
        `Use fills ${OO.ecru100} (primary) and ${OO.ecru200} (secondary), strokes ${OO.ink900} stroke-width 1.2. ` +
        "Include only shapes (<rect>, <circle>, <ellipse>, <path>, <line>, <polygon>, <g>). " +
        "No text elements inside the svg. Keep it clean and CAD-like.\n" +
        "User description: " +
        promptText;
      const reply = await runLlm(prompt);
      const data = extractJson(reply);
      data.category = normalizeCategory(data.category);
      data.dimensions = normalizeDimensions(data.dimensions, DEFAULT_AI_DIMENSIONS_MM);
      if (!data.svg || typeof data.svg !== "string" || !data.svg.includes("<svg")) {
        return NextResponse.json({ detail: "Model did not return a valid SVG" }, { status: 502 });
      }
      if (!Array.isArray(data.tags)) data.tags = [];
      return NextResponse.json({
        name: data.name,
        category: data.category,
        subcategory: data.subcategory ?? null,
        tags: data.tags,
        dimensions: data.dimensions,
        svg: data.svg,
        notes: data.notes ?? null,
      });
    } catch (e) {
      const err = e as AiHttpError;
      const status = typeof err.status === "number" ? err.status : 502;
      return NextResponse.json({ detail: err.message || String(e) }, { status });
    }
  },
  {
    role: "guest",
    rateLimitScope: "studio-ai-generate",
    rateLimit: 5,
    requireCsrf: true,
  },
);
