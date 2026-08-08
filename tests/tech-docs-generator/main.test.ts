import { describe, expect, it, vi } from 'vitest'

const mainMocks = vi.hoisted(() => {
  const render = vi.fn()
  const createRoot = vi.fn(() => ({ render }))
  return { render, createRoot }
})

vi.mock('react-dom/client', () => ({
  createRoot: mainMocks.createRoot,
}))

vi.mock('../../tech-docs-generator/src/App', () => ({
  default: () => null,
}))

describe('main entrypoint', () => {
  it('mounts the app into #root', async () => {
    document.body.innerHTML = '<div id="root"></div>'

    await import('../../tech-docs-generator/src/main')

    expect(mainMocks.createRoot).toHaveBeenCalledWith(document.getElementById('root'))
    expect(mainMocks.render).toHaveBeenCalled()
  })
})
