import { LOG_LIMIT } from '../config/constants'
import { getEncrypted, setEncrypted } from './secureStore'
import { sanitizeLogEvent } from './logSchema'

const LOGS_KEY = 'diagnostic_logs'
const LOG_OPT_IN_KEY = 'diagnostic_opt_in'
const LOG_OPT_IN_EXPIRES_KEY = 'diagnostic_opt_in_expires_at'
const DEV_LOG_OPT_IN_KEY = 'diagnostic_dev_opt_in'
const isDevBuild = import.meta.env.DEV
const OPT_IN_DURATION_MS = 15 * 60 * 1000
export type LogEvent = {
  timestamp: string
  event: string
  status?: string
  brokerHash?: string
  metadata?: Record<string, string>
}

export async function getLogOptIn() {
  const status = await getLogOptInStatus()
  return status.enabled
}

export async function setLogOptIn(enabled: boolean) {
  if (!enabled) {
    await setEncrypted(LOG_OPT_IN_KEY, false)
    await setEncrypted(LOG_OPT_IN_EXPIRES_KEY, '')
    return
  }

  const expiresAt = new Date(Date.now() + OPT_IN_DURATION_MS).toISOString()
  await setEncrypted(LOG_OPT_IN_KEY, true)
  await setEncrypted(LOG_OPT_IN_EXPIRES_KEY, expiresAt)
}

export async function getLogOptInStatus() {
  const enabled = (await getEncrypted<boolean>(LOG_OPT_IN_KEY)) ?? false
  const expiresAt = (await getEncrypted<string>(LOG_OPT_IN_EXPIRES_KEY)) ?? ''

  if (!enabled) {
    return { enabled: false, expiresAt: '' }
  }

  const expiresMs = Date.parse(expiresAt)
  if (!expiresAt || Number.isNaN(expiresMs) || Date.now() >= expiresMs) {
    await setEncrypted(LOG_OPT_IN_KEY, false)
    await setEncrypted(LOG_OPT_IN_EXPIRES_KEY, '')
    return { enabled: false, expiresAt: '' }
  }

  return { enabled: true, expiresAt }
}

export async function getDevLogOptIn() {
  const stored = await getEncrypted<boolean>(DEV_LOG_OPT_IN_KEY)
  return stored ?? false
}

export async function setDevLogOptIn(enabled: boolean) {
  if (!isDevBuild) return
  await setEncrypted(DEV_LOG_OPT_IN_KEY, enabled)
}

export async function logEvent(event: string, details: Partial<LogEvent> = {}) {
  const optInStatus = await getLogOptInStatus()
  const optIn = optInStatus.enabled
  const devOptIn = isDevBuild ? await getDevLogOptIn() : false
  if (!optIn && !devOptIn) return
  const sanitized = sanitizeLogEvent(event, {
    status: details.status,
    brokerHash: details.brokerHash,
    metadata: details.metadata,
  })
  if (!sanitized) return

  const existing = (await getEncrypted<LogEvent[]>(LOGS_KEY)) ?? []
  const next: LogEvent[] = [
    {
      timestamp: new Date().toISOString(),
      event: sanitized.event,
      status: sanitized.status,
      brokerHash: sanitized.brokerHash,
      metadata: sanitized.metadata,
    },
    ...existing,
  ].slice(0, LOG_LIMIT)

  await setEncrypted(LOGS_KEY, next)
}

export async function exportLogsAsText() {
  const logs = (await getEncrypted<LogEvent[]>(LOGS_KEY)) ?? []
  if (logs.length === 0) return ''
  return logs
    .map((log) => {
      const meta = log.metadata ? ` ${JSON.stringify(log.metadata)}` : ''
      return `${log.timestamp} ${log.event} ${log.status ?? ''} ${log.brokerHash ?? ''}${meta}`.trim()
    })
    .join('\n')
}

export async function wipeLogs() {
  await setEncrypted(LOGS_KEY, [])
}
