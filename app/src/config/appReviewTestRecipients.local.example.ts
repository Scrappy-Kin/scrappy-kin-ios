// Copy this file to appReviewTestRecipients.local.ts and replace every value
// from the secure launch/App Review handoff. The local file is git-ignored.

export const APP_REVIEW_PROFILE_EMAILS = [
  'app-review@example.invalid',
  'legacy-review-profile@example.invalid',
] as const

export const APP_REVIEW_TEST_RECIPIENT_EMAILS = [
  'app-review-test+broker-a@example.invalid',
  'app-review-test+broker-b@example.invalid',
  'app-review-test+broker-c@example.invalid',
  'app-review-test+broker-d@example.invalid',
  'app-review-test+broker-e@example.invalid',
] as const
