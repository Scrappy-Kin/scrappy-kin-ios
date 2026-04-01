import type { Broker } from './brokerStore'
import { SEND_DELAY_MS } from '../config/constants'
import { isVerboseDevLane } from '../config/buildInfo'
import { buildDeletionBody, buildDeletionSubject } from './emailTemplate'
import { sendEmail } from './gmailSend'
import { incrementTotalSentCount } from './metricsStore'
import { getDeletionTemplateDraft, resolveDeletionTemplate } from './templateStore'
import { getUserProfile } from './userProfile'
import { getQueue, initializeQueue, resetFailedToPending, setQueue, summarizeQueue, type QueueItem, updateQueueItem } from './queueStore'

function classifyError(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  const status = (error as { status?: number }).status
  const reason = (error as { reason?: string }).reason?.toLowerCase()

  if (reason) {
    return `gmail_${reason}`
  }
  if (status === 401 || status === 403) return 'auth'
  if (typeof status === 'number' && status >= 400 && status < 500) return 'gmail_4xx'
  if (typeof status === 'number' && status >= 500) return 'gmail_5xx'
  if (message.toLowerCase().includes('gmail')) return 'auth'
  if (error instanceof TypeError) return 'network'
  return 'unknown'
}

function buildErrorCode(item: QueueItem) {
  if (item.errorStatus && item.errorCode) {
    return `${item.errorStatus}:${item.errorCode}`
  }
  if (item.errorStatus) {
    return String(item.errorStatus)
  }
  if (item.errorCode) {
    return item.errorCode
  }
  return 'unknown'
}

export async function buildSendFailureMessage(queue: QueueItem[]) {
  const firstFailed = queue.find((item) => item.status === 'failed')
  if (!firstFailed) {
    return 'No emails were sent. Review Gmail settings and try again.'
  }

  const code = buildErrorCode(firstFailed)
  const isVerboseLane = await isVerboseDevLane()
  if (isVerboseLane && firstFailed.errorDetail) {
    return `No emails were sent. ${firstFailed.errorDetail} [${code}]`
  }

  return `No emails were sent. Review Gmail settings and try again. Error code: ${code}.`
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendAll(brokers: Broker[], brokerIds: string[], onProgress?: (summary: ReturnType<typeof summarizeQueue>) => void) {
  const profile = await getUserProfile()
  if (!profile) {
    throw new Error('Profile not set. Please complete your profile before sending.')
  }
  const template = resolveDeletionTemplate(profile, await getDeletionTemplateDraft())

  await initializeQueue(brokerIds)
  const queue = await resetFailedToPending()
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
        errorStatus: undefined,
        errorDetail: undefined,
        lastAttemptAt: new Date().toISOString(),
      })
      summary = summarizeQueue(updated)
      onProgress?.(summary)
      continue
    }

    try {
      const result = await sendEmail({
        to: broker.contactEmail,
        subject: buildDeletionSubject(item.referenceId),
        body: buildDeletionBody(broker, profile, item.referenceId, template),
        replyTo: profile.email,
      })

      const updated = await updateQueueItem({
        ...item,
        status: 'sent',
        errorCode: undefined,
        errorStatus: undefined,
        errorDetail: undefined,
        gmailMessageId: result.id,
        gmailThreadId: result.threadId,
        lastAttemptAt: new Date().toISOString(),
      })
      await incrementTotalSentCount(1)
      summary = summarizeQueue(updated)
      onProgress?.(summary)
    } catch (error) {
      const updated = await updateQueueItem({
        ...item,
        status: 'failed',
        errorCode: classifyError(error),
        errorStatus: (error as { status?: number }).status,
        errorDetail: error instanceof Error ? error.message : undefined,
        lastAttemptAt: new Date().toISOString(),
      })
      summary = summarizeQueue(updated)
      onProgress?.(summary)
    }

    await delay(SEND_DELAY_MS)
  }

  return summary
}

export async function retryFailed(brokers: Broker[], brokerIds: string[], onProgress?: (summary: ReturnType<typeof summarizeQueue>) => void) {
  const updated = await resetFailedToPending()
  const filtered = updated.filter((entry) => brokerIds.includes(entry.brokerId))
  await setQueue(filtered)
  return sendAll(brokers, brokerIds, onProgress)
}

export async function getSendFailureMessage() {
  const queue = await getQueue()
  return buildSendFailureMessage(queue)
}
