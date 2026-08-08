// @vitest-environment node
/**
 * Contract: site/platform/planner-canvas.json drives canvasBounds and admin display.
 * Critical numeric/layout fields must be present and finite.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const monorepoRoot = path.resolve(__dirname, "../../..");
const configPath = path.join(
  monorepoRoot,
  "site",
  "platform",
  "planner-canvas.json",
);

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectFiniteNumber(value: unknown, label: string): number {
  expect(typeof value, label).toBe("number");
  const n = value as number;
  expect(Number.isFinite(n), `${label} must be finite`).toBe(true);
  return n;
}

describe("planner-canvas.json", () => {
  it("exists and is valid JSON", () => {
    expect(fs.existsSync(configPath), configPath).toBe(true);
    const raw = fs.readFileSync(configPath, "utf8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("has scale, bounds, layout, and viewport sections", () => {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as JsonObject;
    for (const key of ["scale", "bounds", "layout", "viewport"] as const) {
      expect(config, `missing section: ${key}`).toHaveProperty(key);
      expect(isObject(config[key]), `${key} must be object`).toBe(true);
    }
  });

  it("scale.mmPerCanvasUnit is a positive finite number", () => {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as JsonObject;
    const scale = config.scale as JsonObject;
    const mm = expectFiniteNumber(scale.mmPerCanvasUnit, "scale.mmPerCanvasUnit");
    expect(mm).toBeGreaterThan(0);
  });

  it("bounds fields are finite numbers with sensible ranges", () => {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as JsonObject;
    const bounds = config.bounds as JsonObject;

    const maxExtent = expectFiniteNumber(
      bounds.maxExtentMeters,
      "bounds.maxExtentMeters",
    );
    const minRoom = expectFiniteNumber(
      bounds.minRoomDimensionMm,
      "bounds.minRoomDimensionMm",
    );
    const minCanvas = expectFiniteNumber(
      bounds.minCanvasUnit,
      "bounds.minCanvasUnit",
    );

    expect(maxExtent).toBeGreaterThan(0);
    expect(minRoom).toBeGreaterThan(0);
    expect(minCanvas).toBeGreaterThanOrEqual(0);
  });

  it("layout origin and estimate room sizes are finite and positive", () => {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as JsonObject;
    const layout = config.layout as JsonObject;

    const origin = expectFiniteNumber(
      layout.defaultOriginCanvasUnits,
      "layout.defaultOriginCanvasUnits",
    );
    const minW = expectFiniteNumber(
      layout.estimateRoomMinWidthMm,
      "layout.estimateRoomMinWidthMm",
    );
    const minD = expectFiniteNumber(
      layout.estimateRoomMinDepthMm,
      "layout.estimateRoomMinDepthMm",
    );

    expect(origin).toBeGreaterThan(0);
    expect(minW).toBeGreaterThan(0);
    expect(minD).toBeGreaterThan(0);
  });

  it("viewport numeric fields are present, finite, and zoom range is ordered", () => {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as JsonObject;
    const viewport = config.viewport as JsonObject;

    const requiredNumeric = [
      "fitPaddingPx",
      "containerPadPx",
      "minContainerWidthPx",
      "minContainerHeightPx",
      "zoomMinPercent",
      "zoomMaxPercent",
      "fitMaxZoomFactor",
      "wheelZoomMin",
      "wheelZoomMax",
      "defaultZoomPercent",
      "emptyViewportFitMeters",
    ] as const;

    for (const key of requiredNumeric) {
      expectFiniteNumber(viewport[key], `viewport.${key}`);
    }

    const zoomMin = viewport.zoomMinPercent as number;
    const zoomMax = viewport.zoomMaxPercent as number;
    const defaultZoom = viewport.defaultZoomPercent as number;
    const wheelMin = viewport.wheelZoomMin as number;
    const wheelMax = viewport.wheelZoomMax as number;

    expect(zoomMin).toBeLessThan(zoomMax);
    expect(defaultZoom).toBeGreaterThanOrEqual(zoomMin);
    expect(defaultZoom).toBeLessThanOrEqual(zoomMax);
    expect(wheelMin).toBeLessThan(wheelMax);
    expect(viewport.minContainerWidthPx as number).toBeGreaterThan(0);
    expect(viewport.minContainerHeightPx as number).toBeGreaterThan(0);
  });
});
