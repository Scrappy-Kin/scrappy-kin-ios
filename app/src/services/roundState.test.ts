import { describe, it, expect } from 'vitest'
import { computeBrokerEligibility, deriveRoundState } from './roundState'
import type { Broker } from './brokerStore'
import type { SentLogEntry } from './sentLog'
import { ROUND_COOLDOWN_DAYS } from '../config/rounds'

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

const NOW = new Date('2025-06-01T12:00:00.000Z')

function broker(id: string): Broker {
  return { id, name: `Broker ${id}`, contactEmail: `opt-out@${id}.example` }
}

function sent(brokerId: string, daysAgo: number): SentLogEntry {
  const sentAt = new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
  return { brokerId, brokerName: `Broker ${brokerId}`, sentAt, referenceId: `REF-${brokerId}` }
}

// ---------------------------------------------------------------------------
// computeBrokerEligibility
// ---------------------------------------------------------------------------

describe('computeBrokerEligibility', () => {
  it('unsent broker is eligible', () => {
    const result = computeBrokerEligibility([broker('a')], [], NOW)
    expect(result[0].eligible).toBe(true)
    expect(result[0].nextEligibleAt).toBeNull()
  })

  it('broker sent yesterday is not eligible and has a next eligible date', () => {
    const result = computeBrokerEligibility([broker('a')], [sent('a', 1)], NOW)
    expect(result[0].eligible).toBe(false)
    expect(result[0].nextEligibleAt).not.toBeNull()
  })

  it('broker sent after cooldown is eligible', () => {
    const result = computeBrokerEligibility([broker('a')], [sent('a', ROUND_COOLDOWN_DAYS + 1)], NOW)
    expect(result[0].eligible).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// deriveRoundState
// ---------------------------------------------------------------------------

describe('deriveRoundState', () => {
  it('unsubscribed after a free send returns free_remaining_locked', () => {
    const result = deriveRoundState({
      brokers: [broker('a')],
      sentLog: [],
      subscriptionActive: false,
      gmailConnected: true,
      totalSentCount: 5,
      now: NOW,
    })
    expect(result.stateId).toBe('free_remaining_locked')
    expect(result.primaryActionKind).toBe('subscribe')
    expect(result.secondaryActionKind).toBe('view_sent')
  })

  it('subscribed + Gmail disconnected returns gmail_disconnected', () => {
    const result = deriveRoundState({
      brokers: [broker('a')],
      sentLog: [],
      subscriptionActive: true,
      gmailConnected: false,
      totalSentCount: 0,
      now: NOW,
    })
    expect(result.stateId).toBe('gmail_disconnected')
    expect(result.primaryActionKind).toBe('reconnect_gmail')
  })

  it('subscribed + all brokers recently sent returns all_caught_up with next round date', () => {
    const result = deriveRoundState({
      brokers: [broker('a'), broker('b')],
      sentLog: [sent('a', 1), sent('b', 2)],
      subscriptionActive: true,
      gmailConnected: true,
      totalSentCount: 2,
      now: NOW,
    })
    expect(result.stateId).toBe('all_caught_up')
    expect(result.primaryActionKind).toBe('none')
    expect(result.nextRoundOpensLabel).not.toBeNull()
  })

  it('subscribed + cooldown elapsed returns next_round_ready with eligible broker ids', () => {
    const result = deriveRoundState({
      brokers: [broker('a'), broker('b')],
      sentLog: [sent('a', ROUND_COOLDOWN_DAYS + 1), sent('b', ROUND_COOLDOWN_DAYS + 1)],
      subscriptionActive: true,
      gmailConnected: true,
      totalSentCount: 2,
      now: NOW,
    })
    expect(result.stateId).toBe('next_round_ready')
    expect(result.primaryActionKind).toBe('start_round')
    expect(result.eligibleBrokerIds).toEqual(['a', 'b'])
  })

  it('sent count uses sent log entries when current-catalog sent history is available', () => {
    // totalSentCount may include stale historical sends, but dashboard count should
    // describe the current catalog state when sent-log detail is available.
    const highTotalCount = deriveRoundState({
      brokers: [broker('a')],
      sentLog: [sent('a', 1)],
      subscriptionActive: true,
      gmailConnected: true,
      totalSentCount: 10,
      now: NOW,
    })
    expect(highTotalCount.metricValue).toBe(1)

    const highLogLength = deriveRoundState({
      brokers: [broker('a'), broker('b'), broker('c')],
      sentLog: [sent('a', 1), sent('b', 1), sent('c', 1)],
      subscriptionActive: true,
      gmailConnected: true,
      totalSentCount: 1,
      now: NOW,
    })
    expect(highLogLength.metricValue).toBe(3)
  })

  it('sent count ignores sent brokers outside the current launch catalog', () => {
    const result = deriveRoundState({
      brokers: [broker('a'), broker('b')],
      sentLog: [sent('a', 1), sent('b', 1), sent('stale-outside-catalog', 1)],
      subscriptionActive: true,
      gmailConnected: true,
      totalSentCount: 3,
      now: NOW,
    })

    expect(result.stateId).toBe('all_caught_up')
    expect(result.metricValue).toBe(2)
    expect(result.eligibleBrokerIds).toEqual([])
  })
})
