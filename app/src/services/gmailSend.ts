import { getAccessToken } from './googleAuth'

type SendEmailInput = {
  to: string
  subject: string
  body: string
  replyTo?: string
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
    throw new Error(`Gmail send failed (${response.status}).`)
  }

  return response.json()
}
