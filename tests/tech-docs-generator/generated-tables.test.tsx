import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  GeneratedApiTable,
  GeneratedKeyValueTable,
  GeneratedSimpleTable,
} from '../../tech-docs-generator/src/components/GeneratedDataTables'

describe('GeneratedDataTables', () => {
  it('renders API routes with known and fallback method colors', () => {
    render(
      <GeneratedApiTable
        routes={[
          {
            method: 'HEAD',
            path: '/api/ping',
            sourcePath: 'site/app/api/ping/route.ts',
            sourcePointer: 'HEAD handler',
          },
          {
            method: 'GET',
            path: '/api/health',
            sourcePath: 'site/app/api/health/route.ts',
            sourcePointer: 'GET handler',
          },
        ]}
      />,
    )

    expect(screen.getByText('/api/ping').textContent).toBe('/api/ping')
    expect(screen.getByText('HEAD').textContent).toBe('HEAD')
    expect(screen.getByText('GET handler').textContent).toBe('GET handler')
    expect(screen.getByText('HEAD').closest('span')?.className).toContain('bg-docs-surface-strong')
  })

  it('renders key-value rows with optional metadata', () => {
    render(
      <GeneratedKeyValueTable
        rows={[
          {
            label: 'Routes',
            value: '75',
            sourcePath: 'site/app',
            sourcePointer: 'route scan',
          },
          {
            label: 'Classification only',
            value: 'code-proven',
            sourcePath: 'generated-documents/data/testing-policy.json',
            sourcePointer: 'testingPolicy[0].fact',
            classification: 'code-proven',
          },
          {
            label: 'Browser exposure only',
            value: 'public-safe',
            sourcePath: 'generated-documents/data/testing-policy.json',
            sourcePointer: 'testingPolicy[1].fact',
            browserExposure: 'public-safe',
          },
          {
            label: 'Verification only',
            value: 'source-backed',
            sourcePath: 'generated-documents/data/testing-policy.json',
            sourcePointer: 'testingPolicy[2].fact',
            verificationMode: 'source-backed',
          },
          {
            label: 'Surface array',
            value: 'markdown + renderer',
            sourcePath: 'generated-documents/data/testing-policy.json',
            sourcePointer: 'testingPolicy[3].fact',
            renderSurface: ['markdown', 'renderer'],
          },
          {
            label: 'Surface string',
            value: 'markdown',
            sourcePath: 'generated-documents/data/environment.json',
            sourcePointer: 'deploymentEnvironmentVariables[0].fact',
            renderSurface: 'markdown',
          },
        ]}
      />,
    )

    expect(screen.getByText('Routes').textContent).toBe('Routes')
    expect(screen.getByText('75').textContent).toBe('75')
    expect(screen.getByText('Classification only').textContent).toBe('Classification only')
    expect(screen.getByText('Browser exposure only').textContent).toBe('Browser exposure only')
    expect(screen.getByText('Verification only').textContent).toBe('Verification only')
    expect(screen.getByText('Surface array').textContent).toBe('Surface array')
    expect(screen.getByText('Surface string').textContent).toBe('Surface string')
    expect(screen.getAllByText(/code-proven/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/public-safe/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/source-backed/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/markdown, renderer/i).length).toBeGreaterThan(0)
  })

  it('renders simple tables with dynamic columns', () => {
    render(
      <GeneratedSimpleTable
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'path', header: 'Path' },
        ]}
        rows={[{ name: 'planner', path: 'features/planner/' }]}
      />,
    )

    expect(screen.getByText('planner').textContent).toBe('planner')
    expect(screen.getByText('features/planner/').textContent).toBe('features/planner/')
  })
})
