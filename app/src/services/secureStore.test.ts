import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: vi.fn(() => true) } }))
vi.mock('@capacitor/preferences', () => ({ Preferences: {
  clear: vi.fn(), keys: vi.fn(),
} }))
vi.mock('capacitor-secure-storage-plugin', () => ({ SecureStoragePlugin: {
  clear: vi.fn(), keys: vi.fn(),
} }))
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'
import { wipeAllLocalData } from './secureStore'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
  vi.mocked(Preferences.clear).mockResolvedValue(undefined)
  vi.mocked(Preferences.keys).mockResolvedValue({ keys: [] })
  vi.mocked(SecureStoragePlugin.clear).mockResolvedValue({ value: true })
  vi.mocked(SecureStoragePlugin.keys).mockResolvedValue({ value: [] })
})

describe('verified local wipe', () => {
  it('verifies both stores are empty', async () => {
    await wipeAllLocalData()
    expect(Preferences.keys).toHaveBeenCalledOnce()
    expect(SecureStoragePlugin.keys).toHaveBeenCalledOnce()
  })
  it('attempts Keychain clearing even if Preferences fails', async () => {
    vi.mocked(Preferences.clear).mockRejectedValue(new Error('preferences failure'))
    await expect(wipeAllLocalData()).rejects.toThrow('preferences failure')
    expect(SecureStoragePlugin.clear).toHaveBeenCalledOnce()
  })
  it('rejects a false native clear result', async () => {
    vi.mocked(SecureStoragePlugin.clear).mockResolvedValue({ value: false })
    await expect(wipeAllLocalData()).rejects.toThrow('Secure storage')
  })
  it('rejects surviving Keychain entries', async () => {
    vi.mocked(SecureStoragePlugin.keys).mockResolvedValue({ value: ['old-profile'] })
    await expect(wipeAllLocalData()).rejects.toThrow('Secure storage')
  })
  it('rejects surviving preferences', async () => {
    vi.mocked(Preferences.keys).mockResolvedValue({ keys: ['old-setting'] })
    await expect(wipeAllLocalData()).rejects.toThrow('Local preferences')
  })
  it('uses only Preferences on the web', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
    await wipeAllLocalData()
    expect(SecureStoragePlugin.clear).not.toHaveBeenCalled()
  })
})
