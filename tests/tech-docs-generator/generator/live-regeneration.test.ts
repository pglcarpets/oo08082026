import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRegenerationCoordinator } from '../../../tech-docs-generator/scripts/live-regeneration'
import { repoLivePlugin } from '../../../tech-docs-generator/scripts/vite-plugin-repo-live'
import { LIVE_WATCH_ROOTS } from '../../../tech-docs-generator/scripts/output-contract.mjs'

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('live regeneration coordinator', () => {
  const repoRoot = path.resolve('fixture-repo')

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('debounces a pre-run burst into one run', async () => {
    vi.useFakeTimers()
    const runs: string[] = []
    const coordinator = createRegenerationCoordinator(
      async () => {
        runs.push('run')
        await Promise.resolve()
      },
      { repoRoot, debounceMs: 150 },
    )

    coordinator.request(path.join(repoRoot, 'site/app/(site)/page.tsx'))
    coordinator.request(path.join(repoRoot, 'site/app/api/products/route.ts'))
    await vi.advanceTimersByTimeAsync(150)
    await coordinator.idle()

    expect(runs).toHaveLength(1)
    coordinator.close()
  })

  it('queues exactly one follow-up while a run is active', async () => {
    const first = deferred<void>()
    const started = deferred<void>()
    const runs: number[] = []
    const coordinator = createRegenerationCoordinator(
      async ({ runNumber }) => {
        runs.push(runNumber)
        if (runNumber === 1) {
          started.resolve()
          await first.promise
        }
      },
      { repoRoot, debounceMs: 0 },
    )

    coordinator.request(path.join(repoRoot, 'site/app/page.tsx'))
    await started.promise
    coordinator.request(path.join(repoRoot, 'package.json'))
    first.resolve()
    await coordinator.idle()

    expect(runs).toEqual([1, 2])
    coordinator.close()
  })

  it('ignores excluded repository roots', async () => {
    const runs: number[] = []
    const coordinator = createRegenerationCoordinator(
      async ({ runNumber }) => {
        runs.push(runNumber)
      },
      { repoRoot, debounceMs: 0 },
    )

    coordinator.request(path.join(repoRoot, 'archive/secret.ts'))
    coordinator.request(path.join(repoRoot, 'websites/ref/index.html'))
    coordinator.request(path.join(repoRoot, '.archive/legacy.ts'))
    coordinator.request(path.join(repoRoot, '.websites/demo/page.tsx'))
    coordinator.request(path.join(repoRoot, 'generated-documents/data/overview.json'))
    await coordinator.idle()

    expect(runs).toHaveLength(0)
    coordinator.close()
  })

  it('ignores paths outside the repository root', async () => {
    const runs: number[] = []
    const coordinator = createRegenerationCoordinator(
      async ({ runNumber }) => {
        runs.push(runNumber)
      },
      { repoRoot, debounceMs: 0 },
    )

    coordinator.request(path.resolve(repoRoot, '..', 'outside.ts'))
    await coordinator.idle()

    expect(runs).toHaveLength(0)
    coordinator.close()
  })

  it('recovers after a failed run and processes the next allowed request', async () => {
    let failOnce = true
    const runs: number[] = []
    const coordinator = createRegenerationCoordinator(
      async ({ runNumber }) => {
        runs.push(runNumber)
        if (failOnce) {
          failOnce = false
          throw new Error('generation failed')
        }
      },
      { repoRoot, debounceMs: 0 },
    )

    coordinator.request(path.join(repoRoot, 'site/page.tsx'))
    await coordinator.idle()
    coordinator.request(path.join(repoRoot, 'site/other.tsx'))
    await coordinator.idle()

    expect(runs).toEqual([1, 2])
    coordinator.close()
  })
})

describe('repo live vite plugin', () => {
  it('watches explicit allowed roots and ignores excluded roots', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const repoRoot = path.resolve('fixture-repo')
    const added: string[] = []
    const generateAll = vi.fn(async () => ({}))
    vi.doMock('../../scripts/generate-all.mjs', () => ({ generateAll }))

    const server = {
      watcher: {
        add: vi.fn((watchPath: string) => {
          added.push(watchPath)
        }),
        on: vi.fn(),
      },
      ws: { send: vi.fn() },
      config: { logger: { error: vi.fn() } },
    }

    const plugin = repoLivePlugin({ repoRoot })
    const hook = plugin.configureServer
    expect(hook).toBeTypeOf('function')
    if (typeof hook === 'function') {
      await (hook as (this: unknown, ...args: unknown[]) => unknown).call(plugin, server)
    }

    for (const watchRoot of LIVE_WATCH_ROOTS) {
      expect(added).toContain(path.join(repoRoot, watchRoot))
    }
    expect(added.some((watchPath) => watchPath.includes('archive'))).toBe(false)
    expect(added.some((watchPath) => watchPath.includes('websites'))).toBe(false)
    expect(server.watcher.on).toHaveBeenCalledWith('all', expect.any(Function))
  })
})