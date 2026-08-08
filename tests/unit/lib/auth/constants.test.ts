/**
 * Name-mirror coverage for lib/auth/constants.
 */
import { describe, expect, it } from "vitest";
import { PLANNER_GUEST_COOKIE } from "@/lib/auth/constants";

describe("auth constants", () => {
  it("exports the planner guest pass cookie name", () => {
    expect(PLANNER_GUEST_COOKIE).toBe("planner_guest_pass");
  });
});
