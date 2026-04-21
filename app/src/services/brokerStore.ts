import brokersData from '../assets/broker-lists/email-only-brokers.v1.0.1.json'
import { devFixtureBrokers } from '../assets/broker-lists/dev-fixture-brokers'
import { isDevAppLane } from '../config/buildInfo'
import { getEncrypted, setEncrypted } from './secureStore'
import type { QueueItem } from './queueStore'

export type Broker = {
  id: string
  name: string
  domain?: string
  contactEmail: string
  tier?: string
  childCompanies?: string[]
  inTop30?: boolean
  verifiedResolutions?: number
  starterOrder?: number
}

export type BrokerCatalogSummary = {
  starterCount: number
  totalBrokerCount: number
  remainingBrokerCount: number
}

const SELECTED_KEY = 'selected_brokers'
let brokerCatalogPromise: Promise<Broker[]> | null = null

async function resolveBrokerCatalog(): Promise<Broker[]> {
  if (await isDevAppLane()) {
    return devFixtureBrokers
  }

  if (Array.isArray(brokersData)) {
    return brokersData as Broker[]
  }
  if (brokersData && typeof brokersData === 'object' && 'brokers' in brokersData) {
    return (brokersData as { brokers: Broker[] }).brokers
  }
  return []
}

export async function loadBrokerCatalog(): Promise<Broker[]> {
  if (!brokerCatalogPromise) {
    brokerCatalogPromise = resolveBrokerCatalog()
  }
  return brokerCatalogPromise
}

export async function loadBrokers(): Promise<Broker[]> {
  return loadBrokerCatalog()
}

export function isStarterBroker(broker: Broker) {
  return typeof broker.starterOrder === 'number'
}

export function getStarterBrokers(brokers: Broker[]) {
  return brokers
    .filter(isStarterBroker)
    .sort((left, right) => (left.starterOrder ?? Number.MAX_SAFE_INTEGER) - (right.starterOrder ?? Number.MAX_SAFE_INTEGER))
}

export function buildBrokerCatalogSummary(brokers: Broker[]): BrokerCatalogSummary {
  const starterCount = getStarterBrokers(brokers).length
  const totalBrokerCount = brokers.length

  return {
    starterCount,
    totalBrokerCount,
    remainingBrokerCount: Math.max(totalBrokerCount - starterCount, 0),
  }
}

export async function loadStarterBrokers() {
  return getStarterBrokers(await loadBrokerCatalog())
}

export async function loadStarterBrokerIds() {
  return (await loadStarterBrokers()).map((broker) => broker.id)
}

export async function loadBrokerCatalogSummary() {
  return buildBrokerCatalogSummary(await loadBrokerCatalog())
}

export async function getSelectedBrokerIds() {
  return (await getEncrypted<string[]>(SELECTED_KEY)) ?? []
}

export async function setSelectedBrokerIds(ids: string[]) {
  await setEncrypted(SELECTED_KEY, ids)
}

export function getSentBrokerIds(queue: QueueItem[]) {
  return queue.filter((item) => item.status === 'sent').map((item) => item.brokerId)
}

export function filterSelectableBrokers(brokers: Broker[], queue: QueueItem[]) {
  const sentBrokerIds = new Set(getSentBrokerIds(queue))
  return brokers.filter((broker) => !sentBrokerIds.has(broker.id))
}

export function getBrokerDescription(broker: Broker) {
  if (!broker.childCompanies || broker.childCompanies.length === 0) {
    return undefined
  }

  const lowerName = broker.name.toLowerCase()
  const hiddenInName = broker.childCompanies.every((child) =>
    lowerName.includes(child.toLowerCase()),
  )

  if (hiddenInName) {
    return undefined
  }

  return `Includes: ${broker.childCompanies.join(', ')}`
}
