import type { SubscriptionSnapshot } from './subscription'

export type SubscriptionAccessCopy = {
  statusLabel: 'Checking' | 'Active' | 'Inactive'
  description: string
}

function formatSubscriptionDate(value: string | null, locale?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function buildSubscriptionAccessCopy(
  snapshot: SubscriptionSnapshot | null,
  locale?: string,
): SubscriptionAccessCopy {
  if (!snapshot) {
    return {
      statusLabel: 'Checking',
      description: 'Checking with Apple...',
    }
  }

  const expirationLabel = formatSubscriptionDate(snapshot.access?.expiresAt ?? null, locale)

  if (snapshot.active) {
    if (snapshot.access?.state === 'inGracePeriod') {
      return {
        statusLabel: 'Active',
        description: 'Access active during Apple’s billing grace period.',
      }
    }

    if (expirationLabel && snapshot.access?.willAutoRenew === true) {
      return {
        statusLabel: 'Active',
        description: `Access active. Renews on ${expirationLabel}.`,
      }
    }

    if (expirationLabel && snapshot.access?.willAutoRenew === false) {
      return {
        statusLabel: 'Active',
        description: `Access active until ${expirationLabel}. Renewal is off.`,
      }
    }

    return {
      statusLabel: 'Active',
      description:
        snapshot.access?.willAutoRenew === false
          ? 'Access active. Renewal is off.'
          : 'Access active on this device.',
    }
  }

  if (snapshot.access?.state === 'inBillingRetryPeriod') {
    return {
      statusLabel: 'Inactive',
      description: 'Access inactive. Apple is retrying billing.',
    }
  }

  if (snapshot.access?.state === 'revoked') {
    return {
      statusLabel: 'Inactive',
      description: 'Access inactive. Apple ended this access.',
    }
  }

  if (expirationLabel) {
    return {
      statusLabel: 'Inactive',
      description: `Access inactive. Ended ${expirationLabel}.`,
    }
  }

  return {
    statusLabel: 'Inactive',
    description: 'Not active on this device.',
  }
}
