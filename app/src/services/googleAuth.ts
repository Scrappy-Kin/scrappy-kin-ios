import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { getEncrypted, removeEncrypted, setEncrypted } from './secureStore'
import { OAUTH_TIMEOUT_MS } from '../config/constants'
import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce'
import { getGoogleOAuthConfig } from '../config/oauth'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const SCOPE = 'https://www.googleapis.com/auth/gmail.send'

const TOKEN_KEY = 'gmail_tokens'
const OAUTH_PENDING_KEY = 'gmail_oauth_pending'
const OAUTH_PENDING_TTL_MS = 10 * 60 * 1000
let oauthInFlight = false

type TokenPayload = {
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

// Never log pending OAuth payloads.
type PendingOAuthPayload = {
  verifier: string
  state: string
  createdAt: number
  attemptId: string
}

async function storeTokens(payload: TokenPayload) {
  await setEncrypted<TokenPayload>(TOKEN_KEY, payload)
}

export async function clearStaleOAuthState() {
  const pending = await getEncrypted<PendingOAuthPayload>(OAUTH_PENDING_KEY)
  if (!pending) return
  if (!pending.createdAt || Date.now() - pending.createdAt > OAUTH_PENDING_TTL_MS) {
    await removeEncrypted(OAUTH_PENDING_KEY)
  }
}

async function waitForOAuthRedirect(state: string, redirectUri: string) {
  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      Browser.close().catch(() => undefined)
      reject(new Error('OAuth timed out. Please try again.'))
    }, OAUTH_TIMEOUT_MS)

    let resolved = false
    let appHandler: PluginListenerHandle | null = null
    let browserHandler: PluginListenerHandle | null = null
    const expectedUrl = new URL(redirectUri)

    const cleanup = () => {
      clearTimeout(timeout)
      appHandler?.remove()
      browserHandler?.remove()
    }

    const fail = (error: Error) => {
      if (resolved) return
      resolved = true
      cleanup()
      Browser.close().catch(() => undefined)
      reject(error)
    }

    const succeed = (code: string) => {
      if (resolved) return
      resolved = true
      cleanup()
      resolve(code)
    }

    const setupListener = async () => {
      appHandler = await App.addListener('appUrlOpen', (data) => {
        if (!data?.url) {
          return
        }
        let url: URL
        try {
          url = new URL(data.url)
        } catch {
          return
        }
        if (url.protocol !== expectedUrl.protocol || url.pathname !== expectedUrl.pathname) {
          return
        }
        const oauthError = url.searchParams.get('error')
        if (oauthError) {
          fail(new Error('OAuth failed. Please try again.'))
          return
        }
        const code = url.searchParams.get('code')
        const returnedState = url.searchParams.get('state')
        if (!code || !returnedState) return
        if (returnedState !== state) {
          fail(new Error('OAuth state mismatch. Please try again.'))
          return
        }
        Browser.close().catch(() => undefined)
        succeed(code)
      })
      browserHandler = await Browser.addListener('browserFinished', () => {
        fail(new Error('Sign-in was canceled. Please try again.'))
      })
    }

    setupListener().catch((error) => fail(error as Error))
  })
}

export async function connectGmail() {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Gmail connection requires the native iOS app.')
  }
  if (oauthInFlight) {
    throw new Error('Sign-in already in progress.')
  }

  oauthInFlight = true
  const oauthConfig = await getGoogleOAuthConfig()
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = generateState()
  const attemptId = generateState()

  try {
    await clearStaleOAuthState()
    await setEncrypted<PendingOAuthPayload>(OAUTH_PENDING_KEY, {
      verifier,
      state,
      createdAt: Date.now(),
      attemptId,
    })

    const authParams = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
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

    const code = await waitForOAuthRedirect(state, oauthConfig.redirectUri)

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
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
  } finally {
    oauthInFlight = false
    await removeEncrypted(OAUTH_PENDING_KEY)
  }
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
  const oauthConfig = await getGoogleOAuthConfig()
  const tokenParams = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: oauthConfig.clientId,
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
