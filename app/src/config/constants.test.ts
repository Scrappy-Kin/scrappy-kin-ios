import { describe, expect, it } from 'vitest'
import { OAUTH_PENDING_STATE_TTL_MS, OAUTH_TIMEOUT_MS } from './constants'

describe('OAuth timing constants', () => {
  it('keeps the browser completion timeout aligned with pending state lifetime', () => {
    expect(OAUTH_TIMEOUT_MS).toBe(10 * 60 * 1000)
    expect(OAUTH_PENDING_STATE_TTL_MS).toBe(OAUTH_TIMEOUT_MS)
  })
})
