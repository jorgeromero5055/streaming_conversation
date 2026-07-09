import { describe, it, expect } from 'vitest'

// Walking-skeleton smoke test: its only job is to prove the test runner and
// (soon) CI pipeline work. It can't fail on its own, so once it's green we know
// the machinery is sound and any future red result is our real code breaking.
describe('smoke', () => {
  it('runs the test pipeline', () => {
    expect(true).toBe(true)
  })
})
