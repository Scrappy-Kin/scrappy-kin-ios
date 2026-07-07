import {
  APP_REVIEW_PROFILE_EMAILS,
  APP_REVIEW_TEST_RECIPIENT_EMAILS,
} from './appReviewTestRecipients.local'

export { APP_REVIEW_PROFILE_EMAILS, APP_REVIEW_TEST_RECIPIENT_EMAILS }

export const APP_REVIEW_PROFILE_EMAIL = APP_REVIEW_PROFILE_EMAILS[0]

const APP_REVIEW_PROFILE_EMAIL_SET = new Set<string>(
  APP_REVIEW_PROFILE_EMAILS.map(normalizeEmail),
)

const APP_REVIEW_TEST_RECIPIENT_EMAIL_SET = new Set<string>(
  APP_REVIEW_TEST_RECIPIENT_EMAILS.map(normalizeEmail),
)

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isAppReviewProfileEmail(email: string) {
  // App Review safety: this checks only the user-entered local profile email,
  // not the authenticated Gmail account or any OAuth identity. It exists so
  // Apple can test the real Gmail send flow without emailing live brokers.
  return APP_REVIEW_PROFILE_EMAIL_SET.has(normalizeEmail(email))
}

export function getAppReviewProfileEmailLabel() {
  return APP_REVIEW_PROFILE_EMAILS.join(' or ')
}

export function getAppReviewSinkEmail(index: number) {
  return APP_REVIEW_TEST_RECIPIENT_EMAILS[index % APP_REVIEW_TEST_RECIPIENT_EMAILS.length]
}

export function isAppReviewSinkEmail(email: string) {
  return APP_REVIEW_TEST_RECIPIENT_EMAIL_SET.has(normalizeEmail(email))
}
