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
