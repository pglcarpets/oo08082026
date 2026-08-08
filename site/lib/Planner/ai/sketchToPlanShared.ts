/**
 * Client-safe sketch-to-plan types, zod schemas, and pure helpers.
 * Do not import server-only modules here — editor chrome imports this path.
 */

import { z } from "zod";

export const SketchToPlanRequestSchema = z.object({
  imageDataUrl: z
    .string()
    .trim()
    .min(1)
    .max(1_500_000)
    .refine((value) => /^data:image\/(png|jpe?g|webp);base64,/i.test(value), {
      message: "imageDataUrl must be a base64-encoded PNG, JPEG, or WebP image",
    }),
  fileName: z.string().trim().min(1).max(200),
  prompt: z.string().trim().min(1).max(2000),
  includeRooms: z.boolean().optional().default(true),
});

export const SketchToPlanWallSchema = z.object({
  type: z.literal("wall"),
  x1: z.number().finite(),
  y1: z.number().finite(),
  x2: z.number().finite(),
  y2: z.number().finite(),
});

export const SketchToPlanRoomSchema = z.object({
  type: z.literal("room"),
  left: z.number().finite(),
  top: z.number().finite(),
  width: z.number().finite().positive(),
  height: z.number().finite().positive(),
  label: z.string().trim().min(1).max(120).optional(),
});

export const SketchToPlanResponseSchema = z.object({
  objects: z.array(z.union([SketchToPlanWallSchema, SketchToPlanRoomSchema])),
  warnings: z.array(z.string().trim().max(300)).default([]),
});

export const SketchRecoveryReasonSchema = z.enum([
  "missing_provider",
  "timeout",
  "invalid_response",
  "low_confidence",
  "unsupported_input",
  "server_error",
]);

export type SketchRecoveryReason = z.infer<typeof SketchRecoveryReasonSchema>;
export type SketchToPlanRequest = z.infer<typeof SketchToPlanRequestSchema>;
export type SketchToPlanResponse = z.infer<typeof SketchToPlanResponseSchema>;
export type SketchWallObject = z.infer<typeof SketchToPlanWallSchema>;
export type SketchRoomObject = z.infer<typeof SketchToPlanRoomSchema>;
export type SketchPlanObject = SketchWallObject | SketchRoomObject;

export type SketchToPlanUiState =
  | { status: "idle" }
  | { status: "converting"; fileName: string }
  | {
      status: "preview";
      fileName: string;
      objects: SketchPlanObject[];
      warnings: string[];
      underlayDataUrl?: string;
    }
  | {
      status: "fallback";
      fileName: string;
      reason: SketchRecoveryReason;
      message: string;
      underlayDataUrl?: string;
    }
  | { status: "error"; fileName: string; message: string };

export const SKETCH_RECOVERY_MESSAGES: Record<SketchRecoveryReason, string> = {
  missing_provider:
    "AI conversion is unavailable. Keep the sketch as a reference and trace walls manually.",
  timeout: "Conversion did not finish. Keep the sketch as a reference and retry.",
  invalid_response:
    "The conversion was not reliable enough to apply. Keep the sketch as a reference.",
  low_confidence:
    "The conversion was not reliable enough to apply. Keep the sketch as a reference.",
  unsupported_input:
    "The sketch input could not be used. Use PNG, JPEG, or WebP and try again.",
  server_error: "Conversion failed. Keep the sketch as a reference and retry.",
};

export function getSketchRecoveryMessage(reason: SketchRecoveryReason): string {
  return SKETCH_RECOVERY_MESSAGES[reason];
}

export class SketchConversionError extends Error {
  readonly reason: SketchRecoveryReason;
  readonly fileName: string;

  constructor(
    reason: SketchRecoveryReason,
    fileName: string,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = "SketchConversionError";
    this.reason = reason;
    this.fileName = fileName;
  }
}

export function createSketchConversionError(
  reason: SketchRecoveryReason,
  fileName: string,
  message = getSketchRecoveryMessage(reason),
  cause?: unknown,
) {
  return new SketchConversionError(
    reason,
    fileName,
    message || getSketchRecoveryMessage(reason),
    cause === undefined ? undefined : { cause },
  );
}

function classifySketchErrorReason(error: unknown): SketchRecoveryReason {
  if (error instanceof SketchConversionError) {
    return error.reason;
  }
  if (error instanceof Error) {
    const message = `${error.name}: ${error.message}`.toLowerCase();
    if (message.includes("missing ai provider") || message.includes("provider credentials")) {
      return "missing_provider";
    }
    if (
      message.includes("timeout") ||
      message.includes("timed out") ||
      message.includes("aborted") ||
      error.name === "AbortError"
    ) {
      return "timeout";
    }
    if (message.includes("unsupported") || message.includes("decode") || message.includes("mime")) {
      return "unsupported_input";
    }
    if (message.includes("low confidence")) {
      return "low_confidence";
    }
    if (message.includes("json") || message.includes("schema") || message.includes("valid json")) {
      return "invalid_response";
    }
  }
  return "server_error";
}

export function classifySketchConversionError(error: unknown, fileName: string) {
  if (error instanceof SketchConversionError) {
    return error;
  }
  const reason = classifySketchErrorReason(error);
  return createSketchConversionError(reason, fileName, getSketchRecoveryMessage(reason), error);
}

