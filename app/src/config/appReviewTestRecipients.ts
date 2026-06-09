export const APP_REVIEW_PROFILE_EMAIL = 'scrappykin365@gmail.com'

export const APP_REVIEW_TEST_RECIPIENT_EMAILS = [
  'testbot+testround-broker-a@scrappykin.com',
  'testbot+testround-broker-b@scrappykin.com',
  'testbot+testround-broker-c@scrappykin.com',
  'testbot+testround-broker-d@scrappykin.com',
  'testbot+testround-broker-e@scrappykin.com',
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
