/**
 * Wall graph — join centreline endpoints and report node degree / simple cycles.
 */

export type Point2D = { x: number; y: number };

export type WallGraphInput = {
  id: string;
  start: Point2D;
  end: Point2D;
};

export type WallNode = {
  id: string;
  position: Point2D;
  edgeIds: string[];
};

export type WallEdge = {
  id: string;
  wallId: string;
  startNodeId: string;
  endNodeId: string;
};

export type WallGraph = {
  nodes: Map<string, WallNode>;
  edges: Map<string, WallEdge>;
};

export const WALL_JOIN_EPSILON_MM = 25;

function pointKey(p: Point2D, epsilonMm = WALL_JOIN_EPSILON_MM): string {
  const rx = Math.round(p.x / epsilonMm) * epsilonMm;
  const ry = Math.round(p.y / epsilonMm) * epsilonMm;
  return `${rx},${ry}`;
}

function findNearbyNode(
  nodes: Map<string, WallNode>,
  p: Point2D,
  epsilonMm = WALL_JOIN_EPSILON_MM,
): WallNode | null {
  for (const node of nodes.values()) {
    if (Math.hypot(node.position.x - p.x, node.position.y - p.y) <= epsilonMm) {
      return node;
    }
  }
  return null;
}

export function buildWallGraph(walls: readonly WallGraphInput[]): WallGraph {
  const nodes = new Map<string, WallNode>();
  const edges = new Map<string, WallEdge>();

  function getOrCreateNode(p: Point2D): WallNode {
    const nearby = findNearbyNode(nodes, p);
    if (nearby) return nearby;
    const id = `${pointKey(p)}#${nodes.size}`;
    const created: WallNode = { id, position: { x: p.x, y: p.y }, edgeIds: [] };
    nodes.set(id, created);
    return created;
  }

  for (let i = 0; i < walls.length; i += 1) {
    const wall = walls[i];
    if (!wall) continue;
    const startNode = getOrCreateNode(wall.start);
    const endNode = getOrCreateNode(wall.end);
    if (startNode.id === endNode.id) continue;

    const edgeId = wall.id || `edge_${i}`;
    const uniqueId = edges.has(edgeId) ? `${edgeId}#${i}` : edgeId;
    edges.set(uniqueId, {
      id: uniqueId,
      wallId: wall.id,
      startNodeId: startNode.id,
      endNodeId: endNode.id,
    });
    startNode.edgeIds.push(uniqueId);
    endNode.edgeIds.push(uniqueId);
  }

  return { nodes, edges };
}

export function nodeDegree(graph: WallGraph, nodeId: string): number {
  return graph.nodes.get(nodeId)?.edgeIds.length ?? 0;
}

/** Count junctions (degree ≥ 2). */
export function countJunctions(graph: WallGraph): number {
  let n = 0;
  for (const node of graph.nodes.values()) {
    if (node.edgeIds.length >= 2) n += 1;
  }
  return n;
}
