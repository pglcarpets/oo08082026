import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  deploymentBlockers,
  deploymentEnvironmentVariables,
  handoverDeployContext,
  releaseGateSteps,
  vercelConfigRecords,
} from '../../tech-docs-generator/src/data/deploymentData'
import { Deployment } from '../../tech-docs-generator/src/pages/Deployment'

afterEach(() => {
  cleanup()
})

describe('Deployment page (live generated facts)', () => {
  it('renders live vercel / release-gate facts and real env names', () => {
    expect(vercelConfigRecords.length).toBeGreaterThan(0)
    expect(releaseGateSteps.length).toBeGreaterThan(0)
    expect(releaseGateSteps.every((step) => step.sourcePath === 'package.json')).toBe(true)

    const framework = vercelConfigRecords.find((record) => record.sourcePointer === 'framework')
    expect(framework?.value).toBe('nextjs')
    expect(framework?.sourcePath).toBe('vercel.json')

    render(<Deployment />)

    expect(screen.getByText('Framework').textContent).toBe('Framework')
    expect(screen.getByText('nextjs').textContent).toBe('nextjs')

    if (deploymentBlockers.length === 0 && handoverDeployContext.length === 0) {
      expect(
        screen.getByText('No generated deploy blocker records in the current snapshot.').textContent,
      ).toBe('No generated deploy blocker records in the current snapshot.')
    }

    expect(deploymentEnvironmentVariables.length).toBeGreaterThan(0)
    for (const env of deploymentEnvironmentVariables.slice(0, 3)) {
      expect(screen.getByText(env.name).textContent).toBe(env.name)
    }
  })
})
