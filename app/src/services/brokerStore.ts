import brokersData from '../assets/broker-lists/email-only-brokers.v1.0.1.json'
import { getEncrypted, setEncrypted } from './secureStore'

export type Broker = {
  id: string
  name: string
  domain?: string
  contactEmail: string
  tier?: string
  childCompanies?: string[]
}

const SELECTED_KEY = 'selected_brokers'

export async function loadBrokers(): Promise<Broker[]> {
  if (Array.isArray(brokersData)) {
    return brokersData as Broker[]
  }
  if (brokersData && typeof brokersData === 'object' && 'brokers' in brokersData) {
    return (brokersData as { brokers: Broker[] }).brokers
  }
  return []
}

export async function getSelectedBrokerIds() {
  return (await getEncrypted<string[]>(SELECTED_KEY)) ?? []
}

export async function setSelectedBrokerIds(ids: string[]) {
  await setEncrypted(SELECTED_KEY, ids)
}
