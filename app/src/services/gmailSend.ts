import { getAccessToken } from './googleAuth'
import { isVerboseDevLane } from '../config/buildInfo'

type SendEmailInput = {
  to: string
  subject: string
  body: string
  replyTo?: string
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

function buildMimeMessage({ to, subject, body, replyTo }: SendEmailInput) {
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
