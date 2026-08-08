import { describe, it, expect } from "vitest";
import {
  buildWallGraph,
  countJunctions,
  nodeDegree,
} from "@/lib/Planner/geometry/wallGraph";

describe("wallGraph", () => {
  it("joins collinear walls at shared endpoint", () => {
    const graph = buildWallGraph([
      { id: "w1", start: { x: 0, y: 0 }, end: { x: 4000, y: 0 } },
      { id: "w2", start: { x: 4000, y: 0 }, end: { x: 4000, y: 3000 } },
    ]);
    expect(graph.edges.size).toBe(2);
    expect(graph.nodes.size).toBe(3);
    expect(countJunctions(graph)).toBe(1);
  });

  it("merges endpoints within join epsilon", () => {
    const graph = buildWallGraph([
      { id: "w1", start: { x: 0, y: 0 }, end: { x: 1000, y: 0 } },
      { id: "w2", start: { x: 1008, y: 0 }, end: { x: 2000, y: 0 } },
    ]);
    expect(graph.nodes.size).toBe(3);
    const junction = [...graph.nodes.values()].find((n) => n.edgeIds.length === 2);
    expect(junction).toBeDefined();
    expect(junction?.edgeIds.length).toBe(2);
    expect(nodeDegree(graph, junction!.id)).toBe(2);
  });

  it("skips zero-length walls (start and end collapse to same node)", () => {
    const graph = buildWallGraph([
      { id: "dot", start: { x: 100, y: 100 }, end: { x: 100, y: 100 } },
      { id: "w1", start: { x: 0, y: 0 }, end: { x: 500, y: 0 } },
    ]);
    expect(graph.edges.size).toBe(1);
    expect(graph.edges.has("w1")).toBe(true);
    expect(graph.edges.has("dot")).toBe(false);
  });

  it("disambiguates duplicate wall ids", () => {
    const graph = buildWallGraph([
      { id: "dup", start: { x: 0, y: 0 }, end: { x: 1000, y: 0 } },
      { id: "dup", start: { x: 0, y: 0 }, end: { x: 0, y: 1000 } },
    ]);
    expect(graph.edges.size).toBe(2);
    expect(graph.edges.has("dup")).toBe(true);
    expect(graph.edges.has("dup#1")).toBe(true);
    expect(countJunctions(graph)).toBe(1);
  });

  it("assigns synthetic edge id when wall id is empty", () => {
    const graph = buildWallGraph([
      { id: "", start: { x: 0, y: 0 }, end: { x: 100, y: 0 } },
    ]);
    expect(graph.edges.has("edge_0")).toBe(true);
  });

  it("returns 0 degree for missing nodes", () => {
    const graph = buildWallGraph([
      { id: "w1", start: { x: 0, y: 0 }, end: { x: 100, y: 0 } },
    ]);
    expect(nodeDegree(graph, "nope")).toBe(0);
  });

  it("handles empty wall list", () => {
    const graph = buildWallGraph([]);
    expect(graph.nodes.size).toBe(0);
    expect(graph.edges.size).toBe(0);
    expect(countJunctions(graph)).toBe(0);
  });

  it("skips sparse / undefined entries in the walls array", () => {
    const walls: ({ id: string; start: { x: number; y: number }; end: { x: number; y: number } } | undefined)[] = [];
    walls[0] = { id: "w1", start: { x: 0, y: 0 }, end: { x: 100, y: 0 } };
    walls[2] = { id: "w2", start: { x: 100, y: 0 }, end: { x: 100, y: 100 } };
    // index 1 is a hole → undefined when iterated
    const graph = buildWallGraph(walls as { id: string; start: { x: number; y: number }; end: { x: number; y: number } }[]);
    expect(graph.edges.size).toBe(2);
    expect(countJunctions(graph)).toBe(1);
  });
});
