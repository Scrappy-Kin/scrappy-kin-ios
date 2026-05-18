import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'

const KEY_NAME = 'scrappy_kin_master_key'
const STORE_PREFIX = 'sk_store:'
const WEB_KEY_STORAGE = `${STORE_PREFIX}${KEY_NAME}`
const NATIVE_READ_TIMEOUT_MS = 2500

function isMissingSecureStorageItem(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const normalized = message.toLowerCase()
  return (
    normalized.includes('item with given key does not exist') ||
    normalized.includes('could not be found') ||
    normalized.includes('does not exist') ||
    normalized.includes('not found')
  )
}

function toBase64(data: Uint8Array) {
  return btoa(String.fromCharCode(...data))
}

function fromBase64(data: string) {
  return Uint8Array.from(atob(data), (char) => char.charCodeAt(0))
}

function withNativeReadTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('Secure storage read timed out.'))
    }, NATIVE_READ_TIMEOUT_MS)

    promise
      .then(resolve, reject)
      .finally(() => window.clearTimeout(timeout))
  })
}

async function getStoredMasterKey() {
  if (Capacitor.isNativePlatform()) {
    const existing = await withNativeReadTimeout(SecureStoragePlugin.get({ key: KEY_NAME }))
    return existing?.value ?? null
  }

  const existing = await Preferences.get({ key: WEB_KEY_STORAGE })
  return existing.value
}

async function setStoredMasterKey(value: string) {
  if (Capacitor.isNativePlatform()) {
    await SecureStoragePlugin.set({ key: KEY_NAME, value })
    return
  }

  await Preferences.set({ key: WEB_KEY_STORAGE, value })
}

async function removeStoredMasterKey() {
  if (Capacitor.isNativePlatform()) {
    await SecureStoragePlugin.remove({ key: KEY_NAME })
    return
  }

  await Preferences.remove({ key: WEB_KEY_STORAGE })
}

async function getOrCreateKeyBytes() {
  try {
    const existing = await getStoredMasterKey()
    if (existing) {
      return fromBase64(existing)
    }
  } catch {
    // Missing key: first run or cleared storage.
  }

  const keyBytes = crypto.getRandomValues(new Uint8Array(32))
  await setStoredMasterKey(toBase64(keyBytes))
  return keyBytes
}

async function importKey() {
  const keyBytes = await getOrCreateKeyBytes()
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function encryptJson(payload: unknown) {
  const key = await importKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(payload))
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  return {
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(cipherBuffer)),
  }
}

async function decryptJson<T>(ciphertext?: string, iv?: string): Promise<T | null> {
  if (!ciphertext || !iv) return null
  const key = await importKey()
  const cipherBytes = fromBase64(ciphertext)
  const ivBytes = fromBase64(iv)
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    cipherBytes,
  )
  const decoded = new TextDecoder().decode(plainBuffer)
  return JSON.parse(decoded) as T
}

export async function setEncrypted<T>(key: string, value: T) {
  if (Capacitor.isNativePlatform()) {
    await SecureStoragePlugin.set({
      key: `${STORE_PREFIX}${key}`,
      value: JSON.stringify(value),
    })
    return
  }

  const encrypted = await encryptJson(value)
  await Preferences.set({
    key: `${STORE_PREFIX}${key}`,
    value: JSON.stringify(encrypted),
  })
}

export async function getEncrypted<T>(key: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      const stored = await withNativeReadTimeout(
        SecureStoragePlugin.get({ key: `${STORE_PREFIX}${key}` }),
      )
      if (!stored.value) return null
      return JSON.parse(stored.value) as T
    } catch (error) {
      if (isMissingSecureStorageItem(error) || error instanceof Error && error.message.includes('timed out')) {
        return null
      }
      throw error
    }
  }

  const stored = await Preferences.get({ key: `${STORE_PREFIX}${key}` })
  if (!stored.value) return null
  const parsed = JSON.parse(stored.value) as { ciphertext: string; iv: string }
  return decryptJson<T>(parsed.ciphertext, parsed.iv)
}

export async function removeEncrypted(key: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      await SecureStoragePlugin.remove({ key: `${STORE_PREFIX}${key}` })
    } catch (error) {
      if (!isMissingSecureStorageItem(error)) {
        throw error
      }
    }
    return
  }

  await Preferences.remove({ key: `${STORE_PREFIX}${key}` })
}

export async function wipeAllLocalData() {
  await Preferences.clear()
  if (Capacitor.isNativePlatform()) {
    await SecureStoragePlugin.clear()
    return
  }
  await removeStoredMasterKey()
}
