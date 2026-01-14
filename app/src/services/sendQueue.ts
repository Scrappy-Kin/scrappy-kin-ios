import type { Broker } from './brokerStore'
import { buildDeletionBody, buildDeletionSubject } from './emailTemplate'
import { sendEmail } from './gmailSend'
import { getUserProfile } from './userProfile'
import { initializeQueue, resetFailedToPending, setQueue, summarizeQueue, updateQueueItem } from './queueStore'

function classifyError(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  const status = (error as { status?: number }).status

  if (status === 401 || status === 403) return 'auth'
  if (typeof status === 'number' && status >= 400 && status < 500) return 'gmail_4xx'
  if (typeof status === 'number' && status >= 500) return 'gmail_5xx'
  if (message.toLowerCase().includes('gmail')) return 'auth'
  if (error instanceof TypeError) return 'network'
  return 'unknown'
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendAll(brokers: Broker[], brokerIds: string[], onProgress?: (summary: ReturnType<typeof summarizeQueue>) => void) {
  const profile = await getUserProfile()
  if (!profile) {
    throw new Error('Profile not set. Please complete your profile before sending.')
  }

  const queue = await initializeQueue(brokerIds)
  let summary = summarizeQueue(queue)
  onProgress?.(summary)

  for (const item of queue) {
    if (item.status !== 'pending') continue

    const broker = brokers.find((entry) => entry.id === item.brokerId)
    if (!broker) {
      const updated = await updateQueueItem({
        ...item,
        status: 'failed',
        errorCode: 'unknown',
        lastAttemptAt: new Date().toISOString(),
      })
      summary = summarizeQueue(updated)
      onProgress?.(summary)
      continue
    }

    try {
      await sendEmail({
        to: broker.contactEmail,
        subject: buildDeletionSubject(),
        body: buildDeletionBody(broker, profile),
        replyTo: profile.email,
      })

      const updated = await updateQueueItem({
        ...item,
        status: 'sent',
        lastAttemptAt: new Date().toISOString(),
      })
      summary = summarizeQueue(updated)
      onProgress?.(summary)
    } catch (error) {
      const updated = await updateQueueItem({
        ...item,
        status: 'failed',
        errorCode: classifyError(error),
        lastAttemptAt: new Date().toISOString(),
      })
      summary = summarizeQueue(updated)
      onProgress?.(summary)
    }

    await delay(1000)
  }

  return summary
}

export async function retryFailed(brokers: Broker[], brokerIds: string[], onProgress?: (summary: ReturnType<typeof summarizeQueue>) => void) {
  const updated = await resetFailedToPending()
  const filtered = updated.filter((entry) => brokerIds.includes(entry.brokerId))
  await setQueue(filtered)
  return sendAll(brokers, brokerIds, onProgress)
}
