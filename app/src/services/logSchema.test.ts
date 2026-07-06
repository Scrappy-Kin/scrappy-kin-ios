import { describe, expect, it } from 'vitest'
import {
  getDiagnosticCaptureDescriptions,
  sanitizeLogEvent,
} from './logSchema'

describe('diagnostic log schema', () => {
  it('drops unknown events', () => {
    expect(sanitizeLogEvent('profile_email_changed', {})).toBeNull()
  })

  it('drops metadata keys that are not explicitly allowed for an event', () => {
    const sanitized = sanitizeLogEvent('send_batch_started', {
      metadata: {
        buildMode: 'production',
        executionLane: 'qa-device',
        count: '5',
        sendSafetyMode: 'demo_recipients',
        email: 'person@example.com',
        brokerName: 'Broker Example',
        rawError: 'Raw platform message',
      },
    })

    expect(sanitized).toEqual({
      event: 'send_batch_started',
      metadata: {
        buildMode: 'production',
        executionLane: 'qa-device',
        count: '5',
        sendSafetyMode: 'demo_recipients',
      },
    })
  })

  it('generates the human-readable diagnostics capture list from the schema', () => {
    expect(getDiagnosticCaptureDescriptions()).toEqual([
      'Gmail connection status',
      'Subscription purchase and restore status',
      'Batch send status',
    ])
  })
})
