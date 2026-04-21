export const QA_STOREKIT_SINK_EMAILS = [
  'app-review-redacted-03@example.invalid',
  'app-review-redacted-04@example.invalid',
  'app-review-redacted-05@example.invalid',
  'app-review-redacted-06@example.invalid',
  'app-review-redacted-07@example.invalid',
] as const

export const QA_STOREKIT_SEND_NOTICE =
  'QA build: broker emails route to Scrappy Kin test inboxes.'

const QA_STOREKIT_SINK_EMAIL_SET = new Set<string>(QA_STOREKIT_SINK_EMAILS)

export function getQaStoreKitSinkEmail(index: number) {
  return QA_STOREKIT_SINK_EMAILS[index % QA_STOREKIT_SINK_EMAILS.length]
}

export function isQaStoreKitSinkEmail(email: string) {
  return QA_STOREKIT_SINK_EMAIL_SET.has(email.trim().toLowerCase())
}
