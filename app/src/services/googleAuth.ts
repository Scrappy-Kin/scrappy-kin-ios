import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { getEncrypted, removeEncrypted, setEncrypted } from './secureStore'
import { OAUTH_TIMEOUT_MS } from '../config/constants'
import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce'

const CLIENT_ID =
  '304151210577-2hvg4113nd77cn8om3kppubqju7eu3sj.apps.googleusercontent.com'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const SCOPE = 'https://www.googleapis.com/auth/gmail.send'

const TOKEN_KEY = 'gmail_tokens'
const OAUTH_PENDING_KEY = 'gmail_oauth_pending'

type TokenPayload = {
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

async function storeTokens(payload: TokenPayload) {
  await setEncrypted<TokenPayload>(TOKEN_KEY, payload)
}

function getRedirectUri() {
  const id = CLIENT_ID.replace('.apps.googleusercontent.com', '')
  const scheme = `com.googleusercontent.apps.${id}`
  return `${scheme}:/oauthredirect`
}

async function waitForOAuthRedirect(state: string) {
  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('OAuth timed out. Please try again.'))
    }, OAUTH_TIMEOUT_MS)

    const handler = App.addListener('appUrlOpen', (data) => {
      if (!data?.url) {
        return
      }
      let url: URL
      try {
        url = new URL(data.url)
      } catch {
        return
      }
      const code = url.searchParams.get('code')
      const returnedState = url.searchParams.get('state')
      if (!code || !returnedState) return
      if (returnedState !== state) {
        clearTimeout(timeout)
        handler.remove()
        reject(new Error('OAuth state mismatch. Please try again.'))
        return
      }
      Browser.close().catch(() => undefined)
      clearTimeout(timeout)
      handler.remove()
      resolve(code)
    })
  })
}

export async function connectGmail() {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Gmail connection requires the native iOS app.')
  }

  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = generateState()

  await setEncrypted(OAUTH_PENDING_KEY, { verifier, state })

  const redirectUri = getRedirectUri()
  const authParams = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  const url = `${AUTH_URL}?${authParams.toString()}`

  await Browser.open({ url })

  const code = await waitForOAuthRedirect(state)

  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  })

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString(),
  })

  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status}).`)
  }

  const payload = (await response.json()) as {
    access_token: string
    refresh_token?: string
    expires_in?: number
  }

  const expiresAt = Date.now() + (payload.expires_in ?? 3600) * 1000

  await storeTokens({
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt,
  })

  await removeEncrypted(OAUTH_PENDING_KEY)
}

export async function disconnectGmail() {
  const tokens = await getEncrypted<TokenPayload>(TOKEN_KEY)
  const token = tokens?.refreshToken || tokens?.accessToken
  if (token) {
    await fetch(REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }).toString(),
    })
  }
  await removeEncrypted(TOKEN_KEY)
}

async function refreshAccessToken(refreshToken: string) {
  const tokenParams = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
  })

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString(),
  })

  if (!response.ok) {
    throw new Error(`Token refresh failed (${response.status}).`)
  }

  const payload = (await response.json()) as {
    access_token: string
    expires_in?: number
  }

  const expiresAt = Date.now() + (payload.expires_in ?? 3600) * 1000
  const tokens = await getEncrypted<TokenPayload>(TOKEN_KEY)
  if (!tokens?.refreshToken) {
    throw new Error('Missing refresh token.')
  }

  await storeTokens({
    accessToken: payload.access_token,
    refreshToken: tokens.refreshToken,
    expiresAt,
  })

  return payload.access_token
}

export async function getAccessToken() {
  const tokens = await getEncrypted<TokenPayload>(TOKEN_KEY)
  if (!tokens?.accessToken) {
    throw new Error('Gmail not connected.')
  }
  if (Date.now() < tokens.expiresAt) {
    return tokens.accessToken
  }
  if (!tokens.refreshToken) {
    throw new Error('Gmail session expired. Please reconnect.')
  }
  return refreshAccessToken(tokens.refreshToken)
}

export async function getGmailStatus() {
  try {
    await getAccessToken()
    return { connected: true }
  } catch {
    return { connected: false }
  }
}
