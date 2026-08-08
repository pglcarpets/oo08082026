import { NextResponse } from "next/server";
import { AiHttpError, extractJson, runLlm } from "@studio/lib/studioAiLlm";
import { OO } from "@studio/lib/studioPalette";
import { withAuth } from "@/features/shared/api/withAuth";

/** Port of POST /api/ai/restyle */
export const POST = withAuth(
  async (request) => {
    try {
      const body = (await request.json()) as { svg?: string; instruction?: string };
      if (!body.svg) {
        return NextResponse.json({ detail: "svg required" }, { status: 400 });
      }
      const inst =
        body.instruction ||
        "Simplify, straighten edges, clean up messy strokes, keep proportions.";
      const prompt =
        "Restyle the following furniture SVG. Return ONLY this JSON:\n" +
        '{"svg": string, "notes": string|null}\n' +
        `Rules: keep the same viewBox and overall proportions; produce cleaner geometry with fills ${OO.ecru100}/${OO.ecru200} and strokes ${OO.ink900} stroke-width 1.2. ` +
        `Instruction: ${inst}\nOriginal SVG:\n${body.svg.slice(0, 6000)}`;
      const reply = await runLlm(prompt);
      const data = extractJson(reply);
      if (!data.svg || typeof data.svg !== "string" || !data.svg.includes("<svg")) {
        return NextResponse.json({ detail: "Model did not return a valid SVG" }, { status: 502 });
      }
      return NextResponse.json({ svg: data.svg, notes: data.notes ?? null });
    } catch (e) {
      const err = e as AiHttpError;
      const status = typeof err.status === "number" ? err.status : 502;
      return NextResponse.json({ detail: err.message || String(e) }, { status });
    }
  },
  {
    role: "guest",
    rateLimitScope: "studio-ai-restyle",
    rateLimit: 5,
    requireCsrf: true,
  },
);
