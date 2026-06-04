import { describe, expect, it } from 'vitest'
import catalogData from '../assets/broker-lists/email-only-brokers.v1.0.1.json'
import {
  buildBrokerCatalogSummary,
  getStarterBrokers,
  type Broker,
} from './brokerStore'
import {
  computeBrokerEligibility,
  deriveRoundState,
  getEligibleBrokerIds,
} from './roundState'
import type { SentLogEntry } from './sentLog'

const LAUNCH_CATALOG_COUNT = 28
const STARTER_COUNT = 5
const STARTER_IDS = [
  'data-axle-com',
  'zoominfo-com',
  'truepeoplesearch-com',
  'censia-com',
  'peopledatalabs-com',
]

function brokersFromCatalog(): Broker[] {
  return catalogData as Broker[]
}

function sentEntry(broker: Broker): SentLogEntry {
  return {
    brokerId: broker.id,
    brokerName: broker.name,
    sentAt: '2026-06-04T12:00:00.000Z',
    referenceId: `REF-${broker.id}`,
  }
}

describe('launch broker catalog', () => {
  it('contains the final 28-broker launch catalog and five starter brokers', () => {
    const brokers = brokersFromCatalog()
    const starterBrokers = getStarterBrokers(brokers)
    const summary = buildBrokerCatalogSummary(brokers)

    expect(summary.totalBrokerCount).toBe(LAUNCH_CATALOG_COUNT)
    expect(summary.starterCount).toBe(STARTER_COUNT)
    expect(summary.remainingBrokerCount).toBe(LAUNCH_CATALOG_COUNT - STARTER_COUNT)
    expect(starterBrokers.map((broker) => broker.id)).toEqual(STARTER_IDS)
  })

  it('keeps the public runtime catalog sanitized while preserving send paths', () => {
    const brokers = brokersFromCatalog()
    const dataAxle = brokers.find((broker) => broker.id === 'data-axle-com')
    const brokerKeys = new Set(brokers.flatMap((broker) => Object.keys(broker)))

    expect(dataAxle?.contactEmail).toBe('privacyteam@data-axle.com')
    expect(brokerKeys.has('evidence')).toBe(false)
  })

  it('leaves only non-starter launch brokers eligible after the free starter round is sent, () => {
    const brokers = brokersFromCatalog()
    const starterSentLog = getStarterBrokers(brokers).map(sentEntry)
    const eligibility = computeBrokerEligibility(
      brokers,
      starterSentLog,
      new Date('2026-06-05T12:00:00.000Z'),
    )
    const eligibleBrokerIds = getEligibleBrokerIds(eligibility)

    expect(eligibleBrokerIds).toHaveLength(LAUNCH_CATALOG_COUNT - STARTER_COUNT)
    expect(eligibleBrokerIds.some((id) => STARTER_IDS.includes(id))).toBe(false)
  })

  it('derives all-caught-up only against the current 28-broker launch include set', () => {
    const brokers = brokersFromCatalog()
    const sentLog = [
      ...brokers.map(sentEntry),
      {
        brokerId: 'legacy-not-in-launch',
        brokerName: 'Legacy Broker',
        sentAt: '2026-06-04T12:00:00.000Z',
        referenceId: 'REF-LEGACY',
      },
    ]

    const state = deriveRoundState({
      brokers,
      sentLog,
      subscriptionActive: true,
      gmailConnected: true,
      totalSentCount: sentLog.length,
      now: new Date('2026-06-05T12:00:00.000Z'),
    })

    expect(state.stateId).toBe('all_caught_up')
    expect(state.metricValue).toBe(LAUNCH_CATALOG_COUNT)
    expect(state.eligibleBrokerIds).toEqual([])
  })
})
