/**
 * Name-mirror coverage for lib/utils.
 */
import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names and drops falsy values", () => {
    const hidden = false;
    expect(cn("px-2", hidden && "hidden", "py-1")).toBe("px-2 py-1");
  });

  it("resolves conflicting tailwind utilities via twMerge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("accepts conditional object syntax from clsx", () => {
    expect(cn({ "bg-red": true, "bg-blue": false }, "rounded")).toBe(
      "bg-red rounded",
    );
  });
});
