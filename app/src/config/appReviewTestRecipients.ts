export const APP_REVIEW_PROFILE_EMAIL = 'app-review-redacted-02@example.invalid'

export const APP_REVIEW_TEST_RECIPIENT_EMAILS = [
  'app-review-redacted-03@example.invalid',
  'app-review-redacted-04@example.invalid',
  'app-review-redacted-05@example.invalid',
  'app-review-redacted-06@example.invalid',
  'app-review-redacted-07@example.invalid',
] as const

const APP_REVIEW_TEST_RECIPIENT_EMAIL_SET = new Set<string>(
  APP_REVIEW_TEST_RECIPIENT_EMAILS,
)

export function isAppReviewProfileEmail(email: string) {
  // App Review safety: this checks only the user-entered local profile email,
  // not the authenticated Gmail account or any OAuth identity. It exists so
  // Apple can test the real Gmail send flow without emailing live brokers.
  return email.trim().toLowerCase() === APP_REVIEW_PROFILE_EMAIL
}

export function getAppReviewSinkEmail(index: number) {
  return APP_REVIEW_TEST_RECIPIENT_EMAILS[index % APP_REVIEW_TEST_RECIPIENT_EMAILS.length]
}

export function isAppReviewSinkEmail(email: string) {
  return APP_REVIEW_TEST_RECIPIENT_EMAIL_SET.has(email.trim().toLowerCase())
}