export const SKETCH_TO_PLAN_SYSTEM_PROMPT = [
  "You convert a hand sketch into a simple editable floor plan.",
  "Return only valid JSON with an objects array and warnings array.",
  "Coordinates are millimetres from the sheet origin (top-left), X right, Y down.",
  "Prefer walls as {type:\"wall\",x1,y1,x2,y2} and rectangular rooms as {type:\"room\",left,top,width,height,label?}.",
  "Use the simplest geometry that preserves the sketch intent.",
  "Do not return blueprint overlays or raster images.",
  "If uncertain, add a warning; if not confident enough to place walls, return objects:[] with a low-confidence warning.",
].join(" ");

const MIN_WALL_LENGTH_MM = 50;

/**
 * Normalize model wall output: finite coords, drop zero-length, order endpoints.
 * Rooms with non-positive size are dropped.
 */
export function normalizeSketchObjects(
  objects: readonly SketchPlanObject[],
): SketchPlanObject[] {
  const out: SketchPlanObject[] = [];
  for (const obj of objects) {
    if (obj.type === "wall") {
      if (
        ![obj.x1, obj.y1, obj.x2, obj.y2].every((n) => Number.isFinite(n))
      ) {
        continue;
      }
      const dx = obj.x2 - obj.x1;
      const dy = obj.y2 - obj.y1;
      const len = Math.hypot(dx, dy);
      if (len < MIN_WALL_LENGTH_MM) continue;
      // Stable endpoint order: left-then-top first
      if (obj.x2 < obj.x1 || (obj.x2 === obj.x1 && obj.y2 < obj.y1)) {
        out.push({
          type: "wall",
          x1: obj.x2,
          y1: obj.y2,
          x2: obj.x1,
          y2: obj.y1,
        });
      } else {
        out.push({ type: "wall", x1: obj.x1, y1: obj.y1, x2: obj.x2, y2: obj.y2 });
      }
      continue;
    }
    if (
      !Number.isFinite(obj.left) ||
      !Number.isFinite(obj.top) ||
      !Number.isFinite(obj.width) ||
      !Number.isFinite(obj.height) ||
      obj.width <= 0 ||
      obj.height <= 0
    ) {
      continue;
    }
    out.push({
      type: "room",
      left: obj.left,
      top: obj.top,
      width: obj.width,
      height: obj.height,
      label: obj.label?.trim() || undefined,
    });
  }
  return out;
}

/** Wall segments in mm for Fabric apply. */
export type SketchWallMm = {
  x1Mm: number;
  y1Mm: number;
  x2Mm: number;
  y2Mm: number;
};

export type SketchRoomMm = {
  leftMm: number;
  topMm: number;
  widthMm: number;
  depthMm: number;
  label: string;
};

export function sketchObjectsToApplyPayload(objects: readonly SketchPlanObject[]): {
  walls: SketchWallMm[];
  rooms: SketchRoomMm[];
} {
  const walls: SketchWallMm[] = [];
  const rooms: SketchRoomMm[] = [];
  for (const obj of normalizeSketchObjects(objects)) {
    if (obj.type === "wall") {
      walls.push({
        x1Mm: obj.x1,
        y1Mm: obj.y1,
        x2Mm: obj.x2,
        y2Mm: obj.y2,
      });
    } else {
      rooms.push({
        leftMm: obj.left,
        topMm: obj.top,
        widthMm: obj.width,
        depthMm: obj.height,
        label: obj.label ?? "Room",
      });
    }
  }
  return { walls, rooms };
}

/**
 * Build a Fabric canvas JSON draft (pixel space at 1 unit = 1 mm * scale later if needed).
 * Kept for unit parity with legacy; planner host prefers sketchObjectsToApplyPayload.
 */
export function buildSketchPlanFabricDraft(
  response: SketchToPlanResponse,
  options?: { idFactory?: () => string },
): string {
  const idFactory = options?.idFactory ?? (() => `sk_${Math.random().toString(36).slice(2, 10)}`);
  const objects = normalizeSketchObjects(response.objects).map((object) => {
    if (object.type === "wall") {
      return {
        type: "line",
        version: "6.0.0",
        x1: object.x1,
        y1: object.y1,
        x2: object.x2,
        y2: object.y2,
        left: Math.min(object.x1, object.x2),
        top: Math.min(object.y1, object.y2),
        width: Math.abs(object.x2 - object.x1) || 1,
        height: Math.abs(object.y2 - object.y1) || 1,
        stroke: "#1a1a2e",
        strokeWidth: 8,
        selectable: true,
        evented: true,
        hasControls: false,
        hasBorders: false,
        originX: "left",
        originY: "top",
        data: { kind: "wall", id: idFactory(), label: "Wall" },
      };
    }
    return {
      type: "rect",
      version: "6.0.0",
      left: object.left,
      top: object.top,
      width: object.width,
      height: object.height,
      fill: "rgba(180, 200, 160, 0.15)",
      stroke: "#4a5568",
      strokeWidth: 2,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      originX: "left",
      originY: "top",
      data: { kind: "room", id: idFactory(), label: object.label ?? "Room" },
    };
  });

  return JSON.stringify({
    version: "6.0.0",
    objects,
  });
}
