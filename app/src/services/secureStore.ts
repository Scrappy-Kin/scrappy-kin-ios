import { Preferences } from '@capacitor/preferences'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'

const KEY_NAME = 'scrappy_kin_master_key'
const STORE_PREFIX = 'sk_store:'

function toBase64(data: Uint8Array) {
  return btoa(String.fromCharCode(...data))
}

function fromBase64(data: string) {
  return Uint8Array.from(atob(data), (char) => char.charCodeAt(0))
}

async function getOrCreateKeyBytes() {
  const existing = await SecureStoragePlugin.get({ key: KEY_NAME })
  if (existing?.value) {
    return fromBase64(existing.value)
  }

  const keyBytes = crypto.getRandomValues(new Uint8Array(32))
  await SecureStoragePlugin.set({ key: KEY_NAME, value: toBase64(keyBytes) })
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
  const encrypted = await encryptJson(value)
  await Preferences.set({
    key: `${STORE_PREFIX}${key}`,
    value: JSON.stringify(encrypted),
  })
}

export async function getEncrypted<T>(key: string) {
  const stored = await Preferences.get({ key: `${STORE_PREFIX}${key}` })
  if (!stored.value) return null
  const parsed = JSON.parse(stored.value) as { ciphertext: string; iv: string }
  return decryptJson<T>(parsed.ciphertext, parsed.iv)
}

export async function removeEncrypted(key: string) {
  await Preferences.remove({ key: `${STORE_PREFIX}${key}` })
}

export async function wipeAllLocalData() {
  await Preferences.clear()
  await SecureStoragePlugin.remove({ key: KEY_NAME })
}
