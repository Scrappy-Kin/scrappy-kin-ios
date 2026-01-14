import type { Broker } from './brokerStore'
import type { UserProfile } from './userProfile'

export function buildDeletionSubject() {
  return 'Data Deletion Request under GDPR Article 17 / CCPA \u00a7 1798.105'
}

export function buildDeletionBody(broker: Broker, profile: UserProfile) {
  return `Dear ${broker.name},\n\nI am writing to request the deletion of all personal information you hold about me under GDPR Article 17 (Right to Erasure) and/or California Consumer Privacy Act (CCPA) \u00a7 1798.105.\n\nMy details for record matching:\n- Full name: ${profile.fullName}\n- Email: ${profile.email}\n- Location: ${profile.city}, ${profile.country} ${profile.partialPostcode}\n\nPlease confirm deletion within 30 days as required by law.\n\nThank you,\n${profile.fullName}\n`
}
