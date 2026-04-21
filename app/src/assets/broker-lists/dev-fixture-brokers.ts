import brokersData from './email-only-brokers.v1.0.1.json'
import type { Broker } from '../../services/brokerStore'

const sourceBrokers = Array.isArray(brokersData)
  ? (brokersData as Broker[])
  : ((brokersData as { brokers: Broker[] }).brokers ?? [])

function buildFixtureEmail(id: string) {
  return `testbot+${id.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}@scrappykin.com`
}

export const devFixtureBrokers: Broker[] = sourceBrokers.map((broker) => ({
  ...broker,
  contactEmail: buildFixtureEmail(broker.id),
}))
