import { normalizeRepositoryInput } from './output-contract.mjs'

export type RegenerationRunContext = {
  runNumber: number
}

export type RegenerationCoordinator = {
  request: (inputPath: string) => void
  idle: () => Promise<void>
  close: () => void
}

export type RegenerationCoordinatorOptions = {
  repoRoot: string
  debounceMs?: number
  onError?: (error: unknown) => void
}

export function isRegenerationInput(repoRoot: string, inputPath: string): boolean {
  return normalizeRepositoryInput(repoRoot, inputPath) !== null
}

export function createRegenerationCoordinator(
  executeRun: (context: RegenerationRunContext) => Promise<void>,
  options: RegenerationCoordinatorOptions,
): RegenerationCoordinator {
  const debounceMs = options.debounceMs ?? 150
  let runNumber = 0
  let activeRun: Promise<void> | null = null
  let followUpPending = false
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let closed = false
  const idleWaiters: Array<() => void> = []

  function signalIdle() {
    if (!activeRun && !debounceTimer && !followUpPending) {
      const waiters = idleWaiters.splice(0)
      for (const resolve of waiters) {
        resolve()
      }
    }
  }

  function clearDebounceTimer() {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  function scheduleDebouncedRun() {
    if (closed) return
    clearDebounceTimer()
    if (debounceMs <= 0) {
      void startRun()
      return
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      void startRun()
    }, debounceMs)
  }

  async function startRun() {
    if (closed) return
    if (activeRun) {
      followUpPending = true
      return
    }

    runNumber += 1
    const currentRunNumber = runNumber
    activeRun = executeRun({ runNumber: currentRunNumber })
      .catch((error) => {
        options.onError?.(error)
      })
      .finally(() => {
        activeRun = null
        if (followUpPending) {
          followUpPending = false
          void startRun()
        } else {
          signalIdle()
        }
      })

    await activeRun
  }

  function request(inputPath: string) {
    if (closed) return
    if (!isRegenerationInput(options.repoRoot, inputPath)) return

    if (activeRun) {
      followUpPending = true
      return
    }

    scheduleDebouncedRun()
  }

  return {
    request,
    idle: () =>
      new Promise<void>((resolve) => {
        if (!activeRun && !debounceTimer && !followUpPending) {
          resolve()
          return
        }
        idleWaiters.push(resolve)
      }),
    close: () => {
      closed = true
      clearDebounceTimer()
      signalIdle()
    },
  }
}