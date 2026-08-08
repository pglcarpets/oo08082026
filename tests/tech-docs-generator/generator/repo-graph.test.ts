import { describe, expect, it } from 'vitest'
import { buildRendererDataPayloads } from '../../../tech-docs-generator/scripts/renderer-data.mjs'
import { EXCLUDED_REPOSITORY_ROOTS } from '../../../tech-docs-generator/scripts/output-contract.mjs'
import { defaultRepoRoot, getSharedRepoModel } from '../helpers/shared-repo-model.mjs'

const repoRoot = defaultRepoRoot

describe('repo graph', () => {
  it('includes repo graph and runner selection in model and renderer payloads', () => {
    const model = getSharedRepoModel(repoRoot)

    expect(model.repoGraph).toBeDefined()
    expect(Array.isArray(model.repoGraph.nodes)).toBe(true)
    expect(model.repoGraph.nodes.length).toBeGreaterThan(0)
    expect(Array.isArray(model.repoGraph.edges)).toBe(true)
    expect(model.runnerSelection).toBeDefined()
    expect(Array.isArray(model.runnerSelection.runners)).toBe(true)
    expect(model.runnerSelection.runners.length).toBeGreaterThan(0)
    expect(Array.isArray(model.runnerSelection.selections)).toBe(true)

    const payloads = buildRendererDataPayloads(model)
    expect(payloads['repo-graph.json']).toEqual(model.repoGraph)
    expect(payloads['runner-selection.json']).toEqual(model.runnerSelection)
  }, 120_000)

  it('keeps excluded roots out of graph nodes and edges', () => {
    const model = getSharedRepoModel(repoRoot)
    const excluded = new Set(EXCLUDED_REPOSITORY_ROOTS)

    for (const node of model.repoGraph.nodes) {
      const firstSegment = node.sourcePath.replace(/\\/g, '/').split('/')[0]
      expect(excluded.has(firstSegment), node.sourcePath).toBe(false)
      expect(node.sourceHash).toMatch(/^sha256:|^missing$/)
    }

    for (const edge of model.repoGraph.edges) {
      const firstSegment = edge.sourcePath.replace(/\\/g, '/').split('/')[0]
      expect(excluded.has(firstSegment), edge.sourcePath).toBe(false)
      expect(edge.sourceHash).toMatch(/^sha256:|^missing$/)
    }
  }, 120_000)

  it('records import edges only for resolved module targets', () => {
    const model = getSharedRepoModel(repoRoot)
    const importEdges = model.repoGraph.edges.filter(
      (edge: { kind: string }) => edge.kind === 'imports',
    )

    expect(importEdges.length).toBeGreaterThan(0)
    for (const edge of importEdges) {
      expect(edge.from).toMatch(/^file:/)
      expect(edge.to).toMatch(/^file:/)
      expect(typeof edge.sourcePointer).toBe('string')
      expect(edge.sourcePointer.length).toBeGreaterThan(0)
    }
  }, 120_000)

  it('labels runner reachability separately from import edges', () => {
    const model = getSharedRepoModel(repoRoot)

    expect(
      model.runnerSelection.selections.some((record: { relation: string }) => record.relation === 'selected-by-runner'),
    ).toBe(true)
    expect(model.repoGraph.edges.every((edge: { kind: string }) => edge.kind !== 'selected-by-runner')).toBe(true)
  }, 120_000)
})