import type { Broker } from './brokerStore'
import type { UserProfile } from './userProfile'

// Keep this aligned with the tested ops template and minimization rules in
// `scrappy-kin-app/src/email/templates.js` and `scrappy-kin-app/PRIVACY_MINIMIZATION.md`.
// iOS is intentionally narrower (U.S.-first, user-sent via Gmail).

function formatReference(referenceId?: string) {
  return referenceId ? `SK-${referenceId.toUpperCase()}` : null
}

export type DeletionTemplateContent = {
  intro: string
  requestBlock: string
  signOff: string
}

function normalizeTemplateBlock(text: string) {
  return text.replace(/\r\n/g, '\n').trim()
}

export function buildDeletionSubject(referenceId?: string) {
  const formatted = formatReference(referenceId)
  return formatted ? `Personal Data Deletion Request [${formatted}]` : 'Personal Data Deletion Request'
}

export function buildDeletionRegulation() {
  return 'the California Consumer Privacy Act (CCPA) and similar state privacy laws'
}

export function buildDeletionIntro() {
  return `I am exercising my right under ${buildDeletionRegulation()} to request deletion of all personal data you hold about me.`
}

export function buildDeletionLocation(profile: UserProfile) {
  const parts: string[] = []
  if (profile.city) {
    parts.push(profile.city)
  }

  const region = [profile.state, profile.partialZip].filter(Boolean).join(' ')
  if (region) {
    parts.push(region)
  }

  return parts.join(', ')
}

export function buildDeletionRequestItems() {
  return [
    'Delete all personal data linked to this identity',
    'Cease any processing of my data',
    'Remove me from future data acquisitions by placing this identity on your suppression list',
    "Notify any third parties you've shared my data with to do the same",
  ]
}

export function buildDeletionOptOutItems() {
  return [
    'Sell, share, or transfer my data',
    'Re-acquire my data from partners or data providers',
    'Contact me for marketing purposes',
  ]
}

export function buildDeletionResponseLine() {
  return 'Please confirm completion within 30 days by replying to this email.'
}

export function buildDeletionVerificationLine() {
  return 'If you need verification, tell me the minimum information specifically required to locate my records.'
}

export function buildDefaultDeletionRequestBlock() {
  const requestItems = buildDeletionRequestItems()
    .map((item, index) => `${index + 1}. ${item}`)
    .join('\n')
  const optOutItems = buildDeletionOptOutItems()
    .map((item) => `- ${item}`)
    .join('\n')

  return `${requestItems}\n\nI am opting out of any sale or sharing of my personal information. Do not:\n${optOutItems}\n\nRESPONSE:\n${buildDeletionResponseLine()}\n\n${buildDeletionVerificationLine()}`
}

export function buildDeletionReferenceLine(referenceId?: string) {
  const formatted = formatReference(referenceId)
  return formatted ? `Reference: ${formatted}` : null
}

export function buildDeletionBody(
  broker: Broker,
  profile: UserProfile,
  referenceId?: string,
  template?: Partial<DeletionTemplateContent>,
) {
  const referenceLine = buildDeletionReferenceLine(referenceId)
  const intro = normalizeTemplateBlock(template?.intro ?? buildDeletionIntro())
  const requestBlock = normalizeTemplateBlock(
    template?.requestBlock ?? buildDefaultDeletionRequestBlock(),
  )
  const signOff = normalizeTemplateBlock(template?.signOff ?? profile.fullName)

  return `To ${broker.name} Privacy/Compliance Team,\n\n${intro}\n\nIDENTITY FOR LOOKUP:\n- Name: ${profile.fullName}\n- Email: ${profile.email}\n- Location: ${buildDeletionLocation(profile)}\n\nWHAT I'M REQUESTING:\n${requestBlock}${referenceLine ? `\n\n${referenceLine}` : ''}\n\n${signOff}\n`
}
