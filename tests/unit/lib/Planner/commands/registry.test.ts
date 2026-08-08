import { describe, it, expect, vi } from "vitest";
import { buildPaletteCommands, filterCommands } from "@/lib/Planner/commands/registry";

describe("command registry", () => {
  it("filters by query", () => {
    const cmds = buildPaletteCommands({ setTool: vi.fn() });
    const wall = filterCommands(cmds, "wal");
    expect(wall.some((c) => c.id === "tool-wall")).toBe(true);
  });

  it("runs setTool", () => {
    const setTool = vi.fn();
    const cmds = buildPaletteCommands({ setTool });
    cmds.find((c) => c.id === "tool-select")?.run();
    expect(setTool).toHaveBeenCalledWith("select");
  });
});
