export type LogEventSchema = {
  description: string
  captureDescription: string
  status?: readonly string[]
  brokerHash?: boolean
  metadataKeys?: readonly string[]
}

export const LOG_EVENT_SCHEMA: Record<string, LogEventSchema> = {
  gmail_connect_started: {
    description: 'Gmail connection started.',
    captureDescription: 'Gmail connection status',
    metadataKeys: ['buildMode', 'executionLane'],
  },
  gmail_connect_success: {
    description: 'Gmail connection completed.',
    captureDescription: 'Gmail connection status',
    metadataKeys: ['buildMode', 'executionLane'],
  },
  gmail_connect_failed: {
    description: 'Gmail connection did not complete.',
    captureDescription: 'Gmail connection status',
    metadataKeys: ['buildMode', 'executionLane', 'failureCategory'],
  },
  gmail_disconnected: {
    description: 'Gmail was disconnected.',
    captureDescription: 'Gmail connection status',
    metadataKeys: ['buildMode', 'executionLane'],
  },
  subscription_product_loaded: {
    description: 'Subscription product information loaded.',
    captureDescription: 'Subscription purchase and restore status',
    metadataKeys: ['buildMode', 'executionLane', 'storekitStatusCategory'],
  },
  subscription_product_failed: {
    description: 'Subscription product information did not load.',
    captureDescription: 'Subscription purchase and restore status',
    metadataKeys: ['buildMode', 'executionLane', 'storekitStatusCategory', 'failureCategory'],
  },
  subscription_purchase_started: {
    description: 'Subscription purchase started.',
    captureDescription: 'Subscription purchase and restore status',
    metadataKeys: ['buildMode', 'executionLane'],
  },
  subscription_purchase_success: {
    description: 'Subscription purchase completed.',
    captureDescription: 'Subscription purchase and restore status',
    metadataKeys: ['buildMode', 'executionLane', 'storekitStatusCategory'],
  },
  subscription_purchase_cancelled: {
    description: 'Subscription purchase was cancelled.',
    captureDescription: 'Subscription purchase and restore status',
    metadataKeys: ['buildMode', 'executionLane', 'storekitStatusCategory'],
  },
  subscription_purchase_failed: {
    description: 'Subscription purchase did not complete.',
    captureDescription: 'Subscription purchase and restore status',
    metadataKeys: ['buildMode', 'executionLane', 'storekitStatusCategory', 'failureCategory'],
  },
  subscription_restore_started: {
    description: 'Subscription restore started.',
    captureDescription: 'Subscription purchase and restore status',
    metadataKeys: ['buildMode', 'executionLane'],
  },
  subscription_restore_success: {
    description: 'Subscription restore found active access.',
    captureDescription: 'Subscription purchase and restore status',
    metadataKeys: ['buildMode', 'executionLane', 'storekitStatusCategory'],
  },
  subscription_restore_none: {
    description: 'Subscription restore found no active access.',
    captureDescription: 'Subscription purchase and restore status',
    metadataKeys: ['buildMode', 'executionLane', 'storekitStatusCategory'],
  },
  subscription_restore_failed: {
    description: 'Subscription restore could not be checked.',
    captureDescription: 'Subscription purchase and restore status',
    metadataKeys: ['buildMode', 'executionLane', 'storekitStatusCategory', 'failureCategory'],
  },
  send_batch_started: {
    description: 'Batch send started.',
    captureDescription: 'Batch send status',
    metadataKeys: ['buildMode', 'executionLane', 'count', 'sendSafetyMode'],
  },
  send_batch_success: {
    description: 'Batch send completed.',
    captureDescription: 'Batch send status',
    metadataKeys: ['buildMode', 'executionLane', 'count', 'sendSafetyMode'],
  },
  send_batch_failed: {
    description: 'Batch send did not complete.',
    captureDescription: 'Batch send status',
    metadataKeys: ['buildMode', 'executionLane', 'count', 'sendSafetyMode', 'failureCategory'],
  },
}

export function getDiagnosticCaptureDescriptions() {
  return [...new Set(Object.values(LOG_EVENT_SCHEMA).map((schema) => schema.captureDescription))]
}

function sanitizeMetadata(
  metadata: Record<string, string | undefined> | undefined,
  allowedKeys: readonly string[] | undefined,
) {
  if (!metadata || !allowedKeys || allowedKeys.length === 0) return undefined

  const filtered: Record<string, string> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (allowedKeys.includes(key) && typeof value === 'string') {
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
    metadata?: Record<string, string | undefined>
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
