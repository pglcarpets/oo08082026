import { describe, it, expect, vi } from "vitest";
import { useReducedMotion } from "framer-motion";
import {
  fadeUp,
  fadeUpMount,
  useMotionSafeHover,
  MOTION_EASE,
  MOTION_TOKENS,
  staggerContainer,
  staggerItem,
} from "@/lib/helpers/motion";

vi.mock("framer-motion", () => ({
  useReducedMotion: vi.fn(),
}));

describe("motion helpers", () => {
  it("should have correct constants defined", () => {
    expect(MOTION_EASE).toEqual([0.22, 1, 0.36, 1]);
    expect(MOTION_TOKENS.fast).toBe(0.26);
    expect(MOTION_TOKENS.slow).toBe(0.72);
  });

  describe("fadeUp", () => {
    it("should return correct configuration with defaults", () => {
      const config = fadeUp();
      expect(config.initial.y).toBe(MOTION_TOKENS.distanceMd);
      expect(config.transition.delay).toBe(0);
    });

    it("should allow custom distance and delay", () => {
      const config = fadeUp(100, 2);
      expect(config.initial.y).toBe(100);
      expect(config.transition.delay).toBe(2);
    });
  });

  describe("fadeUpMount", () => {
    it("should reveal on mount instead of whileInView", () => {
      const config = fadeUpMount();
      expect(config.initial).toEqual({ opacity: 0, y: MOTION_TOKENS.distanceMd });
      expect(config.animate).toEqual({ opacity: 1, y: 0 });
      expect(config).not.toHaveProperty("whileInView");
    });
  });

  describe("useMotionSafeHover", () => {
    it("should return hover and tap actions when reduced motion is not preferred", () => {
      vi.mocked(useReducedMotion).mockReturnValue(false);
      const hover = { scale: 1.1 };
      const tap = { scale: 0.95 };
      const result = useMotionSafeHover(hover, tap);

      expect(result.whileHover).toBe(hover);
      expect(result.whileTap).toBe(tap);
    });

    it("should return undefined hover and tap actions when reduced motion is preferred", () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);
      const hover = { scale: 1.1 };
      const tap = { scale: 0.95 };
      const result = useMotionSafeHover(hover, tap);

      expect(result.whileHover).toBeUndefined();
      expect(result.whileTap).toBeUndefined();
    });
  });

  describe("variants", () => {
    it("should define staggerContainer", () => {
      expect(staggerContainer.hidden).toEqual({ opacity: 0 });
      expect(staggerContainer.visible).toBeDefined();
    });

    it("should define staggerItem", () => {
      expect(staggerItem.hidden).toEqual({ opacity: 0, y: MOTION_TOKENS.distanceMd });
    });
  });
});
