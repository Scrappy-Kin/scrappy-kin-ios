import { getAccessToken } from './googleAuth'
import { isQaDeviceLane, isVerboseDevLane } from '../config/buildInfo'
import { isAppReviewSinkEmail } from '../config/appReviewTestRecipients'

type SendEmailInput = {
  to: string
  subject: string
  body: string
  replyTo?: string
  appReviewTestRecipients?: boolean
}

type GmailApiErrorPayload = {
  error?: {
    code?: number
    message?: string
    status?: string
    errors?: Array<{
      message?: string
      reason?: string
      domain?: string
    }>
  }
}

type GmailSendError = Error & {
  status?: number
  reason?: string
  detail?: string
}

function base64UrlEncode(text: string) {
  const bytes = new TextEncoder().encode(text)
  const binary = String.fromCharCode(...bytes)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function assertNoHeaderInjection(value: string | undefined, field: string) {
  if (value !== undefined && /[\r\n]/.test(value)) {
    throw new Error(`Gmail send blocked: illegal newline in ${field} header.`)
  }
}

function buildMimeMessage({ to, subject, body, replyTo }: SendEmailInput) {
  assertNoHeaderInjection(to, 'To')
  assertNoHeaderInjection(subject, 'Subject')
  assertNoHeaderInjection(replyTo, 'Reply-To')
  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=UTF-8',
  ]
  if (replyTo) {
    headers.push(`Reply-To: ${replyTo}`)
  }
  return `${headers.join('\r\n')}\r\n\r\n${body}`
}

export async function sendEmail(input: SendEmailInput) {
  assertNoHeaderInjection(input.to, 'To')
  assertNoHeaderInjection(input.subject, 'Subject')
  assertNoHeaderInjection(input.replyTo, 'Reply-To')

  if (input.appReviewTestRecipients && !isAppReviewSinkEmail(input.to)) {
    throw new Error('App Review test-recipient mode blocked a non-test broker recipient before Gmail send.')
  }

  if (isQaDeviceLane() && !isAppReviewSinkEmail(input.to)) {
    throw new Error('QADevice blocked a non-demo recipient before Gmail send. Use the App Review demo profile email for safe local sends.')
  }

  const token = await getAccessToken()
  const raw = base64UrlEncode(buildMimeMessage(input))

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  })

  if (!response.ok) {
    let detail = ''
    let reason = ''

    try {
      const payload = (await response.json()) as GmailApiErrorPayload
      reason = payload.error?.errors?.[0]?.reason ?? payload.error?.status ?? ''
      detail =
        payload.error?.message ??
        payload.error?.errors?.[0]?.message ??
        ''
    } catch {
      try {
        detail = await response.text()
      } catch {
        detail = ''
      }
    }

    const trimmedDetail = detail.trim()
    const trimmedReason = reason.trim()
    const baseMessage = `Gmail send failed (${response.status})`
    const isVerboseLane = await isVerboseDevLane()
    const debugSuffix =
      isVerboseLane && (trimmedReason || trimmedDetail)
        ? `: ${trimmedReason || trimmedDetail}${trimmedReason && trimmedDetail ? ` — ${trimmedDetail}` : ''}`
        : '.'
    const error = new Error(`${baseMessage}${debugSuffix}`) as GmailSendError
    error.status = response.status
    error.reason = trimmedReason || undefined
    error.detail = trimmedDetail || undefined
    throw error
  }

  return response.json() as Promise<{ id?: string; threadId?: string }>
}
