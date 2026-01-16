export type LogEventSchema = {
  status?: readonly string[]
  brokerHash?: boolean
  metadataKeys?: readonly string[]
}

export const LOG_EVENT_SCHEMA: Record<string, LogEventSchema> = {
  send_all_requested: {
    status: ['pending', 'success', 'failed'],
  },
}

function sanitizeMetadata(
  metadata: Record<string, string> | undefined,
  allowedKeys: readonly string[] | undefined,
) {
  if (!metadata || !allowedKeys || allowedKeys.length === 0) return undefined

  const filtered: Record<string, string> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (allowedKeys.includes(key)) {
      filtered[key] = value
    }
  }

  return Object.keys(filtered).length > 0 ? filtered : undefined
}

export function sanitizeLogEvent(
  event: string,
  details: {
    status?: string
    brokerHash?: string
    metadata?: Record<string, string>
  },
) {
  const schema = LOG_EVENT_SCHEMA[event]
  if (!schema) return null

  const sanitized: {
    event: string
    status?: string
    brokerHash?: string
    metadata?: Record<string, string>
  } = { event }

  if (schema.status && details.status && schema.status.includes(details.status)) {
    sanitized.status = details.status
  }

  if (schema.brokerHash && details.brokerHash) {
    sanitized.brokerHash = details.brokerHash
  }

  const metadata = sanitizeMetadata(details.metadata, schema.metadataKeys)
  if (metadata) {
    sanitized.metadata = metadata
  }

  return sanitized
}
