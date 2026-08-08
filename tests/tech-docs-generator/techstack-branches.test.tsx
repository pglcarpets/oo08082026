import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { techCategories, techStack } from '../../tech-docs-generator/src/data/techStack'
import { TechStack } from '../../tech-docs-generator/src/pages/TechStack'

afterEach(() => {
  cleanup()
})

describe('TechStack page (live generated facts)', () => {
  it('renders live package inventory and filters by a real category', () => {
    expect(techStack.some((item) => item.name === 'next')).toBe(true)
    expect(techCategories).toEqual(expect.arrayContaining(['Runtime', 'Dev tooling', 'Docs package']))

    render(<TechStack />)

    expect(screen.getByRole('heading', { level: 1, name: /technology stack/i })).toBeTruthy()
    expect(screen.getAllByText('next').length).toBeGreaterThan(0)

    const runtimeCount = techStack.filter((item) => item.category === 'Runtime').length
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`runtime \\(${runtimeCount}\\)`, 'i') }))
    expect(screen.getByRole('heading', { level: 2, name: /runtime/i })).toBeTruthy()
    expect(screen.getAllByText('next').length).toBeGreaterThan(0)
  })
})
