import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'
import { LIVE_WATCH_ROOTS } from './output-contract.mjs'
import { createRegenerationCoordinator, isRegenerationInput } from './live-regeneration.ts'

type RepoLivePluginOptions = {
  repoRoot: string
}

async function publishDocsAndData(repoRoot: string) {
  const { generateAll } = await import('./generate-all.mjs')
  await generateAll({ repoRoot })
}

function reportGenerationError(server: ViteDevServer, error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? (error.stack ?? message) : message
  server.config.logger.error(`[oando-repo-live] ${message}`)
  server.ws.send({
    type: 'error',
    err: {
      message,
      stack,
    },
  })
}

export function repoLivePlugin({ repoRoot }: RepoLivePluginOptions): Plugin {
  return {
    name: 'oando-repo-live',
    async configureServer(server) {
      const runGeneration = async () => {
        await publishDocsAndData(repoRoot)
        server.ws.send({ type: 'full-reload' })
      }

      const coordinator = createRegenerationCoordinator(runGeneration, {
        repoRoot,
        onError: (error) => reportGenerationError(server, error),
      })

      for (const watchRoot of LIVE_WATCH_ROOTS) {
        server.watcher.add(path.join(repoRoot, watchRoot))
      }

      server.watcher.on('all', (_event, filePath) => {
        if (!isRegenerationInput(repoRoot, filePath)) return
        coordinator.request(filePath)
      })

      try {
        await publishDocsAndData(repoRoot)
      } catch (error) {
        reportGenerationError(server, error)
      }

      return () => {
        coordinator.close()
      }
    },
  }
}
