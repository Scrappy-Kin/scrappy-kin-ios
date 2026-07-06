import { Browser } from '@capacitor/browser'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'

let externalBrowserOpen = false
const externalBrowserListeners = new Set<() => void>()

function setExternalBrowserOpen(open: boolean) {
  if (externalBrowserOpen === open) return
  externalBrowserOpen = open
  for (const listener of externalBrowserListeners) {
    listener()
  }
}

export function getExternalBrowserOpenSnapshot() {
  return externalBrowserOpen
}

export function subscribeExternalBrowserOpen(listener: () => void) {
  externalBrowserListeners.add(listener)
  return () => {
    externalBrowserListeners.delete(listener)
  }
}

export async function openExternalUrl(url: string) {
  if (!Capacitor.isNativePlatform()) {
    await Browser.open({ url })
    return
  }

  let finishedHandler: PluginListenerHandle | null = null

  try {
    finishedHandler = await Browser.addListener('browserFinished', () => {
      setExternalBrowserOpen(false)
      finishedHandler?.remove()
      finishedHandler = null
    })
    setExternalBrowserOpen(true)
    await Browser.open({ url })
  } catch (error) {
    setExternalBrowserOpen(false)
    finishedHandler?.remove()
    throw error
  }
}
