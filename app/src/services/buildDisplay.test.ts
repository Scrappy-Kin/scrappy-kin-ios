import { describe, expect, it } from 'vitest'
import { formatExecutionLane, formatVersionCreatedAt } from './buildDisplay'

describe('build display copy', () => {
  it('formats build time without throwing during Settings render', () => {
    expect(formatVersionCreatedAt('2026-07-06T17:19:06.560Z')).toBe('Jul 6, 2026, 5:19 PM UTC')
  })

  it('keeps QADevice distinct from production mode', () => {
    expect(formatExecutionLane('qa-device')).toBe('QA device')
    expect(formatExecutionLane('production')).toBe('Production')
    expect(formatExecutionLane('dev')).toBe('Development')
  })
})
