import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { ConsolePanel } from './ConsolePanel'

describe('ConsolePanel accessibility', () => {
  it('has no axe violations', async () => {
    const { container } = render(<ConsolePanel />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
