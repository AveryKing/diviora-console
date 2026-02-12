import { describe, it, expect } from 'vitest'

describe('Bootstrap', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should verify Zod is available', async () => {
    const { z } = await import('zod')
    const schema = z.string()
    expect(schema.parse('hello')).toBe('hello')
  })
})
