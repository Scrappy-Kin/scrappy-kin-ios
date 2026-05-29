import { getEncrypted, setEncrypted } from './secureStore'
import { getQueue } from './queueStore'
import type { Broker } from './brokerStore'

export type SentLogEntry = {
  brokerId: string
  brokerName: string
  sentAt: string
  referenceId: string
}

const SENT_LOG_KEY = 'sent_log'

export async function getSentLog(): Promise<SentLogEntry[]> {
  return (await getEncrypted<SentLogEntry[]>(SENT_LOG_KEY)) ?? []
}

/**
 * Returns the durable sentLog merged with any sent items still in queueStore
 * that have not yet been written to sentLog. This handles existing users whose
 * send history pre-dates the sentLog store, without losing or duplicating records.
 */
export async function getMergedSentLog(brokers: Broker[] = []): Promise<SentLogEntry[]> {
  const [log, queue] = await Promise.all([getSentLog(), getQueue()])

  const logKeys = new Set(log.map((e) => `${e.brokerId}:${e.referenceId}`))
  const brokerNameById = new Map(brokers.map((broker) => [broker.id, broker.name]))

  const queueEntries: SentLogEntry[] = queue
    .filter((item) => item.status === 'sent' && !logKeys.has(`${item.brokerId}:${item.referenceId}`))
    .map((item) => ({
      brokerId: item.brokerId,
      brokerName: brokerNameById.get(item.brokerId) ?? item.brokerId,
      sentAt: item.lastAttemptAt ?? new Date(0).toISOString(),
      referenceId: item.referenceId,
    }))

  return [...log, ...queueEntries]
}

export async function appendSentLogEntries(entries: SentLogEntry[]): Promise<SentLogEntry[]> {
  if (entries.length === 0) return getSentLog()
  const existing = await getSentLog()
  const next = [...existing, ...entries]
  await setEncrypted(SENT_LOG_KEY, next)
  return next
}

export async function clearSentLog(): Promise<void> {
  await setEncrypted(SENT_LOG_KEY, [])
}
