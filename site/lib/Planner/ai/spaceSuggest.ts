import { validateLayoutSchema, type SuggestedLayoutJson } from "./validateLayoutSchema";

export type SpaceSuggestInput = {
  seatTarget?: number;
  roomWidthMm?: number;
  roomDepthMm?: number;
  prompt?: string;
};

export type SpaceSuggestResult =
  | { ok: true; layout: SuggestedLayoutJson; source: "heuristic" | "llm" }
  | { ok: false; kind: "invalid_schema" | "provider"; message: string };

/**
 * Deterministic heuristic layout when LLM is unavailable.
 * Places a simple desk grid inside the room.
 */
export function heuristicSpaceSuggest(input: SpaceSuggestInput): SpaceSuggestResult {
  const seats = Math.max(1, Math.min(input.seatTarget ?? 4, 40));
  const widthMm = input.roomWidthMm ?? Math.max(6000, seats * 1400);
  const depthMm = input.roomDepthMm ?? Math.max(5000, Math.ceil(seats / 2) * 2000);
  const items: SuggestedLayoutJson["items"] = [];
  const deskW = 1200;
  const deskD = 600;
  const gap = 400;
  let x = 800;
  let y = 800;
  for (let i = 0; i < seats; i += 1) {
    if (x + deskW > widthMm - 400) {
      x = 800;
      y += deskD + gap;
    }
    items.push({
      catalogId: "desk-a",
      xMm: x + deskW / 2,
      yMm: y + deskD / 2,
      rotationDeg: 0,
    });
    x += deskW + gap;
  }
  const layout = {
    room: { widthMm, depthMm },
    items,
  };
  const checked = validateLayoutSchema(layout);
  if (!checked.ok) {
    return { ok: false, kind: "invalid_schema", message: checked.error };
  }
  return { ok: true, layout: checked.layout, source: "heuristic" };
}

/** Parse LLM JSON text into a validated layout. */
export function parseSpaceSuggestJson(text: string): SpaceSuggestResult {
  try {
    const parsed: unknown = JSON.parse(text);
    const checked = validateLayoutSchema(parsed);
    if (!checked.ok) {
      return { ok: false, kind: "invalid_schema", message: checked.error };
    }
    return { ok: true, layout: checked.layout, source: "llm" };
  } catch {
    return { ok: false, kind: "invalid_schema", message: "Invalid JSON from provider" };
  }
}
