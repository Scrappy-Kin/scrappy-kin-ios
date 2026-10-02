import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }))
vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn() } }))
vi.mock('@capacitor/browser', () => ({ Browser: {
  open: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
} }))
vi.mock('./secureStore', () => ({
  getEncrypted: vi.fn(), removeEncrypted: vi.fn().mockResolvedValue(undefined),
  setEncrypted: vi.fn().mockResolvedValue(undefined), wipeAllLocalData: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('./logStore', () => ({ logEvent: vi.fn().mockResolvedValue(undefined) }))
vi.mock('./pkce', () => ({
  generateState: () => 'expected-state', generateCodeVerifier: () => 'verifier',
  generateCodeChallenge: async () => 'challenge',
}))
vi.mock('../config/oauth', () => ({ getGoogleOAuthConfig: async () => ({
  clientId: 'client', redirectUri: 'com.example:/oauth',
}) }))

import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { connectGmail, deleteAllLocalData, disconnectGmail } from './googleAuth'
import { getEncrypted, removeEncrypted, setEncrypted, wipeAllLocalData } from './secureStore'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getEncrypted).mockResolvedValue(null)
  vi.mocked(wipeAllLocalData).mockResolvedValue(undefined)
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('local deletion and Google revocation', () => {
  beforeEach(() => vi.mocked(getEncrypted).mockResolvedValue({ refreshToken: 'test-token' }))

  it.each(['offline', 'http-error'] as const)('deletes locally before %s revocation', async (failure) => {
    const fetchMock = vi.mocked(fetch).mockImplementation(async () => {
      expect(wipeAllLocalData).toHaveBeenCalledOnce()
      if (failure === 'offline') throw new TypeError('offline')
      return { ok: false } as Response
    })
    await expect(deleteAllLocalData()).resolves.toBe('unconfirmed')
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('bounds a hanging revocation even when fetch ignores abort', async () => {
    vi.useFakeTimers()
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))
    const result = deleteAllLocalData()
    await vi.advanceTimersByTimeAsync(5000)
    await expect(result).resolves.toBe('unconfirmed')
    expect(wipeAllLocalData).toHaveBeenCalledOnce()
    expect(vi.mocked(fetch).mock.calls[0][1]?.signal?.aborted).toBe(true)
  })

  it('still wipes when token lookup fails', async () => {
    vi.mocked(getEncrypted).mockRejectedValueOnce(new Error('storage unavailable'))
    await expect(deleteAllLocalData()).resolves.toBe('unconfirmed')
    expect(wipeAllLocalData).toHaveBeenCalledOnce()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('reports local failure and does not revoke as if deletion succeeded', async () => {
    vi.mocked(wipeAllLocalData).mockRejectedValueOnce(new Error('wipe failed'))
    await expect(deleteAllLocalData()).rejects.toThrow('wipe failed')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('reports successful revocation', async () => {
    await expect(deleteAllLocalData()).resolves.toBe('revoked')
  })

  it('skips revocation when no token exists', async () => {
    vi.mocked(getEncrypted).mockResolvedValue(null)
    await expect(deleteAllLocalData()).resolves.toBe('not-needed')
    expect(wipeAllLocalData).toHaveBeenCalledOnce()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('disconnects locally despite a revocation failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline'))
    await expect(disconnectGmail()).resolves.toBe('unconfirmed')
    expect(removeEncrypted).toHaveBeenCalledWith('gmail_tokens')
  })
})

describe('OAuth callback ownership', () => {
  async function beginConnection() {
    let callback: ((event: { url: string }) => void) | undefined
    vi.mocked(App.addListener).mockImplementation(async (_name, listener) => {
      callback = listener as unknown as typeof callback
      return { remove: vi.fn() }
    })
    const result = connectGmail()
    await vi.waitFor(() => expect(callback).toBeDefined())
    return { result, callback: callback! }
  }

  it('ignores missing and wrong state, then accepts the matching callback', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ access_token: 'new-token' }) } as Response)
    const { result, callback } = await beginConnection()
    for (const query of ['error=denied', 'error=denied&state=wrong', 'code=other&state=wrong']) {
      callback({ url: `com.example:/oauth?${query}` })
    }
    expect(Browser.close).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    callback({ url: 'com.example:/oauth?code=approved&state=expected-state' })
    await result
    expect(setEncrypted).toHaveBeenCalledWith('gmail_tokens', expect.objectContaining({ accessToken: 'new-token' }))
    expect(new URLSearchParams(String(vi.mocked(fetch).mock.calls[0][1]?.body)).get('code_verifier')).toBe('verifier')
  })

  it('ends the attempt on a matching Google error', async () => {
    const { result, callback } = await beginConnection()
    const rejected = expect(result).rejects.toThrow('Google sign-in didn’t finish')
    callback({ url: 'com.example:/oauth?error=denied&state=expected-state' })
    await rejected
    expect(fetch).not.toHaveBeenCalled()
  })
})
