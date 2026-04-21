export const QA_STOREKIT_SINK_EMAILS = [
  'testbot+testround-broker-a@scrappykin.com',
  'testbot+testround-broker-b@scrappykin.com',
  'testbot+testround-broker-c@scrappykin.com',
  'testbot+testround-broker-d@scrappykin.com',
  'testbot+testround-broker-e@scrappykin.com',
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
