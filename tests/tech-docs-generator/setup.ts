import { vi } from 'vitest'
import { getSharedRepoModel } from './helpers/shared-repo-model.mjs'

// Warm the generator model once per worker before heavy suites run.
getSharedRepoModel()

class IntersectionObserverMock {
  disconnect = vi.fn()
  observe = vi.fn()
  takeRecords = vi.fn()
  unobserve = vi.fn()
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
